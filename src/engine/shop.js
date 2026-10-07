// Compra e efeitos dos itens: loja de evolução (src/data/shop.js) e loja da
// vida (src/data/lifestyle.js).

import { clamp, money } from '../core/utils.js';
import { SHOP_ITEMS, getShopItem } from '../data/shop.js';

/**
 * Tetos dos bônus somados de todos os itens. Comprar tudo ajuda, mas não
 * transforma ninguém em craque: depois do teto, o item a mais não soma.
 */
export const ITEM_CAPS = {
  attribute: 4,
  xp: 1.8,
  skillPoints: 2,
  injuryRiskFloor: 0.5,
  weeklyFitness: 4,
  restBonus: 10,
  trainingFitness: 4,
  expenseCut: 0.25,
  sponsorBonus: 0.5,
  investBonus: 0.05,
  agingSlowFloor: 0.75,
  weekly: {
    happiness: 2,
    health: 0.5,
    discipline: 1,
    morale: 0.6,
    intelligence: 0.5,
    charisma: 0.5,
    fame: 0.5,
    reputation: 0.5,
    fanRelation: 0.5,
    managerRelation: 0.5,
  },
};

const isInvestment = (item) => item?.kind === 'invest';

/** Investimentos que o jogador tem desse tipo (o save antigo podia repetir). */
export const holdingsOf = (player, id) => (player.assets ?? []).filter((asset) => asset.id === id);

export const holdingValue = (player, id) => holdingsOf(player, id).reduce((sum, asset) => sum + asset.value, 0);

export const ownedItemIds = (player) => new Set([...(player.items ?? []), ...(player.assets ?? []).map((asset) => asset.id)]);

export function ownsItem(player, id) {
  if (isInvestment(getShopItem(id))) return holdingsOf(player, id).length > 0;
  return (player.items ?? []).includes(id);
}

/** Itens da loja de evolução que fazem sentido para a posição do jogador. */
export function shopItemsFor(player) {
  return SHOP_ITEMS.filter((item) => !item.positions || item.positions.includes(player.position));
}

/** Item exclusivo de algumas posições (aparece no grupo "Da sua posição"). */
export const isPositionItem = (item) => Boolean(item.group);

/** Itens ativos do jogador (posses e equipe), já com os dados da loja. */
export function activeItems(player) {
  return (player.items ?? []).map(getShopItem).filter(Boolean);
}

