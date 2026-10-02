// Resumo final da carreira.

import { esc } from '../dom.js';
import { money, round } from '../../core/utils.js';
import { getClub } from '../../data/clubs.js';
import { getNation } from '../../data/nations.js';
import { getPosition } from '../../data/positions.js';
import { netWorth } from '../../engine/finance.js';
import { avatarSvg, statRow } from '../components.js';

export default {
  id: 'retired',

  render(state, ctx) {
    const player = state.player;
    if (!player) return '<div class="screen"><p>...</p></div>';
    const { score, tier } = ctx.game.retirementSummary();
    const totals = player.career.totals;
    const avg = totals.ratingCount ? totals.ratingSum / totals.ratingCount : 0;
    const peak = player.career.seasons.reduce((max, season) => Math.max(max, season.overallAfter ?? 0), player.overall);

    return `
      <div class="screen screen--retired">
        <header class="legacy">
          <div class="legacy__avatar">${avatarSvg(player.appearance, 120)}</div>
          <span class="legacy__tier">${esc(tier.icon)} ${esc(tier.label)}</span>
          <h1>${esc(player.firstName)} ${esc(player.lastName)}</h1>
          <p class="muted">${esc(getNation(player.nationality).flag)} ${esc(getNation(player.nationality).name)} ·
            ${esc(getPosition(player.position).name)} · aposentado aos ${player.age} anos</p>
          <p class="legacy__text">${esc(tier.text)}</p>
          <p class="legacy__score">Pontuação de legado: <strong>${score}</strong></p>
        </header>

        <section class="card">
          <h3>Números finais</h3>
          ${statRow([
            { label: 'Jogos', value: totals.apps },
            { label: 'Gols', value: totals.goals },
            { label: 'Assistências', value: totals.assists },
            { label: 'Melhor em campo', value: totals.motm },
            { label: 'Nota média', value: round(avg, 2) || '—' },
            { label: 'Pico de overall', value: peak },
            { label: 'Seleção', value: `${totals.nationalCaps} jogos / ${totals.nationalGoals} gols` },
            { label: 'Patrimônio', value: money(netWorth(player)) },
          ])}
        </section>

        <section class="card">
          <h3>Títulos (${player.career.trophies.length})</h3>
          ${
            player.career.trophies.length
              ? `<ul class="list">${player.career.trophies
                  .map((trophy) => `<li>🏆 ${esc(trophy.name)} <small class="muted">${trophy.year}</small></li>`)
                  .join('')}</ul>`
              : '<p class="muted">Nenhum título.</p>'
          }
        </section>

        <section class="card">
          <h3>Prêmios (${player.career.awards.length})</h3>
          ${
            player.career.awards.length
              ? `<ul class="list">${player.career.awards
                  .map((award) => `<li>${esc(award.icon ?? '🏅')} ${esc(award.name)} <small class="muted">${award.year}</small></li>`)
                  .join('')}</ul>`
              : '<p class="muted">Nenhum prêmio individual.</p>'
          }
        </section>

        <section class="card">
          <h3>Clubes que defendeu</h3>
          <div class="chips">
            ${player.career.clubs.map((clubId) => `<span class="chip">${esc(getClub(clubId)?.name ?? clubId)}</span>`).join('')}
          </div>
        </section>

        <section class="card">
          <h3>Trajetória</h3>
          <table class="table">
            <thead><tr><th>Ano</th><th>Clube</th><th>OVR</th><th>J</th><th>G</th><th>A</th><th>Nota</th></tr></thead>
            <tbody>
              ${player.career.seasons
                .map(
                  (season) => `
                <tr>
                  <td>${season.year}</td>
                  <td>${esc(season.clubName)}</td>
                  <td>${season.overallAfter}</td>
                  <td>${season.apps}</td>
                  <td>${season.goals}</td>
                  <td>${season.assists}</td>
                  <td>${season.rating || '—'}</td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </section>

        <div class="sticky-actions">
          <button class="btn btn--primary btn--block" data-action="new-career">Começar uma nova carreira</button>
        </div>
      </div>`;
  },

  actions: {
    'new-career': async (ctx) => {
      const ok = await ctx.confirm({
        title: 'Nova carreira',
        text: 'Isso apaga o save atual e começa tudo de novo.',
        confirmLabel: 'Começar de novo',
        danger: true,
      });
      if (!ok) return;
      await ctx.save.deleteAll();
      ctx.game.reset();
      ctx.game.startCreation();
    },
  },
};
