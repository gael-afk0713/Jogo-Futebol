// Componentes reutilizáveis de interface.

import { esc, html, raw } from './dom.js';
import { clamp, money, round } from '../core/utils.js';
import { ATTRIBUTE_GROUPS, attributeTier } from '../data/attributes.js';
import { getPosition, isGoalkeeper } from '../data/positions.js';
import { getClub, getLeague } from '../data/clubs.js';
import { getNation } from '../data/nations.js';
import { getTrait } from '../data/traits.js';
import { LIFE_STATS } from '../engine/player.js';
import { effectiveAttributes } from '../engine/overall.js';

export const SKIN_TONES = ['#f6d7bd', '#edbb93', '#d79a68', '#b9794f', '#8d5524', '#5c3317'];

export const HAIR_STYLES = [
  { id: 'curto', label: 'Curto' },
  { id: 'moicano', label: 'Moicano' },
  { id: 'black', label: 'Black power' },
  { id: 'longo', label: 'Longo' },
  { id: 'raspado', label: 'Raspado' },
  { id: 'coque', label: 'Coque' },
];

export const BEARD_STYLES = [
  { id: 'nenhuma', label: 'Sem barba' },
  { id: 'cavanhaque', label: 'Cavanhaque' },
  { id: 'cheia', label: 'Barba cheia' },
];

export const ACCESSORIES = [
  { id: 'nenhum', label: 'Nenhum' },
  { id: 'faixa', label: 'Faixa de capitão' },
  { id: 'luvas', label: 'Luvas' },
  { id: 'fita', label: 'Fita no cabelo' },
];

export const HAIR_COLORS = ['#1b1210', '#3d2314', '#7a4a21', '#c9a227', '#d9d9d9', '#b02e2e', '#2f6fb3'];

/** Avatar do jogador em SVG, montado a partir da aparência escolhida. */
export function avatarSvg(appearance = {}, size = 112) {
  const skin = SKIN_TONES[clamp(appearance.skin ?? 3, 0, SKIN_TONES.length - 1)];
  const hairColor = appearance.hairColor ?? '#2b1d14';
  const hair = appearance.hair ?? 'curto';
  const beard = appearance.beard ?? 'nenhuma';
  const accessory = appearance.accessory ?? 'nenhum';

  const hairShapes = {
    curto: `<path d="M26 40c0-16 12-24 26-24s26 8 26 24c0-6-10-10-26-10S26 34 26 40z" fill="${hairColor}"/>`,
    moicano: `<path d="M48 12c6 0 10 6 10 16v10h-10z" fill="${hairColor}"/><path d="M28 40c2-8 8-12 14-14v12z" fill="${hairColor}" opacity=".55"/>`,
    black: `<ellipse cx="52" cy="32" rx="30" ry="22" fill="${hairColor}"/>`,
    longo: `<path d="M24 42c0-18 12-26 28-26s28 8 28 26v30c-6 4-10-6-10-18 0-10-8-14-18-14s-18 4-18 14c0 12-4 22-10 18z" fill="${hairColor}"/>`,
    raspado: `<path d="M28 40c0-14 11-22 24-22s24 8 24 22c-3-4-11-7-24-7s-21 3-24 7z" fill="${hairColor}" opacity=".45"/>`,
    coque: `<path d="M26 40c0-16 12-24 26-24s26 8 26 24c0-6-10-10-26-10S26 34 26 40z" fill="${hairColor}"/><circle cx="52" cy="12" r="8" fill="${hairColor}"/>`,
  };

  const beardShapes = {
    nenhuma: '',
    cavanhaque: `<path d="M44 74h16c0 6-4 10-8 10s-8-4-8-10z" fill="${hairColor}" opacity=".85"/>`,
    cheia: `<path d="M28 54c0 22 10 32 24 32s24-10 24-32c-4 14-12 18-24 18s-20-4-24-18z" fill="${hairColor}" opacity=".9"/>`,
  };

  const accessoryShapes = {
    nenhum: '',
    faixa: `<rect x="30" y="92" width="44" height="7" rx="3" fill="#f2c200"/>`,
    luvas: `<circle cx="18" cy="96" r="9" fill="#2bbf6a"/><circle cx="86" cy="96" r="9" fill="#2bbf6a"/>`,
    fita: `<rect x="26" y="34" width="52" height="6" rx="3" fill="#ffffff" opacity=".85"/>`,
  };

  return `
    <svg class="avatar" viewBox="0 0 104 104" width="${size}" height="${size}" role="img" aria-label="Avatar do jogador">
      <circle cx="52" cy="52" r="50" fill="rgba(255,255,255,.06)"/>
      <ellipse cx="52" cy="58" rx="26" ry="30" fill="${skin}"/>
      <ellipse cx="42" cy="54" rx="3.4" ry="4.2" fill="#1b2430"/>
      <ellipse cx="62" cy="54" rx="3.4" ry="4.2" fill="#1b2430"/>
      <path d="M44 68q8 6 16 0" stroke="#8d4a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      ${beardShapes[beard] ?? ''}
      ${hairShapes[hair] ?? hairShapes.curto}
      ${accessoryShapes[accessory] ?? ''}
    </svg>`;
}

