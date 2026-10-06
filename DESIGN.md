---
name: Craque do Zero
description: Jogo de carreira de futebol desenhado como um álbum de figurinhas sendo completado.
colors:
  paper: "#eceff3"
  sheet: "#fbfcfd"
  sheet-2: "#f2f4f7"
  ink: "#121722"
  ink-2: "#444c5c"
  ink-3: "#5e6677"
  rule: "#d3d9e2"
  rule-strong: "#b6bfcc"
  cover: "#1c3d9e"
  cover-2: "#16327f"
  cover-ink: "#ffffff"
  cover-ink-2: "#cdd7f6"
  sticker-paper: "#fdfdfb"
  sticker-ink: "#121722"
  accent: "#f6c600"
  accent-2: "#e2b400"
  accent-ink: "#1b1600"
  good: "#17804a"
  bad: "#c2352b"
  good-soft: "#e3f3ea"
  warn: "#a35f00"
  card-yellow: "#f6c600"
  card-red: "#c2352b"
  tier-elite: "#17804a"
  tier-otimo: "#4e9a2b"
  tier-bom: "#b39400"
  tier-medio: "#d07a10"
  tier-fraco: "#c2352b"
  tier-text-elite: "#146c3e"
  tier-text-otimo: "#3a7520"
  tier-text-bom: "#776300"
  tier-text-medio: "#9a5300"
  tier-text-fraco: "#ae2c23"
  foil-light: "#fff6d2"
  foil-mid: "#f6dc80"
  foil-deep: "#c99a1e"
  night-paper: "#0e1733"
  night-sheet: "#152148"
  night-ink: "#eef2fb"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.05
  number:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 800
    lineHeight: 1
  sticker-band:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.01em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  tag: "4px"
  sticker: "6px"
  control: "8px"
  surface: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "28px"
  xxl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.accent-2}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "46px"
  option:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  sticker:
    backgroundColor: "{colors.sticker-paper}"
    textColor: "{colors.sticker-ink}"
    rounded: "{rounded.sticker}"
    padding: "6px"
  sticker-face:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    rounded: "3px"
  topbar:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    height: "56px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "46px"
  rating-badge:
    textColor: "#ffffff"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  placard:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    rounded: "{rounded.surface}"
    padding: "18px 24px"
  placard-digit:
    backgroundColor: "{colors.sticker-paper}"
    textColor: "{colors.sticker-ink}"
    rounded: "{rounded.sticker}"
    padding: "2px 6px 0"
  placard-minute:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  final-card:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    rounded: "{rounded.surface}"
    padding: "16px"
  table-pos-zone:
    backgroundColor: "{colors.good-soft}"
    textColor: "{colors.good}"
    rounded: "{rounded.tag}"
    height: "1.7em"
---

# Design System: Craque do Zero

## Overview

A carreira é um álbum de figurinhas sendo completado. O jogador é uma figurinha; cada temporada completa vira uma figurinha colada num espaço numerado; títulos e prêmios viram figurinhas brilhantes; o que ainda falta aparece como espaço vazio com o número impresso.

É uma superfície de operação (o jogador conclui uma semana por vez), então a navegação, as abas, os botões e os campos são os padrões da web. O mundo do álbum entra por quatro vias apenas: tipografia, paleta, densidade e o movimento assinatura de colar figurinha.

O futebol entra pelo mesmo papel: o campo é desenhado em linhas de giz sobre a folha, o placar é uma placa de estádio impressa na capa cobalto, o próximo jogo é um ingresso com picote e os cartões da súmula são cartões de verdade. O gol é o único momento autoral de movimento; todo o resto é retorno curto que só toca quando o dado muda.

O padrão da categoria que este sistema recusa: tela escura de estádio, verde neon e cartões translúcidos. A versão anterior do jogo era exatamente isso.

**Key Characteristics:**

- Papel branco frio, capa cobalto chapada com retícula, amarelo racionado.
- Figurinhas com a mesma mobília fixa: número, nome na faixa, clube ou posição, uma linha de dado.
- Números grandes em algarismos tabulares como título da informação.
- Futebol desenhado como impressão: giz no papel, placa de estádio, ingresso, cartões.
- Movimento que toca uma vez por mudança real de dado, nunca em laço.

