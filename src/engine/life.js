// Eventos de vida: sorteio, condições e aplicação dos efeitos.

import { clamp } from '../core/utils.js';
import { attributeLabel } from '../data/attributes.js';
import { LIFE_EVENTS } from '../data/lifeEvents.js';
import { lifeModifier } from '../data/traits.js';
import { addFlag, adjustLife, hasFlag, removeFlag, seasonRating } from './player.js';
import { attributeCeiling } from './overall.js';

/** Contexto que as condições dos eventos consultam. */
export function lifeContext(player, season) {
  return {
    hasClub: Boolean(player.club),
    benched: player.season.benchedStreak >= 3,
    overall: player.overall,
    caps: player.national.caps,
    contractYears: player.contract?.years ?? 99,
    money: player.money,
    age: player.age,
    fame: player.life.fame,
    happiness: player.life.happiness,
    fanRelation: player.life.fanRelation,
    seasonRating: seasonRating(player.season),
    seasonYear: season?.year ?? null,
  };
}

function conditionsMet(when = {}, player, context) {
  if (when.hasClub && !context.hasClub) return false;
  if (when.benched && !context.benched) return false;
  if (when.minAge !== undefined && player.age < when.minAge) return false;
  if (when.maxAge !== undefined && player.age > when.maxAge) return false;
  if (when.minMoney !== undefined && player.money < when.minMoney) return false;
  if (when.minFame !== undefined && player.life.fame < when.minFame) return false;
  if (when.maxFame !== undefined && player.life.fame > when.maxFame) return false;
  if (when.minOverall !== undefined && player.overall < when.minOverall) return false;
  if (when.maxHappiness !== undefined && player.life.happiness > when.maxHappiness) return false;
  if (when.minFanRelation !== undefined && player.life.fanRelation < when.minFanRelation) return false;
  if (when.maxFanRelation !== undefined && player.life.fanRelation > when.maxFanRelation) return false;
  if (when.maxCaps !== undefined && player.national.caps > when.maxCaps) return false;
  if (when.maxContractYears !== undefined && context.contractYears > when.maxContractYears) return false;
  if (when.flagRequired && !hasFlag(player, when.flagRequired)) return false;
  if (when.flagForbidden && hasFlag(player, when.flagForbidden)) return false;
  return true;
}

export function eventAvailable(event, player, context) {
  if (event.when?.once && player.seenEvents.includes(event.id)) return false;
  return conditionsMet(event.when, player, context);
}

/** Opções visíveis de um evento (algumas exigem dinheiro/idade). */
export function availableOptions(event, player, context) {
  return event.options
    .map((option, index) => ({ ...option, index }))
    .filter((option) => conditionsMet(option.when, player, context));
}

/** Sorteia um evento de vida, ou null se nada se aplicar. */
export function drawLifeEvent(player, season, rng) {
  const context = lifeContext(player, season);
  const pool = LIFE_EVENTS.filter((event) => eventAvailable(event, player, context)).filter(
    (event) => availableOptions(event, player, context).length > 0,
  );
  if (!pool.length) return null;

  // Eventos repetidos recentemente perdem peso.
  const recent = player.seenEvents.slice(-6);
  const event = rng.weighted(pool, (item) => {
    let weight = item.weight ?? 5;
    if (recent.includes(item.id)) weight *= 0.15;
    return weight;
  });
  return event;
}

