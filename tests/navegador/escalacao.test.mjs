// Escalação no ingresso : titular, reserva e banco antes do toque, e o motivo no relatório.
import { BASE, launch, saida } from '../ajuda/navegador.mjs';
import { mkdirSync } from 'node:fs';

const OUT = saida('escalacao');
mkdirSync(OUT, { recursive: true });
const browser = await launch();
const errors = [];
const results = [];
const ok = (cond, msg) => {
  results.push(`${cond ? 'ok' : 'FALHOU'} - ${msg}`);
  if (!cond) process.exitCode = 1;
};

async function career({ width = 820, height = 1180, scheme = 'light' } = {}) {
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
  await page.waitForTimeout(800);
  await page.click('[data-action="new-career"]');
  await page.fill('[data-field="firstName"]', 'Kauã');
  await page.fill('[data-field="lastName"]', 'Ribeiro');
  await page.click('[data-action="pick-position"][data-position="PON"]');
  await page.click('[data-action="toggle-trait"][data-trait="driblador"]');
  await page.click('[data-action="toggle-trait"][data-trait="midiatico"]');
  await page.click('[data-action="confirm-create"]');
  await page.waitForTimeout(250);
  if (await page.locator('.modal-overlay').count()) await page.click('[data-modal="ok"]');
  await page.waitForTimeout(300);
  await page.locator('[data-action="accept-trial"]').first().click();
  await page.waitForTimeout(500);
  return { ctx, page };
}

// Chega na etapa da partida pelo caminho normal (treino, evento).
async function toMatchStep(page) {
  for (let i = 0; i < 6; i++) {
    const step = await page.evaluate(() => window.__jogo.game.state.week.step);
    if (step === 'partida') return;
    if (step === 'treino') await page.evaluate(() => window.__jogo.game.chooseTraining('tecnico'));
    else if (step === 'vida') await page.evaluate(() => window.__jogo.game.resolveEvent(window.__jogo.game.currentEvent().options[0].index));
    await page.waitForTimeout(300);
  }
}

const force = (page, role) =>
  page.evaluate((r) => {
    const g = window.__jogo.game;
    g.state.week.lineup = null;
    g.player.debutGames = 0;
    g.player.overall = 49;
    const original = g.decideRole;
    g.decideRole = () => r;
    g.ensureLineup();
    g.decideRole = original;
    g.notify();
  }, role);

for (const [name, opts] of [['ipad', {}], ['celular', { width: 390, height: 844 }], ['noite', { scheme: 'dark' }]]) {
  const { ctx, page } = await career(opts);
  await toMatchStep(page);
  await page.waitForTimeout(400);
  const first = await page.evaluate(() => ({ lineup: window.__jogo.game.state.week.lineup, debut: window.__jogo.game.player.debutGames }));
  ok(first.lineup && first.lineup.role !== 'banco', `${name}: primeiro jogo já tem escalação e não é banco (${JSON.stringify(first)})`);
  const notice = await page.evaluate(() => document.querySelector('.ticket .lineup')?.innerText ?? '');
  ok(/Escalação: (titular|reserva)/.test(notice), `${name}: o ingresso mostra a escalação ("${notice.replace(/\s+/g, ' ')}")`);
  await page.locator('.ticket').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/${name}-1-estreia.png` });

  await force(page, 'reserva');
  await page.waitForTimeout(300);
  await page.locator('.ticket').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/${name}-2-reserva.png` });
  const sub = await page.evaluate(() => document.querySelector('.ticket .lineup')?.innerText.replace(/\s+/g, ' ') ?? '');
  ok(/Escalação: reserva/.test(sub) && /elenco|técnico|contrato|forma|média|rodízio/i.test(sub), `${name}: reserva com o motivo ("${sub}")`);

  await force(page, 'banco');
  await page.waitForTimeout(300);
  await page.locator('.ticket').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/${name}-3-banco.png` });
  const bench = await page.evaluate(() => ({
    text: document.querySelector('.ticket .lineup')?.innerText.replace(/\s+/g, ' ') ?? '',
    button: document.querySelector('[data-action="start-match"]')?.innerText.trim(),
    simulate: document.querySelectorAll('[data-action="simulate-match"]').length,
  }));
  ok(/Escalação: banco/.test(bench.text) && bench.button === 'Ver o resultado' && bench.simulate === 0, `${name}: banco avisa antes e o botão vira "Ver o resultado" (${JSON.stringify(bench)})`);
  await page.click('[data-action="start-match"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-4-nao-jogou.png` });
  const report = await page.evaluate(() => document.querySelector('.sheet h2')?.parentElement?.innerText.replace(/\s+/g, ' ') ?? '');
  ok(/Você não jogou/.test(report) && /overall/.test(report), `${name}: relatório explica o banco ("${report.slice(0, 220)}")`);
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `AVISOS:\n${errors.join('\n')}` : 'sem erros nem avisos');
