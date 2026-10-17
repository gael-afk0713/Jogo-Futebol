import { BASE, launch, saida } from '../ajuda/navegador.mjs';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const b = await launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1024, height: 1366 }, hasTouch: true });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/index.html`); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
// grava cada som pedido
await p.evaluate(() => { const s = window.__jogo.sound; window.__played = []; const orig = s.play.bind(s); s.play = (n, o) => { window.__played.push(n); return orig(n, o); }; const amb = s.ambient.bind(s); s.ambient = (on) => { window.__played.push(on ? 'ambiente:on' : 'ambiente:off'); return amb(on); }; });
const take = async () => p.evaluate(() => window.__played.splice(0));
await p.click('[data-action="new-career"]'); await p.waitForTimeout(300);
await p.fill('[data-field="firstName"]', 'Kauã'); await p.fill('[data-field="lastName"]', 'Ribeiro'); await p.click('[data-action="pick-position"][data-position="ATA"]');
await p.click('[data-action="toggle-trait"][data-trait="driblador"]'); await p.click('[data-action="toggle-trait"][data-trait="midiatico"]');
for (const [g, n] of [['ritmo', 8], ['drible', 8], ['finalizacao', 6]]) for (let i = 0; i < n; i++) await p.click(`[data-action="alloc"][data-group="${g}"][data-delta="1"]`);
await p.click('[data-action="confirm-create"]'); await p.waitForTimeout(250); if (await p.locator('.modal-overlay').count()) await p.click('[data-modal="ok"]'); await p.waitForTimeout(300);
let got = await take(); ok(got.includes('toque') && got.at(-1) === 'confirmar', `criação: toques e confirmar no fim (${got.length} sons)`);
await p.locator('[data-action="accept-trial"]').first().click(); await p.waitForTimeout(400);
got = await take(); ok(got[0] === 'confirmar', `assinar peneira: ${got.join(', ')}`);
// todos os arquivos carregam e decodificam
const loaded = await p.evaluate(async () => { const s = window.__jogo.sound; s.unlock(); const names = ['toque','confirmar','voltar','erro','compra','certo','errado','conquista','aviso','apito','gol','chute','figurinha','ambiente']; const r = await Promise.all(names.map((n) => s.load(n))); return names.filter((n, i) => !r[i]); });
ok(loaded.length === 0, `os 14 sons carregam e decodificam${loaded.length ? ': faltou ' + loaded.join(', ') : ''}`);
// detalhes do treino: abrir faz toque, fechar faz voltar
const eye = p.locator('[data-action="peek-training"]').first();
if (await eye.count()) {
  await eye.click(); await p.waitForTimeout(200);
  await p.locator('[data-action="peek-training"]').first().click(); await p.waitForTimeout(200);
  got = (await take()).filter(Boolean); ok(got.join(',') === 'toque,voltar', `abrir e fechar detalhes do treino: ${got.join(', ')}`);
}
// confirmação: cancelar faz voltar, tocar fora também
for (const how of ['botão', 'fora']) {
  const pending = p.evaluate(() => window.__jogo.ctx.confirm({ title: 'Teste?', text: 'Teste.' }));
  await p.waitForSelector('.modal-overlay');
  if (how === 'botão') await p.click('[data-modal="cancel"]'); else await p.mouse.click(5, 1300);
  const answer = await pending; got = await take();
  ok(answer === false && got.join(',') === 'voltar', `cancelar a confirmação (${how}): ${got.join(', ')}`);
}
// semana até a partida
for (let i = 0; i < 6; i++) {
  const step = await p.evaluate(() => window.__jogo.game.state.week.step);
  if (step === 'partida') break;
  const btn = p.locator('[data-action="choose-training"], [data-action="resolve-event"], [data-action="continue-life"], [data-action="skip-free-week"], [data-action="advance-week"]').first();
  await btn.click(); await p.waitForTimeout(300);
}
got = await take(); console.log('   semana:', got.join(', '));
// titular garantido, para a partida acontecer
await p.evaluate(() => { const g = window.__jogo.game; const pl = g.player; for (const id of Object.keys(pl.attributes)) pl.attributes[id] = 90; pl.overall = 90; pl.injury = null; pl.suspension = 0; pl.life.managerRelation = 100; pl.life.fitness = 100; });
const start = p.locator('[data-action="start-match"]');
if (await start.count()) {
  await start.click(); await p.waitForTimeout(600);
  got = await take(); ok(got.includes('apito') && got.includes('ambiente:on'), `entrar em campo: ${got.join(', ')}`);
  let guard = 0, results = [];
  while (guard++ < 40) {
    const choose = p.locator('[data-action="match-choose"]').first();
    const cont = p.locator('[data-action="match-continue"]').first();
    if (await choose.count()) { await choose.click(); await p.waitForTimeout(150); results.push(...(await take())); }
    else if (await cont.count()) { await cont.click(); await p.waitForTimeout(150); results.push(...(await take())); }
    else break;
    if (await p.evaluate(() => window.__jogo.game.state.match?.finished)) break;
  }
  console.log('   partida:', [...new Set(results)].join(', '));
  ok(results.some((x) => ['certo', 'errado', 'gol'].includes(x)), 'lances tocam certo, errado ou gol');
  ok(results.includes('apito'), 'apito no fim do jogo');
}
// liga e desliga
await p.click('[data-action="toggle-sound"]'); await p.waitForTimeout(200);
ok(await p.evaluate(() => !window.__jogo.sound.enabled && localStorage.getItem('craque.som') === 'desligado'), 'botão desliga o som e guarda a escolha');
await p.click('[data-action="toggle-sound"]'); await p.waitForTimeout(200);
ok(await p.evaluate(() => window.__jogo.sound.enabled), 'botão liga de novo');
await p.screenshot({ path: saida('sons') + 'ipad-topbar-som.png', clip: { x: 0, y: 0, width: 1024, height: 120 } });
ok(errs.length === 0, `sem erros na página${errs.length ? ': ' + errs.join(' | ') : ''}`);
await b.close();
