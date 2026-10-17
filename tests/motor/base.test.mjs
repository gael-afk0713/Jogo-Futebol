import { Game, SCREENS } from '../../src/core/game.js';
import { isYouthClub, YOUTH_AGE_LIMIT } from '../../src/engine/transfers.js';
import { getClub } from '../../src/data/clubs.js';
const ok = (c, m) => { console.log(c ? 'ok -' : 'FALHOU -', m); if (!c) process.exitCode = 1; };
let maxYouthAge = 0, agedOutCount = 0, agedOutWithOffers = 0, promotions = 0, promotionsAccepted = 0, errors = 0;
for (let seed = 1; seed <= 60; seed += 1) {
  const g = new Game();
  g.createCareer({ firstName: 'A', lastName: 'B', position: ['ATA', 'MEI', 'ZAG', 'GOL'][seed % 4], nationality: 'BRA', traits: [], groupPoints: {}, appearance: {}, seed });
  // procura um time de base com time profissional para testar a subida também
  const trials = g.state.trials.offers;
  g.acceptTrial((trials.find((o) => getClub(o.clubId)?.parent) ?? trials[0]).id);
  for (let s = 0; s < 8; s += 1) {
    try {
      g.simulateRestOfSeason();
      const o = g.state.offseason;
      if (!o) break;
      const p = g.state.player;
      if (o.agedOut) { agedOutCount += 1; if (o.offers.length) agedOutWithOffers += 1; }
      const promo = o.offers.find((x) => x.promotion);
      if (promo) promotions += 1;
      // pior caso: sempre tenta ficar ou renovar com a base
      if (o.renewal) g.acceptOffer(o.renewal.id); else g.stayAtClub();
      if (promo && g.state.player.club === promo.clubId) promotionsAccepted += 1;
      if (isYouthClub(g.state.player.club)) maxYouthAge = Math.max(maxYouthAge, g.state.player.age);
    } catch (e) { errors += 1; console.log(e.stack); break; }
  }
}
ok(errors === 0, 'sem erros');
ok(maxYouthAge <= YOUTH_AGE_LIMIT, `ninguém joga na base depois dos ${YOUTH_AGE_LIMIT} (máximo visto: ${maxYouthAge})`);
ok(agedOutCount > 0 && agedOutWithOffers === agedOutCount, `quem estoura a idade sempre tem proposta profissional (${agedOutWithOffers}/${agedOutCount})`);
ok(promotions > 0, `o time profissional do clube chama da base (${promotions} vezes)`);
ok(promotionsAccepted > 0, `ficar sem escolher, depois da idade, leva para a melhor proposta (${promotionsAccepted} subidas)`);
