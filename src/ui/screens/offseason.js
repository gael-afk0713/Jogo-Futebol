// Fim de temporada: balanço, prêmios, evolução e mercado da bola.

import { esc, toast } from '../dom.js';
import { money, round } from '../../core/utils.js';
import { attributeLabel } from '../../data/attributes.js';
import { getClub, squadRating } from '../../data/clubs.js';
import { ratingPill, statRow } from '../components.js';

function growthBlock(growth) {
  const gains = Object.entries(growth.gains ?? {});
  const losses = Object.entries(growth.losses ?? {});
  return `
    <section class="card">
      <header class="card__head">
        <h3>Evolução</h3>
        <span class="pill pill--${growth.delta > 0 ? 'elite' : growth.delta < 0 ? 'fraco' : 'medio'}">
          ${growth.before} → ${growth.after} (${growth.delta >= 0 ? '+' : ''}${growth.delta})
        </span>
      </header>
      ${
        gains.length
          ? `<p class="muted">Subiu: ${esc(gains.map(([id, value]) => `${attributeLabel(id)} +${value}`).join(', '))}</p>`
          : ''
      }
      ${
        losses.length
          ? `<p class="muted">Caiu com a idade: ${esc(losses.map(([id, value]) => `${attributeLabel(id)} ${value}`).join(', '))}</p>`
          : ''
      }
      ${!gains.length && !losses.length ? '<p class="muted">Temporada sem mudança técnica relevante.</p>' : ''}
    </section>`;
}

function offerCard(offer, player, { highlight = false } = {}) {
  const rating = squadRating(offer.clubId);
  const gap = player.overall - rating;
  const fit = gap >= 3 ? 'Você seria referência' : gap >= -2 ? 'Você brigaria pela titularidade' : gap >= -8 ? 'Vai ter que conquistar espaço' : 'Clube muito acima do seu nível atual';

  return `
    <article class="offer ${highlight ? 'offer--highlight' : ''}">
      <header class="offer__head">
        <h3>${esc(offer.clubName)}</h3>
        <span class="offer__league">${esc(offer.leagueName)}</span>
      </header>
      <p class="offer__pitch">${esc(offer.pitch)}</p>
      <ul class="offer__facts">
        <li>Função: <strong>${esc(offer.roleLabel)}</strong></li>
        <li>Salário: <strong>${esc(money(offer.weeklySalary))}</strong>/semana</li>
        <li>Contrato: <strong>${offer.years} temporada(s)</strong></li>
        ${offer.signingBonus ? `<li>Luvas: ${esc(money(offer.signingBonus))}</li>` : ''}
        <li>Nível do plantel: <strong>${rating}</strong></li>
        ${offer.continental ? '<li>🌍 Disputa torneio continental</li>' : ''}
        <li class="muted">${esc(fit)}</li>
      </ul>
      <button class="btn btn--primary btn--block" data-action="accept-offer" data-offer="${esc(offer.id)}">
        ${offer.renewal ? 'Renovar contrato' : offer.loan ? 'Aceitar empréstimo' : 'Assinar'}
      </button>
    </article>`;
}

