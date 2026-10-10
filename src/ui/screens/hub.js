// Hub principal: a semana, os atributos, a vida, o álbum da carreira e a liga.

import { esc, toast } from '../dom.js';
import { money, monthForWeek, plural, round } from '../../core/utils.js';
import { getClub, getLeague } from '../../data/clubs.js';
import { getNation } from '../../data/nations.js';
import { getPosition } from '../../data/positions.js';
import { WEEK_STEPS } from '../../core/game.js';
import { standings } from '../../engine/season.js';
import { previewTraining, trainingOptionsFor } from '../../engine/training.js';
import { upgradeCost, attributeCeiling, keyAttributesFor } from '../../engine/overall.js';
import { careerTotals } from '../../engine/player.js';
import { objectiveProgress } from '../../engine/objectives.js';
import { attributeLabel } from '../../data/attributes.js';
import { expenseBreakdown, netWorth, weeklySponsors } from '../../engine/finance.js';
import { marketValue, getRole } from '../../engine/transfers.js';
import { mainSquadRequirement } from '../../engine/national.js';
import {
  ITEM_CAPS,
  experienceStatus,
  holdingValue,
  holdingsOf,
  isPositionItem,
  itemEffects,
  ownsItem,
  saleValue,
  shopItemsFor,
  upfrontCost,
} from '../../engine/shop.js';
import { LIFESTYLE_CATEGORIES, LIFESTYLE_ITEMS } from '../../data/lifestyle.js';
import { getShopItem } from '../../data/shop.js';
import { rivalryBetween } from '../../data/rivals.js';
import { TRAINING_OPTIONS } from '../../engine/training.js';
import { recommendTraining } from '../../engine/coach.js';
import {
  attributeList,
  feed,
  icon,
  initials,
  leagueTable,
  lifeMeters,
  monogram,
  playerSticker,
  ratingBadge,
  statline,
  stepper,
  traitChips,
} from '../components.js';

const ui = { tab: 'semana', lastOverall: null, peek: null, lifeCat: 'lazer', affordOnly: false };

const TABS = [
  { id: 'semana', label: 'Semana', icon: 'calendar-blank' },
  { id: 'perfil', label: 'Atributos', icon: 'chart-line-up' },
  { id: 'vida', label: 'Vida', icon: 'heartbeat' },
  { id: 'carreira', label: 'Álbum', icon: 'book-open-text' },
  { id: 'liga', label: 'Liga', icon: 'list-numbers' },
];

const STEP_ORDER = [WEEK_STEPS.TRAINING, WEEK_STEPS.LIFE, WEEK_STEPS.MATCH, WEEK_STEPS.DONE];
const STEP_LABELS = ['Treino', 'Vida', 'Partida'];

const EVENT_ICONS = {
  treino: 'person-simple-run',
  festa: 'confetti',
  amor: 'heart',
  familia: 'house-line',
  midia: 'microphone-stage',
  negocios: 'briefcase',
  vestiario: 'users-three',
  risco: 'dice-five',
  saude: 'first-aid-kit',
  carreira: 'graduation-cap',
  torcida: 'megaphone',
  vida: 'coffee',
};

/* ------------------------------------------------------------ coluna lateral */

function profile(state, data) {
  const player = state.player;
  const club = getClub(player.club);
  const league = getLeague(club?.leagueId);
  const nation = getNation(player.nationality);
  const position = getPosition(player.position);
  const grew = ui.lastOverall !== null && player.overall > ui.lastOverall;
  ui.lastOverall = player.overall;

  return `
    <section class="profile" aria-label="Seu jogador">
      ${playerSticker(player, { isNew: grew, pulse: 'overall', meta: `${nation.id} · ${club?.name ?? 'Sem clube'}` })}
      <div>
        <h1 class="profile__name">${esc(player.firstName)} ${esc(player.lastName)}</h1>
        <div class="profile__facts">
          <span><strong>${esc(position.name)}</strong>, ${player.age} anos, ${esc(nation.name)}</span>
          <span><strong>${esc(club?.name ?? 'Sem clube')}</strong>${league ? `, ${esc(league.name)}` : ''}</span>
          ${data.position ? `<span>${data.position}º lugar na tabela</span>` : ''}
          <span><strong class="num">${esc(money(player.money))}</strong> em conta</span>
        </div>
      </div>
    </section>
    <div class="vitals" aria-label="Indicadores">
      ${lifeMeters(player, ['fitness', 'happiness', 'managerRelation', 'fanRelation'])}
    </div>`;
}

/* ---------------------------------------------------------------- semana */

function statusNotice(player) {
  if (player.injury?.weeks > 0) {
    return `<div class="notice notice--bad">${icon('first-aid-kit')}<div><strong>${esc(player.injury.name)}.</strong> Fora por ${plural(player.injury.weeks, 'semana', 'semanas')}. Só tratamento nos treinos.</div></div>`;
  }
  if (player.suspension > 0) {
    return `<div class="notice notice--bad">${icon('cards')}<div><strong>Suspenso</strong> por ${plural(player.suspension, 'jogo', 'jogos')}.</div></div>`;
  }
  if (player.life.fitness < 40) {
    return `<div class="notice notice--warn">${icon('warning')}<div><strong>Forma física baixa.</strong> Descansar esta semana reduz o risco de lesão.</div></div>`;
  }
  if (player.life.happiness < 30) {
    return `<div class="notice notice--warn">${icon('warning')}<div><strong>Você está infeliz.</strong> Isso freia a sua evolução nos treinos.</div></div>`;
  }
  return '';
}

function signed(value) {
  return `${value > 0 ? '+' : ''}${value}`;
}

/**
 * Os efeitos do treino na linha. A evolução vem da conta do preparador: um
 * treino com tudo no teto não aparece como "evolução alta".
 */
function trainingEffects(option, assessed) {
  const effects = [];
  if (option.xp > 0) {
    const growth = assessed?.growth ?? (option.xp >= 25 ? 1 : 0.5);
    if (growth >= 0.7) effects.push({ text: 'Evolução alta', tone: 'up' });
    else if (growth >= 0.35) effects.push({ text: 'Evolução média', tone: 'up' });
    else if (growth >= 0.08) effects.push({ text: 'Evolução baixa', tone: 'mid' });
    else effects.push({ text: 'Sem evolução', tone: 'down' });
  }
  if (option.fitness) effects.push({ text: `Forma ${signed(option.fitness)}`, tone: option.fitness > 0 ? 'up' : 'down' });
  if (option.happiness) effects.push({ text: `Felicidade ${signed(option.happiness)}`, tone: option.happiness > 0 ? 'up' : 'down' });
  if (option.managerRelation) effects.push({ text: `Técnico ${signed(option.managerRelation)}`, tone: 'up' });
  if (option.health) effects.push({ text: `Saúde ${signed(option.health)}`, tone: 'up' });
  const risk = assessed?.injuryRisk ?? option.injuryRisk;
  if (risk >= 0.04) effects.push({ text: `Risco de lesão ${Math.round(risk * 100)}%`, tone: 'down' });
  return `<span class="option__effects">${effects.map((effect) => `<span class="effect--${effect.tone}">${esc(effect.text)}</span>`).join('')}</span>`;
}

const RECOVERY = new Set(['descanso', 'livre', 'crioterapia']);

/** Quais atributos o treino trabalha, em palavras ("Força, Impulsão e mais 2"). */
function trainingTargets(player, option) {
  const ids = option.targets === 'key' ? keyAttributesFor(player.position, 6) : (option.targets ?? []);
  const gk = player.position === 'GOL';
  const labels = ids.filter((id) => (id.startsWith('gk') ? gk : true)).map(attributeLabel);
  if (!labels.length) return '';
  const shown = labels.slice(0, 3).join(', ');
  return labels.length > 3 ? `${shown} e mais ${labels.length - 3}` : shown;
}

