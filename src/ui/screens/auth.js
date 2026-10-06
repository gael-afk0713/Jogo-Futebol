// Capa do álbum: entrar, continuar ou começar uma carreira.

import { esc, qs } from '../dom.js';
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

const when = (timestamp) =>
  timestamp ? new Date(timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Uma carreira salva é uma figurinha no álbum. */
function careerCard(career, index) {
  const card = career.card ?? {};
  const name = `${card.firstName ?? ''} ${card.lastName ?? ''}`.trim() || 'Carreira';
  const where = career.local && career.remote ? 'Nuvem e navegador' : career.remote ? 'Na nuvem' : 'Neste navegador';
  const whereIcon = career.remote ? 'cloud-check' : 'floppy-disk';
  return `
    <article class="career is-new" style="--i:${index}" data-new-key="carreira-${esc(career.id)}">
      ${playerSticker(card, { size: 'sm', meta: career.retired ? 'Aposentado' : (career.clubName ?? 'Sem clube') })}
      <div class="career__body">
        <h3 class="career__name">${esc(name)}</h3>
        <p class="career__facts">
          <span>${esc(card.age ?? '?')} anos${career.year ? `, temporada ${esc(career.year)}` : ''}</span>
          ${career.retired ? '<span class="tag">Carreira encerrada</span>' : ''}
        </p>
        <p class="career__where">${icon(whereIcon)}${where} · ${esc(when(career.updatedAt))}</p>
        <div class="career__actions">
          <button class="btn btn--sm" data-action="open-career" data-id="${esc(career.id)}" aria-label="${esc(`${career.retired ? 'Ver o álbum de' : 'Jogar com'} ${name}`)}">${career.retired ? 'Ver álbum' : 'Jogar'}</button>
          <button class="iconbtn iconbtn--quiet" data-action="delete-career" data-id="${esc(career.id)}" data-name="${esc(name)}" aria-label="${esc(`Apagar a carreira de ${name}`)}" title="Apagar carreira">${icon('x')}</button>
        </div>
      </div>
    </article>`;
}

function careersSection(ctx) {
  const { list, loading, cloudError } = ctx.careers;
  const max = ctx.maxCareers;
  if (loading && !list.length) {
    return `<section class="section" aria-busy="true"><h2>Suas carreiras</h2><p class="muted">Abrindo o álbum...</p></section>`;
  }
  const free = Math.max(0, max - list.length);
  const slots = Array.from({ length: free }, (_, index) => {
    const number = list.length + index + 1;
    return index === 0
      ? `<button class="slot slot--action" data-action="new-career"><span class="slot__number num">${number}</span>${icon('plus')}<span class="slot__label">Nova carreira</span></button>`
      : `<div class="slot" aria-hidden="true"><span class="slot__number num">${number}</span><span class="slot__label">Espaço livre</span></div>`;
  }).join('');
  return `
    <section class="section" aria-labelledby="carreiras-titulo">
      <div class="section__head">
        <h2 id="carreiras-titulo">Suas carreiras</h2>
        <p class="num">${list.length} de ${max}</p>
      </div>
      ${cloudError ? `<div class="notice notice--warn">${icon('cloud-slash')}<div>Não consegui ler a nuvem: ${esc(authErrorMessage(cloudError))} Mostrando o que está salvo neste navegador.</div></div>` : ''}
      <div class="careers">${list.map(careerCard).join('')}${slots}</div>
      ${free === 0 ? '<p class="muted">O álbum está cheio. Apague uma carreira para começar outra.</p>' : ''}
    </section>`;
}

function loginBox(ctx) {
  const user = ctx.auth.user;
  if (user) {
    return `
      <section class="sheet section">
        <h2>Conta</h2>
        <p class="lede">Conectado como <strong>${esc(user.isAnonymous ? 'convidado' : (user.email ?? 'usuário'))}</strong>. Todas as suas carreiras ficam salvas na nuvem e aparecem em qualquer aparelho em que você entrar.</p>
        ${user.isAnonymous ? '<p class="muted">Conta de convidado: se você sair, não dá para voltar a ela. Crie uma conta com e-mail para não perder as carreiras.</p>' : ''}
        <div class="actions">
          <button class="btn" data-action="sign-out">Sair da conta</button>
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
    const cloud = firebaseAvailable();
    const { list, lastId } = ctx.careers;
    const last = list.find((career) => career.id === lastId && !career.retired) ?? list.find((career) => !career.retired);
    const lastName = last ? (last.card?.nickname || last.card?.firstName || 'sua carreira') : '';
    const full = list.length >= ctx.maxCareers;

    return `
      <div class="screen">
        <section class="cover" aria-labelledby="capa-titulo">
          <div>
            <h1 class="cover__title" id="capa-titulo">Craque <span>do Zero</span></h1>
            <p class="cover__lede">Monte um jogador de 16 anos sem clube e cole a carreira inteira no álbum: treinos, escolhas fora de campo, lances que você decide e propostas que chegam pelo seu desempenho.</p>
            <div class="actions cover__actions">
              ${
                last
                  ? `<button class="btn btn--primary" data-action="open-career" data-id="${esc(last.id)}">Continuar com ${esc(lastName)} ${icon('arrow-right')}</button>
                     ${full ? '' : '<button class="btn btn--quiet cover__secondary" data-action="new-career">Nova carreira</button>'}`
                  : full
                    ? ''
                    : `<button class="btn btn--primary" data-action="new-career">Começar carreira ${icon('arrow-right')}</button>`
              }
            </div>
            ${cloud && !ctx.auth.user ? '<p class="cover__saved">Sem conta, as carreiras ficam só neste navegador. Entre para salvar na nuvem.</p>' : ''}
          </div>
          ${coverStickers()}
        </section>

        ${careersSection(ctx)}

        <div class="entry ${cloud ? '' : 'entry--single'}">
          ${cloud ? loginBox(ctx) : ''}
          <section class="section">
            <h2>Como funciona</h2>
            <ul class="ledger">
              <li><span>Cada semana</span><strong>Treino, vida, partida</strong></li>
              <li><span>Nas partidas</span><strong>Você decide os lances</strong></li>
              <li><span>No fim do ano</span><strong>Propostas pelo desempenho</strong></li>
              <li><span>Carreiras</span><strong>Até ${ctx.maxCareers} ao mesmo tempo</strong></li>
              <li><span>Seu progresso</span><strong>${cloud ? 'Navegador e nuvem' : 'Salvo neste navegador'}</strong></li>
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
    },

    'new-career': (ctx) => ctx.newCareer(),

    'open-career': (ctx, dataset) => ctx.openCareer(dataset.id),

    'delete-career': async (ctx, dataset) => {
      const ok = await ctx.confirm({
        title: 'Apagar esta carreira?',
        text: `A carreira de ${dataset.name} será apagada${ctx.auth.user ? ' do navegador e da nuvem' : ' deste navegador'}. Não dá para desfazer.`,
        confirmLabel: 'Apagar carreira',
        danger: true,
      });
      if (ok) await ctx.deleteCareer(dataset.id);
    },
  },
};
