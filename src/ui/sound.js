// Sons do jogo: efeitos curtos nos toques e nos momentos importantes, e o
// clima de estádio baixinho durante a partida. Os arquivos ficam em
// assets/sounds (licença CC0, veja assets/sounds/CREDITOS.md).
//
// O navegador (sobretudo no iPad) só libera áudio depois de um toque: o
// primeiro toque em qualquer lugar cria o contexto de áudio e carrega os sons.
// No iPad, a chave de silencioso também cala o jogo.

const SOUNDS = ['toque', 'confirmar', 'voltar', 'erro', 'compra', 'certo', 'errado', 'conquista', 'aviso', 'apito', 'gol', 'chute', 'figurinha'];

// Volume de cada som (0 a 1): o toque, que se repete o tempo todo, é o mais baixo.
// A torcida do gol dura mais que os outros sons, então fica abaixo deles para não estourar.
const VOLUME = {
  toque: 0.45,
  confirmar: 0.7,
  voltar: 0.5,
  erro: 0.6,
  compra: 0.8,
  certo: 0.7,
  errado: 0.6,
  conquista: 0.8,
  aviso: 0.7,
  apito: 0.6,
  gol: 0.55,
  chute: 0.8,
  figurinha: 0.8,
};
const AMBIENT_VOLUME = 0.16;
const STORAGE_KEY = 'craque.som';

function readSetting() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'desligado';
  } catch {
    return true;
  }
}

function writeSetting(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'ligado' : 'desligado');
  } catch {
    // Sem armazenamento, a escolha vale só até fechar o jogo.
  }
}

export class Sound {
  constructor() {
    this.enabled = readSetting();
    this.ctx = null;
    this.master = null;
    this.buffers = new Map();
    this.loading = new Map();
    this.ambientSource = null;
    this.ambientGain = null;
    this.wantAmbient = false;
  }

  /** Chamado no primeiro toque (e nos seguintes): libera o áudio no iPad. */
  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      for (const name of SOUNDS) this.load(name);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this.wantAmbient && !this.ambientSource) this.startAmbient();
  }

  load(name) {
    if (this.buffers.has(name)) return Promise.resolve(this.buffers.get(name));
    if (!this.loading.has(name)) {
      const promise = fetch(`assets/sounds/${name}.wav`)
        .then((response) => response.arrayBuffer())
        .then((data) => new Promise((resolve, reject) => this.ctx.decodeAudioData(data, resolve, reject)))
        .then((buffer) => {
          this.buffers.set(name, buffer);
          return buffer;
        })
        .catch(() => null);
      this.loading.set(name, promise);
    }
    return this.loading.get(name);
  }

  /** Toca um som. delay em milissegundos (para encadear chute e resultado). */
  play(name, { delay = 0 } = {}) {
    if (!this.enabled || !this.ctx || !name) return;
    const start = (buffer) => {
      if (!buffer || !this.enabled) return;
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = VOLUME[name] ?? 0.7;
      source.buffer = buffer;
      source.connect(gain).connect(this.master);
      source.start(this.ctx.currentTime + delay / 1000);
    };
    const ready = this.buffers.get(name);
    if (ready) start(ready);
    else this.load(name).then(start);
  }

  /** Clima de estádio: liga ao entrar na partida, desliga ao sair. */
  ambient(on) {
    this.wantAmbient = on;
    if (on) this.startAmbient();
    else this.stopAmbient();
  }

  async startAmbient() {
    if (!this.enabled || !this.ctx || this.ambientSource) return;
    const buffer = await this.load('ambiente');
    if (!buffer || !this.wantAmbient || this.ambientSource || !this.enabled) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    // Entra devagar, para não assustar.
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(AMBIENT_VOLUME, this.ctx.currentTime + 1.5);
    source.connect(gain).connect(this.master);
    source.start();
    this.ambientSource = source;
    this.ambientGain = gain;
  }

  stopAmbient() {
    if (!this.ambientSource || !this.ctx) return;
    const source = this.ambientSource;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.8);
    source.stop(now + 0.85);
    this.ambientSource = null;
    this.ambientGain = null;
  }

  /** Liga ou desliga todos os sons (a escolha fica guardada no aparelho). */
  toggle() {
    this.enabled = !this.enabled;
    writeSetting(this.enabled);
    if (this.enabled) this.unlock();
    else this.stopAmbient();
    return this.enabled;
  }
}
