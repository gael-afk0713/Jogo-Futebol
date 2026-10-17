// Narração: o gol do seu lance sai numa linha só; a assistência perdida não diz
// "Assistência!"; o companheiro do texto é o mesmo que marca.
import { readFileSync } from 'node:fs';
import { createMatch, advance, choose, PLAYER_ROLE } from '../../src/engine/match.js';
import { createRng } from '../../src/core/rng.js';

const base = JSON.parse(readFileSync(new URL('../dados/atacante.json', import.meta.url), 'utf8'));
const ok = (cond, msg) => {
  console.log(cond ? 'ok -' : 'FALHOU -', msg);
  if (!cond) process.exitCode = 1;
};

const problems = [];
let goals = 0;
let assistsMade = 0;
let assistsMissed = 0;
for (let i = 0; i < 400; i++) {
  const player = structuredClone(base);
  const rng = createRng(77 + i);
  const pick = createRng(9000 + i);
  const match = createMatch({ player, clubId: base.club, opponentId: 'base_bra1_corinthians', competition: { id: 'league', name: 'X', stage: null, knockout: false }, isHome: true, role: PLAYER_ROLE.STARTER, rng, round: 1 });
  let guard = 0;
  while (!match.finished && guard++ < 60) {
    const step = advance(match, player, rng);
    if (step.type === 'finished') break;
    const index = pick.int(0, match.pending.raw.options.length - 1);
    const mate = match.mate;
    const before = match.timeline.length;
    const res = choose(match, player, index, rng);
    const added = match.timeline.slice(before);
    if (res.teamGoal) {
      goals++;
      if (added.some((line) => line.text === res.text)) problems.push(`linha do lance repetida no gol: ${res.text}`);
      if (added.filter((line) => line.mark === 'goal-for').length !== 1) problems.push(`gol sem uma linha só: ${JSON.stringify(added)}`);
      if (res.kind === 'assist') {
        assistsMade++;
        const scorer = match.goals.at(-1).scorer;
        if (!scorer || !mate.endsWith(scorer)) problems.push(`quem marcou (${scorer}) não é o companheiro do texto (${mate})`);
      }
    } else {
      if (added[0]?.text !== res.text) problems.push(`linha do lance fora de ordem: ${res.text}`);
      if (res.kind === 'assist' && res.success) {
        assistsMissed++;
        if (/Assistência|só empurra|para o gol!|fatura|completou|marca/.test(res.text)) problems.push(`assistência perdida conta gol: ${res.text}`);
        if (!res.text.includes(mate)) problems.push(`texto sem o companheiro: ${res.text}`);
      }
    }
  }
}
for (const problem of [...new Set(problems)].slice(0, 8)) console.log(`  ${problem}`);
ok(goals > 100 && problems.length === 0, `${goals} gols do time na narração, cada um numa linha só`);
ok(assistsMade > 5 && assistsMissed > 5, `assistências: ${assistsMade} viraram gol do companheiro certo, ${assistsMissed} perdidas sem dizer "Assistência!"`);
