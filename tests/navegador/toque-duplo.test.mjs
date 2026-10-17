// Toque duplo na partida: o segundo toque cai no botão novo que apareceu no
// mesmo ponto. Só conta os casos em que isso acontece de verdade.
import { BASE, launch } from '../ajuda/navegador.mjs';

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__jogo?.game);
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__jogo?.game);
await page.waitForTimeout(600);
await page.click('[data-action="new-career"]');
await page.fill('[data-field="firstName"]', 'Kauã');
await page.fill('[data-field="lastName"]', 'Ribeiro');
await page.click('[data-action="toggle-trait"][data-trait="driblador"]');
await page.click('[data-action="toggle-trait"][data-trait="midiatico"]');
await page.click('[data-action="confirm-create"]'); await page.waitForTimeout(250); if (await page.locator('.modal-overlay').count()) await page.click('[data-modal="ok"]');
await page.waitForTimeout(300);
await page.locator('[data-action="accept-trial"]').first().click();
await page.waitForTimeout(400);

const stats = { optionToContinue: { tried: 0, echoed: 0 }, continueToOption: { tried: 0, echoed: 0 } };
const actionAt = (x, y) => page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest('[data-action]')?.dataset.action ?? null, [x, y]);

for (let round = 0; round < 6; round++) {
  await page.evaluate(() => {
    const g = window.__jogo.game;
    g.player.injury = null;
    g.player.suspension = 0;
    g.decideRole = () => 'titular';
    if (g.state.week.step === 'treino') g.chooseTraining('tecnico');
    if (g.state.week.step === 'vida') {
      g.state.week.step = 'partida';
      g.state.week.eventId = null;
      g.notify();
    }
  });
  await page.waitForTimeout(300);
  const start = page.locator('[data-action="start-match"]');
  if (process.env.DBG) console.log('round', round, await page.evaluate(() => [window.__jogo.game.state.screen, window.__jogo.game.state.week.step]), await start.count());
  if (!(await start.count())) break;
  await start.click();
  await page.waitForTimeout(700);

  for (let guard = 0; guard < 40; guard++) {
    const screen = await page.evaluate(() => window.__jogo.game.state.screen);
    if (screen !== 'match') break;
    const choose = page.locator('[data-action="match-choose"]').first();
    const cont = page.locator('[data-action="match-continue"]').first();
    if (await choose.count()) {
      await page.waitForTimeout(450);
      const box = await choose.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(60);
      const under = await actionAt(x, y);
      if (process.env.DBG) console.log('tap', Math.round(x), Math.round(y), 'under', under, await page.evaluate(() => window.__jogo.game.state.match?.minute));
      await page.waitForTimeout(70);
      if (under === 'match-continue') {
        stats.optionToContinue.tried++;
        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(250);
        const stillResolution = await page.locator('[data-action="match-continue"]').count();
        if (!stillResolution) stats.optionToContinue.echoed++;
      }
      await page.waitForTimeout(400);
    } else if (await cont.count()) {
      await page.waitForTimeout(450);
      const box = await cont.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(60);
      const under = await actionAt(x, y);
      if (process.env.DBG) console.log('tap', Math.round(x), Math.round(y), 'under', under, await page.evaluate(() => window.__jogo.game.state.match?.minute));
      await page.waitForTimeout(70);
      if (under === 'match-choose') {
        stats.continueToOption.tried++;
        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(250);
        const resolved = await page.locator('[data-action="match-continue"]').count();
        if (resolved) stats.continueToOption.echoed++;
      }
      await page.waitForTimeout(400);
    } else {
      const auto = page.locator('[data-action="match-auto"]').first();
      if (await auto.count()) await auto.click();
      await page.waitForTimeout(400);
    }
  }
  // fecha a semana
  for (let i = 0; i < 3; i++) {
    const next = page.locator('[data-action="advance-week"]');
    if (await next.count()) {
      await next.click();
      await page.waitForTimeout(500);
      break;
    }
    await page.waitForTimeout(300);
  }
}

console.log(JSON.stringify(stats));
const tried = stats.optionToContinue.tried + stats.continueToOption.tried;
const echoed = stats.optionToContinue.echoed + stats.continueToOption.echoed;
console.log(`${echoed ? 'FALHOU' : 'ok'} - toque duplo: ${tried ? `${echoed} de ${tried} tomaram uma decisão sozinhos` : 'nenhum caso de toque no mesmo ponto apareceu'}`);
console.log(`${errors.length ? 'FALHOU' : 'ok'} - ${errors.length ? errors.join(' | ') : 'sem erros de página'}`);
if (echoed || errors.length) process.exitCode = 1;
await browser.close();
