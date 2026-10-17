import { BASE, launch, saida } from '../ajuda/navegador.mjs';
const out = saida('abrir-carreira');
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.route('https://www.gstatic.com/**', (r) => r.abort());
await p.goto(`${BASE}/index.html`); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.waitForFunction(() => !document.getElementById('boot'));
// cria uma carreira e volta para o álbum
await p.click('[data-action="new-career"]'); await p.waitForTimeout(300);
await p.fill('[data-field="firstName"]', 'Kauã'); await p.fill('[data-field="lastName"]', 'Ribeiro'); await p.click('[data-action="pick-position"][data-position="ATA"]');
await p.click('[data-action="toggle-trait"][data-trait="driblador"]'); await p.click('[data-action="toggle-trait"][data-trait="midiatico"]');
for (const [g, n] of [['ritmo', 8], ['drible', 8], ['finalizacao', 6]]) for (let i = 0; i < n; i++) await p.click(`[data-action="alloc"][data-group="${g}"][data-delta="1"]`);
await p.click('[data-action="confirm-create"]'); await p.waitForTimeout(250); if (await p.locator('.modal-overlay').count()) await p.click('[data-modal="ok"]'); await p.waitForTimeout(300);
await p.locator('[data-action="accept-trial"]').first().click(); await p.waitForTimeout(400);
await p.evaluate(() => window.__jogo.goAlbum()); await p.waitForTimeout(800);
ok(await p.locator('.career').count() === 1, 'carreira no álbum');
// Jogar pela figurinha
await p.locator('.career [data-action="open-career"]').click();
await p.waitForTimeout(180);
const during = await p.evaluate(() => ({ lifted: !!document.querySelector('.career.is-opening'), btn: document.querySelector('.career [data-action="open-career"]')?.textContent, disabled: document.querySelector('.career [data-action="open-career"]')?.disabled, cover: document.querySelector('.cover [data-action="open-career"]')?.textContent.trim() }));
await p.screenshot({ path: `${out}/jogar-levanta.png`, clip: { x: 0, y: 560, width: 820, height: 260 } });
ok(during.lifted && during.btn === 'Abrindo...' && during.disabled && during.cover === 'Abrindo...', `durante: ${JSON.stringify(during)}`);
await p.waitForFunction(() => window.__jogo.game.state.screen !== 'auth', null, { timeout: 5000 });
await p.waitForTimeout(60);
const hub = await p.evaluate(() => ({ screen: window.__jogo.game.state.screen, glue: !!document.querySelector('.profile .sticker.is-new') }));
ok(hub.glue, `figurinha do jogador cola ao abrir (${hub.screen})`);
await p.waitForTimeout(1500);
await p.click('[data-action="hub-tab"][data-tab="perfil"]'); await p.waitForTimeout(300);
ok(!(await p.evaluate(() => !!document.querySelector('.profile .sticker.is-new'))), 'depois não cola de novo ao trocar de aba');
// Continuar pela capa
await p.evaluate(() => window.__jogo.goAlbum()); await p.waitForTimeout(800);
const cont = p.locator('.cover [data-action="open-career"]');
ok(/Continuar com/.test(await cont.textContent()), 'capa oferece Continuar');
await cont.click(); await p.waitForTimeout(120);
ok(await p.evaluate(() => !!document.querySelector('.career.is-opening')), 'Continuar também levanta a figurinha');
await p.waitForFunction(() => window.__jogo.game.state.screen !== 'auth', null, { timeout: 5000 });
// carreira que não abre: a figurinha volta
await p.evaluate(() => window.__jogo.goAlbum()); await p.waitForTimeout(800);
await p.evaluate(() => { const s = window.__jogo.save; s._open = s.open; s.open = () => Promise.reject(new Error('teste')); });
await p.locator('.career [data-action="open-career"]').click(); await p.waitForTimeout(700);
ok(await p.evaluate(() => !document.querySelector('.career.is-opening') && document.querySelector('.career [data-action="open-career"]').textContent === 'Jogar'), 'se não abrir, a figurinha volta e o botão também');
ok(errs.length === 0, `sem erros${errs.length ? ': ' + errs.join(' | ') : ''}`);
await b.close();
