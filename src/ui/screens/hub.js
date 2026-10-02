// Hub principal: semana a semana, perfil, vida, carreira e liga.

import { esc, toast } from '../dom.js';
import { money, monthForWeek, round } from '../../core/utils.js';
import { getClub, getLeague } from '../../data/clubs.js';
import { getNation } from '../../data/nations.js';
import { WEEK_STEPS } from '../../core/game.js';
import { standings } from '../../engine/season.js';
import { trainingOptionsFor } from '../../engine/training.js';
import { upgradeCost, attributeCeiling } from '../../engine/overall.js';
import { INVESTMENTS, invest, netWorth, weeklyExpenses, weeklySponsors } from '../../engine/finance.js';
import { marketValue } from '../../engine/transfers.js';
import { mainSquadRequirement } from '../../engine/national.js';
import {
  attributeGrid,
  leagueTable,
  lifePanel,
  newsFeed,
  playerCard,
  ratingPill,
  statRow,
  traitChips,
} from '../components.js';

const ui = { tab: 'semana' };

const TABS = [
  { id: 'semana', label: 'Semana', icon: '📅' },
  { id: 'perfil', label: 'Atributos', icon: '📈' },
  { id: 'vida', label: 'Vida', icon: '🧬' },
  { id: 'carreira', label: 'Carreira', icon: '🏆' },
  { id: 'liga', label: 'Liga', icon: '📊' },
];

function statusBanner(player) {
  if (player.injury?.weeks > 0) {
    return `<div class="banner banner--bad">🚑 ${esc(player.injury.name)} — fora por ${player.injury.weeks} semana(s).</div>`;
  }
  if (player.suspension > 0) {
    return `<div class="banner banner--bad">🟥 Suspenso por ${player.suspension} jogo(s).</div>`;
  }
  if (player.life.fitness < 40) {
    return '<div class="banner banner--warn">😓 Forma física baixa. Considere descansar.</div>';
  }
  if (player.life.happiness < 30) {
    return '<div class="banner banner--warn">💭 Você está infeliz. Isso atrapalha a evolução.</div>';
  }
  return '';
}

function trainingStep(state, ctx) {
  const player = state.player;
  const options = trainingOptionsFor(player);
  const injured = player.injury?.weeks > 0;

  return `
    <section class="card">
      <h3>Treino da semana</h3>
      ${injured ? '<p class="muted">Lesionado: só tratamento e recuperação nesta semana.</p>' : '<p class="muted">Escolha o foco. Cada opção mexe na sua evolução, na forma e na cabeça.</p>'}
      <div class="training-grid">
        ${options
          .map(
            (option) => `
          <button class="training ${injured && option.id !== 'descanso' ? 'is-disabled' : ''}"
                  data-action="choose-training" data-training="${option.id}"
                  ${injured && option.id !== 'descanso' ? 'disabled' : ''}>
            <span class="training__icon">${esc(option.icon)}</span>
            <strong>${esc(option.label)}</strong>
            <small>${esc(option.description)}</small>
          </button>`,
          )
          .join('')}
      </div>
      <button class="btn btn--ghost" data-action="skip-training">Pular o treino</button>
    </section>`;
}

function lifeStep(state, ctx) {
  const event = ctx.game.currentEvent();
  if (!event) {
    return `
      <section class="card">
        <h3>Semana tranquila</h3>
        <p class="muted">Nada fora do normal aconteceu.</p>
        <button class="btn btn--primary" data-action="continue-life">Seguir</button>
      </section>`;
  }
  return `
    <section class="card card--event">
      <span class="event__icon">${esc(event.icon ?? '❓')}</span>
      <h3>${esc(event.title)}</h3>
      <p class="event__text">${esc(event.text)}</p>
      <div class="choices">
        ${event.options
          .map(
            (option) => `
          <button class="choice" data-action="resolve-event" data-index="${option.index}">
            <strong>${esc(option.label)}</strong>
            ${option.when?.minMoney ? `<small class="muted">Custa dinheiro</small>` : ''}
            ${option.check ? `<small class="muted">Teste de ${esc(option.check.stat === 'charisma' ? 'carisma' : 'inteligência')}</small>` : ''}
            ${option.outcomes ? '<small class="muted">Resultado incerto</small>' : ''}
          </button>`,
          )
          .join('')}
      </div>
    </section>`;
}

