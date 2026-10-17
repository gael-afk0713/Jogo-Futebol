// Sair da tela logo depois de uma ação salva na hora (pagehide), sem esperar o temporizador.
import { BASE, launch } from '../ajuda/navegador.mjs';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
await page.goto(`${BASE}/index.html`);
await page.waitForFunction(() => window.__jogo?.game);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForFunction(() => window.__jogo?.game); await page.waitForTimeout(600);
await page.click('[data-action="new-career"]');
await page.fill('[data-field="firstName"]', 'Kauã'); await page.fill('[data-field="lastName"]', 'Ribeiro');
await page.click('[data-action="toggle-trait"][data-trait="driblador"]'); await page.click('[data-action="toggle-trait"][data-trait="midiatico"]');
await page.click('[data-action="confirm-create"]'); await page.waitForTimeout(250); if (await page.locator('.modal-overlay').count()) await page.click('[data-modal="ok"]'); await page.waitForTimeout(300);
await page.locator('[data-action="accept-trial"]').first().click(); await page.waitForTimeout(800);
const saved = () => page.evaluate(() => {
  const keys = Object.keys(localStorage).filter((k) => k.includes('carreira') || k.includes('career'));
  for (const k of keys) { try { const v = JSON.parse(localStorage.getItem(k)); const st = v.state ?? v; if (st?.week?.step) return st.week.step; } catch {} }
  return null;
});
const before = await saved();
await page.click('[data-action="choose-training"]');
const right = await page.evaluate(() => window.__jogo.game.state.week.step);
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
const after = await saved();
console.log(`${after === right ? 'ok' : 'FALHOU'} - sair logo depois de uma ação salva na hora (antes ${before}, no jogo ${right}, salvo ${after})`);
if (after !== right) process.exitCode = 1;
await browser.close();
