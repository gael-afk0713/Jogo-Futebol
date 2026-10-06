// O álbum completo: resumo final da carreira.

import { esc } from '../dom.js';
import { money, round } from '../../core/utils.js';
import { getClub } from '../../data/clubs.js';
import { getNation } from '../../data/nations.js';
import { getPosition } from '../../data/positions.js';
import { netWorth } from '../../engine/finance.js';
import { icon, initials, playerSticker, statline } from '../components.js';

export default {
  id: 'retired',

  render(state, ctx) {
    const player = state.player;
    if (!player) return '<div class="screen"><p>Carregando...</p></div>';
    const { score, tier } = ctx.game.retirementSummary();
    const totals = player.career.totals;
    const avg = totals.ratingCount ? totals.ratingSum / totals.ratingCount : 0;
    const peak = player.career.seasons.reduce((max, season) => Math.max(max, season.overallAfter ?? 0), player.overall);
    const nation = getNation(player.nationality);

    return `
      <div class="screen">
        <header class="legacy">
          ${playerSticker(player, { size: 'lg', overall: peak, foil: true, isNew: true, meta: `${nation.id} · ${getPosition(player.position).name}` })}
          <div class="section">
            <p class="tag">${icon(tier.icon)}${esc(tier.label)}</p>
            <h1>${esc(player.firstName)} ${esc(player.lastName)}</h1>
            <p class="lede">${esc(tier.text)}</p>
            <p class="lede">${esc(getPosition(player.position).name)}, ${esc(nation.name)}. Aposentado aos <span class="num">${player.age}</span> anos.</p>
            <p class="budget"><span>Legado</span><strong>${score}</strong><span>pontos</span></p>
          </div>
        </header>

        <section class="section">
          <h2>Números finais</h2>
          ${statline([
            { label: 'Jogos', value: totals.apps },
            { label: 'Gols', value: totals.goals },
            { label: 'Assistências', value: totals.assists },
            { label: 'Melhor em campo', value: totals.motm },
            { label: 'Nota média', value: avg ? round(avg, 2).toFixed(2) : '-' },
            { label: 'Pico de overall', value: peak },
          ])}
          <ul class="ledger">
            <li><span>Seleção</span><strong><span class="num">${totals.nationalCaps}</span> jogos, <span class="num">${totals.nationalGoals}</span> gols</strong></li>
            <li><span>Patrimônio</span><strong>${esc(money(netWorth(player)))}</strong></li>
            <li><span>Clubes defendidos</span><strong>${esc(player.career.clubs.map((id) => getClub(id)?.name ?? id).join(', '))}</strong></li>
          </ul>
        </section>

        <section class="section">
          <h2>Temporadas</h2>
          <div class="album">
            ${player.career.seasons
              .map(
                (season) => `
              <article class="card-sticker season-sticker">
                <div class="card-sticker__face">
                  <span class="card-sticker__monogram">${esc(initials(season.clubName))}</span>
                  <span class="card-sticker__big"><strong>${season.overallAfter}</strong><small>Overall</small></span>
                </div>
                <div class="card-sticker__band">${esc(season.clubName)}</div>
                <div class="card-sticker__sub">${season.year}, ${season.age} anos</div>
                <div class="season-sticker__line"><span class="num">${season.apps} J</span><span class="num">${season.goals} G</span><span class="num">${season.assists} A</span><span class="num">${season.rating || '-'}</span></div>
              </article>`,
              )
              .join('')}
          </div>
        </section>

        <div class="split">
          <section class="section">
            <h3>Títulos <span class="num muted">(${player.career.trophies.length})</span></h3>
            ${
              player.career.trophies.length
                ? `<ul class="ledger">${player.career.trophies.map((trophy) => `<li><span>${esc(trophy.name)}</span><strong class="num">${trophy.year}</strong></li>`).join('')}</ul>`
                : '<p class="muted">Nenhum título.</p>'
            }
          </section>
          <section class="section">
            <h3>Prêmios <span class="num muted">(${player.career.awards.length})</span></h3>
            ${
              player.career.awards.length
                ? `<ul class="ledger">${player.career.awards.map((award) => `<li><span>${esc(award.name)}</span><strong class="num">${award.year}</strong></li>`).join('')}</ul>`
                : '<p class="muted">Nenhum prêmio individual.</p>'
            }
          </section>
        </div>

        <div class="actions">
          <button class="btn btn--primary" data-action="new-career">Começar outra carreira ${icon('arrow-right')}</button>
          <button class="btn" data-action="go-album">Ver todas as carreiras</button>
        </div>
      </div>`;
  },

  actions: {
    'new-career': (ctx) => ctx.newCareer(),
  },
};
