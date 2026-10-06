// Camada de save com várias carreiras.
//
// Cada carreira tem um id e fica:
//   - no navegador, sempre (cópia rápida e funciona sem internet);
//   - na nuvem, em users/{uid}/careers/{id}, quando a pessoa está logada.
// Ao abrir uma carreira, vale a cópia mais recente das duas.

import {
  deleteCareerFromCloud,
  firebaseAvailable,
  listCloudCareers,
  loadCareerFromCloud,
  saveCareerToCloud,
  takeLegacyCloudSave,
} from '../firebase/firebase.js';
import { getClub } from '../data/clubs.js';

export const MAX_CAREERS = 6;

const INDEX_KEY = 'craque:carreiras:v4';
const slotKey = (id) => `craque:carreira:v4:${id}`;
const LEGACY_KEY = 'carreira-futebol:save:v3';
const LEGACY_META_KEY = 'carreira-futebol:meta:v3';

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? safeParse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('[save] localStorage indisponível:', error);
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignora */
  }
}

export function newCareerId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 20);
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Ficha da carreira: o suficiente para desenhar a figurinha na lista. */
export function careerMeta(state) {
  const player = state?.player;
  if (!player) return null;
  return {
    updatedAt: state.updatedAt ?? Date.now(),
    retired: Boolean(player.retired),
    year: state.season?.year ?? null,
    clubName: getClub(player.club)?.name ?? null,
    card: {
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname,
      position: player.position,
      nationality: player.nationality,
      club: player.club ?? null,
      overall: player.overall,
      age: player.age,
      appearance: player.appearance,
    },
  };
}

/* ------------------------------------------------------------ navegador */

function readIndex() {
  const index = read(INDEX_KEY);
  return index && typeof index === 'object' && index.slots ? index : { slots: {}, last: {} };
}

const ownerKey = (uid) => uid ?? 'offline';

/** Traz o save do formato antigo (uma carreira só) para a lista nova. */
function migrateLegacyLocal() {
  const legacy = read(LEGACY_KEY);
  if (!legacy) return;
  const meta = careerMeta(legacy);
  if (meta) {
    const id = newCareerId();
    const index = readIndex();
    write(slotKey(id), legacy);
    index.slots[id] = { ...meta, owner: null };
    index.last.offline = id;
    write(INDEX_KEY, index);
  }
  remove(LEGACY_KEY);
  remove(LEGACY_META_KEY);
}

export function saveLocalCareer(id, state, owner = null) {
  const meta = careerMeta(state);
  if (!meta) return false;
  if (!write(slotKey(id), state)) return false;
  const index = readIndex();
  index.slots[id] = { ...meta, owner };
  index.last[ownerKey(owner)] = id;
  return write(INDEX_KEY, index);
}

export function loadLocalCareer(id) {
  return read(slotKey(id));
}

export function deleteLocalCareer(id) {
  remove(slotKey(id));
  const index = readIndex();
  delete index.slots[id];
  for (const key of Object.keys(index.last)) if (index.last[key] === id) delete index.last[key];
  write(INDEX_KEY, index);
}

/** Carreiras deste navegador que pertencem a esta pessoa (ou ao modo offline). */
export function listLocalCareers(owner = null) {
  migrateLegacyLocal();
  const index = readIndex();
  return Object.entries(index.slots)
    .filter(([, meta]) => (meta.owner ?? null) === (owner ?? null))
    .map(([id, meta]) => ({ ...meta, id }));
}

export function lastCareerId(owner = null) {
  return readIndex().last[ownerKey(owner)] ?? null;
}

function setOwner(id, owner) {
  const index = readIndex();
  if (!index.slots[id]) return;
  index.slots[id].owner = owner;
  write(INDEX_KEY, index);
}

/* --------------------------------------------------------------- gerente */

/**
 * Gerencia a carreira ativa: save local na hora, nuvem com folga para não
 * escrever a cada clique.
 */
export class SaveManager {
  constructor(game) {
    this.game = game;
    this.uid = null;
    this.activeId = null;
    this.timer = null;
    this.localTimer = null;
    this.status = 'idle';
    this.lastError = null;
    this.onStatus = () => {};
  }

  get cloud() {
    return Boolean(this.uid) && firebaseAvailable();
  }

  setUser(uid) {
    if (uid !== this.uid) this.activeId = null;
    this.uid = uid;
  }

  setStatus(status, error = null) {
    this.status = status;
    this.lastError = error;
    this.onStatus(status, error);
  }

