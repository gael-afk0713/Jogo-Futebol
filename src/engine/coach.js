// Preparador: recomenda o treino da semana fazendo a mesma conta do treino de
// verdade (engine/training.js). Para cada opção ele pesa:
//   - quanto você fica melhor: XP que cai em atributos abaixo do teto, pesado
//     pelo que importa na sua posição (overall e lances que você recebe);
//   - os pontos de evolução que o treino dá;
//   - o que muda no corpo e na cabeça (forma antes do jogo, felicidade,
//     técnico, inteligência, saúde), com mais peso quando o número está baixo;
//   - o risco de lesão.
// Tudo vira uma nota, e a explicação sai das mesmas contas.

import { attributeLabel } from '../data/attributes.js';
import { MOMENTS } from '../data/matchMoments.js';
import { getPosition } from '../data/positions.js';
import { attributeCeiling, upgradeCost } from './overall.js';
import { grantXp, planTraining, trainingOptionsFor, xpThreshold } from './training.js';

// Tudo é medido em "semanas de evolução": 1 = o quanto um treino completo,
// sem nada no teto, te faria evoluir nesta semana. Assim dá para comparar
// descansar (perde uma semana de evolução) com o que a forma baixa custa.
// Valores calibrados simulando carreiras inteiras (README, "Preparador").
export const COACH_TUNING = {
  // Valor de cada ponto de vida conforme a faixa: [até, semanas por ponto].
  // Subir de 40 para 41 vale muito mais do que de 90 para 91.
  fitness: [[45, 0.1], [60, 0.055], [75, 0.025], [90, 0.008], [101, 0]],
  happiness: [[30, 0.15], [50, 0.04], [75, 0.012], [101, 0.003]],
  managerRelation: [[25, 0.14], [40, 0.08], [60, 0.03], [101, 0.006]],
  intelligence: [[60, 0.015], [85, 0.008], [101, 0.002]],
  health: [[30, 0.03], [60, 0.006], [101, 0.001]],
  // A forma pesa mais quando tem jogo nesta semana (o treino vem antes).
  matchFitness: 1.3,
  freeFitness: 0.8,
  // Uma lesão no treino tira 1 a 3 semanas, derruba a forma na volta e pode
  // custar a vaga no time: pesa como 8 semanas de evolução.
  injuryWeeks: 8,
  // Parte do valor de um ponto de evolução (nem todo mundo gasta na hora).
  pointShare: 0.7,
};

const RECOVERY = new Set(['descanso', 'crioterapia', 'livre']);
const RECOVERY_VERB = { descanso: 'descansar', crioterapia: 'a crioterapia', livre: 'a folga' };

function normalize(map) {
  const total = Object.values(map).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(map).map(([id, value]) => [id, value / total]));
}

const relevanceCache = new Map();

/**
 * Quanto cada atributo importa para a posição: 65% pelo peso no overall e
 * 35% pela frequência nos lances de partida da zona dela. É por isso que o
 * goleiro também é incentivado a treinar passe e frieza.
 */
export function attributeRelevance(positionId) {
  if (relevanceCache.has(positionId)) return relevanceCache.get(positionId);
  const position = getPosition(positionId);
  const overall = normalize(position.weights);
  const usage = {};
  for (const moment of MOMENTS) {
    if (!moment.zones.includes(position.zone)) continue;
    const share = (moment.weight ?? 5) / moment.options.length;
    for (const option of moment.options) {
      const attrs = option.attrs ?? [];
      for (const id of attrs) usage[id] = (usage[id] ?? 0) + share / attrs.length;
    }
  }
  const play = normalize(usage);
  const result = {};
  for (const id of new Set([...Object.keys(overall), ...Object.keys(play)])) {
    result[id] = (overall[id] ?? 0) * 0.65 + (play[id] ?? 0) * 0.35;
  }
  relevanceCache.set(positionId, result);
  return result;
}

/** Nível com a fração do XP: 62 com metade do caminho vira 62,5. */
function level(player, id, ceiling) {
  const value = player.attributes[id] ?? 40;
  if (value >= ceiling) return ceiling;
  return value + (player.xp?.[id] ?? 0) / xpThreshold(value);
}

