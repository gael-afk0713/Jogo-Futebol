// Evolução, declínio e envelhecimento do jogador no fim da temporada.

import { clamp } from '../core/utils.js';
import { ATTRIBUTE_IDS } from '../data/attributes.js';
import { getPosition, isGoalkeeper } from '../data/positions.js';
import { ageCurve } from './player.js';
import { attributeCeiling, keyAttributesFor, playerOverall } from './overall.js';

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

// Goleiros e defensores tiram notas naturalmente mais baixas (brilham não
// errando), então a meta de nota deles é mais baixa na mesma proporção.
const RATING_ADJUST = { gol: 0.3, defesa: 0.15, meio: 0.05, ataque: 0 };

/**
 * Revisão do potencial no fim da temporada. Dois caminhos para subir:
 *   1. Temporada boa (nota ajustada pela posição, com minutos suficientes).
 *   2. Bater no teto: quem já encostou no limite nos atributos principais
 *      da posição ganha espaço novo, para a carreira não travar.
 * Só um começo de carreira muito ruim derruba o potencial.
 * Retorna { change, reasons }.
 */
export function reviewPotential(player, { rating, minutes }, rng) {
  const reasons = [];
  if (player.age > 29 || player.potential >= 99) return { change: 0, reasons };

  const zone = getPosition(player.position).zone;
  const adjusted = rating + (RATING_ADJUST[zone] ?? 0);
  const young = player.age <= 23;
  const prime = player.age <= 26;
  // Quanto mais alto o potencial, mais difícil subir: craque continua raro.
  const room = player.potential >= 93 ? 0.25 : player.potential >= 88 ? 0.5 : 1;
  const step = (chance) => (rng.chance(chance * room) ? 1 : 0);
  let fromSeason = 0;
  let fromCeiling = 0;

  if (minutes >= 900) {
    if (adjusted >= 7.3) fromSeason = step(1) + (young ? step(0.6) : 0);
    else if (adjusted >= 6.9) fromSeason = young ? step(1) : prime ? step(0.5) : step(0.25);
    else if (adjusted >= 6.6 && young) fromSeason = step(0.35);
    if (fromSeason) reasons.push('boa temporada');
  }

  // Encostou no teto: o trabalho abre espaço, para a carreira não travar.
  const ceiling = attributeCeiling(player);
  const capped = keyAttributesFor(player.position, 6).filter((id) => (player.attributes[id] ?? 0) >= ceiling).length;
  if (capped >= 4) {
    fromCeiling = step(prime ? 0.6 : 0.35);
    if (fromCeiling) reasons.push('chegou ao teto nos atributos principais');
  }

  let change = Math.min(2, fromSeason + fromCeiling);
  if (change === 0 && player.age <= 21 && adjusted < 6.0 && minutes > 900 && rng.chance(0.3)) {
    change = -1;
    reasons.push('temporada muito abaixo');
  }

  player.potential = clamp(player.potential + change, 50, 99);
  return { change, reasons };
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
  if (score >= 3200) return { label: 'LENDA ETERNA', icon: 'trophy', text: 'Seu nome entra na conversa dos maiores de todos os tempos.' };
  if (score >= 2200) return { label: 'ÍDOLO MUNDIAL', icon: 'star', text: 'Gerações vão lembrar de te ver jogar.' };
  if (score >= 1400) return { label: 'CRAQUE CONSAGRADO', icon: 'trophy', text: 'Carreira de altíssimo nível, com títulos e respeito.' };
  if (score >= 800) return { label: 'PROFISSIONAL RESPEITADO', icon: 'medal', text: 'Você viveu do futebol com dignidade e boas histórias.' };
  if (score >= 400) return { label: 'CARREIRA SÓLIDA', icon: 'soccer-ball', text: 'Nem toda carreira é de craque, e a sua valeu a pena.' };
  return { label: 'SONHO INTERROMPIDO', icon: 'heart', text: 'O futebol é cruel. Pelo menos você tentou.' };
}
