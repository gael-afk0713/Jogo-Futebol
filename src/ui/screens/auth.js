// Tela de entrada: login opcional via Firebase ou jogo offline.

import { esc, qs, toast } from '../dom.js';
import { firebaseAvailable } from '../../firebase/firebase.js';
import {
  authErrorMessage,
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../../firebase/firebase.js';
import { localMeta } from '../../core/storage.js';

const ui = { mode: 'login', busy: false, error: null };

function savedCareerCard() {
  const meta = localMeta();
  if (!meta?.playerName) return '';
  const when = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString('pt-BR') : '';
  return `
    <div class="auth__saved">
      <p><strong>${esc(meta.playerName)}</strong> · OVR ${esc(meta.overall ?? '?')} · ${esc(meta.age ?? '?')} anos</p>
      <small>Salvo neste navegador em ${esc(when)}</small>
      <button class="btn btn--primary btn--block" data-action="continue-local">Continuar carreira</button>
    </div>`;
}

export default {
  id: 'auth',

  render(state, ctx) {
    const configured = firebaseAvailable();
    const user = ctx.auth.user;

    return `
      <div class="screen screen--auth">
        <header class="hero">
          <span class="hero__badge">⚽ Modo Carreira</span>
          <h1>Craque do Zero</h1>
          <p>Crie um jogador, comece sem clube nenhum e construa uma carreira:
          treinos, escolhas de vida, propostas, seleção, títulos — e lances decididos por você dentro de campo.</p>
        </header>

        ${savedCareerCard()}

        ${
          configured
            ? `
          <section class="card auth__box">
            <div class="tabs">
              <button class="tab ${ui.mode === 'login' ? 'is-active' : ''}" data-action="auth-mode" data-mode="login">Entrar</button>
              <button class="tab ${ui.mode === 'signup' ? 'is-active' : ''}" data-action="auth-mode" data-mode="signup">Criar conta</button>
            </div>

            ${
              user
                ? `<p class="auth__logged">Conectado como <strong>${esc(user.isAnonymous ? 'convidado' : user.email ?? 'usuário')}</strong>.</p>
                   <button class="btn btn--primary btn--block" data-action="enter-game">Jogar</button>
                   <button class="btn btn--ghost btn--block" data-action="sign-out">Sair da conta</button>`
                : `
              <label class="field">
                <span>E-mail</span>
                <input id="auth-email" type="email" autocomplete="email" placeholder="voce@email.com" />
              </label>
              <label class="field">
                <span>Senha</span>
                <input id="auth-password" type="password" autocomplete="current-password" placeholder="mínimo 6 caracteres" />
              </label>
              ${ui.error ? `<p class="form-error">${esc(ui.error)}</p>` : ''}
              <button class="btn btn--primary btn--block" data-action="auth-submit" ${ui.busy ? 'disabled' : ''}>
                ${ui.busy ? 'Aguarde...' : ui.mode === 'login' ? 'Entrar e sincronizar' : 'Criar conta'}
              </button>
              <div class="auth__alt">
                <button class="btn btn--ghost" data-action="auth-google" ${ui.busy ? 'disabled' : ''}>Entrar com Google</button>
                <button class="btn btn--ghost" data-action="auth-guest" ${ui.busy ? 'disabled' : ''}>Entrar como convidado</button>
              </div>`
            }
          </section>`
            : `
          <section class="card auth__box">
            <h3>Firebase não configurado</h3>
            <p class="muted">
              O jogo salva no seu navegador. Para ter login e save na nuvem, preencha
              <code>src/firebase/config.js</code> com os dados do seu projeto Firebase
              (Authentication + Cloud Firestore). Instruções no README.
            </p>
          </section>`
        }

        <button class="btn btn--block ${firebaseAvailable() ? 'btn--ghost' : 'btn--primary'}" data-action="play-offline">
          Jogar offline (salvar só neste navegador)
        </button>

        <footer class="auth__footer">
          <small>Nomes de clubes e competições são usados apenas como referência de fãs, sem vínculo oficial.</small>
        </footer>
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

    'play-offline': (ctx) => {
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
