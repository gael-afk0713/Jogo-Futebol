// Dinheiro: salários, estilo de vida, patrocínios e investimentos.

import { clamp } from '../core/utils.js';
import { lifeModifier } from '../data/traits.js';
import { adjustLife, hasFlag } from './player.js';
import { getShopItem } from '../data/shop.js';
import { goodsValue, itemEffects, weeklyStaffCost, weeklyUpkeep } from './shop.js';

/**
 * Gastos da semana separados: custo de vida (cresce com a fama e os luxos,
 * o contador corta uma parte), equipe e serviços, e manutenção das posses.
 */
export function expenseBreakdown(player) {
  const base = 250 + player.life.fame * 22;
  const luxury = (hasFlag(player, 'carro_luxo') ? 900 : 0) + (hasFlag(player, 'casado') ? 600 : 0) + (hasFlag(player, 'filhos') ? 700 : 0);
  const agent = hasFlag(player, 'super_agente') ? (player.contract?.weeklySalary ?? 0) * 0.08 : (player.contract?.weeklySalary ?? 0) * 0.04;
  const living = Math.round((base + luxury + agent) * (1 - itemEffects(player).expenseCut));
  const staff = weeklyStaffCost(player);
  const upkeep = weeklyUpkeep(player);
  return { living, staff, upkeep, total: living + staff + upkeep };
}

/** Gasto semanal total. */
export const weeklyExpenses = (player) => expenseBreakdown(player).total;

/** Receita semanal de patrocínios. */
export function weeklySponsors(player) {
  const gear = itemEffects(player);
  if (!hasFlag(player, 'patrocinio') && !gear.sponsors) return 0;
  return Math.round(player.life.fame * 95 * (1 + lifeModifier(player.traits, 'contractBonus') + gear.sponsorBonus));
}

/** Movimentação financeira de uma semana. */
export function applyWeeklyFinance(player) {
  const salary = player.injury ? Math.round((player.contract?.weeklySalary ?? 0) * 0.9) : player.contract?.weeklySalary ?? 0;
  const sponsors = weeklySponsors(player);
  const expenses = weeklyExpenses(player);
  const net = salary + sponsors - expenses;
  player.money = Math.max(0, player.money + net);

  if (player.money <= 0 && net < 0) {
    adjustLife(player, 'happiness', -4);
  }
  return { salary, sponsors, expenses, net };
}

/** Bônus por resultado de partida. */
export function matchBonus(player, report) {
  const weekly = player.contract?.weeklySalary ?? 0;
  let bonus = 0;
  if (report.result === 'V') bonus += weekly * 0.18;
  if (report.motm) bonus += weekly * 0.12;
  bonus += report.stats.goals * weekly * 0.1;
  bonus += report.stats.assists * weekly * 0.05;
  const total = Math.round(bonus);
  player.money += total;
  return total;
}

/**
 * Fechamento anual dos investimentos e da coleção (src/data/lifestyle.js):
 * cada um paga o rendimento em dinheiro e muda de valor. Ano ruim derruba o
 * valor e não paga nada; os mais arriscados podem quebrar de vez.
 */
export function settleInvestments(player, rng) {
  if (!player.assets?.length) return { total: 0, change: 0, lines: [] };
  const trait = lifeModifier(player.traits, 'investReturn');
  const bonus = itemEffects(player).investBonus;
  const fameFactor = clamp(player.life.fame / 60, 0.3, 1.6);
  const lines = [];
  const kept = [];
  let total = 0;
  let change = 0;

  for (const asset of player.assets) {
    const item = getShopItem(asset.id);
    const plan = item?.invest;
    if (!plan) {
      kept.push(asset);
      continue;
    }
    if (plan.bust && rng.chance(plan.bust)) {
      change -= asset.value;
      lines.push({ label: asset.label, value: 0, change: -asset.value, worth: 0, bust: true });
      continue;
    }
    const bad = rng.chance(clamp(plan.risk - trait * 0.2, 0, 0.6));
    const growth = bad ? rng.float(plan.crash[0], plan.crash[1]) : rng.float(plan.growth[0], plan.growth[1]) + bonus;
    const rate = bad ? 0 : rng.float(plan.yield[0], plan.yield[1]) * (plan.fameScaled ? fameFactor : 1) * (1 + trait * 0.25);
    const dividend = Math.round(asset.value * rate);
    const worth = Math.max(0, Math.round(asset.value * growth));
    total += dividend;
    change += worth - asset.value;
    lines.push({ label: asset.label, value: dividend, change: worth - asset.value, worth, blewUp: bad });
    kept.push({ ...asset, value: worth });
  }

  player.assets = kept;
  player.money += total;
  return { total, change, lines };
}

/** Dinheiro em conta + investimentos + o que as posses valem na revenda. */
export const netWorth = (player) =>
  player.money + (player.assets ?? []).reduce((acc, asset) => acc + asset.value, 0) + goodsValue(player);
