// Helpers mínimos de DOM e de montagem de HTML.

/** Escapa texto para interpolar em HTML com segurança. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Template tag que escapa automaticamente os valores interpolados.
 * Use `raw(...)` para inserir HTML já pronto.
 */
export function html(strings, ...values) {
  return strings.reduce((acc, chunk, index) => {
    if (index === 0) return chunk;
    const value = values[index - 1];
    const rendered = Array.isArray(value)
      ? value.map((item) => (item?.__raw ? item.value : esc(item))).join('')
      : value?.__raw
        ? value.value
        : esc(value);
    return acc + rendered + chunk;
  }, '');
}

export const raw = (value) => ({ __raw: true, value: value ?? '' });

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Troca o conteúdo de um container preservando o scroll quando possível. */
export function mount(container, markup) {
  const scroll = container.scrollTop;
  container.innerHTML = markup;
  container.scrollTop = scroll;
}

/** Cria um toast temporário na tela. */
export function toast(message, type = 'info', duration = 3200) {
  let layer = qs('#toast-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'toast-layer';
    document.body.appendChild(layer);
  }
  const node = document.createElement('div');
  node.className = `toast toast--${type}`;
  node.textContent = message;
  layer.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => {
    node.classList.remove('is-visible');
    setTimeout(() => node.remove(), 300);
  }, duration);
}

/** Pequeno modal de confirmação baseado em promise. */
export function confirmDialog({ title, text, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3>${esc(title)}</h3>
        <p>${esc(text)}</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" data-modal="cancel">${esc(cancelLabel)}</button>
          <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-modal="ok">${esc(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.addEventListener('click', (event) => {
      const action = event.target.closest('[data-modal]')?.dataset.modal;
      if (action === 'ok') close(true);
      if (action === 'cancel' || event.target === overlay) close(false);
    });
  });
}