function matchStep(state, ctx) {
  const data = ctx.game.hubData();
  const fixture = data.fixturePreview;
  const player = state.player;

  if (!fixture) {
    return `
      <section class="card">
        <h3>Sem jogo nesta semana</h3>
        <p class="muted">Data livre. Aproveite para recuperar o corpo.</p>
        <button class="btn btn--primary" data-action="skip-free-week">Avançar</button>
      </section>`;
  }

  const unavailable = player.injury?.weeks > 0 || player.suspension > 0;
  const gap = player.overall - fixture.opponentRating;

  return `
    <section class="card card--fixture">
      <header class="fixture__head">
        <span class="fixture__comp">${esc(fixture.competition)} · ${esc(fixture.stage ?? '')}</span>
        <span class="badge badge--${fixture.isHome ? 'home' : 'away'}">${fixture.isHome ? 'Em casa' : 'Fora de casa'}</span>
      </header>
      <h3>${esc(getClub(player.club)?.name ?? '')} <small>x</small> ${esc(fixture.opponent)}</h3>
      <p class="muted">Nível do adversário: <strong>${fixture.opponentRating}</strong> ·
        ${gap > 6 ? 'você é bem superior' : gap > 0 ? 'leve vantagem sua' : gap > -7 ? 'jogo difícil' : 'adversário muito forte'}</p>
      ${unavailable ? '<p class="banner banner--bad">Você não pode jogar esta partida.</p>' : ''}
      <div class="row-actions">
        <button class="btn btn--primary" data-action="start-match">${unavailable ? 'Ver o resultado' : '⚽ Entrar em campo'}</button>
        <button class="btn btn--ghost" data-action="simulate-match">Simular partida</button>
      </div>
    </section>`;
}

function reportCard(report) {
  if (!report) return '';
  if (report.didNotPlay) {
    return `
      <section class="card">
        <h3>Você não jogou</h3>
        <p class="muted">${esc(report.reason)}</p>
        <p>Resultado: <strong>${report.score.team} x ${report.score.opponent}</strong> contra o ${esc(report.opponentName)}</p>
      </section>`;
  }
  const resultLabel = report.result === 'V' ? 'Vitória' : report.result === 'E' ? 'Empate' : 'Derrota';
  return `
    <section class="card card--report">
      <header class="report__head">
        <h3>${esc(resultLabel)}: ${report.score.team} x ${report.score.opponent}</h3>
        ${ratingPill(report.rating)}
      </header>
      <p class="muted">${esc(report.competition?.name ?? '')} contra o ${esc(report.opponentName)}</p>
      ${statRow([
        { label: 'Minutos', value: report.minutesPlayed },
        { label: 'Gols', value: report.stats.goals },
        { label: 'Assist.', value: report.stats.assists },
        ...(report.stats.saves ? [{ label: 'Defesas', value: report.stats.saves }] : []),
        ...(report.stats.tackles ? [{ label: 'Desarmes', value: report.stats.tackles }] : []),
      ])}
      ${report.motm ? '<p class="banner banner--good">🏅 Melhor em campo!</p>' : ''}
      ${report.bonus ? `<p class="muted">Bônus recebido: ${esc(money(report.bonus))}</p>` : ''}
    </section>`;
}

