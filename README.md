# ⚽ Craque do Zero

Jogo de **carreira de futebol** no estilo BitLife: você cria um jogador de 16 anos
sem clube nenhum, escolhe a posição, distribui atributos, e vai construindo a
carreira decisão por decisão — do treino da semana à festa depois da vitória,
da proposta da Europa ao último lance da final.

A diferença em relação a um BitLife puro: **as partidas são interativas**. Em vez
de só ver o resultado, você entra em campo e decide os lances em que se envolve —
bater cruzado ou cavar por cima do goleiro, entrar firme na dividida ou antecipar,
cobrar o pênalti de Panenka ou passar a bola para outro.

Roda direto no navegador, sem build e sem dependências. Dá para jogar offline
(save no navegador) ou com **Firebase Authentication + Firestore** para login e
save na nuvem.

---

## Como jogar agora

O jogo usa módulos ES, então precisa ser servido por HTTP (abrir o `index.html`
com dois cliques não funciona).

```bash
# opção 1 — Python (já vem instalado na maioria dos sistemas)
python3 -m http.server 8000

# opção 2 — Node
npx --yes serve .
```

Depois abra <http://localhost:8000>.

Para publicar de graça: **Settings → Pages → Deploy from a branch** no GitHub e
escolha a branch e a pasta raiz (`/`). O jogo é 100% estático.

---

## O jogo

### 1. Criação do personagem
- Nome, nome na camisa, número, nacionalidade (18 países) e pé preferido
- Altura e peso
- Aparência: tom de pele, cabelo (6 estilos), cor do cabelo, barba, acessório
- **Posição**: GOL, ZAG, LAT, VOL, MC, MEI, PON, SA, ATA — cada uma com um perfil
  de atributos e uma fórmula própria de overall
- **2 traços** entre 14 opções (ex: *Canhota mágica*, *Matador de área*,
  *Dono do alto*, *Sangue frio*, *Midiático*, *Pavio curto*)
- **26 pontos** para distribuir entre as áreas de atributo

### 2. Começando do zero
Você não começa num clube grande: três peneiras aparecem, e a escolha muda quanto
você vai jogar e aparecer no primeiro ano.

### 3. A semana
Cada semana tem três etapas:

1. **Treino** — 11 focos diferentes (técnico, físico, musculação, tático, bola
   parada, finalização, drible, treino de goleiro, jogo com os pés do goleiro,
   descanso, folga), mais os
   liberados pela loja. Com o *Tablet de análise de treino*, passar o mouse (ou
   tocar no olho) mostra exatamente o XP de cada atributo, o que sobe, a forma,
   a felicidade, os pontos e o risco de lesão daquele treino. Cada um mexe em
   evolução, forma física, felicidade e na relação com o técnico. O
   **preparador** recomenda o treino da semana e explica o porquê (veja abaixo).
2. **Vida** — eventos no estilo BitLife: festas, relacionamentos, imprensa,
   patrocínios, investimentos, brigas de vestiário, apostas, projetos sociais,
   saúde mental, convite para documentário... Alguns têm resultado garantido,
   outros são loteria, e outros testam o seu carisma ou a sua inteligência.
3. **Partida** — entrar em campo e decidir os lances, ou simular.

Se você não for escalado (forma ruim, relação ruim com o técnico, lesão ou
suspensão), você assiste do banco — e isso cobra o seu preço.

#### O preparador
O cartão no topo do treino faz a mesma conta do treino de verdade
(`src/engine/coach.js`) e compara todas as opções em "semanas de evolução":

- **Quanto você melhora**: só conta o XP que cai em atributos abaixo do teto,
  pesado pelo que importa na sua posição (65% o peso no overall, 35% o quanto o
  atributo aparece nos lances da sua zona). Por isso um goleiro com os atributos
  de goleiro no teto é mandado para o tático ou o jogo com os pés.
- **O que custa**: forma antes do jogo (pesa mais quando tem partida na semana),
  felicidade, relação com o técnico, inteligência, saúde e o risco de lesão.
  Cada ponto vale mais quando o número está baixo.
- Cada linha mostra a evolução real (alta, média, baixa ou nenhuma), quantos
  atributos já estão no teto e o risco de lesão de verdade.
- **Simular** semanas segue o preparador (antes simulava sempre o treino
  técnico, mesmo cansado).

Os pesos foram calibrados simulando 200 carreiras de cada jeito:

