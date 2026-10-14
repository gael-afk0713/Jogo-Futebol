# Avaliações do jogo

Revisão de 14 de outubro de 2026, feita por cinco revisores independentes, cada um no seu navegador de teste, jogando sem conta (nada foi salvo no Firebase) e sem mexer no código.

- **Impeccable A, revisão de design:** heurísticas de Nielsen, carga cognitiva, jornada emocional e personas.
- **Impeccable B, detector e medições:** o scanner automático da impeccable mais medições de contraste, alvos de toque, fontes e cortes.
- **Diretor de arte:** originalidade, personalidade e a promessa do álbum de figurinhas.
- **Caçador de bugs:** iPad Air, mini e Pro em retrato e paisagem, celular, giro de tela, toques duplos e casos extremos.
- **Jogador de 14 anos:** jogou do zero no iPad em retrato, só tocando nos botões, e contou o que sentiu.

Material: 17 telas (carregamento, entrada, criação, peneiras, hub com as cinco abas, evento, partida, gol, pós-jogo, fim de temporada e aposentadoria) em iPad retrato (820x1180), iPad paisagem (1180x820), celular (390x844) e tema escuro.

## Resumo das notas (0 a 100)

| Revisor | Originalidade | Personalidade | Harmonia | Beleza e acabamento | Clareza | Conforto no iPad | **Geral** |
|---|---|---|---|---|---|---|---|
| Impeccable A (design) | 74 | 64 | 69 | 60 | 61 | 57 | **64** |
| Impeccable B (detector) | | | 73 | 67 | 71 | 60 | **65** |
| Diretor de arte | 58 | 55 | 66 | 60 | | | **58** |
| Caçador de bugs | | | | 72 | | 56 | **64** |
| Jogador de 14 anos | | 68 | | 73 | 58 | | **56** |
| **Média** | **66** | **62** | **69** | **66** | **63** | **58** | **61** |

Outras notas:

| Nota | Valor | Revisor |
|---|---|---|
| Heurísticas de Nielsen | 25 de 40 (aceitável) | Impeccable A |
| Qualidade técnica do visual | 57 | Impeccable B |
| Coerência entre telas | 60 | Diretor de arte |
| Tema escuro | 38 | Diretor de arte |
| Robustez | 64 | Caçador de bugs |
| Primeira impressão | 74 | Jogador de 14 anos |
| Emoção e recompensa | 45 | Jogador de 14 anos |
| Diversão e vontade de jogar mais | 47 | Jogador de 14 anos |

---

## 1. Impeccable A: revisão de design (nota geral 64)

### Especificidade do design

**Veredito: a casca é feita para este produto, o miolo poderia ser de qualquer app.**

As peças que só servem a este jogo: a abertura com espaços numerados que viram figurinhas; a capa cobalto com retícula; a figurinha do jogador; o ingresso com picote do próximo jogo; a placa de estádio e o placar final; o campo em giz; os espaços vazios numerados do Álbum. Nenhum outro produto usaria essas peças sem mudar nada, e elas recusam de fato o visual escuro com verde neon da categoria.

O problema é que o álbum para na porta das telas mais usadas. Na lista de treinos, nas duas lojas (17 e 20 itens), nas 28 barras de atributo e nos 11 medidores da Vida, a interface vira "linha + etiquetas coloridas + botão Comprar". Isso caberia num app de finanças ou num RPG genérico. Mais da metade dos pixels que o jogador vê toda semana não tem nada de álbum.

### Heurísticas de Nielsen

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | Os passos Treino/Vida/Partida, o "Salvo no navegador" e o desfecho depois de cada escolha funcionam. Mas os pontos a gastar não aparecem na aba Atributos, e no seu gol o número do placar some por 720 ms. |
| 2 | Linguagem do mundo real | 2 | O vocabulário de bola é bom (peneira, meia-lua, cavar, tabela). Porém: "Gol do Ponte Preta", "contra o Portuguesa", "O Chapecoense", "vitrine na Brasileirão Série B" (`src/engine/match.js:281,287`, `src/engine/transfers.js:116`). Salários em euro no Flamengo Sub-20. "Golden Boy" em inglês. O medidor "Técnico" (confiança do treinador) se confunde com técnica. |
| 3 | Controle e liberdade | 2 | Não existe desfazer. O toque numa linha de treino já confirma o treino. "Simular até o fim da temporada" queima a temporada num toque. |
| 4 | Consistência | 3 | O sistema é coeso, mas quebra a própria regra do amarelo: dois botões amarelos na entrada e etiquetas amarelas que não são ação ("€ 2,6 mil em conta", "11 pontos para gastar"). A mesma figurinha de clube mostra "PLANTEL" (força do clube) nas propostas e "OVERALL" (a sua) na temporada. |
| 5 | Prevenção de erros | 2 | Há confirmação para compra grande e aposentadoria. Não há para "Simular até o fim", para "Assinar" proposta nem para começar com 26 pontos de criação sem gastar. |
| 6 | Reconhecer em vez de lembrar | 3 | O preparador recomenda e a consequência fica na linha. Mas os ícones da barra superior não têm rótulo, e o aviso do cadeado manda ir à "loja (aba Atributos)". |
| 7 | Flexibilidade e eficiência | 3 | Simular partida, 4 semanas, temporada, modo rápido e "Treinar" num toque. Em compensação, cada lance pede 2 toques (escolher e depois "Continuar o jogo"). |
| 8 | Estética e minimalismo | 2 | Atributos e Vida têm cerca de 3800 px cada. A Vida repete os 4 medidores do topo. Cada treino tem um cadeado. Cada gol seu aparece em duas linhas da narração. |
| 9 | Recuperação de erros | 3 | O "Falta: nome e sobrenome, 2 traços." é exemplar. Já "Você não jogou" não explica como passar a jogar. |
| 10 | Ajuda | 2 | O preparador e as dicas da abertura ajudam. Os traços não dizem o que fazem em número ("Passar por você custa caro.") e não há explicação de overall nem de chance. |
| | **Total** | **25/40** | **Aceitável (20 a 27):** base boa, mas precisa de melhorias grandes antes de agradar. |

### Carga cognitiva

Checklist dos 8 itens:

- Foco único: passa na Semana, falha em Atributos e Vida, onde a loja engole a aba.
- Blocos de até 4: falha. Grupo "Evoluir" com 7 treinos, 14 traços, 11 medidores na Vida.
- Agrupamento: passa (Evoluir/Recuperar, grupos de atributo).
- Hierarquia visual: passa no ciclo semanal, falha em Atributos (duas etiquetas amarelas brigam com tudo).
- Uma coisa por vez: passa, e muito bem. Treino, depois vida, depois partida, é o melhor desenho do jogo.
- Até 4 escolhas: falha.
- Memória de trabalho: falha. A faixa "+1 ponto para gastar em Atributos" não deixa marca na aba; "Técnico" significa duas coisas.
- Revelação gradual: falha. A loja mostra item de € 120 mi para quem tem € 1,6 mil.

**Resultado: 4 falhas, carga alta**, concentrada em Criação, Atributos e Vida. O ciclo semanal em si é leve.

Pontos de decisão com mais de 4 opções:

- Treino: 9 treinos e "Pular o treino" (11 alvos contando "Treinar").
- Criação: 9 posições desenhadas duas vezes (no campo e na grade), 14 traços, 6 tons de pele e 7 cores de cabelo, 6 grupos de atributo.
- Atributos: 28 botões +1 e 17 itens de loja.
- Vida: 10 filtros e 20 itens.
- Mercado da bola: 5 ou 6 propostas, "Ficar" e "Me aposentar" (até 8).
- Lance cara a cara: 4 (no limite).