const LIFE_LABELS = { fitness: 'Forma física', happiness: 'Felicidade', health: 'Saúde', managerRelation: 'Técnico', intelligence: 'Inteligência' };
const pct = (value) => `${Math.round(value * 100)}%`;

/** Detalhes exatos do treino (só com o tablet da loja). */
function trainingPeek(player, option, insight) {
  if (!insight) {
    return `<p class="peek__locked">${icon('lock-simple')}<span>Compre o <strong>Tablet de análise de treino</strong> na loja (aba Atributos) para ver exatamente o que cada treino vai te dar.</span></p>`;
  }
  const preview = previewTraining(player, option.id);
  if (!preview) return '';
  const attrs = preview.attributes.length
    ? `<table class="peek__table">
        <caption>+${preview.xp} XP em cada atributo</caption>
        <tbody>${preview.attributes
          .map((row) => {
            const result = row.atCeiling
              ? '<span class="peek__cap">no teto</span>'
              : row.after > row.value
                ? `<strong class="peek__up">sobe para ${Math.min(99, row.after + row.bonus)}</strong>`
                : `<span>${row.progress}/${row.need} XP</span>`;
            return `<tr><th scope="row">${esc(row.label)}</th><td class="num">${Math.min(99, row.value + row.bonus)}</td><td>${result}</td></tr>`;
          })
          .join('')}</tbody>
      </table>`
    : '<p class="peek__note">Não treina atributos.</p>';
  const life = preview.life
    .map((row) => `<li><span>${esc(LIFE_LABELS[row.stat] ?? row.stat)}</span><strong class="num ${row.after >= row.before ? 'is-positive' : 'is-negative'}">${row.before} → ${row.after}</strong></li>`)
    .join('');
  const points = preview.fixedPoints
    ? `<li><span>Pontos de evolução</span><strong class="num">+${preview.fixedPoints}</strong></li>`
    : '';
  return `
    ${attrs}
    <ul class="peek__list">
      ${life}
      ${points}
      <li><span>Ponto extra (sorte)</span><strong class="num">${pct(preview.bonusPointChance)}</strong></li>
      <li><span>Risco de lesão</span><strong class="num ${preview.injuryRisk >= 0.04 ? 'is-negative' : ''}">${preview.injuryRisk ? pct(preview.injuryRisk) : 'nenhum'}</strong></li>
    </ul>`;
}

/** Quantos atributos do treino já estão no teto (o XP neles é perdido). */
function capTag(assessed) {
  if (!assessed?.rows.length || !assessed.capped) return '';
  const all = assessed.capped === assessed.rows.length;
  return `<span class="train__cap">${all ? 'Tudo no teto' : `${assessed.capped} no teto`}</span>`;
}

function trainingRow(player, option, { blocked, suggested, insight, assessed }) {
  const targets = trainingTargets(player, option);
  const open = ui.peek === option.id;
  return `<li class="train-row ${open ? 'is-open' : ''}">
    <button class="train ${suggested ? 'is-suggested' : ''}" data-action="choose-training" data-training="${option.id}" ${blocked ? 'disabled' : ''}
      aria-describedby="peek-${option.id}">
      <span class="option__icon">${icon(option.icon)}</span>
      <span class="train__text">
        <span class="train__title">${esc(option.label)}${suggested ? '<span class="train__tag">Sugerido</span>' : ''}${capTag(assessed)}</span>
        <span class="train__desc">${targets ? `Treina ${esc(targets)}` : esc(option.description)}</span>
      </span>
      ${trainingEffects(option, assessed)}
    </button>
    <button class="train__eye" data-action="peek-training" data-training="${option.id}" aria-expanded="${open}" aria-controls="peek-${option.id}"
      aria-label="${insight ? `Ver o que ${esc(option.label)} vai te dar` : 'Detalhes bloqueados: compre o tablet na loja'}">${icon(insight ? 'eye' : 'lock-simple')}</button>
    <div class="peek" id="peek-${option.id}" role="tooltip">${trainingPeek(player, option, insight)}</div>
  </li>`;
}

/** O cartão do preparador: o treino recomendado, por quê, e um toque para treinar. */
function coachCard(advice, injured) {
  const { best, ranked, reasons } = advice;
  const second = ranked.find((entry) => entry.id !== best.id);
  const close = second && best.score - second.score < 0.08;
  return `
    <div class="coach" aria-labelledby="coach-titulo">
      <div class="coach__head">
        <span class="coach__icon">${icon('clipboard-text')}</span>
        <div class="coach__title">
          <p class="coach__kicker">O preparador recomenda</p>
          <h3 class="coach__pick" id="coach-titulo">${esc(best.option.label)}</h3>
        </div>
        <button class="btn btn--primary coach__go" data-action="choose-training" data-training="${best.id}">${injured ? 'Descansar' : 'Treinar'}</button>
      </div>
      <ul class="coach__why">${reasons.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${second && !injured ? `<p class="coach__alt">${close ? 'Quase empatado com' : 'Segunda opção:'} <strong>${esc(second.option.label)}</strong></p>` : ''}
    </div>`;
}

function trainingStep(state, data) {
  const player = state.player;
  const injured = player.injury?.weeks > 0;
  const options = trainingOptionsFor(player);
  const advice = recommendTraining(player, { hasMatch: Boolean(data?.week) && !(player.suspension > 0) });
  const assessedById = new Map(advice.ranked.map((entry) => [entry.id, entry]));
  const insight = itemEffects(player).insight;
  const row = (option) =>
    trainingRow(player, option, {
      blocked: injured && option.id !== 'descanso',
      suggested: option.id === advice.best.id,
      insight,
      assessed: assessedById.get(option.id),
    });
  const grow = options.filter((option) => !RECOVERY.has(option.id));
  const rest = options.filter((option) => RECOVERY.has(option.id));
  return `
    <section class="sheet section train-sheet" aria-labelledby="passo-titulo">
      <div class="section__head">
        <h2 id="passo-titulo">Treino da semana</h2>
      </div>
      ${coachCard(advice, injured)}
      <div class="train__groups">
        <div>
          <h3 class="train__group">Evoluir</h3>
          <ul class="trainlist">${grow.map(row).join('')}</ul>
        </div>
        <div>
          <h3 class="train__group">Recuperar</h3>
          <ul class="trainlist">${rest.map(row).join('')}</ul>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn--quiet" data-action="skip-training">Pular o treino</button>
      </div>
    </section>`;
}

function optionHint(option) {
  if (option.check) return `Teste de ${option.check.stat === 'charisma' ? 'carisma' : 'inteligência'}`;
  if (option.outcomes) return 'Resultado incerto';
  if (option.when?.minMoney) return 'Custa dinheiro';
  return '';
}

function lifeStep(state, ctx) {
  const event = ctx.game.currentEvent();
  if (!event) {
    return `
      <section class="sheet section">
        <h2>Semana tranquila</h2>
        <p class="lede">Nada fora da rotina aconteceu fora de campo.</p>
        <div class="actions"><button class="btn btn--primary" data-action="continue-life">Ir para a partida ${icon('arrow-right')}</button></div>
      </section>`;
  }
  return `
    <section class="sheet event" aria-labelledby="evento-titulo">
      <div class="event__head">
        <span class="event__badge">${icon(EVENT_ICONS[event.category] ?? 'coffee')}</span>
        <div>
          <h2 id="evento-titulo">${esc(event.title)}</h2>
          <p class="event__text">${esc(event.text)}</p>
        </div>
      </div>
      <ul class="optionlist">
        ${event.options
          .map((option) => {
            const hint = optionHint(option);
            return `<li>
              <button class="option option--compact" data-action="resolve-event" data-index="${option.index}">
                <span class="option__text">
                  <span class="option__title">${esc(option.label)}</span>
                  ${hint ? `<span class="option__desc">${esc(hint)}</span>` : ''}
                </span>
                ${icon('caret-right')}
              </button>
            </li>`;
          })
          .join('')}
      </ul>
    </section>`;
}

