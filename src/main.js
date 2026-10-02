// Ponto de entrada do jogo.

import { App } from './ui/app.js';

const root = document.getElementById('app');

if (!root) {
  console.error('[main] elemento #app não encontrado.');
} else {
  const app = new App(root);
  app.start().catch((error) => {
    console.error('[main] falha ao iniciar:', error);
    root.innerHTML = `
      <div class="screen">
        <div class="card">
          <h3>Não foi possível iniciar o jogo</h3>
          <p class="muted">${String(error?.message ?? error)}</p>
          <p class="muted">Dica: abra o jogo por um servidor local (ex: <code>npx serve</code>)
          em vez de abrir o arquivo direto, porque o jogo usa módulos ES.</p>
        </div>
      </div>`;
  });

  // Ajuda no debug pelo console do navegador.
  window.__jogo = app;
}
