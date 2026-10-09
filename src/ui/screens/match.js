// Tela de partida: os lances em que você decide o que fazer.

import { esc } from '../dom.js';
import { round } from '../../core/utils.js';
import { feed, icon, meter, momentSpot, monogram, pitch, ratingBadge, statline, tierClass } from '../components.js';

const ui = { resolution: null, lastMoment: null };

function chanceMarkup(chance, sure = false) {
  if (sure) return '';
  const value = Math.round(chance * 100);
  return `<span class="option__aside ${tierClass(value)}"><span class="option__chance">${value}%<small>de chance</small></span></span>`;
}

const zoneLabel = (zone) => ({ gol: 'sua área', defesa: 'defesa', meio: 'meio-campo', ataque: 'área adversária' })[zone] ?? 'campo';

function stateMessage(match) {
  if (match.sentOff) return 'Você foi expulso e está fora da partida.';
  if (match.injured) return 'Você se machucou e saiu de campo.';
  if (match.substituted) return 'Você já foi substituído.';
  if (!match.onField && match.role === 'reserva') return 'Você começa no banco e deve entrar no segundo tempo.';
  return 'O jogo segue até o próximo lance em que você se envolve.';
}

/** O que está mexendo no seu jogo agora: chuva, confiança, braçadeira, tática. */
function conditionChips(match) {
  const conditions = match.conditions ?? {};
  const chips = [];
  if (conditions.rain) chips.push({ text: conditions.rainProof ? 'Chuva (trava alta)' : 'Chuva: passe e drible mais difíceis', iconName: 'cloud', tone: conditions.rainProof ? '' : 'down' });
  if (conditions.skill > 0) chips.push({ text: `Confiante +${conditions.skill}`, iconName: 'arrow-up', tone: 'up' });
  if (conditions.skill < 0) chips.push({ text: `Nervoso ${conditions.skill}`, iconName: 'arrow-down', tone: 'down' });
  if (conditions.captain) chips.push({ text: 'Capitão', iconName: 'star', tone: 'up' });
  if (conditions.tactic === 'segurar') chips.push({ text: 'Time fechado', iconName: 'shield', tone: '' });
  if (conditions.tactic === 'pressionar') chips.push({ text: 'Time no ataque', iconName: 'lightning', tone: '' });
  if (!chips.length) return '';
  return `<ul class="conditions" aria-label="Situação do jogo">${chips
    .map((chip) => `<li class="condition ${chip.tone ? `condition--${chip.tone}` : ''}">${icon(chip.iconName)}${esc(chip.text)}</li>`)
    .join('')}</ul>`;
}

/** Título do desfecho: o gol tem nome próprio, o resto diz se deu certo. */
function resolutionTitle(resolution) {
  if (resolution.kind === 'goalAnnulled') return { text: 'Gol anulado', tone: 'bad', iconName: 'x' };
  if (resolution.kind === 'penaltyWon') return { text: 'Pênalti!', tone: 'good', iconName: 'check' };
  if (resolution.kind === 'goal' && resolution.teamGoal) return { text: 'Gol!', tone: 'goal', iconName: 'soccer-ball' };
  if (resolution.offBall && resolution.chance >= 1) return { text: 'Decidido', tone: 'good', iconName: 'check' };
  if (resolution.teamGoal) return { text: 'Gol do time', tone: 'goal', iconName: 'soccer-ball' };
  if (resolution.opponentGoal) return { text: 'Gol do adversário', tone: 'bad', iconName: 'x' };
  return resolution.success
    ? { text: 'Deu certo', tone: 'good', iconName: 'check' }
    : { text: 'Não saiu como você queria', tone: 'bad', iconName: 'x' };
}