### Jornada emocional

- **Pico inicial:** a abertura cola as figurinhas em cerca de 1 s, a capa da entrada tem as três figurinhas de exemplo, e nas peneiras aparecem três clubes reais. É o melhor trecho do jogo.
- **Vale 1, na criação:** um formulário de 3490 px. No iPad em retrato a figurinha de prévia sai da tela enquanto você escolhe cabelo e pele.
- **Vale 2, o mais grave, no primeiro jogo da carreira:** você toca "Entrar em campo" e recebe "Você não jogou. O técnico te deixou no banco", com "Resultado: 1 x 0" sem dizer quem venceu. O ingresso não avisa a sua função (`hub.js`, por volta da linha 360).
- **Vale 3, tudo vermelho para quem começa:** com overall 43, as 28 barras de atributo ficam vermelhas e todas as chances também. Até "Rolar para o companheiro · seguro" com 22% sai vermelho. No futebol, 22% de chance de gol é uma chance claríssima.
- **O pico que deveria ser o maior, o gol, sai pequeno e entregue antes da hora** (veja os problemas prioritários).
- **Fecho semanal:** o placar final na placa cobalto com "VITÓRIA" em amarelo é um bom fim de semana.
- **Fim de temporada:** a evolução do overall (54 para 60) aparece pequena num canto, os ganhos são um parágrafo corrido de 20 atributos e as "Figurinhas brilhantes" saem sem brilho.
- **Fim da carreira:** a figurinha de legado dourada e "Começar outra carreira" fecham bem.
- **Momentos de alto risco:** "Assinar" proposta sem confirmação; "Simular até o fim da temporada" sem confirmação; a linha de treino, que confirma no toque durante a rolagem; "Me aposentar" colado em "Ficar no clube" (este tem confirmação).

### Pontos fortes

1. **O ciclo semanal em três passos com consequência na própria linha.** Os passos numerados (1 Treino, 2 Vida, 3 Partida) viram marcas de concluído. O preparador recomenda com o porquê ("Sua forma está em 45 e tem jogo nesta semana: descansar leva para 57"). Cada treino mostra "Forma +7 / Felicidade -2 / Risco de lesão 4%". Isso entrega o princípio 1 do PRODUCT.md e deixa a semana caber numa sessão curta.
2. **A capa, a figurinha do jogador e o placar final.** Barlow Condensed 800 em caixa alta sobre o cobalto chapado com retícula, número tabular como título, amarelo só onde importa. É uma identidade de verdade, coerente da abertura até a aposentadoria.
3. **A chance real em número grande dentro da linha de escolha.** O jogador decide olhando "19% de chance" com os atributos que pesam ("Drible · Agilidade"). Está honesto e legível. Falta só calibrar a cor.

### Problemas prioritários

**[P1] Ações irreversíveis num toque no iPad**
- "Simular até o fim da temporada" tem 228x36 px, fica logo abaixo de "Simular 4 semanas" e não pede confirmação (`src/ui/screens/hub.js`, ação `sim-season`, por volta da linha 1196).
- "Assinar" proposta é um toque só (`src/ui/screens/offseason.js`, `accept-offer`, linha 217).
- A linha inteira do treino (672x66 px) confirma o treino no toque, sem prévia.
- A criação diz "Tudo pronto." mesmo com 26 pontos sem gastar, e eles se perdem (`src/ui/screens/create.js`, `missingSteps`).
- Por que importa: no toque, rolar e encostar é comum. Perder uma temporada inteira ou assinar com o clube errado gera reclamação.
- Correção: confirmação em "Simular até o fim" e em "Assinar", com um resumo (função, salário, contrato); "Falta: distribuir 26 pontos" no status da criação, ou distribuição automática pela posição; no treino, tocar a linha seleciona e "Treinar" confirma, ou um aviso com "Desfazer" até o próximo passo.
- Comando: `harden`.

**[P1] O gol, único momento autoral, é pequeno e entregue antes da hora**
- No instante 0, o texto "No canto, sem chance para o goleiro. É gol!", o "Seu jogo" com Gols 1 e nota 8,1 e a linha "É gol!" da narração já estão na tela. A bola ainda nem andou.
- Ao mesmo tempo, o seu número no placar some por 720 ms. A animação `vira` usa preenchimento `both` com atraso, então fica parada em `rotateX(-90deg)` (`style.css`, linhas 4788 a 4818).
- "Gol!" tem o tamanho de qualquer título de lance.
- No iPad em retrato o campo tem no máximo 340 px, preso à esquerda, com metade da folha vazia.
- Por que importa: é o pico da regra pico e fim. Para um fã jovem, o gol é o jogo.
- Correção: segurar o texto do desfecho, o painel "Seu jogo" e a narração até o carimbo (620 ms); mostrar o número antigo durante o atraso e só então virar; "GOL!" em tamanho de capa (4 a 5 rem, caixa alta, sobre uma faixa cobalto), com a linha do artilheiro colando como figurinha; campo em largura total no retrato, ou as duas colunas já a partir de 760 px.
- Comando: `animate`, com `bolder` só no gol.

**[P1] O hub afogado em listas**
- Semana: 9 treinos com 3 a 4 etiquetas coloridas cada, e um cadeado de 40 px em cada linha que abre um aviso de loja por cima da lista.
- Atributos: 28 linhas com +1 e uma loja de 17 itens.
- Vida: repete Felicidade, Forma, Técnico e Torcida, que já estão no topo, e soma 10 filtros e 20 itens.
- São duas lojas em duas abas.
- Por que importa: quebra o princípio 3 do PRODUCT.md ("nada deve exigir ler a tela inteira"). O jogador perde o que é decisão e o que é vitrine.
- Correção: na Semana, recomendado mais 2 alternativas e "Ver todos os treinos", sem cadeados nas linhas; uma só "Loja", com categorias, mostrando primeiro o que dá para comprar; Vida sem repetir os medidores do topo; selo de contagem na aba Atributos quando houver pontos.
- Comando: `distill`.

**[P1] A primeira hora pune o iniciante e às vezes mente**
- "Entrar em campo" leva a "Você não jogou" sem aviso. O ingresso não mostra se você é titular, reserva ou se está fora (`hub.js`, linhas 360 a 395).
- Os limites de cor da chance pintam de vermelho jogadas boas pelo padrão do futebol.
- No evento, 2 de 3 opções dizem só "Resultado incerto".
- Os nomes de clube levam artigo errado ("o Ponte Preta", "o Chapecoense", "na Brasileirão").
- Correção: no ingresso, "Você começa no banco · entra se o jogo pedir", com o botão "Ir para o banco"; "Você não jogou" com um placar final pequeno, o motivo e o que fazer para ganhar minutos; calibrar a escala de chance pela realidade do futebol ou destacar a melhor opção do lance; pelo menos a direção da consequência nas opções do evento; artigo e gênero por clube nos dados.
- Comando: `clarify`, com `onboard`.

**[P2] Acabamento do álbum quebrado**
- As "Figurinhas brilhantes" do fim de temporada saem brancas: `.card-sticker { background }` (linha 869) vem depois de `.sticker--foil` (linha 824), com a mesma especificidade.
- Linha fantasma na narração: a animação `colar` termina em `box-shadow: var(--shadow-sticker)` com preenchimento `both`, então toda linha de gol fica com sombra de figurinha.
- O rótulo "Melhor em campo" quebra em duas linhas e empurra o número para baixo (Álbum, Aposentadoria).
- Amarelo fora da regra: dois botões amarelos na entrada, etiquetas amarelas que não são ação, e "Renovar" sem o amarelo que o DESIGN.md prevê.
- Correção: `.card-sticker.sticker--foil`; uma `colar` sem sombra para linhas; rótulos de estatística com `nowrap` ou números alinhados pela base; etiquetas em tinta ou cobalto.
- Comando: `polish`.

