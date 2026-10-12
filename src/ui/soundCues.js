// Quando cada som toca. Os toques em botão tocam na hora (actionSound); os
// momentos do jogo (entrar em campo, gol, fim do ano...) são percebidos
// olhando o estado depois de cada mudança (soundCues), sem mexer nas regras.

import { SCREENS, WEEK_STEPS } from '../core/game.js';

// Som de cada ação. O que não está na lista faz o toque comum. null: a tela
// decide (compra deu certo ou não, abrir ou fechar o treino, resultado do
// lance) ou não faz som.
const ACTION_SOUNDS = {
  'choose-training': 'confirmar',
  'accept-trial': 'confirmar',
  'accept-offer': 'confirmar',
  'stay-club': 'confirmar',
  'start-match': 'confirmar',
  'confirm-create': 'confirmar',
  'resolve-event': 'confirmar',
  'back-auth': 'voltar',
  'buy-item': null,
  'peek-training': null,
  'match-choose': null,
  'toggle-sound': null,
  noop: null,
};

export const actionSound = (action) => (action in ACTION_SOUNDS ? ACTION_SOUNDS[action] : 'toque');

/** Opção de lance que é um chute ou um passe (toca o chute antes do resultado). */
export const isKick = (pending, option) =>
  Boolean(pending && !pending.offBall && option && (['shoot', 'pass'].includes(option.mod) || ['goal', 'assist', 'chance'].includes(option.success?.kind)));

function snapshot(state) {
  const offseason = state.offseason;
  return {
    screen: state.screen,
    matchId: state.match?.id ?? null,
    matchFinished: Boolean(state.match?.finished),
    teamGoals: state.match?.score?.team ?? 0,
    eventKey: state.week?.step === WEEK_STEPS.LIFE && state.week?.eventId ? `${state.season?.year}-${state.season?.weekIndex}-${state.week.eventId}` : null,
    overall: state.player?.overall ?? null,
    offseasonKey: offseason ? `${offseason.year}-${state.player?.career?.seasons?.length ?? 0}` : null,
    celebrate: Boolean(offseason && (offseason.summary?.trophies?.length || offseason.awards?.length || offseason.objectives?.achieved)),
  };
}

// Ações que simulam várias semanas ou um jogo inteiro de uma vez: os sons do
// meio do caminho ficam guardados e só o resultado final toca.
export const BULK_ACTIONS = new Set(['sim-weeks', 'sim-season', 'simulate-match', 'match-auto']);

/** Olha cada estado novo e toca o som do momento. hold/release seguram os sons durante uma simulação. */
export function soundCues(sound) {
  let last = null;
  let held = false;
  // A partida que já teve o apito final (para não apitar duas vezes).
  let whistled = null;
  const observe = (state) => {
    if (held) return;
    const now = snapshot(state);
    // Jogo aberto direto numa partida salva: só o clima de estádio, sem apito.
    if (!last && now.screen === SCREENS.MATCH) sound.ambient(true);
    if (last) {
      const sameMatch = now.matchId && now.matchId === last.matchId;
      // Partida: apito no começo e no fim, clima de estádio enquanto dura.
      if (now.screen === SCREENS.MATCH && last.screen !== SCREENS.MATCH) {
        sound.play('apito');
        sound.ambient(true);
      }
      // Apito final: quando o jogo termina na tela ou quando a tela da partida fecha.
      const ended = (sameMatch && now.matchFinished && !last.matchFinished) || (now.screen !== SCREENS.MATCH && last.screen === SCREENS.MATCH);
      if (ended && last.matchId && whistled !== last.matchId) {
        whistled = last.matchId;
        sound.play('apito', { delay: 300 });
      }
      if (now.screen !== SCREENS.MATCH && last.screen === SCREENS.MATCH) sound.ambient(false);
      if (sameMatch && now.teamGoals > last.teamGoals) sound.play('gol', { delay: 250 });
      // Fim de ano: a figurinha da temporada é colada no álbum.
      if (now.offseasonKey && now.offseasonKey !== last.offseasonKey) {
        sound.play('figurinha', { delay: 200 });
        if (now.celebrate) sound.play('conquista', { delay: 900 });
      }
      // Evento da semana.
      if (now.eventKey && now.eventKey !== last.eventKey) sound.play('aviso');
      // Overall subiu com o treino.
      if (now.overall && last.overall && now.overall > last.overall && now.screen === SCREENS.HUB && last.screen === SCREENS.HUB) {
        sound.play('conquista', { delay: 150 });
      }
    }
    last = now;
  };
  return {
    observe,
    hold() {
      held = true;
    },
    // Compara o estado de antes da simulação com o final, como se fosse um passo só.
    release(state) {
      held = false;
      observe(state);
    },
  };
}
