// Primeiro passo da carreira: escolher em qual peneira apostar.

import { esc } from '../dom.js';
import { getNation } from '../../data/nations.js';
import { getPosition } from '../../data/positions.js';
import { offerSticker, playerSticker } from '../components.js';

export default {
  id: 'trials',

  render(state) {
    const player = state.player;
    const trials = state.trials;
    if (!player || !trials) return '<div class="screen"><p>Carregando...</p></div>';

    return `
      <div class="screen">
        <header class="legacy">
          ${playerSticker(player, { size: 'md', isNew: true, meta: `${getNation(player.nationality).id} · ${getPosition(player.position).name}` })}
          <div class="section">
            <h1>Começando do zero</h1>
            <p class="lede">${esc(trials.intro)}</p>
            <p class="lede">Três bases te aprovaram na peneira. No clube grande o treino é melhor e mais gente te vê, mas é difícil jogar; no pequeno você é titular desde o começo. Escolha uma.</p>
          </div>
        </header>

        <div class="offers">
          ${trials.offers
            .map((offer, index) =>
              offerSticker(offer, player, {
                action: `data-action="accept-trial" data-offer="${esc(offer.id)}"`,
                label: 'Assinar',
                ariaLabel: `Assinar com o ${offer.clubName}`,
                isNew: true,
                index,
              }),
            )
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