function matchStep(state, ctx) {
  const data = ctx.game.hubData();
  const fixture = data.fixturePreview;
  const player = state.player;

  if (!fixture) {
    return `
      <section class="sheet section">
        <h2>Sem jogo nesta semana</h2>
        <p class="lede">Data livre no calendário. O corpo agradece.</p>
        <div class="actions"><button class="btn btn--primary" data-action="skip-free-week">Avançar ${icon('arrow-right')}</button></div>
      </section>`;
  }

  const unavailable = player.injury?.weeks > 0 || player.suspension > 0;
  const club = getClub(player.club);
  const gap = player.overall - fixture.opponentRating;
  const read =
    gap > 6 ? 'Você é bem superior ao adversário' : gap > 0 ? 'Leve vantagem sua' : gap > -7 ? 'Jogo difícil' : 'Adversário muito mais forte';
  const home = fixture.isHome;

  return `
    <section class="sheet fixture ticket" aria-labelledby="jogo-titulo">
      <div class="fixture__meta ticket__head">
        <span>${esc(fixture.competition)}${fixture.stage ? `, ${esc(fixture.stage)}` : ''}</span>
        <span class="ticket__tags">
          ${fixture.derby ? `<span class="tag tag--derby">${icon('fire')}${esc(fixture.derby)}</span>` : ''}
          <span class="tag ${home ? 'tag--home' : 'tag--away'}">${home ? 'Em casa' : 'Fora de casa'}</span>
        </span>
      </div>
      <h2 id="jogo-titulo" class="visually-hidden">${esc(club?.name ?? '')} contra ${esc(fixture.opponent)}</h2>
      <div class="fixture__teams">
        <div class="fixture__team">${monogram(club?.name ?? '', { you: true })}<span>${esc(club?.name ?? '')}</span></div>
        <span class="fixture__vs">x</span>
        <div class="fixture__team fixture__team--away"><span>${esc(fixture.opponent)}</span>${monogram(fixture.opponent)}</div>
      </div>
      <div class="ticket__tear" aria-hidden="true"></div>
      <div class="fixture__meta">
        <span>Força do adversário <strong class="num">${fixture.opponentRating}</strong></span>
        <span>${esc(read)}</span>
      </div>
      ${unavailable ? `<div class="notice notice--bad">${icon('prohibit')}<div>Você não pode jogar esta partida. Dá para ver o resultado.</div></div>` : ''}
      <div class="actions">
        <button class="btn btn--primary" data-action="start-match">${unavailable ? 'Ver o resultado' : 'Entrar em campo'} ${icon('arrow-right')}</button>
        ${unavailable ? '' : '<button class="btn" data-action="simulate-match">Simular partida</button>'}
      </div>
    </section>`;
}

function reportStep(state) {
  const report = state.week.matchReport;
  let body = '';
  if (report?.didNotPlay) {
    body = `
      <h2>Você não jogou</h2>
      <p class="lede">${esc(report.reason)}</p>
      <p>Resultado: <strong class="num">${report.score.team} x ${report.score.opponent}</strong> contra o ${esc(report.opponentName)}.</p>`;
  } else if (report) {
    const label = report.result === 'V' ? 'Vitória' : report.result === 'E' ? 'Empate' : 'Derrota';
    const club = getClub(state.player.club);
    const yourName = report.clubName ?? club?.name ?? '';
    const scorers = (side) =>
      (report.goals ?? [])
        .filter((goal) => goal.side === side)
        .map((goal) => `<li class="${goal.mine ? 'is-you' : ''}">${goal.scorer ? `${esc(goal.scorer)} ` : ''}<span class="num">${goal.minute}'</span></li>`)
        .join('');
    body = `
      <div class="final-card is-new result--${report.result}" data-new-key="final-${esc(report.opponentName)}-${state.season.weekIndex}">
        <div class="final-card__head">
          <span>${esc(report.competition?.name ?? '')}</span>
          <span class="final-card__whistle">${icon('timer')}Fim de jogo</span>
        </div>
        <h2 class="visually-hidden">${label} por ${report.score.team} x ${report.score.opponent} contra o ${esc(report.opponentName)}</h2>
        <div class="final-card__teams" aria-hidden="true">
          <div class="final-card__team">${monogram(yourName, { you: true })}<span>${esc(yourName)}</span><ul class="placard__scorers">${scorers('team')}</ul></div>
          <div class="final-card__score num">${report.score.team}<span>x</span>${report.score.opponent}</div>
          <div class="final-card__team final-card__team--away">${monogram(report.opponentName)}<span>${esc(report.opponentName)}</span><ul class="placard__scorers">${scorers('opponent')}</ul></div>
        </div>
        <div class="final-card__foot">
          <strong class="final-card__result">${label}</strong>
          <span class="final-card__grade">Sua nota ${ratingBadge(report.rating)}</span>
        </div>
      </div>
      ${statline([
        { label: 'Minutos', value: report.minutesPlayed },
        { label: 'Gols', value: report.stats.goals },
        { label: 'Assistências', value: report.stats.assists },
        ...(report.stats.saves ? [{ label: 'Defesas', value: report.stats.saves }] : []),
        ...(report.stats.tackles ? [{ label: 'Desarmes', value: report.stats.tackles }] : []),
      ])}
      ${report.motm ? `<div class="notice notice--good">${icon('medal')}<div><strong>Melhor em campo.</strong></div></div>` : ''}
      ${report.bonus ? `<p class="muted">Bônus de partida: <strong class="num">${esc(money(report.bonus))}</strong></p>` : ''}`;
  } else {
    body = '<h2>Semana encerrada</h2>';
  }
  return `
    <section class="sheet section">
      ${body}
      <div class="actions"><button class="btn btn--primary" data-action="advance-week">Próxima semana ${icon('arrow-right')}</button></div>
    </section>`;
}

const OBJECTIVE_ICONS = { starts: 'user', apps: 'user', goals: 'soccer-ball', contributions: 'handshake', saves: 'hand-grabbing', rating: 'star', position: 'trophy' };

/** As metas que o clube combinou com você, com o quanto falta para cada uma. */
function objectivesSection(state) {
  const objectives = state.season?.objectives ?? [];
  if (!objectives.length) return '';
  return `
    <section class="section" aria-labelledby="metas-titulo">
      <div class="section__head">
        <h3 id="metas-titulo">Metas da temporada</h3>
        <p>Cada meta cumprida paga bônus e agrada o técnico</p>
      </div>
      <ul class="goals">
        ${objectives
          .map((objective) => {
            const progress = objectiveProgress(objective, state.player, state.season);
            const done = progress.done === true;
            return `<li class="goal ${done ? 'is-done' : ''}">
              <span class="goal__icon">${icon(done ? 'check' : OBJECTIVE_ICONS[objective.type] ?? 'target')}</span>
              <div class="goal__text">
                <span class="goal__label">${esc(objective.label)}</span>
                <span class="goal__meta">${esc(progress.text)} · bônus ${esc(money(objective.reward.money))}</span>
                <span class="goal__bar" aria-hidden="true"><span style="--p:${Math.min(1, progress.ratio || 0).toFixed(3)}"></span></span>
              </div>
            </li>`;
          })
          .join('')}
      </ul>
    </section>`;
}

