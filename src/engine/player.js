// Criação e manutenção do jogador.

import { clamp, uid } from '../core/utils.js';
import { ATTRIBUTE_GROUPS, ATTRIBUTE_IDS, blankAttributes } from '../data/attributes.js';
import { getPosition, isGoalkeeper } from '../data/positions.js';
import { playerOverall } from './overall.js';

export const CREATION_POINT_POOL = 26;
export const CREATION_GROUP_CAP = 8;
export const START_AGE = 16;

export const LIFE_STATS = [
  { id: 'happiness', label: 'Felicidade', icon: 'smiley' },
  { id: 'fitness', label: 'Forma física', icon: 'heartbeat' },
  { id: 'health', label: 'Saúde', icon: 'stethoscope' },
  { id: 'discipline', label: 'Disciplina', icon: 'compass' },
  { id: 'intelligence', label: 'Inteligência', icon: 'brain' },
  { id: 'charisma', label: 'Carisma', icon: 'sparkle' },
  { id: 'fame', label: 'Fama', icon: 'star' },
  { id: 'reputation', label: 'Reputação', icon: 'medal' },
  { id: 'morale', label: 'Vestiário', icon: 'handshake' },
  { id: 'managerRelation', label: 'Técnico', icon: 'clipboard-text' },
  { id: 'fanRelation', label: 'Torcida', icon: 'megaphone' },
];

export const LIFE_STAT_IDS = LIFE_STATS.map((stat) => stat.id);

/** Base de atributos de um garoto de 16 anos no perfil da posição escolhida. */
function baseAttributesFor(positionId, rng) {
  const position = getPosition(positionId);
  const attributes = blankAttributes(0);
  const gk = isGoalkeeper(positionId);

  for (const id of ATTRIBUTE_IDS) {
    const template = position.template[id] ?? 0;
    const isGkAttribute = id.startsWith('gk');
    let value = 37 + template * 0.55 + rng.normal(0, 3);

    // Atributos de goleiro só importam para goleiros (e vice-versa).
    if (isGkAttribute && !gk) value = Math.min(value, 18 + rng.int(0, 8));
    if (!isGkAttribute && gk && ['finishing', 'volleys', 'dribbling', 'slidingTackle'].includes(id)) {
      value = Math.min(value, 24 + rng.int(0, 8));
    }

    attributes[id] = clamp(Math.round(value), 12, 62);
  }
  return attributes;
}

/** Aplica os pontos distribuídos por grupo na criação. */
export function applyGroupPoints(attributes, groupPoints) {
  const result = { ...attributes };
  for (const group of ATTRIBUTE_GROUPS) {
    const points = clamp(Math.round(groupPoints?.[group.id] ?? 0), 0, CREATION_GROUP_CAP);
    if (!points) continue;
    for (const attribute of group.attributes) {
      result[attribute.id] = clamp(result[attribute.id] + points, 1, 75);
    }
  }
  return result;
}

export function groupPointsSpent(groupPoints = {}) {
  return ATTRIBUTE_GROUPS.reduce(
    (total, group) => total + clamp(Math.round(groupPoints[group.id] ?? 0), 0, CREATION_GROUP_CAP),
    0,
  );
}

export function emptySeasonStats() {
  return {
    apps: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    saves: 0,
    cleanSheets: 0,
    tackles: 0,
    yellowCards: 0,
    redCards: 0,
    motm: 0,
    ratingSum: 0,
    ratingCount: 0,
    benchedStreak: 0,
  };
}

export function emptyCareerTotals() {
  return {
    apps: 0,
    goals: 0,
    assists: 0,
    saves: 0,
    cleanSheets: 0,
    yellowCards: 0,
    redCards: 0,
    motm: 0,
    ratingSum: 0,
    ratingCount: 0,
    nationalCaps: 0,
    nationalGoals: 0,
  };
}

