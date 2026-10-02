// Definição única de todos os atributos do jogador.
// Qualquer parte do jogo que precise iterar atributos usa este arquivo.

export const ATTRIBUTE_GROUPS = [
  {
    id: 'ritmo',
    label: 'Ritmo',
    icon: '⚡',
    attributes: [
      { id: 'acceleration', label: 'Aceleração' },
      { id: 'sprintSpeed', label: 'Velocidade' },
    ],
  },
  {
    id: 'finalizacao',
    label: 'Finalização',
    icon: '🎯',
    attributes: [
      { id: 'finishing', label: 'Finalização' },
      { id: 'shotPower', label: 'Força do chute' },
      { id: 'longShots', label: 'Chute de longe' },
      { id: 'volleys', label: 'Voleio' },
      { id: 'heading', label: 'Cabeceio' },
      { id: 'penalties', label: 'Pênaltis' },
    ],
  },
  {
    id: 'passe',
    label: 'Passe',
    icon: '🧠',
    attributes: [
      { id: 'vision', label: 'Visão de jogo' },
      { id: 'shortPass', label: 'Passe curto' },
      { id: 'longPass', label: 'Passe longo' },
      { id: 'crossing', label: 'Cruzamento' },
      { id: 'curve', label: 'Curva' },
      { id: 'freeKick', label: 'Bola parada' },
    ],
  },
  {
    id: 'drible',
    label: 'Drible',
    icon: '🕺',
    attributes: [
      { id: 'ballControl', label: 'Controle de bola' },
      { id: 'dribbling', label: 'Drible' },
      { id: 'agility', label: 'Agilidade' },
      { id: 'balance', label: 'Equilíbrio' },
      { id: 'reactions', label: 'Reação' },
      { id: 'composure', label: 'Frieza' },
    ],
  },
  {
    id: 'defesa',
    label: 'Defesa',
    icon: '🛡️',
    attributes: [
      { id: 'defAwareness', label: 'Senso defensivo' },
      { id: 'interceptions', label: 'Interceptação' },
      { id: 'standingTackle', label: 'Desarme em pé' },
      { id: 'slidingTackle', label: 'Desarme deslizante' },
      { id: 'aggression', label: 'Agressividade' },
    ],
  },
  {
    id: 'fisico',
    label: 'Físico',
    icon: '💪',
    attributes: [
      { id: 'strength', label: 'Força' },
      { id: 'stamina', label: 'Resistência' },
      { id: 'jumping', label: 'Impulsão' },
      { id: 'workRate', label: 'Entrega' },
    ],
  },
  {
    id: 'goleiro',
    label: 'Goleiro',
    icon: '🧤',
    goalkeeperOnly: true,
    attributes: [
      { id: 'gkDiving', label: 'Elasticidade' },
      { id: 'gkHandling', label: 'Manejo de bola' },
      { id: 'gkKicking', label: 'Reposição' },
      { id: 'gkPositioning', label: 'Posicionamento' },
      { id: 'gkReflexes', label: 'Reflexos' },
    ],
  },
];

/** Lista achatada de todos os atributos: [{ id, label, group }] */
export const ALL_ATTRIBUTES = ATTRIBUTE_GROUPS.flatMap((group) =>
  group.attributes.map((attribute) => ({
    ...attribute,
    group: group.id,
    goalkeeperOnly: Boolean(group.goalkeeperOnly),
  })),
);

export const ATTRIBUTE_IDS = ALL_ATTRIBUTES.map((attribute) => attribute.id);

const LABEL_BY_ID = new Map(ALL_ATTRIBUTES.map((attribute) => [attribute.id, attribute.label]));

export const attributeLabel = (id) => LABEL_BY_ID.get(id) ?? id;

/** Cria um objeto de atributos com o mesmo valor em tudo. */
export function blankAttributes(value = 40) {
  return Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, value]));
}

/** Faixa de cor usada na interface para um valor de atributo. */
export function attributeTier(value) {
  if (value >= 85) return 'elite';
  if (value >= 75) return 'otimo';
  if (value >= 65) return 'bom';
  if (value >= 50) return 'medio';
  return 'fraco';
}