### Personas

**Theo, 11 anos, torcedor do Flamengo, iPad em retrato no sofá.** Não lê o formulário de 3490 px, rola até "Começar carreira" e começa sem gastar os pontos. Não vê o próprio avatar enquanto escolhe o cabelo azul. Não sabe o que "Muralha: Passar por você custa caro." faz. No primeiro jogo, "Entrar em campo" dá em "Você não jogou". Quando joga, vê só porcentagens vermelhas. Quando marca, o placar some por meio segundo e o "Gol!" é discreto. Acha que o ícone de avançar acelera a partida, mas ele significa "menos eventos de vida". Toca "Simular até o fim da temporada" por curiosidade e perde o ano. Lê "Técnico 49" como técnica. Estranha "€ 600 por semana" e "o Ponte Preta".

**Casey, celular, distraída.** A figurinha mais os 4 medidores ocupam cerca de 420 px no topo de toda aba: a tabela da Liga só começa no meio da tela, e o "Treinar" aparece por volta dos 720 px. A linha de treino confirma se o polegar encostar durante a rolagem. No carrossel de propostas, "Assinar" não pede confirmação. A favor: salvamento automático e o passo atual sempre marcado.

**Alex, quem recomeça carreiras e quer velocidade.** Gosta de "Treinar" num toque, de simular e do modo rápido. Esbarra em 2 toques por lance, na narração duplicada e na loja sem busca nem filtro na aba Atributos. A volta para "Minhas carreiras" ainda mostra as figurinhas "Exemplo" (Davi, Tiaguinho, Leo Sales) em destaque, e a carreira real dele fica num espaço menor embaixo.

### Observações menores

- O aviso "Forma física baixa. Descansar esta semana..." aparece depois que a semana já acabou.
- A figurinha de clube significa "PLANTEL" nas propostas e "OVERALL" (o seu) na figurinha de temporada.
- O artilheiro adversário aparece sem nome ("11'"); o seu aparece com nome ("Santos 18'").
- O "Subiu: ..." do fim de temporada é um parágrafo de 20 atributos. Pede uma lista dos 3 maiores ganhos e um "ver todos".
- A última linha de propostas fica centralizada e órfã.
- No modo noturno, o placar e o placar final perdem o cobalto e viram um painel azul-marinho escuro, o "painel escuro de estádio" que o próprio sistema recusa. O degrau "bom" fica amarelo e se confunde com o amarelo de ação.
- Alvos menores que 44 px: "Comprar" e "Contratar" (82x36 e 88x36), "Simular" (36 px de altura), +/− da criação, cores e ícones da barra superior (40x40), abas (43 px).
- Num lance "Fora da bola" em paisagem, sem campo, as opções ficam com cerca de 290 px de largura e o resto da folha vazio.
- A posição é escolhida duas vezes na mesma seção (campo e grade de 9).

### Perguntas para provocar

- Se a carreira é um álbum, por que a aba que o jogador mais abre (Semana) não tem nenhuma figurinha além da dele? O treino concluído não poderia colar uma figurinha?
- Um chute com 22% é uma grande chance no futebol real. Por que pintar de vermelho a melhor jogada da partida?
- O gol é o único momento autoral. Por que ele tem o tamanho de um título de seção?
- E se "Entrar em campo" só aparecesse quando você vai mesmo entrar em campo?
- Precisa de duas lojas? E de um cadeado em cada treino da decisão principal?
- À noite o fundo "vira a capa" ou vira o estádio escuro que vocês recusaram?

### Notas

| Critério | Nota | Por quê |
|---|---|---|
| Originalidade | 74 | Abertura, ingresso com picote, placa de estádio, campo em giz e espaços numerados do Álbum são ideias próprias e bem executadas. Perde pontos porque Treino, Atributos e Vida são listas genéricas de linha, etiqueta e botão. |
| Personalidade | 64 | A capa, as peneiras e o texto ("Quem perder paga o açaí", "Pagode no vestiário") têm voz. O gol tímido, o mar de vermelho e o banco sem aviso deixam o resto com cara de planilha séria. |
| Harmonia | 69 | Barlow com Barlow Condensed, cobalto, amarelo e papel frio formam um sistema coeso, com bom ritmo de espaço. Desafinam as etiquetas vermelhas e verdes em cada treino, as barras vermelhas e laranjas em massa, o amarelo fora da regra e a noite sem cobalto. |
| Beleza e acabamento | 60 | A capa, a figurinha do jogador e o placar final são lindos. Mas falta brilho nas figurinhas brilhantes, há a linha fantasma na narração, o número do placar que some no gol, o "Melhor em campo" desalinhado e o campo de 340 px num canto do iPad em retrato. |
| Clareza e hierarquia | 61 | Os passos da semana e o botão amarelo único no passo atual são claríssimos. Atributos e Vida são paredes de cerca de 3800 px, os medidores se repetem, há duas lojas e "Técnico" quer dizer duas coisas. |
| Conforto no iPad | 57 | A paisagem é boa: coluna fixa no hub, partida em duas colunas, prévia fixa na criação. O retrato, que é o uso principal, recebe o empilhamento do celular: prévia fora de vista, campo pequeno, alvos de 36 a 40 px, e treino e "Simular até o fim" confirmando no toque. |
| **Nota geral** | **64** | Tem identidade real e um ciclo semanal muito bem desenhado, mas ainda não é "bom com identidade" de ponta a ponta. O pico (gol) e a primeira hora decepcionam, os bugs do álbum atingem justamente as recompensas, e o iPad em retrato é tratado como um celular grande. Corrigindo os três P1 de fluxo e o polimento do álbum, passa de 72 fácil. |

---

## 2. Impeccable B: detector e medições (nota geral 65)

### Achados do detector

**`impeccable detect --json index.html`:** 8 achados, todos no CSS embutido da tela de carregamento (`.boot*`).

| Regra | Severidade | Linha | Trecho |
|---|---|---|---|
| design-system-font-size | aviso | 68 | `clamp(3rem, 15vw, 5.6rem)`: 5.6rem fora da escala |
| design-system-font-size | aviso | 98 | `clamp(1.6rem, 7vw, 2.4rem)` |
| design-system-font-size | aviso | 106 | `0.78rem` |
| design-system-radius | aviso | 136 | `border-radius: 3px` |
| design-system-font-size | aviso | 150 | `clamp(0.62rem, 2.6vw, 0.85rem)` |
| design-system-font-size | aviso | 193 | `0.95rem` |
| design-system-font-size | aviso | 212 | `1.05rem` |
| dark-glow | alerta | 0 | "Colored box-shadow glow (#1c3d9e) on dark page" |

**`impeccable detect --json src/ui`:** nenhum achado. Isso não prova que o código está limpo: para `.js`, o detector só busca padrões em texto e não interpreta a marcação dentro das template strings.

### Overlay no navegador

Não rodou. A injeção do script do detector na página foi bloqueada pelo modo automático do Claude Code, e o revisor não tentou contornar. O detector por endereço também não rodou, porque exige desligar o sandbox do Chromium. No lugar, o revisor fez medições só de leitura em 10 estados do jogo, em 820x1180, 1180x820 e 390x844, nos temas claro e escuro.

