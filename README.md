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

1. **Treino** — 9 focos diferentes (técnico, físico, musculação, tático, bola
   parada, finalização, treino de goleiro, descanso, folga). Cada um mexe em
   evolução, forma física, felicidade e na relação com o técnico.
2. **Vida** — eventos no estilo BitLife: festas, relacionamentos, imprensa,
   patrocínios, investimentos, brigas de vestiário, apostas, projetos sociais,
   saúde mental, convite para documentário... Alguns têm resultado garantido,
   outros são loteria, e outros testam o seu carisma ou a sua inteligência.
3. **Partida** — entrar em campo e decidir os lances, ou simular.

Se você não for escalado (forma ruim, relação ruim com o técnico, lesão ou
suspensão), você assiste do banco — e isso cobra o seu preço.

### 4. Dentro de campo
O motor sorteia lances compatíveis com a sua posição e mostra a **chance real de
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
- **Potencial oculto**, revelado depois de 3 temporadas, que pode subir se você
  surpreender (ou cair se decepcionar)
- Declínio a partir dos 32, começando por velocidade e resistência

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
Salário e gastos semanais, patrocínios, carros, casa da família, investimentos
(renda fixa, imóvel, sociedade, escolinha) que rendem ou viram pó no fim do ano.

### 9. Aposentadoria
Pare quando quiser (ou quando a idade decidir) e veja o resumo do legado, com uma
classificação que vai de *Sonho interrompido* a **Lenda eterna**.

---

## Firebase (opcional)

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

6. Publique as regras de segurança de [`firestore.rules`](firestore.rules) para
   que cada pessoa só leia e escreva a própria carreira.
7. Em **Authentication → Settings → Authorized domains**, adicione o domínio onde
   o jogo vai rodar (ex: `seu-usuario.github.io`).

> A `apiKey` do Firebase Web é pública por natureza — ela só identifica o projeto.
> A segurança real vem das regras do Firestore.

O jogo salva sozinho a cada ação (local na hora, nuvem com um atraso para não
escrever a cada clique). O 💾 na barra de cima força o save imediato.

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
DESIGN.md                  sistema visual: tokens, regras e componentes
PRODUCT.md                 quem joga, para quê e o que não pode mudar
src/
  main.js                  ponto de entrada
  core/
    game.js                controlador: estado, ações, loop semanal, fim de temporada
    rng.js                 aleatoriedade com semente (save reproduzível)
    storage.js             save local + nuvem com debounce
    utils.js               helpers (dinheiro, clamp, logística, datas)
  data/                    conteúdo do jogo, separado das regras
    attributes.js          34 atributos em 7 grupos
    positions.js           9 posições, pesos de overall e perfis
    clubs.js               18 ligas, 202 clubes, prestígio e salários
    nations.js             20 seleções
    traits.js              14 traços com efeitos em campo e fora
    lifeEvents.js          33 eventos de vida com condições e desfechos
    matchMoments.js        19 lances interativos de partida
    names.js               geradores de nome por país
  engine/                  regras puras, sem DOM
    player.js              criação e atributos de vida
    overall.js             overall por posição, teto e custos
    match.js               motor de partida (máquina de estados)
    season.js              calendário, tabela, copas, resumo
    training.js            treino semanal e XP
    life.js                sorteio e resolução de eventos
    progression.js         evolução, declínio, aposentadoria, legado
    transfers.js           valor de mercado, propostas, contratos
    national.js            convocações e torneios de seleção
    awards.js              premiações e bônus
    finance.js             salário, gastos, investimentos
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
- **Novo traço**: `src/data/traits.js`, com bônus de atributo, modificadores de
  partida (`shoot`, `dribble`, `pass`, `tackle`, `save`, `aerial`, `clutch`,
  `setPiece`, `cardRisk`, `staminaDrain`) ou de vida.

---

## Observação sobre nomes

Nomes de clubes, ligas e competições aparecem apenas como referência de fãs, para
dar contexto ao jogo. Não há vínculo, licença ou patrocínio oficial de nenhuma
entidade.