function weekTab(state, ctx) {
  const data = ctx.game.hubData();
  const season = state.season;
  const step = state.week.step;
  const totalWeeks = season.calendar.length;
  const weekNumber = Math.min(season.weekIndex + 1, totalWeeks);
  const league = getLeague(season.leagueId);
  const stepIndex = STEP_ORDER.indexOf(step);

  let stepMarkup;
  if (step === WEEK_STEPS.TRAINING) stepMarkup = trainingStep(state, data);
  else if (step === WEEK_STEPS.LIFE) stepMarkup = lifeStep(state, ctx);
  else if (step === WEEK_STEPS.MATCH) stepMarkup = matchStep(state, ctx);
  else stepMarkup = reportStep(state);

  const trainingReport = state.week.trainingReport;
  const eventResult = state.week.eventResult;
  const upcoming = season.calendar
    .slice(season.weekIndex + (step === WEEK_STEPS.DONE ? 1 : 0))
    .filter((item) => !item.cancelled)
    .slice(0, 5);

  return `
    <div class="weekhead">
      <div class="weekhead__title">
        <h2>Semana <span class="num">${weekNumber}</span> de <span class="num">${totalWeeks}</span></h2>
        <p>${esc(monthForWeek(season.weekIndex, totalWeeks))} de ${season.year}, ${esc(league.name)}</p>
      </div>
      ${stepper(STEP_LABELS, Math.min(stepIndex, 3))}
    </div>

    ${statusNotice(state.player)}

    ${
      trainingReport
        ? `<div class="notice notice--good">${icon(trainingReport.option.icon)}<div>
            <strong>${esc(trainingReport.option.label)} concluído.</strong>
            ${trainingReport.gains.length ? `Subiu: ${esc(trainingReport.gains.join(', '))}.` : 'Sem evolução visível nesta semana.'}
            ${trainingReport.skillPoints ? `<small>+${plural(trainingReport.skillPoints, 'ponto', 'pontos')} de evolução para gastar em Atributos.</small>` : ''}
          </div></div>`
        : ''
    }
    ${
      eventResult
        ? `<div class="notice">${icon(eventResult.icon ?? 'coffee')}<div>
            ${esc(eventResult.text)}
            ${eventResult.notes?.length ? `<small>${esc(eventResult.notes.join(', '))}</small>` : ''}
          </div></div>`
        : ''
    }

    ${stepMarkup}

    <section class="section" aria-labelledby="temporada-titulo">
      <h3 id="temporada-titulo">Sua temporada</h3>
      ${statline([
        { label: 'Jogos', value: state.player.season.apps },
        { label: 'Gols', value: state.player.season.goals },
        { label: 'Assistências', value: state.player.season.assists },
        { label: 'Nota média', value: data.seasonRating ? round(data.seasonRating, 2).toFixed(2) : '-' },
        { label: 'Pontos', value: state.player.skillPoints },
      ])}
    </section>

    ${objectivesSection(state)}

    <div class="split">
      <section class="section" aria-labelledby="agenda-titulo">
        <h3 id="agenda-titulo">Próximos jogos</h3>
        <ul class="fixtures">
          ${upcoming
            .map(
              (item) => `
            <li class="fixtures__item">
              ${monogram(getClub(item.opponentId)?.name ?? '')}
              <span class="fixtures__opp">${item.isHome ? '' : '@ '}${esc(getClub(item.opponentId)?.name ?? '')}
                <span class="fixtures__comp">${esc(item.competitionName)}${
                  rivalryBetween(state.player.club, item.opponentId)
                    ? ` <span class="tag tag--derby">${icon('fire')}${esc(rivalryBetween(state.player.club, item.opponentId).name)}</span>`
                    : ''
                }</span></span>
              <span class="fixtures__stage">${esc(item.stage ?? '')}</span>
            </li>`,
            )
            .join('')}
        </ul>
        <div class="actions">
          <button class="btn btn--sm" data-action="sim-weeks" data-count="4">Simular 4 semanas</button>
          <button class="btn btn--sm btn--quiet" data-action="sim-season">Simular até o fim da temporada</button>
        </div>
      </section>

      <section class="section" aria-labelledby="noticias-titulo">
        <h3 id="noticias-titulo">Notícias</h3>
        ${feed(state.news, { limit: 6 })}
      </section>
    </div>`;
}

/* ------------------------------------------------------------------- loja */

const trainingName = (id) => TRAINING_OPTIONS.find((option) => option.id === id)?.label ?? id;

// Nome curto de cada medidor da vida, para as frases dos efeitos.
const LIFE_WORDS = {
  happiness: 'felicidade',
  fitness: 'forma',
  health: 'saúde',
  discipline: 'disciplina',
  intelligence: 'inteligência',
  charisma: 'carisma',
  fame: 'fama',
  reputation: 'reputação',
  morale: 'vestiário',
  managerRelation: 'técnico',
  fanRelation: 'torcida',
};

const percent = (value) => `${Math.round(value * 100)}%`;

/** "+1 felicidade a cada 4 semanas": valor quebrado por semana em palavras. */
function weeklyText(word, value) {
  if (Math.abs(value) >= 1) return `${signed(Math.round(value))} ${word} por semana`;
  const every = Math.max(2, Math.round(1 / Math.abs(value)));
  return `${value > 0 ? '+' : '−'}1 ${word} a cada ${every} semanas`;
}

/**
 * O efeito do item em partes, para a pessoa saber o que está comprando.
 * Cada parte vem com o tom: up (ajuda) ou down (custa ou atrapalha).
 */
