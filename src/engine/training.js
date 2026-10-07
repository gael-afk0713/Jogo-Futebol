// Treino semanal: você escolhe o foco e colhe (ou não) os resultados.

import { clamp } from '../core/utils.js';
import { attributeLabel } from '../data/attributes.js';
import { lifeModifier } from '../data/traits.js';
import { isGoalkeeper } from '../data/positions.js';
import { adjustLife, ageCurve } from './player.js';
import { attributeCeiling, effectiveAttributes, keyAttributesFor, upgradeCost } from './overall.js';
import { itemEffects } from './shop.js';

export const TRAINING_OPTIONS = [
  {
    id: 'tecnico',
    label: 'Treino técnico',
    icon: 'soccer-ball',
    description: 'Fundamentos da sua posição. Evolução sólida nos atributos que importam.',
    targets: 'key',
    fitness: -3,
    happiness: -1,
    skillPoints: 1,
    xp: 26,
    injuryRisk: 0.02,
  },
  {
    id: 'fisico',
    label: 'Preparação física',
    icon: 'person-simple-run',
    description: 'Corrida, explosão e resistência. Melhora a forma física.',
    targets: ['acceleration', 'sprintSpeed', 'stamina', 'workRate', 'jumping'],
    fitness: 7,
    happiness: -2,
    skillPoints: 1,
    xp: 22,
    injuryRisk: 0.04,
  },
  {
    id: 'academia',
    label: 'Musculação',
    icon: 'barbell',
    description: 'Ganho de força para aguentar o contato.',
    targets: ['strength', 'jumping', 'balance', 'aggression'],
    fitness: 3,
    happiness: -2,
    skillPoints: 1,
    xp: 24,
    injuryRisk: 0.05,
  },
  {
    id: 'tatico',
    label: 'Treino tático',
    icon: 'clipboard-text',
    description: 'Posicionamento e leitura de jogo. Agrada a comissão técnica.',
    targets: ['defAwareness', 'interceptions', 'vision', 'reactions', 'composure', 'gkPositioning'],
    fitness: -1,
    happiness: -1,
    skillPoints: 1,
    managerRelation: 3,
    intelligence: 2,
    xp: 20,
    injuryRisk: 0.01,
  },
  {
    id: 'bola_parada',
    label: 'Bola parada',
    icon: 'target',
    description: 'Faltas, cobranças e pênaltis depois do treino.',
    targets: ['freeKick', 'penalties', 'curve', 'crossing', 'longShots'],
    fitness: -1,
    happiness: 1,
    skillPoints: 1,
    xp: 24,
    injuryRisk: 0.01,
  },
  {
    id: 'finalizacao',
    label: 'Finalização',
    icon: 'crosshair',
    description: 'Centenas de chutes a gol. Para quem vive de decidir.',
    targets: ['finishing', 'shotPower', 'volleys', 'heading', 'composure'],
    fitness: -2,
    happiness: 1,
    skillPoints: 1,
    xp: 25,
    injuryRisk: 0.02,
  },
  {
    id: 'drible',
    label: 'Treino de drible',
    icon: 'sneaker-move',
    description: 'Cones, um contra um e mudança de direção. O treino mais divertido da semana.',
    targets: ['dribbling', 'ballControl', 'agility', 'balance', 'reactions'],
    fitness: -2,
    happiness: 2,
    skillPoints: 1,
    xp: 25,
    injuryRisk: 0.02,
  },
  {
    id: 'jogo_pes',
    label: 'Jogo com os pés',
    icon: 'soccer-ball',
    description: 'Saída de bola, passe sob pressão e lançamento longo para o goleiro moderno.',
    goalkeeperOnly: true,
    targets: ['shortPass', 'longPass', 'gkKicking', 'ballControl', 'composure'],
    fitness: -1,
    happiness: 1,
    skillPoints: 1,
    xp: 25,
    injuryRisk: 0.01,
  },
  {
    id: 'goleiro',
    label: 'Treino de goleiro',
    icon: 'hand-grabbing',
    description: 'Reflexos, encaixe e saída de gol.',
    goalkeeperOnly: true,
    targets: ['gkReflexes', 'gkDiving', 'gkHandling', 'gkPositioning', 'gkKicking'],
    fitness: -2,
    happiness: 0,
    skillPoints: 1,
    xp: 27,
    injuryRisk: 0.02,
  },
  // Treinos liberados por itens da loja (src/data/shop.js).
  {
    id: 'academia_casa',
    label: 'Academia em casa',
    icon: 'barbell',
    description: 'Força e resistência no seu ritmo, sem a rotina pesada do clube.',
    requires: 'academia_casa',
    targets: ['strength', 'stamina', 'jumping', 'balance', 'workRate'],
    fitness: 1,
    happiness: 1,
    skillPoints: 1,
    xp: 27,
    injuryRisk: 0.02,
  },
  {
    id: 'video',
    label: 'Análise de vídeo',
    icon: 'film-strip',
    description: 'Você e o analista estudam seus jogos e os do próximo adversário.',
    requires: 'video',
    targets: ['vision', 'reactions', 'composure', 'defAwareness', 'interceptions', 'gkPositioning'],
    fitness: 2,
    happiness: 0,
    skillPoints: 1,
    managerRelation: 2,
    intelligence: 3,
    xp: 26,
    injuryRisk: 0,
  },
  {
    id: 'mentor',
    label: 'Treino com o mentor',
    icon: 'star',
    description: 'Um ex-craque corrige os detalhes que só quem jogou em alto nível enxerga.',
    requires: 'mentor',
    targets: 'key',
    fitness: -3,
    happiness: 2,
    skillPoints: 2,
    xp: 36,
    injuryRisk: 0.02,
  },
  {
    id: 'reflexo',
    label: 'Reflexo na máquina',
    icon: 'target',
    description: 'Centenas de chutes da máquina, de perto e de longe.',
    requires: 'reflexo',
    targets: ['gkReflexes', 'gkDiving', 'gkHandling', 'reactions'],
    fitness: -2,
    happiness: 0,
    skillPoints: 1,
    xp: 31,
    injuryRisk: 0.02,
  },
  {
    id: 'marcacao',
    label: 'Marcação individual',
    icon: 'shield',
    description: 'Um contra um, bote e cobertura com o treinador de defesa.',
    requires: 'marcacao',
    targets: ['defAwareness', 'standingTackle', 'slidingTackle', 'interceptions', 'heading'],
    fitness: -3,
    happiness: 0,
    skillPoints: 1,
    xp: 30,
    injuryRisk: 0.03,
  },
  {
    id: 'paredao',
    label: 'Paredão de passe',
    icon: 'arrow-counter-clockwise',
    description: 'Passe, domínio e giro contra o rebatedor, com as duas pernas.',
    requires: 'paredao',
    targets: ['shortPass', 'longPass', 'ballControl', 'vision', 'curve'],
    fitness: -1,
    happiness: 1,
    skillPoints: 1,
    xp: 29,
    injuryRisk: 0.01,
  },
  {
    id: 'artilheiro',
    label: 'Treino de artilheiro',
    icon: 'soccer-ball',
    description: 'Finalização de primeira, de cabeça e cara a cara, com correção na hora.',
    requires: 'artilheiro',
    targets: ['finishing', 'composure', 'volleys', 'heading', 'shotPower'],
    fitness: -2,
    happiness: 1,
    skillPoints: 1,
    xp: 31,
    injuryRisk: 0.02,
  },
  {
    id: 'crioterapia',
    label: 'Crioterapia',
    icon: 'snowflake',
    description: 'Recuperação de elite: corpo novo para o próximo jogo.',
    requires: 'crioterapia',
    targets: [],
    fitness: 18,
    happiness: 3,
    health: 6,
    skillPoints: 0,
    xp: 0,
    injuryRisk: 0,
  },
  {
    id: 'descanso',
    label: 'Descanso e fisioterapia',
    icon: 'bed',
    description: 'Recupera corpo e cabeça. Sem evolução técnica.',
    targets: [],
    fitness: 12,
    happiness: 6,
    health: 4,
    skillPoints: 0,
    xp: 0,
    injuryRisk: 0,
  },
  {
    id: 'livre',
    label: 'Folga na cidade',
    icon: 'buildings',
    description: 'Cabeça fora do futebol. Felicidade em alta, forma em baixa.',
    targets: [],
    fitness: -4,
    happiness: 12,
    skillPoints: 0,
    xp: 0,
    injuryRisk: 0,
  },
];

