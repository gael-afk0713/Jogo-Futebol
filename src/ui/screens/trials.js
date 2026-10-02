// Primeiro passo da carreira: escolher em qual peneira apostar.

import { esc } from '../dom.js';
import { money } from '../../core/utils.js';
import { getLeague, squadRating } from '../../data/clubs.js';
import { avatarSvg, overallBadge } from '../components.js';

export default {
  id: 'trials',

  render(state) {
    const player = state.player;
    const trials = state.trials;
    if (!player || !trials) return '<div class="screen"><p>Carregando...</p></div>';

    return `
      <div class="screen screen--trials">
        <header class="screen__head">
          <h1>Começando do zero</h1>
          <p class="muted">${esc(trials.intro)}</p>
        </header>

        <section class="preview">
          <div class="preview__avatar">${avatarSvg(player.appearance, 110)}</div>
          <div class="preview__info">
            <h2>${esc(player.firstName)} ${esc(player.lastName)}</h2>
            <p class="muted">Três clubes te chamaram para treinar. Escolha um — o nível do clube muda
            o quanto você vai jogar e o quanto vai aparecer.</p>
          </div>
          ${overallBadge(player.overall, { label: player.position, size: 'lg' })}
        </section>

        <div class="offers">
          ${trials.offers
            .map((offer) => {
              const league = getLeague(offer.leagueId);
              const rating = squadRating(offer.clubId);
              const gap = player.overall - rating;
              const chance = gap >= 0 ? 'Você já está no nível do grupo' : gap > -8 ? 'Vai disputar posição' : 'Vai precisar suar para aparecer';
              return `
                <article class="offer">
                  <header class="offer__head">
                    <h3>${esc(offer.clubName)}</h3>
                    <span class="offer__league">${esc(league?.name ?? '')}</span>
                  </header>
                  <p class="offer__pitch">${esc(offer.pitch)}</p>
                  <ul class="offer__facts">
                    <li>Nível do plantel: <strong>${rating}</strong></li>
                    <li>Salário: <strong>${esc(money(offer.weeklySalary))}</strong>/semana</li>
                    <li>Contrato: <strong>${offer.years} temporadas</strong></li>
                    <li class="muted">${esc(chance)}</li>
                  </ul>
                  <button class="btn btn--primary btn--block" data-action="accept-trial" data-offer="${esc(offer.id)}">
                    Assinar com o ${esc(offer.clubName)}
                  </button>
                </article>`;
            })
            .join('')}
        </div>
      </div>`;
  },

  actions: {
    'accept-trial': (ctx, dataset) => {
      ctx.game.acceptTrial(dataset.offer);
      ctx.save.schedule(300);
    },
  },
};
