// Controlador central do jogo: guarda o estado, executa as ações e avisa a UI.

import { createRng } from './rng.js';
import { clamp, logistic, round } from './utils.js';
import { getClub, getLeague, squadRating } from '../data/clubs.js';
import { getNation } from '../data/nations.js';
import { MOMENTS } from '../data/matchMoments.js';
import { LIFE_EVENTS } from '../data/lifeEvents.js';
import {
  adjustLife,
  createPlayer,
  emptySeasonStats,
  fullName,
  seasonRating,
} from '../engine/player.js';
import { playerOverall } from '../engine/overall.js';
import { applyTraining, spendSkillPoint } from '../engine/training.js';
import { drawLifeEvent, resolveLifeOption, weeklyDrift, lifeContext, availableOptions } from '../engine/life.js';
import {
  COMPETITIONS,
  applyResult,
  createSeason,
  currentWeek,
  qualifiesForContinental,
  seasonDifficulty,
  seasonFinished,
  seasonSummary,
  simulateOtherFixtures,
  tablePosition,
  updateKnockout,
} from '../engine/season.js';
import {
  PLAYER_ROLE,
  advance as advanceMatch,
  autoPlay,
  choose as chooseInMatch,
  createMatch,
  matchPreview,
  simulateWithoutPlayer,
} from '../engine/match.js';
import { endOfSeasonGrowth, legacyScore, legacyTier, reviewPotential, shouldForceRetirement } from '../engine/progression.js';
import {
  ROLES,
  generateLoanOffers,
  generateOffers,
  generateTrialOffers,
  getRole,
  marketValue,
  renewalOffer,
  signContract,
} from '../engine/transfers.js';
import { evaluateAwards, seasonPrizeMoney } from '../engine/awards.js';
import { applyWeeklyFinance, matchBonus, settleInvestments } from '../engine/finance.js';
import { playNationalSeason } from '../engine/national.js';

export const SCREENS = {
  AUTH: 'auth',
  CREATE: 'create',
  TRIALS: 'trials',
  HUB: 'hub',
  MATCH: 'match',
  OFFSEASON: 'offseason',
  RETIRED: 'retired',
};

export const WEEK_STEPS = {
  TRAINING: 'treino',
  LIFE: 'vida',
  MATCH: 'partida',
  DONE: 'fim',
};

const START_YEAR = 2026;
const SAVE_VERSION = 3;

export class Game {
  constructor() {
    this.listeners = new Set();
    this.state = this.emptyState();
    this.rng = createRng(Date.now());
  }

  emptyState() {
    return {
      version: SAVE_VERSION,
      screen: SCREENS.AUTH,
      seed: Date.now(),
      player: null,
      season: null,
      week: { step: WEEK_STEPS.TRAINING, trainingReport: null, eventId: null, eventResult: null, matchReport: null },
      match: null,
      news: [],
      offseason: null,
      trials: null,
      settings: { fastMode: false },
      updatedAt: Date.now(),
    };
  }

