// Mais jeitos de contar os lances antigos (src/data/matchMoments.js), para o
// mesmo lance não parecer repetido. Para cada lance:
//   text    -> outras versões da situação
//   options -> [outra versão do acerto, outra versão do erro] de cada opção,
//              na mesma ordem das opções do lance

const VARIANTS = {
  cara_a_cara: {
    text: [
      'A zaga do {opponent} erra o tempo do impedimento e você sai sozinho na direção do gol.',
      'Você rouba a bola na intermediária e não tem mais ninguém entre você e o goleiro.',
    ],
    options: [
      ['Cruzado, rasteiro, sem defesa. Gol!', 'O goleiro estica a perna e salva.'],
      ['Toque sutil por cima. O goleiro só olha a bola entrar.', 'A cavadinha sai fraca e o goleiro pega de volta.'],
      ['Corte seco no goleiro e gol de gente grande.', 'Você demora no drible e o zagueiro volta para cortar.'],
      ['Generosidade: você serve {teammate}, que não perdoa.', 'O passe sai atrás do companheiro.'],
    ],
  },
  bola_na_meia_lua: {
    text: [
      'Rebote na meia-lua e a bola para no seu pé. O zagueiro vem fechando.',
      'Você recebe de frente para a área, com espaço para pensar só um segundo.',
    ],
    options: [
      ['Pancada de fora! O goleiro nem pula.', 'O chute explode no zagueiro.'],
      ['Tabela rápida e você aparece livre na área.', 'O companheiro não entende e a jogada morre.'],
      ['Corte para dentro, zagueiro no chão, espaço para chutar.', 'O zagueiro te derruba na entrada da área.'],
    ],
  },
  cruzamento_na_area: {
    text: [
      'Cruzamento da ponta, a bola vem fechando na marca do pênalti.',
      'Escanteio curto, cruzamento rápido, e a bola procura você na área.',
    ],
    options: [
      ['Cabeçada para baixo, quicando antes do goleiro. Gol!', 'A cabeçada sai fraca, nas mãos do goleiro.'],
      ['De sem-pulo, no ângulo. Que gol!', 'O voleio sai torto, pela linha de fundo.'],
      ['Calcanhar no tempo certo e o companheiro marca.', 'O calcanhar sai sem direção.'],
    ],
  },
  contra_ataque: {
    text: [
      'Contra-ataque rápido: você e {teammate} contra um zagueiro só.',
      'Bola roubada no meio e o campo inteiro pela frente. Dois contra um.',
    ],
    options: [
      ['Você atrai o zagueiro e solta na hora exata. Gol do companheiro!', 'O passe sai atrasado e o zagueiro corta.'],
      ['Finta, corpo, chute. Gol de quem resolve sozinho.', 'O zagueiro te espera e toma a bola.'],
    ],
  },
  falta_frontal: {
    text: [
      'Falta perto da meia-lua. A barreira se arma e o goleiro grita com ela.',
      'Bola parada na entrada da área. É sua.',
    ],
    options: [
      ['A bola passa por cima da barreira e morre na gaveta. Golaço!', 'A bola raspa o travessão e sai.'],
      ['Rasteira, por baixo do salto da barreira. Gol!', 'A bola bate no pé do último da barreira.'],
      ['Cruzamento na cabeça do companheiro, que testa para o gol.', 'O cruzamento sai longo demais.'],
    ],
  },
  penalti: {
    text: [
      'Pênalti para o {club}. Você ajeita a bola na marca e respira fundo.',
      'O estádio inteiro de pé. Você e o goleiro, frente a frente.',
    ],
    options: [
      ['Forte, no alto, sem chance. Gol!', 'Na trave! O pênalti não entra.'],
      ['O goleiro pula antes e você rola no outro canto. Gol!', 'Você demora demais e o goleiro adivinha.'],
      ['Cavadinha no meio do gol. O goleiro fica sentado olhando.', 'A cavadinha sai alta e fraca. O goleiro agradece.'],
      ['{teammate} pega a bola e assume a cobrança.', '{teammate} vai para a cobrança no seu lugar.'],
    ],
  },
  saida_de_bola: {
    text: [
      'Você recebe no meio com dois do {opponent} chegando nas costas.',
      'Bola no pé e a pressão deles chegando por todos os lados.',
    ],
    options: [
      ['Giro rápido e você deixa os dois para trás.', 'Você gira em cima do marcador e perde a bola.'],
      ['Toque de primeira e o time segue com a bola.', 'A devolução sai fraca e eles roubam.'],
      ['Lançamento por cima da pressão no pé do atacante.', 'O lançamento sai para fora.'],
    ],
  },
  duelo_meio: {
    text: [
      'Disputa no meio-campo: o volante do {opponent} chega para dividir com você.',
      'A bola fica viva no meio e os dois chegam juntos.',
    ],
    options: [
      ['Você chega com tudo e fica com a bola.', 'O árbitro marca falta sua.'],
      ['Leitura perfeita: você chega antes e sai jogando.', 'Você antecipa errado e fica para trás.'],
      ['Você recua, espera e fecha o caminho.', 'Ele avança no espaço que você deu.'],
    ],
  },
  transicao: {
    text: [
      'Você recebe de frente para o jogo, com o meio-campo do {opponent} desarrumado.',
      'Bola recuperada e espaço para correr. O time sobe com você.',
    ],
    options: [
      ['Você arranca e deixa o meio-campo deles para trás.', 'O volante te alcança e desarma.'],
      ['Passe entre os zagueiros e {teammate} sai na cara do gol.', 'O passe é interceptado pelo zagueiro.'],
      ['Toque para o lado, e o time se organiza com calma.', 'O toque sai mal e a bola vai para fora.'],
    ],
  },
  um_contra_um_defensivo: {
    text: [
      'O ponta do {opponent} entra na sua área driblando e parte para cima de você.',
      'Um contra um dentro da área. Qualquer erro vira pênalti.',
    ],
    options: [
      ['Você espera a finta e toma a bola limpo.', 'Ele passa com um corte e cruza.'],
      ['Carrinho na bola, sem tocar no atacante. Lindo.', 'O carrinho pega o pé dele. Pênalti!'],
      ['Corpo encostado e o atacante fica sem ângulo.', 'O árbitro vê empurrão e marca falta.'],
    ],
  },
  bola_aerea_defensiva: {
    text: [
      'Bola alçada na sua área e o atacante mais alto do {opponent} vem junto.',
      'Cruzamento na sua zona. Disputa pelo alto com o centroavante.',
    ],
    options: [
      ['Você sobe primeiro e tira de cabeça.', 'Ele sobe mais alto e cabeceia.'],
      ['Corpo a corpo vencido: ele nem consegue subir.', 'O VAR pega o agarrão. Pênalti!'],
    ],
  },
  saida_zaga: {
    text: [
      'O goleiro rola para você e o atacante do {opponent} vem pressionando.',
      'Saída de bola sob pressão. O centroavante deles fecha o passe fácil.',
    ],
    options: [
      ['Passe firme entre as linhas. Saída perfeita.', 'O passe é interceptado na frente da área.'],
      ['Chutão para longe. Sem risco nenhum.', 'A bola sai pela lateral.'],
      ['Drible no atacante e a torcida grita olé.', 'O atacante rouba dentro da sua área.'],
    ],
  },
  finalizacao_de_fora: {
    text: [
      'Chute forte de longe do {opponent}, a bola vem com efeito.',
      'O volante deles arrisca da intermediária. Bola veloz no seu canto.',
    ],
    options: [
      ['Voo no canto e mão firme: escanteio.', 'A bola passa por cima da sua mão e entra.'],
      ['Bola no peito, sem rebote nenhum.', 'A bola escapa e o atacante completa.'],
    ],
  },
  cara_a_cara_gol: {
    text: [
      'O atacante do {opponent} passa pela zaga e vem sozinho na sua direção.',
      'Erro no meio-campo e o atacante deles sai cara a cara com você.',
    ],
    options: [
      ['Você sai rápido e abafa o chute.', 'Ele toca por cima de você. Gol.'],
      ['Você espera até o fim e defende com o pé.', 'O chute sai rasteiro, no cantinho.'],
      ['Você se joga nos pés dele e fica com a bola.', 'Você chega atrasado e derruba. Pênalti.'],
    ],
  },
  cruzamento_gol: {
    text: [
      'Bola alçada na sua área com muita gente esperando a sobra.',
      'Cruzamento da direita, fechado na direção do gol.',
    ],
    options: [
      ['Soco firme para longe da área.', 'O soco sai curto e o atacante aproveita.'],
      ['Você encaixa no alto, com segurança.', 'A bola escorrega das suas mãos. Frango.'],
      ['Você grita, a zaga se arruma e afasta.', 'A zaga se perde e eles finalizam.'],
    ],
  },
  penalti_defender: {
    text: [
      'Pênalti contra. O batedor do {opponent} ajeita a bola e te encara.',
      'Você vai para a linha. O estádio inteiro esperando.',
    ],
    options: [
      ['Você acerta o canto e espalma! Pênalti defendido!', 'Você vai no canto errado. Gol.'],
      ['Paciência até o fim e a defesa com a ponta dos dedos.', 'O chute sai forte demais, no ângulo.'],
      ['Ele treme com a provocação e chuta para fora.', 'Ele te olha, sorri e marca.'],
    ],
  },
  recuo_pressao: {
    text: [
      'Recuo para você, com o atacante do {opponent} chegando rápido.',
      'O zagueiro devolve a bola e o centroavante deles corre na sua direção.',
    ],
    options: [
      ['Passe curto por baixo da pressão. Tranquilidade.', 'O atacante corta o passe e marca.'],
      ['Drible curto no atacante, dentro da área. Ousadia.', 'O atacante toma a bola e é gol.'],
      ['Bicão para a lateral e o perigo passa.', 'O chutão volta para eles no meio-campo.'],
    ],
  },
  reposicao_rapida: {
    text: [
      'Você pega a bola e vê o {opponent} inteiro no seu campo.',
      'Defesa feita e o contra-ataque está nas suas mãos.',
    ],
    options: [
      ['Lançamento longo na frente do atacante, que sai livre.', 'O lançamento cai no pé do zagueiro deles.'],
      ['Arremesso rápido com a mão e o time sai em velocidade.', 'O arremesso é interceptado no meio.'],
      ['Você segura a bola e o time respira.', 'O árbitro reclama da demora.'],
    ],
  },
  bola_nas_costas: {
    text: [
      'Bola longa nas costas da zaga e o atacante do {opponent} corre livre.',
      'Lançamento por cima da defesa. Só você pode chegar antes.',
    ],
    options: [
      ['Você sai como um líbero e corta antes dele.', 'Você chega um segundo atrasado e ele toca por cima.'],
      ['Bote limpo fora da área.', 'Você derruba o atacante fora da área.'],
      ['Você espera e defende o chute cruzado.', 'Ele escolhe o canto com calma.'],
    ],
  },
  barreira: {
    text: [
      'Falta perigosa para o {opponent}, na meia-lua.',
      'Bola parada contra, de frente para o gol. Hora de arrumar a barreira.',
    ],
    options: [
      ['Barreira firme, canto coberto, bola encaixada.', 'A bola passa pelo buraco da barreira.'],
      ['Barreira curta e defesa no reflexo.', 'O cobrador acha o canto livre.'],
    ],
  },
  goleiro_area: {
    text: [
      'Acréscimos, seu time perdendo e escanteio a favor. O banco manda você subir.',
      'Último lance e o técnico grita: goleiro na área!',
    ],
    options: [
      ['O goleiro marca! Cabeçada no último segundo!', 'A bola passa pela sua cabeça e alguém afasta.'],
      ['Você fica no gol e não sofre o contra-ataque.', 'O escanteio termina em nada.'],
    ],
  },
  ultimo_lance: {
    text: [
      'Acréscimos, última bola do jogo, e ela vem para você.',
      'O árbitro olha o relógio. Só dá tempo para mais uma jogada, e é sua.',
    ],
    options: [
      ['Chute e gol no último segundo! O estádio explode.', 'O chute sai fraco e o juiz apita o fim.'],
      ['Passe na medida e o companheiro marca no fim.', 'O passe é cortado e acaba o jogo.'],
    ],
  },
  provocacao: {
    text: [
      'Depois de uma falta, o marcador do {opponent} fala alguma coisa no seu ouvido.',
      'O adversário pisa no seu pé de propósito e ri.',
    ],
    options: [
      ['Você sorri e segue. Não vale a pena.', 'Você respira fundo e deixa para lá.'],
      ['Você encara e ele recua. Respeito ganho.', 'O empurrão vira cartão.'],
      ['Na próxima bola, caneta nele. Resposta dada.', 'A firula não sai e ele comemora.'],
    ],
  },
  cansaco: {
    text: [
      'A panturrilha começa a pesar. O preparador físico faz sinal do banco.',
      'Você está sem fôlego e o banco quer saber se você aguenta.',
    ],
    options: [
      ['Você pede para sair e é aplaudido.', 'Você deixa o campo.'],
      ['Você aguenta e ainda ajuda na marcação no fim.', 'A perna trava e você precisa sair de maca.'],
    ],
  },
};

const withExtra = (original, extra) => (extra ? [original, extra] : original);

/** Junta as versões extras a um lance antigo. */
export function withVariants(moment) {
  const extra = VARIANTS[moment.id];
  if (!extra) return moment;
  return {
    ...moment,
    text: [moment.text, ...(extra.text ?? [])],
    options: moment.options.map((option, index) => {
      const [success, failure] = extra.options?.[index] ?? [];
      return {
        ...option,
        success: option.success && { ...option.success, text: withExtra(option.success.text, success) },
        failure: option.failure && { ...option.failure, text: withExtra(option.failure.text, failure) },
      };
    }),
  };
}

export const VARIANT_IDS = Object.keys(VARIANTS);
