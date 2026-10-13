// Monta a aplicação: roteia telas, delega eventos e cuida do save.

import { confirmDialog, esc, mount, toast } from './dom.js';
import { icon } from './components.js';
import { Motion } from './motion.js';
import { boot } from './boot.js';
import { Sound } from './sound.js';
import { actionSound, BULK_ACTIONS, soundCues } from './soundCues.js';
import { game, SCREENS } from '../core/game.js';
import { declineOfflineCareers, MAX_CAREERS, offlineCareersToOffer, SaveManager } from '../core/storage.js';
import { authErrorMessage, firebaseAvailable, onAuthChange, signOutUser } from '../firebase/firebase.js';

import authScreen from './screens/auth.js';
import createScreen from './screens/create.js';
import trialsScreen from './screens/trials.js';
import hubScreen from './screens/hub.js';
import matchScreen from './screens/match.js';
import offseasonScreen from './screens/offseason.js';
import retiredScreen from './screens/retired.js';

const SCREEN_MAP = {
  [SCREENS.AUTH]: authScreen,
  [SCREENS.CREATE]: createScreen,
  [SCREENS.TRIALS]: trialsScreen,
  [SCREENS.HUB]: hubScreen,
  [SCREENS.MATCH]: matchScreen,
  [SCREENS.OFFSEASON]: offseasonScreen,
  [SCREENS.RETIRED]: retiredScreen,
};

const SAVE_LABELS = {
  idle: { text: '', icon: null },
  local: { text: 'Salvo no navegador', icon: 'floppy-disk' },
  saving: { text: 'Salvando na nuvem', icon: 'cloud' },
  cloud: { text: 'Salvo na nuvem', icon: 'cloud-check' },
  error: { text: 'Falha ao salvar na nuvem', icon: 'cloud-slash' },
};

function saveStatusMarkup(status) {
  const label = SAVE_LABELS[status] ?? SAVE_LABELS.idle;
  if (!label.text) return '';
  return `${icon(label.icon)}<span class="save-status__text">${esc(label.text)}</span>`;
}

export class App {
  constructor(root) {
    this.root = root;
    this.game = game;
    this.save = new SaveManager(game);
    this.auth = { user: null, ready: false };
    this.careers = { list: [], lastId: null, loading: true, cloudError: null };
    this.adoptedFor = null;
    this.rendering = false;
    this.motion = new Motion();
    this.sound = new Sound();
    this.cues = soundCues(this.sound);

    this.save.onStatus = () => this.renderStatus();
    this.game.subscribe(() => {
      this.cues.observe(this.game.state);
      this.render();
      if (this.game.state.player) this.save.schedule();
    });

    this.ctx = {
      game: this.game,
      save: this.save,
      auth: this.auth,
      rerender: () => this.render(),
      motion: this.motion,
      sound: this.sound,
      // Cancelar (ou tocar fora) faz o som de voltar; o "sim" deixa o som para a ação.
      confirm: async (options) => {
        const ok = await confirmDialog(options);
        if (!ok) this.sound.play('voltar');
        return ok;
      },
      careers: this.careers,
      maxCareers: MAX_CAREERS,
      onSignedIn: (user) => this.handleSignedIn(user),
      onUpgraded: (user) => this.handleUpgraded(user),
      signOut: () => this.handleSignOut(),
      openCareer: (id, options) => this.openCareer(id, options),
      openedAt: -Infinity,
      newCareer: () => this.newCareer(),
      deleteCareer: (id) => this.deleteCareer(id),
    };
  }

  async start() {
    this.bindEvents();
    this.render();

    if (!firebaseAvailable()) {
      this.auth.ready = true;
      await this.refreshCareers();
      return;
    }

    try {
      await onAuthChange((user) => this.handleAuthState(user));
    } catch (error) {
      console.warn('[app] Firebase indisponível, seguindo offline:', error);
      this.auth.ready = true;
      await this.refreshCareers();
    }
  }