  // ------------------------------------------------------------- reatividade
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.state.updatedAt = Date.now();
    for (const listener of this.listeners) listener(this.state);
  }

  // ------------------------------------------------------------ persistência
  /** Estado pronto para JSON (sem referências a dados estáticos). */
  serialize() {
    const state = { ...this.state, seed: this.rng.seed };
    if (state.match?.pending) {
      state.match = { ...state.match, pending: { ...state.match.pending, raw: undefined } };
    }
    return JSON.parse(JSON.stringify(state));
  }

  load(saved) {
    if (!saved || typeof saved !== 'object') return false;
    if (saved.version !== SAVE_VERSION) {
      // Saves antigos são descartados em vez de quebrar o jogo.
      return false;
    }
    this.state = { ...this.emptyState(), ...saved };
    this.rng = createRng(saved.seed ?? Date.now());
    // Reconecta o lance pendente da partida com os dados estáticos.
    if (this.state.match?.pending?.id) {
      const moment = MOMENTS.find((item) => item.id === this.state.match.pending.id);
      if (moment) this.state.match.pending.raw = moment;
      else this.state.match.pending = null;
    }
    this.notify();
    return true;
  }

  reset() {
    this.state = this.emptyState();
    this.rng = createRng(Date.now());
    this.notify();
  }

  // ------------------------------------------------------------------ helpers
  get player() {
    return this.state.player;
  }

  get season() {
    return this.state.season;
  }

  pushNews(text, type = 'info', icon = null) {
    this.state.news.unshift({ text, type, icon, at: Date.now(), week: this.season?.weekIndex ?? 0, year: this.season?.year ?? null });
    this.state.news = this.state.news.slice(0, 60);
  }

  setScreen(screen) {
    this.state.screen = screen;
    this.notify();
  }

  // -------------------------------------------------------------- nova carreira
  startCreation() {
    this.state.screen = SCREENS.CREATE;
    this.notify();
  }

  createCareer(config) {
    const player = createPlayer(config, this.rng);
    this.state.player = player;
    this.state.news = [];
    const nation = getNation(player.nationality);
    this.state.trials = {
      offers: generateTrialOffers(player, this.rng, { nationLeagueId: nation.league === 'BRA1' ? 'BRA_BASE' : nation.league }),
      intro: `${fullName(player)}, ${player.age} anos, ${getNation(player.nationality).demonym}. Nenhum clube, nenhum contrato. Só vontade.`,
    };
    this.state.screen = SCREENS.TRIALS;
    this.pushNews(`${fullName(player)} começa a buscar uma chance no futebol profissional.`, 'info', 'user');
    this.notify();
    return player;
  }

  /** Aceita a peneira/contrato inicial e começa a primeira temporada. */
  acceptTrial(offerId) {
    const offer = this.state.trials?.offers.find((item) => item.id === offerId);
    if (!offer) return;
    signContract(this.player, offer, { year: START_YEAR });
    this.player.career.clubs = [offer.clubId];
    this.pushNews(`Contrato assinado com o ${offer.clubName}. A carreira começa agora.`, 'good', 'handshake');
    adjustLife(this.player, 'happiness', 10);
    this.state.trials = null;
    this.beginSeason(START_YEAR, false);
    this.state.screen = SCREENS.HUB;
    this.notify();
  }

  beginSeason(year, continental) {
    this.state.season = createSeason({ year, clubId: this.player.club, rng: this.rng, continental });
    this.player.season = emptySeasonStats();
    this.state.week = { step: WEEK_STEPS.TRAINING, trainingReport: null, eventId: null, eventResult: null, matchReport: null };
    this.state.offseason = null;
    const league = getLeague(this.season.leagueId);
    this.pushNews(`Temporada ${year}/${String(year + 1).slice(2)} começa: ${league.name} com o ${getClub(this.player.club).name}.`, 'info', 'calendar-blank');
  }

  // ------------------------------------------------------------- loop semanal
  get currentFixture() {
    const season = this.season;
    if (!season) return null;
    let week = currentWeek(season);
    // Pula jogos cancelados (eliminação em copa).
    while (week?.cancelled) {
      season.weekIndex += 1;
      week = currentWeek(season);
    }
    return week ?? null;
  }

  /** Define se você é titular, reserva ou fica no banco nesta partida. */
  decideRole(week) {
    const player = this.player;
    if (player.injury?.weeks > 0) return PLAYER_ROLE.OUT;
    if (player.suspension > 0) return PLAYER_ROLE.OUT;

    const role = getRole(player.contract?.role);
    const rating = squadRating(player.club);
    const form = (seasonRating(player.season) || 6.4) - 6.4;
    const rotation = week.competition === COMPETITIONS.CUP ? 3 : 0;
    const score =
      (player.overall - rating) * 1.1 +
      role.minutesBias * 9 +
      (player.life.managerRelation - 50) * 0.11 +
      (player.life.fitness - 60) * 0.06 +
      form * 4 +
      rotation -
      5;

    const starterChance = clamp(logistic(score, 0, 5.5), 0.03, 0.97);
    if (this.rng.chance(starterChance)) return PLAYER_ROLE.STARTER;
    if (this.rng.chance(0.55)) return PLAYER_ROLE.SUB;
    return PLAYER_ROLE.BENCH;
  }

  chooseTraining(optionId) {
    if (this.state.week.step !== WEEK_STEPS.TRAINING) return null;
    const player = this.player;
    const effectiveId = player.injury?.weeks > 0 ? 'descanso' : optionId;
    const report = applyTraining(player, effectiveId, this.rng);
    player.overall = playerOverall(player);

    if (report.injury && !player.injury) {
      player.injury = { name: report.injury.name, weeks: report.injury.weeks };
      this.pushNews(`${report.injury.name} no treino: ${report.injury.weeks} semana(s) fora.`, 'bad', 'first-aid-kit');
    }
    this.state.week.trainingReport = report;
    this.advanceToLifeStep();
    return report;
  }

  skipTraining() {
    this.state.week.trainingReport = null;
    this.advanceToLifeStep();
  }

  advanceToLifeStep() {
    this.state.week.step = WEEK_STEPS.LIFE;
    const chance = this.state.settings.fastMode ? 0.25 : 0.45;
    const event = this.rng.chance(chance) ? drawLifeEvent(this.player, this.season, this.rng) : null;
    this.state.week.eventId = event?.id ?? null;
    this.state.week.eventResult = null;
    if (!event) this.state.week.step = WEEK_STEPS.MATCH;
    this.notify();
  }

  resolveEvent(optionIndex) {
    const eventId = this.state.week.eventId;
    if (!eventId) return null;
    const event = drawLifeEventById(eventId);
    if (!event) {
      this.state.week.step = WEEK_STEPS.MATCH;
      this.notify();
      return null;
    }
    const result = resolveLifeOption(this.player, event, optionIndex, this.rng);
    this.player.overall = playerOverall(this.player);
    this.state.week.eventResult = { ...result, title: event.title, icon: event.icon };
    this.state.week.step = WEEK_STEPS.MATCH;
    if (result?.text) this.pushNews(result.text, 'info', event.icon);
    this.notify();
    return result;
  }

  /** Opções do evento atual já filtradas pelas condições. */
  currentEvent() {
    const eventId = this.state.week.eventId;
    if (!eventId) return null;
    const event = drawLifeEventById(eventId);
    if (!event) return null;
    const context = lifeContext(this.player, this.season);
    return { ...event, options: availableOptions(event, this.player, context) };
  }

  // ----------------------------------------------------------------- partida
  startMatch() {
    const week = this.currentFixture;
    if (!week) return null;
    const role = this.decideRole(week);

    if (role === PLAYER_ROLE.OUT || role === PLAYER_ROLE.BENCH) {
      return this.resolveMatchWithoutPlaying(week, role);
    }

    const match = createMatch({
      player: this.player,
      clubId: this.player.club,
      opponentId: week.opponentId,
      competition: { id: week.competition, name: week.competitionName, stage: week.stage },
      isHome: week.isHome,
      role,
      rng: this.rng,
      round: week.week,
    });
    this.state.match = match;
    this.state.screen = SCREENS.MATCH;
    advanceMatch(match, this.player, this.rng);
    this.notify();
    return match;
  }

  matchPreviewData() {
    return this.state.match ? matchPreview(this.state.match) : null;
  }

  matchAdvance() {
    const match = this.state.match;
    if (!match) return null;
    const step = advanceMatch(match, this.player, this.rng);
    if (step.type === 'finished') this.finishMatch();
    this.notify();
    return step;
  }

  matchChoose(optionIndex) {
    const match = this.state.match;
    if (!match?.pending) return null;
    const resolution = chooseInMatch(match, this.player, optionIndex, this.rng);
    this.notify();
    return resolution;
  }

  /** Termina automaticamente uma partida já em andamento. */
  autoFinishMatch() {
    const match = this.state.match;
    if (!match || match.finished) return null;
    autoPlay(match, this.player, this.rng);
    this.finishMatch();
    this.notify();
    return match.report;
  }

  /** Simula o jogo atual sem interação. */
  simulateMatch() {
    const week = this.currentFixture;
    if (!week) return null;
    const role = this.decideRole(week);
    if (role === PLAYER_ROLE.OUT || role === PLAYER_ROLE.BENCH) {
      return this.resolveMatchWithoutPlaying(week, role);
    }
    const match = createMatch({
      player: this.player,
      clubId: this.player.club,
      opponentId: week.opponentId,
      competition: { id: week.competition, name: week.competitionName, stage: week.stage },
      isHome: week.isHome,
      role,
      rng: this.rng,
      round: week.week,
    });
    this.state.match = match;
    autoPlay(match, this.player, this.rng);
    this.finishMatch();
    this.notify();
    return match.report;
  }

  resolveMatchWithoutPlaying(week, role) {
    const result = simulateWithoutPlayer({
      clubId: this.player.club,
      opponentId: week.opponentId,
      isHome: week.isHome,
      rng: this.rng,
    });
    const won = result.team > result.opponent;
    const reason =
      role === PLAYER_ROLE.OUT
        ? this.player.injury?.weeks > 0
          ? 'Você está no departamento médico.'
          : 'Você está suspenso.'
        : 'O técnico te deixou no banco e você não entrou.';

    this.player.season.benchedStreak += 1;
    if (role === PLAYER_ROLE.BENCH) adjustLife(this.player, 'happiness', -2);

    const report = {
      competition: { id: week.competition, name: week.competitionName, stage: week.stage },
      opponentName: getClub(week.opponentId)?.name ?? '',
      isHome: week.isHome,
      score: { team: result.team, opponent: result.opponent },
      result: won ? 'V' : result.team === result.opponent ? 'E' : 'D',
      rating: 0,
      didNotPlay: true,
      reason,
      minutesPlayed: 0,
      stats: { goals: 0, assists: 0, saves: 0, tackles: 0, shots: 0, yellowCards: 0, redCards: 0 },
      timeline: [{ minute: 0, text: reason, type: 'info' }],
      role,
    };

    this.applyWeekResult(week, report);
    this.state.week.matchReport = report;
    this.state.week.step = WEEK_STEPS.DONE;
    this.state.match = null;
    this.notify();
    return report;
  }

  finishMatch() {
    const match = this.state.match;
    const week = this.currentFixture;
    if (!match?.report || !week) return;
    const report = match.report;
    const player = this.player;

    // Estatísticas da temporada
    const stats = player.season;
    stats.apps += 1;
    if (report.role === PLAYER_ROLE.STARTER) stats.starts += 1;
    stats.minutes += report.minutesPlayed;
    stats.goals += report.stats.goals;
    stats.assists += report.stats.assists;
    stats.saves += report.stats.saves;
    stats.tackles += report.stats.tackles;
    stats.yellowCards += report.stats.yellowCards;
    stats.redCards += report.stats.redCards;
    if (report.cleanSheet) stats.cleanSheets += 1;
    if (report.motm) stats.motm += 1;
    stats.ratingSum += report.rating;
    stats.ratingCount += 1;
    stats.benchedStreak = 0;

    // Vida
    adjustLife(player, 'fitness', -Math.round(report.minutesPlayed / 14));
    adjustLife(player, 'fame', report.stats.goals * 1.6 + (report.motm ? 2.5 : 0) + 0.3);
    adjustLife(player, 'morale', report.result === 'V' ? 2 : report.result === 'D' ? -2 : 0);
    adjustLife(player, 'fanRelation', (report.rating - 6.4) * 2.4 + report.stats.goals * 1.5);
    adjustLife(player, 'managerRelation', (report.rating - 6.5) * 2);
    adjustLife(player, 'happiness', (report.rating - 6.4) * 1.8 + (report.result === 'V' ? 2 : -1));
    adjustLife(player, 'reputation', report.motm ? 2 : report.rating >= 7.5 ? 1 : 0);
    for (const [key, value] of Object.entries(report.lifeDelta ?? {})) adjustLife(player, key, value);

    // Cartões e lesões
    if (report.stats.redCards) {
      player.suspension += this.rng.int(1, 3);
      adjustLife(player, 'discipline', -8);
      this.pushNews(`Expulso contra o ${report.opponentName}: ${player.suspension} jogo(s) de suspensão.`, 'bad', 'cards');
    } else if (report.stats.yellowCards) {
      adjustLife(player, 'discipline', -1);
    }
    if (report.injured) {
      const weeks = this.rng.int(1, 6);
      player.injury = { name: this.rng.pick(['Lesão muscular', 'Entorse', 'Contusão no joelho', 'Fratura no dedo do pé']), weeks };
      this.pushNews(`Você se lesionou contra o ${report.opponentName}: ${weeks} semana(s) fora.`, 'bad', 'first-aid-kit');
    }

    const bonus = matchBonus(player, report);
    if (bonus > 0) report.bonus = bonus;

    player.overall = playerOverall(player);

    const headline = report.didNotPlay
      ? report.reason
      : `${report.score.team}x${report.score.opponent} contra o ${report.opponentName}. Nota ${report.rating}${report.stats.goals ? `, ${report.stats.goals} gol(s)` : ''}.`;
    this.pushNews(headline, report.result === 'V' ? 'good' : report.result === 'D' ? 'bad' : 'info', 'soccer-ball');

    this.applyWeekResult(week, report);
    this.state.week.matchReport = report;
    this.state.week.step = WEEK_STEPS.DONE;
    this.state.screen = SCREENS.HUB;
    this.state.match = null;
  }

  /** Lança o resultado na tabela/copa e simula o resto da rodada. */
  applyWeekResult(week, report) {
    const season = this.season;
    week.played = true;
    week.result = { team: report.score.team, opponent: report.score.opponent };

    if (week.competition === COMPETITIONS.LEAGUE) {
      const homeId = week.isHome ? season.clubId : week.opponentId;
      const awayId = week.isHome ? week.opponentId : season.clubId;
      const homeGoals = week.isHome ? report.score.team : report.score.opponent;
      const awayGoals = week.isHome ? report.score.opponent : report.score.team;
      applyResult(season.table, homeId, awayId, homeGoals, awayGoals);
      simulateOtherFixtures(season, week, this.rng);
    } else {
      // Mata-mata: empate é decidido nos pênaltis.
      let won = report.score.team > report.score.opponent;
      if (report.score.team === report.score.opponent) won = this.rng.chance(0.5);
      updateKnockout(season, week, won);
      if (!won && week.knockout) {
        this.pushNews(`Eliminado na ${week.stage} da ${week.competitionName}.`, 'bad', 'x');
      }
      if (won && week.stage === 'FINAL') {
        this.pushNews(`Campeão da ${week.competitionName}.`, 'good', 'trophy');
      }
    }

    season.results.push({
      week: week.week,
      competition: week.competition,
      opponentId: week.opponentId,
      score: { ...report.score },
      rating: report.rating,
      goals: report.stats.goals,
      assists: report.stats.assists,
      didNotPlay: Boolean(report.didNotPlay),
    });
  }

  /** Encerra a semana e vai para a próxima (ou para o fim da temporada). */
  advanceWeek() {
    const season = this.season;
    const player = this.player;

    weeklyDrift(player, this.rng);
    applyWeeklyFinance(player);

    if (player.injury) {
      player.injury.weeks -= 1;
      if (player.injury.weeks <= 0) {
        this.pushNews('Recuperado da lesão e liberado para treinar.', 'good', 'first-aid-kit');
        player.injury = null;
        adjustLife(player, 'fitness', -8);
      }
    }
    if (player.suspension > 0) player.suspension -= 1;

    season.weekIndex += 1;
    this.state.week = { step: WEEK_STEPS.TRAINING, trainingReport: null, eventId: null, eventResult: null, matchReport: null };

    if (seasonFinished(season) || !this.currentFixture) {
      this.endSeason();
    }
    this.notify();
  }

  /** Semana sem partida (data Fifa, folga). */
  skipFreeWeek() {
    this.state.week.step = WEEK_STEPS.DONE;
    this.notify();
  }

  /** Simula a semana inteira de uma vez. */
  simulateWeek() {
    if (this.state.week.step === WEEK_STEPS.TRAINING) {
      const fallback = this.player.injury?.weeks > 0 ? 'descanso' : 'tecnico';
      this.chooseTraining(fallback);
    }
    if (this.state.week.step === WEEK_STEPS.LIFE && this.state.week.eventId) {
      const event = this.currentEvent();
      const safest = event?.options?.[0]?.index ?? 0;
      this.resolveEvent(safest);
    }
    if (this.state.week.step === WEEK_STEPS.MATCH) {
      if (this.currentFixture) this.simulateMatch();
      else this.skipFreeWeek();
    }
    if (this.state.week.step === WEEK_STEPS.DONE) this.advanceWeek();
  }

  /** Simula várias semanas seguidas. */
  simulateWeeks(count = 4) {
    for (let i = 0; i < count; i += 1) {
      if (!this.season || this.state.screen === SCREENS.OFFSEASON || this.state.screen === SCREENS.RETIRED) break;
      this.simulateWeek();
    }
    this.notify();
  }

  simulateRestOfSeason() {
    let guard = 0;
    while (this.season && !seasonFinished(this.season) && guard < 80 && this.state.screen !== SCREENS.OFFSEASON) {
      guard += 1;
      this.simulateWeek();
    }
    this.notify();
  }

  // ------------------------------------------------------------- fim de ano
  endSeason() {
    const player = this.player;
    const season = this.season;
    const summary = seasonSummary(season);
    const rating = seasonRating(player.season);

    // Títulos
    for (const trophy of summary.trophies) {
      player.career.trophies.push(trophy);
      adjustLife(player, 'happiness', 12);
      adjustLife(player, 'fame', 8);
      adjustLife(player, 'reputation', 6);
    }

    const awards = evaluateAwards(player, { season, summary, rng: this.rng });
    const prize = seasonPrizeMoney(player, { summary });
    const national = playNationalSeason(player, { year: season.year, seasonRatingValue: rating || 6.4, rng: this.rng });
    const investments = settleInvestments(player, this.rng);

    const growth = endOfSeasonGrowth(
      player,
      { minutes: player.season.minutes, rating: rating || 6.2, difficulty: seasonDifficulty(season) },
      this.rng,
    );
    const potentialChange = reviewPotential(player, { rating: rating || 6.2, minutes: player.season.minutes }, this.rng);

    // Totais de carreira
    const totals = player.career.totals;
    totals.apps += player.season.apps;
    totals.goals += player.season.goals;
    totals.assists += player.season.assists;
    totals.saves += player.season.saves;
    totals.cleanSheets += player.season.cleanSheets;
    totals.yellowCards += player.season.yellowCards;
    totals.redCards += player.season.redCards;
    totals.motm += player.season.motm;
    totals.ratingSum += player.season.ratingSum;
    totals.ratingCount += player.season.ratingCount;

    const record = {
      year: season.year,
      clubId: season.clubId,
      clubName: summary.clubName,
      leagueName: summary.leagueName,
      position: summary.position,
      age: player.age,
      overallBefore: growth.before,
      overallAfter: growth.after,
      apps: player.season.apps,
      goals: player.season.goals,
      assists: player.season.assists,
      rating: round(rating, 2),
      motm: player.season.motm,
      trophies: summary.trophies.map((trophy) => trophy.name),
      awards: awards.map((award) => award.name),
      national: { caps: national.caps, goals: national.goals, status: national.status, tournament: national.tournament },
    };
    player.career.seasons.push(record);

    // Envelhecimento e contrato
    player.age += 1;
    if (player.contract) {
      player.contract.years -= 1;
      if (player.contract.loan) {
        const parent = player.contract.parentClub;
        if (parent) {
          player.club = parent;
          player.contract = {
            clubId: parent,
            weeklySalary: player.contract.weeklySalary,
            years: Math.max(1, player.contract.years),
            role: ROLES.ROTATION.id,
            releaseClause: 0,
            signedAt: season.year,
            loan: false,
            parentClub: null,
          };
          this.pushNews(`Fim do empréstimo: você retorna ao ${getClub(parent)?.name}.`, 'info', 'airplane-tilt');
        }
      }
    }
    adjustLife(player, 'fitness', 10);
    adjustLife(player, 'health', player.age > 32 ? -3 : 1);
    player.overall = playerOverall(player);

    const forcedRetirement = shouldForceRetirement(player);
    const contractExpired = (player.contract?.years ?? 0) <= 0;
    const offers = generateOffers(player, { seasonRatingValue: rating || 6.2, rng: this.rng });
    const loans = player.season.apps < 8 && player.age <= 23 ? generateLoanOffers(player, { rng: this.rng }) : [];
    const renewal = contractExpired || player.flags.includes('segurou_renovacao') ? null : renewalOffer(player, this.rng);

    this.state.offseason = {
      year: season.year,
      summary,
      awards,
      prize,
      national,
      investments,
      growth,
      potentialChange,
      record,
      offers,
      loans,
      renewal,
      contractExpired,
      forcedRetirement,
      freeAgent: contractExpired && !renewal,
      nextContinental: qualifiesForContinental(season),
      marketValue: marketValue(player),
    };

    if (player.career.seasons.length >= 3) player.hiddenPotentialKnown = true;

    this.pushNews(
      `Fim da temporada ${season.year}: ${summary.position ? `${summary.position}º lugar` : 'campanha encerrada'} na ${summary.leagueName}.`,
      'info',
    );

    this.state.screen = SCREENS.OFFSEASON;
    this.notify();
  }

  /** Aceita uma proposta no fim da temporada. */
  acceptOffer(offerId) {
    const offseason = this.state.offseason;
    if (!offseason) return;
    const pool = [...offseason.offers, ...offseason.loans, ...(offseason.renewal ? [offseason.renewal] : [])];
    const offer = pool.find((item) => item.id === offerId);
    if (!offer) return;

    const previous = getClub(this.player.club)?.name;
    signContract(this.player, offer, { year: offseason.year + 1 });
    adjustLife(this.player, 'happiness', 8);
    if (offer.renewal) {
      this.pushNews(`Renovação assinada com o ${offer.clubName}.`, 'good', 'handshake');
    } else if (offer.loan) {
      this.pushNews(`Emprestado ao ${offer.clubName} por uma temporada.`, 'info', 'airplane-tilt');
    } else {
      this.pushNews(`Transferência fechada: ${previous} para o ${offer.clubName}.`, 'good', 'airplane-tilt');
      adjustLife(this.player, 'fame', 5);
    }
    this.startNextSeason();
  }

  /** Fica no clube atual sem renovar. */
  stayAtClub() {
    const offseason = this.state.offseason;
    if (!offseason) return;
    if (offseason.contractExpired && !this.player.contract?.years) {
      // Sem contrato e sem proposta: aceita um vínculo modesto para seguir jogando.
      const fallback = renewalOffer(this.player, this.rng);
      if (fallback) {
        fallback.weeklySalary = Math.round(fallback.weeklySalary * 0.75);
        signContract(this.player, fallback, { year: offseason.year + 1 });
        this.pushNews(`Sem grandes propostas, você renovou em condições modestas com o ${fallback.clubName}.`, 'info', 'handshake');
      }
    } else {
      this.pushNews(`Você permanece no ${getClub(this.player.club)?.name}.`, 'info', 'house');
    }
    this.startNextSeason();
  }

  startNextSeason() {
    const offseason = this.state.offseason;
    const nextYear = (offseason?.year ?? START_YEAR) + 1;
    const sameClub = this.player.club === offseason?.summary.clubId;
    this.beginSeason(nextYear, sameClub ? offseason?.nextContinental ?? false : Boolean(getLeague(getClub(this.player.club)?.leagueId)?.continentalSpots) && this.player.overall > 70);
    this.state.offseason = null;
    this.state.screen = SCREENS.HUB;
    this.notify();
  }

  // -------------------------------------------------------------- evolução
  spendPoint(attributeId) {
    const result = spendSkillPoint(this.player, attributeId);
    if (result.ok) {
      this.player.overall = playerOverall(this.player);
      this.notify();
    }
    return result;
  }

  toggleFastMode() {
    this.state.settings.fastMode = !this.state.settings.fastMode;
    this.notify();
  }

  // --------------------------------------------------------------- carreira
  retire(forced = false) {
    const player = this.player;
    player.retired = true;
    player.legacy = legacyScore(player);
    player.retirementYear = this.state.offseason?.year ?? this.season?.year ?? null;
    this.state.screen = SCREENS.RETIRED;
    this.pushNews(
      forced ? 'Sua carreira chegou ao fim.' : `${fullName(player)} anuncia a aposentadoria.`,
      'info',
    );
    this.notify();
  }

  retirementSummary() {
    const player = this.player;
    const score = player.legacy || legacyScore(player);
    return { score, tier: legacyTier(score) };
  }

  /** Dados prontos para a interface do hub. */
  hubData() {
    const player = this.player;
    const season = this.season;
    const week = this.currentFixture;
    const played = season ? (season.table[season.clubId]?.played ?? 0) : 0;
    const table = season && played > 0 ? tablePosition(season.table, season.clubId) : null;
    return {
      player,
      season,
      week,
      position: table,
      fixturePreview: week
        ? {
            competition: week.competitionName,
            stage: week.stage,
            opponent: getClub(week.opponentId)?.name ?? '',
            isHome: week.isHome,
            opponentRating: squadRating(week.opponentId),
          }
        : null,
      marketValue: marketValue(player),
      seasonRating: seasonRating(player.season),
      weeksLeft: season ? Math.max(0, season.calendar.filter((item) => !item.cancelled).length - season.weekIndex) : 0,
    };
  }
}

const LIFE_EVENT_INDEX = new Map(LIFE_EVENTS.map((event) => [event.id, event]));

const drawLifeEventById = (id) => LIFE_EVENT_INDEX.get(id) ?? null;

export const game = new Game();