function itemEffectParts(item) {
  const effects = item.effects ?? {};
  const parts = [];
  const up = (text) => parts.push({ text, tone: 'up' });
  const down = (text) => parts.push({ text, tone: 'down' });

  const lifeChanges = Object.entries(item.onBuy ?? {});
  const suffix = item.kind === 'experience' ? '' : ' na compra';
  for (const [id, value] of lifeChanges) (value > 0 ? up : down)(`${signed(value)} ${LIFE_WORDS[id] ?? id}${suffix}`);

  const attrs = Object.entries(effects.attributes ?? {});
  if (attrs.length) up(attrs.map(([id, value]) => `${attributeLabel(id)} +${value}`).join(', '));
  for (const [id, value] of Object.entries(effects.xp ?? {})) {
    if (id === 'academia_casa') continue;
    up(`${trainingName(id)} rende +${Math.round((value - 1) * 100)}%`);
  }
  for (const id of effects.unlocks ?? []) up(`Libera o treino ${trainingName(id)}`);
  for (const [id, value] of Object.entries(effects.skillPoints ?? {})) up(`+${plural(value, 'ponto', 'pontos')} no ${trainingName(id)}`);
  if (effects.injuryRisk && effects.injuryRisk < 1) up(`Risco de lesão no treino −${Math.round((1 - effects.injuryRisk) * 100)}%`);
  if (effects.injuryRisk && effects.injuryRisk > 1) down(`Risco de lesão no treino +${Math.round((effects.injuryRisk - 1) * 100)}%`);
  if (effects.weeklyFitness) up(weeklyText('forma', effects.weeklyFitness));
  if (effects.trainingFitness) up(`Treino cansa ${effects.trainingFitness} a menos`);
  if (effects.restBonus) up(`Descanso recupera +${effects.restBonus}`);
  if (effects.fasterHealing) up('Lesões curam mais rápido');
  if (effects.weeklyHappiness) up(weeklyText('felicidade', effects.weeklyHappiness));
  for (const [id, value] of Object.entries(effects.weekly ?? {})) (value > 0 ? up : down)(weeklyText(LIFE_WORDS[id] ?? id, value));
  if (effects.expenseCut) up(`Custo de vida −${percent(effects.expenseCut)}`);
  if (effects.sponsors) up('Traz patrocínios conforme a sua fama');
  if (effects.sponsorBonus) up(`Patrocínios pagam +${percent(effects.sponsorBonus)}`);
  if (effects.investBonus) up(`Investimentos rendem +${percent(effects.investBonus)} ao ano`);
  if (effects.agingSlow) up(`Queda física depois do auge −${percent(1 - effects.agingSlow)}`);
  if (effects.insight) up('Mostra o XP, a forma e o risco exatos de cada treino');

  const plan = item.invest;
  if (plan) {
    if (plan.yield[1] > 0) up(`Paga ${percent(plan.yield[0])} a ${percent(plan.yield[1])} ao ano${plan.fameScaled ? ', mais com fama' : ''}`);
    if (plan.growth[0] !== 1 || plan.growth[1] !== 1) {
      const low = Math.round((plan.growth[0] - 1) * 100);
      const high = Math.round((plan.growth[1] - 1) * 100);
      parts.push({ text: `Valor muda de ${low > 0 ? '+' : low < 0 ? '−' : ''}${Math.abs(low)}% a +${high}% ao ano`, tone: low < 0 ? 'mid' : 'up' });
    }
    if (plan.risk) down(`Ano ruim: ${percent(plan.risk)} de chance`);
    if (plan.bust) down(`Pode quebrar: ${percent(plan.bust)} ao ano`);
    if (plan.fee) down(`Taxa de resgate ${percent(plan.fee)}`);
  }
  if (item.risk) down(`${percent(item.risk.chance)} de chance de dar ruim`);
  if (item.upkeep) down(`Manutenção ${money(item.upkeep)} por semana`);
  if (item.cat && item.kind === 'equip') {
    if (item.resale) parts.push({ text: `Revende por ${percent(item.resale)}`, tone: 'mid' });
    else parts.push({ text: 'Não dá para revender', tone: 'mid' });
  }
  return parts;
}

const effectChips = (item) =>
  itemEffectParts(item)
    .map((part) => `<span class="effect--${part.tone}">${esc(part.text)}</span>`)
    .join('');

function shopRow(player, item) {
  const owned = ownsItem(player, item.id);
  const staff = item.kind === 'staff';
  const upfront = staff ? item.weekly * 4 : item.price;
  const afford = player.money >= upfront;
  const price = staff ? `${money(item.weekly)} por semana` : money(item.price);
  let action;
  if (owned && staff) action = `<button class="btn btn--sm btn--quiet" data-action="dismiss-staff" data-item="${item.id}" aria-label="Dispensar ${esc(item.label)}">Dispensar</button>`;
  else if (owned) action = `<span class="shop__owned">${icon('check')}Seu</span>`;
  else
    action = `<button class="btn btn--sm" data-action="buy-item" data-item="${item.id}" ${afford ? '' : 'disabled'}
      aria-label="${esc(`${staff ? 'Contratar' : 'Comprar'} ${item.label} por ${staff ? `${money(upfront)} adiantados` : price}`)}">${staff ? 'Contratar' : 'Comprar'}</button>`;
  return `<li class="shop__item ${owned ? 'is-owned' : ''}">
    <span class="option__icon">${icon(item.icon)}</span>
    <div class="shop__text">
      <span class="shop__title">${esc(item.label)}${item.group ? `<span class="shop__pos">${esc(item.group)}</span>` : ''}${owned && staff ? '<span class="train__tag">Na equipe</span>' : ''}</span>
      <span class="train__desc">${esc(item.description)}</span>
      <span class="option__effects">${effectChips(item)}</span>
    </div>
    <div class="shop__buy">
      <strong class="num">${esc(price)}</strong>
      ${staff && !owned ? `<small>Contratar: ${esc(money(upfront))}</small>` : ''}
      ${action}
    </div>
  </li>`;
}

function shopSection(player) {
  const items = shopItemsFor(player);
  const mine = items.filter(isPositionItem).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'equip' ? -1 : 1));
  const gear = items.filter((item) => item.kind === 'equip' && !isPositionItem(item));
  const staff = items.filter((item) => item.kind === 'staff' && !isPositionItem(item));
  const position = getPosition(player.position);
  return `
    <section class="sheet section" aria-labelledby="loja-titulo">
      <div class="section__head">
        <h2 id="loja-titulo">Investir na evolução</h2>
        <span class="points-pill"><strong class="num">${esc(money(player.money))}</strong> em conta</span>
      </div>
      <p class="lede">Equipamento é compra única e vale para sempre. A equipe pessoal cobra por semana (entra nos seus gastos) e pode ser dispensada.</p>
      <div class="train__groups shop__groups">
        <div>
          <h3 class="train__group">Da sua posição: ${esc(position.name)}</h3>
          <ul class="shoplist">${mine.map((item) => shopRow(player, item)).join('')}</ul>
        </div>
        <div>
          <h3 class="train__group">Equipamento para todos</h3>
          <ul class="shoplist">${gear.map((item) => shopRow(player, item)).join('')}</ul>
        </div>
        <div>
          <h3 class="train__group">Equipe pessoal para todos</h3>
          <ul class="shoplist">${staff.map((item) => shopRow(player, item)).join('')}</ul>
        </div>
      </div>
    </section>`;
}

/* -------------------------------------------------------------- atributos */

function profileTab(state) {
  const player = state.player;
  const ceiling = attributeCeiling(player);
  return `
    <section class="section">
      <div class="section__head">
        <h2>Atributos</h2>
        <span class="points-pill"><strong class="num">${player.skillPoints}</strong> pontos para gastar</span>
      </div>
      <p class="lede">
        Cada botão <strong>+1</strong> mostra quantos pontos custa. O custo cresce conforme o atributo sobe.
        Seu teto atual é <strong class="num">${ceiling}</strong>
        ${player.hiddenPotentialKnown ? `(potencial estimado <strong class="num">${player.potential}</strong>).` : '(o potencial aparece depois de 3 temporadas).'}
      </p>
    </section>
    ${attributeList(player, { spendable: true, skillPoints: player.skillPoints, costOf: upgradeCost, ceiling })}
    ${shopSection(player)}
    <section class="section">
      <h3>Traços</h3>
      ${traitChips(player.traits)}
    </section>`;
}

/* ------------------------------------------------------------------- vida */

const KIND_TAG = { equip: 'Compra única', staff: 'Por semana', invest: 'Investimento' };

function lifeKindTag(item) {
  if (item.kind === 'experience') {
    if (item.once) return 'Uma vez na carreira';
    if (item.cooldown >= 40) return item.cooldown >= 80 ? 'A cada duas temporadas' : 'Uma vez por temporada';
    return `Repete a cada ${item.cooldown} semanas`;
  }
  if (item.kind === 'invest' && item.cat === 'colecao') return 'Coleção';
  return KIND_TAG[item.kind];
}