## Colors

Estratégia: papel neutro tingido de frio, uma capa cobalto que comanda o topo e as faces das figurinhas, e amarelo reservado à ação principal.

### Primary

- **Capa cobalto** (`cover`, `#1c3d9e`): barra superior, placar, face das figurinhas, capa da tela de entrada, abas ativas, foco no modo claro. Sempre chapado, com retícula impressa de pontos brancos a 7 a 14% de opacidade.

### Secondary

- **Amarelo de ação** (`accent`): só o botão principal de cada tela, o minuto do placar, a sigla do seu time no placar, seus artilheiros no placar, o preenchimento do relógio do jogo, o ícone do seu gol na súmula, os pontos de evolução e a seleção de texto. O rastro da bola no gol usa o tom mais fundo (`accent-2`). Se aparece em mais de um botão por tela, um deles está errado.

### Tertiary

- **Brilho dourado** (`foil-*`): gradiente de 135 graus entre `#fff6d2`, `#f6dc80` e `#c99a1e`. Só em figurinhas especiais: títulos, prêmios, conquistas e a figurinha de legado. É o único gradiente do sistema, e existe porque a figurinha brilhante é um material real do álbum.

### Neutral

- **Papel** (`paper`, `#eceff3`): fundo da página. Branco frio, nunca creme.
- **Folha** (`sheet`, `#fbfcfd`): superfícies de trabalho (o passo atual da semana, formulários).
- **Tinta** (`ink`, `#121722`) com `ink-2` e `ink-3` para hierarquia. `ink-3` mede 5,05:1 sobre o papel.
- **Papel da figurinha** (`sticker-paper`, `#fdfdfb`): branco de dia e de noite.

### Cores do futebol

- **Cartão amarelo** (`card-yellow`) e **cartão vermelho** (`card-red`): só na marca de cartão da súmula. São o significado do próprio futebol, não da paleta: não mudam à noite e não são reaproveitados como estado. O amarelo coincide com `accent` no valor, mas não no papel.
- **Zona de classificação** (`good` sobre `good-soft`): a posição na tabela dos clubes que vão ao torneio continental.

### Escala de qualidade

Cinco degraus para atributos, notas e chances: `elite`, `otimo`, `bom`, `medio`, `fraco`. Há duas versões de cada cor:

- `tier-*`: preenchimento de barras, legível como forma.
- `tier-text-*`: texto e selos de nota, todos com contraste de pelo menos 4,86:1 sobre papel e figurinha.

### Named Rules

- **Figurinha é papel branco.** Dentro de `.sticker` e `.card-sticker` a escala de texto é sempre a do dia, inclusive no modo noturno.
- **À noite o fundo vira a capa.** O modo noturno troca papel e folha por azul-marinho (`#0e1733`, `#152148`), tinta por `#eef2fb`, e o amarelo passa a marcar foco e abas ativas. As figurinhas não mudam.
- **Nada de cinza em superfície colorida.** Texto secundário sobre a capa usa `cover-ink-2`, tingido do próprio azul.

## Typography

Barlow e Barlow Condensed, hospedadas em `assets/fonts/` (licença OFL). A condensada é a voz do álbum: nomes nas faixas das figurinhas, títulos, números grandes. A Barlow regular é a voz da interface: textos, rótulos, botões.

### Hierarchy

- **Display** (Barlow Condensed 800, até 3rem): título da tela. Na capa chega a 5,6rem em caixa alta.
- **Heading** (Barlow Condensed 700, 1,3rem): títulos de seção.
- **Number** (Barlow Condensed 800, 1,9rem, algarismos tabulares): todos os números que importam. O número é o título da informação. No placar de estádio os gols sobem para 2,6rem e no placar final para 3rem.
- **Sticker band** (Barlow Condensed 800, caixa alta): nome na faixa da figurinha.
- **Body** (Barlow 400, 16px, 1,5): textos e narração, limitados a 62 caracteres por linha.
- **Label** (Barlow 600, 0,9rem): rótulos de campo e de dado.
- **Placa** (Barlow Condensed 700, 0,95rem): o tempo do jogo no placar ("1º tempo", "2º tempo", "Fim de jogo") e o divisor do apito final na súmula.
- **Número da camisa** (Barlow Condensed 800, em cobalto): o número do jogador estampado na camisa do avatar.

