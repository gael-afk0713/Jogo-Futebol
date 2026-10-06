// Capa do álbum: entrar, continuar ou começar uma carreira.

import { esc, qs, toast } from '../dom.js';
import { createRng } from '../../core/rng.js';
import { createPlayer } from '../../engine/player.js';
import {
  authErrorMessage,
  firebaseAvailable,
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../../firebase/firebase.js';
import { localMeta } from '../../core/storage.js';
import { icon, playerSticker } from '../components.js';

const ui = { mode: 'login', busy: false, error: null };

// Figurinhas de exemplo da capa: jogadores fictícios gerados pelo próprio jogo.
const SAMPLES = [
  { firstName: 'Davi', lastName: 'Moura', nickname: 'Davi', position: 'GOL', seed: 11, overall: 64, appearance: { skin: 1, hair: 'raspado', hairColor: '#1b1210', beard: 'cavanhaque' } },
  { firstName: 'Tiago', lastName: 'Rocha', nickname: 'Tiaguinho', position: 'ATA', seed: 23, overall: 87, appearance: { skin: 4, hair: 'black', hairColor: '#1b1210' } },
  { firstName: 'Leo', lastName: 'Sales', nickname: 'Leo Sales', position: 'MEI', seed: 37, overall: 72, appearance: { skin: 2, hair: 'moicano', hairColor: '#c9a227' } },
].map((sample) => ({ ...createPlayer({ ...sample, nationality: 'BRA' }, createRng(sample.seed)), overall: sample.overall }));

function coverStickers() {
  return `<div class="cover__stickers" aria-hidden="true">${SAMPLES.map((player) =>
    playerSticker(player, { size: 'md', meta: 'Exemplo' }),
  ).join('')}</div>`;
}

function savedCareer() {
  const meta = localMeta();
  if (!meta?.playerName) return null;
  return meta;
}

function loginBox(ctx) {
  const user = ctx.auth.user;
  if (user) {
    return `
      <section class="sheet section">
        <h2>Conta</h2>
        <p class="lede">Conectado como <strong>${esc(user.isAnonymous ? 'convidado' : user.email ?? 'usuário')}</strong>. A carreira é salva na nuvem.</p>
        <div class="actions">
          <button class="btn btn--primary" data-action="enter-game">Jogar ${icon('arrow-right')}</button>
          <button class="btn btn--quiet" data-action="sign-out">Sair da conta</button>
        </div>
      </section>`;
  }
  return `
    <section class="sheet section" aria-labelledby="conta-titulo">
      <h2 id="conta-titulo">Salvar na nuvem</h2>
      <nav class="tabs" role="tablist" aria-label="Entrar ou criar conta">
        <button class="tab" role="tab" aria-selected="${ui.mode === 'login'}" data-action="auth-mode" data-mode="login">Entrar</button>
        <button class="tab" role="tab" aria-selected="${ui.mode === 'signup'}" data-action="auth-mode" data-mode="signup">Criar conta</button>
      </nav>
      <div class="stack">
        <label class="field">
          <span class="field__label">E-mail</span>
          <input class="input" id="auth-email" type="email" autocomplete="email" placeholder="voce@email.com" />
        </label>
        <label class="field">
          <span class="field__label">Senha</span>
          <input class="input" id="auth-password" type="password" autocomplete="${ui.mode === 'login' ? 'current-password' : 'new-password'}" placeholder="Mínimo de 6 caracteres" />
        </label>
        ${ui.error ? `<p class="field__error" role="alert">${esc(ui.error)}</p>` : ''}
        <button class="btn btn--primary btn--block" data-action="auth-submit" ${ui.busy ? 'disabled' : ''}>
          ${ui.busy ? 'Aguarde' : ui.mode === 'login' ? 'Entrar e sincronizar' : 'Criar conta'}
        </button>
      </div>
      <div class="actions">
        <button class="btn btn--sm" data-action="auth-google" ${ui.busy ? 'disabled' : ''}>Entrar com Google</button>
        <button class="btn btn--sm btn--quiet" data-action="auth-guest" ${ui.busy ? 'disabled' : ''}>Entrar como convidado</button>
      </div>
    </section>`;
}

export default {
  id: 'auth',

  render(state, ctx) {
    const saved = savedCareer();
    const cloud = firebaseAvailable();
    const when = saved?.updatedAt ? new Date(saved.updatedAt).toLocaleDateString('pt-BR') : '';

    return `
      <div class="screen">
        <section class="cover" aria-labelledby="capa-titulo">
          <div>
            <h1 class="cover__title" id="capa-titulo">Craque <span>do Zero</span></h1>
            <p class="cover__lede">Monte um jogador de 16 anos sem clube e cole a carreira inteira no álbum: treinos, escolhas fora de campo, lances que você decide e propostas que chegam pelo seu desempenho.</p>
            <div class="actions cover__actions">
              ${
                saved
                  ? `<button class="btn btn--primary" data-action="continue-local">Continuar carreira ${icon('arrow-right')}</button>
                     <button class="btn btn--quiet cover__secondary" data-action="play-offline">Começar outra</button>`
                  : `<button class="btn btn--primary" data-action="play-offline">Começar carreira ${icon('arrow-right')}</button>`
              }
            </div>
            ${
              saved
                ? `<p class="cover__saved"><strong>${esc(saved.playerName)}</strong>, overall <span class="num">${esc(saved.overall ?? '?')}</span>, ${esc(saved.age ?? '?')} anos. Salvo em ${esc(when)}.</p>`
                : ''
            }
          </div>
          ${coverStickers()}
        </section>

        <div class="entry ${cloud ? '' : 'entry--single'}">
          ${cloud ? loginBox(ctx) : ''}
          <section class="section">
            <h2>Como funciona</h2>
            <ul class="ledger">
              <li><span>Cada semana</span><strong>Treino, vida, partida</strong></li>
              <li><span>Nas partidas</span><strong>Você decide os lances</strong></li>
              <li><span>No fim do ano</span><strong>Propostas pelo desempenho</strong></li>
              <li><span>Seu progresso</span><strong>${cloud ? 'Navegador ou nuvem' : 'Salvo neste navegador'}</strong></li>
            </ul>
            <p class="entry__note">Nomes de clubes e competições aparecem só como referência de fã, sem vínculo oficial.</p>
          </section>
        </div>
      </div>`;
  },

  actions: {
    'auth-mode': (ctx, dataset) => {
      ui.mode = dataset.mode;
      ui.error = null;
      ctx.rerender();
    },

    'auth-submit': async (ctx) => {
      const email = qs('#auth-email')?.value.trim();
      const password = qs('#auth-password')?.value ?? '';
      if (!email || !password) {
        ui.error = 'Preencha e-mail e senha.';
        ctx.rerender();
        return;
      }
      ui.busy = true;
      ui.error = null;
      ctx.rerender();
      try {
        const user = ui.mode === 'login' ? await signInWithEmail(email, password) : await signUpWithEmail(email, password);
        await ctx.onSignedIn(user);
      } catch (error) {
        ui.error = authErrorMessage(error);
      } finally {
        ui.busy = false;
        ctx.rerender();
      }
    },

    'auth-google': async (ctx) => {
      ui.busy = true;
      ui.error = null;
      ctx.rerender();
      try {
        const user = await signInWithGoogle();
        await ctx.onSignedIn(user);
      } catch (error) {
        ui.error = authErrorMessage(error);
      } finally {
        ui.busy = false;
        ctx.rerender();
      }
    },

    'auth-guest': async (ctx) => {
      ui.busy = true;
      ui.error = null;
      ctx.rerender();
      try {
        const user = await signInAsGuest();
        await ctx.onSignedIn(user);
      } catch (error) {
        ui.error = authErrorMessage(error);
      } finally {
        ui.busy = false;
        ctx.rerender();
      }
    },

    'sign-out': async (ctx) => {
      await ctx.signOut();
      toast('Você saiu da conta.', 'info');
    },

    'play-offline': async (ctx) => {
      if (savedCareer()) {
        const ok = await ctx.confirm({
          title: 'Começar outra carreira?',
          text: 'A carreira salva neste navegador será apagada. Não dá para desfazer.',
          confirmLabel: 'Apagar e começar',
          danger: true,
        });
        if (!ok) return;
        await ctx.save.deleteAll();
        ctx.game.reset();
      }
      ctx.startOffline();
    },

    'enter-game': (ctx) => {
      ctx.enterGame();
    },

    'continue-local': (ctx) => {
      ctx.continueLocal();
    },
  },
};