| Jeito de treinar | Overall no auge | Nota média | Legado | Lesões no treino |
| --- | --- | --- | --- | --- |
| Sempre o treino técnico (o simular antigo) | 83,1 | 6,21 | 1333 | 20,6 |
| A sugestão antiga | 85,0 | 6,47 | 1795 | 7,0 |
| O preparador | 85,7 | 6,62 | 2276 | 6,8 |

### 4. Dentro de campo
O motor sorteia lances compatíveis com a sua posição (o goleiro também sai
jogando com os pés, faz lançamentos, sai da área como líbero, monta a barreira e
pode até subir no escanteio do último minuto) e mostra a **chance real de
sucesso** de cada opção, calculada a partir dos seus atributos, dos seus traços,
da sua energia naquele minuto e da força do adversário. Entre os seus lances, o
resto do jogo é simulado.

Os desfechos viram gol, assistência, defesa, desarme, falta, cartão, pênalti,
lesão — e a sua nota da partida, que é a média da qualidade das suas decisões
(não a soma: participar de muitos lances não infla nada).

### 5. Evolução
- **XP automático** nos atributos treinados
- **Pontos de evolução** para gastar à mão, com custo crescente
- Evolução de fim de temporada a partir de minutos jogados, nota média, condição
  física, felicidade e nível dos adversários enfrentados
- **Potencial oculto**, revelado depois de 3 temporadas. Ele sobe com boas
  temporadas (a meta de nota é ajustada pela posição: goleiros e defensores têm
  meta mais baixa) e quando você encosta no teto nos atributos principais, para a
  carreira não travar. Sobe até +2 por temporada, até os 29 anos, e fica mais
  difícil acima de 88. Só um começo de carreira muito ruim derruba o potencial.
- Declínio a partir dos 32, começando por velocidade e resistência

### 5b. Investir na evolução
Na aba Atributos há uma loja para gastar o dinheiro da carreira:
- **Equipamento** (compra única): chuteira ou luvas (bônus em atributos), colete
  GPS (treino físico rende mais e machuca menos), academia em casa e centro de
  recuperação (liberam treinos novos).
- **Equipe pessoal** (custo semanal, pode dispensar): nutricionista, preparador
  físico, analista de desempenho, fisioterapeuta, psicólogo do esporte e mentor
  ex-craque. Alguns liberam treinos novos: *Análise de vídeo* e *Treino com o mentor*.
- **Da sua posição**: cada área tem profissionais e equipamentos próprios.
  Goleiro (luvas, máquina lançadora, treinador de goleiros), defesa (caneleiras,
  treinador de defesa), meio-campo (rebatedor de passes, coach de visão de jogo),
  ataque (gol com goleiro-robô, treinador de finalização) e velocidade para
  laterais e atacantes. Liberam *Reflexo na máquina*, *Marcação individual*,
  *Paredão de passe* e *Treino de artilheiro*.

### 6. Mercado da bola
No fim de cada temporada você recebe propostas de verdade, geradas a partir do
seu overall, idade, potencial, nota da temporada, fama, reputação e disciplina.
Cada proposta diz a função (estrela, titular, rotação, promessa), salário, luvas,
duração e multa. Também existem renovação e empréstimo para quem não está jogando.

São **202 clubes em 18 ligas** (da Copa São Paulo de Juniores e Série C
brasileira até Premier League, LaLiga, Bundesliga, Serie A, Saudi Pro League).

### 7. Seleção, títulos e prêmios
- Convocação baseada em overall, visibilidade da liga, fama e forma
- Copa do Mundo e torneios continentais nos anos certos
- Liga em pontos corridos com tabela viva, copa nacional e torneio continental
- Prêmios individuais: artilharia, melhor da liga, seleção do campeonato,
  revelação, Luva de Ouro, Golden Boy, melhor do mundo na posição e **Bola de Ouro**

### 8. Dinheiro e vida
Salário e gastos semanais (custo de vida, equipe e manutenção dos bens),
patrocínios, carros, casa da família e investimentos que rendem ou viram pó no
fim da temporada.

### 8b. Gastar o dinheiro
Na aba Vida há uma loja com **150 itens** em nove categorias, de €15 por semana
a €150 milhões, para ter onde gastar do primeiro salário até o fim da carreira:

