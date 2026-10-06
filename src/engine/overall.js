// Cálculo de overall e dos atributos efetivos (base + traços).

import { clamp } from '../core/utils.js';
import { ATTRIBUTE_IDS } from '../data/attributes.js';
import { getPosition } from '../data/positions.js';
import { traitAttributeBonus } from '../data/traits.js';
import { itemEffects } from './shop.js';

/** Atributos finais do jogador, já somando bônus de traços. */
export function effectiveAttributes(player) {
  const bonus = traitAttributeBonus(player.traits);
  const gear = itemEffects(player).attributes;
  const result = {};
  for (const id of ATTRIBUTE_IDS) {
    result[id] = clamp(Math.round((player.attributes[id] ?? 40) + (bonus[id] ?? 0) + (gear[id] ?? 0)), 1, 99);
  }
  return result;
}

/** Overall de um conjunto de atributos para uma posição específica. */
export function overallFor(attributes, positionId) {
  const position = getPosition(positionId);
  const weights = Object.entries(position.weights);
  const totalWeight = weights.reduce((acc, [, weight]) => acc + weight, 0) || 1;
  const score = weights.reduce(
    (acc, [attributeId, weight]) => acc + (attributes[attributeId] ?? 40) * weight,
    0,
  );
  return clamp(Math.round(score / totalWeight), 1, 99);
}

/** Overall do jogador na posição natural dele. */
export function playerOverall(player) {
  return overallFor(effectiveAttributes(player), player.position);
}

/**
 * Teto de cada atributo. Treinar permite especializar um pouco acima do
 * potencial bruto, mas ninguém vira outro jogador.
 */
export function attributeCeiling(player) {
  return clamp(player.potential + 2, 50, 99);
}

/** Custo em pontos de evolução para subir um atributo em 1. */
export function upgradeCost(currentValue) {
  if (currentValue < 50) return 1;
  if (currentValue < 60) return 2;
  if (currentValue < 70) return 3;
  if (currentValue < 78) return 4;
  if (currentValue < 85) return 6;
  if (currentValue < 90) return 9;
  return 13;
}

/** Atributos mais relevantes para a posição, usados na tela de treino. */
export function keyAttributesFor(positionId, count = 8) {
  const position = getPosition(positionId);
  return Object.entries(position.weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([attributeId]) => attributeId);
}