export function trainingOptionsFor(player) {
  const gk = isGoalkeeper(player.position);
  const unlocked = itemEffects(player).unlocks;
  return TRAINING_OPTIONS.filter((option) => {
    if (option.requires && !unlocked.has(option.requires)) return false;
    if (option.goalkeeperOnly && !gk) return false;
    if (gk && ['finalizacao', 'bola_parada', 'drible'].includes(option.id)) return false;
    return true;
  });
}

function targetAttributes(player, option) {
  if (option.targets === 'key') return keyAttributesFor(player.position, 6);
  const gk = isGoalkeeper(player.position);
  return (option.targets ?? []).filter((id) => (id.startsWith('gk') ? gk : true));
}

/** Quanto XP é preciso para subir 1 ponto num atributo. */
export const xpThreshold = (value) => upgradeCost(value) * 34;

/** Distribui XP e sobe atributos que atingirem o limite. */
export function grantXp(player, attributeIds, amount) {
  if (!player.xp) player.xp = {};
  const ceiling = attributeCeiling(player);
  const gains = [];

  for (const id of attributeIds) {
    const current = player.attributes[id] ?? 40;
    if (current >= ceiling) continue;
    player.xp[id] = (player.xp[id] ?? 0) + amount;
    while (player.xp[id] >= xpThreshold(player.attributes[id]) && player.attributes[id] < ceiling) {
      player.xp[id] -= xpThreshold(player.attributes[id]);
      player.attributes[id] += 1;
      gains.push(id);
    }
  }
  return gains;
}

