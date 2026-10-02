// Evolução, declínio e envelhecimento do jogador no fim da temporada.

import { clamp } from '../core/utils.js';
import { ATTRIBUTE_IDS } from '../data/attributes.js';
import { getPosition, isGoalkeeper } from '../data/positions.js';
import { ageCurve } from './player.js';
import { attributeCeiling, playerOverall } from './overall.js';

const DECLINE_FIRST = ['acceleration', 'sprintSpeed', 'agility', 'stamina', 'jumping', 'balance'];
const DECLINE_LAST = ['composure', 'vision', 'shortPass', 'defAwareness', 'gkPositioning', 'penalties'];

function candidateAttributes(player) {
  const gk = isGoalkeeper(player.position);
  return ATTRIBUTE_IDS.filter((id) => (id.startsWith('gk') ? gk : !gk || !['finishing', 'volleys', 'dribbling'].includes(id)));
}

/** Sobe atributos até o overall crescer o tanto pedido. */
export function raiseOverall(player, points, rng) {
  if (points <= 0) return [];
  const position = getPosition(player.position);
  const ceiling = attributeCeiling(player);
  const start = playerOverall(player);
  const target = Math.min(start + points, player.potential, ceiling);
  const pool = candidateAttributes(player);
  const changed = {};

  let guard = 0;
  while (playerOverall(player) < target && guard < 400) {
    guard += 1;
    const id = rng.weighted(pool, (attributeId) => {
      const weight = position.weights[attributeId] ?? 0.012;
      const room = ceiling - (player.attributes[attributeId] ?? 40);
      if (room <= 0) return 0;
      return weight * 10 + 0.2;
    });
    if (!id || (player.attributes[id] ?? 40) >= ceiling) continue;
    player.attributes[id] += 1;
    changed[id] = (changed[id] ?? 0) + 1;
  }
  return changed;
}

/** Reduz atributos até o overall cair o tanto pedido (declínio da idade). */
export function declineOverall(player, points, rng) {
  if (points <= 0) return {};
  const start = playerOverall(player);
  const target = Math.max(start - points, 20);
  const changed = {};

  let guard = 0;
  while (playerOverall(player) > target && guard < 400) {
    guard += 1;
    const pool = candidateAttributes(player).filter((id) => (player.attributes[id] ?? 40) > 25);
    if (!pool.length) break;
    const id = rng.weighted(pool, (attributeId) => {
      if (DECLINE_FIRST.includes(attributeId)) return 6;
      if (DECLINE_LAST.includes(attributeId)) return 0.4;
      return 2;
    });
    player.attributes[id] -= 1;
    changed[id] = (changed[id] ?? 0) - 1;
  }
  return changed;
}

/**
 * Evolução de fim de temporada.
 * Depende de: potencial restante, idade, minutos jogados, nota média,
 * condição física, felicidade e nível dos adversários enfrentados.
 */
export function endOfSeasonGrowth(player, { minutes, rating, difficulty }, rng) {
  const gap = Math.max(0, player.potential - player.overall);
  const curve = ageCurve(player.age);
  const minutesFactor = clamp(minutes / 1800, 0.15, 1.25);
  const ratingFactor = clamp((rating - 6) / 2 + 1, 0.55, 1.7);
  const conditionFactor = clamp(0.7 + player.life.fitness / 250 + player.life.happiness / 400, 0.6, 1.35);
  const difficultyFactor = clamp(0.85 + (difficulty - 60) / 120, 0.8, 1.3);

  let growth = 0;
  let decline = 0;

  if (curve > 0) {
    growth = curve * (0.35 + gap * 0.09) * minutesFactor * ratingFactor * conditionFactor * difficultyFactor;
  } else {
    // Declínio é atenuado por bom condicionamento e minutos regulares.
    decline = Math.abs(curve) * 2.4 * clamp(1.25 - player.life.fitness / 160 - minutesFactor * 0.2, 0.3, 1.5);
    // Veteranos ainda podem lapidar leitura de jogo.
    growth = gap > 0 ? 0.25 * ratingFactor : 0;
  }

  const before = player.overall;
  const gains = raiseOverall(player, growth, rng);
  const losses = decline > 0 ? declineOverall(player, decline, rng) : {};
  player.overall = playerOverall(player);

  return {
    before,
    after: player.overall,
    delta: player.overall - before,
    gains,
    losses,
    growthPoints: Number(growth.toFixed(2)),
    declinePoints: Number(decline.toFixed(2)),
  };
}

/** Potencial pode ser revisto para cima quando o jogador surpreende. */
export function reviewPotential(player, { rating, minutes }, rng) {
  const avg = rating;
  if (player.age <= 23 && avg >= 7.6 && minutes > 1200 && rng.chance(0.5)) {
    const bump = rng.int(1, 3);
    player.potential = clamp(player.potential + bump, 50, 99);
    return bump;
  }
  if (player.age <= 21 && avg < 6.2 && minutes > 900 && rng.chance(0.3)) {
    const drop = rng.int(1, 2);
    player.potential = clamp(player.potential - drop, 50, 99);
    return -drop;
  }
  return 0;
}

export function shouldForceRetirement(player) {
  if (player.age >= 39) return 'Idade avançada: é hora de pendurar as chuteiras.';
  if (player.age >= 35 && player.overall < 62) return 'Seu rendimento caiu muito e ninguém te procura mais.';
  if (player.age >= 30 && player.life.health <= 20) return 'Lesões crônicas te obrigam a parar.';
  if (player.life.health <= 12) return 'Problemas de saúde te obrigam a parar.';
  return null;
}

/** Nota de legado usada no resumo final da carreira. */
export function legacyScore(player) {
  const totals = player.career.totals;
  const trophies = player.career.trophies.length;
  const awards = player.career.awards.length;
  const peak = player.career.seasons.reduce((max, season) => Math.max(max, season.overallAfter ?? 0), 0);
  const avgRating = totals.ratingCount ? totals.ratingSum / totals.ratingCount : 0;

  return Math.round(
    peak * 4 +
      totals.apps * 0.8 +
      totals.goals * 2.2 +
      totals.assists * 1.4 +
      totals.motm * 3 +
      trophies * 22 +
      awards * 45 +
      totals.nationalCaps * 1.6 +
      totals.nationalGoals * 3 +
      avgRating * 20 +
      player.life.reputation * 1.5,
  );
}

export function legacyTier(score) {
  if (score >= 3200) return { label: 'LENDA ETERNA', icon: '👑', text: 'Seu nome entra na conversa dos maiores de todos os tempos.' };
  if (score >= 2200) return { label: 'ÍDOLO MUNDIAL', icon: '🌟', text: 'Gerações vão lembrar de te ver jogar.' };
  if (score >= 1400) return { label: 'CRAQUE CONSAGRADO', icon: '🏆', text: 'Carreira de altíssimo nível, com títulos e respeito.' };
  if (score >= 800) return { label: 'PROFISSIONAL RESPEITADO', icon: '🎖️', text: 'Você viveu do futebol com dignidade e boas histórias.' };
  if (score >= 400) return { label: 'CARREIRA SÓLIDA', icon: '⚽', text: 'Nem toda carreira é de craque — e a sua valeu a pena.' };
  return { label: 'SONHO INTERROMPIDO', icon: '🥀', text: 'O futebol é cruel. Pelo menos você tentou.' };
}
