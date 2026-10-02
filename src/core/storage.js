// Camada de save: nuvem (Firebase) quando logado, navegador quando offline.

import {
  deleteCloudSave,
  firebaseAvailable,
  loadFromCloud,
  saveToCloud,
} from '../firebase/firebase.js';

const LOCAL_KEY = 'carreira-futebol:save:v3';
const LOCAL_META_KEY = 'carreira-futebol:meta:v3';

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function saveLocal(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    localStorage.setItem(
      LOCAL_META_KEY,
      JSON.stringify({
        updatedAt: Date.now(),
        playerName: state?.player ? `${state.player.firstName} ${state.player.lastName}` : null,
        overall: state?.player?.overall ?? null,
        age: state?.player?.age ?? null,
      }),
    );
    return true;
  } catch (error) {
    console.warn('[save] localStorage indisponível:', error);
    return false;
  }
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? safeParse(raw) : null;
  } catch {
    return null;
  }
}

export function localMeta() {
  try {
    const raw = localStorage.getItem(LOCAL_META_KEY);
    return raw ? safeParse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LOCAL_META_KEY);
  } catch {
    /* ignora */
  }
}

/**
 * Gerencia o save com debounce para não escrever na nuvem a cada clique.
 */
export class SaveManager {
  constructor(game) {
    this.game = game;
    this.uid = null;
    this.timer = null;
    this.localTimer = null;
    this.status = 'idle';
    this.lastError = null;
    this.onStatus = () => {};
  }

  setUser(uid) {
    this.uid = uid;
  }

  setStatus(status, error = null) {
    this.status = status;
    this.lastError = error;
    this.onStatus(status, error);
  }

  /** Agenda o save local (rápido) e o envio para a nuvem (com folga). */
  schedule(delay = 2200) {
    clearTimeout(this.localTimer);
    this.localTimer = setTimeout(() => {
      saveLocal(this.game.serialize());
      if (this.status !== 'saving') this.setStatus('local');
    }, 400);

    if (!this.uid || !firebaseAvailable()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delay);
  }

  /** Salva imediatamente nos dois destinos. */
  async saveNow() {
    clearTimeout(this.localTimer);
    clearTimeout(this.timer);
    saveLocal(this.game.serialize());
    this.setStatus('local');
    if (this.uid && firebaseAvailable()) return this.flush();
    return true;
  }

  async flush() {
    if (!this.uid || !firebaseAvailable()) return false;
    const state = this.game.serialize();
    try {
      this.setStatus('saving');
      await saveToCloud(this.uid, state);
      this.setStatus('cloud');
      return true;
    } catch (error) {
      console.warn('[save] falha ao salvar na nuvem:', error);
      this.setStatus('error', error);
      return false;
    }
  }

  /** Busca o save mais recente entre nuvem e navegador. */
  async loadBest() {
    const local = loadLocal();
    if (!this.uid || !firebaseAvailable()) return local;

    try {
      const cloud = await loadFromCloud(this.uid);
      if (!cloud) return local;
      if (!local) return cloud;
      return (cloud.updatedAt ?? 0) >= (local.updatedAt ?? 0) ? cloud : local;
    } catch (error) {
      console.warn('[save] falha ao ler a nuvem:', error);
      return local;
    }
  }

  async deleteAll() {
    clearLocal();
    if (this.uid && firebaseAvailable()) {
      try {
        await deleteCloudSave(this.uid);
      } catch (error) {
        console.warn('[save] falha ao apagar na nuvem:', error);
      }
    }
  }
}