/** Barra horizontal 0..100. */
export function statBar(value, { tier = null, label = '', showValue = true } = {}) {
  const safe = clamp(Math.round(value ?? 0), 0, 100);
  const cls = tier ?? attributeTier(safe);
  return `
    <div class="bar" role="img" aria-label="${esc(label)}: ${safe}">
      <div class="bar__fill bar__fill--${cls}" style="width:${safe}%"></div>
      ${showValue ? `<span class="bar__value">${safe}</span>` : ''}
    </div>`;
}

/** Medalhão com o overall. */
export function overallBadge(value, { label = 'OVR', size = 'md' } = {}) {
  return `
    <div class="ovr ovr--${size} ovr--${attributeTier(value)}">
      <strong>${Math.round(value)}</strong>
      <small>${esc(label)}</small>
    </div>`;
}

/** Cartão de identidade do jogador (usado no topo do hub). */
export function playerCard(player, { marketValue = 0, position = null } = {}) {
  const pos = getPosition(player.position);
  const nation = getNation(player.nationality);
  const club = getClub(player.club);
  const league = getLeague(club?.leagueId);

  return `
    <section class="player-card">
      <div class="player-card__avatar">
        ${avatarSvg(player.appearance, 96)}
        <span class="player-card__number">${esc(player.appearance.kitNumber ?? 10)}</span>
      </div>
      <div class="player-card__info">
        <h2>${esc(player.firstName)} <strong>${esc(player.lastName)}</strong></h2>
        <p class="player-card__meta">
          ${esc(nation.flag)} ${esc(nation.name)} · ${esc(pos.name)} · ${player.age} anos · pé ${esc(player.foot)}
        </p>
        <p class="player-card__club">
          ${club ? `<strong>${esc(club.name)}</strong> · ${esc(league?.name ?? '')}` : '<em>Sem clube</em>'}
          ${position ? ` · ${position}º na tabela` : ''}
        </p>
        <p class="player-card__value">💰 ${esc(money(player.money))} · valor de mercado ${esc(money(marketValue))}</p>
      </div>
      ${overallBadge(player.overall, { label: pos.short, size: 'lg' })}
    </section>`;
}

