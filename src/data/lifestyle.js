// Loja da vida: onde o dinheiro da carreira vira conforto, imagem, vantagem
// ou patrimônio. Fica na aba Vida; a loja de evolução (src/data/shop.js)
// continua na aba Atributos.
//
// Tipos (kind):
//   equip      -> compra única. Os efeitos valem enquanto você tiver o item.
//                 resale: fração do preço que volta se vender (0 = não vende).
//                 upkeep: manutenção por semana (entra nos gastos).
//   staff      -> serviço por semana, cancela quando quiser (paga 4 adiantadas).
//   experience -> acontece na hora. cooldown: semanas até poder repetir;
//                 once: só uma vez na carreira. risk: chance de dar ruim.
//   invest     -> vira patrimônio. No fim da temporada rende dinheiro (yield)
//                 e o valor muda (growth). Ano ruim (risk) derruba o valor
//                 (crash) e não paga; bust é a chance de virar pó. Resgatar
//                 devolve o valor atual menos a taxa (fee).
//
// onBuy: mudança na vida no momento da compra (na primeira compra, para
// posses; toda vez, para experiências).
// effects: os mesmos efeitos da loja de evolução (ver src/data/shop.js) e
// mais estes:
//   weekly       -> { felicidade etc. por semana }. Valor quebrado é chance:
//                   0.25 = +1 a cada quatro semanas, em média.
//   expenseCut   -> corta essa fração do custo de vida semanal
//   sponsorBonus -> patrocínios pagam essa fração a mais
//   sponsors     -> traz patrocínios mesmo sem contrato próprio
//   investBonus  -> soma ao rendimento anual de todos os investimentos
//   agingSlow    -> multiplica a queda de atributos depois do auge
//
// Os bônus somados têm teto (ver engine/shop.js) para nada ficar roubado.

export const LIFESTYLE_CATEGORIES = [
  { id: 'lazer', label: 'Lazer', icon: 'game-controller' },
  { id: 'luxo', label: 'Luxo', icon: 'diamond' },
  { id: 'desempenho', label: 'Desempenho', icon: 'lightning' },
  { id: 'casa', label: 'Casa e família', icon: 'house-line' },
  { id: 'social', label: 'Imagem e social', icon: 'hand-heart' },
  { id: 'estudo', label: 'Estudo', icon: 'graduation-cap' },
  { id: 'viagem', label: 'Viagens', icon: 'airplane-tilt' },
  { id: 'financas', label: 'Investimentos', icon: 'chart-line-up' },
  { id: 'colecao', label: 'Coleção', icon: 'trophy' },
];

const own = (cat, id, label, icon, price, description, extra = {}) => ({ id, cat, kind: 'equip', label, icon, price, resale: 0.5, description, ...extra });
const hire = (cat, id, label, icon, weekly, description, extra = {}) => ({ id, cat, kind: 'staff', label, icon, weekly, description, ...extra });
const live = (cat, id, label, icon, price, cooldown, description, extra = {}) => ({ id, cat, kind: 'experience', label, icon, price, cooldown, description, ...extra });
const asset = (cat, id, label, icon, price, description, invest, extra = {}) => ({
  id,
  cat,
  kind: 'invest',
  label,
  icon,
  price,
  description,
  invest: { growth: [1, 1], yield: [0, 0], risk: 0, crash: [0.85, 0.95], bust: 0, fee: 0.03, ...invest },
  ...extra,
});

// Uma temporada longa tem uns 40 jogos de semana: "uma vez por temporada".
const SEASON = 40;

