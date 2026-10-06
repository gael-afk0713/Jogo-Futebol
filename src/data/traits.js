// Traços de personalidade e de jogo.
// Você escolhe 2 na criação e pode destravar outros ao longo da carreira.
//
// effects.attr   -> bônus direto em atributos
// effects.match  -> modificadores multiplicativos usados pelo motor de partida
// effects.life   -> modificadores de vida (fama, dinheiro, lesão, moral)

export const TRAITS = [
  {
    id: 'canhota_magica',
    name: 'Canhota mágica',
    category: 'jogo',
    icon: 'magic-wand',
    description: 'Bola parada e chutes colocados saem com veneno.',
    effects: { attr: { freeKick: 6, curve: 5, longShots: 3 }, match: { setPiece: 0.18 } },
  },
  {
    id: 'driblador',
    name: 'Driblador nato',
    category: 'jogo',
    icon: 'sneaker-move',
    description: 'No um contra um, você quase nunca perde.',
    effects: { attr: { dribbling: 5, agility: 4 }, match: { dribble: 0.16 } },
  },
  {
    id: 'matador',
    name: 'Matador de área',
    category: 'jogo',
    icon: 'crosshair',
    description: 'Dentro da área, você não perdoa.',
    effects: { attr: { finishing: 5, reactions: 3 }, match: { shoot: 0.15 } },
  },
  {
    id: 'maestro',
    name: 'Maestro',
    category: 'jogo',
    icon: 'music-notes',
    description: 'Você vê o passe antes de todo mundo.',
    effects: { attr: { vision: 6, shortPass: 4 }, match: { pass: 0.16 } },
  },
  {
    id: 'muralha',
    name: 'Muralha',
    category: 'jogo',
    icon: 'wall',
    description: 'Passar por você custa caro.',
    effects: { attr: { standingTackle: 5, defAwareness: 4, strength: 3 }, match: { tackle: 0.16, save: 0.12 } },
  },
  {
    id: 'aereo',
    name: 'Dono do alto',
    category: 'jogo',
    icon: 'bird',
    description: 'Toda bola alta parece sua.',
    effects: { attr: { heading: 6, jumping: 5 }, match: { aerial: 0.2 } },
  },
  {
    id: 'motor',
    name: 'Motor incansável',
    category: 'jogo',
    icon: 'heartbeat',
    description: 'Você corre os 90 minutos no mesmo ritmo.',
    effects: { attr: { stamina: 7, workRate: 5 }, match: { staminaDrain: -0.25 } },
  },
  {
    id: 'sangue_frio',
    name: 'Sangue frio',
    category: 'jogo',
    icon: 'snowflake',
    description: 'Decisão nos minutos finais? Pode deixar com você.',
    effects: { attr: { composure: 6, penalties: 5 }, match: { clutch: 0.22 } },
  },
  {
    id: 'lider',
    name: 'Líder de vestiário',
    category: 'vida',
    icon: 'megaphone',
    description: 'Companheiros e comissão técnica confiam em você.',
    effects: { life: { moraleGain: 0.25, managerGain: 0.3 } },
  },
  {
    id: 'midiatico',
    name: 'Midiático',
    category: 'vida',
    icon: 'camera',
    description: 'A imprensa te ama (e te cobra). Fama cresce mais rápido.',
    effects: { life: { fameGain: 0.4, pressureGain: 0.2 } },
  },
  {
    id: 'profissional',
    name: 'Profissional exemplar',
    category: 'vida',
    icon: 'bowl-food',
    description: 'Sono, dieta e fisioterapia em dia. Menos lesões.',
    effects: { life: { injuryRisk: -0.3, fitnessGain: 0.25 } },
  },
  {
    id: 'empresario',
    name: 'Cabeça de empresário',
    category: 'vida',
    icon: 'briefcase',
    description: 'Você negocia melhor e investe melhor.',
    effects: { life: { contractBonus: 0.12, investReturn: 0.25 } },
  },
  {
    id: 'estudioso',
    name: 'Estudioso do jogo',
    category: 'vida',
    icon: 'books',
    description: 'Aprende mais rápido em cada treino.',
    effects: { life: { trainingGain: 0.3 } },
  },
  {
    id: 'pavio_curto',
    name: 'Pavio curto',
    category: 'vida',
    icon: 'fire',
    description: 'Joga com raça... e com cartões. Mais força, mais risco.',
    effects: { attr: { aggression: 10, strength: 3 }, match: { tackle: 0.1, cardRisk: 0.5 } },
  },
];

const BY_ID = new Map(TRAITS.map((trait) => [trait.id, trait]));

export const getTrait = (id) => BY_ID.get(id);

/** Soma um modificador de partida vindo de todos os traços do jogador. */
export function matchModifier(traitIds = [], key) {
  return traitIds.reduce((total, id) => total + (getTrait(id)?.effects?.match?.[key] ?? 0), 0);
}

/** Soma um modificador de vida vindo de todos os traços do jogador. */
export function lifeModifier(traitIds = [], key) {
  return traitIds.reduce((total, id) => total + (getTrait(id)?.effects?.life?.[key] ?? 0), 0);
}

/** Bônus de atributo total concedido pelos traços. */
export function traitAttributeBonus(traitIds = []) {
  const bonus = {};
  for (const id of traitIds) {
    const attrs = getTrait(id)?.effects?.attr ?? {};
    for (const [key, value] of Object.entries(attrs)) {
      bonus[key] = (bonus[key] ?? 0) + value;
    }
  }
  return bonus;
}
