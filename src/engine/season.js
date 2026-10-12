// Temporada: calendário, tabela, copas e resumo final.

import { clamp } from '../core/utils.js';
import { getClub, getLeague, LEAGUES, squadRating } from '../data/clubs.js';
import { REGIONAL_LEAGUES, regionalCupFor } from '../data/regional.js';
import { simulateWithoutPlayer } from './match.js';

export const COMPETITIONS = {
  LEAGUE: 'liga',
  CUP: 'copa',
  CONTINENTAL: 'continental',
  STATE: 'estadual',
  LEAGUE_CUP: 'copa_liga',
  FREE: 'livre',
  FRIENDLY: 'amistoso',
  NATIONAL: 'selecao',
};

const CUP_STAGES = ['Segunda fase', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'FINAL'];
const CONTINENTAL_STAGES = ['Fase de grupos', 'Fase de grupos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'FINAL'];
const LEAGUE_CUP_STAGES = ['Primeira fase', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'FINAL'];
// Estadual e copa regional: quatro rodadas de grupo, depois mata-mata.
const REGIONAL_STAGES = ['1ª rodada', '2ª rodada', '3ª rodada', '4ª rodada', 'Quartas de final', 'Semifinal', 'FINAL'];
const REGIONAL_KNOCKOUT_FROM = 4;

const STAGES = {
  [COMPETITIONS.CUP]: CUP_STAGES,
  [COMPETITIONS.CONTINENTAL]: CONTINENTAL_STAGES,
  [COMPETITIONS.LEAGUE_CUP]: LEAGUE_CUP_STAGES,
  [COMPETITIONS.STATE]: REGIONAL_STAGES,
};

// A temporada tem de 36 a 38 semanas. O que sobra depois dos jogos vira
// pré-temporada (até 3 semanas, no começo) e datas Fifa (no meio do ano).
export const SEASON_WEEKS = [36, 38];
const PRESEASON_MAX = 3;

const FREE_WEEKS = {
  pre: { label: 'Pré-temporada', text: 'O elenco se reapresenta: treino forte e nenhum jogo oficial ainda.' },
  fifa: { label: 'Data Fifa', text: 'Pausa no calendário para as seleções. Semana só de treino.' },
  folga: { label: 'Rodada de folga', text: 'Seu time folga nesta rodada; os outros jogam.' },
  livre: { label: 'Semana livre', text: 'Sem jogo nesta semana: o time caiu na copa que teria jogo agora.' },
};

/** Uma semana sem jogo seu (treino e vida normais). */
const freeWeek = (kind, extra = {}) => ({
  competition: COMPETITIONS.FREE,
  competitionName: FREE_WEEKS[kind].label,
  stage: FREE_WEEKS[kind].label,
  free: true,
  kind,
  ...extra,
});

export const freeWeekText = (week) => FREE_WEEKS[week?.kind]?.text ?? FREE_WEEKS.livre.text;

/** Gera o calendário de pontos corridos (turno e returno). */
export function roundRobin(teamIds) {
  const teams = [...teamIds];
  if (teams.length % 2 === 1) teams.push(null);
  const size = teams.length;
  const firstHalf = [];

  for (let roundIndex = 0; roundIndex < size - 1; roundIndex += 1) {
    const pairs = [];
    for (let i = 0; i < size / 2; i += 1) {
      const home = teams[i];
      const away = teams[size - 1 - i];
      if (home && away) {
        pairs.push(roundIndex % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    firstHalf.push(pairs);
    teams.splice(1, 0, teams.pop());
  }

  const secondHalf = firstHalf.map((round) => round.map(([home, away]) => [away, home]));
  return [...firstHalf, ...secondHalf];
}

function emptyRow(clubId) {
  return { clubId, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

export function createTable(leagueId) {
  const league = getLeague(leagueId);
  const table = {};
  for (const team of league.teams) table[team.id] = emptyRow(team.id);
  return table;
}

export function applyResult(table, homeId, awayId, homeGoals, awayGoals) {
  const home = table[homeId];
  const away = table[awayId];
  if (!home || !away) return;
  home.played += 1;
  away.played += 1;
  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;
  if (homeGoals > awayGoals) {
    home.wins += 1;
    home.points += 3;
    away.losses += 1;
  } else if (homeGoals < awayGoals) {
    away.wins += 1;
    away.points += 3;
    home.losses += 1;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
  }
}

export function standings(table) {
  return Object.values(table)
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        (getClub(a.clubId)?.name ?? '').localeCompare(getClub(b.clubId)?.name ?? ''),
    );
}

export function tablePosition(table, clubId) {
  const index = standings(table).findIndex((row) => row.clubId === clubId);
  return index >= 0 ? index + 1 : null;
}

/** Sorteia um adversário de copa: mesmo país, força proporcional à fase. */
function drawCupOpponent(clubId, stageIndex, rng, pool = null) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  // Copa de base: só times de base do país. Copa dos profissionais: todas as divisões.
  const candidates = (pool ?? LEAGUES.filter((other) => other.nation === league.nation && Boolean(other.youth) === Boolean(league.youth)).flatMap((other) => other.teams))
    .filter((team) => team.id !== clubId);
  if (!candidates.length) return clubId;
  // Fases avançadas tendem a trazer adversários mais fortes.
  const prestiges = candidates.map((team) => team.prestige);
  const low = Math.min(...prestiges);
  const high = Math.max(...prestiges);
  const target = low + ((high - low) * (stageIndex + 1)) / 5;
  return rng.weighted(candidates, (team) => 1 + Math.max(0, 40 - Math.abs(team.prestige - target) * 2)).id;
}

/** Os jogos de liga, com 2, 3 ou 4 turnos (o mesmo adversário mais vezes). */
function leagueRounds(teamIds, turns) {
  const twoTurns = roundRobin(teamIds);
  const half = twoTurns.length / 2;
  const rounds = [];
  for (let turn = 0; turn < turns; turn += 1) rounds.push(...twoTurns.slice(turn % 2 === 0 ? 0 : half, turn % 2 === 0 ? half : twoTurns.length));
  return rounds;
}

/** Sorteia adversário continental dentro da mesma confederação. */
function drawContinentalOpponent(clubId, stageIndex, rng) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const region = league.region;
  const pool = LEAGUES.filter((other) => other.region === region && !other.youth)
    .flatMap((other) => other.teams)
    .filter((team) => team.id !== clubId && team.prestige >= 55 + stageIndex * 5);
  if (!pool.length) return drawCupOpponent(clubId, stageIndex, rng);
  return rng.pick(pool).id;
}

/**
 * Monta o calendário da temporada (36 a 38 semanas): pré-temporada, estadual
 * (Série B e C), liga com 2 a 4 turnos, copa nacional, copa da liga e torneio
 * continental espalhados pelo ano, e datas Fifa onde sobrar semana.
 */
export function buildCalendar({ clubId, rng, continental = false }) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const teamIds = league.teams.map((team) => team.id);

  // Liga: rodada em que o seu time folga vira semana livre (os outros jogam).
  const leagueWeeks = leagueRounds(teamIds, league.turns ?? 2).map((pairs, index) => {
    const base = { round: index + 1, fixtures: pairs };
    const match = pairs.find(([home, away]) => home === clubId || away === clubId);
    if (!match) return freeWeek('folga', base);
    const [home, away] = match;
    return {
      ...base,
      competition: COMPETITIONS.LEAGUE,
      competitionName: league.name,
      stage: `${index + 1}ª rodada`,
      opponentId: home === clubId ? away : home,
      isHome: home === clubId,
    };
  });

  const stageWeeks = (competition, name, stages, { from = 0, knockoutFrom = 0, pool = null } = {}) =>
    stages.slice(from).map((stage, offset) => {
      const stageIndex = from + offset;
      const opponentId =
        competition === COMPETITIONS.CONTINENTAL ? drawContinentalOpponent(clubId, stageIndex, rng) : drawCupOpponent(clubId, stageIndex, rng, pool);
      return { competition, competitionName: name, stage, stageIndex, knockout: stageIndex >= knockoutFrom, opponentId, isHome: rng.chance(0.5) };
    });

  // Estadual ou copa regional, no começo do ano (Série B e C).
  const regional = REGIONAL_LEAGUES.has(league.id) ? regionalCupFor(clubId) : null;
  const regionalWeeks = regional
    ? stageWeeks(COMPETITIONS.STATE, regional.name, REGIONAL_STAGES, {
        knockoutFrom: REGIONAL_KNOCKOUT_FROM,
        pool: regional.clubs.map((id) => getClub(id)).filter(Boolean),
      })
    : [];

  // Copas espalhadas pelo ano. Quem joga o continental entra na copa nas oitavas.
  const cups = [
    stageWeeks(COMPETITIONS.CUP, league.cupName, CUP_STAGES, { from: continental ? 1 : 0, pool: league.youth ? league.teams : null }),
    league.leagueCup ? stageWeeks(COMPETITIONS.LEAGUE_CUP, league.leagueCup, LEAGUE_CUP_STAGES, { pool: league.teams }) : [],
    continental ? stageWeeks(COMPETITIONS.CONTINENTAL, continentalName(league), CONTINENTAL_STAGES, { knockoutFrom: 2 }) : [],
  ];

  // O que faltar para a temporada chegar a 36-38 semanas: pré-temporada e datas Fifa.
  const busy = leagueWeeks.length + regionalWeeks.length + cups.reduce((sum, list) => sum + list.length, 0);
  const spare = Math.max(0, rng.int(SEASON_WEEKS[0], SEASON_WEEKS[1]) - busy);
  const preseason = Math.min(spare, rng.int(1, PRESEASON_MAX));
  const fifa = Array.from({ length: spare - preseason }, () => freeWeek('fifa'));

  // Cada copa (e as datas Fifa) se espalha ao longo da liga: a fase k de n
  // entra depois de (k + 1) / (n + 1) das rodadas. Finais ficam para o fim.
  const inserts = [...cups, fifa].flatMap((list, group) =>
    list.map((week, index) => ({ week, at: (index + 1) / (list.length + 1) + group * 0.004 })),
  ).sort((a, b) => a.at - b.at);
  const middle = [];
  leagueWeeks.forEach((week, index) => {
    middle.push(week);
    while (inserts.length && inserts[0].at <= (index + 1) / leagueWeeks.length) middle.push(inserts.shift().week);
  });
  middle.push(...inserts.map((item) => item.week));

  const calendar = [...Array.from({ length: preseason }, () => freeWeek('pre')), ...regionalWeeks, ...middle];
  return calendar.map((week, index) => ({ ...week, week: index + 1, played: false }));
}

const continentalName = (league) => (league.region === 'CONMEBOL' ? 'Libertadores' : league.region === 'UEFA' ? 'Champions League' : 'Copa Continental');

export function createSeason({ year, clubId, rng, continental = false }) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const calendar = buildCalendar({ clubId, rng, continental });
  const season = {
    year,
    clubId,
    leagueId: league.id,
    continental,
    calendar,
    weekIndex: 0,
    table: createTable(league.id),
    cup: { alive: true, stage: 0, winner: false, name: league.cupName },
    continentalRun: { alive: continental, stage: 0, winner: false },
    // Estadual e copa da liga (quando o clube joga).
    runs: {},
    news: [],
    results: [],
    trainingUsed: false,
    eventUsed: false,
  };
  for (const week of calendar) {
    if (week.competition === COMPETITIONS.STATE || week.competition === COMPETITIONS.LEAGUE_CUP) {
      season.runs[week.competition] ??= { alive: true, stage: 0, winner: false, name: week.competitionName };
    }
  }
  return season;
}

export const currentWeek = (season) => season.calendar[season.weekIndex] ?? null;

export const seasonFinished = (season) => season.weekIndex >= season.calendar.length;

/** Simula as outras partidas da rodada da liga (também na sua folga) para manter a tabela viva. */
export function simulateOtherFixtures(season, week, rng) {
  if (!week.fixtures) return;
  for (const [home, away] of week.fixtures) {
    if (home === season.clubId || away === season.clubId) continue;
    const result = simulateWithoutPlayer({ clubId: home, opponentId: away, isHome: true, rng });
    applyResult(season.table, home, away, result.team, result.opponent);
  }
}

/** A campanha numa copa (copa nacional, continental, estadual ou copa da liga). */
function runFor(season, competition) {
  if (competition === COMPETITIONS.CUP) return season.cup;
  if (competition === COMPETITIONS.CONTINENTAL) return season.continentalRun;
  return season.runs?.[competition] ?? null;
}

/** Avança a eliminatória de copa conforme o resultado. */
export function updateKnockout(season, week, won) {
  const run = runFor(season, week.competition);
  if (!run) return;
  run.stage = (week.stageIndex ?? 0) + 1;
  if (!won && week.knockout) {
    run.alive = false;
    // Os jogos que sobrariam viram semanas livres: a temporada não encurta.
    season.calendar = season.calendar.map((item) =>
      item.competition === week.competition && item.week > week.week ? { ...freeWeek('livre'), week: item.week, played: false } : item,
    );
  } else if (week.stage === 'FINAL' && won) {
    run.winner = true;
  }
}

/** Troféus conquistados na temporada. */
export function seasonTrophies(season) {
  const trophies = [];
  const league = getLeague(season.leagueId);
  const position = tablePosition(season.table, season.clubId);
  if (position === 1) trophies.push({ name: league.name, type: 'liga', year: season.year });
  if (season.cup.winner) trophies.push({ name: season.cup.name ?? league.cupName, type: league.youth ? 'copa_base' : 'copa', year: season.year });
  for (const [competition, run] of Object.entries(season.runs ?? {})) {
    if (run.winner) trophies.push({ name: run.name, type: competition, year: season.year });
  }
  if (season.continentalRun.winner) {
    const name = league.region === 'CONMEBOL' ? 'Libertadores' : league.region === 'UEFA' ? 'Champions League' : 'Copa Continental';
    trophies.push({ name, type: 'continental', year: season.year });
  }
  return trophies;
}

/** O clube se classifica para o torneio continental do ano seguinte? */
export function qualifiesForContinental(season) {
  const league = getLeague(season.leagueId);
  const spots = league.continentalSpots ?? 0;
  if (!spots) return false;
  const position = tablePosition(season.table, season.clubId);
  return Boolean(position && position <= spots) || season.cup.winner;
}

/** Nível médio dos adversários enfrentados, usado no cálculo de evolução. */
export function seasonDifficulty(season) {
  const played = season.results ?? [];
  if (!played.length) return getLeague(season.leagueId)?.level ?? 60;
  return played.reduce((acc, result) => acc + squadRating(result.opponentId), 0) / played.length;
}

/** Posição final e resumo textual da campanha. */
export function seasonSummary(season) {
  const league = getLeague(season.leagueId);
  const position = tablePosition(season.table, season.clubId);
  const rows = standings(season.table);
  const row = rows.find((item) => item.clubId === season.clubId);
  return {
    year: season.year,
    label: seasonLabel(season.year, season.leagueId),
    leagueName: league.name,
    clubId: season.clubId,
    clubName: getClub(season.clubId)?.name ?? '',
    position,
    teams: rows.length,
    continentalSpots: league.continentalSpots ?? 0,
    points: row?.points ?? 0,
    record: row ? `${row.wins}V ${row.draws}E ${row.losses}D` : '',
    trophies: seasonTrophies(season),
    cupName: season.cup.name ?? league.cupName,
    cupStage: season.cup.winner ? 'Campeão' : CUP_STAGES[clamp(season.cup.stage - 1, 0, CUP_STAGES.length - 1)],
    // Estadual e copa da liga: até onde o time foi.
    otherCups: Object.entries(season.runs ?? {}).map(([competition, run]) => ({
      name: run.name,
      stage: run.winner ? 'Campeão' : STAGES[competition][clamp(run.stage - 1, 0, STAGES[competition].length - 1)],
    })),
    continental: season.continental
      ? season.continentalRun.winner
        ? 'Campeão'
        : CONTINENTAL_STAGES[clamp(season.continentalRun.stage - 1, 0, CONTINENTAL_STAGES.length - 1)]
      : null,
  };
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Mês e ano de uma semana da temporada (cada semana é uma semana de verdade). */
export function weekDate(season, weekIndex = season.weekIndex) {
  const [month, day] = getLeague(season.leagueId)?.seasonStart ?? [7, 4];
  const date = new Date(Date.UTC(season.year, month, day + weekIndex * 7));
  return { month: MONTHS[date.getUTCMonth()], year: date.getUTCFullYear() };
}

/** "2027" nas ligas de ano-calendário (Brasil...) e "2027/28" nas de agosto a maio. */
export const seasonLabel = (year, leagueId) => (getLeague(leagueId)?.calendarYear ? `${year}` : `${year}/${String(year + 1).slice(2)}`);
