// Seleção nacional: convocações, amistosos e torneios.

import { clamp } from '../core/utils.js';
import { getNation } from '../data/nations.js';
import { getLeague, getClub } from '../data/clubs.js';
import { isGoalkeeper } from '../data/positions.js';
import { adjustLife, hasFlag } from './player.js';

export const CALL_UP = {
  NONE: 'none',
  YOUTH: 'sub20',
  MAIN: 'principal',
};

/** Overall mínimo para entrar na seleção principal daquele país. */
export function mainSquadRequirement(nationId) {
  const nation = getNation(nationId);
  return Math.round(50 + nation.strength * 0.33);
}

/** Avalia se o jogador é convocado nesta temporada. */
export function evaluateCallUp(player, { seasonRatingValue = 6.5, rng }) {
  const nationId = hasFlag(player, 'trocou_selecao') ? player.nationality : player.nationality;
  const requirement = mainSquadRequirement(nationId);
  const league = getLeague(getClub(player.club)?.leagueId);
  const visibility = (league?.reputation ?? 40) * 0.06 + player.life.reputation * 0.05 + player.life.fame * 0.04;
  const form = (seasonRatingValue - 6.5) * 4;
  const scandal = hasFlag(player, 'doping') || hasFlag(player, 'investigado') ? -15 : 0;
  const score = player.overall + visibility + form + scandal;

  if (score >= requirement) return CALL_UP.MAIN;
  if (player.age <= 20 && score >= requirement - 13) return CALL_UP.YOUTH;
  if (player.age <= 23 && score >= requirement - 6 && rng.chance(0.4)) return CALL_UP.MAIN;
  return CALL_UP.NONE;
}

const TOURNAMENTS = {
  UEFA: 'Eurocopa',
  CONMEBOL: 'Copa América',
  CONCACAF: 'Copa Ouro',
  AFC: 'Copa da Ásia',
};

function tournamentForYear(year, nationId) {
  const nation = getNation(nationId);
  const league = getLeague(nation.league);
  const region = league?.region ?? 'UEFA';
  if (year % 4 === 2) return { name: 'Copa do Mundo', weight: 1.6 };
  if (year % 4 === 0) return { name: TOURNAMENTS[region] ?? 'Copa Continental', weight: 1 };
  return null;
}

const STAGES = ['Fase de grupos', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Vice-campeão', 'CAMPEÃO'];

/** Simula a temporada de seleção: amistosos, eliminatórias e torneio. */
export function playNationalSeason(player, { year, seasonRatingValue, rng }) {
  const status = evaluateCallUp(player, { seasonRatingValue, rng });
  player.national.status = status;

  if (status === CALL_UP.NONE) {
    return { status, caps: 0, goals: 0, tournament: null, trophy: null, text: 'Sem convocação nesta temporada.' };
  }

  const isMain = status === CALL_UP.MAIN;
  player.national.callUps += 1;

  const starterChance = clamp((player.overall - mainSquadRequirement(player.nationality)) / 14 + 0.5, 0.15, 0.95);
  const caps = isMain ? rng.int(2, 7) : rng.int(1, 4);
  const starts = Math.round(caps * starterChance);

  let goals = 0;
  if (!isGoalkeeper(player.position)) {
    const attackBias = { ATA: 0.45, SA: 0.38, PON: 0.3, MEI: 0.26, MC: 0.14, VOL: 0.06, LAT: 0.06, ZAG: 0.05 }[player.position] ?? 0.1;
    for (let i = 0; i < starts; i += 1) {
      if (rng.chance(attackBias * clamp(player.overall / 80, 0.5, 1.4))) goals += 1;
    }
  }

  player.national.caps += caps;
  player.national.goals += goals;
  player.career.totals.nationalCaps += caps;
  player.career.totals.nationalGoals += goals;

  adjustLife(player, 'fame', isMain ? 6 : 2);
  adjustLife(player, 'reputation', isMain ? 4 : 1);

  let tournament = null;
  let trophy = null;
  const event = isMain ? tournamentForYear(year, player.nationality) : null;
  if (event) {
    const nation = getNation(player.nationality);
    const strengthScore = nation.strength + (player.overall - 75) * 0.25 + rng.normal(0, 9);
    let stageIndex = 0;
    if (strengthScore > 72) stageIndex = 1;
    if (strengthScore > 80) stageIndex = 2;
    if (strengthScore > 87) stageIndex = 3;
    if (strengthScore > 93) stageIndex = 4;
    if (strengthScore > 98) stageIndex = 5;

    tournament = { name: event.name, result: STAGES[stageIndex] };
    const extraCaps = stageIndex + 3;
    player.national.caps += extraCaps;
    player.career.totals.nationalCaps += extraCaps;

    if (stageIndex === 5) {
      trophy = { name: `${event.name} (${getNation(player.nationality).name})`, type: 'selecao', year };
      player.career.trophies.push(trophy);
      adjustLife(player, 'fame', 18);
      adjustLife(player, 'reputation', 15);
      adjustLife(player, 'happiness', 25);
    }
  }

  const label = isMain ? 'seleção principal' : 'seleção sub-20';
  return {
    status,
    caps,
    goals,
    starts,
    tournament,
    trophy,
    text: `Convocado para a ${label}: ${caps} jogos e ${goals} gol(s).`,
  };
}