/** O botão de cada item da loja da vida, conforme o tipo e a situação. */
function lifeAction(player, item) {
  const label = esc(item.label);
  const owned = item.kind !== 'experience' && ownsItem(player, item.id);
  const afford = player.money >= upfrontCost(item);
  const buy = (verb) =>
    `<button class="btn btn--sm" data-action="buy-item" data-item="${item.id}" ${afford ? '' : 'disabled'} aria-label="${esc(verb)} ${label}">${esc(verb)}</button>`;

  if (item.minAge && player.age < item.minAge && !owned) return `<button class="btn btn--sm" disabled>Aos ${item.minAge} anos</button>`;
  if (item.kind === 'experience') {
    const status = experienceStatus(player, item);
    if (status.done) return `<span class="shop__owned">${icon('check')}Feito</span>`;
    if (!status.ready) return `<button class="btn btn--sm" disabled aria-label="${label}: de novo em ${plural(status.weeksLeft, 'semana', 'semanas')}">${icon('hourglass')}${plural(status.weeksLeft, 'semana', 'semanas')}</button>`;
    return buy('Fazer');
  }
  if (item.kind === 'staff') {
    return owned
      ? `<button class="btn btn--sm btn--quiet" data-action="dismiss-staff" data-item="${item.id}" aria-label="Dispensar ${label}">Dispensar</button>`
      : buy('Contratar');
  }
  if (item.kind === 'invest') {
    return owned
      ? `<button class="btn btn--sm btn--quiet" data-action="sell-item" data-item="${item.id}" aria-label="Resgatar ${label} por ${esc(money(saleValue(player, item)))}">Resgatar ${esc(money(saleValue(player, item)))}</button>`
      : buy('Investir');
  }
  if (!owned) return buy('Comprar');
  return item.resale
    ? `<span class="shop__owned">${icon('check')}Seu</span><button class="btn btn--sm btn--quiet" data-action="sell-item" data-item="${item.id}" aria-label="Vender ${label} por ${esc(money(saleValue(player, item)))}">Vender ${esc(money(saleValue(player, item)))}</button>`
    : `<span class="shop__owned">${icon('check')}Seu</span>`;
}

function lifeRow(player, item) {
  const owned = item.kind !== 'experience' && ownsItem(player, item.id);
  const staff = item.kind === 'staff';
  let price = staff ? `${money(item.weekly)} por semana` : money(item.price);
  let note = staff && !owned ? `Contratar: ${money(upfrontCost(item))}` : '';
  if (item.kind === 'invest' && owned) {
    const count = holdingsOf(player, item.id).length;
    price = `Vale ${money(holdingValue(player, item.id))}`;
    note = `Investiu ${money(item.price * count)}`;
  }
  return `<li class="shop__item ${owned ? 'is-owned' : ''}">
    <span class="option__icon">${icon(item.icon)}</span>
    <div class="shop__text">
      <span class="shop__title">${esc(item.label)}<span class="store__kind">${esc(lifeKindTag(item))}</span>${owned && staff ? '<span class="train__tag">Contratado</span>' : ''}</span>
      <span class="train__desc">${esc(item.description)}</span>
      <span class="option__effects">${effectChips(item)}</span>
    </div>
    <div class="shop__buy">
      <strong class="num">${esc(price)}</strong>
      ${note ? `<small>${esc(note)}</small>` : ''}
      ${lifeAction(player, item)}
    </div>
  </li>`;
}

const lifeOwned = (player, item) => item.kind !== 'experience' && ownsItem(player, item.id);

/** A loja da vida: lazer, luxo, desempenho, casa, imagem, estudo, viagens e investimentos. */
function lifeStore(player) {
  const mine = LIFESTYLE_ITEMS.filter((item) => lifeOwned(player, item));
  const cat = ui.lifeCat === 'meus' || LIFESTYLE_CATEGORIES.some((entry) => entry.id === ui.lifeCat) ? ui.lifeCat : 'lazer';
  let items = cat === 'meus' ? mine : LIFESTYLE_ITEMS.filter((item) => item.cat === cat);
  if (ui.affordOnly && cat !== 'meus') items = items.filter((item) => lifeOwned(player, item) || player.money >= upfrontCost(item));
  items = [...items].sort((a, b) => upfrontCost(a) - upfrontCost(b));

  const chip = (id, label, iconName, count) =>
    `<button class="store__cat" data-action="life-cat" data-cat="${id}" aria-pressed="${cat === id}">${icon(iconName)}<span>${esc(label)}</span>${count ? `<small class="num">${count}</small>` : ''}</button>`;
  const ownedIn = (id) => mine.filter((item) => item.cat === id).length;
  const empty =
    cat === 'meus'
      ? 'Você ainda não comprou nada por aqui. Experiências não ficam guardadas: elas mudam a sua vida na hora.'
      : 'Nada aqui cabe no seu bolso por enquanto. Desligue o filtro para ver tudo.';

  return `
    <section class="sheet section store" aria-labelledby="loja-vida-titulo">
      <div class="section__head">
        <h2 id="loja-vida-titulo">Gastar o dinheiro</h2>
        <span class="points-pill"><strong class="num">${esc(money(player.money))}</strong> em conta</span>
      </div>
      <p class="lede">Compra única vale enquanto você tiver e pode ser revendida. Serviços cobram por semana. Experiências mudam a sua vida na hora e voltam depois de um tempo. Investimentos rendem (ou perdem) no fim da temporada.</p>
      <div class="store__cats" role="group" aria-label="Categorias" data-keep-scroll="loja-vida">
        ${LIFESTYLE_CATEGORIES.map((entry) => chip(entry.id, entry.label, entry.icon, ownedIn(entry.id))).join('')}
        ${chip('meus', 'Seus itens', 'check', mine.length)}
      </div>
      <div class="store__bar">
        <button class="store__toggle" data-action="life-afford" aria-pressed="${ui.affordOnly}">${icon('wallet')}Só o que dá para comprar</button>
        <span>${plural(items.length, 'item', 'itens')}, do mais barato ao mais caro</span>
      </div>
      ${items.length ? `<ul class="shoplist">${items.map((item) => lifeRow(player, item)).join('')}</ul>` : `<p class="muted store__empty">${esc(empty)}</p>`}
      <p class="store__note">${icon('info')}Os bônus de todos os itens somados têm limite: no máximo +${ITEM_CAPS.attribute} por atributo, +${ITEM_CAPS.weekly.happiness} de felicidade por semana e treinos rendendo até +${Math.round((ITEM_CAPS.xp - 1) * 100)}%.</p>
    </section>`;
}

function lifeTab(state) {
  const player = state.player;
  const salary = player.contract?.weeklySalary ?? 0;
  const role = player.contract ? getRole(player.contract.role) : null;
  const expenses = expenseBreakdown(player);
  const sponsors = weeklySponsors(player);
  const net = salary + sponsors - expenses.total;
  const invested = (player.assets ?? []).reduce((sum, asset) => sum + asset.value, 0);

  return `
    <section class="section">
      <h2>Vida</h2>
      <div class="vitals vitals--grid">${lifeMeters(player)}</div>
    </section>

    <section class="section">
      <h3>Dinheiro</h3>
      ${statline([
        { label: 'Em conta', value: money(player.money) },
        { label: 'Patrimônio', value: money(netWorth(player)) },
        { label: 'Valor de mercado', value: money(marketValue(player)) },
      ])}
      <ul class="ledger">
        <li><span>Salário semanal</span><strong class="is-positive">${esc(money(salary))}</strong></li>
        <li><span>Patrocínio semanal</span><strong class="is-positive">${esc(money(sponsors))}</strong></li>
        <li><span>Custo de vida</span><strong class="is-negative">${esc(money(expenses.living))}</strong></li>
        ${expenses.staff ? `<li><span>Equipe e serviços</span><strong class="is-negative">${esc(money(expenses.staff))}</strong></li>` : ''}
        ${expenses.upkeep ? `<li><span>Manutenção dos bens</span><strong class="is-negative">${esc(money(expenses.upkeep))}</strong></li>` : ''}
        <li class="ledger__total"><span>Saldo da semana</span><strong class="${net >= 0 ? 'is-positive' : 'is-negative'}">${esc(money(net))}</strong></li>
        ${invested ? `<li><span>Investido (rende no fim da temporada)</span><strong>${esc(money(invested))}</strong></li>` : ''}
      </ul>
    </section>

    ${lifeStore(player)}

    <div class="split">
      <section class="section">
        <h3>Contrato</h3>
        ${
          player.contract
            ? `<ul class="ledger">
                <li><span>Clube</span><strong>${esc(getClub(player.club)?.name ?? '')}</strong></li>
                <li><span>Função</span><strong>${esc(role?.label ?? '')}</strong></li>
                <li><span>Temporadas restantes</span><strong class="num">${player.contract.years}</strong></li>
                ${player.contract.releaseClause ? `<li><span>Multa rescisória</span><strong>${esc(money(player.contract.releaseClause))}</strong></li>` : ''}
                ${player.contract.loan ? '<li><span>Situação</span><strong>Emprestado</strong></li>' : ''}
              </ul>`
            : '<p class="muted">Sem contrato.</p>'
        }
      </section>
      <section class="section">
        <h3>Seleção</h3>
        <ul class="ledger">
          <li><span>Situação</span><strong>${player.national.status === 'principal' ? 'Seleção principal' : player.national.status === 'sub20' ? 'Seleção sub-20' : 'Sem convocação'}</strong></li>
          <li><span>Jogos e gols</span><strong class="num">${player.national.caps} / ${player.national.goals}</strong></li>
          <li><span>Overall de referência</span><strong class="num">${mainSquadRequirement(player.nationality)}</strong></li>
        </ul>
      </section>
    </div>`;
}

