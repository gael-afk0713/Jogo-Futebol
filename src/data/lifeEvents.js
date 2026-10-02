// Eventos de vida no estilo BitLife.
//
// Estrutura de um evento:
//   when     -> condições para o evento poder aparecer
//   options  -> escolhas do jogador
//
// Uma opção resolve de três formas:
//   1. effects          -> resultado garantido
//   2. outcomes[]       -> sorteio ponderado por `chance`
//   3. check            -> teste contra um stat de vida/atributo
//
// Chaves de efeito reconhecidas pelo motor (engine/life.js):
//   money, happiness, fitness, health, fame, reputation, discipline,
//   managerRelation, fanRelation, morale, intelligence, charisma,
//   attr{}, injuryWeeks, skillPoints, addFlag, removeFlag, potential

export const LIFE_EVENTS = [
  // ------------------------------------------------------- CARREIRA / TREINO
  {
    id: 'convite_treino_extra',
    category: 'treino',
    icon: '🏃',
    title: 'Treino extra na folga',
    text: 'O preparador físico oferece uma sessão extra no seu dia de descanso.',
    weight: 10,
    when: { hasClub: true },
    options: [
      {
        label: 'Ir treinar',
        effects: { fitness: 6, happiness: -3, skillPoints: 1, managerRelation: 3, text: 'Você sua a camisa sozinho no CT. O técnico ficou sabendo.' },
      },
      {
        label: 'Descansar o corpo',
        effects: { fitness: 3, happiness: 5, text: 'Você fica em casa, assiste jogos e recupera as pernas.' },
      },
      {
        label: 'Chamar um preparador particular (€ 8 mil)',
        when: { minMoney: 8000 },
        effects: { money: -8000, fitness: 9, skillPoints: 2, text: 'Treino individualizado de altíssimo nível. Dá resultado.' },
      },
    ],
  },
  {
    id: 'analista_video',
    category: 'treino',
    icon: '🎬',
    title: 'Sessão de vídeo',
    text: 'O analista de desempenho separou 40 minutos dos seus erros no último jogo.',
    weight: 8,
    when: { hasClub: true },
    options: [
      {
        label: 'Assistir tudo e anotar',
        effects: { intelligence: 4, skillPoints: 1, happiness: -2, managerRelation: 2, text: 'Doeu no ego, mas você entendeu o que corrigir.' },
      },
      {
        label: 'Dizer que já sabe o que errou',
        effects: { managerRelation: -5, happiness: 2, text: 'O analista não gostou nada da resposta.' },
      },
    ],
  },
  {
    id: 'academia_bruta',
    category: 'treino',
    icon: '🏋️',
    title: 'Pegada na musculação',
    text: 'Você quer ganhar massa para aguentar o contato do futebol profissional.',
    weight: 7,
    when: { hasClub: true, maxAge: 32 },
    options: [
      {
        label: 'Ciclo de força puxado',
        outcomes: [
          { chance: 0.75, effects: { attr: { strength: 2, jumping: 1 }, fitness: 4, text: 'Você fecha o ciclo e sente a diferença nas divididas.' } },
          { chance: 0.25, effects: { injuryWeeks: 2, happiness: -6, text: 'Exagerou na carga e estirou. Duas semanas fora.' } },
        ],
      },
      {
        label: 'Focar em mobilidade e prevenção',
        effects: { fitness: 5, health: 4, attr: { agility: 1, balance: 1 }, text: 'Corpo mais solto, menos risco de lesão.' },
      },
    ],
  },

  // ----------------------------------------------------------------- VIDA
  {
    id: 'festa_balada',
    category: 'festa',
    icon: '🎉',
    title: 'Festa depois da vitória',
    text: 'Os veteranos do grupo chamam para comemorar na balada mais badalada da cidade.',
    weight: 10,
    when: { minAge: 17 },
    options: [
      {
        label: 'Ir e aproveitar a noite',
        outcomes: [
          { chance: 0.5, effects: { happiness: 10, fitness: -8, morale: 3, text: 'Noite boa, integração com o grupo em alta.' } },
          { chance: 0.3, effects: { happiness: 6, fitness: -12, fame: 4, discipline: -5, text: 'Alguém filmou você na pista. O vídeo viralizou.' } },
          { chance: 0.2, effects: { happiness: 2, fitness: -14, discipline: -10, managerRelation: -10, fanRelation: -6, text: 'Foto na saída às 5h da manhã estampou os jornais. O técnico te chamou na sala.' } },
        ],
      },
      {
        label: 'Ir, mas sair cedo e sem beber',
        effects: { happiness: 5, fitness: -2, morale: 2, discipline: 2, text: 'Você marca presença, tira as fotos e vai dormir. Equilíbrio.' },
      },
      {
        label: 'Recusar o convite',
        outcomes: [
          { chance: 0.6, effects: { fitness: 4, discipline: 4, happiness: -2, text: 'Você dorme cedo. Profissionalismo acima de tudo.' } },
          { chance: 0.4, effects: { fitness: 4, discipline: 4, morale: -4, happiness: -3, text: 'O grupo te achou metido. Clima estranho no vestiário.' } },
        ],
      },
    ],
  },
  {
    id: 'relacionamento_inicio',
    category: 'amor',
    icon: '💘',
    title: 'Alguém especial',
    text: 'Você conhece alguém que parece entender a loucura que é a sua rotina.',
    weight: 8,
    when: { minAge: 17, flagForbidden: 'relacionamento' },
    options: [
      {
        label: 'Começar a namorar',
        effects: { happiness: 14, addFlag: 'relacionamento', fame: 2, text: 'Vocês começam a namorar. A vida fica mais leve.' },
      },
      {
        label: 'Focar 100% na carreira',
        effects: { happiness: -5, skillPoints: 1, discipline: 3, text: 'Você escolhe a bola. Solidão tem preço, mas rende treino.' },
      },
    ],
  },
  {
    id: 'relacionamento_crise',
    category: 'amor',
    icon: '💔',
    title: 'Crise no relacionamento',
    text: 'Viagens, concentrações, pressão. A relação está desgastada.',
    weight: 7,
    when: { flagRequired: 'relacionamento' },
    options: [
      {
        label: 'Priorizar a relação por um tempo',
        effects: { happiness: 10, fitness: -4, skillPoints: -1, text: 'Vocês se reconectam. Você volta mais inteiro, mesmo treinando menos.' },
      },
      {
        label: 'Terminar',
        effects: { happiness: -14, removeFlag: 'relacionamento', skillPoints: 1, fame: 3, text: 'Fim de relacionamento. A imprensa de fofoca vai falar disso por semanas.' },
      },
      {
        label: 'Pedir em casamento',
        when: { minMoney: 40000, minAge: 21 },
        effects: { money: -40000, happiness: 20, addFlag: 'casado', removeFlag: 'relacionamento', fame: 6, text: 'Pedido aceito! Casamento marcado e capa de revista garantida.' },
      },
    ],
  },
  {
    id: 'filho',
    category: 'familia',
    icon: '👶',
    title: 'Vai ser pai/mãe',
    text: 'A família vai crescer. A notícia muda tudo.',
    weight: 5,
    when: { minAge: 22, flagRequired: 'casado', flagForbidden: 'filhos', once: true },
    options: [
      {
        label: 'Celebrar e se preparar',
        effects: { happiness: 22, addFlag: 'filhos', fitness: -4, reputation: 4, text: 'Você vira pai/mãe. O gol comemorado com o dedo na boca é só o começo.' },
      },
    ],
  },
  {
    id: 'familia_pedido',
    category: 'familia',
    icon: '🏠',
    title: 'Pedido da família',
    text: 'Sua mãe liga: a casa onde você cresceu precisa de reforma urgente.',
    weight: 7,
    when: { minMoney: 25000 },
    options: [
      {
        label: 'Bancar a reforma completa',
        effects: { money: -60000, happiness: 16, reputation: 6, text: 'Você reforma a casa da família. Nada paga a cara deles.' },
      },
      {
        label: 'Ajudar com uma parte',
        effects: { money: -15000, happiness: 6, text: 'Você manda uma ajuda. Dá para resolver o essencial.' },
      },
      {
        label: 'Dizer que não pode agora',
        effects: { happiness: -10, reputation: -3, text: 'Você segura o dinheiro. O silêncio no telefone doeu.' },
      },
    ],
  },

  // ------------------------------------------------------------- IMPRENSA
  {
    id: 'entrevista_polemica',
    category: 'midia',
    icon: '🎤',
    title: 'Pergunta capciosa na coletiva',
    text: 'Um jornalista pergunta se você está insatisfeito com o esquema do técnico.',
    weight: 9,
    when: { hasClub: true },
    options: [
      {
        label: 'Elogiar o técnico e desviar',
        effects: { managerRelation: 6, fame: 1, text: 'Resposta diplomática. O técnico viu e gostou.' },
      },
      {
        label: 'Falar o que pensa',
        outcomes: [
          { chance: 0.4, effects: { fame: 8, fanRelation: 6, managerRelation: -14, text: 'Manchete do dia! A torcida aplaude a sinceridade, o técnico não.' } },
          { chance: 0.6, effects: { fame: 5, managerRelation: -18, morale: -6, text: 'Bomba no vestiário. Você foi multado internamente.' } },
        ],
      },
      {
        label: 'Encerrar a entrevista',
        effects: { fame: -2, reputation: -2, happiness: 2, text: 'Você se levanta e sai. A imprensa não perdoa.' },
      },
    ],
  },
  {
    id: 'rede_social',
    category: 'midia',
    icon: '📱',
    title: 'Hora de postar',
    text: 'Seu social media sugere um post para a semana.',
    weight: 8,
    when: {},
    options: [
      {
        label: 'Conteúdo de treino e dedicação',
        effects: { fame: 3, reputation: 3, fanRelation: 3, text: 'Post sério, engajamento sólido. Imagem de profissional.' },
      },
      {
        label: 'Post ostentação',
        outcomes: [
          { chance: 0.55, effects: { fame: 9, fanRelation: -2, text: 'Milhões de visualizações. Fama em alta.' } },
          { chance: 0.45, effects: { fame: 6, fanRelation: -10, reputation: -5, text: 'Chuva de críticas: "ganha bem e joga mal". A torcida se irritou.' } },
        ],
      },
      {
        label: 'Ficar quieto',
        effects: { happiness: 2, text: 'Perfil silencioso. Nada acontece.' },
      },
    ],
  },
  {
    id: 'documentario',
    category: 'midia',
    icon: '🎥',
    title: 'Convite para documentário',
    text: 'Uma produtora quer gravar um documentário sobre a sua trajetória.',
    weight: 5,
    when: { minFame: 55 },
    options: [
      {
        label: 'Aceitar (cachê de € 400 mil)',
        effects: { money: 400000, fame: 14, fitness: -4, text: 'Câmeras no seu dia a dia. Exposição máxima e conta gorda.' },
      },
      {
        label: 'Recusar e preservar a privacidade',
        effects: { happiness: 6, reputation: 3, text: 'Você diz que a história ainda está sendo escrita.' },
      },
    ],
  },

  // ------------------------------------------------------------ DINHEIRO
  {
    id: 'patrocinio_chuteira',
    category: 'negocios',
    icon: '👟',
    title: 'Proposta de patrocínio',
    text: 'Uma marca esportiva quer te vestir dos pés à cabeça.',
    weight: 8,
    when: { minFame: 25 },
    options: [
      {
        label: 'Assinar contrato longo e seguro',
        effects: { money: 150000, fame: 5, addFlag: 'patrocinio', text: 'Contrato assinado. Dinheiro garantido todo ano.' },
      },
      {
        label: 'Negociar por bônus de desempenho',
        check: { stat: 'charisma', difficulty: 55 },
        success: { money: 320000, fame: 8, reputation: 3, text: 'Você negociou duro e dobrou o valor com bônus por gol.' },
        failure: { money: 90000, reputation: -2, text: 'A marca não gostou da ganância e reduziu a oferta.' },
      },
      {
        label: 'Recusar e esperar algo maior',
        effects: { happiness: -2, text: 'Você aposta no futuro. Pode dar certo.' },
      },
    ],
  },
  {
    id: 'investimento',
    category: 'negocios',
    icon: '📈',
    title: 'Oportunidade de investimento',
    text: 'Um amigo de infância aparece com um negócio "imperdível".',
    weight: 8,
    when: { minMoney: 80000 },
    options: [
      {
        label: 'Investir pesado (€ 200 mil)',
        when: { minMoney: 200000 },
        check: { stat: 'intelligence', difficulty: 60 },
        success: { money: 500000, happiness: 10, intelligence: 3, text: 'O negócio decolou. Você triplicou o investimento.' },
        failure: { money: -200000, happiness: -12, intelligence: 2, text: 'Golpe. Você perdeu tudo que colocou e aprendeu na pior.' },
      },
      {
        label: 'Investir pouco para testar (€ 40 mil)',
        outcomes: [
          { chance: 0.5, effects: { money: 80000, happiness: 4, text: 'Rendeu bem. Lucro modesto, risco controlado.' } },
          { chance: 0.5, effects: { money: -40000, intelligence: 2, text: 'Não deu certo, mas a lição saiu barata.' } },
        ],
      },
      {
        label: 'Colocar em renda fixa chata',
        effects: { money: 20000, intelligence: 2, text: 'Rendimento previsível. Seu contador aprova.' },
      },
    ],
  },
  {
    id: 'carro_luxo',
    category: 'negocios',
    icon: '🏎️',
    title: 'A loja de carros ligou',
    text: 'Aquele esportivo que você sempre quis está reservado no seu nome.',
    weight: 7,
    when: { minMoney: 250000, minAge: 18 },
    options: [
      {
        label: 'Comprar (€ 250 mil)',
        effects: { money: -250000, happiness: 14, fame: 4, addFlag: 'carro_luxo', text: 'Garagem nova. A sensação é ótima (e o IPVA também vem).' },
      },
      {
        label: 'Comprar algo discreto (€ 60 mil)',
        effects: { money: -60000, happiness: 7, text: 'Carro bom, sem exageros. Seu empresário aplaude.' },
      },
      {
        label: 'Guardar o dinheiro',
        effects: { intelligence: 2, happiness: -2, text: 'Você fecha o site e volta a treinar.' },
      },
    ],
  },
  {
    id: 'caridade',
    category: 'negocios',
    icon: '❤️',
    title: 'Projeto social',
    text: 'A escolinha do seu bairro quer seu nome (e sua ajuda) para seguir funcionando.',
    weight: 7,
    when: { minMoney: 50000 },
    options: [
      {
        label: 'Financiar e aparecer nos treinos',
        effects: { money: -80000, happiness: 14, reputation: 12, fanRelation: 10, fame: 4, text: 'Você vira ídolo no bairro. Isso vale mais que troféu.' },
      },
      {
        label: 'Doar sem divulgação',
        effects: { money: -40000, happiness: 10, reputation: 5, text: 'Doação anônima. Só você e eles sabem.' },
      },
      {
        label: 'Só emprestar o nome',
        effects: { reputation: -4, fame: 2, text: 'Foto, post e nada mais. Alguém notou.' },
      },
    ],
  },

  // ------------------------------------------------------------ VESTIÁRIO
  {
    id: 'briga_vestiario',
    category: 'vestiario',
    icon: '🥊',
    title: 'Treta no vestiário',
    text: 'O capitão te cobra publicamente por falta de entrega no último jogo.',
    weight: 8,
    when: { hasClub: true },
    options: [
      {
        label: 'Aceitar a crítica e responder em campo',
        effects: { morale: 8, discipline: 4, skillPoints: 1, happiness: -3, text: 'Você engole o orgulho e promete resposta dentro de campo.' },
      },
      {
        label: 'Rebater na frente de todos',
        outcomes: [
          { chance: 0.45, effects: { morale: 6, reputation: 4, managerRelation: -6, text: 'Você se impôs e o grupo passou a te respeitar.' } },
          { chance: 0.55, effects: { morale: -14, managerRelation: -12, happiness: -8, text: 'Vestiário rachado. Você virou o problema.' } },
        ],
      },
      {
        label: 'Procurar o capitão depois, em particular',
        effects: { morale: 10, reputation: 5, managerRelation: 4, text: 'Conversa de homem para homem resolveu. Liderança é isso.' },
      },
    ],
  },
  {
    id: 'camisa_10',
    category: 'vestiario',
    icon: '🔟',
    title: 'A camisa vagou',
    text: 'O dono da camisa mais pesada do clube saiu. O roupeiro pergunta se você quer.',
    weight: 5,
    when: { hasClub: true, minOverall: 70 },
    options: [
      {
        label: 'Assumir o manto',
        effects: { fame: 8, fanRelation: 6, morale: 4, addFlag: 'camisa_pesada', text: 'Peso nas costas e holofote em cima. Você aceitou o desafio.' },
      },
      {
        label: 'Deixar para um companheiro mais experiente',
        effects: { morale: 6, reputation: 4, text: 'Gesto nobre, bem visto pelo grupo.' },
      },
    ],
  },
  {
    id: 'reserva_bronca',
    category: 'vestiario',
    icon: '🪑',
    title: 'Você no banco',
    text: 'Três jogos no banco. Seu empresário quer que você force uma conversa com o técnico.',
    weight: 8,
    when: { hasClub: true, benched: true },
    options: [
      {
        label: 'Conversar com respeito e pedir chance',
        check: { stat: 'charisma', difficulty: 50 },
        success: { managerRelation: 10, morale: 6, text: 'O técnico prometeu te usar no próximo jogo.' },
        failure: { managerRelation: -4, happiness: -6, text: 'Ele disse para você "mostrar no treino". Nada mudou.' },
      },
      {
        label: 'Trabalhar calado e esperar',
        effects: { discipline: 6, skillPoints: 1, happiness: -4, managerRelation: 3, text: 'Você vira o primeiro a chegar no CT. A comissão nota.' },
      },
      {
        label: 'Pedir para sair no mercado',
        effects: { managerRelation: -12, addFlag: 'pediu_saida', happiness: 3, text: 'Seu empresário já está ligando para outros clubes.' },
      },
    ],
  },

  // ------------------------------------------------------------- RISCOS
  {
    id: 'aposta',
    category: 'risco',
    icon: '🎲',
    title: 'Convite para apostar',
    text: 'Um conhecido oferece "palpite certeiro" em jogos da sua própria liga.',
    weight: 6,
    when: { minAge: 18 },
    options: [
      {
        label: 'Recusar na hora',
        effects: { discipline: 6, reputation: 3, text: 'Você corta o assunto. Sabe muito bem onde isso termina.' },
      },
      {
        label: 'Apostar escondido',
        outcomes: [
          { chance: 0.55, effects: { money: 60000, happiness: 6, addFlag: 'aposta', text: 'Deu certo. Dinheiro fácil... por enquanto.' } },
          { chance: 0.3, effects: { money: -80000, happiness: -10, text: 'Perdeu. E perdeu alto.' } },
          { chance: 0.15, effects: { money: -120000, reputation: -25, fame: 10, discipline: -20, injuryWeeks: 0, addFlag: 'investigado', text: 'Você foi flagrado. A federação abriu investigação e a imprensa caiu em cima.' } },
        ],
      },
    ],
  },
  {
    id: 'lesao_ignorada',
    category: 'saude',
    icon: '🩹',
    title: 'Dor na posterior',
    text: 'Você sente um incômodo na coxa na véspera de um jogo decisivo.',
    weight: 8,
    when: { hasClub: true },
    options: [
      {
        label: 'Avisar o departamento médico',
        effects: { health: 6, managerRelation: 2, fitness: 4, text: 'Preventivamente poupado. O corpo agradece.' },
      },
      {
        label: 'Ficar quieto e jogar',
        outcomes: [
          { chance: 0.5, effects: { morale: 6, fanRelation: 5, fitness: -8, text: 'Você jogou no sacrifício e ninguém notou. Herói silencioso.' } },
          { chance: 0.5, effects: { injuryWeeks: 5, health: -10, happiness: -12, text: 'A coxa rompeu no primeiro tempo. Cinco semanas fora.' } },
        ],
      },
    ],
  },
  {
    id: 'convite_duvidoso',
    category: 'risco',
    icon: '🚬',
    title: 'Noite perigosa',
    text: 'Em uma festa, alguém oferece algo que pode acabar com a sua carreira.',
    weight: 5,
    when: { minAge: 18 },
    options: [
      {
        label: 'Sair da festa imediatamente',
        effects: { discipline: 8, health: 3, reputation: 3, text: 'Você chama o motorista e vai embora. Melhor decisão da noite.' },
      },
      {
        label: 'Aceitar',
        outcomes: [
          { chance: 0.6, effects: { happiness: 4, health: -12, fitness: -10, discipline: -12, text: 'Ninguém viu, mas seu corpo sentiu por semanas.' } },
          { chance: 0.4, effects: { health: -14, reputation: -30, fame: 12, discipline: -20, addFlag: 'doping', text: 'Exame antidoping positivo. Escândalo nacional e suspensão a caminho.' } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------- DESENVOLVIMENTO
  {
    id: 'mentor',
    category: 'carreira',
    icon: '🧓',
    title: 'Um veterano te adota',
    text: 'Um ídolo do clube, no fim da carreira, oferece te ensinar o ofício.',
    weight: 7,
    when: { hasClub: true, maxAge: 24, once: true },
    options: [
      {
        label: 'Ficar na sombra dele',
        effects: { skillPoints: 3, intelligence: 6, morale: 6, potential: 2, text: 'Você aprende posicionamento, leitura de jogo e política de vestiário.' },
      },
      {
        label: 'Agradecer e seguir o próprio caminho',
        effects: { happiness: 4, text: 'Você prefere construir sozinho.' },
      },
    ],
  },
  {
    id: 'escola',
    category: 'carreira',
    icon: '🎓',
    title: 'Estudos',
    text: 'Você pode concluir os estudos à distância enquanto joga.',
    weight: 6,
    when: { maxAge: 26, flagForbidden: 'formado' },
    options: [
      {
        label: 'Estudar nas folgas',
        effects: { intelligence: 10, charisma: 4, happiness: -3, addFlag: 'formado', text: 'Diploma na parede. Serve para depois da bola.' },
      },
      {
        label: 'Deixar para depois da carreira',
        effects: { happiness: 3, text: 'Você foca só no futebol.' },
      },
    ],
  },
  {
    id: 'empresario_troca',
    category: 'carreira',
    icon: '🤝',
    title: 'Proposta de um super-empresário',
    text: 'Um agente famoso quer te representar, mas cobra comissão alta.',
    weight: 6,
    when: { minFame: 35 },
    options: [
      {
        label: 'Trocar de empresário',
        effects: { money: -50000, addFlag: 'super_agente', reputation: 4, text: 'Agora você tem quem abre portas na Europa. A comissão doeu.' },
      },
      {
        label: 'Manter quem te descobriu',
        effects: { happiness: 8, reputation: 6, text: 'Lealdade. Quem te levou do zero continua ao seu lado.' },
      },
    ],
  },
  {
    id: 'idioma',
    category: 'carreira',
    icon: '🗣️',
    title: 'Aula de idioma',
    text: 'Seu empresário sugere aprender outro idioma para facilitar uma transferência.',
    weight: 7,
    when: { maxAge: 33, flagForbidden: 'poliglota' },
    options: [
      {
        label: 'Estudar com professor particular (€ 15 mil)',
        when: { minMoney: 15000 },
        effects: { money: -15000, intelligence: 5, charisma: 6, addFlag: 'poliglota', text: 'Você já dá entrevista em outra língua. Clubes de fora notaram.' },
      },
      {
        label: 'Deixar para quando for preciso',
        effects: {},
      },
    ],
  },
  {
    id: 'torcida_organizada',
    category: 'torcida',
    icon: '📣',
    title: 'Organizada no CT',
    text: 'Depois de uma sequência ruim, a torcida organizada aparece no treino.',
    weight: 7,
    when: { hasClub: true, maxFanRelation: 55 },
    options: [
      {
        label: 'Ir conversar de frente',
        check: { stat: 'charisma', difficulty: 55 },
        success: { fanRelation: 18, reputation: 8, morale: 5, text: 'Você encarou, ouviu e prometeu entrega. Saiu aplaudido.' },
        failure: { fanRelation: -10, happiness: -10, text: 'A conversa azedou. Hostilidade garantida nos próximos jogos.' },
      },
      {
        label: 'Deixar a diretoria resolver',
        effects: { fanRelation: -5, happiness: -3, text: 'Você não aparece. A torcida interpretou como covardia.' },
      },
    ],
  },
  {
    id: 'homenagem_torcida',
    category: 'torcida',
    icon: '🏟️',
    title: 'Mosaico com seu nome',
    text: 'A torcida preparou um mosaico gigante com o seu rosto para o próximo jogo.',
    weight: 5,
    when: { minFanRelation: 75 },
    options: [
      {
        label: 'Retribuir com um vídeo emocionado',
        effects: { fanRelation: 8, happiness: 12, morale: 6, fame: 4, text: 'Arrepio geral. Você virou símbolo do clube.' },
      },
      {
        label: 'Agradecer discretamente',
        effects: { fanRelation: 4, happiness: 8, text: 'Agradecimento simples e sincero.' },
      },
    ],
  },
  {
    id: 'selecao_sonho',
    category: 'carreira',
    icon: '🌍',
    title: 'Sondagem de outra seleção',
    text: 'Você tem direito a outra nacionalidade e essa federação quer te convocar já.',
    weight: 4,
    when: { minOverall: 72, flagForbidden: 'trocou_selecao', maxCaps: 0, once: true },
    options: [
      {
        label: 'Esperar a seleção do seu país',
        effects: { happiness: 4, reputation: 3, text: 'Você aposta no sonho de infância.' },
      },
      {
        label: 'Aceitar a troca de seleção',
        effects: { addFlag: 'trocou_selecao', fame: 6, reputation: -4, text: 'Decisão polêmica, mas a convocação vem mais rápido.' },
      },
    ],
  },
  {
    id: 'pressao_renovacao',
    category: 'carreira',
    icon: '✍️',
    title: 'Clube quer renovar',
    text: 'A diretoria oferece renovação antecipada com aumento salarial moderado.',
    weight: 7,
    when: { hasClub: true, maxContractYears: 2 },
    options: [
      {
        label: 'Renovar e ganhar estabilidade',
        effects: { addFlag: 'renovou', happiness: 8, fanRelation: 6, managerRelation: 5, text: 'Contrato estendido. Você é peça do projeto.' },
      },
      {
        label: 'Segurar e esperar propostas melhores',
        effects: { managerRelation: -6, fanRelation: -5, happiness: -3, addFlag: 'segurou_renovacao', text: 'Você aposta no mercado. A torcida já desconfia.' },
      },
    ],
  },
  {
    id: 'saude_mental',
    category: 'saude',
    icon: '🧠',
    title: 'Peso na cabeça',
    text: 'A pressão está afetando seu sono e sua confiança.',
    weight: 8,
    when: { maxHappiness: 40 },
    options: [
      {
        label: 'Procurar acompanhamento psicológico',
        effects: { happiness: 16, morale: 6, intelligence: 3, attr: { composure: 2 }, text: 'Terapia semanal. A cabeça clareia e o jogo volta a fluir.' },
      },
      {
        label: 'Engolir e seguir',
        outcomes: [
          { chance: 0.4, effects: { happiness: 4, discipline: 3, text: 'Você segura a barra sozinho. Funcionou dessa vez.' } },
          { chance: 0.6, effects: { happiness: -10, fitness: -8, attr: { composure: -2 }, text: 'Você trava em campo. Rendimento desaba.' } },
        ],
      },
      {
        label: 'Tirar uns dias longe de tudo',
        effects: { happiness: 10, fitness: -4, managerRelation: -4, text: 'Uma semana offline. Voltou mais leve, mas o técnico estranhou.' },
      },
    ],
  },
  {
    id: 'tatuagem',
    category: 'vida',
    icon: '💉',
    title: 'Tatuagem nova',
    text: 'Você quer marcar na pele a sua história até aqui.',
    weight: 5,
    when: { minAge: 18, minMoney: 5000 },
    options: [
      {
        label: 'Fazer uma fechada no braço',
        effects: { money: -12000, happiness: 8, fame: 2, text: 'Braço fechado e muita foto no Instagram.' },
      },
      {
        label: 'Algo pequeno e pessoal',
        effects: { money: -2000, happiness: 6, text: 'Uma data discreta no punho.' },
      },
      {
        label: 'Deixar pra depois',
        effects: {},
      },
    ],
  },
  {
    id: 'videogame',
    category: 'vida',
    icon: '🎮',
    title: 'Madrugada de videogame',
    text: 'Você entra numa live com amigos e o relógio passa das 3h.',
    weight: 7,
    when: {},
    options: [
      {
        label: 'Jogar até amanhecer',
        effects: { happiness: 8, fitness: -9, text: 'Divertido. O treino da manhã não foi.' },
      },
      {
        label: 'Desligar e dormir',
        effects: { fitness: 5, discipline: 3, happiness: -1, text: 'Sono em dia. Corpo de atleta.' },
      },
    ],
  },
  {
    id: 'volta_as_origens',
    category: 'vida',
    icon: '🌳',
    title: 'Visita ao campinho',
    text: 'Você passa pelo campo de terra onde tudo começou.',
    weight: 6,
    when: {},
    options: [
      {
        label: 'Jogar uma pelada com a molecada',
        outcomes: [
          { chance: 0.85, effects: { happiness: 12, morale: 4, reputation: 5, text: 'Duas horas de pelada e sorriso no rosto. Lembrou por que começou.' } },
          { chance: 0.15, effects: { injuryWeeks: 2, happiness: -6, text: 'Torceu o tornozelo em buraco no campo. O clube não vai gostar.' } },
        ],
      },
      {
        label: 'Só tirar fotos e doar material',
        effects: { money: -8000, happiness: 8, reputation: 6, text: 'Bolas e chuteiras novas para a comunidade.' },
      },
    ],
  },
];

const BY_ID = new Map(LIFE_EVENTS.map((event) => [event.id, event]));

export const getLifeEvent = (id) => BY_ID.get(id);