  /** Começa uma carreira nova; ela só ocupa espaço quando o jogador existir. */
  startNew() {
    this.activeId = newCareerId();
    return this.activeId;
  }

  /** Agenda o save local (rápido) e o envio para a nuvem (com folga). */
  schedule(delay = 2200) {
    if (!this.activeId) this.activeId = newCareerId();
    clearTimeout(this.localTimer);
    this.localTimer = setTimeout(() => {
      saveLocalCareer(this.activeId, this.game.serialize(), this.uid);
      if (this.status !== 'saving') this.setStatus('local');
    }, 400);

    if (!this.cloud) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delay);
  }

  /** Salva imediatamente nos dois destinos. */
  async saveNow() {
    if (!this.game.state.player) return false;
    if (!this.activeId) this.activeId = newCareerId();
    clearTimeout(this.localTimer);
    clearTimeout(this.timer);
    saveLocalCareer(this.activeId, this.game.serialize(), this.uid);
    this.setStatus('local');
    if (this.cloud) return this.flush();
    return true;
  }

  async flush() {
    if (!this.cloud || !this.activeId || !this.game.state.player) return false;
    const state = this.game.serialize();
    try {
      this.setStatus('saving');
      await saveCareerToCloud(this.uid, this.activeId, state, careerMeta(state));
      this.setStatus('cloud');
      return true;
    } catch (error) {
      console.warn('[save] falha ao salvar na nuvem:', error);
      this.setStatus('error', error);
      return false;
    }
  }

  /**
   * Lista as carreiras: junta navegador e nuvem pelo id e marca onde cada
   * uma está. Mais recente primeiro.
   */
  async list() {
    const merged = new Map();
    for (const meta of listLocalCareers(this.uid)) merged.set(meta.id, { ...meta, local: true, remote: false });

    let cloudError = null;
    if (this.cloud) {
      try {
        for (const meta of await listCloudCareers(this.uid)) {
          const current = merged.get(meta.id);
          if (!current) merged.set(meta.id, { ...meta, local: false, remote: true });
          else if ((meta.updatedAt ?? 0) > (current.updatedAt ?? 0)) merged.set(meta.id, { ...meta, local: true, remote: true });
          else current.remote = true;
        }
      } catch (error) {
        console.warn('[save] falha ao listar a nuvem:', error);
        cloudError = error;
      }
    }

    const careers = [...merged.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return { careers, lastId: lastCareerId(this.uid), cloudError };
  }

  /** Abre uma carreira: usa a cópia mais recente entre nuvem e navegador. */
  async open(id) {
    let state = loadLocalCareer(id);
    if (this.cloud) {
      try {
        const remote = await loadCareerFromCloud(this.uid, id);
        if (remote && (!state || (remote.updatedAt ?? 0) > (state.updatedAt ?? 0))) state = remote;
      } catch (error) {
        console.warn('[save] falha ao ler a nuvem, usando o navegador:', error);
      }
    }
    if (!state) return null;
    this.activeId = id;
    saveLocalCareer(id, state, this.uid);
    return state;
  }

  async remove(id) {
    deleteLocalCareer(id);
    if (this.activeId === id) this.activeId = null;
    if (this.cloud) await deleteCareerFromCloud(this.uid, id);
  }

  /**
   * Depois do login: as carreiras feitas sem conta neste navegador passam
   * para a conta (e sobem para a nuvem), e o save do formato antigo na nuvem
   * vira uma carreira da lista.
   */
  async adoptAfterSignIn() {
    if (!this.cloud) return 0;
    let moved = 0;

    for (const meta of listLocalCareers(null)) {
      const state = loadLocalCareer(meta.id);
      if (!state) continue;
      try {
        await saveCareerToCloud(this.uid, meta.id, state, careerMeta(state));
        setOwner(meta.id, this.uid);
        moved += 1;
      } catch (error) {
        console.warn('[save] não consegui enviar uma carreira para a nuvem:', error);
        break;
      }
    }

    try {
      const legacy = await takeLegacyCloudSave(this.uid);
      if (legacy?.state && careerMeta(legacy.state)) {
        const id = newCareerId();
        await saveCareerToCloud(this.uid, id, legacy.state, careerMeta(legacy.state));
        saveLocalCareer(id, legacy.state, this.uid);
        await legacy.discard();
        moved += 1;
      }
    } catch (error) {
      console.warn('[save] migração do save antigo falhou:', error);
    }
    return moved;
  }
}
