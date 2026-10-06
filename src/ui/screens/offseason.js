// Fim de temporada: a figurinha do ano é colada no álbum, e o mercado abre.

import { esc, toast } from '../dom.js';
import { money, plural, round } from '../../core/utils.js';
import { attributeLabel } from '../../data/attributes.js';
import { getClub } from '../../data/clubs.js';
import { icon, initials, offerSticker, ratingBadge, statline } from '../components.js';

function growthSection(growth) {
  const gains = Object.entries(growth.gains ?? {});
  const losses = Object.entries(growth.losses ?? {});
  const delta = growth.delta;
  return `
    <section class="section">
      <h3>Evolução</h3>
      <p class="budget ${delta > 0 ? 'is-done' : ''}">
        <span class="num">${growth.before}</span>${icon('arrow-right')}<strong>${growth.after}</strong>
        <span>${delta > 0 ? `+${delta} de overall` : delta < 0 ? `${delta} de overall` : 'overall estável'}</span>
      </p>
      ${gains.length ? `<p class="muted">Subiu: ${esc(gains.map(([id, value]) => `${attributeLabel(id)} +${value}`).join(', '))}.</p>` : ''}
      ${losses.length ? `<p class="muted">Caiu com a idade: ${esc(losses.map(([id, value]) => `${attributeLabel(id)} ${value}`).join(', '))}.</p>` : ''}
      ${!gains.length && !losses.length ? '<p class="muted">Temporada sem mudança técnica relevante.</p>' : ''}
    </section>`;
}

