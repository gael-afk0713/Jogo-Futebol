// Confirmações no jogo : simular até o fim, assinar e ficar no clube.
import { BASE, launch, saida } from '../ajuda/navegador.mjs';
import { mkdirSync } from 'node:fs';

const OUT = saida('confirmacoes');
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

const modalText = (page) => page.evaluate(() => document.querySelector('.modal')?.innerText.replace(/\s+/g, ' ').trim() ?? '');

for (const [name, opts] of [['ipad', {}], ['celular', { width: 390, height: 844 }], ['noite', { scheme: 'dark' }]]) {
  const { ctx, page } = await career(opts);
  // Simular até o fim
  const week = await page.evaluate(() => window.__jogo.game.state.season.weekIndex);
  await page.click('[data-action="sim-season"]');
  await page.waitForSelector('.modal-overlay');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}-1-simular.png` });
  const simText = await modalText(page);
  ok(/Simular o resto da temporada\?/.test(simText) && /Faltam \d+ jogos/.test(simText), `${name}: simular pergunta antes ("${simText}")`);
  await page.click('[data-modal="cancel"]');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ screen: window.__jogo.game.state.screen, week: window.__jogo.game.state.season.weekIndex }));
  ok(after.screen === 'hub' && after.week === week, `${name}: "Voltar" não simula (${JSON.stringify(after)})`);
  await page.click('[data-action="sim-season"]');
  await page.waitForSelector('.modal-overlay');
  await page.click('[data-modal="ok"]');
  await page.waitForTimeout(1200);
  ok((await page.evaluate(() => window.__jogo.game.state.screen)) === 'offseason', `${name}: "Simular até o fim" leva ao fim de ano`);
  if (await page.locator('[data-action="skip-pack"]').count()) await page.click('[data-action="skip-pack"]');
  await page.waitForTimeout(600);

  // Assinar
  const offer = page.locator('[data-action="accept-offer"]').first();
  if (await offer.count()) {
    const label = await offer.getAttribute('aria-label');
    const club = await page.evaluate(() => window.__jogo.game.player.club);
    await offer.scrollIntoViewIfNeeded();
    await offer.click();
    await page.waitForSelector('.modal-overlay');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${name}-2-assinar.png` });
    const signText = await modalText(page);
    ok(/por semana, contrato de \d+ temporadas?/.test(signText), `${name}: assinar mostra o resumo ("${signText}" / ${label})`);
    await page.click('[data-modal="cancel"]');
    await page.waitForTimeout(400);
    ok((await page.evaluate(() => window.__jogo.game.state.screen)) === 'offseason', `${name}: "Ver de novo" não assina`);
    // Ficar no clube
    const stay = page.locator('[data-action="stay-club"]');
    if (await stay.count()) {
      await stay.scrollIntoViewIfNeeded();
      await stay.click();
      await page.waitForSelector('.modal-overlay');
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${name}-3-ficar.png` });
      const stayText = await modalText(page);
      ok(/Você recusa/.test(stayText), `${name}: ficar avisa o que recusa ("${stayText}")`);
      await page.click('[data-modal="cancel"]');
      await page.waitForTimeout(300);
    }
    await offer.scrollIntoViewIfNeeded();
    await offer.click();
    await page.waitForSelector('.modal-overlay');
    await page.click('[data-modal="ok"]');
    await page.waitForTimeout(800);
    const state = await page.evaluate(() => ({ screen: window.__jogo.game.state.screen, club: window.__jogo.game.player.club }));
    ok(state.screen === 'hub', `${name}: confirmar assina e começa a temporada (${JSON.stringify(state)}, antes ${club})`);
  } else {
    ok(true, `${name}: sem propostas nesta carreira`);
  }
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `AVISOS:\n${errors.join('\n')}` : 'sem erros nem avisos');
