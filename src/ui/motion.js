// Memória de movimento. A interface é remontada inteira a cada ação, então
// sem isto toda animação de entrada tocaria de novo a cada clique. Aqui cada
// animação toca uma vez, só quando o dado que ela representa muda de verdade.
//
// Marcações usadas nas telas:
//   class="is-new"                    entra colando (uma vez por tela)
//   data-pulse="chave" data-value="x" anima quando o valor muda; recebe
//                                     .is-changed e data-dir="up|down"
//   data-moment="chave"               toca uma vez por chave (ex.: o gol)

// Uma ação pode remontar a tela duas vezes seguidas (o motor avisa, a tela
// redesenha). O que mudou nessa janela continua animando na remontagem.
const SAME_BEAT_MS = 120;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export class Motion {
  constructor() {
    this.values = new Map();
    this.changed = new Map();
    this.seenNew = new Map();
    this.seenMoments = new Set();
    this.screen = null;
    this.pendingTransition = null;
  }

  /** Pede que a próxima montagem vire a página (troca de aba, nova semana). */
  requestTransition(kind) {
    this.pendingTransition = kind;
  }

  /** Chamado depois de cada montagem, antes do navegador pintar. */
  settle(root, screen) {
    const now = performance.now();
    const screenChanged = screen !== this.screen;
    if (screenChanged) {
      this.screen = screen;
      this.seenNew.clear();
    }

    // Figurinhas novas: na primeira vez que aparecem nesta tela, colam.
    // Nas remontagens seguintes, já estão coladas e ficam quietas.
    for (const node of root.querySelectorAll('.is-new')) {
      const key = node.dataset.newKey ?? node.getAttribute('aria-label') ?? node.textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
      const firstSeen = this.seenNew.get(key);
      if (firstSeen === undefined) this.seenNew.set(key, now);
      else if (now - firstSeen > SAME_BEAT_MS) node.classList.remove('is-new');
    }

    // Valores que mudaram desde a última montagem.
    for (const node of root.querySelectorAll('[data-pulse]')) {
      const key = node.dataset.pulse;
      const value = node.dataset.value ?? node.textContent.trim();
      let before = this.values.get(key);
      this.values.set(key, value);
      const recent = this.changed.get(key);
      if (before === value && recent && now - recent.at <= SAME_BEAT_MS) before = recent.from;
      if (before === undefined || before === value) continue;
      if (!recent || recent.to !== value || now - recent.at > SAME_BEAT_MS) this.changed.set(key, { from: before, to: value, at: now });
      const a = Number(before);
      const b = Number(value);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        node.dataset.dir = b > a ? 'up' : 'down';
        node.style.setProperty('--from', String(a));
        if ('count' in node.dataset) this.countUp(node, a, b);
      }
      node.classList.add('is-changed');
    }

    // Momentos únicos (o gol, o apito final): tocam uma vez por chave.
    for (const node of root.querySelectorAll('[data-moment]')) {
      const key = node.dataset.moment;
      if (this.seenMoments.has(key)) node.classList.add('is-settled');
      else this.seenMoments.add(key);
    }
  }

  /** O número sobe contando, como o placar eletrônico (600ms). */
  countUp(node, from, to) {
    if (reducedMotion()) return;
    const start = performance.now();
    const duration = 600;
    node.textContent = String(from);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      node.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1 && node.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /**
   * Troca de tela com continuidade: o placar, a figurinha e a barra ficam,
   * o resto vira a página. Sem suporte ou com movimento reduzido, troca seca.
   */
  swap(update, { screenChanged }) {
    const kind = screenChanged ? 'screen' : this.pendingTransition;
    this.pendingTransition = null;
    if (!kind || reducedMotion() || typeof document.startViewTransition !== 'function') {
      update();
      return;
    }
    const root = document.documentElement;
    root.dataset.vt = kind;
    const transition = document.startViewTransition(update);
    transition.finished.finally(() => {
      if (root.dataset.vt === kind) delete root.dataset.vt;
    });
  }
}