function goalScorers(match, side) {
  const goals = (match.goals ?? []).filter((goal) => goal.side === side);
  if (!goals.length) return '';
  return `<ul class="placard__scorers">${goals
    .map((goal) => `<li class="${goal.mine ? 'is-you' : ''}">${goal.scorer ? `${esc(goal.scorer)} ` : ''}<span class="num">${goal.minute}'</span></li>`)
    .join('')}</ul>`;
}

function centerPanel(match) {
  if (ui.resolution) {
    const title = resolutionTitle(ui.resolution);
    const myGoal = title.tone === 'goal';
    const shotKey = `${match.id}-${ui.resolution.minute}-${ui.resolution.text.length}`;
    return `
      <section class="sheet resolution resolution--${title.tone} ${ui.resolution.offBall || !ui.lastMoment ? 'resolution--off' : ''}" aria-live="polite" data-moment="res-${esc(shotKey)}">
        ${
          ui.lastMoment && !ui.resolution.offBall
            ? `<div class="moment__pitch">${pitch({
                zone: match.zone,
                spot: momentSpot(ui.lastMoment, match.zone),
                mode: myGoal ? 'goal' : 'moment',
                label: myGoal ? 'A bola entra no gol' : 'Onde foi o lance',
              })}</div>`
            : ''
        }
        <h2 class="resolution__title">${icon(title.iconName)}${title.text}</h2>
        <p class="moment__text">${esc(ui.resolution.text)}</p>
        ${
          ui.resolution.chance >= 1
            ? ui.resolution.extras?.length
              ? `<p class="muted">${esc(ui.resolution.extras.join(', '))}.</p>`
              : ''
            : `<p class="muted">Você tinha <strong class="num">${Math.round(ui.resolution.chance * 100)}%</strong> de chance${
                ui.resolution.extras?.length ? `. ${esc(ui.resolution.extras.join(', '))}.` : '.'
              }</p>`
        }
        <div class="actions"><button class="btn btn--primary" data-action="match-continue">Continuar o jogo ${icon('arrow-right')}</button></div>
      </section>`;
  }

  if (match.pending) {
    const offBall = match.pending.offBall;
    return `
      <section class="sheet section moment ${offBall ? 'moment--off' : ''}" aria-labelledby="lance-titulo">
        ${
          offBall
            ? `<p class="moment__kind">${icon('megaphone')}Fora da bola</p>`
            : `<div class="moment__pitch">${pitch({ zone: match.zone, spot: momentSpot(match.pending.id, match.zone), label: `Lance na ${zoneLabel(match.zone)}` })}</div>`
        }
        <h2 id="lance-titulo"><span class="moment__minute">${match.minute}'</span>${esc(match.pending.title)}</h2>
        <p class="moment__text">${esc(match.pending.text)}</p>
        <ul class="optionlist">
          ${match.pending.options
            .map(
              (option) => `
            <li class="is-new" style="--i:${option.index}" data-new-key="${esc(`${match.id}-${match.minute}-${option.index}`)}">
              <button class="option option--compact" data-action="match-choose" data-index="${option.index}">
                <span class="option__text">
                  <span class="option__title">${esc(option.label)}</span>
                  ${option.hint ? `<span class="option__desc">${esc(option.hint)}</span>` : ''}
                </span>
                ${chanceMarkup(option.chance, option.sure)}
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
        <header class="scoreboard placard" aria-label="Placar">
          <div class="scoreboard__team">
            ${monogram(match.clubName, { you: true })}
            <div class="placard__side"><span class="scoreboard__name">${esc(match.clubName)}</span>${goalScorers(match, 'team')}</div>
          </div>
          <div class="scoreboard__clock">
            <div class="scoreboard__line">
              <span class="scoreboard__goals" data-pulse="placar-casa-${esc(match.id)}" data-value="${match.score.team}" aria-label="${esc(match.clubName)} ${match.score.team}">${match.score.team}</span>
              <span class="scoreboard__minute" aria-label="Minuto ${match.minute}">${match.minute}'</span>
              <span class="scoreboard__goals" data-pulse="placar-fora-${esc(match.id)}" data-value="${match.score.opponent}" aria-label="${esc(match.opponentName)} ${match.score.opponent}">${match.score.opponent}</span>
            </div>
            <span class="placard__half">${match.minute >= 90 ? 'Fim de jogo' : match.minute > 45 ? '2º tempo' : '1º tempo'}</span>
            <span class="scoreboard__comp">${esc(match.competition?.name ?? '')}</span>
          </div>
          <div class="scoreboard__team scoreboard__team--away">
            <div class="placard__side"><span class="scoreboard__name">${esc(match.opponentName)}</span>${goalScorers(match, 'opponent')}</div>
            ${monogram(match.opponentName)}
          </div>
          <div class="placard__clock" aria-hidden="true" data-pulse="relogio-${esc(match.id)}" data-value="${match.minute}" style="--m:${Math.min(90, match.minute) / 90}">
            <span class="placard__tick"></span><span class="placard__fill"></span>
          </div>
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
                ${ratingBadge(round(match.rating, 1), { pulse: `nota-${match.id}` })}
              </div>
              ${statline([
                { label: 'Gols', value: match.stats.goals },
                { label: 'Assist.', value: match.stats.assists },
                ...(match.zone === 'gol' ? [{ label: 'Defesas', value: match.stats.saves }] : [{ label: 'Desarmes', value: match.stats.tackles }]),
                { label: 'Minutos', value: Math.round(match.minutesPlayed) },
              ])}
              ${meter({ label: 'Energia', value: match.stamina, iconName: 'lightning', pulse: `energia-${match.id}` })}
              ${conditionChips(match)}
              ${preview ? `<p class="muted">${esc(preview.forecast)} Força do adversário <strong class="num">${preview.opponentRating}</strong>.</p>` : ''}
            </section>

            <section class="section" aria-labelledby="narracao-titulo">
              <h3 id="narracao-titulo">Narração</h3>
              ${feed(match.timeline.slice().reverse(), { limit: 12, minute: true, keyPrefix: `${match.id}-` })}
            </section>
          </aside>
        </div>
      </div>`;
  },

  actions: {
    'match-choose': (ctx, dataset) => {
      ui.lastMoment = ctx.game.state.match?.pending?.id ?? null;
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
