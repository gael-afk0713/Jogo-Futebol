// Loja da carreira: equipamento (compra única) e equipe pessoal (custo semanal).
//
// Efeitos reconhecidos pelo motor:
//   attributes     -> bônus fixo em atributos (como os traços, não gasta teto)
//   xp             -> multiplicador de XP por treino { treinoId: 1.2 }
//   injuryRisk     -> multiplicador do risco de lesão nos treinos (0.7 = -30%)
//   trainingFitness-> forma física extra em todo treino que gasta forma
//   weeklyFitness  -> forma física recuperada por semana
//   restBonus      -> forma física extra no descanso
//   skillPoints    -> pontos de evolução extras por treino { treinoId: 1 }
//   unlocks        -> treinos novos liberados (ver engine/training.js)
//   fasterHealing  -> chance por semana de a lesão curar uma semana a mais

export const SHOP_ITEMS = [
  // ---------------------------------------------------------- equipamento
  {
    id: 'chuteira',
    kind: 'equip',
    label: 'Chuteira de alto nível',
    icon: 'sneaker-move',
    price: 6_000,
    description: 'Mais contato com a bola e chute mais limpo.',
    effects: { attributes: { shotPower: 1, ballControl: 1, curve: 1 } },
    outfieldOnly: true,
  },
  {
    id: 'luvas',
    kind: 'equip',
    label: 'Luvas profissionais',
    icon: 'hand-grabbing',
    price: 6_000,
    description: 'Encaixe firme em qualquer clima.',
    effects: { attributes: { gkHandling: 2, gkDiving: 1 } },
    goalkeeperOnly: true,
  },
  {
    id: 'gps',
    kind: 'equip',
    label: 'Colete GPS de treino',
    icon: 'chart-line-up',
    price: 40_000,
    description: 'Mede carga e velocidade. O treino físico rende mais e machuca menos.',
    effects: { xp: { fisico: 1.2, academia: 1.2 }, injuryRisk: 0.75 },
  },
  {
    id: 'academia_casa',
    kind: 'equip',
    label: 'Academia em casa',
    icon: 'barbell',
    price: 300_000,
    description: 'Libera o treino "Academia em casa": força sem perder felicidade.',
    effects: { unlocks: ['academia_casa'] },
  },
  {
    id: 'centro_recuperacao',
    kind: 'equip',
    label: 'Centro de recuperação',
    icon: 'snowflake',
    price: 2_500_000,
    description: 'Crioterapia e piscina em casa. Libera o treino "Crioterapia".',
    effects: { unlocks: ['crioterapia'], restBonus: 4 },
  },

  // ------------------------------------------------------- equipe pessoal
  {
    id: 'nutricionista',
    kind: 'staff',
    label: 'Nutricionista',
    icon: 'bowl-food',
    weekly: 900,
    description: 'Dieta sob medida: recupera forma toda semana e reduz lesões.',
    effects: { weeklyFitness: 2, injuryRisk: 0.8 },
  },
  {
    id: 'preparador',
    kind: 'staff',
    label: 'Preparador físico particular',
    icon: 'person-simple-run',
    weekly: 2_500,
    description: 'Treinos físicos rendem mais e cansam menos.',
    effects: { xp: { fisico: 1.25, academia: 1.25, academia_casa: 1.25 }, trainingFitness: 2 },
  },
  {
    id: 'analista',
    kind: 'staff',
    label: 'Analista de desempenho',
    icon: 'film-strip',
    weekly: 5_000,
    description: 'Libera o treino "Análise de vídeo" e dá pontos extras no treino tático.',
    effects: { unlocks: ['video'], skillPoints: { tatico: 1 } },
  },
  {
    id: 'fisioterapeuta',
    kind: 'staff',
    label: 'Fisioterapeuta particular',
    icon: 'first-aid-kit',
    weekly: 8_000,
    description: 'Lesões curam mais rápido e o descanso recupera mais.',
    effects: { fasterHealing: 0.5, restBonus: 3 },
  },
  {
    id: 'mentor',
    kind: 'staff',
    label: 'Mentor ex-craque',
    icon: 'star',
    weekly: 30_000,
    description: 'Um ídolo aposentado treina com você. Libera o treino "Treino com o mentor".',
    effects: { unlocks: ['mentor'] },
  },
];

const BY_ID = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

export const getShopItem = (id) => BY_ID.get(id) ?? null;