export const LIFESTYLE_ITEMS = [
  // ------------------------------------------------------------------ lazer
  hire('lazer', 'streaming', 'Assinaturas de streaming', 'television', 15, 'Filmes, séries e todos os jogos do mundo no sofá.', {
    effects: { weekly: { happiness: 0.15 } },
  }),
  live('lazer', 'pescaria', 'Pescaria no fim de semana', 'fish', 600, 4, 'Silêncio, rio e uma vara de pescar.', {
    onBuy: { happiness: 3, fitness: 1 },
  }),
  own('lazer', 'videogame', 'Videogame de última geração', 'game-controller', 600, 'Para relaxar depois do treino. Cuidado com a madrugada.', {
    onBuy: { happiness: 4 },
    effects: { weekly: { happiness: 0.25, discipline: -0.05 } },
    resale: 0.4,
  }),
  own('lazer', 'violao', 'Violão com aulas', 'guitar', 900, 'Pagode no vestiário e na concentração.', {
    onBuy: { happiness: 3 },
    effects: { weekly: { happiness: 0.15, morale: 0.1 } },
    resale: 0.4,
  }),
  live('lazer', 'show', 'Show do seu artista favorito', 'music-notes', 1_200, 8, 'Cantar junto, sem ninguém pedir foto (quase).', {
    onBuy: { happiness: 4 },
  }),
  live('lazer', 'kart', 'Corrida de kart com os amigos', 'flag-checkered', 2_000, 6, 'Quem perder paga o açaí.', {
    onBuy: { happiness: 4, morale: 1 },
  }),
  live('lazer', 'balada', 'Noite na balada', 'martini', 3_000, 3, 'Diversão garantida. A forma e o técnico podem não gostar.', {
    onBuy: { happiness: 5, discipline: -3, fitness: -4 },
    risk: { chance: 0.2, onBuy: { managerRelation: -4, reputation: -2, fame: 2 }, text: 'Uma foto sua às 4h da manhã vazou. O técnico não gostou.' },
  }),
  own('lazer', 'bike_speed', 'Bicicleta speed', 'bicycle', 3_500, 'Pedal no fim de semana: cabeça leve e perna forte.', {
    effects: { weekly: { happiness: 0.15 }, xp: { fisico: 1.05 } },
  }),
  own('lazer', 'sinuca', 'Mesa de sinuca', 'target', 8_000, 'Para receber os amigos do elenco em casa.', {
    effects: { weekly: { happiness: 0.2, morale: 0.15 } },
  }),
  live('lazer', 'camarote', 'Camarote VIP em festival', 'ticket', 25_000, 10, 'Três dias de música com tudo liberado.', {
    onBuy: { happiness: 5, fame: 1, fitness: -2 },
  }),
  own('lazer', 'home_theater', 'Home theater', 'television-simple', 45_000, 'Tela gigante para ver os jogos dos rivais.', {
    effects: { weekly: { happiness: 0.3 } },
    resale: 0.4,
  }),
  hire('lazer', 'clube_golfe', 'Sócio de clube de golfe', 'golf', 3_000, 'Dezoito buracos de paciência. Ajuda a ter cabeça fria.', {
    effects: { weekly: { happiness: 0.2 }, attributes: { composure: 1 } },
  }),
  live('lazer', 'festa', 'Festa de aniversário', 'cake', 80_000, SEASON, 'Família, amigos e o elenco todo. Uma vez por temporada.', {
    onBuy: { happiness: 8, morale: 4, fame: 1 },
  }),
  own('lazer', 'simulador_corrida', 'Simulador de corrida profissional', 'steering-wheel', 150_000, 'Um cockpit de Fórmula 1 na sala de casa.', {
    onBuy: { happiness: 5 },
    effects: { weekly: { happiness: 0.3 } },
  }),
  own('lazer', 'piscina', 'Piscina com área de churrasco', 'swimming-pool', 250_000, 'Churrasco com o elenco no domingo de folga.', {
    effects: { weekly: { happiness: 0.35, morale: 0.2 } },
    resale: 0.6,
  }),
  own('lazer', 'quadra_padel', 'Quadra de padel em casa', 'tennis-ball', 300_000, 'O esporte preferido dos boleiros nas folgas.', {
    effects: { weekly: { happiness: 0.3 }, xp: { fisico: 1.05 } },
    resale: 0.6,
  }),
  own('lazer', 'estudio_musica', 'Estúdio de música em casa', 'microphone', 600_000, 'Para gravar o pagode do título.', {
    onBuy: { fame: 2 },
    effects: { weekly: { happiness: 0.35, charisma: 0.1 } },
  }),
  live('lazer', 'festa_famosos', 'Festa com famosos na mansão', 'champagne', 1_200_000, SEASON, 'DJ internacional, artistas e jogadores. Vai sair em todo lugar.', {
    onBuy: { happiness: 10, fame: 5, morale: 3, discipline: -3 },
    risk: { chance: 0.15, onBuy: { reputation: -4, managerRelation: -3 }, text: 'A festa foi até de manhã e virou manchete.' },
  }),
  own('lazer', 'cinema', 'Sala de cinema particular', 'popcorn', 2_500_000, 'Sessão de estreia com o elenco todo.', {
    onBuy: { fame: 1 },
    effects: { weekly: { happiness: 0.45, morale: 0.2 } },
    upkeep: 2_000,
  }),
  own('lazer', 'kartodromo', 'Kartódromo particular', 'flag-checkered', 8_000_000, 'Corrida valendo churrasco toda semana.', {
    onBuy: { fame: 3, happiness: 6 },
    effects: { weekly: { happiness: 0.5, morale: 0.2 } },
    upkeep: 8_000,
    resale: 0.6,
  }),

  // ------------------------------------------------------------------- luxo
  own('luxo', 'tenis_limitado', 'Tênis de edição limitada', 'sneaker', 2_500, 'Só existem 500 pares no mundo.', {
    onBuy: { fame: 1, happiness: 3 },
    resale: 0.7,
  }),
  own('luxo', 'tatuagem', 'Tatuagem fechando o braço', 'paint-brush', 4_000, 'A data da estreia, o rosto da avó e um leão. Não dá para vender.', {
    onBuy: { fame: 1, happiness: 3, charisma: 1 },
    resale: 0,
  }),
  own('luxo', 'corrente_ouro', 'Corrente de ouro', 'crown-simple', 18_000, 'Brilha na comemoração. Nem todo mundo acha elegante.', {
    onBuy: { fame: 2, happiness: 3, reputation: -1 },
    resale: 0.8,
  }),
  own('luxo', 'guarda_roupa', 'Guarda-roupa de grife', 'handbag', 30_000, 'Chegada ao estádio digna de passarela.', {
    onBuy: { fame: 2, charisma: 2, happiness: 3 },
    resale: 0.3,
  }),
  own('luxo', 'moto', 'Moto esportiva', 'motorcycle', 40_000, 'Adrenalina pura. O departamento médico do clube odeia.', {
    onBuy: { happiness: 5, fame: 1 },
    effects: { injuryRisk: 1.08 },
    upkeep: 200,
    resale: 0.6,
  }),
  own('luxo', 'grillz', 'Dentes de ouro e diamante', 'tooth', 60_000, 'Um sorriso que aparece de longe. A imprensa adora criticar.', {
    onBuy: { fame: 3, happiness: 3, reputation: -3 },
    resale: 0.3,
  }),
  own('luxo', 'esportivo_usado', 'Esportivo seminovo', 'car-profile', 85_000, 'O primeiro carrão, comprado com o salário do profissional.', {
    onBuy: { fame: 2, happiness: 5 },
    upkeep: 500,
    resale: 0.6,
  }),
  own('luxo', 'relogio_suico', 'Relógio suíço', 'watch', 95_000, 'Clássico, discreto e caro de verdade.', {
    onBuy: { fame: 3, charisma: 1, happiness: 3 },
    resale: 0.85,
  }),
  own('luxo', 'suv_blindado', 'SUV blindado', 'jeep', 280_000, 'Segurança para você e para a família.', {
    onBuy: { happiness: 3 },
    effects: { weekly: { happiness: 0.15 } },
    upkeep: 1_200,
    resale: 0.6,
  }),
  own('luxo', 'esportivo', 'Esportivo zero quilômetro', 'car', 450_000, 'Ronco de motor na porta do CT.', {
    onBuy: { fame: 4, happiness: 7 },
    upkeep: 2_500,
    resale: 0.55,
  }),
  own('luxo', 'lancha', 'Lancha', 'boat', 600_000, 'Folga no mar com os amigos.', {
    onBuy: { happiness: 6, fame: 2 },
    effects: { weekly: { happiness: 0.25 } },
    upkeep: 3_000,
    resale: 0.6,
  }),
  own('luxo', 'relogio_diamantes', 'Relógio cravejado de diamantes', 'watch', 1_800_000, 'Vale mais que a casa de muita gente. Todos vão comentar.', {
    onBuy: { fame: 5, happiness: 4, reputation: -2 },
    resale: 0.8,
  }),
  own('luxo', 'hipercarro', 'Hipercarro de edição limitada', 'car-profile', 3_200_000, 'Mais de mil cavalos e só 99 unidades.', {
    onBuy: { fame: 6, happiness: 8, reputation: -1 },
    upkeep: 12_000,
    resale: 0.8,
  }),
  own('luxo', 'iate', 'Iate de 30 metros', 'anchor', 9_000_000, 'Férias em alto-mar com tripulação.', {
    onBuy: { fame: 5, happiness: 8 },
    effects: { weekly: { happiness: 0.35 } },
    upkeep: 35_000,
    resale: 0.65,
  }),
  own('luxo', 'garagem', 'Garagem com dez carros de luxo', 'car', 18_000_000, 'Um carro para cada dia, e ainda sobram três.', {
    onBuy: { fame: 8, happiness: 8 },
    effects: { weekly: { happiness: 0.3 } },
    upkeep: 60_000,
    resale: 0.7,
  }),
  own('luxo', 'mansao', 'Mansão com doze quartos', 'house', 22_000_000, 'Cinema, adega, campo e vista para o mar.', {
    onBuy: { fame: 6, happiness: 8 },
    effects: { weekly: { happiness: 0.35 } },
    upkeep: 30_000,
    resale: 0.9,
  }),
  own('luxo', 'jatinho', 'Jatinho particular', 'airplane', 45_000_000, 'Viaja para os jogos descansado e sem fila.', {
    onBuy: { fame: 8, happiness: 8 },
    effects: { weeklyFitness: 1, restBonus: 2 },
    upkeep: 150_000,
    resale: 0.7,
  }),
  own('luxo', 'castelo', 'Castelo na Europa', 'castle-turret', 60_000_000, 'Seiscentos anos de história, agora com wi-fi.', {
    onBuy: { fame: 8, happiness: 8, intelligence: 1 },
    effects: { weekly: { happiness: 0.4 } },
    upkeep: 90_000,
    resale: 0.85,
  }),
  own('luxo', 'megaiate', 'Megaiate com heliponto', 'anchor', 85_000_000, 'Cem metros, piscina e helicóptero. Ostentação no último nível.', {
    onBuy: { fame: 10, happiness: 10, reputation: -2 },
    effects: { weekly: { happiness: 0.5 }, restBonus: 2 },
    upkeep: 220_000,
    resale: 0.7,
  }),
  own('luxo', 'ilha', 'Ilha particular', 'island', 120_000_000, 'Um pedaço do Caribe com o seu nome no mapa.', {
    onBuy: { fame: 12, happiness: 12 },
    effects: { weekly: { happiness: 0.5 }, restBonus: 3 },
    upkeep: 180_000,
    resale: 0.85,
  }),

  // ------------------------------------------------------------- desempenho
  own('desempenho', 'kit_treino', 'Kit de treino em casa', 'traffic-cone', 250, 'Cones, escada de agilidade e elásticos.', {
    effects: { xp: { fisico: 1.05, tecnico: 1.05 } },
    resale: 0.3,
  }),
  own('desempenho', 'smartwatch', 'Relógio de sono e carga', 'watch', 800, 'Avisa quando você está cansado antes de você sentir.', {
    effects: { weeklyFitness: 0.5, injuryRisk: 0.97 },
    resale: 0.3,
  }),
  own('desempenho', 'mini_gol', 'Mini-gol e bolas oficiais no quintal', 'soccer-ball', 1_500, 'Mil toques por dia, como na infância.', {
    effects: { xp: { tecnico: 1.05, finalizacao: 1.05, drible: 1.05 } },
    resale: 0.3,
  }),
  own('desempenho', 'colchao', 'Colchão de alta performance', 'bed', 3_000, 'Dormir bem também é treinar.', {
    effects: { restBonus: 2 },
    resale: 0.2,
  }),
  own('desempenho', 'oculos_estrobo', 'Óculos de treino estroboscópico', 'eyeglasses', 4_000, 'Pisca enquanto você treina e ensina o cérebro a reagir mais rápido.', {
    effects: { attributes: { reactions: 1 } },
    resale: 0.3,
  }),
  hire('desempenho', 'danca', 'Aulas de dança', 'music-note', 350, 'Gingado que aparece no drible.', {
    effects: { attributes: { agility: 1, balance: 1 } },
  }),
  hire('desempenho', 'boxe', 'Aulas de boxe', 'boxing-glove', 400, 'Força, explosão e coragem na dividida.', {
    effects: { attributes: { strength: 1, aggression: 1 } },
  }),
  hire('desempenho', 'yoga', 'Professor de ioga', 'flower-lotus', 900, 'Respiração e equilíbrio para os momentos de pressão.', {
    effects: { attributes: { composure: 1 }, weekly: { happiness: 0.15 } },
  }),
  hire('desempenho', 'massagista', 'Massagista particular', 'heart', 2_000, 'Perna leve no dia seguinte ao treino pesado.', {
    effects: { restBonus: 2, trainingFitness: 1 },
  }),
  hire('desempenho', 'medico', 'Médico particular', 'stethoscope', 12_000, 'Exames toda semana e prevenção antes da dor.', {
    effects: { injuryRisk: 0.85, fasterHealing: 0.25, weekly: { health: 0.2 } },
  }),
  own('desempenho', 'exames', 'Mapeamento genético e plano de treino', 'flask', 180_000, 'Treino feito para o seu corpo, não para o de todo mundo.', {
    effects: { xp: { fisico: 1.1, academia: 1.1, academia_casa: 1.1 }, injuryRisk: 0.92 },
    resale: 0,
  }),
  own('desempenho', 'simulador_vr', 'Simulador de realidade virtual', 'virtual-reality', 250_000, 'Milhares de lances vistos do seu ponto de vista.', {
    effects: { xp: { tatico: 1.15, video: 1.1 }, attributes: { reactions: 1 } },
    resale: 0.4,
  }),
  own('desempenho', 'hiperbarica', 'Câmara hiperbárica', 'thermometer', 450_000, 'Oxigênio sob pressão: o músculo se recupera mais rápido.', {
    effects: { fasterHealing: 0.35, weekly: { health: 0.1 } },
  }),
  own('desempenho', 'hidroterapia', 'Piscina de hidroterapia', 'person-simple-swim', 900_000, 'Treino sem impacto e recuperação na água.', {
    effects: { weeklyFitness: 1, injuryRisk: 0.9 },
    upkeep: 2_000,
  }),
  own('desempenho', 'campo_society', 'Campo de futebol em casa', 'soccer-ball', 1_800_000, 'Gramado e iluminação para treinar quando quiser.', {
    effects: { xp: { tecnico: 1.1, drible: 1.1, finalizacao: 1.1, bola_parada: 1.1, goleiro: 1.1, jogo_pes: 1.1 }, weekly: { happiness: 0.2 } },
    upkeep: 3_000,
    resale: 0.6,
  }),
  own('desempenho', 'hipoxia', 'Quarto de hipóxia', 'mountains', 2_200_000, 'Dormir como se estivesse na altitude aumenta o fôlego.', {
    effects: { attributes: { stamina: 2 }, xp: { fisico: 1.1 } },
    resale: 0.4,
  }),
  own('desempenho', 'ct_particular', 'Centro de treinamento particular', 'buildings', 14_000_000, 'Gramado oficial, academia e fisioterapia só para você.', {
    effects: {
      xp: { tecnico: 1.1, fisico: 1.1, tatico: 1.1, finalizacao: 1.1, drible: 1.1, goleiro: 1.1, jogo_pes: 1.1, bola_parada: 1.1 },
      restBonus: 2,
      injuryRisk: 0.92,
    },
    upkeep: 25_000,
    resale: 0.6,
  }),
  hire('desempenho', 'longevidade', 'Programa de longevidade', 'pill', 60_000, 'Medicina de ponta para atrasar o relógio do corpo depois dos 30.', {
    effects: { agingSlow: 0.85, weekly: { health: 0.25 } },
  }),

  // ------------------------------------------------------------------- casa
  own('casa', 'cachorro', 'Cachorro', 'dog', 1_500, 'O melhor amigo para os dias de derrota.', {
    onBuy: { happiness: 4 },
    effects: { weekly: { happiness: 0.3 } },
    upkeep: 60,
    resale: 0,
  }),
  own('casa', 'quarto_novo', 'Quarto novo na casa dos pais', 'bed', 2_000, 'Cama nova, armário e um pôster do seu ídolo.', {
    onBuy: { happiness: 4 },
    effects: { weekly: { happiness: 0.1 } },
    resale: 0,
  }),
  hire('casa', 'aluguel_ct', 'Apartamento perto do CT', 'house-line', 400, 'Menos trânsito, mais sono e nunca chega atrasado.', {
    effects: { weeklyFitness: 0.5, weekly: { discipline: 0.15 } },
  }),
  hire('casa', 'motorista', 'Motorista particular', 'steering-wheel', 1_200, 'Pontualidade sempre. O técnico percebe.', {
    effects: { weekly: { discipline: 0.25, managerRelation: 0.1 } },
  }),
  hire('casa', 'chef', 'Chef particular', 'chef-hat', 3_000, 'Comida saudável que é gostosa de verdade.', {
    effects: { weeklyFitness: 1, weekly: { happiness: 0.2 } },
  }),
  hire('casa', 'seguranca', 'Segurança particular', 'shield-check', 4_000, 'Paz para sair com a família.', {
    effects: { weekly: { happiness: 0.25 } },
  }),
  hire('casa', 'mordomo', 'Mordomo', 'bell-ringing', 6_000, 'A casa funciona sozinha. Você só pensa em futebol.', {
    effects: { weekly: { happiness: 0.3, discipline: 0.15 } },
  }),
  own('casa', 'reforma_avo', 'Reforma na casa da avó', 'house-line', 40_000, 'Telhado novo, cozinha nova e muito orgulho.', {
    onBuy: { happiness: 6, reputation: 2 },
    resale: 0,
  }),
  own('casa', 'carro_mae', 'Carro zero para a sua mãe', 'car', 60_000, 'Ela chorou. Você também.', {
    onBuy: { happiness: 6, reputation: 2 },
    resale: 0.5,
  }),
  own('casa', 'cavalo', 'Cavalo de raça', 'horse', 120_000, 'Cavalgadas na folga e foto bonita para as redes.', {
    onBuy: { happiness: 4, fame: 1 },
    effects: { weekly: { happiness: 0.2 } },
    upkeep: 1_000,
    resale: 0.7,
  }),
  own('casa', 'casa_pais', 'Casa para os seus pais', 'house', 350_000, 'O sonho de quando você era criança.', {
    onBuy: { happiness: 10, reputation: 3 },
    effects: { weekly: { happiness: 0.2 } },
    resale: 0.9,
  }),
  own('casa', 'casa_propria', 'Casa própria', 'house', 900_000, 'Seu canto, do seu jeito.', {
    onBuy: { happiness: 6 },
    effects: { weekly: { happiness: 0.25 } },
    upkeep: 600,
    resale: 0.95,
  }),
  own('casa', 'casa_campo', 'Casa de campo', 'tree', 2_800_000, 'Silêncio total para recarregar nas folgas.', {
    effects: { weekly: { happiness: 0.3 }, restBonus: 2 },
    upkeep: 4_000,
    resale: 0.9,
  }),
  own('casa', 'casa_praia', 'Casa na praia para a família', 'tree-palm', 5_000_000, 'Todo mundo reunido no fim de ano.', {
    onBuy: { happiness: 6, reputation: 1 },
    effects: { weekly: { happiness: 0.35 } },
    upkeep: 6_000,
    resale: 0.9,
  }),
  own('casa', 'fazenda', 'Fazenda', 'leaf', 12_000_000, 'Ar puro, cavalos e comida da horta.', {
    onBuy: { fame: 2, happiness: 5 },
    effects: { weekly: { happiness: 0.35, health: 0.1 } },
    upkeep: 15_000,
    resale: 0.9,
  }),

  // ----------------------------------------------------------------- social
  live('social', 'visita_hospital', 'Visita a um hospital infantil', 'hand-heart', 1_000, 10, 'Camisas autografadas e muitos sorrisos.', {
    onBuy: { reputation: 2, happiness: 3, charisma: 1 },
  }),
  live('social', 'cestas_basicas', 'Cestas básicas na sua comunidade', 'package', 5_000, 12, 'Ajudar quem esteve com você desde o começo.', {
    onBuy: { reputation: 2, happiness: 2, fanRelation: 1 },
  }),
  live('social', 'ingressos_torcida', 'Ingressos para torcedores carentes', 'ticket', 20_000, 20, 'Arquibancada cheia de gente que nunca tinha ido ao estádio.', {
    onBuy: { fanRelation: 4, reputation: 1 },
  }),
  live('social', 'doacao_base', 'Doação para o clube onde você começou', 'soccer-ball', 50_000, SEASON, 'Bolas, uniformes e um campo melhor para a molecada.', {
    onBuy: { reputation: 4, fanRelation: 3, happiness: 3 },
  }),
  live('social', 'autobiografia', 'Autobiografia', 'book', 60_000, 0, 'A sua história contada por você. Só se escreve uma vez.', {
    once: true,
    onBuy: { fame: 4, reputation: 3, intelligence: 2 },
  }),
  live('social', 'bolsas_estudo', 'Bolsas de estudo para jovens atletas', 'student', 200_000, SEASON, 'Escola e treino para cem crianças por um ano.', {
    onBuy: { reputation: 5, happiness: 3 },
  }),
  live('social', 'viagem_torcida', 'Pagar a viagem da torcida na final', 'airplane-tilt', 250_000, SEASON, 'Ônibus e ingresso para mil torcedores. Tem quem critique.', {
    onBuy: { fanRelation: 10, fame: 2, reputation: -1 },
  }),
  live('social', 'jogo_amigos', 'Jogo festivo com amigos famosos', 'users-three', 400_000, SEASON, 'Estádio lotado, renda para a caridade.', {
    onBuy: { fanRelation: 6, fame: 4, happiness: 5 },
  }),
  live('social', 'gala', 'Jantar beneficente de gala', 'champagne', 1_500_000, SEASON, 'Leilão de camisas históricas para uma causa.', {
    onBuy: { reputation: 6, fame: 5, charisma: 2 },
  }),
  live('social', 'documentario', 'Documentário sobre a sua carreira', 'film-slate', 2_000_000, SEASON * 2, 'Uma série em uma plataforma de streaming.', {
    onBuy: { fame: 8, charisma: 3, reputation: 2 },
  }),
  hire('social', 'social_media', 'Gestor de redes sociais', 'instagram-logo', 1_200, 'Postagens certas na hora certa.', {
    effects: { weekly: { fame: 0.25, charisma: 0.1 } },
  }),
  hire('social', 'assessor_imprensa', 'Assessor de imprensa', 'newspaper', 2_500, 'Entrevistas preparadas e crises abafadas.', {
    effects: { weekly: { reputation: 0.2, fanRelation: 0.15 } },
  }),
  hire('social', 'marketing', 'Assessoria de marketing', 'megaphone', 3_500, 'Negocia melhor os seus patrocínios.', {
    effects: { sponsorBonus: 0.2 },
  }),
  hire('social', 'agencia_patrocinio', 'Agência de patrocínios', 'handshake', 5_000, 'Coloca marcas no seu nome mesmo sem contrato próprio. Rende conforme a sua fama.', {
    effects: { sponsors: true, sponsorBonus: 0.1 },
  }),
  own('social', 'campo_comunidade', 'Campo de futebol na sua comunidade', 'park', 800_000, 'Grama sintética e luz onde você jogava descalço.', {
    onBuy: { reputation: 8, fanRelation: 5, happiness: 6 },
    resale: 0,
  }),
  own('social', 'instituto', 'Instituto com o seu nome', 'hand-heart', 3_000_000, 'Esporte e educação para milhares de crianças.', {
    onBuy: { reputation: 10, fame: 4 },
    effects: { weekly: { reputation: 0.25, fanRelation: 0.15 } },
    upkeep: 20_000,
    resale: 0,
  }),
  own('social', 'hospital', 'Hospital infantil com o seu nome', 'hospital', 25_000_000, 'O maior legado fora de campo.', {
    onBuy: { reputation: 20, fame: 8, fanRelation: 10, happiness: 10 },
    effects: { weekly: { reputation: 0.3 } },
    upkeep: 80_000,
    resale: 0,
  }),

  // ----------------------------------------------------------------- estudo
  own('estudo', 'livros_tatica', 'Livros sobre tática', 'books', 120, 'Dos clássicos de Sacchi aos treinadores de hoje.', {
    onBuy: { intelligence: 2 },
    effects: { xp: { tatico: 1.03 } },
    resale: 0,
  }),
  hire('estudo', 'ingles', 'Curso de inglês', 'translate', 150, 'Para a entrevista na Europa e o vestiário do mundo.', {
    effects: { weekly: { intelligence: 0.15, charisma: 0.1 } },
  }),
  hire('estudo', 'xadrez', 'Aulas de xadrez', 'strategy', 200, 'Pensar duas jogadas à frente, no tabuleiro e no campo.', {
    effects: { weekly: { intelligence: 0.15 }, attributes: { vision: 1 } },
  }),
  hire('estudo', 'faculdade', 'Faculdade de Educação Física a distância', 'student', 250, 'Um diploma para o futuro, no seu ritmo.', {
    effects: { weekly: { intelligence: 0.2, discipline: 0.1 } },
  }),
  live('estudo', 'supletivo', 'Terminar os estudos', 'graduation-cap', 2_000, 0, 'O diploma que a rotina da base não deixou pegar.', {
    once: true,
    onBuy: { intelligence: 6, discipline: 3 },
  }),
  live('estudo', 'oratoria', 'Curso de oratória', 'chat-circle-text', 6_000, 0, 'Falar bem na coletiva e no vestiário.', {
    once: true,
    onBuy: { charisma: 4, intelligence: 1 },
  }),
  own('estudo', 'curso_financas', 'Curso de finanças pessoais', 'piggy-bank', 8_000, 'Entender para onde vai o dinheiro.', {
    onBuy: { intelligence: 3 },
    effects: { expenseCut: 0.03, investBonus: 0.01 },
    resale: 0,
  }),
  live('estudo', 'media_training', 'Media training', 'microphone', 25_000, 0, 'Responder sem criar polêmica (ou criando só quando quiser).', {
    once: true,
    onBuy: { charisma: 6, fame: 1 },
  }),
  live('estudo', 'lideranca', 'Curso de liderança', 'users-three', 40_000, 0, 'Para quem quer a braçadeira de capitão.', {
    once: true,
    onBuy: { morale: 5, charisma: 3, managerRelation: 2 },
  }),
  own('estudo', 'biblioteca', 'Biblioteca em casa', 'books', 90_000, 'Leitura todo dia antes de dormir.', {
    effects: { weekly: { intelligence: 0.25, happiness: 0.1 } },
    resale: 0.4,
  }),
  own('estudo', 'licenca_treinador', 'Licença de treinador', 'clipboard-text', 150_000, 'Você passa a ver o jogo como o técnico vê.', {
    minAge: 27,
    onBuy: { intelligence: 5, managerRelation: 3 },
    effects: { xp: { tatico: 1.1 } },
    resale: 0,
  }),
  own('estudo', 'mba', 'MBA em gestão do esporte', 'graduation-cap', 220_000, 'Prepara o pós-carreira e organiza o dinheiro de agora.', {
    minAge: 25,
    onBuy: { intelligence: 6, charisma: 2, reputation: 3 },
    effects: { investBonus: 0.02, expenseCut: 0.05 },
    resale: 0,
  }),

  // ----------------------------------------------------------------- viagem
  live('viagem', 'visitar_familia', 'Viagem para visitar a família', 'heart', 800, 8, 'Comida de mãe e as histórias de sempre.', {
    onBuy: { happiness: 5, morale: 1 },
  }),
  live('viagem', 'churrasco_elenco', 'Churrasco para o elenco', 'fire', 4_000, 6, 'Carne boa e pagode. O grupo fica mais unido.', {
    onBuy: { morale: 4, happiness: 2 },
  }),
  live('viagem', 'jantar_tecnico', 'Jantar com o técnico', 'fork-knife', 1_200, 10, 'Uma conversa franca sobre o seu espaço no time.', {
    onBuy: { managerRelation: 4 },
    risk: { chance: 0.15, onBuy: { morale: -3 }, text: 'O elenco ficou sabendo do jantar e te chamou de puxa-saco.' },
  }),
  live('viagem', 'fds_praia', 'Fim de semana na praia', 'sun', 1_500, 6, 'Sol, mar e celular desligado.', {
    onBuy: { happiness: 4, fitness: 3 },
  }),
  live('viagem', 'mochilao', 'Mochilão pela Europa', 'map-trifold', 12_000, SEASON, 'Trem, albergue e museus nas férias.', {
    onBuy: { happiness: 6, intelligence: 2, charisma: 1 },
  }),
  live('viagem', 'noronha', 'Férias em Fernando de Noronha', 'tree-palm', 18_000, 26, 'O mar mais bonito do Brasil.', {
    onBuy: { happiness: 8, fitness: 5 },
  }),
  live('viagem', 'disney', 'Férias na Disney com a família', 'mask-happy', 45_000, SEASON, 'Fila, montanha-russa e muita foto.', {
    onBuy: { happiness: 9 },
  }),
  live('viagem', 'ski', 'Esqui nas montanhas', 'person-simple-ski', 70_000, SEASON, 'Neve e chalé de luxo. O clube prefere que você não vá.', {
    onBuy: { happiness: 7 },
    risk: { chance: 0.08, onBuy: { fitness: -10, health: -2 }, text: 'Tombo na pista. Nada grave, mas o corpo sentiu.' },
  }),
  live('viagem', 'retiro', 'Retiro de meditação no Himalaia', 'mountains', 80_000, SEASON, 'Dez dias de silêncio para pôr a cabeça no lugar.', {
    onBuy: { happiness: 6, discipline: 4, morale: 1 },
  }),
  live('viagem', 'spa_alpes', 'Spa de luxo nos Alpes', 'flower-lotus', 120_000, 26, 'Massagem, sauna e montanha.', {
    onBuy: { fitness: 8, happiness: 6, health: 1 },
  }),
  live('viagem', 'final_copa', 'Assistir à final da Copa do Mundo', 'trophy', 150_000, SEASON * 2, 'De perto, aprendendo com os melhores.', {
    onBuy: { happiness: 8, intelligence: 2, fame: 1 },
  }),
  live('viagem', 'maldivas', 'Férias nas Maldivas', 'island', 250_000, SEASON, 'Bangalô sobre o mar. Volta zerado.', {
    onBuy: { happiness: 10, fitness: 8, health: 1 },
  }),
  live('viagem', 'pretemporada', 'Pré-temporada particular na altitude', 'mountains', 300_000, SEASON, 'Preparador, nutricionista e altitude. Você volta voando.', {
    onBuy: { fitness: 12, health: 1, discipline: 2 },
  }),
  live('viagem', 'reveillon_dubai', 'Réveillon em Dubai', 'confetti', 600_000, SEASON, 'Fogos no prédio mais alto do mundo.', {
    onBuy: { happiness: 10, fame: 3 },
  }),
  live('viagem', 'cruzeiro_elenco', 'Cruzeiro com o elenco', 'boat', 900_000, SEASON, 'Três dias no mar com todo o grupo. Vestiário fechado com você.', {
    onBuy: { morale: 10, managerRelation: 2, happiness: 5 },
  }),
  live('viagem', 'volta_mundo', 'Volta ao mundo de jatinho fretado', 'globe', 3_000_000, SEASON * 2, 'Vinte países em um mês.', {
    onBuy: { happiness: 12, fame: 4, intelligence: 3 },
  }),
  live('viagem', 'espaco', 'Viagem ao espaço', 'rocket-launch', 48_000_000, 0, 'O primeiro jogador de futebol a ver a Terra lá de cima.', {
    once: true,
    onBuy: { happiness: 20, fame: 15, reputation: 4, intelligence: 3 },
  }),

  // --------------------------------------------------------------- finanças
  asset('financas', 'caderneta', 'Caderneta de poupança', 'piggy-bank', 2_000, 'Pouco, mas não perde nunca.', {
    yield: [0.03, 0.05],
    fee: 0,
  }),
  asset('financas', 'ouro', 'Barras de ouro', 'vault', 10_000, 'Proteção para tempos difíceis. Não paga nada por ano.', {
    growth: [0.96, 1.14],
    risk: 0.08,
    crash: [0.85, 0.95],
    fee: 0.02,
  }),
  asset('financas', 'fundo_acoes', 'Fundo de ações', 'chart-line-up', 20_000, 'Sobe e desce com a economia.', {
    growth: [0.95, 1.18],
    yield: [0.01, 0.03],
    risk: 0.15,
    crash: [0.7, 0.88],
  }),
  asset('financas', 'cripto', 'Criptomoedas', 'currency-btc', 30_000, 'Pode dobrar. Pode sumir.', {
    growth: [0.8, 2.1],
    risk: 0.3,
    crash: [0.25, 0.55],
    bust: 0.05,
    fee: 0.02,
  }),
  asset('financas', 'poupanca', 'Renda fixa', 'coins', 50_000, 'Rende pouco, mas quase nunca dá problema.', {
    growth: [1, 1.01],
    yield: [0.04, 0.07],
    risk: 0.02,
    crash: [0.95, 0.99],
    fee: 0.01,
  }),
  asset('financas', 'lanchonete', 'Lanchonete no bairro', 'hamburger', 60_000, 'O pastel mais famoso da quebrada.', {
    growth: [0.95, 1.05],
    yield: [0.08, 0.18],
    risk: 0.12,
    crash: [0.7, 0.9],
    bust: 0.03,
    fee: 0.1,
  }),
  asset('financas', 'fundo_imobiliario', 'Fundo imobiliário', 'buildings', 80_000, 'Aluguel de galpões e escritórios, pago todo ano.', {
    growth: [0.98, 1.04],
    yield: [0.05, 0.08],
    risk: 0.06,
    crash: [0.85, 0.95],
  }),
  asset('financas', 'acoes_tech', 'Ações de tecnologia', 'cpu', 100_000, 'As empresas do futuro. Muito sobe e desce.', {
    growth: [0.9, 1.35],
    yield: [0, 0.01],
    risk: 0.2,
    crash: [0.55, 0.8],
  }),
  asset('financas', 'escolinha', 'Escolinha de futebol', 'soccer-ball', 150_000, 'Dá lucro modesto e melhora muito a sua reputação.', {
    growth: [1, 1.03],
    yield: [0.03, 0.08],
    risk: 0.06,
    crash: [0.8, 0.95],
    fee: 0.08,
  }, { onBuy: { reputation: 10 } }),
  asset('financas', 'imovel', 'Apartamento para alugar', 'buildings', 300_000, 'Renda passiva estável e valorização no longo prazo.', {
    growth: [1, 1.05],
    yield: [0.035, 0.06],
    risk: 0.06,
    crash: [0.88, 0.97],
    fee: 0.05,
  }),
  asset('financas', 'franquia', 'Franquia de hamburgueria', 'storefront', 450_000, 'Marca conhecida, lucro quase garantido.', {
    growth: [0.95, 1.1],
    yield: [0.08, 0.14],
    risk: 0.12,
    crash: [0.6, 0.85],
    bust: 0.03,
    fee: 0.1,
  }),
  asset('financas', 'empresa', 'Sociedade em uma empresa', 'briefcase', 800_000, 'Pode multiplicar ou virar pó.', {
    growth: [0.8, 1.7],
    yield: [0, 0.06],
    risk: 0.25,
    crash: [0.5, 0.8],
    bust: 0.03,
    fee: 0.1,
  }),
  asset('financas', 'marca_roupas', 'Marca de roupas com o seu nome', 't-shirt', 1_200_000, 'Vende mais quanto mais famoso você for.', {
    growth: [0.9, 1.25],
    yield: [0.04, 0.12],
    risk: 0.15,
    crash: [0.5, 0.8],
    bust: 0.03,
    fee: 0.1,
    fameScaled: true,
  }, { onBuy: { fame: 3 } }),
  asset('financas', 'rede_academias', 'Rede de academias com o seu nome', 'barbell', 2_500_000, 'Sua cara na fachada atrai cliente. Rende conforme a fama.', {
    growth: [0.95, 1.15],
    yield: [0.05, 0.11],
    risk: 0.12,
    crash: [0.6, 0.85],
    bust: 0.02,
    fee: 0.1,
    fameScaled: true,
  }, { onBuy: { fame: 1 } }),
  asset('financas', 'restaurante', 'Restaurante temático', 'fork-knife', 3_500_000, 'Camisas na parede e telão nos jogos. Rende conforme a fama.', {
    growth: [0.95, 1.15],
    yield: [0.07, 0.15],
    risk: 0.15,
    crash: [0.65, 0.85],
    bust: 0.03,
    fee: 0.1,
    fameScaled: true,
  }, { onBuy: { fame: 2 } }),
  asset('financas', 'startup', 'Startup de tecnologia no esporte', 'rocket', 5_000_000, 'Aposta de alto risco: pode valer uma fortuna ou nada.', {
    growth: [0.7, 2.5],
    risk: 0.35,
    crash: [0.1, 0.4],
    bust: 0.08,
    fee: 0.1,
  }),
  asset('financas', 'agronegocio', 'Fazenda de soja', 'plant', 6_000_000, 'Exporta para o mundo todo. Depende do clima.', {
    growth: [0.98, 1.06],
    yield: [0.045, 0.09],
    risk: 0.1,
    crash: [0.75, 0.9],
    fee: 0.06,
  }),
  asset('financas', 'predio_comercial', 'Prédio comercial', 'building-office', 12_000_000, 'Vinte andares de escritórios alugados.', {
    growth: [1, 1.05],
    yield: [0.045, 0.07],
    risk: 0.05,
    crash: [0.85, 0.95],
    fee: 0.06,
  }),
  asset('financas', 'clube_segunda', 'Sociedade em um clube da segunda divisão', 'shield', 25_000_000, 'Você vira dirigente. Dinheiro de verdade só se subir.', {
    growth: [0.9, 1.3],
    yield: [0, 0.04],
    risk: 0.25,
    crash: [0.7, 0.9],
    fee: 0.1,
  }, { onBuy: { reputation: 6, fame: 5 } }),
  asset('financas', 'hotel', 'Hotel de luxo', 'building', 40_000_000, 'Cinco estrelas de frente para o mar.', {
    growth: [1, 1.06],
    yield: [0.035, 0.07],
    risk: 0.08,
    crash: [0.8, 0.92],
    fee: 0.06,
  }, { onBuy: { fame: 3 } }),
  asset('financas', 'shopping', 'Shopping center', 'storefront', 90_000_000, 'Trezentas lojas e aluguel todo mês.', {
    growth: [1, 1.05],
    yield: [0.045, 0.07],
    risk: 0.06,
    crash: [0.82, 0.94],
    fee: 0.06,
  }),
  asset('financas', 'clube_coracao', 'Comprar o clube onde tudo começou', 'trophy', 150_000_000, 'O sonho final: ser dono do clube que te revelou.', {
    growth: [0.95, 1.15],
    yield: [0.01, 0.04],
    risk: 0.15,
    crash: [0.7, 0.88],
    fee: 0.1,
  }, { onBuy: { reputation: 15, fame: 10, fanRelation: 10, happiness: 15 } }),
  hire('financas', 'contador', 'Contador particular', 'calculator', 1_500, 'Corta os gastos que você nem sabia que tinha.', {
    effects: { expenseCut: 0.12 },
  }),
  hire('financas', 'planejador', 'Gestor de patrimônio', 'vault', 4_000, 'Escolhe melhor onde aplicar o seu dinheiro.', {
    effects: { investBonus: 0.03 },
  }),

  // ---------------------------------------------------------------- coleção
  asset('colecao', 'album_copa', 'Álbum da Copa completo', 'book-open-text', 300, 'Todas as figurinhas, até a mais rara.', {
    growth: [1, 1.08],
    risk: 0.02,
    fee: 0.1,
  }, { onBuy: { happiness: 3 } }),
  asset('colecao', 'vinis', 'Coleção de discos de vinil', 'vinyl-record', 3_000, 'Samba, rock e o hino do clube em edição rara.', {
    growth: [1, 1.06],
    fee: 0.15,
  }, { onBuy: { happiness: 3 } }),
  asset('colecao', 'camisa_idolo', 'Camisa autografada do seu ídolo', 't-shirt', 5_000, 'Emoldurada na parede da sala.', {
    growth: [1, 1.1],
    fee: 0.1,
  }, { onBuy: { happiness: 4 } }),
  asset('colecao', 'moeda_rara', 'Moeda rara', 'coins', 25_000, 'Cunhada há duzentos anos.', {
    growth: [1, 1.1],
    risk: 0.05,
    crash: [0.85, 0.95],
    fee: 0.1,
  }, { onBuy: { happiness: 2 } }),
  asset('colecao', 'camisas_historicas', 'Coleção de camisas históricas', 't-shirt', 120_000, 'Cem anos de futebol em uma parede.', {
    growth: [1.02, 1.1],
    fee: 0.1,
  }, { onBuy: { happiness: 4, fanRelation: 2 } }),
  asset('colecao', 'bola_historica', 'Bola de uma final de Copa histórica', 'soccer-ball', 350_000, 'Gasta, assinada e cheia de história.', {
    growth: [1, 1.12],
    risk: 0.03,
    fee: 0.1,
  }, { onBuy: { happiness: 5, fame: 2 } }),
  asset('colecao', 'adega', 'Adega de vinhos raros', 'wine', 400_000, 'Safras que valorizam com o tempo. Dá vontade de abrir.', {
    growth: [1, 1.1],
    risk: 0.05,
    fee: 0.1,
  }, { onBuy: { happiness: 4, discipline: -1 } }),
  asset('colecao', 'chuteira_lenda', 'Chuteira de uma lenda do futebol', 'sneaker-move', 900_000, 'Usada em um gol que todo mundo lembra.', {
    growth: [1, 1.12],
    fee: 0.1,
  }, { onBuy: { happiness: 5, fame: 2 } }),
  asset('colecao', 'quadro', 'Quadro de um pintor famoso', 'palette', 2_500_000, 'Arte de verdade. O mercado é imprevisível.', {
    growth: [0.95, 1.15],
    risk: 0.08,
    crash: [0.75, 0.9],
    fee: 0.12,
  }, { onBuy: { fame: 2, intelligence: 1 } }),
  asset('colecao', 'taca_antiga', 'Taça original de um torneio antigo', 'trophy', 12_000_000, 'Peça de museu na sua sala de troféus.', {
    growth: [1, 1.1],
    risk: 0.03,
    fee: 0.1,
  }, { onBuy: { fame: 4, reputation: 2 } }),
  asset('colecao', 'carro_classico', 'Carro clássico de 1962', 'car-profile', 35_000_000, 'Um dos carros mais valiosos já fabricados.', {
    growth: [1, 1.12],
    risk: 0.05,
    crash: [0.85, 0.95],
    fee: 0.1,
  }, { onBuy: { fame: 5, happiness: 8 } }),
];

/** Os quatro investimentos que já existiam antes da loja da vida. */
export const LEGACY_INVESTMENT_IDS = ['poupanca', 'imovel', 'empresa', 'escolinha'];
