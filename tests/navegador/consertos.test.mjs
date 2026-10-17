// Confere os consertos e a noite no jogo : telas de dia e de noite,
// o gol com a placa, as brilhantes, as propostas e o toque duplo na partida.
import { BASE, launch, saida } from '../ajuda/navegador.mjs';
import { mkdirSync } from 'node:fs';

const OUT = saida('consertos');
mkdirSync(OUT, { recursive: true });
const browser = await launch();
const errors = [];
const results = [];
const ok = (cond, msg) => {
  results.push(`${cond ? 'ok' : 'FALHOU'} - ${msg}`);
  if (!cond) process.exitCode = 1;
};

async function open({ width = 820, height = 1180, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__jogo?.game);
  await page.waitForTimeout(800);
  return { ctx, page };
}

// estado de referência
const { ctx: c0, page: p0 } = await open();
await p0.evaluate(() => localStorage.clear());
await p0.reload({ waitUntil: 'domcontentloaded' });
await p0.waitForFunction(() => window.__jogo?.game);
await p0.waitForTimeout(600);
await p0.click('[data-action="new-career"]');
await p0.fill('[data-field="firstName"]', 'Kauã');
await p0.fill('[data-field="lastName"]', 'Ribeiro');
await p0.click('[data-action="pick-position"][data-position="PON"]');
await p0.click('[data-action="toggle-trait"][data-trait="driblador"]');
await p0.click('[data-action="toggle-trait"][data-trait="midiatico"]');
await p0.screenshot({ path: `${OUT}/00-criacao-dia.png` });
await p0.click('[data-action="confirm-create"]'); await p0.waitForTimeout(250); if (await p0.locator('.modal-overlay').count()) await p0.click('[data-modal="ok"]');
await p0.waitForTimeout(300);
await p0.locator('[data-action="accept-trial"]').first().click();
await p0.waitForTimeout(300);
await p0.evaluate(() => window.__jogo.game.simulateWeeks(5));
const saved = await p0.evaluate(() => window.__jogo.game.serialize());
await c0.close();

async function withState(opts, fn) {
  const { ctx, page } = await open(opts);
  await page.evaluate((s) => {
    window.__jogo.game.load(JSON.parse(JSON.stringify(s)));
    window.__jogo.game.notify();
  }, saved);
  await page.waitForTimeout(900);
  await fn(page);
  await ctx.close();
}

const toMatch = (page) =>
  page.evaluate(() => {
    const g = window.__jogo.game;
    g.player.injury = null;
    g.player.suspension = 0;
    g.decideRole = () => 'titular';
    g.chooseTraining('tecnico');
    if (g.state.week.step === 'vida') {
      g.state.week.step = 'partida';
      g.state.week.eventId = null;
    }
    g.notify();
  });

const forceGoalMoment = (page) =>
  page.evaluate(async () => {
    const { MOMENTS } = await import('/src/data/matchMoments.js');
    const { successChance } = await import('/src/engine/match.js');
    const g = window.__jogo.game;
    const match = g.state.match;
    const moment = MOMENTS.find((item) => item.id === 'cara_a_cara');
    match.pending = {
      id: moment.id,
      title: moment.title,
      text: [].concat(moment.text)[0].replaceAll('{opponent}', match.opponentName),
      tag: 'jogo',
      options: moment.options.map((option, index) => ({ index, label: option.label, hint: option.hint ?? '', chance: successChance(g.player, option, match) })),
      raw: moment,
    };
    g.notify();
  });

