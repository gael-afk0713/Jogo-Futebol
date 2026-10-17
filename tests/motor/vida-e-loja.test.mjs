import { Game } from '../../src/core/game.js';
import { LIFESTYLE_ITEMS, LIFESTYLE_CATEGORIES } from '../../src/data/lifestyle.js';
import { SHOP_ITEMS, getShopItem } from '../../src/data/shop.js';
import { ITEM_CAPS, itemEffects, ownsItem, upfrontCost, experienceStatus, applyWeeklyItems, saleValue } from '../../src/engine/shop.js';
import { expenseBreakdown, netWorth, settleInvestments, weeklySponsors } from '../../src/engine/finance.js';
import { createRng } from '../../src/core/rng.js';
import { ICONS } from '../../src/ui/icons.js';

const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const career = (position = 'ATA', seed = 7) => {
  const g = new Game();
  g.createCareer({ firstName: 'A', lastName: 'B', position, nationality: 'BRA', traits: [], groupPoints: {}, appearance: {}, seed });
  g.acceptTrial(g.state.trials.offers[0].id);
  return g;
};

// ---------------------------------------------------------------- catálogo
const legacy = ['poupanca', 'imovel', 'empresa', 'escolinha'];
const fresh = LIFESTYLE_ITEMS.filter((i) => !legacy.includes(i.id));
ok(fresh.length === 150, `150 itens novos (${fresh.length})`);
const ids = [...SHOP_ITEMS, ...LIFESTYLE_ITEMS].map((i) => i.id);
ok(new Set(ids).size === ids.length, 'nenhum id repetido entre as duas lojas');
ok(LIFESTYLE_ITEMS.every((i) => ICONS[i.icon]) && LIFESTYLE_CATEGORIES.every((c) => ICONS[c.icon]), 'todos os ícones existem');
ok(LIFESTYLE_ITEMS.every((i) => LIFESTYLE_CATEGORIES.some((c) => c.id === i.cat)), 'todo item tem categoria válida');
const costs = LIFESTYLE_ITEMS.map(upfrontCost).sort((a, b) => a - b);
ok(costs[0] <= 300 && costs.at(-1) >= 100_000_000, `preços de ${costs[0]} a ${costs.at(-1)}`);
const tiers = { 'até 10 mil': 0, '10 mil a 1 mi': 0, '1 a 20 mi': 0, 'mais de 20 mi': 0 };
for (const c of costs) tiers[c <= 10_000 ? 'até 10 mil' : c <= 1_000_000 ? '10 mil a 1 mi' : c <= 20_000_000 ? '1 a 20 mi' : 'mais de 20 mi'] += 1;
console.log('   faixas de preço:', JSON.stringify(tiers));
ok(Object.values(tiers).every((n) => n >= 10), 'todas as faixas de preço têm pelo menos 10 itens');

// ------------------------------------------------------------ compra e venda
{
  const g = career();
  const p = g.state.player;
  p.money = 0;
  ok(!g.buyItem('videogame').ok, 'sem dinheiro não compra');
  p.money = 1_000_000;
  const happy = p.life.happiness;
  ok(g.buyItem('videogame').ok && p.money === 1_000_000 - 600 && ownsItem(p, 'videogame'), 'compra o videogame');
  ok(p.life.happiness === Math.min(100, happy + 4), 'videogame dá +4 felicidade na compra');
  ok(!g.buyItem('videogame').ok, 'não compra o mesmo item duas vezes');
  const sold = g.sellItem('videogame');
  ok(sold.ok && sold.value === 240 && !ownsItem(p, 'videogame'), 'vende por 40%');
  const h2 = p.life.happiness;
  g.buyItem('videogame');
  ok(p.life.happiness === h2, 'recomprar não repete o bônus da compra');
  g.buyItem('cachorro');
  ok(!g.sellItem('cachorro').ok, 'cachorro não se vende');
  ok(g.buyItem('streaming').ok && p.money === 1_000_000 - 600 + 240 - 600 - 1_500 - 60, 'serviço cobra 4 semanas adiantadas');
  ok(g.dismissStaff('streaming').ok && !ownsItem(p, 'streaming'), 'cancela o serviço');
  p.age = 22;
  ok(!g.buyItem('licenca_treinador').ok, 'licença de treinador só a partir dos 27');
  p.age = 27; p.money = 10_000_000;
  ok(g.buyItem('licenca_treinador').ok, 'aos 27 pode');
}

// ---------------------------------------------------------------- experiências
{
  const g = career();
  const p = g.state.player;
  p.money = 10_000_000;
  p.life.fitness = 50;
  ok(g.buyItem('fds_praia').ok && p.life.fitness === 53, 'fim de semana na praia dá +3 de forma');
  ok(!g.buyItem('fds_praia').ok, 'não repete antes da recarga');
  ok(experienceStatus(p, getShopItem('fds_praia')).weeksLeft === 6, 'faltam 6 semanas');
  p.clock = (p.clock ?? 0) + 6;
  ok(g.buyItem('fds_praia').ok, 'depois de 6 semanas pode de novo');
  ok(g.buyItem('autobiografia').ok && !g.buyItem('autobiografia').ok, 'autobiografia só uma vez');
  p.clock += 500;
  ok(!g.buyItem('autobiografia').ok && experienceStatus(p, getShopItem('autobiografia')).done, 'nem muito tempo depois');
  ok(!ownsItem(p, 'fds_praia'), 'experiência não vira posse');
  let mishaps = 0;
  for (let i = 0; i < 400; i += 1) { p.clock += 10; p.money = 1e7; if (g.buyItem('balada').mishap) mishaps += 1; }
  ok(mishaps > 50 && mishaps < 110, `balada dá ruim ~20% das vezes (${mishaps}/400)`);
}