/**
 * A conta do treino, sem sortear nada e sem mudar o jogador. O treino de
 * verdade e a prévia da loja usam esta mesma função, então a prévia mostra
 * exatamente o que vai acontecer (o que é sorte aparece como chance).
 */
function planTraining(player, option) {
  const targets = targetAttributes(player, option);
  const gear = itemEffects(player);

  const trainingBonus = 1 + lifeModifier(player.traits, 'trainingGain');
  const ageFactor = clamp(1 + ageCurve(player.age) * 0.3, 0.45, 1.4);
  const intelligenceFactor = 0.85 + player.life.intelligence / 300;
  const happinessFactor = 0.8 + player.life.happiness / 250;
  const gearXp = gear.xp[option.id] ?? 1;
  const xp = Math.round((option.xp ?? 0) * trainingBonus * ageFactor * intelligenceFactor * happinessFactor * gearXp);

  const fitnessBonus = 1 + lifeModifier(player.traits, 'fitnessGain');
  let fitness = (option.fitness ?? 0) * (option.fitness > 0 ? fitnessBonus : 1);
  if ((option.fitness ?? 0) < 0) fitness = Math.min(0, fitness + gear.trainingFitness);
  if (option.id === 'descanso' || option.id === 'crioterapia') fitness += gear.restBonus;
  const fitnessAfter = clamp(Math.round(player.life.fitness + fitness), 0, 100);

  return {
    option,
    targets,
    xp,
    life: {
      fitness,
      happiness: option.happiness ?? 0,
      health: option.health ?? 0,
      managerRelation: option.managerRelation ?? 0,
      intelligence: option.intelligence ?? 0,
    },
    fixedPoints: (option.skillPoints ?? 0) + (gear.skillPoints[option.id] ?? 0),
    bonusPointChance: clamp(player.life.intelligence / 400 + 0.08, 0, 0.4),
    injuryRisk:
      (option.injuryRisk ?? 0) * (1 + lifeModifier(player.traits, 'injuryRisk')) * (fitnessAfter < 45 ? 2 : 1) * gear.injuryRisk,
  };
}

