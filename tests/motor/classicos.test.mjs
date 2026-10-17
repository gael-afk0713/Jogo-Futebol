import { Game } from '../../src/core/game.js';
import { rivalryBetween } from '../../src/data/rivals.js';
import * as M from '../../src/engine/match.js';
import { createRng } from '../../src/core/rng.js';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
const g = new Game();
g.createCareer({ firstName: 'A', lastName: 'B', position: 'ATA', nationality: 'BRA', traits: [], groupPoints: {}, appearance: {}, seed: 8 });
g.acceptTrial(g.state.trials.offers[0].id);
const p = g.state.player;
for (const id of Object.keys(p.attributes)) if (!id.startsWith('gk')) p.attributes[id] = 78;
p.overall = 78; p.club = 'bra1_flamengo'; p.contract.role = 'estrela';
g.beginSeason(2027, false);
const derbyWeeks = g.state.season.calendar.filter((w) => rivalryBetween('bra1_flamengo', w.opponentId)).map((w) => rivalryBetween('bra1_flamengo', w.opponentId).name);
ok(derbyWeeks.includes('Fla-Flu') && derbyWeeks.includes('Clássico dos Milhões'), `calendário do Flamengo tem clássicos: ${[...new Set(derbyWeeks)].join(', ')}`);
ok(g.hubData().fixturePreview !== undefined, 'hub monta a prévia');
g.simulateRestOfSeason();
const rec = p.career.derbies;
const played = rec ? rec.won + rec.drawn + rec.lost : 0;
ok(played >= 3, `clássicos contados no histórico: ${JSON.stringify(rec)}`);
const derbyNews = g.state.news.filter((n) => /Fla-Flu|Milhões|Rivalidade|clássico/i.test(n.text));
ok(derbyNews.length > 0, `notícias de clássico: ${derbyNews.slice(0, 2).map((n) => n.text).join(' | ')}`);
// evento do clássico no começo do jogo
const rng = createRng(3);
let classico = 0, total = 0;
for (let i = 0; i < 400; i += 1) {
  const m = M.createMatch({ player: p, clubId: 'bra1_flamengo', opponentId: 'bra1_fluminense', competition: { id: 'liga', name: 'L' }, isHome: true, role: M.PLAYER_ROLE.STARTER, rng, derby: 'Fla-Flu' });
  M.advance(m, p, rng);
  total += 1;
  if (m.pending?.id === 'classico') { classico += 1; if (classico === 1) ok(m.pending.title === 'Dia de Fla-Flu' && !m.pending.text.includes('{'), `título e texto preenchidos: "${m.pending.title}" / ${m.pending.text}`); }
}
ok(classico / total > 0.6 && classico / total < 0.9, `clima de clássico no começo em ${Math.round(classico / total * 100)}% dos jogos`);
