// Temporada: calendário, tabela, copas e resumo final.

import { clamp } from '../core/utils.js';
import { getClub, getLeague, LEAGUES, squadRating } from '../data/clubs.js';
import { simulateWithoutPlayer } from './match.js';

export const COMPETITIONS = {
  LEAGUE: 'liga',
  CUP: 'copa',
  CONTINENTAL: 'continental',
  FRIENDLY: 'amistoso',
  NATIONAL: 'selecao',
};

const CUP_STAGES = ['Segunda fase', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'FINAL'];
const CONTINENTAL_STAGES = ['Fase de grupos', 'Fase de grupos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'FINAL'];

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
function drawCupOpponent(clubId, stageIndex, rng) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const sameCountry = LEAGUES.filter((other) => other.nation === league.nation && !other.youth);
  const pool = sameCountry.flatMap((other) => other.teams).filter((team) => team.id !== clubId);
  if (!pool.length) return clubId;
  // Fases avançadas tendem a trazer adversários mais fortes.
  const bias = 30 + stageIndex * 12;
  return rng.weighted(pool, (team) => 1 + Math.max(0, 100 - Math.abs(team.prestige - bias - 20))).id;
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
 * Monta o calendário da temporada: liga (pontos corridos) + copa nacional
 * + torneio continental (se o clube estiver classificado).
 */
export function buildCalendar({ clubId, rng, continental = false }) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  const teamIds = league.teams.map((team) => team.id);
  const allRounds = roundRobin(teamIds);

  const leagueWeeks = [];
  allRounds.forEach((pairs, index) => {
    const match = pairs.find(([home, away]) => home === clubId || away === clubId);
    if (!match) return;
    const [home, away] = match;
    leagueWeeks.push({
      competition: COMPETITIONS.LEAGUE,
      competitionName: league.name,
      round: index + 1,
      stage: `${index + 1}ª rodada`,
      opponentId: home === clubId ? away : home,
      isHome: home === clubId,
      fixtures: pairs,
    });
  });

  const extras = [];
  if (!league.youth) {
    CUP_STAGES.forEach((stage, index) => {
      extras.push({
        competition: COMPETITIONS.CUP,
        competitionName: `Copa Nacional (${league.country})`,
        stage,
        stageIndex: index,
        knockout: true,
      });
    });
  }
  if (continental) {
    CONTINENTAL_STAGES.forEach((stage, index) => {
      extras.push({
        competition: COMPETITIONS.CONTINENTAL,
        competitionName: league.region === 'CONMEBOL' ? 'Libertadores' : league.region === 'UEFA' ? 'Champions League' : 'Copa Continental',
        stage,
        stageIndex: index,
        knockout: index >= 2,
      });
    });
  }

  // Intercala: a cada 3 rodadas de liga entra um jogo de copa.
  const calendar = [];
  let extraQueue = [...extras];
  leagueWeeks.forEach((week, index) => {
    calendar.push(week);
    if ((index + 1) % 3 === 0 && extraQueue.length) {
      const extra = extraQueue.shift();
      calendar.push({
        ...extra,
        opponentId: extra.competition === COMPETITIONS.CUP
          ? drawCupOpponent(clubId, extra.stageIndex, rng)
          : drawContinentalOpponent(clubId, extra.stageIndex, rng),
        isHome: rng.chance(0.5),
      });
    }
  });
  // Sobras vão para o fim da temporada (fases finais).
  for (const extra of extraQueue) {
    calendar.push({
      ...extra,
      opponentId: extra.competition === COMPETITIONS.CUP
        ? drawCupOpponent(clubId, extra.stageIndex, rng)
        : drawContinentalOpponent(clubId, extra.stageIndex, rng),
      isHome: rng.chance(0.5),
    });
  }

  return calendar.map((week, index) => ({ ...week, week: index + 1, played: false }));
}

export function createSeason({ year, clubId, rng, continental = false }) {
  const club = getClub(clubId);
  const league = getLeague(club.leagueId);
  return {
    year,
    clubId,
    leagueId: league.id,
    continental,
    calendar: buildCalendar({ clubId, rng, continental }),
    weekIndex: 0,
    table: createTable(league.id),
    cup: { alive: true, stage: 0, winner: false },
    continentalRun: { alive: continental, stage: 0, winner: false },
    news: [],
    results: [],
    trainingUsed: false,
    eventUsed: false,
  };
}

export const currentWeek = (season) => season.calendar[season.weekIndex] ?? null;

export const seasonFinished = (season) => season.weekIndex >= season.calendar.length;

/** Simula as outras partidas da rodada da liga para manter a tabela viva. */
export function simulateOtherFixtures(season, week, rng) {
  if (week.competition !== COMPETITIONS.LEAGUE || !week.fixtures) return;
  for (const [home, away] of week.fixtures) {
    if (home === season.clubId || away === season.clubId) continue;
    const result = simulateWithoutPlayer({ clubId: home, opponentId: away, isHome: true, rng });
    applyResult(season.table, home, away, result.team, result.opponent);
  }
}

/** Avança a eliminatória de copa conforme o resultado. */
export function updateKnockout(season, week, won) {
  if (week.competition === COMPETITIONS.CUP) {
    season.cup.stage = (week.stageIndex ?? 0) + 1;
    if (!won) {
      season.cup.alive = false;
      // Jogos futuros de copa deixam de existir.
      season.calendar = season.calendar.map((item) =>
        item.competition === COMPETITIONS.CUP && item.week > week.week ? { ...item, cancelled: true } : item,
      );
    } else if (week.stage === 'FINAL') {
      season.cup.winner = true;
    }
  }
  if (week.competition === COMPETITIONS.CONTINENTAL) {
    season.continentalRun.stage = (week.stageIndex ?? 0) + 1;
    if (!won && week.knockout) {
      season.continentalRun.alive = false;
      season.calendar = season.calendar.map((item) =>
        item.competition === COMPETITIONS.CONTINENTAL && item.week > week.week ? { ...item, cancelled: true } : item,
      );
    } else if (week.stage === 'FINAL' && won) {
      season.continentalRun.winner = true;
    }
  }
}

/** Troféus conquistados na temporada. */
export function seasonTrophies(season) {
  const trophies = [];
  const league = getLeague(season.leagueId);
  const position = tablePosition(season.table, season.clubId);
  if (position === 1) trophies.push({ name: league.name, type: 'liga', year: season.year });
  if (season.cup.winner) trophies.push({ name: `Copa Nacional (${league.country})`, type: 'copa', year: season.year });
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
    leagueName: league.name,
    clubId: season.clubId,
    clubName: getClub(season.clubId)?.name ?? '',
    position,
    teams: rows.length,
    points: row?.points ?? 0,
    record: row ? `${row.wins}V ${row.draws}E ${row.losses}D` : '',
    trophies: seasonTrophies(season),
    cupStage: season.cup.winner ? 'Campeão' : CUP_STAGES[clamp(season.cup.stage - 1, 0, CUP_STAGES.length - 1)],
    continental: season.continental
      ? season.continentalRun.winner
        ? 'Campeão'
        : CONTINENTAL_STAGES[clamp(season.continentalRun.stage - 1, 0, CONTINENTAL_STAGES.length - 1)]
      : null,
  };
}