/** Aplica o treino da semana. */
export function applyTraining(player, optionId, rng) {
  const option = TRAINING_OPTIONS.find((item) => item.id === optionId) ?? TRAINING_OPTIONS[0];
  const plan = planTraining(player, option);

  const gains = plan.targets.length && plan.xp > 0 ? grantXp(player, plan.targets, plan.xp) : [];

  for (const [stat, delta] of Object.entries(plan.life)) if (delta) adjustLife(player, stat, delta);

  const bonusPoint = rng.chance(plan.bonusPointChance) ? 1 : 0;
  player.skillPoints += plan.fixedPoints + bonusPoint;

  let injury = null;
  if (plan.injuryRisk > 0 && rng.chance(plan.injuryRisk)) {
    injury = { name: rng.pick(['Desconforto muscular', 'Entorse no tornozelo', 'Lesão na coxa']), weeks: rng.int(1, 3) };
  }

  return {
    option,
    gains: gains.map((id) => attributeLabel(id)),
    skillPoints: plan.fixedPoints + bonusPoint,
    xp: plan.xp,
    injury,
  };
}

/**
 * Prévia exata de um treino: quanto XP cada atributo recebe, quanto falta
 * para subir, se sobe nesta semana e como ficam forma, felicidade e o resto.
 */
export function previewTraining(player, optionId) {
  const option = TRAINING_OPTIONS.find((item) => item.id === optionId);
  if (!option) return null;
  const plan = planTraining(player, option);
  const ceiling = attributeCeiling(player);
  const shown = effectiveAttributes(player);
  const copy = { ...player, attributes: { ...player.attributes }, xp: { ...(player.xp ?? {}) } };
  if (plan.targets.length && plan.xp > 0) grantXp(copy, plan.targets, plan.xp);

  const attributes = plan.targets.map((id) => {
    const value = player.attributes[id] ?? 40;
    const after = copy.attributes[id] ?? value;
    const atCeiling = value >= ceiling;
    const progress = after >= ceiling ? 0 : copy.xp[id] ?? 0;
    // Bônus de traços e itens: a prévia mostra o mesmo número da aba Atributos.
    const bonus = (shown[id] ?? value) - value;
    return {
      id,
      label: attributeLabel(id),
      value,
      after,
      bonus,
      atCeiling,
      progress,
      need: after >= ceiling ? 0 : xpThreshold(after),
    };
  });

  const lifeRows = Object.entries(plan.life)
    .filter(([, delta]) => delta)
    .map(([stat, delta]) => {
      const before = player.life[stat] ?? 50;
      return { stat, before, after: clamp(Math.round(before + delta), 0, 100) };
    });

  return {
    option,
    xp: plan.xp,
    ceiling,
    attributes,
    life: lifeRows,
    fixedPoints: plan.fixedPoints,
    bonusPointChance: plan.bonusPointChance,
    injuryRisk: plan.injuryRisk,
  };
}

/** Gasta pontos de evolução para subir um atributo manualmente. */
export function spendSkillPoint(player, attributeId) {
  const current = player.attributes[attributeId];
  if (current === undefined) return { ok: false, reason: 'Atributo inválido.' };
  const ceiling = attributeCeiling(player);
  if (current >= ceiling) {
    return { ok: false, reason: `Você chegou ao seu limite atual (${ceiling}) nesse atributo.` };
  }
  const cost = upgradeCost(current);
  if (player.skillPoints < cost) {
    return { ok: false, reason: `Faltam pontos: custa ${cost}.` };
  }
  player.skillPoints -= cost;
  player.attributes[attributeId] += 1;
  return { ok: true, cost, value: player.attributes[attributeId] };
}
