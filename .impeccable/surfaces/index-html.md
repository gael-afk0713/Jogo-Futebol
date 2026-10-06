---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["assets/css/style.css","src/ui"]
---

# Superfície: jogo inteiro (hub, partida, criação, fim de temporada)

Modo: Operate. O jogador completa uma semana da carreira por vez: escolhe treino, responde a um evento, decide lances da partida, avança. Celular e computador com o mesmo peso.

## Direction contract

THESIS: A carreira é um álbum de figurinhas sendo completado. Cada temporada, título e prêmio é uma figurinha colada no seu espaço numerado, e o que ainda falta aparece como espaço vazio com o número impresso. Recusa o padrão da categoria: tela escura de estádio, verde neon e cartões translúcidos.

OWN-WORLD: Papel de álbum branco frio com retícula impressa só na capa. Capa azul-cobalto chapada no topo. Figurinhas com borda branca, faixa de nome em caixa alta condensada e número grande em algarismos tabulares. Brilho dourado só nas figurinhas especiais (títulos e prêmios). Tinta quase preta. Amarelo reservado à ação principal. Barlow e Barlow Condensed hospedadas no projeto. Ícones Phosphor. Raio 12px nas superfícies, 6px nas figurinhas. À noite, o fundo vira a capa e as figurinhas continuam brancas.

STORY: O jogador vê quem é (a própria figurinha), o que fazer agora (o passo da semana) e o que já conquistou (o álbum). Decide, vê a consequência colada na página e avança.

FIRST VIEWPORT: Hub. Barra cobalto de 56px com o nome do jogo e o estado do save. Computador: coluna esquerda fixa de 320px com a figurinha do jogador (avatar, overall como número da figurinha, nome, posição, clube) e os indicadores de vida; coluna direita com as abas padrão, o indicador de passos da semana e o passo atual, com a ação principal amarela visível sem rolar. Celular: figurinha horizontal compacta no topo, abas roláveis, passo atual logo abaixo.

FORM: Álbum de figurinhas da Copa, primeiro da lista ordenada (escolha do usuário), seed 03c0e612. Movimento assinatura: colar figurinha. Todo ganho entra como figurinha pressionada no lugar (escala 1.04 para 1, giro de -1.5 grau para 0, sombra que assenta), uma vez por evento, desligado em movimento reduzido. Ganhos herdados dos desafiantes recusados: números como título em algarismos tabulares; cor chapada em campos inteiros, sem gradiente nem vidro; estados como marcas impressas (indisponível riscado, vazio numerado); toda figurinha com a mesma mobília fixa (número, nome, clube ou posição, uma linha de dado); amarelo racionado.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