### Named Rules

- **Todo número em algarismos tabulares.** Use `.num` ou a família condensada; os números nunca dançam ao mudar.
- **Caixa alta só na faixa da figurinha e na capa.** Títulos e rótulos ficam em caixa de frase.
- **Sem rótulo acima de título.** O título carrega o próprio peso.

## Layout

- Container de até 1200px, com 16px de margem no celular e 28px a partir de 760px.
- Hub no computador: coluna fixa de 300px com a figurinha do jogador e os indicadores, e coluna de trabalho com abas. No celular a figurinha vira uma ficha horizontal no topo.
- Partida no computador: lance no centro e coluna de 340px com seu jogo e a narração.
- Grupos apertados (8 a 12px), separação generosa entre seções (24 a 28px).
- Listas separadas por filetes de 1px, não por cartões.
- No celular, propostas viram carrossel horizontal com encaixe.
- Partida a partir de 980px: o lance e o desfecho viram duas colunas (campo à esquerda, 1,15fr; texto e opções à direita, 1fr; 28px entre elas). Abaixo disso o campo fica acima do texto, com até 340px de largura.
- Placar de estádio: no celular gruda abaixo da barra (topo de 56px) e sangra até a borda; a partir de 760px é uma superfície com raio de 12px que rola com a página. Até 520px os artilheiros somem do placar.
- Tabela: colunas secundárias somem até 520px.

## Elevation & Depth

Uma fonte de luz, de cima. Cada elemento declara elevação uma vez: sombra ou borda, nunca as duas.

### Shadow Vocabulary

- `shadow-sticker`: `0 1px 1px` mais `0 5px 12px -6px` em tinta a 8 e 28%. A figurinha encostada no papel.
- `shadow-lift`: `0 18px 32px -14px`. A figurinha no ar, antes de ser colada; também modais e avisos flutuantes.
- `shadow-panel`: `0 1px 2px`. Folhas de trabalho.

### Named Rules

- **Sem sombra dura deslocada.** O mundo é papel impresso, não neobrutalismo.
- **Sem vidro.** Nenhum `backdrop-filter`.
- **O campo não tem profundidade.** Linhas de giz sobre a folha, sem gramado, sem perspectiva, sem sombra.

## Shapes

- Figurinha: 6px, com a foto interna em 3px.
- Controles (botões, campos, opções): 8px.
- Superfícies (folhas, capa, placar no computador): 12px.
- Pílula (999px) só em controles pequenos: passos da semana e etiquetas de traço.
- Etiqueta (`tag`, 4px): selos e marcas pequenas de dado: nota, minuto do placar e do lance, etiquetas, posição na tabela e monograma da tabela.
- Ingresso: o picote é uma linha tracejada de 1,5px com dois recortes semicirculares de 18px na cor do papel, um em cada borda.
- Campo: traço de 1,5px que não escala com o desenho (`vector-effect: non-scaling-stroke`), cantos arredondados nas junções.

## Components

### Buttons

- **Principal:** amarelo, texto `accent-ink`, 46px de altura, uma sombra interna de 2px que some ao apertar (o botão desce 2px).
- **Secundário:** contorno de 1,5px em tinta, fundo transparente.
- **Discreto:** sem borda, para ações secundárias como "Pular o treino".
- **Perigo:** contorno vermelho, para aposentadoria.
- Rótulos de 1 a 3 palavras. Quando o contexto exige o nome completo, ele vai no `aria-label`.

### Cards / Containers

Não há cartão genérico. Os contêineres são:

