// Ponte com a tela de carregamento montada no index.html: cada etapa
// concluída cola uma figurinha, e finish() tira a capa quando a última assenta.
// Sem a tela (ela já saiu ou não existe), as chamadas não fazem nada.

const screen = () => window.__boot;

export const boot = {
  /** Etapas concluídas: 2 o código chegou, 3 a conta foi conferida. */
  step: (n) => screen()?.step(n),
  /** As carreiras foram lidas: cola o que falta e abre o jogo. */
  finish: () => screen()?.finish(),
};
