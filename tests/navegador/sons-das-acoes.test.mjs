import { BASE, launch } from '../ajuda/navegador.mjs';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const b = await launch();
const p = await b.newPage({ viewport: { width: 1024, height: 1366 }, hasTouch: true });
await p.goto(`${BASE}/index.html`); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
await p.evaluate(() => { const s = window.__jogo.sound; window.__played = []; const orig = s.play.bind(s); s.play = (n, o) => { if (n) window.__played.push(n); return orig(n, o); }; });
await p.click('[data-action="new-career"]'); await p.waitForTimeout(300);
await p.fill('[data-field="firstName"]', 'Kauã'); await p.fill('[data-field="lastName"]', 'Ribeiro'); await p.click('[data-action="pick-position"][data-position="ATA"]');
await p.click('[data-action="toggle-trait"][data-trait="driblador"]'); await p.click('[data-action="toggle-trait"][data-trait="midiatico"]');
for (const [g, n] of [['ritmo', 8], ['drible', 8], ['finalizacao', 6]]) for (let i = 0; i < n; i++) await p.click(`[data-action="alloc"][data-group="${g}"][data-delta="1"]`);
await p.click('[data-action="confirm-create"]'); await p.waitForTimeout(250); if (await p.locator('.modal-overlay').count()) await p.click('[data-modal="ok"]'); await p.waitForTimeout(300);
await p.locator('[data-action="accept-trial"]').first().click(); await p.waitForTimeout(400);
// loja: com dinheiro compra; sem dinheiro, "não dá" não acontece porque o botão fica bloqueado
await p.evaluate(() => { window.__jogo.game.player.money = 50_000; window.__played.length = 0; });
await p.click('[data-action="hub-tab"][data-tab="vida"]'); await p.waitForTimeout(300);
await p.evaluate(() => window.__played.length = 0);
await p.locator('[data-action="buy-item"]:not([disabled])').first().click(); await p.waitForTimeout(400);
let got = await p.evaluate(() => window.__played.splice(0)); ok(got.includes('compra'), `compra na loja: ${got.join(', ')}`);
// dispensar alguém da equipe: o botão faz toque, confirmar a dispensa faz voltar
await p.evaluate(() => { const j = window.__jogo; j.game.player.money = 50_000; j.game.buyItem('nutricionista'); j.render(); window.__played.length = 0; });
await p.waitForTimeout(200);
const dismiss = p.locator('[data-action="dismiss-staff"]').first();
ok(await dismiss.count() > 0, 'botão Dispensar aparece');
await dismiss.click(); await p.waitForSelector('.modal-overlay'); await p.click('[data-modal="ok"]'); await p.waitForTimeout(300);
got = await p.evaluate(() => window.__played.splice(0)); ok(got.join(',') === 'toque,voltar', `dispensar: ${got.join(', ')}`);
// fim de ano
await p.click('[data-action="hub-tab"][data-tab="semana"]'); await p.waitForTimeout(200);
await p.evaluate(() => window.__played.length = 0);
await p.click('[data-action="sim-season"]'); await p.waitForSelector('.modal-overlay'); await p.click('[data-modal="ok"]'); await p.waitForTimeout(1500);
const conf = p.locator('.modal [data-action], .dialog button, [data-confirm]');
got = await p.evaluate(() => window.__played.splice(0));
const screen = await p.evaluate(() => window.__jogo.game.state.screen);
ok(screen !== 'offseason' || got.includes('figurinha'), `fim de ano (${screen}): ${got.join(', ')}`);
await b.close();