/** Valor de mudar um número da vida de "from" para "to". */
function lifeValue(tuning, stat, from, to) {
  const bands = tuning[stat];
  if (!bands || from === to) return 0;
  const [low, high] = from < to ? [from, to] : [to, from];
  let total = 0;
  let start = 0;
  for (const [end, value] of bands) {
    const overlap = Math.max(0, Math.min(high, end) - Math.max(low, start));
    total += overlap * value;
    start = end;
  }
  return from < to ? total : -total;
}

/** O melhor uso de um ponto de evolução agora (atributo relevante e barato). */
function pointValue(player, relevance, ceiling) {
  let best = 0;
  for (const [id, weight] of Object.entries(relevance)) {
    const value = player.attributes[id] ?? 40;
    if (value >= ceiling) continue;
    best = Math.max(best, weight / upgradeCost(value));
  }
  return best;
}

/**
 * Quanto um treino completo te faria evoluir se nada estivesse no teto: a
 * régua das "semanas de evolução".
 */
function referenceGrowth(player, relevance) {
  const base = trainingOptionsFor(player).find((option) => option.id === 'goleiro') ?? trainingOptionsFor(player).find((option) => option.id === 'tecnico');
  const xp = planTraining(player, base).xp;
  const key = Object.entries(relevance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = key.reduce((sum, [id, weight]) => sum + (weight * xp) / xpThreshold(player.attributes[id] ?? 40), 0);
  return Math.max(total, 0.001);
}

/** A conta de uma opção de treino, em semanas de evolução. */
function assess(player, option, ctx) {
  const { hasMatch, relevance, ceiling, perPoint, reference, tuning } = ctx;
  const plan = planTraining(player, option);
  const copy = { ...player, attributes: { ...player.attributes }, xp: { ...(player.xp ?? {}) } };
  if (plan.targets.length && plan.xp > 0) grantXp(copy, plan.targets, plan.xp);

  const rows = plan.targets.map((id) => {
    const value = player.attributes[id] ?? 40;
    const gain = level(copy, id, ceiling) - level(player, id, ceiling);
    return {
      id,
      label: attributeLabel(id),
      value,
      weight: relevance[id] ?? 0,
      gain,
      atCeiling: value >= ceiling,
      levelUp: (copy.attributes[id] ?? value) > value,
    };
  });
  const growth = rows.reduce((sum, row) => sum + row.gain * row.weight, 0) / reference;
  const points = ((plan.fixedPoints + plan.bonusPointChance) * perPoint * tuning.pointShare) / reference;

  const lifeParts = {};
  for (const [stat, delta] of Object.entries(plan.life)) {
    if (!delta) continue;
    const before = player.life[stat] ?? 50;
    const after = Math.max(0, Math.min(100, Math.round(before + delta)));
    const weight = stat === 'fitness' ? (hasMatch ? tuning.matchFitness : tuning.freeFitness) : 1;
    lifeParts[stat] = { before, after, value: lifeValue(tuning, stat, before, after) * weight };
  }
  const life = Object.values(lifeParts).reduce((sum, part) => sum + part.value, 0);
  const injury = plan.injuryRisk * tuning.injuryWeeks;

  return {
    id: option.id,
    option,
    score: growth + points + life - injury,
    growth,
    points,
    life: lifeParts,
    injuryRisk: plan.injuryRisk,
    rows,
    capped: rows.filter((row) => row.atCeiling).length,
    fitnessAfter: lifeParts.fitness?.after ?? player.life.fitness,
  };
}

const list = (labels) => (labels.length > 1 ? `${labels.slice(0, -1).join(', ')} e ${labels.at(-1)}` : labels[0] ?? '');

/** As razões da escolha, em frases curtas e com os números de verdade. */
function explain(player, best, ranked, { hasMatch }) {
  const reasons = [];
  const fitness = player.life.fitness;
  const happiness = player.life.happiness;

  if (player.injury?.weeks > 0) {
    reasons.push(`Você está machucado: faltam ${player.injury.weeks} ${player.injury.weeks === 1 ? 'semana' : 'semanas'} e só dá para se recuperar.`);
    return reasons;
  }

  if (RECOVERY.has(best.id)) {
    const fit = best.life.fitness;
    if (fit && fit.after > fit.before && fitness < 60) {
      reasons.push(
        hasMatch
          ? `Sua forma está em ${fitness} e tem jogo nesta semana: ${RECOVERY_VERB[best.id]} leva para ${fit.after} antes da partida.`
          : `Sua forma está em ${fitness}: aproveite a semana sem jogo para subir para ${fit.after}.`,
      );
      if (fitness < 45) reasons.push('Abaixo de 45 de forma, o risco de lesão no treino dobra.');
    }
    if (best.life.happiness && happiness < 50) {
      reasons.push(`Sua felicidade está em ${happiness}${happiness < 30 ? ': abaixo de 30 você perde forma toda semana' : ' e isso reduz o XP dos treinos'}.`);
    }
    const growing = ranked.find((entry) => !RECOVERY.has(entry.id));
    if (growing && growing.growth < 0.01) reasons.push('Os treinos de evolução quase não rendem agora: os atributos que eles trabalham estão no teto.');
    if (!reasons.length) reasons.push('Corpo e cabeça pedem uma pausa nesta semana.');
    return reasons;
  }

  // Quando o técnico está contra você, essa é a razão principal do tático.
  const manager = best.life.managerRelation;
  if (manager && player.life.managerRelation < 40) {
    reasons.push(`O técnico está desconfiado de você (${manager.before}): ${best.option.label.toLowerCase()} leva para ${manager.after}, e é ele quem escolhe quem joga.`);
  }

  const helpful = best.rows
    .filter((row) => row.gain > 0 && row.weight > 0.01)
    .sort((a, b) => b.gain * b.weight - a.gain * a.weight)
    .slice(0, 3);
  const ups = best.rows.filter((row) => row.levelUp).map((row) => row.label);
  if (ups.length > 3) reasons.push(`${ups.length} atributos sobem nesta semana, entre eles ${list(ups.slice(0, 2))}.`);
  else if (ups.length) reasons.push(`${list(ups)} ${ups.length > 1 ? 'sobem' : 'sobe'} nesta semana.`);
  if (helpful.length) reasons.push(`Rende onde mais importa para você: ${list(helpful.map((row) => row.label))}.`);
  if (best.capped) reasons.push(`${best.capped} dos ${best.rows.length} atributos desse treino já ${best.capped === 1 ? 'está' : 'estão'} no teto; mesmo assim é o que mais rende.`);

  // Mostra quanto o treino técnico (o padrão) desperdiçaria, se for o caso.
  const standard = ranked.find((entry) => entry.id === 'tecnico' || entry.id === 'goleiro');
  if (standard && standard.id !== best.id && standard.capped >= Math.ceil(standard.rows.length / 2)) {
    reasons.push(`${standard.option.label} gastaria XP em ${standard.capped} atributos que já estão no teto.`);
  }
  if (hasMatch && best.life.fitness && best.fitnessAfter < 60) reasons.push(`Você chega ao jogo com ${best.fitnessAfter} de forma; descanse na semana que vem.`);
  if (!reasons.length) reasons.push('Corpo e cabeça em dia: hora de evoluir.');
  return reasons.slice(0, 3);
}

/**
 * Recomenda o treino da semana.
 * context.hasMatch: se tem jogo seu nesta semana (o treino vem antes dele).
 * Devolve a melhor opção, as razões e todas as opções em ordem.
 */
export function recommendTraining(player, { hasMatch = true, tuning = COACH_TUNING } = {}) {
  const options = trainingOptionsFor(player);
  const relevance = attributeRelevance(player.position);
  const ceiling = attributeCeiling(player);
  const ctx = { hasMatch, relevance, ceiling, tuning, perPoint: pointValue(player, relevance, ceiling), reference: referenceGrowth(player, relevance) };

  if (player.injury?.weeks > 0) {
    const best = assess(player, options.find((option) => option.id === 'descanso'), ctx);
    return { best, ranked: [best], reasons: explain(player, best, [best], { hasMatch }) };
  }
  const ranked = options.map((option) => assess(player, option, ctx)).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  return { best, ranked, reasons: explain(player, best, ranked, { hasMatch }) };
}
