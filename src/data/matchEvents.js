// Eventos fora da bola: o que acontece no jogo além dos lances.
//
// Têm o mesmo formato dos lances (src/data/matchMoments.js), com algumas
// coisas a mais:
//   trigger   -> 'queue' (o motor chama: chuva e jogo grande no começo, VAR e
//                comemoração depois do seu gol) ou 'context' (sorteado no
//                meio do jogo, se combinar com o placar e a situação)
//   when      -> condições do 'context': minMinute, close (diferença de até
//                1 gol), winning, notWinning, cheered, booed, notCaptain
//   chance    -> chance fixa da opção (1 = sempre dá certo)
//   lifeCheck -> teste com um número da vida (ex.: carisma) em vez de atributo
//   effect    -> muda o resto do jogo: skill (+/- nos lances), rainProof,
//                captain, tactic ('segurar' | 'pressionar'), stamina
//   then      -> evento que vem logo depois (ex.: comemorar após o VAR)
//   derbyBoost-> quanto o evento fica mais provável num clássico
// Os efeitos na vida (morale, discipline, fame, managerRelation, fanRelation,
// happiness, reputation) entram no fim do jogo.

export const MATCH_EVENTS = [
  // ------------------------------------------------- no começo do jogo
  {
    id: 'chuva',
    trigger: 'queue',
    title: 'Chuva forte',
    text: [
      'Começa a chover forte antes do apito. O gramado fica pesado e a bola escorrega.',
      'Temporal no estádio. Poças no gramado e a bola quicando torto.',
      'A chuva não para. Passe, drible e encaixe vão sofrer hoje.',
    ],
    options: [
      {
        label: 'Trocar para a chuteira de trava alta',
        hint: 'Equilíbrio · tira o efeito da chuva',
        attrs: ['balance'],
        difficulty: -8,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Trava alta e pé firme. A chuva não vai te derrubar.', 'Chuteira trocada no vestiário. Você pisa firme no gramado molhado.'],
          effect: { rainProof: true },
        },
        failure: {
          kind: 'neutral',
          rating: 0,
          text: ['Trocou a chuteira, mas continua escorregando.', 'Nem a trava alta segura nesse gramado.'],
        },
      },
      {
        label: 'Seguir como está',
        hint: 'Passe, drible e defesa ficam mais difíceis',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você vai como está. Vai ter que caprichar em cada toque.', 'Sem trocar nada. Que a bola não escorregue.'],
        },
      },
    ],
  },
  {
    id: 'jogo_grande',
    trigger: 'queue',
    title: 'Clima de decisão',
    text: [
      'Estádio lotado, barulho ensurdecedor. Suas pernas tremem um pouco no túnel.',
      'Jogo grande. A torcida canta desde a concentração e todo mundo sabe o que vale.',
      'É daqueles jogos que ficam na memória. O frio na barriga chega antes do apito.',
    ],
    options: [
      {
        label: 'Respirar fundo e manter a calma',
        hint: 'Frieza',
        attrs: ['composure'],
        difficulty: 2,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você respira, olha a arquibancada e sorri. Pronto para o jogo.', 'Cabeça no lugar. O barulho vira combustível.'],
          effect: { skill: 2 },
        },
        failure: {
          kind: 'neutral',
          rating: -0.1,
          text: ['O nervosismo bate. Os primeiros toques saem tortos.', 'A pressão pesa. Você começa travado.'],
          effect: { skill: -3 },
        },
      },
      {
        label: 'Usar a pressão a seu favor',
        hint: 'Agressividade · Entrega · gasta energia',
        attrs: ['aggression', 'workRate'],
        difficulty: 4,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você entra ligado no 220. Primeira dividida, primeira bola ganha.', 'A adrenalina te empurra. Você está em todo lugar.'],
          effect: { skill: 3, stamina: -5 },
        },
        failure: {
          kind: 'neutral',
          rating: -0.1,
          text: ['Ansioso demais, você corre errado e cansa cedo.', 'Muita vontade, pouca cabeça. A energia vai embora rápido.'],
          effect: { skill: -1, stamina: -8 },
        },
      },
    ],
  },

  {
    id: 'classico',
    trigger: 'queue',
    title: 'Dia de {derby}',
    text: [
      'É {derby}. A cidade parou, e metade dela torce contra você.',
      'Clássico contra o {opponent}. Bandeiras, sinalizadores e nenhum lugar vazio.',
      '{derby} vale mais que três pontos. A torcida avisou na concentração.',
    ],
    options: [
      {
        label: 'Respirar e jogar como sempre',
        hint: 'Frieza',
        attrs: ['composure'],
        difficulty: 4,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Cabeça fria no meio do caldeirão. Você entra no jogo no seu ritmo.', 'O barulho fica do lado de fora. É só mais um jogo, pensa você.'],
          effect: { skill: 2 },
        },
        failure: {
          kind: 'neutral',
          rating: -0.1,
          text: ['O peso do clássico te pega. As pernas demoram a soltar.', 'Você erra os primeiros passes e a torcida rival percebe.'],
          effect: { skill: -3 },
        },
      },
      {
        label: 'Usar a rivalidade a seu favor',
        hint: 'Agressividade · Entrega · gasta energia',
        attrs: ['aggression', 'workRate'],
        difficulty: 5,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Primeira dividida, primeira vitória. A sua torcida explode.', 'Você joga com sangue nos olhos e puxa o time junto.'],
          effect: { skill: 3, stamina: -5 },
          fanRelation: 1,
        },
        failure: {
          kind: 'neutral',
          rating: -0.1,
          text: ['Muita raiva e pouca cabeça: você cansa cedo e quase leva cartão.', 'Você entra pilhado demais e se perde nas primeiras jogadas.'],
          effect: { skill: -1, stamina: -8 },
        },
      },
    ],
  },

  // --------------------------------------------------- depois do seu gol
  {
    id: 'var_gol',
    trigger: 'queue',
    title: 'O VAR chama o árbitro',
    text: [
      'O árbitro coloca a mão no ouvido. O VAR vai revisar o seu gol.',
      'Silêncio no estádio: o lance do seu gol vai para o monitor.',
      'Linhas na tela, replay em câmera lenta. O seu gol está em revisão.',
    ],
    options: [
      {
        label: 'Comemorar antes da decisão',
        hint: 'Ousado · o resultado é sorte',
        chance: 0.75,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Gol confirmado! Você já estava na frente da torcida, que vai à loucura.', 'Valeu! A comemoração antecipada vira foto de capa.'],
          fanRelation: 2,
          fame: 1,
        },
        failure: {
          kind: 'goalAnnulled',
          rating: -0.2,
          text: ['Anulado. Você comemorou sozinho, e o vídeo já está na internet.', 'Impedimento por um ombro. A comemoração vira meme.'],
          happiness: -2,
          fame: 1,
        },
      },
      {
        label: 'Esperar de braços cruzados',
        hint: 'O resultado é sorte',
        chance: 0.75,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Confirmado! Agora sim, pode comemorar.', 'O árbitro aponta o meio-campo. Gol validado.'],
          then: 'comemoracao',
        },
        failure: {
          kind: 'goalAnnulled',
          rating: -0.1,
          text: ['Anulado. Pelo menos você não comemorou à toa.', 'O VAR tira o gol. Você só balança a cabeça.'],
        },
      },
    ],
  },
  {
    id: 'comemoracao',
    trigger: 'queue',
    title: 'Hora de comemorar',
    text: [
      'A bola na rede e o estádio de pé. Como você vai comemorar?',
      'Gol seu! Os companheiros correm na sua direção.',
      'Você sai correndo sem saber para onde. Decida a comemoração.',
    ],
    options: [
      {
        label: 'Provocar a torcida rival',
        hint: 'Fama · risco de cartão',
        chance: 1,
        stamina: 0,
        risk: { card: 0.5 },
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Dedo na boca para a torcida deles. Vaia ensurdecedora e manchete garantida.', 'Você faz o gesto de silêncio para a arquibancada rival.'],
          fame: 2,
          fanRelation: 2,
          discipline: -2,
          reputation: -1,
        },
      },
      {
        label: 'Dedicar à família',
        hint: 'Felicidade · reputação',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você aponta para o céu e manda um beijo para a família na arquibancada.', 'Mãos no coração: esse gol é para quem sempre acreditou.'],
          happiness: 3,
          reputation: 1,
        },
      },
      {
        label: 'Correr para a sua torcida',
        hint: 'Torcida · vestiário',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você pula no alambrado e é abraçado pela torcida.', 'Joelhos no gramado em frente à sua torcida. O time vem junto.'],
          fanRelation: 3,
          morale: 1,
        },
      },
    ],
  },

  // ------------------------------------------------------ no meio do jogo
  {
    id: 'tecnico_segura',
    trigger: 'context',
    weight: 6,
    when: { minMinute: 60, close: true, winning: true },
    title: 'O técnico grita "segura!"',
    text: [
      'Da beira do campo, o técnico pede o time fechado para segurar a vitória.',
      'O técnico gesticula: todo mundo atrás da linha da bola.',
      '"Segura, segura!" O técnico quer o resultado garantido.',
    ],
    options: [
      {
        label: 'Obedecer e fechar o time',
        hint: 'Técnico · jogo mais travado',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você recua e organiza os companheiros. O técnico aprova com o polegar.', 'Linhas juntas, jogo travado. Do jeito que o chefe pediu.'],
          managerRelation: 2,
          effect: { tactic: 'segurar' },
        },
      },
      {
        label: 'Fazer do seu jeito e buscar mais um',
        hint: 'Mais solto · o técnico não gosta',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você finge que não ouviu e continua indo para cima.', 'Você acena para o técnico e segue atacando. Ele bufa no banco.'],
          managerRelation: -3,
          effect: { skill: 2 },
        },
      },
    ],
  },
  {
    id: 'tecnico_pressiona',
    trigger: 'context',
    weight: 6,
    when: { minMinute: 55, close: true, notWinning: true },
    title: 'O técnico grita "pressiona!"',
    text: [
      'O técnico pede o time todo no ataque. Ele quer o gol a qualquer custo.',
      '"Pra cima! Pra cima!" O banco inteiro está de pé.',
      'O técnico manda adiantar a marcação e arriscar mais.',
    ],
    options: [
      {
        label: 'Obedecer e ir para cima',
        hint: 'Técnico · jogo mais aberto',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você adianta e puxa os companheiros. Jogo aberto agora.', 'Pressão total, do jeito que o técnico pediu.'],
          managerRelation: 2,
          effect: { tactic: 'pressionar' },
        },
      },
      {
        label: 'Pedir calma e manter o equilíbrio',
        hint: 'Carisma · o técnico pode não gostar',
        lifeCheck: 'charisma',
        difficulty: 5,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você convence o time a não se desesperar. O técnico acaba concordando.', 'Sua liderança segura o time no lugar. Até o técnico respira.'],
          morale: 2,
        },
        failure: {
          kind: 'neutral',
          rating: 0,
          text: ['Ninguém te escuta, e o técnico ficou irritado.', 'O técnico grita seu nome. Ele não gostou nada.'],
          managerRelation: -4,
        },
      },
    ],
  },
  {
    id: 'empurra_empurra',
    trigger: 'context',
    weight: 4,
    derbyBoost: 2.5,
    title: 'Empurra-empurra',
    text: [
      'Uma entrada dura vira confusão. Os dois times se empurram no meio do campo.',
      'Briga generalizada perto da área. O árbitro corre para separar.',
      'Um companheiro é empurrado e todo mundo vai para cima.',
    ],
    options: [
      {
        label: 'Separar a briga',
        hint: 'Carisma',
        lifeCheck: 'charisma',
        difficulty: 0,
        stamina: 1,
        success: {
          kind: 'neutral',
          rating: 0.2,
          text: ['Você entra no meio, acalma todo mundo e o jogo volta. Atitude de líder.', 'Braços abertos e voz firme: a confusão acaba ali.'],
          morale: 3,
          managerRelation: 1,
        },
        failure: {
          kind: 'neutral',
          rating: 0,
          text: ['Ninguém te ouviu, mas você saiu limpo da confusão.', 'Você tentou, mas a briga só acabou com o árbitro.'],
        },
      },
      {
        label: 'Entrar na confusão',
        hint: 'Força · risco de cartão',
        attrs: ['strength', 'aggression'],
        difficulty: 6,
        stamina: 2,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você peita o adversário e sai sem cartão. O vestiário gostou.', 'Empurra daqui, empurra dali, e o árbitro não viu você.'],
          morale: 2,
          discipline: -2,
        },
        failure: {
          kind: 'card',
          rating: -0.5,
          text: ['O árbitro te escolhe para o cartão.', 'Você exagerou no empurrão e o cartão veio na hora.'],
          discipline: -4,
        },
      },
      {
        label: 'Ficar longe',
        hint: 'Seguro',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você assiste de longe, com as mãos na cintura.', 'Você fica no seu canto, esperando acabar.'],
        },
      },
    ],
  },
  {
    id: 'capitao',
    trigger: 'context',
    weight: 2,
    when: { notCaptain: true },
    title: 'A braçadeira é sua',
    text: [
      'O capitão sai machucado. Ele tira a braçadeira e procura você.',
      'O capitão é substituído e a braçadeira vem parar na sua mão.',
      'Com o capitão no departamento médico, o técnico manda: a braçadeira é sua.',
    ],
    options: [
      {
        label: 'Assumir a liderança',
        hint: 'Carisma · o time pode crescer ou travar',
        lifeCheck: 'charisma',
        difficulty: -5,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.2,
          text: ['Você bate palmas e organiza todo mundo. O time cresce com você.', 'Braçadeira no braço e peito estufado. Você comanda o resto do jogo.'],
          morale: 3,
          reputation: 1,
          effect: { captain: true, skill: 2 },
        },
        failure: {
          kind: 'neutral',
          rating: -0.1,
          text: ['O peso da braçadeira te trava um pouco.', 'Você quer resolver tudo sozinho e se perde.'],
          effect: { captain: true, skill: -2 },
        },
      },
      {
        label: 'Passar a braçadeira para outro',
        hint: 'Seguro',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você entrega a braçadeira para o mais experiente e segue focado.', 'Você prefere jogar. A braçadeira vai para outro.'],
        },
      },
    ],
  },
  {
    id: 'torcida_canta',
    trigger: 'context',
    weight: 4,
    derbyBoost: 1.5,
    when: { cheered: true },
    title: 'A torcida canta o seu nome',
    text: [
      'A arquibancada inteira canta o seu nome.',
      'Seu nome ecoa pelo estádio. Arrepio na espinha.',
      'A torcida estende uma faixa com o seu rosto.',
    ],
    options: [
      {
        label: 'Agradecer batendo no escudo',
        hint: 'Torcida · confiança',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Mão no escudo e aplauso para a arquibancada. A torcida vai à loucura.', 'Você beija o escudo. O estádio inteiro responde.'],
          fanRelation: 3,
          happiness: 2,
          effect: { skill: 1 },
        },
      },
      {
        label: 'Mandar calar a torcida rival',
        hint: 'Fama · risco de cartão',
        chance: 1,
        stamina: 0,
        risk: { card: 0.4 },
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Dedo na boca para o outro lado do estádio. Vaia e aplauso ao mesmo tempo.', 'Você provoca a torcida rival. Vai ter polêmica amanhã.'],
          fame: 2,
          fanRelation: 1,
          discipline: -1,
        },
      },
    ],
  },
  {
    id: 'torcida_vaia',
    trigger: 'context',
    weight: 4,
    derbyBoost: 1.5,
    when: { booed: true },
    title: 'Vaias para você',
    text: [
      'A torcida perde a paciência e vaia cada toque seu.',
      'Um grupo atrás do gol grita o seu nome, e não é elogio.',
      'Vaia forte depois da última jogada. Você sente o peso.',
    ],
    options: [
      {
        label: 'Pedir apoio com os braços',
        hint: 'Carisma',
        lifeCheck: 'charisma',
        difficulty: 5,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você levanta os braços pedindo força, e as vaias viram aplauso.', 'A torcida entende o recado e volta a apoiar.'],
          fanRelation: 3,
          effect: { skill: 1 },
        },
        failure: {
          kind: 'neutral',
          rating: 0,
          text: ['As vaias continuam. Hoje não é o seu dia com eles.', 'Ninguém comprou o gesto.'],
          fanRelation: -1,
        },
      },
      {
        label: 'Responder com um gesto',
        hint: 'Fama · a torcida não perdoa',
        chance: 1,
        stamina: 0,
        risk: { card: 0.4 },
        success: {
          kind: 'neutral',
          rating: -0.1,
          text: ['Você responde com um gesto feio. As câmeras pegaram tudo.', 'Você manda a torcida se calar. A briga com a arquibancada está aberta.'],
          fanRelation: -6,
          fame: 2,
          discipline: -3,
        },
      },
      {
        label: 'Ignorar e jogar',
        hint: 'Frieza',
        attrs: ['composure'],
        difficulty: 0,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você nem olha para a arquibancada. Próxima bola.', 'Cabeça baixa no bom sentido: só o jogo importa.'],
        },
        failure: {
          kind: 'neutral',
          rating: -0.1,
          text: ['As vaias entram na sua cabeça e você trava.', 'Você tenta ignorar, mas cada vaia pesa.'],
          effect: { skill: -2 },
        },
      },
    ],
  },
  {
    id: 'juiz_erra',
    trigger: 'context',
    weight: 4,
    derbyBoost: 1.5,
    title: 'O juiz erra contra você',
    text: [
      'Falta clara em você, e o árbitro manda seguir.',
      'O árbitro marca uma falta sua que não existiu.',
      'Lance claro ignorado pelo juiz. Você abre os braços sem acreditar.',
    ],
    options: [
      {
        label: 'Reclamar com o árbitro',
        hint: 'Frieza · risco de cartão',
        attrs: ['composure'],
        difficulty: 8,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você reclama com educação e o árbitro promete atenção.', 'Você fala firme, sem gritar. O juiz ouve.'],
          morale: 1,
        },
        failure: {
          kind: 'yellow',
          rating: -0.3,
          text: ['Reclamou demais: cartão amarelo.', 'O árbitro não gostou do tom e puxou o cartão.'],
          discipline: -2,
        },
      },
      {
        label: 'Seguir o jogo',
        hint: 'Disciplina',
        chance: 1,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0,
          text: ['Você engole o erro e volta para a posição.', 'Respira e segue. O técnico gostou da postura.'],
          discipline: 1,
          managerRelation: 1,
        },
      },
      {
        label: 'Pedir calma ao time',
        hint: 'Carisma',
        lifeCheck: 'charisma',
        difficulty: 0,
        stamina: 0,
        success: {
          kind: 'neutral',
          rating: 0.1,
          text: ['Você segura os companheiros que iam para cima do árbitro.', 'Sua calma contagia. Ninguém leva cartão por reclamação.'],
          morale: 2,
        },
        failure: {
          kind: 'neutral',
          rating: 0,
          text: ['O time continua nervoso, mas ao menos você não se meteu.', 'Ninguém te ouve no meio da reclamação.'],
        },
      },
    ],
  },
];