function weekTab(state, ctx) {
  const data = ctx.game.hubData();
  const season = state.season;
  const step = state.week.step;
  const totalWeeks = season.calendar.length;

  let stepMarkup = '';
  if (step === WEEK_STEPS.TRAINING) stepMarkup = trainingStep(state, ctx);
  else if (step === WEEK_STEPS.LIFE) stepMarkup = lifeStep(state, ctx);
  else if (step === WEEK_STEPS.MATCH) stepMarkup = matchStep(state, ctx);
  else
    stepMarkup = `
      ${reportCard(state.week.matchReport)}
      <button class="btn btn--primary btn--block" data-action="advance-week">Avançar para a próxima semana →</button>`;

  const trainingReport = state.week.trainingReport;
  const eventResult = state.week.eventResult;

  return `
    ${statusBanner(state.player)}

    <section class="week-head">
      <div>
        <span class="week-head__label">Temporada ${season.year} · ${esc(monthForWeek(season.weekIndex, totalWeeks))}</span>
        <h3>Semana ${Math.min(season.weekIndex + 1, totalWeeks)} de ${totalWeeks}</h3>
      </div>
      <div class="week-head__stats">
        ${statRow([
          { label: 'Jogos', value: state.player.season.apps },
          { label: 'Gols', value: state.player.season.goals },
          { label: 'Assist.', value: state.player.season.assists },
          { label: 'Nota', value: round(data.seasonRating, 2) || '—' },
          { label: 'Pontos', value: state.player.skillPoints },
        ])}
      </div>
    </section>

    ${
      trainingReport
        ? `<div class="banner banner--info">
            ${esc(trainingReport.option.icon)} ${esc(trainingReport.option.label)} concluído.
            ${trainingReport.gains.length ? `Evoluiu: ${esc(trainingReport.gains.join(', '))}.` : 'Sem evolução visível nesta semana.'}
            ${trainingReport.skillPoints ? ` +${trainingReport.skillPoints} ponto(s) de evolução.` : ''}
          </div>`
        : ''
    }
    ${
      eventResult
        ? `<div class="banner banner--info">${esc(eventResult.icon ?? '')} ${esc(eventResult.text)}
            ${eventResult.notes?.length ? `<small> (${esc(eventResult.notes.join(' · '))})</small>` : ''}</div>`
        : ''
    }

    ${stepMarkup}

    <section class="card">
      <h3>Agenda</h3>
      <ul class="agenda">
        ${season.calendar
          .slice(season.weekIndex)
          .filter((item) => !item.cancelled)
          .slice(0, 5)
          .map(
            (item, index) => `
          <li class="agenda__item ${index === 0 ? 'is-next' : ''}">
            <span class="agenda__comp">${esc(item.competitionName)}</span>
            <span class="agenda__opp">${item.isHome ? 'vs' : '@'} ${esc(getClub(item.opponentId)?.name ?? '')}</span>
            <span class="agenda__meta">${esc(item.stage ?? '')}</span>
          </li>`,
          )
          .join('')}
      </ul>
      <div class="row-actions">
        <button class="btn btn--ghost" data-action="sim-weeks" data-count="4">Simular 4 semanas</button>
        <button class="btn btn--ghost" data-action="sim-season">Simular até o fim da temporada</button>
      </div>
    </section>

    <section class="card">
      <h3>Notícias</h3>
      ${newsFeed(state.news, 7)}
    </section>`;
}

function profileTab(state, ctx) {
  const player = state.player;
  const ceiling = attributeCeiling(player);
  return `
    <section class="card">
      <header class="card__head">
        <h3>Evolução</h3>
        <span class="pill pill--bom">${player.skillPoints} ponto(s)</span>
      </header>
      <p class="muted">
        Gaste pontos para subir atributos. O custo cresce conforme o valor.
        Seu teto atual por atributo é <strong>${ceiling}</strong>
        ${player.hiddenPotentialKnown ? `(potencial estimado: ${player.potential})` : '(potencial ainda desconhecido)'}.
      </p>
      <div class="attr-wrap">
        ${attributeGrid(player, {
          spendable: true,
          skillPoints: player.skillPoints,
          costOf: upgradeCost,
          ceiling,
        })}
      </div>
    </section>

    <section class="card">
      <h3>Traços</h3>
      ${traitChips(player.traits)}
    </section>`;
}