function applyEffects(player, effects = {}, rng) {
  const notes = [];

  if (effects.money) {
    const multiplier = effects.money > 0 ? 1 + lifeModifier(player.traits, 'investReturn') * 0.5 : 1;
    const delta = Math.round(effects.money * multiplier);
    player.money = Math.max(0, player.money + delta);
    notes.push(`${delta > 0 ? '+' : ''}${delta.toLocaleString('pt-BR')} €`);
  }

  const lifeKeys = [
    ['happiness', 'Felicidade'],
    ['fitness', 'Forma'],
    ['health', 'Saúde'],
    ['discipline', 'Disciplina'],
    ['intelligence', 'Inteligência'],
    ['charisma', 'Carisma'],
    ['fame', 'Fama'],
    ['reputation', 'Reputação'],
    ['morale', 'Vestiário'],
    ['managerRelation', 'Técnico'],
    ['fanRelation', 'Torcida'],
  ];

  for (const [key, label] of lifeKeys) {
    if (!effects[key]) continue;
    let delta = effects[key];
    if (key === 'fame' && delta > 0) delta *= 1 + lifeModifier(player.traits, 'fameGain');
    if (key === 'morale' && delta > 0) delta *= 1 + lifeModifier(player.traits, 'moraleGain');
    if (key === 'managerRelation' && delta > 0) delta *= 1 + lifeModifier(player.traits, 'managerGain');
    delta = Math.round(delta);
    adjustLife(player, key, delta);
    notes.push(`${label} ${delta > 0 ? '+' : ''}${delta}`);
  }

  if (effects.attr) {
    const ceiling = attributeCeiling(player);
    for (const [id, delta] of Object.entries(effects.attr)) {
      if (player.attributes[id] === undefined) continue;
      player.attributes[id] = clamp(player.attributes[id] + delta, 1, Math.max(ceiling, player.attributes[id]));
      notes.push(`${attributeLabel(id)} ${delta > 0 ? '+' : ''}${delta}`);
    }
  }

  if (effects.skillPoints) {
    player.skillPoints = Math.max(0, player.skillPoints + effects.skillPoints);
    notes.push(`Pontos de evolução ${effects.skillPoints > 0 ? '+' : ''}${effects.skillPoints}`);
  }

  if (effects.potential) {
    player.potential = clamp(player.potential + effects.potential, 50, 99);
    notes.push('Potencial em alta');
  }

  if (effects.injuryWeeks) {
    const weeks = Math.max(1, Math.round(effects.injuryWeeks * (1 + lifeModifier(player.traits, 'injuryRisk') * 0.5)));
    player.injury = { name: 'Lesão', weeks };
    notes.push(`Lesionado por ${weeks} semana(s)`);
  }

  if (effects.addFlag) addFlag(player, effects.addFlag);
  if (effects.removeFlag) removeFlag(player, effects.removeFlag);

  return notes;
}

/** Resolve a escolha do jogador em um evento de vida. */
export function resolveLifeOption(player, event, optionIndex, rng) {
  const option = event.options[optionIndex];
  if (!option) return null;

  if (!player.seenEvents.includes(event.id)) player.seenEvents.push(event.id);

  let effects = option.effects ?? {};
  let text = effects.text ?? '';

  if (option.outcomes?.length) {
    const outcome = rng.weighted(option.outcomes, (item) => item.chance ?? 1);
    effects = outcome.effects ?? {};
    text = effects.text ?? '';
  } else if (option.check) {
    const statValue = player.life[option.check.stat] ?? 50;
    const chance = clamp(0.1 + (statValue - option.check.difficulty) / 100 + 0.4, 0.05, 0.95);
    const success = rng.chance(chance);
    effects = success ? option.success ?? {} : option.failure ?? {};
    text = effects.text ?? '';
  }

  const notes = applyEffects(player, effects, rng);
  return { text, notes, label: option.label };
}

/** Desgaste natural da semana (sem treino/eventos). */
export function weeklyDrift(player, rng) {
  const notes = [];
  adjustLife(player, 'fitness', player.injury ? 2 : -1);
  if (player.life.happiness < 30) adjustLife(player, 'fitness', -2);
  if (player.life.fame > 70 && rng.chance(0.2)) adjustLife(player, 'happiness', -2);
  if (player.life.discipline < 30 && rng.chance(0.25)) {
    adjustLife(player, 'managerRelation', -3);
    notes.push('Sua indisciplina está incomodando a comissão técnica.');
  }
  return notes;
}
