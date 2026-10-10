// Metas da temporada: no começo do ano o clube diz o que espera de você.
// São três: tempo de jogo, produção na sua posição e o objetivo do time.
// No fim da temporada, cada meta cumprida paga um bônus e agrada o técnico;
// meta perdida o deixa desconfiado.

import { clamp, money, plural } from '../core/utils.js';
import { getClub, getLeague, squadRating } from '../data/clubs.js';
import { getRole } from './transfers.js';
import { seasonRating } from './player.js';
import { COMPETITIONS, tablePosition } from './season.js';

// Quanto da liga cada função costuma jogar.
const PLAY_SHARE = { estrela: 0.85, titular: 0.8, rotacao: 0.55, promessa: 0.32 };

// O que se cobra de cada posição: gols, participações em gol, defesas ou
// nota média. rate = quanto por jogo, em média (calibrado em simulação).
const PRODUCTION = {
  ATA: { type: 'goals', rate: 0.42 },
  SA: { type: 'goals', rate: 0.36 },
  PON: { type: 'contributions', rate: 0.48 },
  MEI: { type: 'contributions', rate: 0.42 },
  MC: { type: 'contributions', rate: 0.28 },
  VOL: { type: 'rating', target: 6.4 },
  ZAG: { type: 'rating', target: 6.4 },
  LAT: { type: 'rating', target: 6.4 },
  GOL: { type: 'saves', rate: 0.95 },
};

const leagueGames = (season) => season.calendar.filter((week) => week.competition === COMPETITIONS.LEAGUE).length;

/** Posição esperada do clube na liga, pelo tamanho do elenco. */
function expectedRank(clubId, league) {
  const ratings = league.teams.map((team) => ({ id: team.id, rating: squadRating(team.id) })).sort((a, b) => b.rating - a.rating);
  return ratings.findIndex((team) => team.id === clubId) + 1;
}

const continentalName = (league) => (league.region === 'CONMEBOL' ? 'Libertadores' : league.region === 'UEFA' ? 'Champions League' : 'Copa Continental');

/** Cria as três metas do ano. */
export function createObjectives(player, season) {
  const league = getLeague(getClub(season.clubId)?.leagueId);
  const games = leagueGames(season);
  // Tempo de jogo, gols e defesas contam todos os jogos (liga e copas).
  const allGames = season.calendar.filter((week) => !week.cancelled).length;
  const role = getRole(player.contract?.role).id;
  const share = PLAY_SHARE[role] ?? 0.5;
  const expectedGames = games * share;
  // Quem é bem melhor que o elenco tem meta maior.
  const level = clamp(1 + (player.overall - squadRating(season.clubId)) / 25, 0.6, 1.5);
  const objectives = [];

  // 1. Tempo de jogo
  if (role === 'estrela' || role === 'titular') {
    const target = Math.max(3, Math.round(allGames * (role === 'estrela' ? 0.72 : 0.62)));
    objectives.push({ id: 'starts', type: 'starts', label: `Seja titular em ${plural(target, 'jogo', 'jogos')}`, target });
  } else {
    const target = Math.max(2, Math.round(allGames * (role === 'rotacao' ? 0.65 : 0.45)));
    objectives.push({ id: 'apps', type: 'apps', label: `Entre em campo em ${plural(target, 'jogo', 'jogos')}`, target });
  }

  // 2. Produção na sua posição
  const production = PRODUCTION[player.position] ?? PRODUCTION.MEI;
  if (production.type === 'rating') {
    const target = Math.round((production.target + (role === 'estrela' ? 0.1 : 0)) * 10) / 10;
    const minApps = Math.max(3, Math.round(expectedGames * 0.5));
    objectives.push({ id: 'rating', type: 'rating', label: `Termine com nota média de ${target.toFixed(1)} ou mais`, target, minApps });
  } else {
    const target = Math.max(2, Math.round(expectedGames * production.rate * level));
    const label = {
      goals: `Faça ${plural(target, 'gol', 'gols')}`,
      contributions: `Participe de ${target} gols (gols + assistências)`,
      saves: `Faça ${plural(target, 'defesa importante', 'defesas importantes')}`,
    }[production.type];
    objectives.push({ id: production.type, type: production.type, label, target });
  }

  // 3. Objetivo do time
  const teams = league.teams.length;
  const rank = expectedRank(season.clubId, league);
  const spots = league.continentalSpots ?? 0;
  let team;
  // Em liga pequena, fugir das 3 últimas pesaria demais: lá são só 2.
  const bottom = teams <= 10 ? 2 : 3;
  if (rank === 1) team = { label: 'Seja campeão da liga', target: 1 };
  else if (spots && rank <= spots + 1) team = { label: `Classifique o time para a ${continentalName(league)} (top ${spots})`, target: spots };
  else if (rank <= Math.ceil(teams / 2)) team = { label: `Termine entre os ${Math.ceil(teams / 2)} primeiros`, target: Math.ceil(teams / 2) };
  else team = { label: `Fuja das ${bottom} últimas posições`, target: teams - bottom };
  objectives.push({ id: 'position', type: 'position', ...team });

  return objectives.map((objective) => ({ ...objective, reward: rewardFor(objective, player) }));
}

