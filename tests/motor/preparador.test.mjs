import { Game } from '../../src/core/game.js';
import { recommendTraining } from '../../src/engine/coach.js';
import { trainingOptionsFor } from '../../src/engine/training.js';
import { attributeCeiling } from '../../src/engine/overall.js';
import { createRng } from '../../src/core/rng.js';

const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const mk = (position, seed = 3) => { const g = new Game(); g.createCareer({ firstName: 'A', lastName: 'B', position, nationality: 'BRA', traits: [], groupPoints: {}, appearance: {}, seed }); g.acceptTrial(g.state.trials.offers[0].id); return g; };
const say = (r) => `${r.best.id}: ${r.reasons.join(' | ')}`;
const RECOVERY = ['descanso', 'crioterapia', 'livre'];

{
  const p = mk('ATA').state.player;
  p.life.fitness = 85; p.life.happiness = 80; p.life.managerRelation = 60;
  const r = recommendTraining(p, { hasMatch: true });
  ok(!RECOVERY.includes(r.best.id), `bem e descansado: evolui (${say(r)})`);
  const before = JSON.stringify(p);
  recommendTraining(p, { hasMatch: false });
  ok(JSON.stringify(p) === before, 'recomendar não muda o jogador');
  p.life.fitness = 36;
  const tired = recommendTraining(p, { hasMatch: true });
  ok(RECOVERY.includes(tired.best.id) && /forma/.test(tired.reasons[0]), `forma 36 com jogo: recupera (${say(tired)})`);
  p.life.fitness = 85; p.life.happiness = 12;
  const sad = recommendTraining(p, { hasMatch: true });
  ok(['livre', 'descanso'].includes(sad.best.id), `felicidade 12: folga ou descanso (${say(sad)})`);
  p.life.happiness = 80;
  p.injury = { name: 'x', weeks: 2 };
  const hurt = recommendTraining(p, { hasMatch: true });
  ok(hurt.best.id === 'descanso' && /machucado/.test(hurt.reasons[0]), `machucado: descanso (${say(hurt)})`);
}

{
  // Com jogo, descansa mais cedo do que sem jogo.
  const p = mk('MEI').state.player;
  p.life.happiness = 80; p.life.managerRelation = 60;
  const firstRest = (hasMatch) => { for (let f = 80; f >= 0; f -= 1) { p.life.fitness = f; if (RECOVERY.includes(recommendTraining(p, { hasMatch }).best.id)) return f; } return -1; };
  const withMatch = firstRest(true), free = firstRest(false);
  ok(withMatch > free && withMatch >= 42 && withMatch <= 58, `pede descanso abaixo de ${withMatch} com jogo e de ${free} sem jogo`);
}

{
  const g = mk('GOL');
  const p = g.state.player;
  p.life.fitness = 85; p.life.happiness = 80; p.life.managerRelation = 60;
  const ceil = attributeCeiling(p);
  for (const id of Object.keys(p.attributes)) if (id.startsWith('gk')) p.attributes[id] = ceil;
  const r = recommendTraining(p, { hasMatch: true });
  const gkTrainings = ['goleiro', 'gk_posicionamento', 'gk_maos'];
  ok(!gkTrainings.includes(r.best.id) && r.best.capped < r.best.rows.length, `goleiro com tudo de goleiro no teto: treina outra coisa (${say(r)})`);
  ok(gkTrainings.every((id) => r.ranked.find((e) => e.id === id).capped >= 2), 'os três treinos de goleiro aparecem com os atributos no teto');
}

{
  // Goleiro: três treinos específicos, sem o técnico genérico.
  const p = mk('GOL').state.player;
  const ids = trainingOptionsFor(p).map((o) => o.id);
  ok(['goleiro', 'gk_posicionamento', 'gk_maos', 'jogo_pes'].every((id) => ids.includes(id)) && !ids.includes('tecnico'), `treinos do goleiro: ${ids.join(', ')}`);
  ok(['gkRushing', 'gkAerial', 'gkCommand'].every((id) => typeof p.attributes[id] === 'number'), 'goleiro novo já nasce com saída do gol, jogo aéreo e comando de área');
  const outfield = mk('ATA').state.player;
  ok(!trainingOptionsFor(outfield).some((o) => o.id.startsWith('gk_')) && outfield.attributes.gkAerial < 35, 'jogador de linha não vê treino de goleiro e tem atributos de goleiro baixos');
}

{
  // Save antigo de goleiro, sem os atributos novos.
  const g = mk('GOL');
  const p = g.state.player;
  for (const id of ['gkReflexes', 'gkDiving', 'gkPositioning', 'gkHandling', 'gkKicking']) p.attributes[id] = 78;
  delete p.attributes.gkRushing; delete p.attributes.gkAerial; delete p.attributes.gkCommand;
  const saved = g.serialize();
  const g2 = new Game();
  ok(g2.load(saved), 'save antigo carrega');
  const q = g2.state.player;
  ok(q.attributes.gkRushing === 73 && q.attributes.gkAerial === 73 && q.attributes.gkCommand === 73, `atributos novos do goleiro: ${q.attributes.gkRushing}, ${q.attributes.gkAerial}, ${q.attributes.gkCommand} (média 78 - 5)`);
  ok(Number.isFinite(q.overall) && q.overall > 60, `overall recalculado: ${q.overall}`);
}

{
  // Com a loja: crioterapia ganha do descanso quando a forma cai.
  const g = mk('ZAG');
  const p = g.state.player;
  p.money = 1e7; g.buyItem('centro_recuperacao');
  p.life.fitness = 35; p.life.happiness = 80;
  ok(recommendTraining(p, { hasMatch: true }).best.id === 'crioterapia', 'com o centro de recuperação, forma baixa pede crioterapia');
}

{
  // Nunca recomenda o que você não pode fazer, em mil situações aleatórias.
  const rng = createRng(9);
  let bad = 0, empty = 0;
  for (let i = 0; i < 1000; i += 1) {
    const pos = rng.pick(['GOL', 'ZAG', 'LAT', 'VOL', 'MC', 'MEI', 'PON', 'SA', 'ATA']);
    const p = mk(pos, i).state.player;
    for (const k of Object.keys(p.life)) p.life[k] = rng.int(0, 100);
    for (const id of Object.keys(p.attributes)) if (rng.chance(0.3)) p.attributes[id] = attributeCeiling(p);
    const r = recommendTraining(p, { hasMatch: rng.chance(0.7) });
    if (!trainingOptionsFor(p).some((o) => o.id === r.best.id)) bad += 1;
    if (!r.reasons.length || r.reasons.some((t) => !t || t.includes('undefined') || t.includes('NaN'))) empty += 1;
  }
  ok(bad === 0, 'sempre recomenda um treino disponível');
  ok(empty === 0, 'sempre explica o porquê, sem texto quebrado');
}

{
  // A simulação segue o preparador.
  const g = mk('ATA');
  g.state.player.life.fitness = 30;
  g.state.player.life.happiness = 80;
  g.simulateWeek();
  const report = g.state.week.trainingReport ?? g.state.player;
  const last = g.state.news.find((n) => true);
  ok(g.state.player.life.fitness > 30, `simular com forma 30 descansa (forma agora ${g.state.player.life.fitness})`);
}