| Categoria | Exemplos | O que dá |
| --- | --- | --- |
| Lazer | streaming, videogame, kart, festa, cinema em casa, kartódromo | felicidade e vestiário |
| Luxo | relógio, esportivo, iate, jatinho, castelo, ilha particular | fama e felicidade, com manutenção |
| Desempenho | colchão, óculos estroboscópico, câmara hiperbárica, CT particular, longevidade | treino, forma, lesões, queda mais lenta |
| Casa e família | cachorro, casa para os pais, chef, motorista, fazenda | felicidade, forma, disciplina |
| Imagem e social | hospital infantil, instituto, assessor de imprensa, agência de patrocínios | reputação, torcida, patrocínios |
| Estudo | inglês, xadrez, media training, licença de treinador, MBA | inteligência, carisma, finanças |
| Viagens | praia, Maldivas, churrasco do elenco, cruzeiro com o elenco, espaço | felicidade, forma, vestiário, técnico |
| Investimentos | poupança, cripto, franquia, prédio, shopping, comprar o seu clube | rendimento anual com risco |
| Coleção | álbum da Copa, camisas históricas, quadro, carro clássico | valoriza com o tempo |

- **Compra única**: vale enquanto você tiver; dá para revender por uma parte do
  preço (a tatuagem e o cachorro, não). O bônus da compra só vem na primeira vez.
- **Serviço**: cobra por semana e pode ser cancelado.
- **Experiência**: muda a vida na hora e volta depois de algumas semanas (ou uma
  vez por temporada, ou uma vez na carreira). Algumas podem dar ruim.
- **Investimento e coleção**: pagam um rendimento e mudam de valor no fim da
  temporada; ano ruim derruba o valor e os mais arriscados podem quebrar.
  Resgate quando quiser pelo valor do momento, menos a taxa.

Para nada ficar roubado, os bônus somados de todos os itens têm teto (no
máximo +4 por atributo, +2 de felicidade por semana, treino rendendo até +80%,
risco de lesão no mínimo pela metade). Nos testes, uma carreira que compra
tudo assim que pode termina com uns 2 de overall a mais no auge do que quem só
usa a loja de evolução, e gasta quase todo o dinheiro para isso.

### 9. Aposentadoria
Pare quando quiser (ou quando a idade decidir) e veja o resumo do legado, com uma
classificação que vai de *Sonho interrompido* a **Lenda eterna**.

---

## Várias carreiras

O álbum guarda até **6 carreiras ao mesmo tempo**. Na capa aparecem todas, cada
uma como uma figurinha, com o botão de jogar e o de apagar; os espaços livres
ficam numerados. O botão de álbum na barra de cima salva a carreira atual e volta
para a lista.

Sem conta, as carreiras ficam no navegador. Com login (e-mail, Google ou
convidado), ficam também na nuvem e aparecem em qualquer aparelho em que você
entrar. Ao fazer login, as carreiras que você criou sem conta naquele navegador
sobem para a sua conta. Quem entra como convidado pode depois transformar a conta
em e-mail ou Google sem perder nenhuma carreira.

## Firebase (login e save na nuvem)

Sem configurar nada, o jogo salva no `localStorage` do navegador. Para ter login
e save na nuvem:

