// Compra e efeitos dos itens da loja (src/data/shop.js).

import { money } from '../core/utils.js';
import { SHOP_ITEMS, getShopItem } from '../data/shop.js';

export const ownedItemIds = (player) => new Set(player.items ?? []);

export const ownsItem = (player, id) => (player.items ?? []).includes(id);

/** Itens que fazem sentido para a posição do jogador. */
export function shopItemsFor(player) {
  return SHOP_ITEMS.filter((item) => !item.positions || item.positions.includes(player.position));
}

/** Item exclusivo de algumas posições (aparece no grupo "Da sua posição"). */
export const isPositionItem = (item) => Boolean(item.group);

/** Itens ativos do jogador, já com os dados da loja. */
export function activeItems(player) {
  return (player.items ?? []).map(getShopItem).filter(Boolean);
}

/** Soma os efeitos de todos os itens ativos. */
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
    weeklyHappiness: 0,
    insight: false,
  };
  for (const item of activeItems(player)) {
    const effects = item.effects ?? {};
    for (const [id, value] of Object.entries(effects.attributes ?? {})) total.attributes[id] = (total.attributes[id] ?? 0) + value;
    for (const [id, value] of Object.entries(effects.xp ?? {})) total.xp[id] = (total.xp[id] ?? 1) * value;
    for (const [id, value] of Object.entries(effects.skillPoints ?? {})) total.skillPoints[id] = (total.skillPoints[id] ?? 0) + value;
    for (const id of effects.unlocks ?? []) total.unlocks.add(id);
    if (effects.injuryRisk) total.injuryRisk *= effects.injuryRisk;
    total.trainingFitness += effects.trainingFitness ?? 0;
    total.weeklyFitness += effects.weeklyFitness ?? 0;
    total.restBonus += effects.restBonus ?? 0;
    total.weeklyHappiness += effects.weeklyHappiness ?? 0;
    if (effects.insight) total.insight = true;
    total.fasterHealing = Math.max(total.fasterHealing, effects.fasterHealing ?? 0);
  }
  return total;
}

/** Custo semanal da equipe pessoal. */
export function weeklyStaffCost(player) {
  return activeItems(player).reduce((sum, item) => sum + (item.kind === 'staff' ? item.weekly : 0), 0);
}

/** Compra um equipamento ou contrata alguém da equipe. */
export function buyItem(player, id) {
  const item = getShopItem(id);
  if (!item) return { ok: false, reason: 'Item inválido.' };
  if (ownsItem(player, id)) return { ok: false, reason: 'Você já tem isso.' };
  if (!shopItemsFor(player).includes(item)) return { ok: false, reason: 'Não serve para a sua posição.' };
  // Equipe: pede quatro semanas de salário adiantadas para contratar.
  const upfront = item.kind === 'staff' ? item.weekly * 4 : item.price;
  if (player.money < upfront) {
    return { ok: false, reason: `Você precisa de ${money(upfront)} para isso.` };
  }
  player.money -= upfront;
  player.items = [...(player.items ?? []), id];
  return { ok: true, item, paid: upfront };
}

/** Dispensa alguém da equipe pessoal (equipamento não se devolve). */
export function dismissStaff(player, id) {
  const item = getShopItem(id);
  if (!item || item.kind !== 'staff' || !ownsItem(player, id)) return { ok: false, reason: 'Ninguém para dispensar.' };
  player.items = player.items.filter((owned) => owned !== id);
  return { ok: true, item };
}