// --------------------------------------------------------------------- tetos
{
  const g = career('GOL');
  const p = g.state.player;
  p.age = 30;
  for (const item of [...SHOP_ITEMS, ...LIFESTYLE_ITEMS]) {
    if (item.kind === 'experience') continue;
    p.money = 1e12;
    g.buyItem(item.id);
  }
  const fx = itemEffects(p);
  ok(Object.values(fx.attributes).every((v) => v <= ITEM_CAPS.attribute), `atributos até +${ITEM_CAPS.attribute} (${JSON.stringify(fx.attributes)})`);
  ok(Object.values(fx.xp).every((v) => v <= ITEM_CAPS.xp), 'XP por treino com teto');
  ok(fx.injuryRisk >= ITEM_CAPS.injuryRiskFloor, `risco de lesão no mínimo ${ITEM_CAPS.injuryRiskFloor} (${fx.injuryRisk.toFixed(2)})`);
  ok(Object.entries(fx.weekly).every(([id, v]) => Math.abs(v) <= (ITEM_CAPS.weekly[id] ?? 0.5)), `semanais com teto ${JSON.stringify(fx.weekly)}`);
  ok(fx.agingSlow >= ITEM_CAPS.agingSlowFloor && fx.expenseCut <= ITEM_CAPS.expenseCut && fx.investBonus <= ITEM_CAPS.investBonus, 'longevidade, contador e investimento com teto');
  const rng = createRng(3);
  for (let w = 0; w < 200; w += 1) applyWeeklyItems(p, rng);
  ok(Object.values(p.life).every((v) => Number.isInteger(v) && v >= 0 && v <= 100), 'vida continua inteira entre 0 e 100');
  const exp = expenseBreakdown(p);
  ok(exp.upkeep > 900_000 && exp.total === exp.living + exp.staff + exp.upkeep, `manutenção de tudo: ${exp.upkeep}/semana`);
  ok(netWorth(p) > p.money, 'posses entram no patrimônio');
  const items = p.items.length;
  ok(items > 70, `tem ${items} itens`);
}

// --------------------------------------------------------------- patrocínio
{
  const g = career();
  const p = g.state.player;
  p.flags = p.flags.filter((f) => f !== 'patrocinio');
  p.life.fame = 60; p.money = 1e7;
  ok(weeklySponsors(p) === 0, 'sem contrato, sem patrocínio');
  g.buyItem('agencia_patrocinio');
  ok(weeklySponsors(p) === Math.round(60 * 95 * 1.1), `agência traz patrocínio (${weeklySponsors(p)})`);
}

// ----------------------------------------------------- retorno esperado
{
  const rng = createRng(11);
  const rows = [];
  for (const item of LIFESTYLE_ITEMS.filter((i) => i.kind === 'invest')) {
    const p = { assets: [], money: 0, traits: [], life: { fame: 60 }, items: [] };
    let total = 0;
    const years = 3000;
    for (let y = 0; y < years; y += 1) {
      p.assets = [{ id: item.id, label: item.label, value: 1_000_000 }];
      p.money = 0;
      settleInvestments(p, rng);
      total += p.money + (p.assets[0]?.value ?? 0) - 1_000_000;
    }
    rows.push([item.id, total / years / 1_000_000]);
  }
  rows.sort((a, b) => b[1] - a[1]);
  console.log('   retorno médio anual:', rows.map(([id, r]) => `${id} ${(r * 100).toFixed(1)}%`).join(', '));
  ok(rows.every(([, r]) => r < 0.16), 'nenhum investimento rende mais de 16% ao ano em média');
  ok(rows.every(([, r]) => r > -0.02), 'nenhum investimento perde dinheiro em média');
}

// ------------------------------------------------------- save antigo
{
  const g = career();
  const p = g.state.player;
  delete p.clock; delete p.lastUsed; delete p.itemHistory;
  p.assets = [{ id: 'imovel', label: 'Apartamento para alugar', value: 300_000 }, { id: 'imovel', label: 'Apartamento para alugar', value: 330_000 }, { id: 'sumiu', label: 'Coisa antiga', value: 5 }];
  ok(ownsItem(p, 'imovel') && saleValue(p, getShopItem('imovel')) === Math.round(630_000 * 0.95), 'save antigo com duas cotas resgata as duas');
  const r = settleInvestments(p, createRng(5));
  ok(r.lines.length === 2 && p.assets.some((a) => a.id === 'sumiu'), 'investimento desconhecido fica guardado sem quebrar');
  p.money = 1e6;
  ok(g.buyItem('kart').ok && p.lastUsed.kart === 0, 'experiência funciona sem relógio no save');
  g.state.week.step = 'fim';
  g.advanceWeek();
  ok(p.clock === 1, 'relógio da carreira anda com a semana');
}