- **Folha** (`.sheet`): a área do passo atual.
- **Figurinha do jogador** (`.sticker`): foto com retícula, número do overall, sigla da posição, faixa com o nome, linha com país e clube.
- **Figurinha de clube ou temporada** (`.card-sticker`): face cobalto com a sigla e um número grande, faixa com o nome, verso com os dados separado por linha tracejada.
- **Espaço vazio** (`.slot`): borda de 1,5px, número impresso grande em `rule-strong`, rótulo do que falta. O conteúdo começa no topo, a 40px da borda, para que os números de espaços vizinhos fiquem na mesma linha de base, como no álbum impresso.
- **Placar final** (`.final-card`): a placa de estádio fechada no pós-jogo. Capa cobalto com retícula, cabeçalho com a competição e "Fim de jogo", os dois times com monograma e artilheiros, o placar grande no centro, e um rodapé separado por linha tracejada com o resultado e a sua nota. Vitória pinta o resultado de amarelo.
- **Ingresso** (`.ticket`): o próximo jogo é um ingresso. A folha leva o confronto acima do picote e a leitura do adversário abaixo dele.

### Inputs / Fields

Rótulo acima, 46px de altura, borda de 1,5px. Foco: borda cobalto e halo de 3px (amarelo à noite). Controles deslizantes usam a cor de destaque do tema.

### Navigation

Abas padrão com sublinhado de 3px que cresce a partir do centro. No celular as cinco abas cabem sem rolar, sem ícones.

### Tabela

Linhas com filete, algarismos tabulares, sua linha em `info-soft` e negrito. A posição fica numa etiqueta de 4px; os clubes que vão ao torneio continental ganham a etiqueta verde da zona de classificação, explicada por uma legenda abaixo da tabela. O motor do jogo não tem rebaixamento, então a tabela marca só a zona de classificação continental; não há zona vermelha.

### Opções de escolha

Treinos, eventos, lances e traços usam a mesma linha de escolha (`.option`): ícone em círculo, título, descrição e a consequência. No treino a consequência são os efeitos (Forma +7, Felicidade -2); no lance é a chance real em número grande colorido pela escala.

### Propostas

Cada proposta é uma figurinha de clube com o botão no verso. Só a renovação com o clube atual recebe o botão principal amarelo; as demais usam o botão secundário, para que a tela tenha uma única ação amarela.

### Campo

Um só desenho de campo serve a três usos. É o campo de 105 por 68 em linhas de giz (`rule-strong`, 1,5px) sobre `sheet-2`, com as marcas reais (meio, círculo central, áreas, meia-lua, pênaltis, escanteios) e os dois gols fora da linha de fundo; o gol adversário tem rede.

- **Lance:** uma faixa cobalto a 10% marca a zona do lance (sua área, defesa, meio, área adversária) e a bola, em tinta com contorno de folha, fica no ponto do lance.
- **Gol:** a bola viaja por um rastro amarelo-fundo até a rede; a rede e a trave adversária escurecem para tinta.
- **Posições** (criação do jogador): círculos de folha com a sigla da posição; a escolhida vira cobalto com texto branco e cresce.

### Placar de estádio

A capa cobalto com retícula. Os gols ficam em placas de papel de figurinha (raio 6px, sombra interna de 2px na base), o minuto numa etiqueta amarela entre elas, e abaixo o tempo do jogo e a competição. Sob cada time, os artilheiros em Barlow 500 de 0,8rem; os seus em amarelo. Na base, o relógio do jogo: uma barra de 3px de 0 a 90 minutos, preenchida em amarelo, com um tique no intervalo (45 minutos).

### Súmula

Lances em linha com ícone em círculo de 28px, verde ou vermelho conforme o lance foi bom ou ruim. Gol seu: ícone em amarelo e texto em negrito. Cartões aparecem como um cartão de verdade, 11 por 15px, levemente girado, nas cores do cartão. O apito final é um divisor: filetes dos dois lados do texto em Barlow Condensed, com ícone de cronômetro.

### Avatar

O número da camisa é estampado no peito do avatar, em Barlow Condensed 800 cobalto.

### Movimento

