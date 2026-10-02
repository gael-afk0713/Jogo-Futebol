// Gerador de números pseudoaleatórios com semente (mulberry32).
// Usar semente deixa a carreira reproduzível e o save consistente.

export function createRng(seed = Date.now()) {
  let state = seed >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    get seed() {
      return state;
    },
    set seed(value) {
      state = value >>> 0;
    },
    next,
    /** Float em [min, max). */
    float(min, max) {
      return min + next() * (max - min);
    },
    /** Inteiro em [min, max] inclusivo. */
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    /** true com probabilidade p (0..1). */
    chance(p) {
      return next() < p;
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    /** Escolhe um item usando pesos; aceita função de peso. */
    weighted(list, weightOf = (item) => item.weight ?? 1) {
      const total = list.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
      if (total <= 0) return list[0];
      let roll = next() * total;
      for (const item of list) {
        roll -= Math.max(0, weightOf(item));
        if (roll <= 0) return item;
      }
      return list[list.length - 1];
    },
    shuffle(list) {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    /** Distribuição aproximadamente normal (soma de 3 uniformes). */
    normal(mean, deviation) {
      const sum = next() + next() + next();
      return mean + ((sum - 1.5) / 1.5) * deviation;
    },
  };
}

/** RNG global para coisas que não precisam ser reproduzíveis (ex: ids). */
export const rng = createRng();
