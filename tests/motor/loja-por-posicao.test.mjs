import { Game } from '../../src/core/game.js';
import { shopItemsFor, isPositionItem } from '../../src/engine/shop.js';
import { trainingOptionsFor } from '../../src/engine/training.js';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
for (const pos of ['GOL', 'ZAG', 'LAT', 'VOL', 'MC', 'MEI', 'PON', 'SA', 'ATA']) {
  const g = new Game();
  g.createCareer({ firstName: 'A', lastName: 'B', position: pos, nationality: 'BRA', traits: ['driblador', 'midiatico'], groupPoints: {}, appearance: {} });
  g.acceptTrial(g.state.trials.offers[0].id);
  const p = g.state.player; p.money = 50_000_000;
  const items = shopItemsFor(p);
  const mine = items.filter(isPositionItem).map((i) => i.id);
  for (const item of items) { const r = g.buyItem(item.id); if (!r.ok) ok(false, `${pos} comprar ${item.id}: ${r.reason}`); }
  const trainings = trainingOptionsFor(p).map((o) => o.id);
  const novos = trainings.filter((id) => ['reflexo', 'marcacao', 'paredao', 'artilheiro'].includes(id));
  // roda cada treino uma vez para garantir que nada quebra
  for (const id of trainings) { g.state.week.step = 'treino'; p.injury = null; const r = g.chooseTraining(id); if (!r) ok(false, `${pos} treino ${id}`); }
  console.log(`${pos}: ${items.length} itens (${mine.length} da posição: ${mine.join(', ')}) | treinos da posição: ${novos.join(', ') || '-'}`);
}
ok(true, 'todas as posições compram tudo e treinam tudo sem erro');