export default {
  id: 'offseason',

  render(state) {
    const offseason = state.offseason;
    const player = state.player;
    if (!offseason) return '<div class="screen"><p>Fechando a temporada...</p></div>';

    const { summary, awards, prize, national, investments, growth, record } = offseason;

    return `
      <div class="screen screen--offseason">
        <header class="screen__head">
          <span class="hero__badge">Fim da temporada ${offseason.year}</span>
          <h1>${esc(summary.clubName)}</h1>
          <p class="muted">${esc(summary.leagueName)} · ${summary.position ? `${summary.position}º lugar` : 'campanha encerrada'} ·
            ${esc(summary.record)} · ${summary.points} pontos</p>
        </header>

        <section class="card">
          <h3>Seu ano</h3>
          ${statRow([
            { label: 'Jogos', value: record.apps },
            { label: 'Gols', value: record.goals },
            { label: 'Assist.', value: record.assists },
            { label: 'Melhor em campo', value: record.motm },
            { label: 'Nota', value: round(record.rating, 2) || '—' },
          ])}
          <p>Nota média da temporada: ${ratingPill(record.rating)}</p>
        </section>

        ${growthBlock(growth)}

        ${
          summary.trophies.length
            ? `<section class="card card--trophy">
                <h3>🏆 Títulos conquistados</h3>
                <ul class="list">${summary.trophies.map((trophy) => `<li>${esc(trophy.name)}</li>`).join('')}</ul>
              </section>`
            : ''
        }

        ${
          awards.length
            ? `<section class="card card--award">
                <h3>Prêmios individuais</h3>
                <ul class="list">${awards.map((award) => `<li>${esc(award.icon)} ${esc(award.name)}</li>`).join('')}</ul>
              </section>`
            : ''
        }

        <section class="card">
          <h3>Copas</h3>
          <ul class="list">
            <li>Copa nacional: <strong>${esc(summary.cupStage)}</strong></li>
            ${summary.continental ? `<li>Torneio continental: <strong>${esc(summary.continental)}</strong></li>` : ''}
            ${offseason.nextContinental ? '<li>🌍 Classificado para o torneio continental do ano que vem!</li>' : ''}
          </ul>
        </section>

        <section class="card">
          <h3>Seleção</h3>
          <p>${esc(national.text)}</p>
          ${national.tournament ? `<p class="muted">${esc(national.tournament.name)}: ${esc(national.tournament.result)}</p>` : ''}
        </section>

        <section class="card">
          <h3>Dinheiro</h3>
          ${
            prize.lines.length
              ? `<ul class="list">${prize.lines
                  .map((line) => `<li>${esc(line.label)}: <strong>${esc(money(line.value))}</strong></li>`)
                  .join('')}</ul>`
              : '<p class="muted">Sem bônus nesta temporada.</p>'
          }
          ${
            investments.lines.length
              ? `<h4>Investimentos</h4>
                 <ul class="list">${investments.lines
                   .map(
                     (line) =>
                       `<li>${esc(line.label)}: <strong class="${line.value >= 0 ? 'is-positive' : 'is-negative'}">${esc(money(line.value))}</strong>${line.blewUp ? ' <small class="muted">(deu problema)</small>' : ''}</li>`,
                   )
                   .join('')}</ul>`
              : ''
          }
          <p class="muted">Em conta: <strong>${esc(money(player.money))}</strong> ·
            valor de mercado: <strong>${esc(money(offseason.marketValue))}</strong></p>
        </section>

        ${
          offseason.forcedRetirement
            ? `<section class="card card--danger">
                <h3>Fim de linha</h3>
                <p>${esc(offseason.forcedRetirement)}</p>
                <button class="btn btn--danger btn--block" data-action="forced-retire">Encerrar a carreira</button>
              </section>`
            : `
          <section class="market">
            <h2>Mercado da bola</h2>
            ${
              offseason.contractExpired
                ? '<p class="banner banner--warn">Seu contrato terminou. Você precisa de um novo clube.</p>'
                : '<p class="muted">Você tem contrato, mas pode ouvir propostas.</p>'
            }

            <div class="offers">
              ${offseason.renewal ? offerCard(offseason.renewal, player, { highlight: true }) : ''}
              ${offseason.offers.map((offer) => offerCard(offer, player)).join('')}
              ${offseason.loans.map((offer) => offerCard(offer, player)).join('')}
            </div>

            ${
              !offseason.offers.length && !offseason.loans.length && !offseason.renewal
                ? '<p class="muted">Ninguém te procurou neste mercado. Siga trabalhando.</p>'
                : ''
            }

            <div class="row-actions">
              <button class="btn btn--ghost" data-action="stay-club">
                Ficar no ${esc(getClub(player.club)?.name ?? 'clube atual')}
              </button>
              <button class="btn btn--danger btn--ghost" data-action="retire-now">Me aposentar</button>
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
        text: 'Você vai se aposentar agora e ver o resumo do seu legado.',
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