export function createPlayer(config, rng) {
  const {
    firstName = 'Novo',
    lastName = 'Jogador',
    nickname = '',
    nationality = 'BRA',
    position = 'MC',
    foot = 'direito',
    height = 178,
    weight = 72,
    appearance = {},
    traits = [],
    groupPoints = {},
  } = config;

  const attributes = applyGroupPoints(baseAttributesFor(position, rng), groupPoints);
  const potential = clamp(Math.round(rng.normal(79, 7)), 62, 95);

  const player = {
    id: uid('player'),
    firstName,
    lastName,
    nickname: nickname || firstName,
    nationality,
    position,
    foot,
    height,
    weight,
    appearance: {
      skin: appearance.skin ?? 3,
      hair: appearance.hair ?? 'curto',
      hairColor: appearance.hairColor ?? '#2b1d14',
      beard: appearance.beard ?? 'nenhuma',
      kitNumber: appearance.kitNumber ?? 10,
    },
    traits: [...traits],
    attributes,
    potential,
    hiddenPotentialKnown: false,
    skillPoints: 4,
    age: START_AGE,
    life: {
      happiness: 70,
      fitness: 72,
      health: 90,
      discipline: 60,
      intelligence: 50,
      charisma: 50,
      fame: 3,
      reputation: 10,
      morale: 55,
      managerRelation: 50,
      fanRelation: 50,
    },
    flags: [],
    money: 1500,
    club: null,
    contract: null,
    injury: null,
    suspension: 0,
    season: emptySeasonStats(),
    career: {
      totals: emptyCareerTotals(),
      seasons: [],
      trophies: [],
      awards: [],
      transfers: [],
      clubs: [],
    },
    national: { status: 'none', caps: 0, goals: 0, callUps: 0 },
    seenEvents: [],
    retired: false,
    legacy: 0,
  };

  player.overall = playerOverall(player);
  return player;
}

export const fullName = (player) => `${player.firstName} ${player.lastName}`;

export const hasFlag = (player, flag) => player.flags.includes(flag);

export function addFlag(player, flag) {
  if (flag && !player.flags.includes(flag)) player.flags.push(flag);
}

export function removeFlag(player, flag) {
  player.flags = player.flags.filter((item) => item !== flag);
}

export function seasonRating(stats) {
  return stats.ratingCount ? stats.ratingSum / stats.ratingCount : 0;
}

/** Idade afeta forma física máxima e velocidade de evolução. */
export function ageCurve(age) {
  if (age <= 20) return 1.25;
  if (age <= 23) return 1.1;
  if (age <= 26) return 0.85;
  if (age <= 29) return 0.5;
  if (age <= 31) return 0.2;
  if (age <= 33) return -0.25;
  if (age <= 35) return -0.6;
  return -1;
}

/**
 * Curva de idade do jogador. O goleiro amadurece mais tarde e dura mais:
 * a curva dele anda um ano atrasada.
 */
export function careerAgeCurve(player) {
  return ageCurve(isGoalkeeper(player.position) ? player.age - GOALKEEPER_AGE_SHIFT : player.age);
}

const GOALKEEPER_AGE_SHIFT = 1;

/**
 * Save antigo, atributo novo: quem não tem um atributo recebe um valor
 * calculado dos que já tem. O goleiro ganha os de goleiro um pouco abaixo da
 * média dos outros, para ter o que treinar.
 */
export function fillMissingAttributes(player) {
  if (!player?.attributes) return false;
  const missing = ATTRIBUTE_IDS.filter((id) => typeof player.attributes[id] !== 'number');
  if (!missing.length) return false;
  const gkValues = ATTRIBUTE_IDS.filter((id) => id.startsWith('gk') && typeof player.attributes[id] === 'number').map((id) => player.attributes[id]);
  const gkAverage = gkValues.length ? gkValues.reduce((sum, value) => sum + value, 0) / gkValues.length : 30;
  const goalkeeper = isGoalkeeper(player.position);
  for (const id of missing) {
    if (id.startsWith('gk')) player.attributes[id] = clamp(Math.round(gkAverage - (goalkeeper ? 5 : 0)), 12, 99);
    else player.attributes[id] = 40;
  }
  player.overall = playerOverall(player);
  return true;
}

/** Ajusta um stat de vida mantendo-o em 0..100. */
export function adjustLife(player, statId, delta) {
  if (!LIFE_STAT_IDS.includes(statId)) return;
  player.life[statId] = clamp(Math.round((player.life[statId] ?? 50) + delta), 0, 100);
}
