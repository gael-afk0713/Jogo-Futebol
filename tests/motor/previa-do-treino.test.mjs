import { Game } from '../../src/core/game.js';
import { previewTraining, trainingOptionsFor, applyTraining } from '../../src/engine/training.js';
import { createRng } from '../../src/core/rng.js';
import { reviewPotential } from '../../src/engine/progression.js';
import { keyAttributesFor, attributeCeiling } from '../../src/engine/overall.js';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
let checks = 0, wrong = 0;
for (const pos of ['GOL', 'ZAG', 'LAT', 'VOL', 'MC', 'MEI', 'PON', 'SA', 'ATA']) {
  for (let seed = 1; seed <= 6; seed++) {
    const g = new Game();
    g.createCareer({ firstName: 'A', lastName: 'B', position: pos, nationality: 'BRA', traits: ['driblador', 'midiatico'], groupPoints: {}, appearance: {} });
    g.acceptTrial(g.state.trials.offers[0].id);
    const p = g.state.player; p.money = 1e9;
    if (seed % 2) for (const id of ['tablet', 'gps', 'preparador', 'mentor', 'analista', 'academia_casa', 'centro_recuperacao', 'treinador_goleiros', 'treinador_finalizacao', 'coach_visao', 'treinador_defesa', 'rebatedor', 'maquina_bolas', 'fisioterapeuta']) g.buyItem(id);
    p.life.fitness = 20 + seed * 12; p.life.happiness = 30 + seed * 10; p.life.intelligence = 40 + seed * 8;
    for (const id of Object.keys(p.attributes)) p.xp = { ...(p.xp ?? {}), [id]: (seed * 37 + id.length * 11) % 90 };
    for (const option of trainingOptionsFor(p)) {
      const clone = structuredClone(p);
      const prev = previewTraining(clone, option.id);
      const real = structuredClone(p);
      const rep = applyTraining(real, option.id, createRng(seed));
      checks++;
      const attrsOk = prev.attributes.every((r) => real.attributes[r.id] === r.after && (r.after >= prev.ceiling || (real.xp[r.id] ?? 0) === r.progress));
      const lifeOk = prev.life.every((r) => real.life[r.stat] === r.after);
      const xpOk = prev.xp === rep.xp;
      const ptsOk = rep.skillPoints === prev.fixedPoints || rep.skillPoints === prev.fixedPoints + 1;
      if (!(attrsOk && lifeOk && xpOk && ptsOk)) { wrong++; if (wrong < 4) console.log('diferença', pos, option.id, { attrsOk, lifeOk, xpOk, ptsOk }); }
    }
  }
}
ok(wrong === 0, `prévia igual ao treino real em ${checks} combinações (posição × estado × treino)`);

// o caso do usuário: goleiro, potencial 76, teto 78, atributos de goleiro no teto, nota 6,5–7,0
const g = new Game();
g.createCareer({ firstName: 'A', lastName: 'B', position: 'GOL', nationality: 'BRA', traits: ['driblador', 'midiatico'], groupPoints: {}, appearance: {} });
const p = g.state.player; p.age = 22; p.potential = 76;
console.log('principais do GOL:', keyAttributesFor('GOL', 6).join(', '));
for (const id of ['gkDiving', 'gkHandling', 'gkKicking', 'gkPositioning', 'gkReflexes']) p.attributes[id] = attributeCeiling(p);
let ups = 0, total = 0;
for (let s = 0; s < 400; s++) { const q = structuredClone(p); const r = reviewPotential(q, { rating: 6.6 + (s % 5) * 0.1, minutes: 2000 }, createRng(s)); total += r.change; if (r.change > 0) ups++; }
ok(ups / 400 > 0.8, `goleiro travado no teto: potencial sobe em ${Math.round(ups / 4)}% das temporadas (média +${(total / 400).toFixed(1)})`);