for (const scheme of ['light', 'dark']) {
  const tag = scheme === 'dark' ? 'noite' : 'dia';

  // entrada
  {
    const { ctx, page } = await open({ scheme });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__jogo?.game);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/01-entrada-${tag}.png` });
    await ctx.close();
  }

  await withState({ scheme }, async (page) => {
    await page.screenshot({ path: `${OUT}/02-semana-${tag}.png` });
    await page.click('[data-action="hub-tab"][data-tab="liga"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/03-liga-${tag}.png` });
  });

  // gol: a placa mostra o número antigo antes de virar
  await withState({ scheme }, async (page) => {
    await toMatch(page);
    await page.waitForTimeout(300);
    await page.click('[data-action="start-match"]');
    await page.waitForTimeout(900);
    if (!(await page.locator('[data-action="match-choose"]').count())) {
      await page.locator('[data-action="match-continue"]').first().click().catch(() => {});
      await page.waitForTimeout(600);
    }
    await forceGoalMoment(page);
    await page.waitForTimeout(700);
    const before = await page.evaluate(() => window.__jogo.game.state.match.score.team);
    await page.evaluate(() => {
      const g = window.__jogo.game;
      g.__chance = g.rng.chance;
      g.rng.chance = () => true;
    });
    await page.locator('[data-action="match-choose"][data-index="0"]').click();
    await page.evaluate(() => {
      const g = window.__jogo.game;
      g.rng.chance = g.__chance;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/04-gol-300ms-${tag}.png` });
    const plate = await page.evaluate(() => {
      const node = document.querySelector('.scoreboard__goals');
      const after = getComputedStyle(node, '::after');
      return { content: after.content, visibility: after.visibility, text: node.textContent.trim() };
    });
    if (scheme === 'light') ok(plate.content !== 'none' && plate.visibility === 'visible', `placa mostra o número antigo aos 300ms (${JSON.stringify(plate)}, antes ${before})`);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/05-gol-depois-${tag}.png` });

    // toque duplo em "Continuar o jogo" não escolhe a próxima opção
    const cont = page.locator('[data-action="match-continue"]').first();
    if (await cont.count()) {
      const box = await cont.boundingBox();
      const report = () => page.evaluate(() => (window.__jogo.game.state.match?.log ?? []).length);
      const logBefore = await report();
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(130);
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
      const pendingNow = await page.evaluate(() => Boolean(window.__jogo.game.state.match?.pending) || window.__jogo.game.state.screen !== 'partida');
      ok(pendingNow, `toque duplo em "Continuar o jogo" não escolhe sozinho (${tag})`);
    }
  });

  // pós-jogo
  await withState({ scheme }, async (page) => {
    await toMatch(page);
    await page.waitForTimeout(300);
    await page.click('[data-action="simulate-match"]');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/06-pos-jogo-${tag}.png` });
    // toque duplo em "Próxima semana" não escolhe o treino da semana nova
    const next = page.locator('[data-action="advance-week"]').first();
    const box = await next.boundingBox();
    const week = await page.evaluate(() => window.__jogo.game.state.season.weekIndex);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(120);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);
    const state = await page.evaluate(() => ({ step: window.__jogo.game.state.week.step, week: window.__jogo.game.state.season.weekIndex }));
    ok(state.week === week + 1 && state.step === 'treino', `toque duplo em "Próxima semana" para no treino (${tag}: ${JSON.stringify(state)})`);
  });

  // fim de temporada: brilhantes e propostas
  await withState({ scheme }, async (page) => {
    await page.evaluate(() => window.__jogo.game.simulateRestOfSeason());
  await page.waitForTimeout(600); if (await page.locator('[data-action="skip-pack"]').count()) { await page.click('[data-action="skip-pack"]'); await page.waitForTimeout(500); }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/07-fim-${tag}.png`, fullPage: true });
    const foil = await page.evaluate(() => {
      const node = document.querySelector('.card-sticker.sticker--foil');
      return node ? getComputedStyle(node).backgroundImage : 'sem brilhante';
    });
    if (foil !== 'sem brilhante') ok(foil.includes('gradient'), `figurinha brilhante com dourado (${tag})`);
    const btn = await page.evaluate(() => {
      const node = document.querySelector('.card-sticker .btn:not(.btn--primary)');
      if (!node) return null;
      const cs = getComputedStyle(node);
      return { color: cs.color, border: cs.borderColor };
    });
    if (btn) ok(!btn.color.includes('238, 242, 251'), `botão da proposta legível (${tag}: ${btn.color})`);
  });
}

// criação à noite (posição escolhida)
{
  const { ctx, page } = await open({ scheme: 'dark' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__jogo?.game);
  await page.waitForTimeout(600);
  await page.click('[data-action="new-career"]');
  await page.click('[data-action="pick-position"][data-position="PON"]');
  await page.click('[data-action="toggle-trait"][data-trait="driblador"]');
  await page.evaluate(() => document.querySelector('[data-action="pick-position"][data-position="PON"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/08-criacao-noite.png` });
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `AVISOS:\n${errors.join('\n')}` : 'sem erros nem avisos');