### Medições

**Rolagem horizontal:** zero em todas as medições. No celular, as 5 abas do hub cabem exatamente.

**Alvos de toque abaixo de 44x44 px:**

| Tela | Alvos | Abaixo de 44 | Quais |
|---|---|---|---|
| Entrada | 11 | 5 | marca 161x30; abas Entrar/Criar conta 72x41 e 104x41; "Entrar com Google" 146x36; "Entrar como convidado" 176x36 |
| Criação | 56 | 23 | 13 amostras de cor 40x40; 6 botões "+" de atributo 40x40; sliders de altura e peso com 16 px de altura; "Sortear nome" 142x36 |
| Hub, aba Semana | 33 | 21 | 4 ícones da barra de topo 40x40; marca com 30 de altura; 5 abas com 43 de altura; 9 botões de olho do treino 40x40; "Simular 4 semanas" 148x36; "Simular até o fim da temporada" 228x36 |
| Atributos / Vida | 43 / 31 | 13 / 19 | botões de compra `.btn--sm` 88x36, 62x36 e 82x36 |
| Partida | 10 | 5 | só a barra de topo; as opções de lance passam de 44 |
| Fim de temporada | 14 | 5 | só a barra de topo |

A causa é sistêmica: `.iconbtn` mede 40x40 (`style.css:480`) e `.btn--sm` tem altura mínima de 36 px (`style.css:598`).

**Contraste (falhas reais):**

| Onde | Razão | Mínimo | Cores |
|---|---|---|---|
| Fim de temporada e peneiras, tema escuro: "Renovar" e "Assinar" | **1,10** | 4,5 | #eef2fb sobre #fdfdfb |
| Valores positivos em € (fim de temporada, Vida) | 4,31 | 4,5 | verde #17804a sobre #eceff3 |
| Etapas concluídas do passo a passo | 4,33 | 4,5 | #17804a sobre #e3f3ea |
| Bônus de atributo "+5" | 4,31 | 4,5 | 12,8 px |
| "Forma +3" numa linha de treino no estado hover | 4,17 | 4,5 | sobre #e5ebfa |

Causa do botão invisível: `.btn` usa `color: var(--ink)`, que à noite vira quase branco, enquanto `.card-sticker` (`style.css:869`) continua com fundo de papel branco; o bloco das linhas 858 a 866 só redefine as variáveis `--tt-*`.

**Fontes abaixo de 12 px:** "de chance" na partida com 11,5 px; 29 rótulos "3 pts"/"1 pt" na aba Atributos com 10,9 px e opacidade 0,85; a sigla do seu time na Liga com 11,5 px; a faixa da figurinha da tela de carregamento no celular, com cerca de 10 px (decorativa).

**Texto cortado:** na prévia da criação, a posição corta com reticências em 4 das 9 posições no iPad em retrato e no celular, inclusive a padrão ("BRA · Meia-arm…"). A sigla de "Al-Khaleej" aparece como "AL-".

**Variedade de tamanhos de fonte:** o style.css tem 44 valores distintos de font-size em 136 declarações, muitos fora da escala do DESIGN.md (0.8rem 13 vezes, 0.95rem 11, 0.85rem 10). A entrada sozinha usa 17 tamanhos diferentes.

### Falsos positivos

- `dark-glow`: as sombras são neutras; o #1c3d9e é a cor de fundo da capa.
- `design-system-radius 3px`: o DESIGN.md registra o rosto da figurinha com 3 px nos componentes, mas não na escala de raios. Falha de documentação.
- Os avisos de font-size são deriva real, mas de baixo impacto (só a tela de carregamento).
- Os números dos espaços vazios do álbum têm contraste baixo de propósito; o rótulo "Espaço livre" carrega o sentido.

### Notas

| Critério | Nota | Justificativa |
|---|---|---|
| Harmonia | 73 | Cores por variáveis, coerentes entre claro e escuro, com a metáfora do álbum em todas as telas; perde por 44 tamanhos de fonte fora da escala e pelo verde "good" que não fecha 4,5:1. |
| Beleza e acabamento | 67 | A entrada com as figurinhas e o placar da partida têm personalidade; escorrega no corte "Meia-arm…", na sigla "AL-", no campo ocupando metade da largura no iPad e nos botões invisíveis do tema escuro. |
| Clareza e hierarquia | 71 | O passo a passo e a caixa "O preparador recomenda" orientam bem; a lista de treino fica densa, com 3 a 4 indicadores coloridos por linha. |
| Conforto no iPad | 60 | Nenhuma rolagem horizontal e as opções principais passam de 44 px, mas no hub 21 de 33 alvos ficam abaixo de 44, e os sliders têm 16 px de altura. |
| Qualidade técnica do visual | 57 | Zero transbordo e quase todo o texto passa no AA, mas há um botão de ação com contraste de 1,10:1 no escuro, várias falhas de 4,3:1 no verde e rótulos de 10,9 a 11,5 px. |
| **Nota geral** | **65** | Base boa e com cara própria; a nota cai por defeitos medidos que são baratos de corrigir. |

---

## 3. Diretor de arte (nota geral 58)

### Primeira impressão (vitrine)

A capa cobalto com retícula, o "CRAQUE / DO ZERO" em condensada amarela e as três figurinhas tortas param o dedo: parece mesmo um álbum, e um álbum bem brasileiro. Na segunda captura (o hub) a promessa já esfria: vira um painel de barras coloridas, listas com ícone em bolinha e caixas azul-claras de aviso, que poderia ser de qualquer app de hábitos. É um jogo arrumado e coerente nas cores, com uma ideia ótima que mora nas bordas da experiência (abertura, peneira, fim de temporada) e não no meio, onde o jogador passa 80% do tempo.

### Autoral e genérico

**Autoral (só este jogo faria):**

- A abertura com quatro espaços numerados: cada etapa real do carregamento cola uma figurinha (bola, chuteira, camisa, taça). É a melhor ideia de movimento do projeto.
- A capa de entrada: cobalto chapado com retícula (`style.css:3932`), título em caixa alta condensada e figurinhas de exemplo giradas. Os espaços de carreira são "Espaço livre" numerados de 1 a 6, como no álbum.
- A figurinha do jogador: o overall é o número da figurinha e o nome vai na faixa (`style.css:705-790`).
- A figurinha de clube com frente e verso separados por tracejado (`style.css:869-950`): as propostas viram figurinhas de verdade.
- O placar de estádio: gols em placas de papel, o minuto numa etiqueta amarela, o relógio com um tique no intervalo. O placar final com "VITÓRIA" em amarelo é a peça mais bonita do jogo.
- O campo em linhas de giz, sem gramado (`style.css:4196`), que recusa o clichê verde-neon do gênero.
- Os cartões da súmula como cartões de verdade, e o texto: "Nenhum clube, nenhum contrato. Só vontade." é voz própria.

**Genérico (qualquer app teria):**