/* ------------------------------------------------------------------ álbum */

/** Marcos da carreira: viram figurinha brilhante quando conquistados. */
function milestones(player) {
  const trophies = player.career.trophies;
  const awards = player.career.awards;
  const totals = careerTotals(player);
  const firstOf = (list, test) => list.find(test)?.year ?? null;
  return [
    { label: 'Primeiro título', icon: 'trophy', year: trophies[0]?.year ?? null },
    { label: 'Campeão da liga', icon: 'trophy', year: firstOf(trophies, (t) => t.type === 'liga') },
    { label: 'Copa nacional', icon: 'trophy', year: firstOf(trophies, (t) => t.type === 'copa') },
    { label: 'Título continental', icon: 'trophy', year: firstOf(trophies, (t) => t.type === 'continental') },
    { label: 'Título com a seleção', icon: 'flag', year: firstOf(trophies, (t) => t.type === 'selecao') },
    { label: 'Artilheiro da liga', icon: 'soccer-ball', year: firstOf(awards, (a) => a.name.startsWith('Artilheiro')) },
    { label: 'Seleção do campeonato', icon: 'star', year: firstOf(awards, (a) => a.name.startsWith('Seleção da')) },
    { label: 'Golden Boy', icon: 'medal', year: firstOf(awards, (a) => a.name === 'Golden Boy') },
    { label: 'Bola de Ouro', icon: 'trophy', year: firstOf(awards, (a) => a.name === 'BOLA DE OURO') },
    { label: '100 gols na carreira', icon: 'soccer-ball', done: totals.goals >= 100 },
    { label: '300 jogos na carreira', icon: 'calendar-blank', done: totals.apps >= 300 },
    { label: '50 jogos pela seleção', icon: 'flag', done: totals.nationalCaps >= 50 },
  ];
}

function seasonSticker(season, index) {
  return `
    <article class="card-sticker season-sticker">
      <div class="card-sticker__face">
        <span class="card-sticker__monogram">${esc(initials(season.clubName))}</span>
        <span class="card-sticker__big"><strong>${season.overallAfter}</strong><small>Overall</small></span>
      </div>
      <div class="card-sticker__band">${esc(season.clubName)}</div>
      <div class="card-sticker__sub">${season.year}, ${season.age} anos</div>
      <div class="season-sticker__line"><span class="num">${season.apps} J</span><span class="num">${season.goals} G</span><span class="num">${season.assists} A</span><span class="num">${season.rating || '-'}</span></div>
    </article>`;
}