/** Soma os efeitos de todos os itens ativos, respeitando os tetos. */
export function itemEffects(player) {
  const total = {
    attributes: {},
    xp: {},
    skillPoints: {},
    unlocks: new Set(),
    injuryRisk: 1,
    trainingFitness: 0,
    weeklyFitness: 0,
    restBonus: 0,
    fasterHealing: 0,
    weekly: {},
    expenseCut: 0,
    sponsorBonus: 0,
    sponsors: false,
    investBonus: 0,
    agingSlow: 1,
    insight: false,
  };
  for (const item of activeItems(player)) {
    const effects = item.effects ?? {};
    for (const [id, value] of Object.entries(effects.attributes ?? {})) total.attributes[id] = (total.attributes[id] ?? 0) + value;
    for (const [id, value] of Object.entries(effects.xp ?? {})) total.xp[id] = (total.xp[id] ?? 1) * value;
    for (const [id, value] of Object.entries(effects.skillPoints ?? {})) total.skillPoints[id] = (total.skillPoints[id] ?? 0) + value;
    for (const id of effects.unlocks ?? []) total.unlocks.add(id);
    for (const [id, value] of Object.entries(effects.weekly ?? {})) total.weekly[id] = (total.weekly[id] ?? 0) + value;
    if (effects.weeklyHappiness) total.weekly.happiness = (total.weekly.happiness ?? 0) + effects.weeklyHappiness;
    if (effects.injuryRisk) total.injuryRisk *= effects.injuryRisk;
    if (effects.agingSlow) total.agingSlow *= effects.agingSlow;
    total.trainingFitness += effects.trainingFitness ?? 0;
    total.weeklyFitness += effects.weeklyFitness ?? 0;
    total.restBonus += effects.restBonus ?? 0;
    total.expenseCut += effects.expenseCut ?? 0;
    total.sponsorBonus += effects.sponsorBonus ?? 0;
    total.investBonus += effects.investBonus ?? 0;
    if (effects.sponsors) total.sponsors = true;
    if (effects.insight) total.insight = true;
    total.fasterHealing = Math.max(total.fasterHealing, effects.fasterHealing ?? 0);
  }

  for (const id of Object.keys(total.attributes)) total.attributes[id] = Math.min(ITEM_CAPS.attribute, total.attributes[id]);
  for (const id of Object.keys(total.xp)) total.xp[id] = Math.min(ITEM_CAPS.xp, total.xp[id]);
  for (const id of Object.keys(total.skillPoints)) total.skillPoints[id] = Math.min(ITEM_CAPS.skillPoints, total.skillPoints[id]);
  for (const id of Object.keys(total.weekly)) {
    const cap = ITEM_CAPS.weekly[id] ?? 0.5;
    total.weekly[id] = clamp(total.weekly[id], -cap, cap);
  }
  total.injuryRisk = Math.max(ITEM_CAPS.injuryRiskFloor, total.injuryRisk);
  total.agingSlow = Math.max(ITEM_CAPS.agingSlowFloor, total.agingSlow);
  total.weeklyFitness = Math.min(ITEM_CAPS.weeklyFitness, total.weeklyFitness);
  total.restBonus = Math.min(ITEM_CAPS.restBonus, total.restBonus);
  total.trainingFitness = Math.min(ITEM_CAPS.trainingFitness, total.trainingFitness);
  total.expenseCut = Math.min(ITEM_CAPS.expenseCut, total.expenseCut);
  total.sponsorBonus = Math.min(ITEM_CAPS.sponsorBonus, total.sponsorBonus);
  total.investBonus = Math.min(ITEM_CAPS.investBonus, total.investBonus);
  return total;
}

/** Custo semanal da equipe pessoal e dos serviços. */
export function weeklyStaffCost(player) {
  return activeItems(player).reduce((sum, item) => sum + (item.kind === 'staff' ? item.weekly : 0), 0);
}

/** Manutenção semanal das posses (seguro, tripulação, ração...). */
export function weeklyUpkeep(player) {
  return activeItems(player).reduce((sum, item) => sum + (item.kind === 'equip' ? item.upkeep ?? 0 : 0), 0);
}

/** Quanto se recebe vendendo uma posse ou resgatando um investimento agora. */
export function saleValue(player, item) {
  if (!item) return 0;
  if (isInvestment(item)) return Math.round(holdingValue(player, item.id) * (1 - (item.invest.fee ?? 0)));
  if (item.kind === 'equip' && item.resale) return Math.round(item.price * item.resale);
  return 0;
}

/** Valor de revenda das posses (entra no patrimônio). */
export function goodsValue(player) {
  return activeItems(player).reduce((sum, item) => sum + (item.kind === 'equip' && item.resale ? Math.round(item.price * item.resale) : 0), 0);
}

/** O que precisa ter em conta para comprar (equipe: quatro semanas adiantadas). */
export const upfrontCost = (item) => (item.kind === 'staff' ? item.weekly * 4 : item.price);

/** Situação de uma experiência: dá para fazer agora ou falta quanto. */
export function experienceStatus(player, item) {
  const last = player.lastUsed?.[item.id];
  if (last === undefined) return { ready: true, weeksLeft: 0, done: false };
  if (item.once) return { ready: false, weeksLeft: 0, done: true };
  const weeksLeft = Math.max(0, item.cooldown - ((player.clock ?? 0) - last));
  return { ready: weeksLeft === 0, weeksLeft, done: false };
}

/** Muda a vida com o arredondamento e o limite de 0 a 100 de sempre. */
function applyLife(player, changes = {}) {
  const applied = {};
  for (const [stat, delta] of Object.entries(changes)) {
    if (!(stat in player.life) || !delta) continue;
    player.life[stat] = clamp(Math.round(player.life[stat] + delta), 0, 100);
    applied[stat] = delta;
  }
  return applied;
}

const random = (rng) => rng ?? { chance: (p) => Math.random() < p, float: (a, b) => a + Math.random() * (b - a) };

