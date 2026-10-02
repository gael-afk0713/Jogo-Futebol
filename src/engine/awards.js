// Premiações individuais de fim de temporada.

import { clamp } from '../core/utils.js';
import { getLeague } from '../data/clubs.js';
import { isGoalkeeper } from '../data/positions.js';
import { adjustLife, seasonRating } from './player.js';

/** Gols esperados do artilheiro de uma liga, usado como referência. */
function topScorerBar(league) {
  return Math.round(9 + (league?.level ?? 60) * 0.09);
}

/**
 * Avalia todas as premiações da temporada.
 * Retorna a lista de prêmios conquistados.
 */
export function evaluateAwards(player, { season, summary, rng }) {
  const league = getLeague(season.leagueId);
  const stats = player.season;
  const rating = seasonRating(stats);
  const awards = [];
  const attacking = ['ATA', 'SA', 'PON', 'MEI'].includes(player.position);
  const topFour = summary.position && summary.position <= 4;

  const push = (name, icon, weight) => {
    const award = { name, icon, year: season.year, weight };
    awards.push(award);
    player.career.awards.push(award);
  };

  // Artilharia
  if (!isGoalkeeper(player.position)) {
    const bar = topScorerBar(league);
    if (stats.goals >= bar && rng.chance(clamp(0.45 + (stats.goals - bar) * 0.07, 0.3, 0.95))) {
      push(`Artilheiro da ${league.name}`, '👟', 3);
    }
  }

  // Melhor jogador da liga
  if (rating >= 7.25 && stats.apps >= 18 && topFour && rng.chance(clamp((rating - 7.1) * 1.6, 0.2, 0.85))) {
    push(`Melhor jogador da ${league.name}`, '🏅', 4);
  }

  // Seleção do campeonato
  if (rating >= 6.95 && stats.apps >= 16 && rng.chance(0.55)) {
    push(`Seleção da ${league.name}`, '⭐', 2);
  }

  // Revelação
  if (player.age <= 21 && rating >= 6.75 && stats.apps >= 14 && rng.chance(0.6)) {
    push('Revelação da temporada', '🌱', 2);
  }

  // Luva de ouro
  if (isGoalkeeper(player.position) && stats.cleanSheets >= 10 && rng.chance(0.6)) {
    push(`Luva de Ouro da ${league.name}`, '🧤', 3);
  }

  // Golden Boy (sub-21 mundial)
  if (
    player.age <= 21 &&
    player.overall >= 78 &&
    rating >= 7.05 &&
    (league?.reputation ?? 0) >= 70 &&
    rng.chance(0.35)
  ) {
    push('Golden Boy', '🥇', 6);
  }

  // Bola de Ouro
  const continentalRun = summary.continental === 'Campeão';
  const ballonScore =
    (rating - 7) * 22 +
    (player.overall - 84) * 3.2 +
    stats.goals * 0.8 +
    stats.assists * 0.6 +
    summary.trophies.length * 9 +
    (continentalRun ? 18 : 0) +
    player.life.fame * 0.18 +
    ((league?.reputation ?? 50) - 70) * 0.25;

  if (player.overall >= 85 && rating >= 7 && ballonScore > 40 && rng.chance(clamp(ballonScore / 130, 0.1, 0.8))) {
    push('BOLA DE OURO', '🏆', 12);
    adjustLife(player, 'fame', 22);
    adjustLife(player, 'reputation', 18);
  } else if (player.overall >= 82 && ballonScore > 26 && rng.chance(0.4)) {
    push('Top 10 da Bola de Ouro', '✨', 4);
  }

  // Prêmio de melhor na posição (mundial)
  if (player.overall >= 85 && rating >= 7.1 && rng.chance(0.45)) {
    push(`Melhor ${player.position} do mundo`, '🌍', 5);
  }

  for (const award of awards) {
    adjustLife(player, 'fame', (award.weight ?? 2) * 1.6);
    adjustLife(player, 'reputation', (award.weight ?? 2) * 1.2);
    adjustLife(player, 'happiness', (award.weight ?? 2) * 1.4);
  }

  return awards;
}

/** Prêmios em dinheiro por títulos e metas da temporada. */
export function seasonPrizeMoney(player, { summary }) {
  const weekly = player.contract?.weeklySalary ?? 0;
  let total = 0;
  const lines = [];

  for (const trophy of summary.trophies) {
    const bonus = Math.round(weekly * (trophy.type === 'continental' ? 20 : trophy.type === 'liga' ? 12 : 7));
    total += bonus;
    lines.push({ label: `Bônus por título: ${trophy.name}`, value: bonus });
  }
  if (summary.position && summary.position <= 4) {
    const bonus = Math.round(weekly * 5);
    total += bonus;
    lines.push({ label: 'Bônus por classificação continental', value: bonus });
  }
  const goalBonus = Math.round(weekly * 0.35 * player.season.goals);
  if (goalBonus > 0) {
    total += goalBonus;
    lines.push({ label: `Bônus por ${player.season.goals} gol(s)`, value: goalBonus });
  }

  player.money += total;
  return { total, lines };
}