/** Bônus de cada meta cumprida (e o que custa perder). */
function rewardFor(objective, player) {
  const weekly = player.contract?.weeklySalary ?? 300;
  const personal = objective.type !== 'position';
  return {
    money: Math.round(weekly * (personal ? 4 : 3)),
    managerRelation: personal ? 4 : 5,
    happiness: 3,
    fame: objective.type === 'goals' || objective.type === 'contributions' ? 2 : 0,
    missManager: personal ? -2 : -3,
  };
}

/** Quanto falta para cada meta. done: true (cumprida), false (perdida) ou null (em aberto). */
export function objectiveProgress(objective, player, season, { final = false } = {}) {
  const stats = player.season;
  switch (objective.type) {
    case 'starts':
    case 'apps': {
      const current = stats[objective.type];
      return { current, target: objective.target, ratio: current / objective.target, text: `${current}/${objective.target}`, done: current >= objective.target ? true : final ? false : null };
    }
    case 'goals':
    case 'saves':
    case 'contributions': {
      const current = objective.type === 'contributions' ? stats.goals + stats.assists : stats[objective.type];
      return { current, target: objective.target, ratio: current / objective.target, text: `${current}/${objective.target}`, done: current >= objective.target ? true : final ? false : null };
    }
    case 'rating': {
      const current = seasonRating(stats);
      const enough = stats.apps >= objective.minApps;
      const okNow = enough && current >= objective.target;
      return {
        current,
        target: objective.target,
        ratio: current ? clamp((current - 5.5) / (objective.target - 5.5), 0, 1) : 0,
        text: current ? `${current.toFixed(2)} em ${plural(stats.apps, 'jogo', 'jogos')}${enough ? '' : ` (mínimo ${objective.minApps})`}` : 'sem jogos ainda',
        done: final ? okNow : null,
      };
    }
    case 'position': {
      const played = season.table[season.clubId]?.played ?? 0;
      const position = played ? tablePosition(season.table, season.clubId) : null;
      const okNow = position !== null && position <= objective.target;
      return {
        current: position,
        target: objective.target,
        ratio: position ? clamp(objective.target / position, 0, 1) : 0,
        text: position ? (final ? `Terminou em ${position}º` : `${position}º lugar agora`) : 'a liga ainda não começou',
        done: final ? okNow : null,
      };
    }
    default:
      return { current: 0, target: 0, ratio: 0, text: '', done: null };
  }
}

/** Fecha as metas no fim da temporada: paga os bônus e mexe com o técnico. */
export function settleObjectives(player, season, adjustLife) {
  const results = (season.objectives ?? []).map((objective) => {
    const progress = objectiveProgress(objective, player, season, { final: true });
    const reward = objective.reward;
    if (progress.done) {
      player.money += reward.money;
      adjustLife(player, 'managerRelation', reward.managerRelation);
      adjustLife(player, 'happiness', reward.happiness);
      if (reward.fame) adjustLife(player, 'fame', reward.fame);
    } else {
      adjustLife(player, 'managerRelation', reward.missManager);
    }
    return { ...objective, achieved: Boolean(progress.done), progress: progress.text };
  });
  const achieved = results.filter((result) => result.achieved).length;
  const verdict =
    !results.length
      ? ''
      : achieved === results.length
        ? 'O técnico está encantado: você cumpriu tudo o que o clube pediu.'
        : achieved === 0
          ? 'O técnico está desapontado: nenhuma meta foi cumprida.'
          : `O técnico reconhece o que deu certo, mas cobra o resto: ${achieved} de ${results.length} metas cumpridas.`;
  const bonus = results.filter((result) => result.achieved).reduce((sum, result) => sum + result.reward.money, 0);
  return { results, achieved, verdict, bonus, bonusText: bonus ? money(bonus) : '' };
}
