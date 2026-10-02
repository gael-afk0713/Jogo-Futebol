// Utilidades genéricas usadas por todo o jogo.

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const round = (value, decimals = 0) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const sum = (list, pick = (x) => x) => list.reduce((acc, item) => acc + pick(item), 0);

export const average = (list, pick = (x) => x) => (list.length ? sum(list, pick) / list.length : 0);

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Formata dinheiro em euros com sufixos curtos (ex: 1,2 mi). */
export function money(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `€ ${round(value / 1_000_000_000, 2)} bi`;
  if (abs >= 1_000_000) return `€ ${round(value / 1_000_000, 2)} mi`;
  if (abs >= 1_000) return `€ ${round(value / 1_000, 1)} mil`;
  return `€ ${Math.round(value)}`;
}

/** Transforma 0..1 em porcentagem inteira. */
export const pct = (value) => `${Math.round(value * 100)}%`;

/**
 * Converte um valor bruto numa escala 0..1 suave, útil para probabilidades.
 * center = valor onde o resultado é 0.5, spread = quão rápido cresce.
 */
export const logistic = (value, center, spread) => 1 / (1 + Math.exp(-(value - center) / spread));

const SEASON_MONTHS = [
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
];

/** Nome do mês aproximado a partir do número da rodada do calendário. */
export function monthForWeek(week, totalWeeks) {
  const index = clamp(Math.floor((week / Math.max(1, totalWeeks)) * SEASON_MONTHS.length), 0, SEASON_MONTHS.length - 1);
  return SEASON_MONTHS[index];
}
