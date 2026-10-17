import { MOMENTS } from '../../src/data/matchMoments.js';
import { ATTRIBUTE_IDS } from '../../src/data/attributes.js';
import { createMatch, advance, choose, successChance } from '../../src/engine/match.js';
import { createPlayer } from '../../src/engine/player.js';
import { createRng } from '../../src/core/rng.js';
import { ALL_CLUBS, squadRating } from '../../src/data/clubs.js';
import { trainingOptionsFor } from '../../src/engine/training.js';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const bad = MOMENTS.flatMap((m) => m.options.flatMap((o) => (o.attrs ?? []).filter((a) => !ATTRIBUTE_IDS.includes(a)).map((a) => `${m.id}:${a}`)));
ok(!bad.length, `todos os atributos dos lances existem ${bad.join(' ')}`);
const GK = ['gkDiving', 'gkHandling', 'gkKicking', 'gkPositioning', 'gkReflexes'];
const gkMoments = MOMENTS.filter((m) => m.zones.includes('gol'));
const mixed = gkMoments.filter((m) => m.options.some((o) => (o.attrs ?? []).some((a) => !GK.includes(a))));
console.log(`lances do goleiro: ${gkMoments.length}, com atributos de linha: ${mixed.length}`);
const pool = ALL_CLUBS.filter((c) => Math.abs(squadRating(c.id) - 74) <= 1);
function gk(outfield) {
  const p = createPlayer({ firstName: 'A', lastName: 'B', position: 'GOL', nationality: 'BRA', traits: [], groupPoints: {}, appearance: {} }, createRng(3));
  for (const id of ATTRIBUTE_IDS) p.attributes[id] = GK.includes(id) ? 78 : outfield;
  p.life.fitness = 75; p.life.morale = 60; p.life.happiness = 70;
  return p;
}
const seen = {};
for (const outfield of [45, 60, 75]) {
  const p = gk(outfield); let sum = 0, n = 0;
  for (let i = 0; i < 500; i++) {
    const rng = createRng(9000 + i);
    const own = pool[i % pool.length], rival = pool[(i * 5 + 2) % pool.length]; if (own.id === rival.id) continue;
    p.club = own.id;
    const m = createMatch({ player: p, clubId: own.id, opponentId: rival.id, competition: { name: 'x' }, isHome: i % 2 === 0, role: 'titular', rng });
    let step = advance(m, p, rng);
    while (step.type === 'moment') {
      seen[m.pending.id] = (seen[m.pending.id] ?? 0) + 1;
      // escolhe a opção com maior chance (como um jogador cuidadoso)
      const best = m.pending.options.reduce((a, b) => (b.chance > a.chance ? b : a));
      choose(m, p, best.index, rng);
      step = advance(m, p, rng);
    }
    sum += m.rating; n++;
  }
  console.log(`atributos de linha ${outfield}: nota média ${(sum / n).toFixed(2)}`);
}
console.log('lances sorteados:', Object.entries(seen).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
const g = gk(50); g.position = 'GOL';
ok(trainingOptionsFor(g).some((o) => o.id === 'jogo_pes') && !trainingOptionsFor({ ...g, position: 'ATA' }).some((o) => o.id === 'jogo_pes'), 'treino "Jogo com os pés" só para goleiro');
