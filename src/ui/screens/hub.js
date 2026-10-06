// Hub principal: a semana, os atributos, a vida, o álbum da carreira e a liga.

import { esc, toast } from '../dom.js';
import { money, monthForWeek, plural, round } from '../../core/utils.js';
import { getClub, getLeague } from '../../data/clubs.js';
import { getNation } from '../../data/nations.js';
import { getPosition } from '../../data/positions.js';
import { WEEK_STEPS } from '../../core/game.js';
import { standings } from '../../engine/season.js';
import { trainingOptionsFor } from '../../engine/training.js';
import { upgradeCost, attributeCeiling } from '../../engine/overall.js';
import { INVESTMENTS, invest, netWorth, weeklyExpenses, weeklySponsors } from '../../engine/finance.js';
import { marketValue, getRole } from '../../engine/transfers.js';
import { mainSquadRequirement } from '../../engine/national.js';
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

const ui = { tab: 'semana', lastOverall: null };

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

function trainingEffects(option) {
  const effects = [];
  if (option.xp >= 25) effects.push({ text: 'Evolução alta', up: true });
  else if (option.xp >= 20) effects.push({ text: 'Evolução média', up: true });
  if (option.fitness) effects.push({ text: `Forma ${signed(option.fitness)}`, up: option.fitness > 0 });
  if (option.happiness) effects.push({ text: `Felicidade ${signed(option.happiness)}`, up: option.happiness > 0 });
  if (option.managerRelation) effects.push({ text: `Técnico ${signed(option.managerRelation)}`, up: true });
  if (option.health) effects.push({ text: `Saúde ${signed(option.health)}`, up: true });
  if (option.injuryRisk >= 0.04) effects.push({ text: 'Risco de lesão', up: false });
  return `<span class="option__effects">${effects
    .map((effect) => `<span class="${effect.up ? 'effect--up' : 'effect--down'}">${esc(effect.text)}</span>`)
    .join('')}</span>`;
}

function trainingStep(state) {
  const player = state.player;
  const injured = player.injury?.weeks > 0;
  return `
    <section class="sheet section" aria-labelledby="passo-titulo">
      <div class="section__head">
        <h2 id="passo-titulo">Treino da semana</h2>
      </div>
      <ul class="optionlist optionlist--two">
        ${trainingOptionsFor(player)
          .map((option) => {
            const blocked = injured && option.id !== 'descanso';
            return `<li>
              <button class="option" data-action="choose-training" data-training="${option.id}" ${blocked ? 'disabled' : ''}>
                <span class="option__icon">${icon(option.icon)}</span>
                <span class="option__text">
                  <span class="option__title">${esc(option.label)}</span>
                  <span class="option__desc">${esc(option.description)}</span>
                  ${trainingEffects(option)}
                </span>
              </button>
            </li>`;
          })
          .join('')}
      </ul>
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
        <span class="tag ${home ? 'tag--home' : 'tag--away'}">${home ? 'Em casa' : 'Fora de casa'}</span>
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

function weekTab(state, ctx) {
  const data = ctx.game.hubData();
  const season = state.season;
  const step = state.week.step;
  const totalWeeks = season.calendar.length;
  const weekNumber = Math.min(season.weekIndex + 1, totalWeeks);
  const league = getLeague(season.leagueId);
  const stepIndex = STEP_ORDER.indexOf(step);

  let stepMarkup;
  if (step === WEEK_STEPS.TRAINING) stepMarkup = trainingStep(state);
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
                <span class="fixtures__comp">${esc(item.competitionName)}</span></span>
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
    <section class="section">
      <h3>Traços</h3>
      ${traitChips(player.traits)}
    </section>`;
}

/* ------------------------------------------------------------------- vida */

function lifeTab(state) {
  const player = state.player;
  const salary = player.contract?.weeklySalary ?? 0;
  const role = player.contract ? getRole(player.contract.role) : null;

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
        <li><span>Patrocínio semanal</span><strong class="is-positive">${esc(money(weeklySponsors(player)))}</strong></li>
        <li><span>Gastos semanais</span><strong class="is-negative">${esc(money(weeklyExpenses(player)))}</strong></li>
      </ul>
    </section>

    <section class="section">
      <h3>Investimentos</h3>
      <ul class="optionlist optionlist--two">
        ${INVESTMENTS.map((item) => {
          const short = player.money < item.cost;
          return `<li>
            <button class="option" data-action="invest" data-invest="${item.id}" ${short ? 'disabled' : ''}>
              <span class="option__icon">${icon(item.icon)}</span>
              <span class="option__text">
                <span class="option__title">${esc(item.label)}</span>
                <span class="option__desc">${esc(item.description)}</span>
                <span class="option__effects"><span>Custa ${esc(money(item.cost))}</span><span class="effect--down">Risco ${Math.round(item.risk * 100)}%</span></span>
              </span>
            </button>
          </li>`;
        }).join('')}
      </ul>
      ${
        player.assets?.length
          ? `<ul class="ledger">${player.assets
              .map((asset) => `<li><span>${esc(asset.label)}</span><strong>${esc(money(asset.value))}</strong></li>`)
              .join('')}</ul>`
          : '<p class="muted">Você ainda não tem investimentos. Eles rendem (ou perdem) no fim de cada temporada.</p>'
      }
    </section>

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
  const totals = player.career.totals;
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
  const totals = player.career.totals;
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
      ])}
    </section>

    <section class="section">
      <div class="section__head">
        <h3>Temporadas</h3>
        <p>Uma figurinha por temporada completa</p>
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
    'choose-training': (ctx, dataset) => {
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
    'spend-point': (ctx, dataset) => {
      const result = ctx.game.spendPoint(dataset.attr);
      if (!result.ok) toast(result.reason, 'warn');
      else ctx.save.schedule();
    },
    invest: (ctx, dataset) => {
      const result = invest(ctx.game.player, dataset.invest);
      if (!result.ok) toast(result.reason, 'warn');
      else {
        toast(`Investimento feito: ${result.investment.label}.`, 'good');
        ctx.game.notify();
        ctx.save.schedule();
      }
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