function lifeTab(state, ctx) {
  const player = state.player;
  const expenses = weeklyExpenses(player);
  const sponsors = weeklySponsors(player);
  const salary = player.contract?.weeklySalary ?? 0;

  return `
    <section class="card">
      <h3>Atributos de vida</h3>
      ${lifePanel(player)}
    </section>

    <section class="card">
      <h3>Finanças</h3>
      ${statRow([
        { label: 'Em conta', value: money(player.money) },
        { label: 'Patrimônio', value: money(netWorth(player)) },
        { label: 'Salário/sem', value: money(salary) },
        { label: 'Gastos/sem', value: money(expenses) },
        { label: 'Patrocínio', value: money(sponsors) },
      ])}
      <h4>Investimentos</h4>
      <div class="invest-grid">
        ${INVESTMENTS.map(
          (item) => `
          <div class="invest">
            <strong>${esc(item.icon)} ${esc(item.label)}</strong>
            <small>${esc(item.description)}</small>
            <span class="muted">Custo: ${esc(money(item.cost))} · risco ${Math.round(item.risk * 100)}%</span>
            <button class="btn btn--mini" data-action="invest" data-invest="${item.id}"
              ${player.money < item.cost ? 'disabled' : ''}>Investir</button>
          </div>`,
        ).join('')}
      </div>
      ${
        player.assets?.length
          ? `<h4>Seus ativos</h4>
             <ul class="list">${player.assets
               .map((asset) => `<li>${esc(asset.label)} — ${esc(money(asset.value))}</li>`)
               .join('')}</ul>`
          : ''
      }
    </section>

    <section class="card">
      <h3>Contrato</h3>
      ${
        player.contract
          ? `<ul class="list">
              <li>Clube: <strong>${esc(getClub(player.club)?.name ?? '')}</strong></li>
              <li>Função: ${esc(player.contract.role)}</li>
              <li>Salário: ${esc(money(player.contract.weeklySalary))}/semana</li>
              <li>Temporadas restantes: ${player.contract.years}</li>
              ${player.contract.releaseClause ? `<li>Multa rescisória: ${esc(money(player.contract.releaseClause))}</li>` : ''}
              ${player.contract.loan ? '<li><em>Você está emprestado.</em></li>' : ''}
            </ul>`
          : '<p class="muted">Sem contrato.</p>'
      }
      <p class="muted">Valor de mercado estimado: <strong>${esc(money(marketValue(player)))}</strong></p>
    </section>

    <section class="card">
      <h3>Seleção ${esc(getNation(player.nationality).flag)}</h3>
      <ul class="list">
        <li>Situação: <strong>${player.national.status === 'principal' ? 'Seleção principal' : player.national.status === 'sub20' ? 'Seleção sub-20' : 'Sem convocação'}</strong></li>
        <li>Jogos: ${player.national.caps} · Gols: ${player.national.goals}</li>
        <li class="muted">Overall de referência para a seleção principal: ${mainSquadRequirement(player.nationality)}</li>
      </ul>
    </section>

    ${
      player.flags.length
        ? `<section class="card"><h3>Sua história</h3><div class="chips">${player.flags
            .map((flag) => `<span class="chip">${esc(flag.replaceAll('_', ' '))}</span>`)
            .join('')}</div></section>`
        : ''
    }`;
}