- A lista de treino: ícone em círculo tingido, título, descrição, efeitos em verde e vermelho e cadeado (`.option`, `style.css:1408-1530`). É o padrão "linha de ajustes" de app de empresa.
- "O preparador recomenda" numa caixa azul-clara de aviso, com o rótulo acima do título (`.coach__kicker`, `style.css:3371`), o que viola a regra do próprio DESIGN.md ("Sem rótulo acima de título").
- Mais rótulos acima de título: o selo "Fora da bola" no lance (`.moment__kind`, `style.css:1920`) e "CARREIRA SÓLIDA" na aposentadoria (`.legacy .tag`, `style.css:4094`).
- O evento de vida: opções em lista com seta à direita, como nos Ajustes do iOS.
- As etapas da semana em pílulas (`.stepper`, `style.css:1332`): o componente de onboarding de qualquer app.
- As metas da temporada: três cartões iguais com ícone, texto e barra (`.goal`, `style.css:3056`).
- Barras com trilho cinza em todo lugar (`.meter__track`, `style.css:1191`): 4 no topo do hub, cerca de 30 em Atributos e 11 em Vida.
- A loja da Vida: chips de filtro, "Comprar" e mais de 20 linhas. É uma tela de comércio eletrônico.
- A marca e o ícone do app: o ícone de bola do Phosphor num círculo ou quadrado.
- Os avatares têm a cara reconhecível de "retrato de desenho gerado por IA" (`assets/avatar/LEIA-ME.md` confirma que vieram do ChatGPT).

### A promessa do álbum

**Onde vive de verdade:** abertura, entrada, peneiras e mercado (figurinhas de clube), placar final, fim de temporada (figurinha colada e brilhantes), aba Álbum (espaços numerados) e aposentadoria (figurinha dourada). Com seis temporadas jogadas, a aba Álbum fica gostosa de ver.

**Onde some:** no hub Semana, a tela de toda semana. A figurinha do jogador tem cerca de 110 px no iPad em retrato e perde para uma lista de fatos e quatro barras. Não há "página" nem espaços: a semana é um formulário de três passos.

**Telas que viram "app de formulário":**

- Criação: uma folha de 3490 px de campos, listas, sliders e amostras. No iPad em retrato a prévia da figurinha só aparece no topo e some quando você escolhe pele e cabelo, justamente quando ela mais importa. No paisagem ela fica fixa ao lado.
- Atributos: trinta barras semáforo, cada uma com um botão "+1 / 1 pt".
- Vida: uma loja.
- Treino: a lista de ajustes.
- Liga: uma tabela padrão. É aceitável, mas sem nada de álbum.

**Onde o álbum quebra por defeito:**

1. As figurinhas brilhantes saem brancas. `.card-sticker` (`style.css:869`) vem depois de `.sticker--foil` (`style.css:824`), com a mesma especificidade, e apaga o dourado. O reflexo `brilho` anima um fundo liso. Afeta as conquistas (`hub.js:1029`) e os prêmios do fim de temporada (`offseason.js:106`).
2. No gol, a placa do seu time some por cerca de 720 ms: a animação `vira` parte de `rotateX(-90deg)`, com atraso e `both` (`style.css:4793-4809`). Parece defeito, não virada de placa.
3. No iPad em retrato o campo do lance tem no máximo 340 px (`style.css:4269-4272`). O gol ocupa cerca de 40% da folha e deixa uns 400 px vazios à direita. O título "Gol!" é pequeno para ser o clímax.
4. O amarelo vaza para coisas que não são ação: as pílulas `.points-pill` (`style.css:2280`), as duas ações amarelas na entrada (`auth.js:108` e `auth.js:167`) e a barra do degrau "bom" em mostarda.
5. O ingresso quase não lê como ingresso: os recortes de 18 px e o tracejado são tímidos demais.
6. As figurinhas de temporada são todas iguais: sempre a sigla do clube em cobalto com um número. Seis temporadas viram seis clones.

### Análise por eixo

- **Tipografia.** Barlow Condensed 800 com Barlow é a escolha certa: tem cara de impresso esportivo e é parente da letra dos álbuns. Os números tabulares como título da informação funcionam. Fraquezas: muito texto de 0,8 a 0,85 rem em cinza, com três cores de efeito por linha (treino, loja); falta uma segunda voz de impresso (legenda de álbum, carimbo); fora da capa, a condensada só aparece em títulos e números.
- **Cor.** Cobalto, amarelo e papel frio formam um trio memorável e brasileiro (azul e amarelo da seleção), bem organizado em variáveis. O que mais estraga a harmonia é a escala de qualidade de cinco cores: no começo da carreira quase tudo é vermelho e laranja, então Atributos e Vida parecem um painel de alarmes, e a barra mostarda compete com o amarelo de ação.
- **Ícones.** Phosphor regular, traço consistente, limpo. Mas é um vocabulário de app de empresa, sempre dentro de bolinha tingida. Não existe um pictograma do mundo do álbum (carimbo, selo impresso).
- **Ilustração (avatares).** Funcionam: são calorosos, legíveis em tamanho pequeno, com boa variedade de pele e cabelo, e assentam bem sobre o cobalto com retícula. Falham: o estilo é o retrato cartum genérico de IA (degradê macio, olhos grandes, mesmo sorriso e mesma pose); o jogador não envelhece (aos 16 e aos 22 é igual); a camisa é sempre branca e os três exemplos da capa usam a 10; é o único elemento do mundo que não parece impresso.
- **Textura.** A retícula de pontos (barra, capa, faces) é coerente e honesta, e o tracejado do verso é um bom toque. O papel é liso, o que está certo pelas regras, mas nada lembra página, lombada ou a moldura de um espaço impresso.
- **Movimento.** "Colar figurinha" é contido e bem feito, e a abertura é excelente. A regra ("toca uma vez por mudança real") é madura. O gol, porém, está subdimensionado no aparelho principal e tem o buraco no placar. O fim de temporada não tem nenhum ritual, e é justamente o momento de completar o álbum.

### Cinco ideias, por impacto e esforço

0. **Antes das ideias, corrigir os quatro defeitos que quebram a promessa:** botões invisíveis à noite, dourado das figurinhas brilhantes, placa sumindo no gol e amarelo fora da ação. Isso não é ideia nova, é acabamento.
1. **O gol do tamanho do iPad** (esforço baixo, impacto alto). No retrato, o campo ocupa a largura toda da folha, acima do texto. "GOL!" entra em caixa alta condensada, numa faixa cobalto como telão de estádio. O número antigo continua visível até a placa virar.
2. **Raridade da figurinha e "edições" por temporada** (esforço baixo a médio, impacto alto). A moldura da figurinha do jogador muda com o overall: papel branco, depois prata, ouro e, no fim, brilhante. A carreira passa a se ver na própria figurinha. Cada temporada ganha uma cor de edição curada (como as capas do álbum que mudam a cada Copa), sem inventar cor de clube. O verso pode trazer os seis grupos de atributo.
3. **A semana como página do álbum** (esforço médio, impacto alto). Treino, Vida e Partida viram três espaços numerados que ganham um carimbo ou figurinha ao serem feitos, no lugar das pílulas. A figurinha do jogador cresce no iPad em retrato. Os treinos viram figurinhas de treino em grade de duas colunas, com o efeito no verso. A caixa azul de aviso e o rótulo acima do título saem.
4. **Abrir o pacotinho no fim de temporada** (esforço médio, impacto muito alto). A figurinha da temporada e as brilhantes chegam num envelope que o jogador abre com um toque, uma por vez, e voam para o espaço numerado. Tem que dar para pular. Fecha o laço emocional que hoje é um relatório.
5. **Atributos como verso da figurinha, e a Vida com menos cara de loja** (esforço médio a alto, impacto médio a alto). Seis grupos, cada um com um número grande e fileira de bolinhas, como na criação. As barras ficam numa cor só (cobalto), e a escala de qualidade marca só o número. Na Vida, os itens de "Coleção" e as experiências viram pequenos cartões colecionáveis.

### Comparação com o gênero