/**
 * Compra um item, contrata alguém, vive uma experiência ou investe.
 * O efeito na vida (onBuy) das posses só vale na primeira compra, para não
 * dar para comprar e vender o mesmo relógio atrás de fama.
 */
export function buyItem(player, id, { rng } = {}) {
  const item = getShopItem(id);
  if (!item) return { ok: false, reason: 'Item inválido.' };
  if (item.positions && !item.positions.includes(player.position)) return { ok: false, reason: 'Não serve para a sua posição.' };
  if (item.minAge && player.age < item.minAge) return { ok: false, reason: `Disponível a partir dos ${item.minAge} anos.` };

  const experience = item.kind === 'experience';
  if (experience) {
    const status = experienceStatus(player, item);
    if (status.done) return { ok: false, reason: 'Você já fez isso.' };
    if (!status.ready) return { ok: false, reason: `Dá para repetir em ${status.weeksLeft} ${status.weeksLeft === 1 ? 'semana' : 'semanas'}.` };
  } else if (ownsItem(player, id)) {
    return { ok: false, reason: 'Você já tem isso.' };
  }

  const upfront = upfrontCost(item);
  if (player.money < upfront) return { ok: false, reason: `Você precisa de ${money(upfront)} para isso.` };
  player.money -= upfront;

  const history = new Set(player.itemHistory ?? []);
  const firstTime = !history.has(id);
  let life = {};
  let mishap = null;

  if (experience) {
    player.lastUsed = { ...(player.lastUsed ?? {}), [id]: player.clock ?? 0 };
    life = applyLife(player, item.onBuy);
    if (item.risk && random(rng).chance(item.risk.chance)) {
      applyLife(player, item.risk.onBuy);
      mishap = item.risk.text;
    }
  } else {
    if (isInvestment(item)) {
      player.assets = [...(player.assets ?? []), { id, label: item.label, value: upfront, boughtAt: player.clock ?? 0 }];
    } else {
      player.items = [...(player.items ?? []), id];
    }
    if (firstTime) life = applyLife(player, item.onBuy);
  }

  if (firstTime) player.itemHistory = [...history, id];
  return { ok: true, item, paid: upfront, life, mishap };
}

/** Vende uma posse ou resgata um investimento pelo valor de agora. */
export function sellItem(player, id) {
  const item = getShopItem(id);
  if (!item || !ownsItem(player, id)) return { ok: false, reason: 'Você não tem isso.' };
  const value = saleValue(player, item);
  if (isInvestment(item)) {
    player.assets = player.assets.filter((asset) => asset.id !== id);
  } else {
    if (item.kind !== 'equip' || !item.resale) return { ok: false, reason: 'Isso não dá para vender.' };
    player.items = player.items.filter((owned) => owned !== id);
  }
  player.money += value;
  return { ok: true, item, value };
}

/** Dispensa alguém da equipe pessoal (equipamento não se devolve). */
export function dismissStaff(player, id) {
  const item = getShopItem(id);
  if (!item || item.kind !== 'staff' || !ownsItem(player, id)) return { ok: false, reason: 'Ninguém para dispensar.' };
  player.items = player.items.filter((owned) => owned !== id);
  return { ok: true, item };
}

/** Valor quebrado vira chance: 0.25 por semana = +1 a cada quatro, em média. */
function rollWhole(value, rng) {
  const whole = Math.trunc(value);
  const rest = Math.abs(value - whole);
  return whole + (rest && rng.chance(rest) ? Math.sign(value) : 0);
}

/** Efeitos semanais dos itens na vida (felicidade, forma, disciplina...). */
export function applyWeeklyItems(player, rng) {
  const effects = itemEffects(player);
  const dice = random(rng);
  const changes = {};
  for (const [stat, value] of Object.entries(effects.weekly)) {
    const delta = rollWhole(value, dice);
    if (delta) changes[stat] = delta;
  }
  const fitness = rollWhole(effects.weeklyFitness, dice);
  if (fitness) changes.fitness = (changes.fitness ?? 0) + fitness;
  applyLife(player, changes);
  return { effects, changes };
}
