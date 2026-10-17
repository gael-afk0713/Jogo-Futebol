// Raridade, cores de edição e o pacote da temporada no jogo .
import { BASE, launch, saida } from '../ajuda/navegador.mjs';
import { mkdirSync } from 'node:fs';

const OUT = saida('pacote-e-raridade');
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
  await page.waitForTimeout(1200);
  return { ctx, page };
}

async function newCareer(page) {
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
  await page.waitForTimeout(400);
}

// capa: as figurinhas de exemplo mostram as raridades
{
  const { ctx, page } = await career();
  await page.screenshot({ path: `${OUT}/01-capa.png` });
  const frames = await page.evaluate(() => [...document.querySelectorAll('.cover .sticker, .sticker')].slice(0, 3).map((n) => n.className));
  ok(frames.some((c) => c.includes('sticker--prata')) && frames.some((c) => c.includes('sticker--ouro')), `capa mostra prata e ouro (${frames.join(' | ')})`);
  await ctx.close();
}

for (const scheme of ['light', 'dark']) {
  const tag = scheme === 'dark' ? 'noite' : 'dia';
  const { ctx, page } = await career({ scheme });
  await newCareer(page);
  // subir para prata no meio da temporada: a ficha comemora uma vez
  await page.evaluate(() => {
    const g = window.__jogo.game;
    g.player.rarityShown = 0;
    g.player.overall = 61;
    g.notify();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/02-ficha-prata-${tag}.png` });
  const toastText = await page.evaluate(() => [...document.querySelectorAll('#toast-layer .toast')].map((n) => n.textContent).join(' / '));
  ok(/prata/.test(toastText), `${tag}: aviso de figurinha prata ("${toastText.trim()}")`);
  await page.evaluate(() => window.__jogo.game.notify());
  await page.waitForTimeout(300);
  const again = await page.evaluate(() => document.querySelectorAll('.sticker.is-upgrade').length);
  ok(again === 0, `${tag}: a virada toca uma vez só`);

  // fim de temporada: o pacote
  await page.evaluate(() => {
    const g = window.__jogo.game;
    g.player.overall = 58;
    g.player.rarityShown = 0;
    g.simulateRestOfSeason();
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/03-pacote-fechado-${tag}.png` });
  ok((await page.locator('[data-action="open-pack"]').count()) === 1, `${tag}: fim de temporada começa pelo pacote`);
  await page.click('[data-action="open-pack"]');
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/04-pacote-abrindo-${tag}.png` });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/05-pacote-aberto-${tag}.png`, fullPage: true });
  const count = await page.evaluate(() => document.querySelectorAll('.pack__stickers > *').length);
  ok(count >= 2, `${tag}: o pacote traz ${count} figurinhas`);
  await page.click('[data-action="pack-done"]');
  await page.waitForTimeout(800);
  ok((await page.locator('[data-action="open-pack"]').count()) === 0 && (await page.locator('.offers').count()) >= 0, `${tag}: depois do pacote vem o balanço`);
  await page.screenshot({ path: `${OUT}/06-balanco-${tag}.png` });
  ctx.close();
}

// álbum com várias temporadas: cores de edição diferentes
{
  const { ctx, page } = await career();
  await newCareer(page);
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.__jogo.game.simulateRestOfSeason());
    await page.waitForTimeout(400);
    if (await page.locator('[data-action="skip-pack"]').count()) {
      await page.click('[data-action="skip-pack"]');
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => {
      const g = window.__jogo.game;
      if (g.state.screen === 'offseason') g.stayAtClub?.();
      if (g.state.screen === 'offseason') g.startNextSeason?.();
    });
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => window.__jogo.game.state.screen === 'hub' || window.__jogo.game.setScreen('hub'));
  await page.waitForTimeout(300);
  await page.click('[data-action="hub-tab"][data-tab="carreira"]').catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/07-album.png`, fullPage: true });
  const faces = await page.evaluate(() => [...document.querySelectorAll('.season-sticker')].map((n) => n.style.getPropertyValue('--face')));
  ok(new Set(faces).size === faces.length && faces.length >= 2, `álbum com cores de edição diferentes (${faces.join(', ')})`);
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `AVISOS:\n${errors.join('\n')}` : 'sem erros nem avisos');