- **Álbum Panini:** o jogo se aproxima no espaço numerado, no papel branco e na brilhante. Faltam a página, o pacotinho e a figurinha repetida.
- **FIFA Ultimate Team:** tem o overall e a posição na figurinha. Faltam a raridade e o ritual de abrir pacote.
- **BitLife:** o jogo é bem mais refinado, mas a Vida repete a lista-loja dele.
- **Football Manager:** as cores por nota de atributo lembram o FM, sem a densidade elegante dele.
- **Retro Bowl e New Star Soccer:** ensinam que um estilo único em todas as telas e a partida como espetáculo valem mais que polimento. Aqui a partida ainda é pequena no iPad.
- **Onde o jogo se distingue:** recusa a tela escura de estádio e o gramado. O futebol aparece como coisa impressa (giz, placa de estádio, cartões), e isso é raro e bom.

### Notas

| Critério | Nota | Por quê |
|---|---|---|
| Originalidade | 58 | O conceito de álbum é original no gênero e brilha na abertura, na entrada, nas peneiras e no placar final. Mas o hub, a criação, Atributos e Vida usam os padrões de qualquer app. |
| Personalidade | 55 | A capa e o texto têm voz ("Só vontade"). Ela some nas listas de treino, nos eventos com seta e na loja. Os avatares são simpáticos mas genéricos e não envelhecem. |
| Harmonia | 66 | Paleta de três cores disciplinada e par Barlow consistente. Perde pontos pela escala semáforo inundando Atributos e Vida, pelo amarelo fora da ação e pelo texto miúdo multicolor no treino. |
| Beleza e acabamento | 60 | O placar final, as figurinhas e a capa são lindos. Mas o dourado não aparece, a placa some no gol, o campo de 340 px deixa um vazio no iPad em retrato e o ingresso é tímido. |
| Coerência entre telas | 60 | Variáveis, tipos e retícula se mantêm do início ao fim. A metáfora não: entra forte, desaparece no hub e volta no fim de temporada. As figurinhas de temporada são clones. |
| Tema escuro | 38 | Na peneira e no mercado, "Assinar" e "Renovar" ficam quase invisíveis (contraste de cerca de 1,1:1). Além disso, `--cover: #0a1229` (`style.css:149`) apaga o cobalto da barra, da capa, do placar e da abertura, e as barras ficam um arco-íris. A favor: as figurinhas brancas com face cobalto sobre o marinho são lindas. |
| **Nota geral** | **58** | Acima do genérico, com uma direção de verdade e momentos autorais. Mas para chegar a 70 o álbum precisa morar na tela da semana, e o gol e as brilhantes precisam entregar o que o DESIGN.md promete. |

---

## 4. Caçador de bugs no iPad (nota geral 64)

Testes com toque real (`hasTouch`) em iPad Air (820x1180 e 1180x820), iPad mini (768x1024 e 1024x768), iPad Pro (1024x1366) e celular (390x844).

### Bugs reproduzidos

**Alto**

- **A1. Na partida, um toque duplo em "Continuar o jogo" escolhe sozinho a 1ª opção do lance seguinte.** Em todos os tamanhos, com animação normal. Tocando duas vezes rápido (120 a 150 ms), o segundo toque cai na 1ª opção do lance novo, que aparece no mesmo lugar: o jogador vê o resultado de um lance que nunca leu. Aconteceu em 4 de 5 tentativas no Air em retrato e 4 de 5 em paisagem. O contrário também acontece: tocar duas vezes numa opção faz o segundo toque cair em "Continuar o jogo" e pular o resultado. Deveria ignorar um toque repetido logo após a troca do painel. Causa provável: o painel é trocado na hora no mesmo lugar (`src/ui/screens/match.js:91` e `:107-118`); `src/ui/app.js:213-219` despacha cada clique sem nenhuma trava; `src/ui/motion.js:97-103` só adia a troca de tela, de aba e de semana.
- **A2. "Assinar" e "Renovar" invisíveis no tema escuro.** Contraste de 1,10:1 nas peneiras e no mercado. Causa: `.card-sticker` (`style.css:858-865`) não redefine `--ink`, que o `.btn` usa (`style.css:512-524`).

**Médio**

- **M1. Toque duplo em "Próxima semana" escolhe o treino da semana nova.** Com movimento reduzido, ou em navegador sem View Transitions (o Safari do iPadOS 17 ou anterior), acontece com toques de 60, 120 e 200 ms de intervalo. Com animação normal, só se o 2º toque vier depois de uns 400 ms. Causa provável: `hub.js:437` e `:1187-1191`; `game.js:589` (`advanceWeek`) não confere a etapa; a única proteção é acidental, a transição em `motion.js:100`.
- **M2. Toque duplo em "Simular 4 semanas" pula ou escolhe o treino da 5ª semana.** No Air em paisagem escolheu "Folga na cidade"; no mini em retrato acionou "Pular o treino". Mesma causa.
- **M3. "Simular até o fim da temporada" trava a tela sem aviso.** São 1244 ms simulando com a tela redesenhando, contra 49 ms sem redesenhar: 141 redesenhos completos do hub. Com a CPU 4 vezes mais lenta (perto de um tablet), a tela ficou congelada por cerca de 4,5 s. Causa: `simulateWeek` chama `notify()` 3 a 4 vezes por semana (`game.js:300`, `:318`, `:414/456`, `:617`), dentro de `simulateWeeks` e `simulateRestOfSeason` (`game.js:650-666`), e `app.js:59-63` redesenha a tela a cada `notify`.
- **M4. Em paisagem, a coluna lateral do hub fica presa e corta os indicadores.** No iPad mini em paisagem, "Técnico" e "Torcida" ficam abaixo da borda da tela até o fim da página; no Air, "Torcida" só aparece no fim. Causa: `style.css:1068-1071` (`.hub__aside { position: sticky }`), com a figurinha grande ocupando quase toda a altura.
- **M5. Muitos alvos de toque abaixo de 44 px:** ícones da barra de cima 40x40 (`.iconbtn`, `style.css:480`); abas com 43 px de altura (`.tab`, `style.css:634-640`); botões pequenos com 36 px de altura (`.btn--sm`, `style.css:598-602`); +/− de atributo na criação 40x40 (`.stepbtn`, `style.css:2736`); bolinhas de pele e cabelo 40x40 (`.swatch`, `style.css:2610`); olho/cadeado dos treinos e "X" de apagar carreira 40x40; sliders de altura e peso com 16 px de altura.

**Baixo**

- **B1.** Voltar do navegador (gesto de borda no iPad) sai do jogo: não há integração com o histórico. Ao avançar de volta, o jogo abre na capa. O save fica íntegro.
- **B2.** Nome no máximo do campo com uma palavra larga estoura a tela (aposentadoria no iPad; criação, hub e aposentadoria no celular). Nomes longos realistas passaram. Causa: o `h1` não tem `overflow-wrap` (`style.css:224-239`).
- **B3.** Nome do clube cortado nas figurinhas das carreiras salvas ("Corinthians S…", "Palmeiras Su…") em todos os tamanhos (`auth.js:65-72`).
- **B4.** Toque duplo em "Contratar" abre a confirmação "Dispensar?", porque o botão vira "Dispensar" no mesmo lugar. A confirmação evita o estrago (`hub.js:795-798`).
- **B5.** O número da camisa aceita "7.5" (salvo como 7.5, camisa mostra 7); "0" fica no campo, mas a prévia mostra 10; "100" vira 99 na prévia, mas o campo continua com 100 (`create.js:146` e `:289-292`).
- **B6.** Aposentar no meio da 1ª temporada deixa o título "Temporadas" sozinho, sem nada embaixo (`retired.js:296-314`).
- **B7.** Nota das figurinhas de temporada com ponto ("6.48"), enquanto o resto usa vírgula (`hub.js:968` e `retired.js:309`).
- **B8.** Sigla "AL-" para o Al-Ittihad (`initials` em `components.js:273-285`).
- **B9.** No modal de confirmação, Esc não fecha, o foco fica no botão atrás do modal e não há `aria-labelledby` (`dom.js:107-131`). Tocar fora fecha normalmente.

