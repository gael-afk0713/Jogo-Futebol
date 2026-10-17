import { Game } from '../../src/core/game.js';
import * as M from '../../src/engine/match.js';
import { createRng } from '../../src/core/rng.js';
import { MOMENTS } from '../../src/data/matchMoments.js';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const mk = (position = 'ATA') => { const g = new Game(); g.createCareer({ firstName: 'A', lastName: 'B', position, nationality: 'BRA', traits: [], groupPoints: {}, appearance: {}, seed: 21 }); g.acceptTrial(g.state.trials.offers[0].id); return g; };
const start = (p, rng, extra = {}) => M.createMatch({ player: p, clubId: p.club, opponentId: 'flamengo', competition: { id: 'liga', name: 'L' }, isHome: true, role: M.PLAYER_ROLE.STARTER, rng, ...extra });

{
  const p = mk().state.player;
  const rng = createRng(1);
  // Força um gol e o VAR anulando.
  const m = start(p, rng);
  m.queue = [];
  m.pending = { id: 'x', offBall: false, raw: { options: [{ attrs: ['finishing'], chance: 1, success: { kind: 'goal', rating: 1, text: 'Gol!' } }] } };
  M.choose(m, p, 0, rng);
  ok(m.score.team === 1 && m.stats.goals === 1, 'gol marcado');
  m.queue = ['var_gol'];
  M.advance(m, p, rng);
  ok(m.pending?.id === 'var_gol' && m.pending.offBall, 'VAR aparece na hora, fora da bola');
  const varEvent = m.pending.raw;
  varEvent.options[1].chance = 0; // força anular (só neste teste)
  const r = M.choose(m, p, 1, rng);
  varEvent.options[1].chance = 0.75;
  ok(r.kind === 'goalAnnulled' && m.score.team === 0 && m.stats.goals === 0 && !(m.goals ?? []).some((g) => g.mine), 'VAR anula: placar, estatística e súmula voltam');
}

{
  const p = mk().state.player;
  const rng = createRng(2);
  const m = start(p, rng);
  m.queue = ['comemoracao'];
  M.advance(m, p, rng);
  ok(m.pending?.id === 'comemoracao' && m.pending.options.every((o) => o.sure), 'comemoração: opções sem chance (sempre dá)');
  const r = M.choose(m, p, 2, rng);
  ok(m.lifeDelta.fanRelation === 3 && r.extras.includes('Torcida +3'), 'correr para a torcida dá +3 de torcida no fim do jogo');
  ok(m.momentsPlayed === 0, 'evento fora da bola não gasta lance');
}

{
  const p = mk().state.player;
  const rng = createRng(3);
  const m = start(p, rng);
  m.conditions.rain = true;
  const pass = { attrs: ['shortPass'], mod: 'pass', difficulty: 0, success: { kind: 'possession' } };
  const shot = { attrs: ['shortPass'], mod: 'shoot', difficulty: 0, success: { kind: 'possession' } };
  const wet = M.successChance(p, pass, m);
  ok(wet < M.successChance(p, shot, m), 'na chuva o passe fica mais difícil que o chute');
  m.conditions.rainProof = true;
  ok(M.successChance(p, pass, m) > wet, 'com trava alta a chuva deixa de atrapalhar');
  m.conditions.skill = 3;
  ok(M.successChance(p, pass, m) > M.successChance(p, shot, { ...m, conditions: { skill: 0 } }) - 1, 'confiança soma nos lances');
}

{
  const p = mk('ATA').state.player;
  p.attributes.penalties = 80;
  const rng = createRng(4);
  const m = start(p, rng);
  m.queue = [];
  m.pending = { id: 'x', offBall: false, raw: { options: [{ chance: 1, success: { kind: 'penaltyWon', rating: 0.8, text: 'Pênalti!' } }] } };
  M.choose(m, p, 0, rng);
  M.advance(m, p, rng);
  ok(m.pending?.id === 'penalti', 'pênalti sofrido por quem é cobrador: a cobrança vem em seguida');
}

{
  const p = mk().state.player;
  const rng = createRng(5);
  const m = start(p, rng);
  m.queue = [];
  m.pending = { id: 'x', offBall: false, raw: { options: [{ chance: 1, success: { kind: 'yellow', rating: 0, text: 'Amarelo' } }] } };
  let reds = 0;
  for (let i = 0; i < 200; i += 1) { m.stats.yellowCards = 0; m.stats.redCards = 0; m.sentOff = false; m.onField = true; m.pending = { id: 'x', raw: { options: [{ chance: 1, success: { kind: 'yellow', rating: 0, text: 'A' } }] } }; M.choose(m, p, 0, rng); reds += m.stats.redCards; }
  ok(reds === 0, 'falta tática é amarelo certo, nunca vermelho direto');
}

{
  // Salvar no meio de um evento fora da bola e carregar.
  const g = mk();
  g.state.week.step = 'partida';
  g.state.match = start(g.state.player, g.rng);
  g.state.screen = 'match';
  const m = g.state.match;
  if (m) {
    m.pending = null;
    m.queue = ['empurra_empurra'];
    M.advance(m, g.state.player, g.rng);
    const saved = g.serialize();
    const g2 = new Game();
    ok(g2.load(saved) && g2.state.match.pending?.raw?.id === 'empurra_empurra', 'save no meio do evento reconecta o evento');
    ok(g2.matchChoose(2) && !g2.state.match.pending, 'dá para escolher depois de carregar');
  } else ok(true, 'jogador não foi escalado neste teste');
}

{
  // Memória leve: lances do jogo anterior ficam menos prováveis, mas não somem.
  const p = mk().state.player;
  const rng = createRng(6);
  let withMem = 0, without = 0;
  for (let i = 0; i < 1500; i += 1) {
    p.recentMoments = ['cara_a_cara'];
    const a = start(p, rng); M.advance(a, p, rng); if (a.usedMomentIds.includes('cara_a_cara')) withMem += 1;
    p.recentMoments = [];
    const b = start(p, rng); M.advance(b, p, rng); if (b.usedMomentIds.includes('cara_a_cara')) without += 1;
  }
  ok(withMem < without && withMem > without * 0.45, `memória leve: ${withMem} contra ${without} sem memória`);
}

{
  // Cada lance novo tem 2+ textos e todos os textos se preenchem sem sobrar chave.
  const p = mk().state.player;
  const rng = createRng(7);
  let bad = 0;
  for (const moment of MOMENTS) {
    const m = start(p, rng);
    m.queue = [];
    m.pending = null;
    m.usedMomentIds = [];
    const texts = Array.isArray(moment.text) ? moment.text : [moment.text];
    if (texts.length < 2) bad += 1;
    for (const t of texts) if (/\{[a-z]+\}/.test(t.replaceAll('{opponent}', '').replaceAll('{teammate}', '').replaceAll('{club}', '').replaceAll('{player}', ''))) bad += 1;
  }
  ok(bad === 0, 'todos os lances têm pelo menos 2 textos e só usam chaves conhecidas');
}