export default {
  id: 'offseason',

  render(state) {
    const offseason = state.offseason;
    const player = state.player;
    if (!offseason) return '<div class="screen"><p>Fechando a temporada...</p></div>';

    const { summary, awards, prize, national, investments, growth, record } = offseason;
    const specials = [
      ...summary.trophies.map((trophy) => ({ name: trophy.name, icon: 'trophy' })),
      ...awards.map((award) => ({ name: award.name, icon: award.icon })),
      ...(national.trophy ? [{ name: national.trophy.name, icon: 'flag' }] : []),
    ];
    const offers = [...(offseason.renewal ? [offseason.renewal] : []), ...offseason.offers, ...offseason.loans];

    return `
      <div class="screen">
        <header class="legacy">
          <article class="card-sticker season-sticker is-new" aria-label="Figurinha da temporada ${offseason.year}">
            <div class="card-sticker__face">
              <span class="card-sticker__monogram">${esc(initials(summary.clubName))}</span>
              <span class="card-sticker__big"><strong>${growth.after}</strong><small>Overall</small></span>
            </div>
            <div class="card-sticker__band">${esc(summary.clubName)}</div>
            <div class="card-sticker__sub">${offseason.year}, ${record.age} anos</div>
            <div class="season-sticker__line"><span class="num">${record.apps} J</span><span class="num">${record.goals} G</span><span class="num">${record.assists} A</span></div>
          </article>
          <div class="section">
            <h1>Temporada ${offseason.year} encerrada</h1>
            <p class="lede">
              ${esc(summary.leagueName)}: ${summary.position ? `<strong>${summary.position}º lugar</strong>` : 'campanha encerrada'},
              <span class="num">${esc(summary.record)}</span>, <span class="num">${summary.points}</span> pontos.
              Figurinha colada no seu álbum.
            </p>
          </div>
        </header>

        <section class="section">
          <div class="section__head">
            <h2>Seu ano</h2>
            ${ratingBadge(record.rating)}
          </div>
          ${statline([
            { label: 'Jogos', value: record.apps },
            { label: 'Gols', value: record.goals },
            { label: 'Assistências', value: record.assists },
            { label: 'Melhor em campo', value: record.motm },
            { label: 'Nota média', value: record.rating ? round(record.rating, 2).toFixed(2) : '-' },
          ])}
        </section>

        ${
          specials.length
            ? `<section class="section">
                <h2>Figurinhas brilhantes</h2>
                <div class="album album--trophies">
                  ${specials
                    .map(
                      (item, index) => `
                    <article class="card-sticker sticker--foil trophy-sticker is-new" style="--i:${index + 1}">
                      ${icon(item.icon)}
                      <span class="trophy-sticker__name">${esc(item.name)}</span>
                      <span class="trophy-sticker__year num">${offseason.year}</span>
                    </article>`,
                    )
                    .join('')}
                </div>
              </section>`
            : ''
        }

        <div class="split">
          ${growthSection(growth)}
          <section class="section">
            <h3>Copas e seleção</h3>
            <ul class="ledger">
              <li><span>Copa nacional</span><strong>${esc(summary.cupStage)}</strong></li>
              ${summary.continental ? `<li><span>Torneio continental</span><strong>${esc(summary.continental)}</strong></li>` : ''}
              <li><span>Seleção</span><strong>${national.caps ? `<span class="num">${national.caps}</span> jogos, <span class="num">${national.goals}</span> gols` : 'Sem convocação'}</strong></li>
              ${national.tournament ? `<li><span>${esc(national.tournament.name)}</span><strong>${esc(national.tournament.result)}</strong></li>` : ''}
            </ul>
            ${offseason.nextContinental ? `<div class="notice notice--good">${icon('star')}<div>Classificado para o torneio continental do ano que vem.</div></div>` : ''}
          </section>
        </div>

        <section class="section">
          <h3>Dinheiro</h3>
          <ul class="ledger">
            ${prize.lines.map((line) => `<li><span>${esc(line.label)}</span><strong class="is-positive">${esc(money(line.value))}</strong></li>`).join('')}
            ${investments.lines
              .map(
                (line) =>
                  `<li><span>${esc(line.label)}${line.blewUp ? ', deu problema' : ''}</span><strong class="${line.value >= 0 ? 'is-positive' : 'is-negative'}">${esc(money(line.value))}</strong></li>`,
              )
              .join('')}
            <li><span>Em conta agora</span><strong>${esc(money(player.money))}</strong></li>
            <li><span>Valor de mercado</span><strong>${esc(money(offseason.marketValue))}</strong></li>
          </ul>
        </section>

        ${
          offseason.forcedRetirement
            ? `<section class="sheet section">
                <h2>Fim de linha</h2>
                <div class="notice notice--bad">${icon('warning')}<div>${esc(offseason.forcedRetirement)}</div></div>
                <div class="actions"><button class="btn btn--primary" data-action="forced-retire">Ver o álbum completo ${icon('arrow-right')}</button></div>
              </section>`
            : `
          <section class="section" aria-labelledby="mercado-titulo">
            <div class="section__head">
              <h2 id="mercado-titulo">Mercado da bola</h2>
              <p class="num">${plural(offers.length, 'proposta', 'propostas')}</p>
            </div>
            ${
              offseason.contractExpired
                ? `<div class="notice notice--warn">${icon('warning')}<div><strong>Seu contrato terminou.</strong> Escolha um clube ou fique em condições modestas.</div></div>`
                : `<p class="lede">Você tem contrato com o ${esc(getClub(player.club)?.name ?? 'clube atual')}, mas pode ouvir propostas.</p>`
            }
            ${
              offers.length
                ? `<div class="offers">${offers
                    .map((offer, index) =>
                      offerSticker(offer, player, {
                        action: `data-action="accept-offer" data-offer="${esc(offer.id)}"`,
                        label: offer.renewal ? 'Renovar' : offer.loan ? 'Aceitar empréstimo' : 'Assinar',
                        ariaLabel: `${offer.renewal ? 'Renovar com o' : offer.loan ? 'Ir emprestado ao' : 'Assinar com o'} ${offer.clubName}`,
                        highlight: Boolean(offer.renewal),
                        primary: Boolean(offer.renewal),
                        isNew: true,
                        index,
                      }),
                    )
                    .join('')}</div>`
                : '<p class="muted">Ninguém procurou você neste mercado. Siga trabalhando.</p>'
            }
            <div class="actions">
              <button class="btn" data-action="stay-club">Ficar no ${esc(getClub(player.club)?.name ?? 'clube atual')}</button>
              <button class="btn btn--quiet" data-action="retire-now">Me aposentar</button>
            </div>
          </section>`
        }
      </div>`;
  },

  actions: {
    'accept-offer': (ctx, dataset) => {
      ctx.game.acceptOffer(dataset.offer);
      ctx.save.schedule(300);
    },
    'stay-club': (ctx) => {
      ctx.game.stayAtClub();
      ctx.save.schedule(300);
    },
    'retire-now': async (ctx) => {
      const ok = await ctx.confirm({
        title: 'Encerrar a carreira?',
        text: 'Você vai se aposentar agora e ver o álbum completo com o seu legado.',
        confirmLabel: 'Pendurar as chuteiras',
        danger: true,
      });
      if (ok) {
        ctx.game.retire(false);
        ctx.save.schedule(200);
      }
    },
    'forced-retire': (ctx) => {
      ctx.game.retire(true);
      ctx.save.schedule(200);
      toast('Carreira encerrada.', 'info');
    },
  },
};