**Colar figurinha (assinatura).** Toda figurinha nova entra pressionada no lugar: de escala 1,06, giro de -2 graus e 6px acima, com sombra `lift`, até assentar em `sticker`; a opacidade chega a 1 aos 35%. Dura 620ms em `ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`), e em grupo cada figurinha atrasa 90ms. O contrato de direção previa 1,04 e -1,5 grau; o que foi construído é 1,06 e -2 graus, e vale o construído. Nas figurinhas brilhantes um reflexo atravessa uma vez, 1100ms depois de 380ms.

**Memória de movimento.** A interface é remontada inteira a cada ação, então cada animação toca uma vez, só quando o dado que ela representa muda de verdade (`src/ui/motion.js`):

- `is-new`: cola na primeira vez que aparece nesta tela; nas remontagens seguintes fica quieta.
- `data-pulse` com `data-value`: quando o valor muda recebe `is-changed`, `data-dir` (`up` ou `down`) e `--from` (o valor antigo), para que barras e relógio andem do antigo ao novo.
- `data-count`: o número sobe contando por 600ms, como placar eletrônico (o overall da figurinha).
- `data-moment`: momentos únicos (o desfecho de um lance) tocam uma vez por chave; ao remontar recebem `is-settled` e ficam parados.
- Uma ação pode remontar a tela duas vezes seguidas; o que mudou dentro de 120ms continua animando na segunda montagem.

**Retornos curtos** (até 320ms, só quando o dado muda): a bola rola até o ponto do lance (460ms), as opções entram em sequência de 50ms, o desfecho se revela de cima para baixo (320ms), a nota carimba, o número da figurinha pisca em amarelo ao subir, os medidores e o relógio do jogo andam do valor antigo ao novo (520ms), lances novos da súmula entram pela esquerda, o placar final carimba ao aparecer.

**O gol.** É o único momento autoral, e cada passo espera o anterior: a bola corre pelo rastro até a rede (120ms de atraso, 560ms), a rede estufa (aos 640ms), o título "Gol!" carimba (aos 620ms, 300ms), então o número do placar vira como placa de estádio (aos 720ms, só quando o desfecho na tela é o seu gol) e a linha do artilheiro e o gol na súmula aparecem (aos 760ms). Fora do seu gol, o placar vira na hora (440ms).

**Troca de tela.** Tela, aba e nova semana usam transição de visualização: a página antiga some em 140ms e a nova chega subindo 8px em 280ms (180ms entre abas). A barra superior e a figurinha do jogador ficam no lugar. Sem suporte, a troca é seca.

**Movimento reduzido.** Sem deslocamento, giro, escala, contagem ou transição de página. Ficam só as trocas de cor e opacidade que confirmam a ação: o placar e a nota realçam em amarelo por 600ms, e o título do gol aparece por opacidade.

## Do's and Don'ts

### Do:

- Mostrar a consequência de cada escolha antes de ela ser feita.
- Usar figurinha para entidades (jogador, clube, temporada, conquista) e linhas simples para todo o resto.
- Mostrar o que falta como espaço numerado vazio.
- Usar ícones Phosphor de `src/ui/icons.js`, extraídos do pacote oficial.
- Desenhar o futebol como impressão: campo em giz, placa de estádio, ingresso, cartão de verdade.
- Ligar toda animação de entrada ou de mudança à memória de movimento, para que toque uma vez por mudança real.
- Manter em movimento reduzido só a cor e a opacidade que confirmam a ação.

### Don't:

- Não usar emoji como ícone nem bandeira emoji (vira letras no Windows); o país aparece pelo código (BRA).
- Não usar travessão em texto visível.
- Não inventar cores de clube nem escudos. O clube aparece pela sigla.
- Não pôr amarelo em mais de uma ação por tela.
- Não usar gradiente fora da figurinha brilhante (a retícula de pontos da capa é textura de impressão, não gradiente de cor).
- Não desenhar gramado, listras de grama ou campo em perspectiva.
- Não animar em laço nem bloquear o clique com animação.
- Não marcar zona de rebaixamento: o jogo não tem rebaixamento.
- Não usar as cores dos cartões fora da marca de cartão.