  /** Login, logout ou volta de redirecionamento: sincroniza e mostra o álbum. */
  async handleAuthState(user) {
    const changed = (user?.uid ?? null) !== this.save.uid;
    this.auth.user = user;
    this.auth.ready = true;
    if (changed) {
      if (this.game.state.player) await this.save.saveNow();
      this.save.setUser(user?.uid ?? null);
      if (this.game.state.player) this.game.reset();
    }
    const firstLook = user && this.adoptedFor !== user.uid;
    this.adoptedFor = user?.uid ?? null;
    if (firstLook) await this.save.migrateLegacyCloudSave();
    await this.refreshCareers();
    // Depois que o álbum aparece (a tela de carregamento já saiu), para a pergunta ficar visível.
    if (firstLook) await this.offerOfflineCareers(user);
  }

  /**
   * Carreiras feitas sem conta neste navegador só vão para a conta se o
   * jogador aceitar. Quem recusa não é perguntado de novo sobre as mesmas.
   */
  async offerOfflineCareers(user) {
    const offline = offlineCareersToOffer(user.uid);
    if (!offline.length) return;
    const names = offline.map((meta) => meta.card?.nickname || meta.card?.firstName || 'Carreira').join(', ');
    const one = offline.length === 1;
    const ok = await this.ctx.confirm({
      title: one ? 'Guardar esta carreira na sua conta?' : 'Guardar estas carreiras na sua conta?',
      text: `${one ? 'Há uma carreira feita' : `Há ${offline.length} carreiras feitas`} sem conta neste aparelho (${names}). Guardando na conta, ${one ? 'ela fica' : 'elas ficam'} salva${one ? '' : 's'} na nuvem; senão, ${one ? 'continua' : 'continuam'} só aqui, sem conta.`,
      confirmLabel: 'Guardar na conta',
      cancelLabel: 'Agora não',
    });
    if (this.save.uid !== user.uid) return;
    if (!ok) {
      declineOfflineCareers(user.uid, offline.map((meta) => meta.id));
      return;
    }
    const moved = await this.save.adoptOfflineCareers(offline.map((meta) => meta.id));
    if (moved) toast(`${moved === 1 ? 'Uma carreira foi guardada' : `${moved} carreiras foram guardadas`} na sua conta.`, 'good');
    else toast('Não consegui guardar agora. Tente de novo mais tarde.', 'warn');
    await this.refreshCareers();
  }

  /** Recarrega a lista de carreiras (navegador + nuvem). */
  async refreshCareers() {
    this.careers.loading = true;
    this.render();
    const { careers, lastId, cloudError } = await this.save.list();
    Object.assign(this.careers, { list: careers, lastId, cloudError, loading: false });
    this.render();
  }

  /** minWait: tempo mínimo (ms) para a figurinha da carreira terminar de levantar. */
  async openCareer(id, { minWait = 0 } = {}) {
    const [state] = await Promise.all([this.save.open(id).catch(() => null), new Promise((resolve) => setTimeout(resolve, minWait))]);
    // A figurinha do jogador cola no lugar quando o perfil aparece logo depois.
    this.ctx.openedAt = performance.now();
    if (state && this.game.load(state) && this.game.state.player) {
      this.restoreScreen();
      return true;
    }
    toast('Não consegui abrir essa carreira. O save pode ser de uma versão antiga do jogo.', 'warn');
    return false;
  }

  async newCareer() {
    if (this.game.state.player) await this.save.saveNow();
    const { careers } = await this.save.list();
    if (careers.length >= MAX_CAREERS) {
      toast(`O álbum comporta ${MAX_CAREERS} carreiras. Apague uma para começar outra.`, 'warn');
      this.goAlbum();
      return;
    }
    this.save.startNew();
    this.game.reset();
    this.game.startCreation();
  }

  async deleteCareer(id) {
    try {
      await this.save.remove(id);
      toast('Carreira apagada.', 'info');
    } catch (error) {
      toast(authErrorMessage(error), 'warn');
    }
    await this.refreshCareers();
  }

  /** Guarda a carreira atual e volta para a capa com todas as carreiras. */
  async goAlbum() {
    if (this.game.state.player) await this.save.saveNow();
    this.save.activeId = null;
    this.game.reset();
    await this.refreshCareers();
  }

