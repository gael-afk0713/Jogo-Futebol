// Carreiras inteiras, da peneira à aposentadoria, pelo caminho interativo
// (treino, evento, partida) com escolhas sorteadas. CARREIRAS=150 para a
// rodada longa; o padrão é 40.
import { Game, SCREENS } from '../../src/core/game.js';
import { POSITION_IDS } from '../../src/data/positions.js';
import { NATIONS } from '../../src/data/nations.js';
import { TRAITS } from '../../src/data/traits.js';
import { ATTRIBUTE_IDS } from '../../src/data/attributes.js';
import { createRng } from '../../src/core/rng.js';

const rng = createRng(2024);
let errors = [], stats = { careers:0, seasons:0, retired:0, forced:0, noOffers:0, maxOvr:0, minOvr:99, loans:0, events:0 };
const seen = new Set();

const CAREERS = Number(process.env.CARREIRAS ?? 40);
for (let c = 0; c < CAREERS; c++) {
  try {
    const game = new Game();
    game.rng.seed = rng.int(1, 2**30);
    const position = rng.pick(POSITION_IDS);
    const traits = rng.shuffle(TRAITS.map(t=>t.id)).slice(0,2);
    const gp = {}; let left = 26;
    for (const g of ['ritmo','finalizacao','passe','drible','defesa','fisico','goleiro']) {
      const v = Math.min(8, left, rng.int(0,8)); gp[g]=v; left-=v;
    }
    game.createCareer({ firstName:'P'+c, lastName:'T', nationality: rng.pick(NATIONS).id, position, traits, groupPoints: gp, appearance:{} });
    game.acceptTrial(rng.pick(game.state.trials.offers).id);
    stats.careers++;
    let guard = 0;
    while (guard++ < 40000) {
      const st = game.state;
      if (st.screen === SCREENS.RETIRED) { stats.retired++; break; }
      if (st.screen === SCREENS.OFFSEASON) {
        stats.seasons++;
        const o = st.offseason;
        if (o.forcedRetirement) { stats.forced++; game.retire(true); continue; }
        if (!o.offers.length && !o.renewal && !o.loans.length) stats.noOffers++;
        if (o.loans.length) stats.loans++;
        const all = [...o.offers, ...(o.renewal?[o.renewal]:[]), ...o.loans];
        if (all.length && rng.chance(0.8)) game.acceptOffer(rng.pick(all).id);
        else game.stayAtClub();
        continue;
      }
      if (st.screen === SCREENS.MATCH) { game.autoFinishMatch(); continue; }
      // caminho interativo de verdade: treino -> evento -> partida
      if (st.week.step === 'treino') { game.chooseTraining(rng.pick(['tecnico','fisico','academia','tatico','descanso','livre','goleiro','finalizacao','bola_parada'])); continue; }
      if (st.week.step === 'vida') {
        const ev = game.currentEvent();
        if (ev) { seen.add(ev.id); stats.events++; game.resolveEvent(rng.pick(ev.options).index); }
        else game.state.week.step = 'partida';
        continue;
      }
      if (st.week.step === 'partida') {
        if (!game.currentMatch) { game.skipFreeWeek(); continue; }
        if (rng.chance(0.5)) { game.startMatch(); continue; }
        game.simulateMatch(); continue;
      }
      if (st.week.step === 'fim') { game.advanceWeek(); continue; }
      // gasta pontos às vezes
      if (game.player.skillPoints > 5) game.spendPoint(rng.pick(ATTRIBUTE_IDS));
    }
    const p = game.player;
    stats.maxOvr = Math.max(stats.maxOvr, p.overall);
    stats.minOvr = Math.min(stats.minOvr, p.overall);
    // checagens de integridade
    for (const k of ATTRIBUTE_IDS) {
      const v = p.attributes[k];
      if (!Number.isFinite(v) || v < 1 || v > 99) errors.push(`attr ${k}=${v}`);
    }
    for (const [k,v] of Object.entries(p.life)) if (!Number.isFinite(v) || v<0 || v>100) errors.push(`life ${k}=${v}`);
    if (!Number.isFinite(p.money) || p.money < 0) errors.push(`money=${p.money}`);
    if (!Number.isFinite(p.overall)) errors.push('overall NaN');
    const ser = JSON.stringify(game.serialize());
    if (ser.includes('NaN') || ser.includes('undefined,')) errors.push('save com NaN/undefined');
    const g2 = new Game();
    if (!g2.load(JSON.parse(ser))) errors.push('load falhou');
  } catch (e) {
    errors.push(`CRASH carreira ${c}: ${e.message}\n${e.stack.split('\n').slice(0,4).join('\n')}`);
  }
}
console.log(stats);
console.log('eventos de vida vistos:', seen.size, '/ 36');
console.log([...new Set(errors)].slice(0, 10).join('\n'));
const ok = (cond, msg) => { console.log(cond ? 'ok -' : 'FALHOU -', msg); if (!cond) process.exitCode = 1; };
ok(errors.length === 0, `nenhum erro de integridade (${errors.length})`);
ok(stats.retired === CAREERS, `toda carreira chega à aposentadoria (${stats.retired} de ${CAREERS})`);
ok(stats.seasons >= CAREERS * 10, `carreiras longas: ${stats.seasons} temporadas`);
