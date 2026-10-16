// Controlador central do jogo: guarda o estado, executa as ações e avisa a UI.

import { createRng } from './rng.js';
import { clamp, decimal, logistic, money, plural, round } from './utils.js';
import { getClub, getLeague, squadRating, youthLeagueFor } from '../data/clubs.js';
import { getNation } from '../data/nations.js';
import { rivalryBetween } from '../data/rivals.js';
import { createObjectives, settleObjectives } from '../engine/objectives.js';
import { LIFE_EVENTS } from '../data/lifeEvents.js';
import {
  adjustLife,
  createPlayer,
  careerTotals,
  emptySeasonStats,
  fillMissingAttributes,
  fullName,
  seasonRating,
} from '../engine/player.js';
import { playerOverall } from '../engine/overall.js';
import { applyTraining, spendSkillPoint } from '../engine/training.js';
import { recommendTraining } from '../engine/coach.js';
import { applyWeeklyItems, buyItem, dismissStaff, sellItem } from '../engine/shop.js';
import { drawLifeEvent, resolveLifeOption, weeklyDrift, lifeContext, availableOptions, DISCIPLINE_RISK, gainCharisma, seasonLeadership } from '../engine/life.js';
import {
  COMPETITIONS,
  applyResult,
  createSeason,
  currentWeek,
  qualifiesForContinental,
  seasonDifficulty,
  seasonFinished,
  seasonLabel,
  seasonSummary,
  simulateOtherFixtures,
  tablePosition,
  updateKnockout,
  weekDate,
} from '../engine/season.js';
import {
  PLAYER_ROLE,
  advance as advanceMatch,
  autoPlay,
  choose as chooseInMatch,
  createMatch,
  findMoment,
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
  agedOutOfYouth,
  firstProOffers,
  promotionOffer,
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
    fillMissingAttributes(this.state.player);
    // Save feito no fim de temporada, antes da marcação: o ano já está nos totais.
    if (this.state.screen === SCREENS.OFFSEASON && this.state.player?.season) this.state.player.season.counted = true;
    // Save de antes das metas: a temporada em andamento ganha as dela.
    if (this.state.season && this.state.player && !this.state.season.objectives) {
      this.state.season.objectives = createObjectives(this.state.player, this.state.season);
    }
    // Reconecta o lance pendente da partida com os dados estáticos.
    if (this.state.match?.pending?.id) {
      const moment = findMoment(this.state.match.pending.id);
      if (moment) this.state.match.pending.raw = moment;
      else this.state.match.pending = null;
    }
    // Save de antes da escalação divulgada: decide agora, antes do toque.
    this.ensureLineup();
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
      offers: generateTrialOffers(player, this.rng, { leagueId: youthLeagueFor(nation.league).id }),
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
    this.state.season.objectives = createObjectives(this.player, this.state.season);
    this.state.week = { step: WEEK_STEPS.TRAINING, trainingReport: null, eventId: null, eventResult: null, matchReport: null };
    this.state.offseason = null;
    const league = getLeague(this.season.leagueId);
    this.pushNews(`Temporada ${seasonLabel(year, league.id)} começa: ${league.name} com o ${getClub(this.player.club).name}.`, 'info', 'calendar-blank');
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

  /** O jogo desta semana (ou null numa semana sem jogo: pré-temporada, data Fifa, folga). */
  get currentMatch() {
    const week = this.currentFixture;
    return week && !week.free ? week : null;
  }

  /** O que pesa na escalação, em pontos (positivo ajuda). */
  lineupFactors(week) {
    const player = this.player;
    const role = getRole(player.contract?.role);
    const squad = squadRating(player.club);
    const average = seasonRating(player.season);
    const parts = {
      level: (player.overall - squad) * 1.1,
      contract: role.minutesBias * 9,
      manager: (player.life.managerRelation - 50) * 0.11,
      fitness: (player.life.fitness - 60) * 0.06,
      form: ((average || 6.4) - 6.4) * 4,
      rotation: [COMPETITIONS.CUP, COMPETITIONS.LEAGUE_CUP, COMPETITIONS.STATE].includes(week.competition) ? 3 : 0,
      // Indisciplina pesa na escalação.
      discipline: -Math.max(0, DISCIPLINE_RISK - player.life.discipline) * 0.13,
    };
    const score = Object.values(parts).reduce((sum, value) => sum + value, 0) - 5;
    return { score, parts, squad, average, role };
  }

  /** Define se você é titular, reserva ou fica no banco nesta partida. */
  decideRole(week) {
    const player = this.player;
    if (player.injury?.weeks > 0) return PLAYER_ROLE.OUT;
    if (player.suspension > 0) return PLAYER_ROLE.OUT;

    const { score } = this.lineupFactors(week);
    const starterChance = clamp(logistic(score, 0, 5.5), 0.03, 0.97);
    if (this.rng.chance(starterChance)) return PLAYER_ROLE.STARTER;
    if (this.rng.chance(0.55)) return PLAYER_ROLE.SUB;
    // Nos primeiros jogos num clube novo, o técnico quer ver você em campo.
    return player.debutGames > 0 ? PLAYER_ROLE.SUB : PLAYER_ROLE.BENCH;
  }

  /** Por que você não começa jogando, e o que muda isso. */
  lineupReason(week) {
    const player = this.player;
    const { parts, squad, average, role } = this.lineupFactors(week);
    // Contrato comparado com quem é da rotação; o resto, com o neutro.
    const weights = { ...parts, contract: parts.contract - 0.55 * 9, rotation: 0 };
    const [worst, value] = Object.entries(weights).sort((a, b) => a[1] - b[1])[0];
    const reasons = {
      level: [`Seu overall (${player.overall}) está abaixo do nível do elenco (${squad}).`, 'Subir atributos no treino é o caminho mais direto.'],
      contract: [`No contrato você é ${role.label.toLowerCase()}: quem chegou como titular tem a preferência.`, 'Boas notas quando entrar e um contrato melhor na próxima janela mudam isso.'],
      manager: [`A relação com o técnico está em ${Math.round(player.life.managerRelation)}.`, 'Notas boas e escolhas que agradem o técnico nos eventos ajudam.'],
      fitness: [`Você chega cansado, com forma ${Math.round(player.life.fitness)}.`, 'Descansar no treino da semana do jogo ajuda.'],
      form: [`Sua média na temporada está em ${decimal(average || 6.4, 1)}.`, 'Notas melhores quando entrar em campo pesam na escalação.'],
      discipline: ['A sua indisciplina pesa na escalação.', 'Ficar longe de confusão devolve a confiança do técnico.'],
    };
    if (value > -1 || !reasons[worst]) return { reason: 'O técnico preferiu outro jogador hoje.', tip: 'É rodízio: a próxima chance pode ser sua.' };
    const [reason, tip] = reasons[worst];
    return { reason, tip };
  }

  /**
   * Escalação do jogo da semana: o técnico divulga antes de você entrar em
   * campo, e ela não muda mais até o apito.
   */
  ensureLineup() {
    const week = this.currentMatch;
    if (!week || this.state.week.step !== WEEK_STEPS.MATCH || this.state.match) return null;
    if (this.state.week.lineup) return this.state.week.lineup;
    const player = this.player;
    const debut = player.debutGames > 0;
    const role = this.decideRole(week);
    const lineup = { role, debut };
    if (role === PLAYER_ROLE.SUB || role === PLAYER_ROLE.BENCH) Object.assign(lineup, this.lineupReason(week));
    if (role !== PLAYER_ROLE.OUT && debut) player.debutGames -= 1;
    this.state.week.lineup = lineup;
    return lineup;
  }

  chooseTraining(optionId) {
    if (this.state.week.step !== WEEK_STEPS.TRAINING) return null;
    const player = this.player;
    const effectiveId = player.injury?.weeks > 0 ? 'descanso' : optionId;
    const report = applyTraining(player, effectiveId, this.rng);
    player.overall = playerOverall(player);

    if (report.injury && !player.injury) {
      player.injury = { name: report.injury.name, weeks: report.injury.weeks };
      this.pushNews(`${report.injury.name} no treino: ${plural(report.injury.weeks, 'semana', 'semanas')} fora.`, 'bad', 'first-aid-kit');
    }
    this.state.week.trainingReport = report;
    this.advanceToLifeStep();
    return report;
  }

  skipTraining() {
    if (this.state.week.step !== WEEK_STEPS.TRAINING) return;
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
    this.ensureLineup();
    this.notify();
  }

  resolveEvent(optionIndex) {
    const eventId = this.state.week.eventId;
    if (!eventId || this.state.week.step !== WEEK_STEPS.LIFE) return null;
    const event = drawLifeEventById(eventId);
    if (!event) {
      this.state.week.step = WEEK_STEPS.MATCH;
      this.ensureLineup();
      this.notify();
      return null;
    }
    const result = resolveLifeOption(this.player, event, optionIndex, this.rng);
    this.player.overall = playerOverall(this.player);
    this.state.week.eventResult = { ...result, title: event.title, icon: event.icon };
    this.state.week.step = WEEK_STEPS.MATCH;
    if (result?.text) this.pushNews(result.text, 'info', event.icon);
    this.ensureLineup();
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
  /** Só na etapa da partida e sem jogo em andamento: um toque repetido não joga a mesma partida duas vezes. */
  canPlayMatch() {
    return this.state.week.step === WEEK_STEPS.MATCH && !this.state.match;
  }

  startMatch() {
    const week = this.currentMatch;
    if (!week || !this.canPlayMatch()) return null;
    const lineup = this.ensureLineup();
    const role = lineup.role;

    if (role === PLAYER_ROLE.OUT || role === PLAYER_ROLE.BENCH) {
      return this.resolveMatchWithoutPlaying(week, role);
    }

    const match = createMatch({
      player: this.player,
      clubId: this.player.club,
      opponentId: week.opponentId,
      competition: { id: week.competition, name: week.competitionName, stage: week.stage, knockout: Boolean(week.knockout) },
      isHome: week.isHome,
      role,
      rng: this.rng,
      round: week.week,
      derby: rivalryBetween(this.player.club, week.opponentId)?.name ?? null,
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
    const week = this.currentMatch;
    if (!week || !this.canPlayMatch()) return null;
    const lineup = this.ensureLineup();
    const role = lineup.role;
    if (role === PLAYER_ROLE.OUT || role === PLAYER_ROLE.BENCH) {
      return this.resolveMatchWithoutPlaying(week, role);
    }
    const match = createMatch({
      player: this.player,
      clubId: this.player.club,
      opponentId: week.opponentId,
      competition: { id: week.competition, name: week.competitionName, stage: week.stage, knockout: Boolean(week.knockout) },
      isHome: week.isHome,
      role,
      rng: this.rng,
      round: week.week,
      derby: rivalryBetween(this.player.club, week.opponentId)?.name ?? null,
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
    const lineup = this.state.week.lineup;

    this.player.season.benchedStreak += 1;
    if (role === PLAYER_ROLE.BENCH) adjustLife(this.player, 'happiness', -2);
    // Quem não entra em campo vai saindo dos holofotes (a fama não cai abaixo de 20).
    if (this.player.life.fame > 20) adjustLife(this.player, 'fame', -1);

    const report = {
      competition: { id: week.competition, name: week.competitionName, stage: week.stage, knockout: Boolean(week.knockout) },
      opponentName: getClub(week.opponentId)?.name ?? '',
      isHome: week.isHome,
      score: { team: result.team, opponent: result.opponent },
      result: won ? 'V' : result.team === result.opponent ? 'E' : 'D',
      rating: 0,
      didNotPlay: true,
      reason,
      ...(role === PLAYER_ROLE.BENCH && lineup?.reason ? { why: lineup.reason, tip: lineup.tip } : {}),
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
    const week = this.currentMatch;
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

    // Lances deste jogo ficam um pouco menos prováveis no próximo.
    player.recentMoments = [...(match.usedMomentIds ?? [])];

    // Vida
    // Um jogo inteiro custa 5 de forma (meio jogo, uns 3).
    adjustLife(player, 'fitness', -Math.round(report.minutesPlayed / 18));
    adjustLife(player, 'fame', report.stats.goals * 1.6 + (report.motm ? 2.5 : 0) + 0.3);
    adjustLife(player, 'morale', report.result === 'V' ? 2 : report.result === 'D' ? -2 : 0);
    adjustLife(player, 'fanRelation', (report.rating - 6.4) * 2.4 + report.stats.goals * 1.5);
    adjustLife(player, 'managerRelation', (report.rating - 6.5) * 2);
    adjustLife(player, 'happiness', (report.rating - 6.4) * 1.8 + (report.result === 'V' ? 2 : -1));
    adjustLife(player, 'reputation', report.motm ? 2 : report.rating >= 7.5 ? 1 : 0);
    for (const [key, value] of Object.entries(report.lifeDelta ?? {})) {
      if (key === 'charisma') gainCharisma(player, value);
      else adjustLife(player, key, value);
    }

    // Cartões e lesões
    if (report.stats.redCards) {
      player.suspension += this.rng.int(1, 3);
      adjustLife(player, 'discipline', -8);
      this.pushNews(`Expulso contra o ${report.opponentName}: ${plural(player.suspension, 'jogo', 'jogos')} de suspensão.`, 'bad', 'cards');
    } else if (report.stats.yellowCards) {
      adjustLife(player, 'discipline', -1);
    }
    if (report.injured) {
      const weeks = this.rng.int(1, 6);
      player.injury = { name: this.rng.pick(['Lesão muscular', 'Entorse', 'Contusão no joelho', 'Fratura no dedo do pé']), weeks };
      this.pushNews(`Você se lesionou contra o ${report.opponentName}: ${plural(weeks, 'semana', 'semanas')} fora.`, 'bad', 'first-aid-kit');
    }

    const bonus = matchBonus(player, report);
    if (bonus > 0) report.bonus = bonus;

    player.overall = playerOverall(player);

    // Clássico: a torcida cobra e comemora em dobro.
    const derby = match.derby;
    if (derby) {
      const won = report.result === 'V';
      const lost = report.result === 'D';
      adjustLife(player, 'fanRelation', won ? 4 + report.stats.goals * 2 : lost ? -4 : 0);
      adjustLife(player, 'happiness', won ? 3 : lost ? -3 : 0);
      if (report.stats.goals) adjustLife(player, 'fame', report.stats.goals);
      const record = (player.career.derbies ??= { won: 0, drawn: 0, lost: 0 });
      record[won ? 'won' : lost ? 'lost' : 'drawn'] += 1;
    }

    const score = `${report.score.team}x${report.score.opponent}`;
    const headline = report.didNotPlay
      ? report.reason
      : derby
        ? report.result === 'V'
          ? report.stats.goals
            ? `Você decidiu o ${derby}: ${score}, ${plural(report.stats.goals, 'gol seu', 'gols seus')}. A torcida não esquece.`
            : `Vitória no ${derby}: ${score}. Nota ${decimal(report.rating, 1)}.`
          : report.result === 'D'
            ? `Derrota no ${derby}: ${score}. A torcida cobra.`
            : `Empate no ${derby}: ${score}. Nota ${decimal(report.rating, 1)}.`
        : `${score} contra o ${report.opponentName}. Nota ${decimal(report.rating, 1)}${report.stats.goals ? `, ${plural(report.stats.goals, 'gol', 'gols')}` : ''}.`;
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
    if (this.state.week.step !== WEEK_STEPS.DONE) return;
    const season = this.season;
    const player = this.player;

    for (const note of weeklyDrift(player, this.rng)) this.pushNews(note.text, note.type, note.icon);
    applyWeeklyFinance(player);

    player.clock = (player.clock ?? 0) + 1;
    const gear = applyWeeklyItems(player, this.rng).effects;
    if (player.injury) {
      player.injury.weeks -= 1;
      if (gear.fasterHealing && player.injury.weeks > 0 && this.rng.chance(gear.fasterHealing)) player.injury.weeks -= 1;
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

  /** Semana sem partida (pré-temporada, data Fifa, folga). */
  skipFreeWeek() {
    if (this.state.week.step !== WEEK_STEPS.MATCH) return;
    const week = this.currentFixture;
    if (week?.free) {
      // Na rodada de folga, os outros times da liga jogam.
      simulateOtherFixtures(this.season, week, this.rng);
      week.played = true;
    }
    this.state.week.step = WEEK_STEPS.DONE;
    this.notify();
  }

  /** Simula a semana inteira de uma vez. */
  simulateWeek() {
    if (this.state.week.step === WEEK_STEPS.TRAINING) {
      // Simulando, você segue o preparador (o mesmo da tela de treino).
      const hasMatch = Boolean(this.currentMatch) && !(this.player.suspension > 0);
      this.chooseTraining(recommendTraining(this.player, { hasMatch }).best.id);
    }
    if (this.state.week.step === WEEK_STEPS.LIFE && this.state.week.eventId) {
      const event = this.currentEvent();
      const safest = event?.options?.[0]?.index ?? 0;
      this.resolveEvent(safest);
    }
    if (this.state.week.step === WEEK_STEPS.MATCH) {
      if (this.currentMatch) this.simulateMatch();
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
      const weight = MINOR_TROPHIES.has(trophy.type) ? 0.5 : 1;
      adjustLife(player, 'happiness', 12 * weight);
      adjustLife(player, 'fame', 8 * weight);
      adjustLife(player, 'reputation', 6 * weight);
    }

    const awards = evaluateAwards(player, { season, summary, rng: this.rng });
    const prize = seasonPrizeMoney(player, { summary });
    const national = playNationalSeason(player, { year: season.year, seasonRatingValue: rating || 6.4, rng: this.rng });
    const investments = settleInvestments(player, this.rng);
    const objectives = settleObjectives(player, season, adjustLife);
    if (objectives.results.length) {
      this.pushNews(`Metas da temporada: ${objectives.achieved} de ${objectives.results.length} cumpridas.${objectives.bonus ? ` Bônus de ${objectives.bonusText}.` : ''}`, objectives.achieved >= 2 ? 'good' : objectives.achieved ? 'info' : 'bad', 'target');
    }

    const growth = endOfSeasonGrowth(
      player,
      { minutes: player.season.minutes, rating: rating || 6.2, difficulty: seasonDifficulty(season) },
      this.rng,
    );
    const potentialChange = reviewPotential(player, { rating: rating || 6.2, minutes: player.season.minutes }, this.rng);
    if (potentialChange.change > 0) {
      this.pushNews(`Seu potencial subiu ${potentialChange.change}: ${potentialChange.reasons.join(' e ')}. O teto dos atributos acompanha.`, 'good', 'arrow-up');
    } else if (potentialChange.change < 0) {
      this.pushNews('Temporada muito abaixo: seu potencial caiu 1.', 'bad', 'arrow-down');
    }

    // Totais de carreira
    const totals = player.career.totals;
    totals.apps += player.season.apps;
    totals.minutes = (totals.minutes ?? Math.round((totals.apps - player.season.apps) * 65)) + player.season.minutes;
    totals.goals += player.season.goals;
    totals.assists += player.season.assists;
    totals.saves += player.season.saves;
    totals.cleanSheets += player.season.cleanSheets;
    totals.yellowCards += player.season.yellowCards;
    totals.redCards += player.season.redCards;
    totals.motm += player.season.motm;
    totals.ratingSum += player.season.ratingSum;
    totals.ratingCount += player.season.ratingCount;
    // A temporada encerrada continua na tela até a próxima começar, mas já
    // está nos totais: não pode ser somada de novo.
    player.season.counted = true;

    // Liderança: o carisma cresce com o tempo de campo.
    const leadership = seasonLeadership(player, { minutesBefore: totals.minutes - player.season.minutes, minutesAfter: totals.minutes });

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
    // Passou da idade da base: o contrato com o time Sub-20 acaba aqui.
    const agedOut = agedOutOfYouth(player);
    if (agedOut && player.contract) player.contract.years = 0;
    const contractExpired = (player.contract?.years ?? 0) <= 0;
    const offers = generateOffers(player, { seasonRatingValue: rating || 6.2, rng: this.rng });
    const promotion = promotionOffer(player, this.rng);
    if (promotion) offers.unshift(promotion);
    if (agedOut && !offers.length) offers.push(...firstProOffers(player, this.rng));
    const loans = player.season.apps < 8 && player.age <= 23 && !agedOut ? generateLoanOffers(player, { rng: this.rng }) : [];
    const renewal = contractExpired || player.flags.includes('segurou_renovacao') ? null : renewalOffer(player, this.rng);

    this.state.offseason = {
      year: season.year,
      summary,
      awards,
      prize,
      national,
      investments,
      objectives,
      growth,
      potentialChange,
      leadership,
      record,
      offers,
      loans,
      renewal,
      contractExpired,
      agedOut,
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
    } else if (offer.promotion) {
      this.pushNews(`Você subiu da base para o time profissional do ${offer.clubName}.`, 'good', 'arrow-up');
      adjustLife(this.player, 'fame', 3);
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
    // Quem passou da idade da base não pode ficar: vai para a melhor proposta.
    if (offseason.agedOut) {
      const best = offseason.offers[0];
      if (best) {
        this.acceptOffer(best.id);
        return;
      }
      const fallback = firstProOffers(this.player, this.rng, 1)[0];
      if (fallback) {
        signContract(this.player, fallback, { year: offseason.year + 1 });
        this.pushNews(`Fora da idade da base, você assina com o ${fallback.clubName}.`, 'info', 'handshake');
      }
      this.startNextSeason();
      return;
    }
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
  /** Compra um item, contrata alguém, vive uma experiência ou investe. */
  buyItem(itemId) {
    const result = buyItem(this.player, itemId, { rng: this.rng });
    if (result.ok) {
      const { item } = result;
      this.player.overall = playerOverall(this.player);
      const verb = { staff: 'Você contratou', experience: 'Você aproveitou', invest: 'Você investiu em' }[item.kind] ?? 'Você comprou';
      this.pushNews(`${verb}: ${item.label}.`, 'good', item.icon);
      if (result.mishap) this.pushNews(result.mishap, 'bad', 'warning');
      this.notify();
    }
    return result;
  }

  /** Vende uma posse ou resgata um investimento. */
  sellItem(itemId) {
    const result = sellItem(this.player, itemId);
    if (result.ok) {
      this.player.overall = playerOverall(this.player);
      const verb = result.item.kind === 'invest' ? 'Você resgatou' : 'Você vendeu';
      this.pushNews(`${verb}: ${result.item.label} (${money(result.value)}).`, 'info', result.item.icon);
      this.notify();
    }
    return result;
  }

  dismissStaff(itemId) {
    const result = dismissStaff(this.player, itemId);
    if (result.ok) {
      this.pushNews(`Você dispensou: ${result.item.label}.`, 'info', result.item.icon);
      this.notify();
    }
    return result;
  }

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
    // Aposentou no meio da temporada: os jogos dela entram no histórico.
    if (this.state.screen !== SCREENS.OFFSEASON && !player.season?.counted && player.season?.apps) {
      player.career.totals = careerTotals(player);
      player.season = emptySeasonStats();
    }
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
    const week = this.currentMatch;
    const free = this.currentFixture?.free ? this.currentFixture : null;
    const played = season ? (season.table[season.clubId]?.played ?? 0) : 0;
    const table = season && played > 0 ? tablePosition(season.table, season.clubId) : null;
    return {
      player,
      season,
      week,
      freeWeek: free,
      position: table,
      fixturePreview: week
        ? {
            competition: week.competitionName,
            stage: week.stage,
            opponent: getClub(week.opponentId)?.name ?? '',
            isHome: week.isHome,
            opponentRating: squadRating(week.opponentId),
            derby: rivalryBetween(player.club, week.opponentId)?.name ?? null,
          }
        : null,
      marketValue: marketValue(player),
      seasonRating: seasonRating(player.season),
      weeksLeft: season ? Math.max(0, season.calendar.filter((item) => !item.cancelled).length - season.weekIndex) : 0,
      date: season ? weekDate(season) : null,
    };
  }
}

// Títulos que valem metade da fama e da felicidade de uma liga ou copa nacional.
const MINOR_TROPHIES = new Set([COMPETITIONS.STATE, COMPETITIONS.LEAGUE_CUP, 'copa_base']);

const LIFE_EVENT_INDEX = new Map(LIFE_EVENTS.map((event) => [event.id, event]));

const drawLifeEventById = (id) => LIFE_EVENT_INDEX.get(id) ?? null;

export const game = new Game();