/** Grade completa de atributos agrupados. */
export function attributeGrid(player, { spendable = false, skillPoints = 0, costOf = null, ceiling = 99 } = {}) {
  const attrs = effectiveAttributes(player);
  const gk = isGoalkeeper(player.position);
  const groups = ATTRIBUTE_GROUPS.filter((group) => (group.goalkeeperOnly ? gk : true));

  return groups
    .map((group) => {
      const rows = group.attributes
        .map((attribute) => {
          const base = player.attributes[attribute.id] ?? 0;
          const effective = attrs[attribute.id] ?? base;
          const bonus = effective - base;
          const cost = costOf ? costOf(base) : 0;
          const canBuy = spendable && skillPoints >= cost && base < ceiling;
          return `
            <li class="attr">
              <span class="attr__label">
                ${esc(attribute.label)}
                ${bonus ? `<em class="attr__bonus">+${bonus}</em>` : ''}
              </span>
              ${statBar(effective, { label: attribute.label })}
              ${
                spendable
                  ? `<button class="attr__buy" data-action="spend-point" data-attr="${attribute.id}"
                      ${canBuy ? '' : 'disabled'} title="Custa ${cost} ponto(s)">+${cost}</button>`
                  : ''
              }
            </li>`;
        })
        .join('');
      return `
        <div class="attr-group">
          <h4>${esc(group.icon)} ${esc(group.label)}</h4>
          <ul class="attr-list">${rows}</ul>
        </div>`;
    })
    .join('');
}

/** Painel dos atributos de vida. */
export function lifePanel(player) {
  return `
    <div class="life-grid">
      ${LIFE_STATS.map(
        (stat) => `
        <div class="life-stat">
          <span class="life-stat__label">${esc(stat.icon)} ${esc(stat.label)}</span>
          ${statBar(player.life[stat.id], { label: stat.label })}
        </div>`,
      ).join('')}
    </div>`;
}

export function traitChips(traitIds = []) {
  if (!traitIds.length) return '<p class="muted">Nenhum traço.</p>';
  return `<div class="chips">${traitIds
    .map((id) => {
      const trait = getTrait(id);
      if (!trait) return '';
      return `<span class="chip" title="${esc(trait.description)}">${esc(trait.icon)} ${esc(trait.name)}</span>`;
    })
    .join('')}</div>`;
}

/** Tabela de classificação. */
export function leagueTable(standingsRows, highlightClubId, { limit = 0 } = {}) {
  const rows = limit ? standingsRows.slice(0, limit) : standingsRows;
  return `
    <table class="table">
      <thead>
        <tr><th>#</th><th>Clube</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr>
      </thead>
      <tbody>
        ${rows
          .map((row, index) => {
            const club = getClub(row.clubId);
            const highlight = row.clubId === highlightClubId ? ' class="is-you"' : '';
            return `<tr${highlight}>
              <td>${standingsRows.indexOf(row) + 1}</td>
              <td>${esc(club?.name ?? row.clubId)}</td>
              <td><strong>${row.points}</strong></td>
              <td>${row.played}</td>
              <td>${row.wins}</td>
              <td>${row.draws}</td>
              <td>${row.losses}</td>
              <td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>`;
}

/** Linha de estatísticas compacta. */
export function statRow(items) {
  return `<div class="stat-row">${items
    .map(
      (item) => `
      <div class="stat">
        <span class="stat__value">${esc(item.value)}</span>
        <span class="stat__label">${esc(item.label)}</span>
      </div>`,
    )
    .join('')}</div>`;
}

export function newsFeed(news, limit = 8) {
  if (!news.length) return '<p class="muted">Nada ainda.</p>';
  return `<ul class="news">${news
    .slice(0, limit)
    .map((item) => `<li class="news__item news__item--${item.type}">${esc(item.text)}</li>`)
    .join('')}</ul>`;
}

export const ratingClass = (rating) => {
  if (rating >= 8) return 'elite';
  if (rating >= 7) return 'otimo';
  if (rating >= 6.5) return 'bom';
  if (rating >= 5.5) return 'medio';
  return 'fraco';
};

export function ratingPill(rating) {
  if (!rating) return '<span class="pill pill--muted">—</span>';
  return `<span class="pill pill--${ratingClass(rating)}">${round(rating, 1)}</span>`;
}

export { html, raw, esc };
