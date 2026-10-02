// Monta a aplicação: roteia telas, delega eventos e cuida do save.

import { confirmDialog, esc, mount, toast } from './dom.js';
import { game, SCREENS } from '../core/game.js';
import { SaveManager, loadLocal } from '../core/storage.js';
import { firebaseAvailable, onAuthChange, signOutUser } from '../firebase/firebase.js';

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
  idle: '',
  local: '💾 salvo no navegador',
  saving: '☁️ salvando...',
  cloud: '☁️ salvo na nuvem',
  error: '⚠️ falha ao salvar na nuvem',
};

export class App {
  constructor(root) {
    this.root = root;
    this.game = game;
    this.save = new SaveManager(game);
    this.auth = { user: null, offline: false, ready: false };
    this.rendering = false;

    this.save.onStatus = () => this.renderStatus();
    this.game.subscribe(() => {
      this.render();
      if (this.game.state.player) this.save.schedule();
    });

    this.ctx = {
      game: this.game,
      save: this.save,
      auth: this.auth,
      rerender: () => this.render(),
      confirm: confirmDialog,
      onSignedIn: (user) => this.handleSignedIn(user),
      signOut: () => this.handleSignOut(),
      startOffline: () => this.startOffline(),
      enterGame: () => this.resumeOrCreate(),
      continueLocal: () => this.continueLocal(),
    };
  }

  async start() {
    this.bindEvents();
    this.render();

    if (!firebaseAvailable()) {
      this.auth.ready = true;
      this.render();
      return;
    }

    try {
      await onAuthChange((user) => {
        this.auth.user = user;
        this.auth.ready = true;
        this.save.setUser(user?.uid ?? null);
        this.render();
      });
    } catch (error) {
      console.warn('[app] Firebase indisponível, seguindo offline:', error);
      this.auth.ready = true;
      this.render();
    }
  }

  // ------------------------------------------------------------------ eventos
  bindEvents() {
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
      'go-auth': () => this.game.setScreen(SCREENS.AUTH),
      'toggle-fast': () => {
        this.game.toggleFastMode();
        toast(this.game.state.settings.fastMode ? 'Modo rápido ligado.' : 'Modo rápido desligado.', 'info');
      },
      'app-sign-out': () => this.handleSignOut(),
      'new-game': async () => {
        const ok = await confirmDialog({
          title: 'Nova carreira',
          text: 'O save atual será apagado. Tem certeza?',
          confirmLabel: 'Apagar e começar',
          danger: true,
        });
        if (!ok) return;
        await this.save.deleteAll();
        this.game.reset();
        this.game.startCreation();
      },
    };

    const screen = SCREEN_MAP[this.game.state.screen];
    const handler = screen?.actions?.[action] ?? globalActions[action];
    if (!handler) return;
    Promise.resolve(handler(this.ctx, dataset, event)).catch((error) => {
      console.error('[app] erro na ação', action, error);
      toast('Algo deu errado nessa ação.', 'warn');
    });
  }

  // --------------------------------------------------------------- navegação
  async handleSignedIn(user) {
    this.auth.user = user;
    this.save.setUser(user.uid);
    toast('Login feito. Sincronizando carreira...', 'good');
    await this.resumeOrCreate();
  }

  async handleSignOut() {
    await signOutUser();
    this.auth.user = null;
    this.save.setUser(null);
    this.game.setScreen(SCREENS.AUTH);
  }

  startOffline() {
    this.auth.offline = true;
    const saved = loadLocal();
    if (saved && this.game.load(saved) && this.game.state.player) {
      this.restoreScreen();
      toast('Carreira carregada do navegador.', 'good');
    } else {
      this.game.startCreation();
    }
  }

  continueLocal() {
    const saved = loadLocal();
    if (saved && this.game.load(saved) && this.game.state.player) {
      this.restoreScreen();
      toast('Carreira carregada.', 'good');
    } else {
      toast('Não encontrei um save válido. Começando uma nova carreira.', 'warn');
      this.game.startCreation();
    }
  }

  async resumeOrCreate() {
    const saved = await this.save.loadBest();
    if (saved && this.game.load(saved) && this.game.state.player) {
      this.restoreScreen();
    } else {
      this.game.startCreation();
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
      <header class="topbar">
        <button class="topbar__brand" data-action="${showGameControls ? 'noop' : 'go-auth'}">
          <span class="topbar__logo">⚽</span>
          <span class="topbar__title">Craque do Zero</span>
        </button>
        <div class="topbar__right">
          <span class="topbar__save" id="save-status">${esc(SAVE_LABELS[this.save.status] ?? '')}</span>
          ${
            showGameControls
              ? `<button class="btn btn--mini" data-action="save-now" title="Salvar agora">💾</button>
                 <button class="btn btn--mini ${state.settings.fastMode ? 'is-active' : ''}" data-action="toggle-fast" title="Modo rápido: menos eventos de vida">⏩</button>
                 <button class="btn btn--mini" data-action="new-game" title="Nova carreira">🔄</button>`
              : ''
          }
          ${user ? `<button class="btn btn--mini" data-action="app-sign-out" title="Sair da conta">🚪</button>` : ''}
        </div>
      </header>`;
  }

  render() {
    if (this.rendering) return;
    this.rendering = true;
    const screen = SCREEN_MAP[this.game.state.screen] ?? authScreen;
    const scroll = window.scrollY;
    const markup = `${this.topBar()}<main class="app__main">${screen.render(this.game.state, this.ctx)}</main>`;
    mount(this.root, markup);
    window.scrollTo({ top: scroll });
    this.rendering = false;
  }

  renderStatus() {
    const node = document.getElementById('save-status');
    if (node) node.textContent = SAVE_LABELS[this.save.status] ?? '';
  }
}
