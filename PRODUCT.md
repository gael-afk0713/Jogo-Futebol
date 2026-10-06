# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fãs de futebol que jogam em português do Brasil, no celular e no computador com o mesmo peso. Jogam em sessões curtas e repetidas, no ritmo de um BitLife: uma semana da carreira por vez, decidindo, lendo o desfecho e voltando depois. O trabalho deles é construir uma carreira própria a partir do zero e ver as consequências das escolhas.

## Product Purpose

Jogo de carreira de futebol no estilo BitLife. A pessoa cria um jogador de 16 anos sem clube, escolhe posição, aparência, traços e atributos, e conduz a carreira semana a semana até a aposentadoria. Sucesso é a vontade de jogar "só mais uma semana" e de recomeçar com outra carreira ao terminar.

## Positioning

Diferente de um BitLife puro, as partidas são interativas: o jogador decide os lances em que se envolve e vê a chance real de sucesso de cada opção, calculada a partir dos próprios atributos, traços, energia e da força do adversário. As decisões dentro e fora de campo alimentam a mesma carreira.

## Operating Context

- Loop semanal em três etapas: treino → evento de vida → partida (interativa ou simulada), depois avançar a semana.
- Fim de temporada: balanço, evolução de overall, prêmios, seleção, dinheiro e mercado de transferências com propostas.
- Telas existentes: entrada/login, criação do personagem, peneiras, hub (abas Semana, Atributos, Vida, Carreira, Liga), partida, fim de temporada, aposentadoria.
- Muita informação numérica: atributos 0–99, overall, notas de partida, tabela da liga, dinheiro, chances em porcentagem.
- Save automático no navegador; login e save na nuvem opcionais via Firebase.

## Capabilities and Constraints

- Site estático em HTML, CSS e JavaScript puro com módulos ES, sem build e sem dependências (`index.html`, `assets/css/style.css`, `src/`).
- A interface é gerada por template strings em `src/ui/` com delegação de eventos via `data-action`; a lógica em `src/engine/` e os dados em `src/data/` não conhecem o DOM.
- Avatar do jogador é SVG gerado em código (`src/ui/components.js`).
- Hospedagem prevista: GitHub Pages ou qualquer servidor estático.
- Nome atual: "Craque do Zero". Não é compromisso fixo; pode ser revisto.

## Brand Commitments

- Nomes reais de clubes, ligas e competições, usados como referência de fã, com o aviso de ausência de vínculo oficial.
- Toda a interface, narração e textos em português do Brasil.

## Evidence on Hand

- Conteúdo real do jogo: 18 ligas e 202 clubes (`src/data/clubs.js`), 33 eventos de vida (`src/data/lifeEvents.js`), 19 lances de partida (`src/data/matchMoments.js`), 14 traços, 9 posições, 20 seleções.
- Não existem logos, escudos, fotos, depoimentos ou métricas de jogadores reais; nada disso deve ser fabricado.

## Product Principles

1. Cada decisão precisa mostrar a consequência: o jogador sempre vê o que mudou e por quê.
2. A chance de sucesso é verdade, não decoração: números exibidos refletem o cálculo real do motor.
3. Uma semana cabe numa sessão curta; nada deve exigir ler a tela inteira para dar o próximo passo.
4. Celular e computador são cidadãos de primeira classe.
5. Futebol brasileiro como ponto de partida, mundo do futebol como horizonte.
