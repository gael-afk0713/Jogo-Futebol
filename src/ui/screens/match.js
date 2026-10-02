// Tela de partida: os lances em que você decide o que fazer.

import { esc } from '../dom.js';
import { pct, round } from '../../core/utils.js';
import { statBar, statRow } from '../components.js';

const ui = { resolution: null };

function chanceClass(chance) {
  if (chance >= 0.7) return 'elite';
  if (chance >= 0.5) return 'bom';
  if (chance >= 0.3) return 'medio';
  return 'fraco';
}

export default {
  id: 'match',

  render(state, ctx) {
    const match = state.match;
    if (!match) return '<div class="screen"><p>Preparando a partida...</p></div>';
    const preview = ctx.game.matchPreviewData();
    const player = state.player;

    return `
      <div class="screen screen--match">
        <header class="scoreboard">
          <div class="scoreboard__team">
            <span>${esc(match.clubName)}</span>
            <strong>${match.score.team}</strong>
          </div>
          <div class="scoreboard__clock">
            <span class="scoreboard__minute">${match.minute}'</span>
            <small>${esc(match.competition?.name ?? '')}</small>
          </div>
          <div class="scoreboard__team scoreboard__team--away">
            <strong>${match.score.opponent}</strong>
            <span>${esc(match.opponentName)}</span>
          </div>
        </header>

        <section class="match-status">
          ${statRow([
            { label: 'Sua nota', value: round(match.rating, 1) },
            { label: 'Gols', value: match.stats.goals },
            { label: 'Assist.', value: match.stats.assists },
            ...(match.zone === 'gol' ? [{ label: 'Defesas', value: match.stats.saves }] : []),
            { label: 'Minutos', value: Math.round(match.minutesPlayed) },
          ])}
          <div class="match-status__stamina">
            <span>Energia</span>
            ${statBar(match.stamina, { label: 'Energia' })}
          </div>
          ${preview ? `<p class="muted">${esc(preview.forecast)} Força do adversário: ${preview.opponentRating}.</p>` : ''}
        </section>

        ${
          ui.resolution
            ? `
          <section class="card card--resolution ${ui.resolution.success ? 'is-success' : 'is-failure'}">
            <h3>${ui.resolution.success ? '✅ Deu certo!' : '❌ Não deu'}</h3>
            <p>${esc(ui.resolution.text)}</p>
            <p class="muted">Chance que você tinha: ${esc(pct(ui.resolution.chance))}
              ${ui.resolution.extras?.length ? ` · ${esc(ui.resolution.extras.join(' · '))}` : ''}</p>
            <button class="btn btn--primary btn--block" data-action="match-continue">Continuar o jogo →</button>
          </section>`
            : match.pending
              ? `
          <section class="card card--moment">
            <span class="moment__tag">${esc(match.pending.tag ?? 'jogo')}</span>
            <h3>${esc(match.pending.title)}</h3>
            <p class="moment__text">${esc(match.pending.text)}</p>
            <div class="choices">
              ${match.pending.options
                .map(
                  (option) => `
                <button class="choice choice--moment" data-action="match-choose" data-index="${option.index}">
                  <strong>${esc(option.label)}</strong>
                  <small class="muted">${esc(option.hint)}</small>
                  <span class="choice__chance pill pill--${chanceClass(option.chance)}">${esc(pct(option.chance))}</span>
                </button>`,
                )
                .join('')}
            </div>
          </section>`
              : `
          <section class="card">
            <h3>Jogo rolando...</h3>
            <p class="muted">${
              match.sentOff
                ? 'Você foi expulso e está fora da partida.'
                : match.injured
                  ? 'Você se machucou e saiu de campo.'
                  : match.substituted
                    ? 'Você já foi substituído.'
                    : 'Aguardando o próximo lance em que você se envolve.'
            }</p>
            <button class="btn btn--primary btn--block" data-action="match-continue">Avançar o jogo →</button>
          </section>`
        }

        <section class="card">
          <h3>Narração</h3>
          <ul class="timeline">
            ${match.timeline
              .slice()
              .reverse()
              .slice(0, 14)
              .map(
                (entry) => `
              <li class="timeline__item timeline__item--${entry.type}">
                <span class="timeline__minute">${entry.minute}'</span>
                <span>${esc(entry.text)}</span>
              </li>`,
              )
              .join('')}
          </ul>
        </section>

        <section class="card">
          <div class="row-actions">
            <button class="btn btn--ghost" data-action="match-auto">Simular o resto da partida</button>
          </div>
        </section>
      </div>`;
  },

  actions: {
    'match-choose': (ctx, dataset) => {
      const resolution = ctx.game.matchChoose(Number(dataset.index));
      ui.resolution = resolution;
      ctx.rerender();
    },
    'match-continue': (ctx) => {
      ui.resolution = null;
      ctx.game.matchAdvance();
      ctx.save.schedule();
    },
    'match-auto': (ctx) => {
      ui.resolution = null;
      const match = ctx.game.state.match;
      if (!match) return;
      ctx.game.autoFinishMatch();
      ctx.save.schedule();
    },
  },
};
