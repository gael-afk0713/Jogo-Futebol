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
  warn: "#a35f00"
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
    rounded: "4px"
    padding: "2px 8px"
---

# Design System: Craque do Zero

## Overview

A carreira é um álbum de figurinhas sendo completado. O jogador é uma figurinha; cada temporada completa vira uma figurinha colada num espaço numerado; títulos e prêmios viram figurinhas brilhantes; o que ainda falta aparece como espaço vazio com o número impresso.

É uma superfície de operação (o jogador conclui uma semana por vez), então a navegação, as abas, os botões e os campos são os padrões da web. O mundo do álbum entra por quatro vias apenas: tipografia, paleta, densidade e o movimento assinatura de colar figurinha.

O padrão da categoria que este sistema recusa: tela escura de estádio, verde neon e cartões translúcidos. A versão anterior do jogo era exatamente isso.

## Colors

Estratégia: papel neutro tingido de frio, uma capa cobalto que comanda o topo e as faces das figurinhas, e amarelo reservado à ação principal.

### Primary

- **Capa cobalto** (`cover`, `#1c3d9e`): barra superior, placar, face das figurinhas, capa da tela de entrada, abas ativas, foco no modo claro. Sempre chapado, com retícula impressa de pontos brancos a 7 a 14% de opacidade.

### Secondary

- **Amarelo de ação** (`accent`, `#f6c600`): só o botão principal de cada tela, o minuto do placar, a sigla do seu time no placar, os pontos de evolução e a seleção de texto. Se aparece em mais de um botão por tela, um deles está errado.

### Tertiary

- **Brilho dourado** (`foil-*`): gradiente de 135 graus entre `#fff6d2`, `#f6dc80` e `#c99a1e`. Só em figurinhas especiais: títulos, prêmios, conquistas e a figurinha de legado. É o único gradiente do sistema, e existe porque a figurinha brilhante é um material real do álbum.

### Neutral

- **Papel** (`paper`, `#eceff3`): fundo da página. Branco frio, nunca creme.
- **Folha** (`sheet`, `#fbfcfd`): superfícies de trabalho (o passo atual da semana, formulários).
- **Tinta** (`ink`, `#121722`) com `ink-2` e `ink-3` para hierarquia. `ink-3` mede 5,05:1 sobre o papel.
- **Papel da figurinha** (`sticker-paper`, `#fdfdfb`): branco de dia e de noite.

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
- **Number** (Barlow Condensed 800, 1,9rem, algarismos tabulares): todos os números que importam. O número é o título da informação.
- **Sticker band** (Barlow Condensed 800, caixa alta): nome na faixa da figurinha.
- **Body** (Barlow 400, 16px, 1,5): textos e narração, limitados a 62 caracteres por linha.
- **Label** (Barlow 600, 0,9rem): rótulos de campo e de dado.

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

## Elevation & Depth

Uma fonte de luz, de cima. Cada elemento declara elevação uma vez: sombra ou borda, nunca as duas.

### Shadow Vocabulary

- `shadow-sticker`: `0 1px 1px` mais `0 5px 12px -6px` em tinta a 8 e 28%. A figurinha encostada no papel.
- `shadow-lift`: `0 18px 32px -14px`. A figurinha no ar, antes de ser colada; também modais e avisos flutuantes.
- `shadow-panel`: `0 1px 2px`. Folhas de trabalho.

### Named Rules

- **Sem sombra dura deslocada.** O mundo é papel impresso, não neobrutalismo.
- **Sem vidro.** Nenhum `backdrop-filter`.

## Shapes

- Figurinha: 6px, com a foto interna em 3px.
- Controles (botões, campos, opções): 8px.
- Superfícies (folhas, capa, placar no computador): 12px.
- Pílula (999px) só em controles pequenos: passos da semana e etiquetas de traço.

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
- **Espaço vazio** (`.slot`): borda de 1,5px, número impresso grande em `rule-strong`, rótulo do que falta.

### Inputs / Fields

Rótulo acima, 46px de altura, borda de 1,5px. Foco: borda cobalto e halo de 3px (amarelo à noite). Controles deslizantes usam a cor de destaque do tema.

### Navigation

Abas padrão com sublinhado de 3px que cresce a partir do centro. No celular as cinco abas cabem sem rolar, sem ícones.

### Opções de escolha

Treinos, eventos, lances e traços usam a mesma linha de escolha (`.option`): ícone em círculo, título, descrição e a consequência. No treino a consequência são os efeitos (Forma +7, Felicidade -2); no lance é a chance real em número grande colorido pela escala.

### Colar figurinha (movimento assinatura)

Toda figurinha nova entra pressionada no lugar: escala de 1,06 para 1, giro de -2 para 0 graus, sombra `lift` que assenta em `sticker`, 620ms em `cubic-bezier(0.16, 1, 0.3, 1)`. Em grupo, cada figurinha atrasa 90ms. Usado quando o overall sobe, quando chegam propostas, na figurinha da temporada e nas brilhantes. Desligado com movimento reduzido.

## Do's and Don'ts

### Do:

- Mostrar a consequência de cada escolha antes de ela ser feita.
- Usar figurinha para entidades (jogador, clube, temporada, conquista) e linhas simples para todo o resto.
- Mostrar o que falta como espaço numerado vazio.
- Usar ícones Phosphor de `src/ui/icons.js`, extraídos do pacote oficial.

### Don't:

- Não usar emoji como ícone nem bandeira emoji (vira letras no Windows); o país aparece pelo código (BRA).
- Não usar travessão em texto visível.
- Não inventar cores de clube nem escudos. O clube aparece pela sigla.
- Não pôr amarelo em mais de uma ação por tela.
- Não usar gradiente fora da figurinha brilhante.