function careerTab(state) {
  const player = state.player;
  const totals = careerTotals(player);
  const avg = totals.ratingCount ? totals.ratingSum / totals.ratingCount : 0;
  const seasons = player.career.seasons;
  const nextNumber = seasons.length + 1;
  const marks = milestones(player);
  const got = marks.filter((mark) => mark.year || mark.done).length;

  return `
    <section class="section">
      <h2>Álbum da carreira</h2>
      ${statline([
        { label: 'Jogos', value: totals.apps },
        { label: 'Gols', value: totals.goals },
        { label: 'Assistências', value: totals.assists },
        { label: 'Melhor em campo', value: totals.motm },
        { label: 'Nota média', value: avg ? round(avg, 2).toFixed(2) : '-' },
        { label: 'Seleção', value: `${totals.nationalCaps}/${totals.nationalGoals}` },
        ...(player.career.derbies
          ? [{ label: 'Clássicos (V-E-D)', value: `${player.career.derbies.won}-${player.career.derbies.drawn}-${player.career.derbies.lost}` }]
          : []),
      ])}
    </section>

    <section class="section">
      <div class="section__head">
        <h3>Temporadas</h3>
        <p>Uma figurinha por temporada completa. Os números acima já contam a atual.</p>
      </div>
      <div class="album">
        ${seasons.map(seasonSticker).join('')}
        <div class="slot">
          <span class="slot__number num">${nextNumber}</span>
          <span class="slot__label">Temporada ${state.season?.year ?? ''} em andamento</span>
        </div>
        ${[1, 2]
          .map(
            (offset) => `
          <div class="slot" aria-label="Espaço vazio ${nextNumber + offset}">
            <span class="slot__number num">${nextNumber + offset}</span>
            <span class="slot__label">Falta</span>
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="section">
      <div class="section__head">
        <h3>Conquistas</h3>
        <p><span class="num">${got}</span> de <span class="num">${marks.length}</span> coladas</p>
      </div>
      <div class="album album--trophies">
        ${marks
          .map((mark, index) =>
            mark.year || mark.done
              ? `<article class="card-sticker sticker--foil trophy-sticker">
                  ${icon(mark.icon)}
                  <span class="trophy-sticker__name">${esc(mark.label)}</span>
                  <span class="trophy-sticker__year num">${mark.year ?? 'Conquistado'}</span>
                </article>`
              : `<div class="slot">
                  ${icon(mark.icon)}
                  <span class="slot__number num">${index + 1}</span>
                  <span class="slot__label">${esc(mark.label)}</span>
                </div>`,
          )
          .join('')}
      </div>
    </section>

    <div class="split">
      <section class="section">
        <h3>Títulos <span class="num muted">(${player.career.trophies.length})</span></h3>
        ${
          player.career.trophies.length
            ? `<ul class="ledger">${player.career.trophies
                .map((trophy) => `<li><span>${esc(trophy.name)}</span><strong class="num">${trophy.year}</strong></li>`)
                .join('')}</ul>`
            : '<p class="muted">Nenhum título ainda.</p>'
        }
      </section>
      <section class="section">
        <h3>Prêmios individuais <span class="num muted">(${player.career.awards.length})</span></h3>
        ${
          player.career.awards.length
            ? `<ul class="ledger">${player.career.awards
                .map((award) => `<li><span>${esc(award.name)}</span><strong class="num">${award.year}</strong></li>`)
                .join('')}</ul>`
            : '<p class="muted">Nenhum prêmio ainda.</p>'
        }
      </section>
    </div>

    <section class="section">
      <h3>Encerrar a carreira</h3>
      <p class="lede">Você pode pendurar as chuteiras quando quiser e ver o álbum completo com o seu legado.</p>
      <div class="actions"><button class="btn btn--danger" data-action="retire">Me aposentar</button></div>
    </section>`;
}

/* ------------------------------------------------------------------- liga */

function leagueTab(state) {
  const season = state.season;
  const league = getLeague(season.leagueId);
  const rows = standings(season.table);

  return `
    <section class="section">
      <div class="section__head">
        <h2>${esc(league.name)}</h2>
      </div>
      ${leagueTable(rows, season.clubId, { continentalSpots: league.continentalSpots ?? 0 })}
      ${league.continentalSpots ? `<p class="table__legend"><span class="table__pos" aria-hidden="true"></span>Zona de classificação: os ${league.continentalSpots} primeiros vão ao torneio continental.</p>` : ''}
    </section>

    <section class="section">
      <h3>Seus resultados</h3>
      ${
        season.results.length
          ? `<ul class="fixtures">${season.results
              .slice()
              .reverse()
              .slice(0, 12)
              .map((result) => {
                const cls = result.score.team > result.score.opponent ? 'win' : result.score.team === result.score.opponent ? 'draw' : 'loss';
                return `<li class="fixtures__item">
                  <span class="score score--${cls}">${result.score.team}-${result.score.opponent}</span>
                  <span class="fixtures__opp">${esc(getClub(result.opponentId)?.name ?? '')}</span>
                  <span class="fixtures__stage">${result.didNotPlay ? 'Não jogou' : `${ratingBadge(result.rating)}${result.goals ? ` <span class="num">${result.goals} G</span>` : ''}`}</span>
                </li>`;
              })
              .join('')}</ul>`
          : '<p class="muted">Nenhuma partida ainda. O primeiro jogo está na aba Semana.</p>'
      }
    </section>`;
}

/* ------------------------------------------------------------------ tela */

export default {
  id: 'hub',

  render(state, ctx) {
    if (!state.player || !state.season) return '<div class="screen"><p>Carregando carreira...</p></div>';
    const data = ctx.game.hubData();

    const body =
      ui.tab === 'perfil'
        ? profileTab(state)
        : ui.tab === 'vida'
          ? lifeTab(state)
          : ui.tab === 'carreira'
            ? careerTab(state)
            : ui.tab === 'liga'
              ? leagueTab(state)
              : weekTab(state, ctx);

    return `
      <div class="hub">
        <aside class="hub__aside stack stack--lg">${profile(state, data)}</aside>
        <div class="hub__main">
          <nav class="tabs" role="tablist" aria-label="Seções do jogo">
            ${TABS.map(
              (tab) => `
              <button class="tab" role="tab" aria-selected="${ui.tab === tab.id}" data-action="hub-tab" data-tab="${tab.id}">
                ${icon(tab.icon)}${esc(tab.label)}
              </button>`,
            ).join('')}
          </nav>
          <div class="stack stack--lg" role="tabpanel">${body}</div>
        </div>
      </div>`;
  },

  actions: {
    'hub-tab': (ctx, dataset) => {
      ui.tab = dataset.tab;
      ctx.motion?.requestTransition('tab');
      ctx.rerender();
    },
    'peek-training': (ctx, dataset) => {
      ui.peek = ui.peek === dataset.training ? null : dataset.training;
      ctx.rerender();
    },
    'choose-training': (ctx, dataset) => {
      ui.peek = null;
      ctx.game.chooseTraining(dataset.training);
      ctx.save.schedule();
    },
    'skip-training': (ctx) => {
      ctx.game.skipTraining();
    },
    'continue-life': (ctx) => {
      ctx.game.state.week.step = WEEK_STEPS.MATCH;
      ctx.game.notify();
    },
    'resolve-event': (ctx, dataset) => {
      ctx.game.resolveEvent(Number(dataset.index));
      ctx.save.schedule();
    },
    'start-match': (ctx) => {
      ctx.game.startMatch();
    },
    'simulate-match': (ctx) => {
      ctx.game.simulateMatch();
      ctx.save.schedule();
    },
    'skip-free-week': (ctx) => {
      ctx.game.skipFreeWeek();
    },
    'advance-week': (ctx) => {
      ctx.motion?.requestTransition('week');
      ctx.game.advanceWeek();
      ctx.save.schedule();
    },
    'sim-weeks': (ctx, dataset) => {
      ctx.game.simulateWeeks(Number(dataset.count) || 4);
      ctx.save.schedule();
    },
    'sim-season': (ctx) => {
      ctx.game.simulateRestOfSeason();
      ctx.save.schedule();
    },
    'buy-item': async (ctx, dataset) => {
      const item = getShopItem(dataset.item);
      const player = ctx.game.player;
      // Compra grande pede confirmação: no iPad é fácil tocar sem querer.
      if (item && upfrontCost(item) >= 100_000 && upfrontCost(item) >= player.money * 0.3) {
        const ok = await ctx.confirm({
          title: `${item.label}?`,
          text: `Sai ${money(upfrontCost(item))} da sua conta (você tem ${money(player.money)}).${item.upkeep ? ` A manutenção é ${money(item.upkeep)} por semana.` : ''}`,
          confirmLabel: item.kind === 'invest' ? 'Investir' : 'Comprar',
        });
        if (!ok) return;
      }
      const result = ctx.game.buyItem(dataset.item);
      if (!result.ok) {
        toast(result.reason, 'warn');
        return;
      }
      const done = { staff: 'contratado', experience: 'feito', invest: 'investimento feito' }[result.item.kind] ?? 'comprado';
      if (result.mishap) toast(result.mishap, 'warn');
      else toast(`${result.item.label}: ${done}.`, 'good');
      ctx.save.schedule(300);
    },
    'sell-item': async (ctx, dataset) => {
      const item = getShopItem(dataset.item);
      if (!item) return;
      const invest = item.kind === 'invest';
      const ok = await ctx.confirm({
        title: invest ? 'Resgatar?' : 'Vender?',
        text: `Você recebe ${money(saleValue(ctx.game.player, item))}.${invest ? ' O investimento para de render.' : ' O efeito acaba agora e o bônus da compra não volta se comprar de novo.'}`,
        confirmLabel: invest ? 'Resgatar' : 'Vender',
        danger: true,
      });
      if (!ok) return;
      const result = ctx.game.sellItem(dataset.item);
      if (!result.ok) toast(result.reason, 'warn');
      else ctx.save.schedule(300);
    },
    'life-cat': (ctx, dataset) => {
      ui.lifeCat = dataset.cat;
      ctx.rerender();
    },
    'life-afford': (ctx) => {
      ui.affordOnly = !ui.affordOnly;
      ctx.rerender();
    },
    'dismiss-staff': async (ctx, dataset) => {
      const ok = await ctx.confirm({
        title: 'Dispensar?',
        text: 'O efeito acaba agora. Para contratar de novo, você paga as quatro semanas adiantadas outra vez.',
        confirmLabel: 'Dispensar',
        danger: true,
      });
      if (!ok) return;
      ctx.game.dismissStaff(dataset.item);
      ctx.save.schedule(300);
    },
    'spend-point': (ctx, dataset) => {
      const result = ctx.game.spendPoint(dataset.attr);
      if (!result.ok) toast(result.reason, 'warn');
      else ctx.save.schedule();
    },
    retire: async (ctx) => {
      const ok = await ctx.confirm({
        title: 'Encerrar a carreira?',
        text: 'Você vai pendurar as chuteiras agora e ver o resumo do seu legado. Não tem volta.',
        confirmLabel: 'Pendurar as chuteiras',
        danger: true,
      });
      if (ok) {
        ctx.game.retire(false);
        ctx.save.schedule(200);
      }
    },
  },
};
