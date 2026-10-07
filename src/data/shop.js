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
//   weeklyHappiness-> felicidade por semana
//   insight        -> mostra a prévia exata de cada treino (passando o mouse ou no olho)
//
// positions: só aparece para essas posições (sem a lista, serve para todos).
// group: rótulo curto mostrado na loja para itens de posição.

const GK = ['GOL'];
const DEF = ['ZAG', 'LAT', 'VOL'];
const MID = ['VOL', 'MC', 'MEI'];
const ATT = ['MEI', 'PON', 'SA', 'ATA'];
const WIDE = ['LAT', 'PON', 'SA', 'ATA'];
const OUTFIELD = ['ZAG', 'LAT', 'VOL', 'MC', 'MEI', 'PON', 'SA', 'ATA'];

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
    positions: OUTFIELD,
  },
  {
    id: 'luvas',
    kind: 'equip',
    label: 'Luvas profissionais',
    icon: 'hand-grabbing',
    price: 6_000,
    description: 'Encaixe firme em qualquer clima.',
    effects: { attributes: { gkHandling: 2, gkDiving: 1 } },
    positions: GK,
    group: 'Goleiro',
  },
  {
    id: 'maquina_bolas',
    kind: 'equip',
    label: 'Máquina lançadora de bolas',
    icon: 'target',
    price: 120_000,
    description: 'Chutes em qualquer ângulo e velocidade. Libera o treino "Reflexo na máquina".',
    effects: { unlocks: ['reflexo'], xp: { goleiro: 1.15 } },
    positions: GK,
    group: 'Goleiro',
  },
  {
    id: 'caneleira',
    kind: 'equip',
    label: 'Caneleiras de carbono',
    icon: 'shield',
    price: 15_000,
    description: 'Leves e duras. Você entra na dividida sem medo.',
    effects: { attributes: { standingTackle: 1, slidingTackle: 1 }, injuryRisk: 0.9 },
    positions: DEF,
    group: 'Defesa',
  },
  {
    id: 'rebatedor',
    kind: 'equip',
    label: 'Rebatedor de passes',
    icon: 'arrow-counter-clockwise',
    price: 90_000,
    description: 'Uma parede que devolve a bola em ângulos diferentes. Libera o treino "Paredão de passe".',
    effects: { unlocks: ['paredao'] },
    positions: MID,
    group: 'Meio-campo',
  },
  {
    id: 'robo_finalizacao',
    kind: 'equip',
    label: 'Gol com alvos e goleiro-robô',
    icon: 'crosshair',
    price: 180_000,
    description: 'Alvos nos cantos e um goleiro que se mexe. Finalização rende mais.',
    effects: { xp: { finalizacao: 1.25, artilheiro: 1.15 }, skillPoints: { finalizacao: 1 } },
    positions: ATT,
    group: 'Ataque',
  },
  {
    id: 'tablet',
    kind: 'equip',
    label: 'Tablet de análise de treino',
    icon: 'chart-bar',
    price: 8_000,
    description: 'Mostra exatamente o que cada treino vai te dar antes de você escolher.',
    effects: { insight: true },
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
    id: 'psicologo',
    kind: 'staff',
    label: 'Psicólogo do esporte',
    icon: 'brain',
    weekly: 1_800,
    description: 'Cabeça fria nos momentos grandes e menos pressão fora de campo.',
    effects: { attributes: { composure: 2 }, weeklyHappiness: 1 },
  },
  {
    id: 'treinador_goleiros',
    kind: 'staff',
    label: 'Treinador de goleiros particular',
    icon: 'hand-grabbing',
    weekly: 3_500,
    description: 'Trabalho específico de posicionamento e saída do gol.',
    effects: { xp: { goleiro: 1.3, reflexo: 1.2 }, skillPoints: { goleiro: 1 }, attributes: { gkPositioning: 1 } },
    positions: GK,
    group: 'Goleiro',
  },
  {
    id: 'treinador_defesa',
    kind: 'staff',
    label: 'Treinador de defesa',
    icon: 'shield',
    weekly: 3_500,
    description: 'Ex-zagueiro que ensina tempo de bote e leitura. Libera o treino "Marcação individual".',
    effects: { unlocks: ['marcacao'], attributes: { defAwareness: 1 } },
    positions: DEF,
    group: 'Defesa',
  },
  {
    id: 'coach_visao',
    kind: 'staff',
    label: 'Coach de visão de jogo',
    icon: 'eye',
    weekly: 4_000,
    description: 'Exercícios de percepção para enxergar o passe antes de receber a bola.',
    effects: { attributes: { vision: 2, shortPass: 1 }, xp: { tatico: 1.2, paredao: 1.2 } },
    positions: MID,
    group: 'Meio-campo',
  },
  {
    id: 'treinador_velocidade',
    kind: 'staff',
    label: 'Treinador de velocidade',
    icon: 'lightning',
    weekly: 3_000,
    description: 'Técnica de corrida e arranque para ganhar no espaço.',
    effects: { attributes: { acceleration: 1, sprintSpeed: 1 }, xp: { fisico: 1.15 } },
    positions: WIDE,
    group: 'Velocidade',
  },
  {
    id: 'treinador_finalizacao',
    kind: 'staff',
    label: 'Treinador de finalização',
    icon: 'soccer-ball',
    weekly: 4_500,
    description: 'Ex-artilheiro que corrige o corpo na hora do chute. Libera o treino "Treino de artilheiro".',
    effects: { unlocks: ['artilheiro'], attributes: { finishing: 1 } },
    positions: ATT,
    group: 'Ataque',
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
