// Simular não rende mais do que jogar: a simulação fica abaixo de quem segue a
// "melhor chance" e bem abaixo de quem escolhe pelo que cada opção vale.
import { readFileSync } from 'node:fs';
import { createMatch, autoPlay, advance, choose, successChance, PLAYER_ROLE } from '../../src/engine/match.js';
import { createRng } from '../../src/core/rng.js';

const base = JSON.parse(readFileSync(new URL('../dados/atacante.json', import.meta.url), 'utf8'));
const ok = (cond, msg) => {
  console.log(cond ? 'ok -' : 'FALHOU -', msg);
  if (!cond) process.exitCode = 1;
};

const value = (player, match, option) => {
  const chance = successChance(player, option, match);
  return chance * (option.success?.rating ?? 0) + (1 - chance) * (option.failure?.rating ?? 0);
};
const POLICIES = {
  simular: null,
  'melhor chance': (player, match, option) => successChance(player, option, match),
  'valor de cada opção': value,
};

function run(policy, games = 600) {
  let goals = 0;
  let rating = 0;
  for (let i = 0; i < games; i++) {
    const player = structuredClone(base);
    const rng = createRng(1000 + i);
    const match = createMatch({ player, clubId: base.club, opponentId: 'base_bra1_corinthians', competition: { id: 'league', name: 'X', stage: null, knockout: false }, isHome: true, role: PLAYER_ROLE.STARTER, rng, round: 1 });
    if (!POLICIES[policy]) autoPlay(match, player, rng);
    else {
      let guard = 0;
      while (!match.finished && guard++ < 60) {
        const step = advance(match, player, rng);
        if (step.type === 'finished') break;
        const scored = match.pending.raw.options.map((option, index) => ({ index, score: POLICIES[policy](player, match, option) }));
        scored.sort((a, b) => b.score - a.score);
        choose(match, player, scored[0].index, rng);
      }
    }
    goals += match.report.stats.goals;
    rating += match.report.rating;
  }
  return { goals: goals / games, rating: rating / games };
}

const results = Object.fromEntries(Object.keys(POLICIES).map((policy) => [policy, run(policy)]));
for (const [policy, r] of Object.entries(results)) console.log(`  ${policy.padEnd(20)} gols ${r.goals.toFixed(2)}  nota ${r.rating.toFixed(2)}`);
const sim = results.simular;
const best = results['melhor chance'];
const smart = results['valor de cada opção'];
ok(sim.rating < smart.rating - 0.1 && sim.goals < smart.goals, 'simular rende menos do que escolher pelo valor de cada opção');
ok(sim.rating <= best.rating + 0.02 && sim.goals <= best.goals + 0.03, 'simular não passa de quem segue a "melhor chance"');
