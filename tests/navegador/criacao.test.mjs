// Criação no jogo : prévia presa no topo, aviso de pontos livres e confirmação.
import { BASE, launch, saida } from '../ajuda/navegador.mjs';
import { mkdirSync } from 'node:fs';

const OUT = saida('criacao');
mkdirSync(OUT, { recursive: true });
const browser = await launch();
const errors = [];
const results = [];
const ok = (cond, msg) => {
  results.push(`${cond ? 'ok' : 'FALHOU'} - ${msg}`);
  if (!cond) process.exitCode = 1;
};

async function run(name, { width = 820, height = 1180, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__jogo?.game);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__jogo?.game);
  await page.waitForTimeout(700);
  await page.click('[data-action="new-career"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-1-topo.png` });
  await page.fill('[data-field="firstName"]', 'Kauã');
  await page.fill('[data-field="lastName"]', 'Ribeiro');
  await page.click('[data-action="toggle-trait"][data-trait="driblador"]');
  await page.click('[data-action="toggle-trait"][data-trait="midiatico"]');
  await page.evaluate(() => document.getElementById('c-aparencia').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.click('[data-action="pick-skin"][data-index="4"]');
  await page.evaluate(() => document.getElementById('c-aparencia').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-2-aparencia.png` });
  const preview = await page.evaluate(() => {
    const r = document.querySelector('.create__preview .sticker').getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), visible: r.bottom > 0 && r.top < innerHeight };
  });
  if (width < 980) ok(preview.visible && preview.top >= 56, `${name}: prévia à vista ao escolher a aparência (${JSON.stringify(preview)})`);
  const status = await page.textContent('[data-live="status"]');
  ok(/faltam distribuir|falta distribuir/.test(status), `${name}: rodapé avisa os pontos livres ("${status.trim()}")`);
  for (let i = 0; i < 4; i++) await page.click('[data-action="alloc"][data-group="drible"][data-delta="1"]');
  await page.evaluate(() => document.getElementById('c-pontos').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-3-pontos.png` });
  await page.click('[data-action="confirm-create"]');
  await page.waitForTimeout(400);
  const modal = await page.locator('.modal-overlay').count();
  ok(modal === 1, `${name}: começar com pontos livres pede confirmação`);
  await page.screenshot({ path: `${OUT}/${name}-4-confirma.png` });
  await page.click('[data-modal="cancel"]');
  await page.waitForTimeout(600);
  const stillCreate = await page.evaluate(() => window.__jogo.game.state.screen);
  ok(stillCreate === 'create', `${name}: "Distribuir os pontos" volta para a criação (${stillCreate})`);
  await page.click('[data-action="confirm-create"]');
  await page.waitForTimeout(300);
  await page.click('[data-modal="ok"]');
  await page.waitForTimeout(500);
  const screen = await page.evaluate(() => window.__jogo.game.state.screen);
  ok(screen !== 'create', `${name}: "Começar assim mesmo" segue para as peneiras (${screen})`);
  await ctx.close();
}

await run('retrato');
await run('celular', { width: 390, height: 844 });
await run('noite', { scheme: 'dark' });
await run('paisagem', { width: 1180, height: 820 });

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `AVISOS:\n${errors.join('\n')}` : 'sem erros nem avisos');