1. Crie um projeto no [console do Firebase](https://console.firebase.google.com).
2. **Authentication → Sign-in method**: ative *E-mail/senha*. Se quiser os botões
   extras, ative também *Google* e *Anônimo*.
3. **Firestore Database**: crie o banco em modo de produção.
4. **Configurações do projeto → Seus aplicativos → Web**: registre um app web e
   copie o objeto de configuração.
5. Cole os valores em [`src/firebase/config.js`](src/firebase/config.js):

```js
export const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:abc123',
};
```

6. **Firestore Database → Regras**: cole o conteúdo de
   [`firestore.rules`](firestore.rules) e clique em *Publicar*. Sem isso o
   Firestore recusa os saves (o jogo avisa com "O Firestore recusou o acesso").
7. Em **Authentication → Settings → Authorized domains**, adicione o domínio onde
   o jogo vai rodar (ex: `seu-usuario.github.io`). `localhost` já vem autorizado.

> A `apiKey` do Firebase Web é pública por natureza: ela só identifica o projeto.
> A segurança real vem das regras do Firestore.

Cada carreira fica em `users/{uid}/careers/{id}`, e as regras só deixam o dono
ler e escrever. O jogo salva sozinho a cada ação (no navegador na hora, na nuvem
com um atraso para não escrever a cada clique). O disquete na barra de cima força
o save imediato. Ao abrir uma carreira, vale a cópia mais recente entre nuvem e
navegador. Saves do formato antigo (uma carreira por conta) são migrados sozinhos
no primeiro login.

---

## Visual

A interface é desenhada como um **álbum de figurinhas**: você é uma figurinha, cada
temporada completa é colada num espaço numerado, títulos e prêmios viram figurinhas
brilhantes e o que ainda falta aparece como espaço vazio. Funciona no celular e no
computador, e segue o modo claro ou noturno do sistema. As regras estão em
[`DESIGN.md`](DESIGN.md).

## Estrutura do código

```
index.html                 página única
assets/css/style.css       mundo "álbum de figurinhas", claro e noturno
assets/fonts/              Barlow e Barlow Condensed hospedadas no projeto (OFL)
assets/avatar/             retratos em camadas (pele, cabelo, barba)
assets/icons/              ícone da tela de início (iPhone, iPad e Android)
manifest.webmanifest       nome e ícones do atalho na tela de início
DESIGN.md                  sistema visual: tokens, regras e componentes
PRODUCT.md                 quem joga, para quê e o que não pode mudar
src/
  main.js                  ponto de entrada
  core/
    game.js                controlador: estado, ações, loop semanal, fim de temporada
    rng.js                 aleatoriedade com semente (save reproduzível)
    storage.js             várias carreiras: navegador + nuvem, migração
    utils.js               helpers (dinheiro, clamp, logística, datas)
  data/                    conteúdo do jogo, separado das regras
    attributes.js          34 atributos em 7 grupos
    positions.js           9 posições, pesos de overall e perfis
    clubs.js               18 ligas, 202 clubes, prestígio e salários
    nations.js             20 seleções
    traits.js              14 traços com efeitos em campo e fora
    lifeEvents.js          33 eventos de vida com condições e desfechos
    shop.js                itens da loja de evolução: equipamento e equipe
    lifestyle.js           150 itens da aba Vida: lazer, luxo, investimentos...
    matchMoments.js        24 lances interativos de partida
    names.js               geradores de nome por país
  engine/                  regras puras, sem DOM
    player.js              criação e atributos de vida
    overall.js             overall por posição, teto e custos
    match.js               motor de partida (máquina de estados)
    season.js              calendário, tabela, copas, resumo
    training.js            treino semanal e XP
    coach.js               preparador: recomenda o treino e explica o porquê
    life.js                sorteio e resolução de eventos
    progression.js         evolução, declínio, aposentadoria, legado
    transfers.js           valor de mercado, propostas, contratos
    national.js            convocações e torneios de seleção
    awards.js              premiações e bônus
    finance.js             salário, gastos, patrocínio, fechamento dos investimentos
    shop.js                compra, venda, dispensa, efeitos e tetos dos itens
  ui/
    app.js                 roteador de telas e delegação de eventos
    components.js          figurinhas, avatar SVG, medidores, tabelas
    icons.js               ícones Phosphor usados no jogo (MIT)
    dom.js                 helpers, toast, modal
    screens/               auth, create, trials, hub, match, offseason, retired
  firebase/
    config.js              suas chaves (opcional)
    firebase.js            auth + firestore carregados sob demanda
firestore.rules            regras de segurança do save na nuvem
```

O `engine/` não conhece o DOM e o `data/` não conhece as regras, então dá para
adicionar conteúdo (um clube, um traço, um evento, um lance de partida) só
editando um arquivo de dados.

---

## Dá para aumentar o jogo assim

- **Novo clube ou liga**: adicione em `src/data/clubs.js`. O prestígio define
  força do plantel, salário e interesse em você.
- **Novo evento de vida**: adicione em `src/data/lifeEvents.js` com `when`
  (condições) e `options` (efeitos garantidos, `outcomes` sorteados ou `check`
  contra um stat).
- **Novo lance de partida**: adicione em `src/data/matchMoments.js` dizendo as
  zonas do campo, os atributos que pesam e os desfechos.
- **Novo item da loja da vida**: `src/data/lifestyle.js`, com `own` (compra
  única), `hire` (por semana), `live` (experiência) ou `asset` (investimento).
- **Novo traço**: `src/data/traits.js`, com bônus de atributo, modificadores de
  partida (`shoot`, `dribble`, `pass`, `tackle`, `save`, `aerial`, `clutch`,
  `setPiece`, `cardRisk`, `staminaDrain`) ou de vida.

---

## Observação sobre nomes

Nomes de clubes, ligas e competições aparecem apenas como referência de fãs, para
dar contexto ao jogo. Não há vínculo, licença ou patrocínio oficial de nenhuma
entidade.
