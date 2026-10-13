// Tela de carregamento (o HTML e o CSS ficam no index.html). Cada etapa real
// cola uma figurinha: 1 a página abriu, 2 o código do jogo chegou
// (src/main.js), 3 a conta foi conferida e 4 as carreiras foram lidas
// (src/ui/app.js). Numa internet boa as etapas chegam quase juntas e as
// figurinhas colam em sequência rápida, em menos de um segundo; se demorar,
// aparecem dicas do jogo.
//
// É um script comum (não módulo), carregado logo depois do #boot, para rodar
// antes de o código do jogo chegar. Fica fora do HTML por causa da política
// de segurança de conteúdo (CSP), que não aceita script embutido.
(function () {
  var root = document.getElementById('boot');
  var app = document.getElementById('app');
  if (!root) return;
  var slots = root.querySelectorAll('.boot__slot');
  var live = root.querySelector('.boot__live');
  var tip = root.querySelector('.boot__tip');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SETTLE_MS = reduce ? 200 : 380; // a figurinha já assentou (a colagem toda leva 480ms)
  var GAP_MS = 130; // intervalo mínimo entre duas figurinhas
  var TIP_AFTER_MS = 2000; // a primeira dica só aparece se passar disso
  var TIP_EVERY_MS = 7000;
  var GIVE_UP_MS = 12000; // código chegou, mas a nuvem não responde: abre assim mesmo
  var TIPS = [
    'Disciplina abaixo de 40 dá multa, banco e propostas piores.',
    'Com disciplina 75 ou mais, você vira exemplo: técnico e vestiário melhoram aos poucos.',
    'Cada jogo inteiro custa 5 de forma física. Descansar também é treinar.',
    'A fama cai 1 ponto a cada jogo em que você não entra em campo.',
    'Na base, o clube pequeno dá mais jogos; o grande, treino melhor e mais vitrine.',
    'Time Sub-20 só segura jogador até os 19 anos.',
    'Minutos em campo dão experiência, que ajuda no pênalti, no último lance e no clássico.',
    'Até os 22 anos, a experiência deixa os clubes mais interessados em você.',
    'Cada meta da temporada cumprida paga bônus e melhora a relação com o técnico.',
    'Ganhar o clássico agrada muito mais a torcida, e cada gol nele vale fama.',
    'Com o tablet de análise, o preparador acerta sempre e mostra o XP de cada atributo.',
    'As propostas do fim do ano olham overall, idade, nota da temporada, fama e disciplina.',
    'O potencial fica escondido até a terceira temporada. Boas temporadas fazem ele subir.',
    'Na partida, a chance de cada opção é a chance real de dar certo.',
    'Gol e assistência pesam bastante na nota: um gol leva a nota para perto de 7,2.',
    'Na chuva forte, a trava alta evita que passe, drible e defesa fiquem mais difíceis.',
    'O goleiro amadurece mais tarde e chega perto do potencial lá pelos 27 ou 28 anos.',
    'Investimentos mudam de valor no fim da temporada, e os mais arriscados podem quebrar.',
    'O declínio começa aos 32, primeiro na velocidade e na resistência.',
    'Quem joga a Série B ou a C abre o ano no estadual ou numa copa regional.',
    'O álbum guarda até 6 carreiras ao mesmo tempo.',
    'Entrando na conta, as carreiras ficam salvas na nuvem.',
  ];
  var reached = 0;
  var glued = 0;
  var lastGlue = -Infinity;
  var finishing = false;
  var gone = false;
  var pumpTimer = null;
  var tipTimer = null;
  var giveUpTimer = null;
  var tipIndex = Math.floor(Math.random() * TIPS.length);

  // O jogo por baixo não recebe toque nem foco enquanto a capa está na frente.
  if (app) app.setAttribute('inert', '');

  function mark() {
    for (var i = 0; i < slots.length; i++) slots[i].classList.toggle('is-current', i === glued);
    var current = slots[glued];
    live.textContent = current ? current.querySelector('.boot__label').textContent + '...' : 'Pronto.';
  }

  // Cola a próxima figurinha que já pode colar; no fim, espera a última assentar e sai.
  function pump() {
    pumpTimer = null;
    if (gone) return;
    var now = Date.now();
    var wait;
    if (glued < reached) {
      wait = lastGlue + GAP_MS - now;
      if (wait <= 0) {
        slots[glued].classList.add('is-done');
        glued += 1;
        lastGlue = now;
        mark();
        wait = GAP_MS;
      }
    } else if (finishing) {
      wait = lastGlue + SETTLE_MS - now;
      if (wait <= 0) return leave();
    } else {
      return;
    }
    pumpTimer = setTimeout(pump, wait);
  }

  function leave() {
    gone = true;
    clearTimeout(tipTimer);
    clearTimeout(giveUpTimer);
    if (app) app.removeAttribute('inert');
    root.classList.add('is-leaving');
    setTimeout(function () {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, reduce ? 0 : 260);
  }

  function showTip() {
    if (gone) return;
    var first = !tip.textContent;
    tip.classList.remove('is-visible');
    setTimeout(
      function () {
        if (gone) return;
        tip.innerHTML = '<strong>Dica:</strong> ' + TIPS[tipIndex % TIPS.length];
        tipIndex += 1;
        tip.classList.add('is-visible');
      },
      first || reduce ? 0 : 300,
    );
    tipTimer = setTimeout(showTip, TIP_EVERY_MS);
  }

  function step(n) {
    if (gone) return;
    if (n > reached) reached = Math.min(n, slots.length);
    if (reached >= 2 && !giveUpTimer) giveUpTimer = setTimeout(finish, GIVE_UP_MS);
    if (!pumpTimer) pump();
  }

  function finish() {
    finishing = true;
    step(slots.length);
  }

  function fail() {
    if (gone) return;
    clearTimeout(tipTimer);
    clearTimeout(giveUpTimer);
    root.classList.add('is-failed');
    live.textContent = 'Não consegui abrir o jogo.';
  }

  // Se o código do jogo não chegar (internet caiu, arquivo faltando), o erro de
  // carregamento do <script type="module"> só é visto na fase de captura.
  window.addEventListener(
    'error',
    function (event) {
      var target = event.target;
      if (target && target.tagName === 'SCRIPT' && target.type === 'module') fail();
    },
    true,
  );

  var retry = root.querySelector('[data-boot-retry]');
  if (retry) {
    retry.addEventListener('click', function () {
      location.reload();
    });
  }

  window.__boot = { step: step, finish: finish, fail: fail };
  mark();
  tipTimer = setTimeout(showTip, TIP_AFTER_MS);
  step(1);
})();
