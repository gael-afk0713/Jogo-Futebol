// Tela de partida: os lances em que você decide o que fazer.

import { esc } from '../dom.js';
import { round } from '../../core/utils.js';
import { feed, icon, meter, monogram, ratingBadge, statline, tierClass } from '../components.js';

const ui = { resolution: null };

function chanceMarkup(chance) {
  const value = Math.round(chance * 100);
  return `<span class="option__aside ${tierClass(value)}"><span class="option__chance">${value}%<small>de chance</small></span></span>`;
}

function stateMessage(match) {
  if (match.sentOff) return 'Você foi expulso e está fora da partida.';
  if (match.injured) return 'Você se machucou e saiu de campo.';
  if (match.substituted) return 'Você já foi substituído.';
  if (!match.onField && match.role === 'reserva') return 'Você começa no banco e deve entrar no segundo tempo.';
  return 'O jogo segue até o próximo lance em que você se envolve.';
}

function centerPanel(match) {
  if (ui.resolution) {
    const good = ui.resolution.success;
    return `
      <section class="sheet resolution resolution--${good ? 'good' : 'bad'}" aria-live="polite">
        <h2 class="resolution__title">${icon(good ? 'check' : 'x')}${good ? 'Deu certo' : 'Não deu'}</h2>
        <p class="moment__text">${esc(ui.resolution.text)}</p>
        <p class="muted">Você tinha <strong class="num">${Math.round(ui.resolution.chance * 100)}%</strong> de chance${
          ui.resolution.extras?.length ? `. ${esc(ui.resolution.extras.join(', '))}.` : '.'
        }</p>
        <div class="actions"><button class="btn btn--primary" data-action="match-continue">Continuar o jogo ${icon('arrow-right')}</button></div>
      </section>`;
  }

  if (match.pending) {
    return `
      <section class="sheet section" aria-labelledby="lance-titulo">
        <h2 id="lance-titulo"><span class="moment__minute">${match.minute}'</span>${esc(match.pending.title)}</h2>
        <p class="moment__text">${esc(match.pending.text)}</p>
        <ul class="optionlist">
          ${match.pending.options
            .map(
              (option) => `
            <li>
              <button class="option option--compact" data-action="match-choose" data-index="${option.index}">
                <span class="option__text">
                  <span class="option__title">${esc(option.label)}</span>
                  ${option.hint ? `<span class="option__desc">${esc(option.hint)}</span>` : ''}
                </span>
                ${chanceMarkup(option.chance)}
              </button>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`;
  }

  return `
    <section class="sheet section">
      <h2>Jogo rolando</h2>
      <p class="lede">${esc(stateMessage(match))}</p>
      <div class="actions"><button class="btn btn--primary" data-action="match-continue">Avançar o jogo ${icon('arrow-right')}</button></div>
    </section>`;
}

export default {
  id: 'match',

  render(state, ctx) {
    const match = state.match;
    if (!match) return '<div class="screen"><p>Preparando a partida...</p></div>';
    const preview = ctx.game.matchPreviewData();

    return `
      <div class="screen">
        <header class="scoreboard" aria-label="Placar">
          <div class="scoreboard__team">${monogram(match.clubName, { you: true })}<span class="scoreboard__name">${esc(match.clubName)}</span></div>
          <div class="scoreboard__clock">
            <div class="scoreboard__line">
              <span class="scoreboard__goals" aria-label="${esc(match.clubName)} ${match.score.team}">${match.score.team}</span>
              <span class="scoreboard__minute" aria-label="Minuto ${match.minute}">${match.minute}'</span>
              <span class="scoreboard__goals" aria-label="${esc(match.opponentName)} ${match.score.opponent}">${match.score.opponent}</span>
            </div>
            <span class="scoreboard__comp">${esc(match.competition?.name ?? '')}</span>
          </div>
          <div class="scoreboard__team scoreboard__team--away"><span class="scoreboard__name">${esc(match.opponentName)}</span>${monogram(match.opponentName)}</div>
        </header>

        <div class="match">
          <div class="stack stack--lg">
            ${centerPanel(match)}
            <div class="actions">
              <button class="btn btn--quiet" data-action="match-auto">Simular o resto da partida</button>
            </div>
          </div>

          <aside class="match__side stack stack--lg">
            <section class="section" aria-label="Seu jogo">
              <div class="section__head">
                <h3>Seu jogo</h3>
                ${ratingBadge(round(match.rating, 1))}
              </div>
              ${statline([
                { label: 'Gols', value: match.stats.goals },
                { label: 'Assist.', value: match.stats.assists },
                ...(match.zone === 'gol' ? [{ label: 'Defesas', value: match.stats.saves }] : [{ label: 'Desarmes', value: match.stats.tackles }]),
                { label: 'Minutos', value: Math.round(match.minutesPlayed) },
              ])}
              ${meter({ label: 'Energia', value: match.stamina, iconName: 'lightning' })}
              ${preview ? `<p class="muted">${esc(preview.forecast)} Força do adversário <strong class="num">${preview.opponentRating}</strong>.</p>` : ''}
            </section>

            <section class="section" aria-labelledby="narracao-titulo">
              <h3 id="narracao-titulo">Narração</h3>
              ${feed(match.timeline.slice().reverse(), { limit: 12, minute: true })}
            </section>
          </aside>
        </div>
      </div>`;
  },

  actions: {
    'match-choose': (ctx, dataset) => {
      ui.resolution = ctx.game.matchChoose(Number(dataset.index));
      ctx.rerender();
    },
    'match-continue': (ctx) => {
      ui.resolution = null;
      ctx.game.matchAdvance();
      ctx.save.schedule();
    },
    'match-auto': (ctx) => {
      ui.resolution = null;
      if (!ctx.game.state.match) return;
      ctx.game.autoFinishMatch();
      ctx.save.schedule();
    },
  },
};