function careerTab(state) {
  const player = state.player;
  const totals = player.career.totals;
  const avg = totals.ratingCount ? totals.ratingSum / totals.ratingCount : 0;

  return `
    <section class="card">
      <h3>Números da carreira</h3>
      ${statRow([
        { label: 'Jogos', value: totals.apps },
        { label: 'Gols', value: totals.goals },
        { label: 'Assist.', value: totals.assists },
        { label: 'Melhor em campo', value: totals.motm },
        { label: 'Nota média', value: round(avg, 2) || '—' },
        { label: 'Seleção', value: `${totals.nationalCaps}/${totals.nationalGoals}` },
      ])}
    </section>

    <section class="card">
      <h3>Títulos (${player.career.trophies.length})</h3>
      ${
        player.career.trophies.length
          ? `<ul class="list">${player.career.trophies
              .map((trophy) => `<li>🏆 ${esc(trophy.name)} <small class="muted">${trophy.year}</small></li>`)
              .join('')}</ul>`
          : '<p class="muted">Nenhum título ainda.</p>'
      }
    </section>

    <section class="card">
      <h3>Prêmios individuais (${player.career.awards.length})</h3>
      ${
        player.career.awards.length
          ? `<ul class="list">${player.career.awards
              .map((award) => `<li>${esc(award.icon ?? '🏅')} ${esc(award.name)} <small class="muted">${award.year}</small></li>`)
              .join('')}</ul>`
          : '<p class="muted">Nenhum prêmio ainda.</p>'
      }
    </section>

    <section class="card">
      <h3>Temporada por temporada</h3>
      ${
        player.career.seasons.length
          ? `<table class="table">
              <thead><tr><th>Ano</th><th>Clube</th><th>Idade</th><th>OVR</th><th>J</th><th>G</th><th>A</th><th>Nota</th></tr></thead>
              <tbody>
                ${player.career.seasons
                  .map(
                    (season) => `
                  <tr>
                    <td>${season.year}</td>
                    <td>${esc(season.clubName)}</td>
                    <td>${season.age}</td>
                    <td>${season.overallBefore} → <strong>${season.overallAfter}</strong></td>
                    <td>${season.apps}</td>
                    <td>${season.goals}</td>
                    <td>${season.assists}</td>
                    <td>${season.rating || '—'}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`
          : '<p class="muted">Primeira temporada em andamento.</p>'
      }
    </section>

    <section class="card">
      <h3>Encerrar carreira</h3>
      <p class="muted">Você pode pendurar as chuteiras quando quiser e ver o resumo do seu legado.</p>
      <button class="btn btn--danger" data-action="retire">Me aposentar</button>
    </section>`;
}

function leagueTab(state) {
  const season = state.season;
  const league = getLeague(season.leagueId);
  const rows = standings(season.table);

  return `
    <section class="card">
      <h3>${esc(league.name)}</h3>
      ${leagueTable(rows, season.clubId)}
    </section>

    <section class="card">
      <h3>Seus resultados</h3>
      ${
        season.results.length
          ? `<ul class="results">
              ${season.results
                .slice()
                .reverse()
                .slice(0, 12)
                .map(
                  (result) => `
                <li class="results__item">
                  <span class="results__score ${result.score.team > result.score.opponent ? 'is-win' : result.score.team === result.score.opponent ? 'is-draw' : 'is-loss'}">
                    ${result.score.team}-${result.score.opponent}
                  </span>
                  <span>${esc(getClub(result.opponentId)?.name ?? '')}</span>
                  <span class="muted">${result.didNotPlay ? 'não jogou' : `nota ${result.rating}${result.goals ? ` · ${result.goals}G` : ''}`}</span>
                </li>`,
                )
                .join('')}
            </ul>`
          : '<p class="muted">Nenhuma partida ainda.</p>'
      }
    </section>`;
}

export default {
  id: 'hub',

  render(state, ctx) {
    if (!state.player || !state.season) return '<div class="screen"><p>Carregando carreira...</p></div>';
    const data = ctx.game.hubData();

    const body =
      ui.tab === 'perfil'
        ? profileTab(state, ctx)
        : ui.tab === 'vida'
          ? lifeTab(state, ctx)
          : ui.tab === 'carreira'
            ? careerTab(state)
            : ui.tab === 'liga'
              ? leagueTab(state)
              : weekTab(state, ctx);

    return `
      <div class="screen screen--hub">
        ${playerCard(state.player, { marketValue: data.marketValue, position: data.position })}
        <nav class="tabs tabs--main">
          ${TABS.map(
            (tab) => `
            <button class="tab ${ui.tab === tab.id ? 'is-active' : ''}" data-action="hub-tab" data-tab="${tab.id}">
              <span>${esc(tab.icon)}</span>${esc(tab.label)}
            </button>`,
          ).join('')}
        </nav>
        <div class="hub__body">${body}</div>
      </div>`;
  },

  actions: {
    'hub-tab': (ctx, dataset) => {
      ui.tab = dataset.tab;
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