### Suspeitas lidas no código (não reproduzidas)

- **S1. Save ao fechar:** o jogo só salva de imediato no `beforeunload` (`app.js:230-232`), que o Safari do iPad não dispara de forma confiável. O save local espera 400 ms (`storage.js:211-217`) e o da nuvem 2,2 s, sem `pagehide` nem `visibilitychange`. Trocar de app logo depois de uma ação pode perder o último passo.
- **S2. Motor sem trava de etapa:** `startMatch` (`game.js:333`), `simulateMatch` (`:392`), `advanceWeek` (`:589`) e `skipFreeWeek` (`:619`) não conferem a etapa, e `currentMatch` (`game.js:236-240`) não olha `week.played`. Um despacho repetido depois de "Você não jogou" jogaria a mesma partida de novo e somaria o resultado duas vezes na tabela. Hoje está mascarado pela troca da interface.
- **S3. Zoom no toque duplo:** não há `touch-action: manipulation` no CSS. No Safari do iPad, um toque duplo pode dar zoom.
- **S4. Apito indevido:** sair da partida por "Minhas carreiras" toca o apito final mesmo sem o jogo ter acabado (`soundCues.js:69-74`).

### O que passou

- Console sem nenhum erro nem aviso em nenhum teste (fora o aviso esperado do App Check em localhost).
- Nenhuma rolagem horizontal em 15 etapas e 7 tamanhos, com nomes normais.
- Girar de retrato para paisagem e de volta, em 11 telas e com modal aberto: nada quebrou.
- Recarregar em 6 pontos (treino, evento, partida com lance pendente, logo depois de escolher, fim de temporada, início da 2ª temporada): o save ficou idêntico, inclusive a semente do sorteio.
- Álbum com 6 carreiras: "Nova carreira" some, a 7ª é bloqueada com aviso, apagar funciona.
- Carreira longa de 23 temporadas até a aposentadoria forçada, sem erros, com 47,6 KB guardados.
- Valores extremos (atributos 99 e 1, vida 0 e 100, dinheiro negativo e € 9,99 bi): nenhum NaN, undefined ou estouro.
- Toque duplo sem estrago em "Treinar", "Simular partida", "Começar carreira", "Assinar" e "Investir".
- Som ligado e desligado fica guardado depois de recarregar.
- Modais cabem no celular e no mini em paisagem.
- Na criação em retrato, a barra fixa de baixo não cobre a última linha do formulário.

### Notas

| Critério | Nota | Por quê |
|---|---|---|
| Robustez | 64 | O save é muito sólido e o console fica limpo, mas toques repetidos tomam decisões pelo jogador justo na partida, e a simulação longa congela a tela por segundos. |
| Conforto no iPad | 56 | Muitos alvos abaixo de 44 px, os toques fantasmas e, em paisagem, a coluna lateral escondendo indicadores. O gesto de voltar sai do jogo. |
| Acabamento visual | 72 | Visual coeso e bem alinhado nas duas orientações. Pesam os botões invisíveis no tema escuro e cortes pontuais (nome de clube, nome máximo, "Temporadas" vazio, ponto decimal, "AL-"). |
| **Nota geral de qualidade** | **64** | Base bem construída e estável. Faltam uma trava contra toques repetidos (no despacho e no motor), menos redesenhos durante a simulação e alvos de 44 px. |

---

## 5. Jogador de 14 anos (nota geral 56)

Teste com persona: o Enzo, 14 anos, fã de futebol, baixou o jogo no iPad e nunca viu antes. Criou o "Enzinho", centroavante de moicano platinado, Driblador nato e Matador de área. Escolheu o Palmeiras Sub-20 e jogou 14 semanas tocando nos botões: em 9 jogos tocou "Entrar em campo", ficou no banco em 5 e decidiu os lances em 4. Depois simulou o resto da temporada, assinou com o Freiburg e se aposentou para ver as telas finais. O som não foi avaliado (navegador sem áudio).

### Diário do garoto

- **Capa:** "Caraca, que bonito! Parece figurinha da Copa. Os três carinhas são estilosos. Bora!"
- **Criação:** "Fiz o meu de moicano platinado, ficou muito bom. Mas quando eu mudo o cabelo lá embaixo eu não vejo a cara dele, tenho que subir tudo de novo. Botei 8 pontos em ritmo e depois a velocidade dele era 44 e vermelha?? Achei que ia ficar rápido."
- **Peneiras:** "Peneira? Eu nem fiz peneira, já passei em três. PALMEIRAS, óbvio. Por que é em euro se é no Brasil?"
- **Semana 1:** "Muita coisa escrita. Cliquei em Treinar e apareceu 'sem evolução visível'. Ué. Aí apertei o botão amarelo grandão 'Entrar em campo'… e 'Você não jogou'. Fiquei no banco. Nem vi o jogo, só '6 x 1'."
- **Semana 2:** "O capitão brigou comigo por 'falta de entrega no último jogo'. EU NEM JOGUEI! Rebati, claro, e o técnico caiu pra 38. Entrei em campo de novo: banco de novo."
- **Semana 3:** "Agora o clube quer renovar comigo? Eu era 'o problema' do vestiário semana passada… beleza, renovei. Banco. DE NOVO. Três semanas sem jogar um minuto. **Aqui eu teria fechado o jogo.**"
- **Semana 4:** "FINALMENTE! Cara a cara com o goleiro, 46%… o goleiro pegou. Num 2 contra 1 eram só 12% e 21%, como assim? Errei e tomamos gol. Saí em impedimento e… gol do adversário?? Ainda fiquei em campo com a coxa travando e me machuquei: 4 semanas fora. Perdemos de 3 a 1 e minha nota foi 5,3. Que raiva."
- **Lesão:** "Apertei 'Simular 4 semanas' e voltei curado. Mas o que aconteceu nesse meio? Não sei."
- **Semana 8:** "Entrei no fim. A troca de chuteira deu certo, mas errei a cabeçada, e no último lance chutei por cima. Perdemos de novo."
- **Semanas 9 e 10:** "Banco. Banco. Já tô de saco cheio."
- **Semana 11:** "Clássico contra o Corinthians, com a etiqueta 'Derby Paulista'! Achei massa. Errei tudo, mas ganhamos de 1 a 0. Depois apareceu uma caixinha azul vazia, só com um chapeuzinho de formatura. Bugou?"
- **Semana 14:** "85 minutos, 2 a 1 pra eles, cara a cara, 66%… GOOOL! A bola fez um risco amarelo até a rede, e meu nome apareceu amarelinho no placar. EMPATEI! Nota 7,6. Isso foi muito bom, mas passou rápido demais e foi pequeninho."
- **Fim de temporada (simulado):** "PERA. Simulando eu fiz 20 gols, virei artilheiro, revelação e figurinha brilhante?? Jogando eu fiz 1. E o Freiburg da Alemanha me quer pagando € 12,6 mil por semana!! Assinei… e só apareceu a semana 1 normal, ninguém comemorou comigo."
- **Aposentadoria:** "A figurinha dourada ficou linda. Mas 'aposentado aos 17' é engraçado."