  // ------------------------------------------------------------------ eventos
  bindEvents() {
    // O primeiro toque libera o áudio (exigência do navegador, sobretudo no iPad).
    const unlock = () => this.sound.unlock();
    document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    document.addEventListener('keydown', unlock, { capture: true, passive: true });

    this.root.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target || target.disabled) return;
      const action = target.dataset.action;
      event.preventDefault();
      this.dispatch(action, { ...target.dataset }, event);
    });

    const handleField = (event) => {
      const target = event.target.closest('[data-field]');
      if (!target) return;
      const screen = SCREEN_MAP[this.game.state.screen];
      screen?.onInput?.(this.ctx, { ...target.dataset }, event);
    };
    this.root.addEventListener('input', handleField);
    this.root.addEventListener('change', handleField);

    window.addEventListener('beforeunload', () => {
      if (this.game.state.player) this.save.saveNow();
    });
  }

  dispatch(action, dataset, event) {
    const globalActions = {
      'save-now': async () => {
        await this.save.saveNow();
        toast(this.save.uid ? 'Carreira salva na nuvem.' : 'Carreira salva no navegador.', 'good');
      },
      'go-auth': () => this.goAlbum(),
      'go-album': () => this.goAlbum(),
      'toggle-fast': () => {
        this.game.toggleFastMode();
        toast(this.game.state.settings.fastMode ? 'Modo rápido ligado.' : 'Modo rápido desligado.', 'info');
      },
      'app-sign-out': () => this.handleSignOut(),
      'toggle-sound': () => {
        const on = this.sound.toggle();
        if (on) this.sound.play('toque');
        toast(on ? 'Som ligado.' : 'Som desligado.', 'info');
        this.render();
      },
    };

    const screen = SCREEN_MAP[this.game.state.screen];
    const handler = screen?.actions?.[action] ?? globalActions[action];
    if (!handler) return;
    this.sound.play(actionSound(action));
    const bulk = BULK_ACTIONS.has(action);
    if (bulk) this.cues.hold();
    Promise.resolve(handler(this.ctx, dataset, event))
      .catch((error) => {
        console.error('[app] erro na ação', action, error);
        toast('Algo deu errado nessa ação.', 'warn');
      })
      .finally(() => {
        if (bulk) this.cues.release(this.game.state);
      });
  }

  // --------------------------------------------------------------- navegação
  handleSignedIn(user) {
    // O resto (sincronizar, migrar, listar) acontece em handleAuthState.
    if (user) toast('Login feito. Sincronizando suas carreiras...', 'good');
  }

  /** Convidado virou conta de verdade: mesmo id, mesmas carreiras. */
  handleUpgraded(user) {
    if (!user) return;
    this.auth.user = user;
    toast('Pronto! Suas carreiras agora estão guardadas nesta conta.', 'good');
    this.render();
  }

  /**
   * Sair da conta: salva, confere na nuvem e só então apaga as cópias desta
   * conta guardadas no aparelho. O que não deu para confirmar fica guardado.
   */
  async handleSignOut() {
    // Vale para os dois botões de sair (a capa e a barra de cima).
    if (this.auth.user?.isAnonymous) {
      const ok = await this.ctx.confirm({
        title: 'Sair da conta de convidado?',
        text: 'Conta de convidado não tem senha: depois de sair, não dá para voltar a ela nem às carreiras salvas nela.',
        confirmLabel: 'Sair mesmo assim',
        danger: true,
      });
      if (!ok) return;
    }
    await this.save.saveNow();
    const { kept } = await this.save.clearLocalCopiesSavedInCloud();
    // A carreira aberta já foi salva; fechar antes de sair evita salvá-la de novo sem conta.
    this.save.activeId = null;
    if (this.game.state.player) this.game.reset();
    await signOutUser();
    if (!firebaseAvailable()) await this.handleAuthState(null);
    if (kept) {
      toast(
        `Você saiu da conta. ${kept === 1 ? 'Uma carreira não pôde ser conferida' : `${kept} carreiras não puderam ser conferidas`} na nuvem e ${kept === 1 ? 'ficou guardada' : 'ficaram guardadas'} neste aparelho.`,
        'warn',
        5200,
      );
    } else {
      toast('Você saiu da conta.', 'info');
    }
  }

  /** Garante que a tela restaurada faz sentido com o estado carregado. */
  restoreScreen() {
    const state = this.game.state;
    if (state.player?.retired) {
      this.game.setScreen(SCREENS.RETIRED);
      return;
    }
    if (state.screen === SCREENS.MATCH && !state.match) {
      this.game.setScreen(SCREENS.HUB);
      return;
    }
    if (state.screen === SCREENS.AUTH || state.screen === SCREENS.CREATE) {
      this.game.setScreen(state.season ? SCREENS.HUB : SCREENS.TRIALS);
      return;
    }
    this.game.notify();
  }

  // ------------------------------------------------------------------ render
  topBar() {
    const state = this.game.state;
    const showGameControls = Boolean(state.player) && state.screen !== SCREENS.AUTH;
    const user = this.auth.user;

    return `
      <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header class="topbar">
        <button class="brand" data-action="${showGameControls ? 'noop' : 'go-auth'}" aria-label="Craque do Zero">
          <span class="brand__mark">${icon('soccer-ball')}</span>
          <span class="brand__name">Craque do Zero</span>
        </button>
        <div class="topbar__right">
          <span class="save-status" id="save-status" role="status">${saveStatusMarkup(this.save.status)}</span>
          ${
            showGameControls
              ? `<button class="iconbtn" data-action="save-now" aria-label="Salvar agora" title="Salvar agora">${icon('floppy-disk')}</button>
                 <button class="iconbtn ${state.settings.fastMode ? 'is-active' : ''}" data-action="toggle-fast"
                   aria-pressed="${state.settings.fastMode}" aria-label="Modo rápido: menos eventos de vida" title="Modo rápido: menos eventos de vida">${icon('fast-forward')}</button>
                 <button class="iconbtn" data-action="toggle-sound" aria-pressed="${this.sound.enabled}"
                   aria-label="${this.sound.enabled ? 'Desligar o som' : 'Ligar o som'}" title="${this.sound.enabled ? 'Desligar o som' : 'Ligar o som'}">${icon(this.sound.enabled ? 'speaker-high' : 'speaker-slash')}</button>
                 <button class="iconbtn" data-action="go-album" aria-label="Minhas carreiras" title="Minhas carreiras">${icon('book-open-text')}</button>`
              : ''
          }
          ${user ? `<button class="iconbtn" data-action="app-sign-out" aria-label="Sair da conta" title="Sair da conta">${icon('sign-out')}</button>` : ''}
        </div>
      </header>`;
  }

  render() {
    if (this.rendering) return;
    this.rendering = true;
    const screenChanged = this.lastScreen !== this.game.state.screen;
    this.lastScreen = this.game.state.screen;
    const scroll = screenChanged ? 0 : window.scrollY;
    // O HTML é montado na hora da troca: com transição, a troca acontece um
    // instante depois, e nesse meio tempo o estado pode ter mudado.
    this.motion.swap(
      () => {
        const screenId = this.game.state.screen;
        const current = SCREEN_MAP[screenId] ?? authScreen;
        const markup = `${this.topBar()}<main class="app__main" id="conteudo" tabindex="-1" data-screen="${esc(screenId)}">${current.render(this.game.state, this.ctx)}</main>`;
        // Faixas que rolam de lado (as categorias da loja no celular) voltam
        // para onde estavam, senão a categoria tocada some da tela.
        const sideways = new Map([...this.root.querySelectorAll('[data-keep-scroll]')].map((node) => [node.dataset.keepScroll, node.scrollLeft]));
        mount(this.root, markup);
        for (const node of this.root.querySelectorAll('[data-keep-scroll]')) node.scrollLeft = sideways.get(node.dataset.keepScroll) ?? 0;
        this.motion.settle(this.root, screenId);
        window.scrollTo({ top: scroll, behavior: 'instant' });
      },
      { screenChanged },
    );
    this.rendering = false;
    // Tela de carregamento: conta conferida cola a terceira figurinha; com as
    // carreiras lidas, a capa sai e o álbum aparece já com o botão certo.
    if (this.auth.ready) boot.step(3);
    if (this.auth.ready && !this.careers.loading) boot.finish();
  }

  renderStatus() {
    const node = document.getElementById('save-status');
    if (node) node.innerHTML = saveStatusMarkup(this.save.status);
  }
}
