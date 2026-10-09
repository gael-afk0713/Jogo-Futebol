// Componentes de interface do mundo "álbum de figurinhas".

import { esc } from './dom.js';
import { ICONS } from './icons.js';
import { clamp, plural, round } from '../core/utils.js';
import { ATTRIBUTE_GROUPS, attributeTier } from '../data/attributes.js';
import { getPosition, isGoalkeeper } from '../data/positions.js';
import { getClub, squadRating } from '../data/clubs.js';
import { money } from '../core/utils.js';
import { getTrait } from '../data/traits.js';
import { LIFE_STATS } from '../engine/player.js';
import { effectiveAttributes } from '../engine/overall.js';

/* ------------------------------------------------------------------ ícones */

/** Ícone Phosphor em SVG. Decorativo por padrão; passe `label` quando ele for o único conteúdo. */
export function icon(name, { label = '', cls = '' } = {}) {
  const paths = ICONS[name] ?? ICONS['soccer-ball'];
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="icon ${cls}" viewBox="0 0 256 256" ${a11y}>${paths}</svg>`;
}

/* --------------------------------------------------------------- aparência */

export const SKIN_TONES = ['#ecb58d', '#d3996d', '#bf8056', '#b97a4f', '#7e4d32', '#4e3026'];

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
  { id: 'rala', label: 'Barba por fazer' },
  { id: 'bigode', label: 'Bigode' },
  { id: 'cavanhaque', label: 'Cavanhaque' },
  { id: 'cheia', label: 'Barba cheia' },
];

export const HAIR_COLORS = [
  { value: '#1b1210', label: 'Preto' },
  { value: '#3d2314', label: 'Castanho escuro' },
  { value: '#7a4a21', label: 'Castanho' },
  { value: '#c9a227', label: 'Loiro' },
  { value: '#d9d9d9', label: 'Platinado' },
  { value: '#b02e2e', label: 'Vermelho' },
  { value: '#2f6fb3', label: 'Azul' },
];

/* Retrato em camadas: pele (6 tons), cabelo em cinza pintado na cor escolhida,
   barba, acessórios e o número da camisa. As camadas de pele e cabelo são
   ilustrações em assets/avatar, todas no mesmo quadro de 440x513. */
const AVATAR_W = 440;
const AVATAR_H = 513;
const HAIR_INDEX = { curto: 1, moicano: 2, black: 3, longo: 4, raspado: 5, coque: 6 };
const avatarAsset = (name) => new URL(`../../assets/avatar/${name}.webp`, import.meta.url).href;

function hexToRgb(hex) {
  const value = Number.parseInt(String(hex).replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => channel / 255);
}

/**
 * Filtro que pinta o cabelo cinza na cor escolhida, mantendo a sombra:
 * o cinza escuro vira a cor escurecida e o cinza claro vira o brilho.
 */
function hairTint(hex) {
  const base = hexToRgb(hex);
  const stops = Array.from({ length: 11 }, (_, index) => index / 10);
  const tone = (gray, channel) => {
    const t = clamp((gray - 0.2) / 0.3, 0, 1);
    const dark = base[channel] * 0.45;
    const mid = base[channel];
    const light = mid + (1 - mid) * 0.35;
    const value = t < 0.5 ? dark + (mid - dark) * (t / 0.5) : mid + (light - mid) * ((t - 0.5) / 0.5);
    return round(value, 3);
  };
  const table = (channel) => stops.map((gray) => tone(gray, channel)).join(' ');
  const id = `tinta-${String(hex).replace('#', '')}`;
  return {
    id,
    markup: `<filter id="${id}" color-interpolation-filters="sRGB"><feComponentTransfer>
      <feFuncR type="table" tableValues="${table(0)}"/><feFuncG type="table" tableValues="${table(1)}"/><feFuncB type="table" tableValues="${table(2)}"/>
    </feComponentTransfer></filter>`,
  };
}

/**
 * Sombra do cabelo sobre a pele: a silhueta do cabelo, escura, desfocada e
 * um pouco abaixo, recortada pela própria pele (não cai no fundo azul).
 */
const HAIR_SHADOW_DEFS = `
  <filter id="sombra-cabelo" x="-10%" y="-10%" width="120%" height="130%" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.04  0 0 0 0.42 0"/>
    <feGaussianBlur stdDeviation="5"/>
    <feOffset dy="9"/>
  </filter>
  <filter id="silhueta-branca" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/>
  </filter>`;

/** Barba ilustrada, em cinza, pintada na cor do cabelo. "Por fazer" é a cheia mais leve. */
function beardMarkup(beard, filterId) {
  const layer = { cavanhaque: 'cavanhaque', cheia: 'cheia', bigode: 'bigode', rala: 'cheia' }[beard];
  if (!layer) return '';
  const opacity = beard === 'rala' ? ' opacity=".5"' : '';
  return `<image href="${avatarAsset(`barba-${layer}`)}" width="${AVATAR_W}" height="${AVATAR_H}" filter="url(#${filterId})"${opacity}/>`;
}

/** Retrato do jogador: cabeça e ombros, como na foto da figurinha. */
export function avatarSvg(appearance = {}, { label = 'Retrato do jogador' } = {}) {
  const skin = clamp(Math.round(appearance.skin ?? 3), 0, SKIN_TONES.length - 1) + 1;
  const hair = HAIR_INDEX[appearance.hair] ?? HAIR_INDEX.curto;
  const hairColor = appearance.hairColor ?? '#1b1210';
  const tint = hairTint(hairColor);
  const kitNumber = Number.parseInt(appearance.kitNumber, 10);

  return `
    <svg class="avatar" viewBox="0 0 ${AVATAR_W} ${AVATAR_H}" role="img" aria-label="${esc(label)}">
      <defs>
        ${tint.markup}
        ${HAIR_SHADOW_DEFS}
        <mask id="pele-${skin}-mascara" maskUnits="userSpaceOnUse" x="0" y="0" width="${AVATAR_W}" height="${AVATAR_H}">
          <image href="${avatarAsset(`pele-${skin}`)}" width="${AVATAR_W}" height="${AVATAR_H}" filter="url(#silhueta-branca)"/>
        </mask>
      </defs>
      <image href="${avatarAsset(`pele-${skin}`)}" width="${AVATAR_W}" height="${AVATAR_H}"/>
      <g mask="url(#pele-${skin}-mascara)">
        <image href="${avatarAsset(`cabelo-${hair}`)}" width="${AVATAR_W}" height="${AVATAR_H}" filter="url(#sombra-cabelo)"/>
      </g>
      ${beardMarkup(appearance.beard, tint.id)}
      <image href="${avatarAsset(`cabelo-${hair}`)}" width="${AVATAR_W}" height="${AVATAR_H}" filter="url(#${tint.id})"/>
      ${Number.isFinite(kitNumber) ? `<text class="avatar__kit" x="356" y="480" text-anchor="middle">${kitNumber}</text>` : ''}
    </svg>`;
}

/* ------------------------------------------------------------------ campo */

// Medidas oficiais (105 x 68 m), atacando para a direita.
const ZONE_BANDS = { gol: [0, 17], defesa: [0, 35], meio: [35, 70], ataque: [70, 105] };
const ZONE_SPOT = { gol: [9, 34], defesa: [24, 30], meio: [52, 38], ataque: [82, 32] };

/** Onde a bola está em cada lance (só apresentação; o motor não usa). */
const MOMENT_SPOTS = {
  cara_a_cara: [89, 29],
  bola_na_meia_lua: [80, 37],
  cruzamento_na_area: [99, 21],
  contra_ataque: [66, 42],
  falta_frontal: [83, 34],
  penalti: [94, 34],
  saida_de_bola: [22, 44],
  duelo_meio: [53, 28],
  transicao: [46, 40],
  um_contra_um_defensivo: [14, 27],
  bola_aerea_defensiva: [1.5, 1.5],
  saida_zaga: [19, 36],
  finalizacao_de_fora: [23, 30],
  cara_a_cara_gol: [13, 37],
  cruzamento_gol: [7, 22],
  penalti_defender: [11, 34],
  rebote_goleiro: [97, 31],
  tabela_entrada: [84, 30],
  contato_area: [93, 26],
  linha_impedimento: [74, 22],
  de_costas: [86, 36],
  escanteio_primeiro_pau: [100, 27],
  goleiro_adiantado: [55, 34],
  pressao_goleiro_rival: [99, 38],
  roubada_alta: [72, 30],
  contra_ataque_rival: [48, 30],
  inverter_jogo: [50, 58],
  segurar_resultado: [70, 64],
  dividida_meio: [52, 34],
  rebote_intermediaria: [78, 40],
  ponta_livre: [55, 20],
  atacante_veloz: [26, 22],
  marcacao_escanteio: [5, 30],
  ultima_linha: [18, 34],
  linha_defesa: [30, 34],
  um_contra_um_ponta: [24, 62],
  pressao_saida_defesa: [12, 40],
  bola_rebatida_area: [8, 36],
  lateral_apoia: [70, 63],
  chute_desviado: [18, 30],
  escanteio_lotado: [5, 30],
  recuo_errado: [12, 38],
  reposicao_pressao: [5, 40],
  cabecada_queima_roupa: [5, 33],
  falta_rapida: [20, 36],
  time_recuado: [14, 34],
};

/** Posições no diagrama de criação. */
export const POSITION_SPOTS = {
  GOL: [5, 34],
  ZAG: [20, 34],
  LAT: [24, 58],
  VOL: [38, 34],
  MC: [50, 24],
  MEI: [66, 34],
  PON: [78, 10],
  SA: [82, 42],
  ATA: [92, 30],
};

export function momentSpot(momentId, zone) {
  return MOMENT_SPOTS[momentId] ?? ZONE_SPOT[zone] ?? ZONE_SPOT.meio;
}

function pitchLines() {
  return `
    <g class="pitch__lines">
      <rect x="0" y="0" width="105" height="68"/>
      <line x1="52.5" y1="0" x2="52.5" y2="68"/>
      <circle cx="52.5" cy="34" r="9.15"/>
      <rect x="0" y="13.84" width="16.5" height="40.32"/>
      <rect x="88.5" y="13.84" width="16.5" height="40.32"/>
      <rect x="0" y="24.84" width="5.5" height="18.32"/>
      <rect x="99.5" y="24.84" width="5.5" height="18.32"/>
      <path d="M16.5 26.69a9.15 9.15 0 0 1 0 14.62"/>
      <path d="M88.5 26.69a9.15 9.15 0 0 0 0 14.62"/>
      <path d="M0 1a1 1 0 0 0 1-1M104 0a1 1 0 0 0 1 1M1 68a1 1 0 0 0-1-1M105 67a1 1 0 0 0-1 1"/>
    </g>
    <g class="pitch__spots">
      <circle cx="52.5" cy="34" r=".7"/><circle cx="11" cy="34" r=".7"/><circle cx="94" cy="34" r=".7"/>
    </g>
    <g class="pitch__goal pitch__goal--own"><rect x="-2.4" y="30.34" width="2.4" height="7.32"/></g>
    <g class="pitch__goal pitch__goal--their">
      <rect x="105" y="30.34" width="2.4" height="7.32"/>
      <path class="pitch__net" d="M105.8 30.34v7.32M106.6 30.34v7.32M105 32.17h2.4M105 34h2.4M105 35.83h2.4"/>
    </g>`;
}

/**
 * Campo em linhas de giz impressas no papel do álbum.
 * mode 'moment': destaca a zona do lance e mostra a bola.
 * mode 'goal': a bola viaja até a rede (momento do gol).
 * mode 'positions': diagrama de posições para a criação.
 */
export function pitch({ zone = 'meio', spot = null, mode = 'moment', position = null, label = 'Campo', momentKey = null } = {}) {
  const [x, y] = spot ?? ZONE_SPOT[zone] ?? ZONE_SPOT.meio;
  const band = ZONE_BANDS[zone] ?? ZONE_BANDS.meio;
  const goal = mode === 'goal';
  const body =
    mode === 'positions'
      ? Object.entries(POSITION_SPOTS)
          .map(([id, [px, py]]) => {
            const active = id === position;
            return `<g class="pitch__pos ${active ? 'is-active' : ''}"><circle cx="${px}" cy="${py}" r="${active ? 4.4 : 3.2}"/><text x="${px}" y="${py + 1.15}" text-anchor="middle">${id}</text></g>`;
          })
          .join('')
      : `
        <rect class="pitch__zone" x="${band[0]}" y="0" width="${band[1] - band[0]}" height="68"/>
        ${goal ? `<path class="pitch__trail" d="M${x} ${y} L106 34" pathLength="1"/>` : ''}
        <g class="pitch__ball ${goal ? 'is-shot' : ''}" style="--bx:${x}px;--by:${y}px;--gx:${106 - x}px;--gy:${34 - y}px">
          <circle r="1.9"/>
        </g>`;
  return `
    <svg class="pitch pitch--${mode}" viewBox="-4 -3 113 74" role="img" aria-label="${esc(label)}" ${momentKey ? `data-moment="${esc(momentKey)}"` : ''}>
      ${pitchLines()}
      ${body}
    </svg>`;
}

/* ------------------------------------------------------------- figurinhas */

/** Sigla curta de um clube ou nome, para monogramas. */
export function initials(name = '') {
  const words = name
    .replace(/sub-20/i, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-Z]{2,}$/.test(word));
  if (!words.length) return name.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Figurinha do jogador. O número da figurinha é o overall.
 * size: 'sm' | 'md' | 'lg'
 */
export function playerSticker(player, { size = 'md', isNew = false, overall = null, meta = null, foil = false, pulse = null } = {}) {
  const position = getPosition(player.position);
  const club = getClub(player.club);
  const value = overall ?? player.overall;
  const caption = meta ?? `${player.nationality} · ${club?.name ?? 'Sem clube'}`;
  return `
    <figure class="sticker sticker--${size} ${foil ? 'sticker--foil' : ''} ${isNew ? 'is-new' : ''}">
      <div class="sticker__photo">
        ${avatarSvg(player.appearance, { label: `Retrato de ${player.firstName} ${player.lastName}` })}
        <div class="sticker__number" aria-label="Overall ${value}, ${position.name}">
          <strong ${pulse ? `data-pulse="${esc(pulse)}" data-value="${esc(value)}" data-count` : ''}>${esc(value)}</strong>
          <small>${esc(position.short)}</small>
        </div>
      </div>
      <figcaption>
        <div class="sticker__band">${esc(player.nickname || player.firstName)}</div>
        <div class="sticker__meta">${esc(caption)}</div>
      </figcaption>
    </figure>`;
}

/** Monograma de clube (sem escudo fabricado: só a sigla). */
export function monogram(name, { you = false } = {}) {
  return `<span class="monogram ${you ? 'monogram--you' : ''}" aria-hidden="true">${esc(initials(name))}</span>`;
}

/* ---------------------------------------------------------- medidores */

export const tierClass = (value) => `tier--${attributeTier(value)}`;

export const ratingTier = (rating) => {
  if (rating >= 8) return 'elite';
  if (rating >= 7) return 'otimo';
  if (rating >= 6.5) return 'bom';
  if (rating >= 5.5) return 'medio';
  return 'fraco';
};

export function meter({ label, value, iconName = null, tier = null, suffix = '', pulse = null }) {
  const safe = clamp(Math.round(value ?? 0), 0, 100);
  const attrs = pulse ? `data-pulse="${esc(pulse)}" data-value="${safe}"` : '';
  return `
    <div class="meter ${tier ?? tierClass(safe)}" ${attrs}>
      <span class="meter__label">${iconName ? icon(iconName) : ''}${esc(label)}</span>
      <span class="meter__value">${safe}${esc(suffix)}</span>
      <div class="meter__track" role="meter" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safe}">
        <div class="meter__fill" style="--v:${safe / 100}"></div>
      </div>
    </div>`;
}

/** Atributos de vida (todos ou só alguns). */
export function lifeMeters(player, ids = null) {
  const stats = ids ? LIFE_STATS.filter((stat) => ids.includes(stat.id)) : LIFE_STATS;
  return stats.map((stat) => meter({ label: stat.label, value: player.life[stat.id], iconName: stat.icon })).join('');
}

export function ratingBadge(rating, { pulse = null } = {}) {
  if (!rating) return '<span class="rating rating--empty num">-</span>';
  const value = round(rating, 1).toFixed(1);
  const attrs = pulse ? `data-pulse="${esc(pulse)}" data-value="${value}"` : '';
  return `<span class="rating tier--${ratingTier(rating)} num" ${attrs}>${value}</span>`;
}


/* -------------------------------------------------------- atributos */

export function attributeList(player, { spendable = false, skillPoints = 0, costOf = null, ceiling = 99 } = {}) {
  const attrs = effectiveAttributes(player);
  const gk = isGoalkeeper(player.position);
  const groups = ATTRIBUTE_GROUPS.filter((group) => (group.goalkeeperOnly ? gk : true));

  return `<div class="attrs">${groups
    .map((group) => {
      const rows = group.attributes
        .map((attribute) => {
          const base = player.attributes[attribute.id] ?? 0;
          const effective = attrs[attribute.id] ?? base;
          const bonus = effective - base;
          const cost = costOf ? costOf(base) : 0;
          const atCeiling = base >= ceiling;
          const canBuy = spendable && skillPoints >= cost && !atCeiling;
          const buyLabel = atCeiling
            ? `${attribute.label} já está no seu teto atual`
            : `Subir ${attribute.label} por ${plural(cost, 'ponto', 'pontos')}`;
          return `
            <li class="attr ${tierClass(effective)}">
              <span class="attr__label">${esc(attribute.label)}${bonus ? `<span class="attr__bonus">+${bonus}</span>` : ''}</span>
              <span class="attr__value">${effective}</span>
              <div class="meter__track" aria-hidden="true"><div class="meter__fill" style="--v:${effective / 100}"></div></div>
              ${
                spendable
                  ? `<button class="attr__buy" data-action="spend-point" data-attr="${attribute.id}" ${canBuy ? '' : 'disabled'}
                      aria-label="${esc(buyLabel)}" title="${esc(buyLabel)}">${atCeiling ? 'teto' : `+1<small>${cost} pt${cost > 1 ? 's' : ''}</small>`}</button>`
                  : ''
              }
            </li>`;
        })
        .join('');
      return `
        <section class="attrs__group">
          <h3>${icon(group.icon)}${esc(group.label)}</h3>
          <ul class="attrs__list">${rows}</ul>
        </section>`;
    })
    .join('')}</div>`;
}

export function traitChips(traitIds = []) {
  if (!traitIds.length) return '<p class="muted">Nenhum traço.</p>';
  return `<div class="traits">${traitIds
    .map((id) => {
      const trait = getTrait(id);
      if (!trait) return '';
      return `<span class="trait-chip" title="${esc(trait.description)}">${icon(trait.icon)}${esc(trait.name)}</span>`;
    })
    .join('')}</div>`;
}

/* ------------------------------------------------------------ números */

export function statline(items) {
  return `<dl class="statline">${items
    .map(
      (item) => `
      <div class="statline__item">
        <dt class="statline__label">${esc(item.label)}</dt>
        <dd class="statline__value">${esc(item.value)}</dd>
      </div>`,
    )
    .join('')}</dl>`;
}

/* ------------------------------------------------------------ tabela */

export function leagueTable(rows, highlightClubId, { continentalSpots = 0 } = {}) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="num" scope="col">#</th>
            <th scope="col">Clube</th>
            <th class="num" scope="col">P</th>
            <th class="num" scope="col">J</th>
            <th class="num" scope="col">V</th>
            <th class="num" scope="col">E</th>
            <th class="num" scope="col">D</th>
            <th class="num table__wide" scope="col"><abbr title="Gols pró">GP</abbr></th>
            <th class="num table__wide" scope="col"><abbr title="Gols contra">GC</abbr></th>
            <th class="num" scope="col"><abbr title="Saldo de gols">SG</abbr></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row, index) => {
              const club = getClub(row.clubId);
              const classes = [row.clubId === highlightClubId ? 'is-you' : '', index < continentalSpots ? 'zone-up' : '']
                .filter(Boolean)
                .join(' ');
              const you = row.clubId === highlightClubId;
              return `<tr class="${classes}" ${you ? 'aria-current="true"' : ''}>
                <td class="num"><span class="table__pos">${index + 1}</span></td>
                <td><span class="table__club">${you ? monogram(club?.name ?? '', { you: true }) : ''}${esc(club?.name ?? row.clubId)}</span></td>
                <td class="num"><strong>${row.points}</strong></td>
                <td class="num">${row.played}</td>
                <td class="num">${row.wins}</td>
                <td class="num">${row.draws}</td>
                <td class="num">${row.losses}</td>
                <td class="num table__wide">${row.goalsFor}</td>
                <td class="num table__wide">${row.goalsAgainst}</td>
                <td class="num">${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>`;
}

/* -------------------------------------------------------------- feeds */

const DEFAULT_FEED_ICON = { good: 'check', bad: 'warning', info: 'soccer-ball' };

/** Marca do lance na súmula: cartão de verdade, bola na rede ou o ícone. */
function feedMark(item) {
  if (item.mark === 'yellow' || item.mark === 'red') {
    return `<span class="feed__icon feed__icon--card"><span class="card-mark card-mark--${item.mark}" role="img" aria-label="Cartão ${item.mark === 'red' ? 'vermelho' : 'amarelo'}"></span></span>`;
  }
  return `<span class="feed__icon">${icon(item.icon ?? DEFAULT_FEED_ICON[item.type] ?? 'soccer-ball')}</span>`;
}

export function feed(items, { limit = 8, minute = false, keyPrefix = '' } = {}) {
  if (!items.length) return '<p class="muted">Nada por aqui ainda.</p>';
  return `<ul class="feed">${items
    .slice(0, limit)
    .map((item) => {
      if (item.mark === 'final') {
        return `<li class="feed__divider">${icon('timer')}<span>${esc(item.text)}</span></li>`;
      }
      const goal = item.mark === 'goal-for' || item.mark === 'goal-against';
      const key = keyPrefix ? `data-new-key="${esc(`${keyPrefix}${item.minute}-${item.text}`)}"` : '';
      return `
      <li class="feed__item feed__item--${esc(item.type)} ${goal ? `feed__item--goal feed__item--${item.mark}` : ''} ${keyPrefix ? 'is-new' : ''}" ${key}>
        ${feedMark(item)}
        <span>${minute ? `<span class="feed__minute">${item.minute}'</span>` : ''}${esc(item.text)}</span>
      </li>`;
    })
    .join('')}</ul>`;
}

/* --------------------------------------------------------- passos */

export function stepper(steps, currentIndex) {
  return `
    <ol class="stepper" aria-label="Etapas da semana">
      ${steps
        .map((label, index) => {
          const state = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '';
          const dot = index < currentIndex ? icon('check') : index + 1;
          return `<li class="stepper__item ${state}" ${index === currentIndex ? 'aria-current="step"' : ''}>
            <span class="stepper__dot">${dot}</span>${esc(label)}</li>`;
        })
        .join('')}
    </ol>`;
}

/* ------------------------------------------------------------ propostas */

function fitFor(player, rating) {
  const gap = player.overall - rating;
  if (gap >= 3) return { text: 'Você chegaria como referência', tier: 'elite' };
  if (gap >= -2) return { text: 'Você brigaria pela titularidade', tier: 'bom' };
  if (gap >= -8) return { text: 'Vai precisar conquistar espaço', tier: 'medio' };
  return { text: 'Clube muito acima do seu nível atual', tier: 'fraco' };
}

/** Proposta de clube como figurinha: frente com sigla e nível, verso com o contrato. */
export function offerSticker(offer, player, { action, label, ariaLabel = null, highlight = false, isNew = false, index = 0, primary = false }) {
  const rating = squadRating(offer.clubId);
  const fit = fitFor(player, rating);
  return `
    <article class="card-sticker ${highlight ? 'is-highlight' : ''} ${isNew ? 'is-new' : ''}" ${isNew ? `style="--i:${index}"` : ''}>
      <div class="card-sticker__face">
        <span class="card-sticker__monogram" aria-hidden="true">${esc(initials(offer.clubName))}</span>
        <span class="card-sticker__big"><strong>${rating}</strong><small>Plantel</small></span>
      </div>
      <h3 class="card-sticker__band">${esc(offer.clubName)}</h3>
      <div class="card-sticker__sub">${esc(offer.leagueName)}</div>
      <div class="card-sticker__body">
        <p class="offer__pitch">${esc(offer.pitch)}</p>
        <ul class="offer__facts">
          <li><span>Função</span><strong>${esc(offer.roleLabel)}</strong></li>
          <li><span>Salário</span><strong class="num">${esc(money(offer.weeklySalary))} por semana</strong></li>
          <li><span>Contrato</span><strong class="num">${esc(plural(offer.years, 'temporada', 'temporadas'))}</strong></li>
          ${offer.signingBonus ? `<li><span>Luvas</span><strong class="num">${esc(money(offer.signingBonus))}</strong></li>` : ''}
          ${offer.continental ? '<li><span>Torneio continental</span><strong>Possível</strong></li>' : ''}
        </ul>
        <p class="offer__fit tier--${fit.tier} tier-text">${esc(fit.text)}</p>
        <button class="btn ${primary ? 'btn--primary' : ''} btn--block" ${action} aria-label="${esc(ariaLabel ?? label)}">${esc(label)}</button>
      </div>
    </article>`;
}

export { esc };