### Análise de designer

- **Primeiro minuto.** A capa é forte: título grande, figurinhas inclinadas, um só botão amarelo e uma abertura com figurinhas colando. A criação também é boa: avatar com personalidade, campo com as posições e traços com ícones. Ela perde força no iPad porque a prévia da figurinha fica pequena (cerca de 120 px) e não acompanha a rolagem; o overall subiu de 42 para 50 sem ele notar. Há uma armadilha: com 26 pontos ainda livres, o rodapé já diz "Tudo pronto" e libera "Começar carreira".
- **Clareza a cada passo.** As etapas da semana e o ingresso do próximo jogo são claros. O resto exige ler muito: 9 treinos com 3 a 4 efeitos e um cadeado cada; 11 barras na Vida e uma loja com 10 categorias; "Pontos" em "Sua temporada" ao lado de Jogos e Gols parece pontos da tabela, mas são pontos de evolução; "Pedir substituição: 90% de chance" (chance de quê?); "Rolar para o companheiro · seguro" com 15%; "Driblador nato" com 22% para driblar.
- **Sensação de progresso.** Fraca no começo: o treino diz várias vezes "Sem evolução visível nesta semana"; gastar 5 pontos não mudou o overall; as barras de um jogador de 16 anos são quase todas vermelhas; o progresso real (50 para 54) existe, mas o jogo não comemora. O fim de temporada recompensa bem.
- **Emoção nos gols e decisões.** As chances são honestas: em 3609 decisões simuladas com o motor, a chance média mostrada foi 0,58 e a realizada 0,59. O problema é o ritmo do azar: só 2 de 11 decisões deram certo; errar no meio de campo pode virar gol do adversário no mesmo minuto (`src/engine/match.js:565-566`), o que gerou "Saiu cedo demais. Impedimento." seguido de "Gol do adversário"; o erro não tem animação. O gol funciona (rastro amarelo, "Gol!" carimbado, placar virando, nome em amarelo), mas acontece num campo de cerca de 320 px e com título do tamanho dos outros.
- **Recompensa visual.** Há identidade e capricho: papel, capa cobalto, ingresso, placar de estádio, figurinha dourada. A recompensa fica concentrada no fim do ano; durante a semana quase tudo é texto em caixinhas parecidas. A ida para a Bundesliga não teve cerimônia, e no clube novo o técnico e a torcida já começam em 100.
- **Ritmo do loop semanal.** O ciclo de 3 toques é bom quando há jogo. Na base de clube grande, porém, o papel de "Promessa" dá cerca de 15 a 19% de chance de ser titular e 36 a 38% de ficar fora (`src/core/game.js:247-270`); notas ruins baixam a chance de jogar, criando uma espiral. "Entrar em campo" promete jogo e entrega "Você não jogou" sem nenhuma decisão (5 de 9 semanas). "Simular 4 semanas" decide os eventos de vida em silêncio e não mostra um resumo.
- **Vontade de jogar "só mais uma semana".** Baixa nas primeiras 4 semanas, justamente quando ela decide se o garoto fica. Melhora com o clássico, o gol e o mercado no fim do ano. Ponto preocupante: simulando, o jogador fez 19 gols em 17 jogos; jogando, fez 1 em 4. No motor, a simulação faz 1,01 gol por jogo como titular, contra 0,86 de quem sempre escolhe a maior porcentagem (0,60 contra 0,49 como reserva). A mensagem fica "simular joga melhor do que eu".

### Melhores e piores momentos

**Melhores:** o gol de empate aos 85' (rastro amarelo, "Gol!", placar virando, nome em amarelo); o fim de temporada (figurinhas brilhantes, metas verdes, propostas da Bundesliga e da J-League como figurinhas de clube); a capa, a criação do avatar e a figurinha dourada da aposentadoria. Menção honrosa para a etiqueta "Derby Paulista da base".

**Piores:**

1. "Entrar em campo" que vira "Você não jogou", três semanas seguidas.
2. A estreia: dois erros viraram gols do adversário (um deles a partir de um impedimento), depois lesão de 4 semanas e nota 5,3.
3. Eventos incoerentes ou com defeito: "Treta no vestiário" por falta de entrega sem ter jogado (a condição é só `hasClub`, `src/data/lifeEvents.js:381`); evento com uma única opção, porque a opção paga some quando falta dinheiro; caixa de resultado vazia, porque a opção tem `effects: {}` sem texto (`lifeEvents.js:588`; o mesmo na Tatuagem, `:715`); resultado ruim (Técnico −12) pintado de azul neutro.

### Sugestões, por impacto

1. **"Entrar em campo" sempre entrega jogo:** garantir minutos nas primeiras 3 a 4 semanas; mostrar no ingresso a chance de jogar antes do toque; quando ficar no banco, oferecer pelo menos um lance nos minutos finais ou uma cena de banco com decisão; atenuar a espiral entre nota baixa e banco.
2. **Partida no iPad em retrato:** campo na largura toda (cerca de 760 px); gol como cerimônia ("GOL!" grande, nome e número, placar e uma figurinha do gol indo para o álbum); animar também o erro; dar cerimônia à transferência e à estreia.
3. **Calibrar o começo e as consequências:** a opção principal da posição e dos traços entre 35 e 65% no início; erro no meio de campo não vira gol do adversário no mesmo minuto, e impedimento nunca vira gol contra; marcar a opção recomendada para que jogar não renda menos que simular; trocar "90% de chance" em decisões sem risco por um rótulo claro.
4. **Criação no iPad:** prévia maior e fixa; overall mudando ao vivo; "Começar" com aviso enquanto houver pontos livres; barras coerentes com os pontos gastos.
5. **Coerência e retorno dos eventos e do simular:** condições que fazem sentido; nunca mostrar resultado vazio; mostrar a opção cara bloqueada em vez de escondê-la; ganho em verde e perda em vermelho; resumo depois de "Simular 4 semanas"; R$ na base brasileira; "Pontos" vira "Pontos de evolução"; "Finalização concluído" vira "Treino de finalização concluído".

### Notas

| Critério | Nota | Comentário |
|---|---|---|
| Primeira impressão | 74 | Capa e abertura de álbum com cara própria. A criação é divertida, mas a prévia some no iPad e é fácil começar com 26 pontos sobrando. |
| Beleza | 73 | Identidade coerente e caprichada (placar de estádio, ingresso, figurinhas, dourado). No iPad em retrato sobra espaço vazio, o campo é miúdo e o meio da semana é parede de texto. |
| Personalidade | 68 | Álbum, clássicos da base, nomes reais e narração em bom português. Os eventos se repetem e se contradizem, o que tira a sensação de história própria. |
| Clareza | 58 | As etapas da semana são claras. O excesso de números, "Pontos" ambíguo, "% de chance" em decisões sem risco e cadeados enigmáticos atrapalham. |
| Emoção e recompensa | 45 | O gol funciona, mas é pequeno e raro. O banco sem decisão, os erros que viram gol contra e o treino "sem evolução" pesam mais que as vitórias. |
| Diversão e vontade de jogar mais | 47 | O fim da temporada puxa para frente, mas um garoto real teria fechado o jogo na semana 3, depois de três bancos seguidos. |
| **Nota geral** | **56** | Base visual e conceito acima da média, mas as primeiras semanas ainda não fazem o garoto voltar. Com jogo garantido no começo e um gol tratado como evento, o salto para 70 está ao alcance. |
