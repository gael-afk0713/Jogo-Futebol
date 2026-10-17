import { BASE, ENGINE, launch, saida } from '../ajuda/navegador.mjs';
const out = saida('abertura');
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const b = await launch();
const URL = `${BASE}/index.html`;
// registra a linha do tempo: quantas figurinhas coladas e quando a capa sai
const timeline = () => {
  window.__tl = [];
  let last = '';
  const tick = () => {
    const boot = document.getElementById('boot');
    const s = boot ? `${boot.querySelectorAll('.is-done').length}${boot.classList.contains('is-leaving') ? ' saindo' : ''}${boot.classList.contains('is-failed') ? ' falhou' : ''}${boot.querySelector('.boot__tip.is-visible') ? ' dica' : ''}` : 'fora';
    if (s !== last) { window.__tl.push([Math.round(performance.now()), s]); last = s; }
    if (s !== 'fora') setTimeout(tick, 20);
  };
  document.addEventListener('DOMContentLoaded', tick);
};
async function page(opts = {}) {
  const ctx = await b.newContext({ viewport: opts.viewport ?? { width: 820, height: 1180 }, colorScheme: opts.dark ? 'dark' : 'light', reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(timeline);
  if (opts.slow && ENGINE === 'chromium') { const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 400 * 1024 / 8 * 4, uploadThroughput: 100 * 1024 }); }
  // Sem o protocolo do Chromium (WebKit), a internet lenta é um atraso em cada
  // módulo do jogo: a página e a capa chegam, o código demora.
  if (opts.slow && ENGINE !== 'chromium') await p.route(/\/src\/.*\.js$/, async (route) => { await new Promise((done) => setTimeout(done, 900)); await route.continue(); });
  if (opts.block) await p.route(opts.block, (r) => r.abort());
  return { ctx, p, errs };
}
const tl = (p) => p.evaluate(() => window.__tl.map(([t, s]) => `${t}ms:${s}`).join('  '));

// O navegador abre frio na primeira página: aquece antes de medir.
{
  const ctx = await b.newContext();
  const warm = await ctx.newPage();
  await warm.goto(URL);
  await warm.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 }).catch(() => {});
  await ctx.close();
}
// 1. internet boa
{
  const { ctx, p, errs } = await page();
  await p.goto(URL);
  await p.waitForTimeout(250); await p.screenshot({ path: `${out}/boot-rapido-250.png` });
  await p.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 15000 });
  const line = await tl(p); console.log('   rápido:', line);
  const end = await p.evaluate(() => window.__tl.at(-1)[0]);
  ok(end < 2500, `internet boa: capa sai em ${end}ms`);
  ok(await p.evaluate(() => !document.getElementById('app').hasAttribute('inert')), 'jogo liberado para toque depois');
  ok(await p.locator('[data-action="new-career"]').first().isVisible(), 'capa do álbum com o botão de começar');
  ok(errs.length === 0, `sem erros${errs.length ? ': ' + errs.join(' | ') : ''}`);
  await ctx.close();
}
// 2. internet lenta: dicas aparecem
{
  const { ctx, p, errs } = await page({ slow: true });
  const t0 = Date.now();
  p.goto(URL).catch(() => {});
  await p.waitForSelector('.boot__tip.is-visible', { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/boot-lento-dica.png` });
  const tip = await p.locator('.boot__tip').textContent().catch(() => '');
  ok(/^Dica:/.test(tip), `internet lenta mostra dica: "${tip}"`);
  await p.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 60000 });
  console.log('   lento:', await tl(p), `(${Date.now() - t0}ms)`);
  ok(errs.length === 0, `sem erros${errs.length ? ': ' + errs.join(' | ') : ''}`);
  await ctx.close();
}
// 3. código não chega
{
  const { ctx, p } = await page({ block: '**/src/main.js' });
  await p.goto(URL); await p.waitForTimeout(800);
  ok(await p.locator('.boot.is-failed').count() === 1 && await p.getByRole('button', { name: 'Tentar de novo' }).isVisible(), 'sem o código: aviso e botão Tentar de novo');
  await p.screenshot({ path: `${out}/boot-falha.png` });
  await ctx.close();
}
// 4. noturno, celular e movimento reduzido
for (const [name, opts] of [['noturno', { dark: true }], ['celular', { viewport: { width: 375, height: 700 } }], ['reduzido', { reduce: true, viewport: { width: 1180, height: 820 } }]]) {
  const { ctx, p, errs } = await page(opts); await p.route('https://www.gstatic.com/**', async (route) => { await new Promise((done) => setTimeout(done, 4000)); await route.abort().catch(() => {}); });
  // segura a etapa 3 para fotografar com figurinhas coladas e espaços vazios
  // (no WebKit, o pedido parado segura o evento load: espera só o HTML)
  await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/boot-${name}.png` });
  const overflow = await p.evaluate(() => document.getElementById('boot') ? document.getElementById('boot').scrollWidth > window.innerWidth : false);
  ok(!overflow, `${name}: sem rolagem de lado`);
  console.log(`   ${name}:`, await tl(p), errs.length ? 'erros: ' + errs.join(' | ') : '');
  await ctx.close();
}
await b.close();
