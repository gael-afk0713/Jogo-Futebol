// Dinheiro: salários, estilo de vida, patrocínios e investimentos.

import { clamp, money } from '../core/utils.js';
import { lifeModifier } from '../data/traits.js';
import { adjustLife, hasFlag } from './player.js';

/** Gasto semanal com estilo de vida, proporcional à fama e aos luxos. */
export function weeklyExpenses(player) {
  const base = 250 + player.life.fame * 22;
  const luxury = (hasFlag(player, 'carro_luxo') ? 900 : 0) + (hasFlag(player, 'casado') ? 600 : 0) + (hasFlag(player, 'filhos') ? 700 : 0);
  const agent = hasFlag(player, 'super_agente') ? (player.contract?.weeklySalary ?? 0) * 0.08 : (player.contract?.weeklySalary ?? 0) * 0.04;
  return Math.round(base + luxury + agent);
}

/** Receita semanal de patrocínios. */
export function weeklySponsors(player) {
  if (!hasFlag(player, 'patrocinio')) return 0;
  return Math.round(player.life.fame * 95 * (1 + lifeModifier(player.traits, 'contractBonus')));
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

export const INVESTMENTS = [
  {
    id: 'poupanca',
    label: 'Renda fixa',
    icon: 'coins',
    cost: 50_000,
    description: 'Rende pouco, mas quase nunca dá problema.',
    minReturn: 1.02,
    maxReturn: 1.1,
    risk: 0.03,
  },
  {
    id: 'imovel',
    label: 'Apartamento para alugar',
    icon: 'buildings',
    cost: 300_000,
    description: 'Renda passiva estável e valorização no longo prazo.',
    minReturn: 1.05,
    maxReturn: 1.22,
    risk: 0.08,
  },
  {
    id: 'empresa',
    label: 'Sociedade em uma empresa',
    icon: 'chart-line-up',
    cost: 800_000,
    description: 'Pode multiplicar ou virar pó.',
    minReturn: 0.6,
    maxReturn: 2.1,
    risk: 0.3,
  },
  {
    id: 'escolinha',
    label: 'Escolinha de futebol',
    icon: 'soccer-ball',
    cost: 150_000,
    description: 'Dá lucro modesto e melhora muito a sua reputação.',
    minReturn: 1.0,
    maxReturn: 1.18,
    risk: 0.06,
    reputation: 10,
  },
];

/** Compra um investimento. */
export function invest(player, investmentId) {
  const investment = INVESTMENTS.find((item) => item.id === investmentId);
  if (!investment) return { ok: false, reason: 'Investimento inválido.' };
  if (player.money < investment.cost) {
    return { ok: false, reason: `Você precisa de ${money(investment.cost)} para isso.` };
  }
  player.money -= investment.cost;
  if (!player.assets) player.assets = [];
  player.assets.push({ id: investment.id, label: investment.label, value: investment.cost, boughtAt: Date.now() });
  if (investment.reputation) adjustLife(player, 'reputation', investment.reputation);
  return { ok: true, investment };
}

/** Rendimento anual dos investimentos. */
export function settleInvestments(player, rng) {
  if (!player.assets?.length) return { total: 0, lines: [] };
  const bonus = lifeModifier(player.traits, 'investReturn');
  const lines = [];
  let total = 0;

  for (const asset of player.assets) {
    const investment = INVESTMENTS.find((item) => item.id === asset.id);
    if (!investment) continue;
    const blewUp = rng.chance(clamp(investment.risk - bonus * 0.2, 0, 0.5));
    const factor = blewUp
      ? rng.float(0.5, 0.85)
      : rng.float(investment.minReturn, investment.maxReturn) * (1 + bonus * 0.25);
    const newValue = Math.round(asset.value * factor);
    const delta = newValue - asset.value;
    asset.value = newValue;
    total += delta;
    lines.push({ label: asset.label, value: delta, blewUp });
  }

  player.money = Math.max(0, player.money + total);
  return { total, lines };
}

export const netWorth = (player) =>
  player.money + (player.assets ?? []).reduce((acc, asset) => acc + asset.value, 0);
