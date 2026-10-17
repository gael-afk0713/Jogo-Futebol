// Abre o navegador dos testes: Chromium por padrão, WebKit (o motor do Safari,
// o mesmo do iPad) com NAVEGADOR=webkit. O endereço do jogo vem de BASE_URL,
// que o tests/rodar.mjs preenche ao subir o servidor.
import { chromium, webkit } from 'playwright';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASE = process.env.BASE_URL ?? 'http://localhost:8123';
export const ENGINE = process.env.NAVEGADOR === 'webkit' ? 'webkit' : 'chromium';

// Ambientes com navegadores pré-instalados (PLAYWRIGHT_BROWSERS_PATH) podem ter
// uma versão diferente da que o playwright espera: usa a mais nova instalada.
function preinstalled() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const candidates = ENGINE === 'webkit' ? ['pw_run.sh'] : ['chrome-linux64/chrome', 'chrome-linux/chrome'];
  const dirs = readdirSync(root)
    .filter((dir) => new RegExp(`^${ENGINE}-\\d+$`).test(dir))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const dir of dirs) {
    for (const candidate of candidates) {
      const path = join(root, dir, candidate);
      if (existsSync(path)) return path;
    }
  }
  return undefined;
}

// Nada de rede de fora nos testes: sem Firebase, sem reCAPTCHA. O jogo segue
// offline, como faz quando o Firebase não carrega.
const BLOCKED = /gstatic\.com|googleapis\.com|recaptcha|firebaseio\.com|firebaseapp\.com/;

function blockOutside(target) {
  return target.route(BLOCKED, (route) => route.abort());
}

/** Abre o navegador. `args` só vale no Chromium. */
export async function launch({ args, ...options } = {}) {
  const type = ENGINE === 'webkit' ? webkit : chromium;
  const settings = { ...options, ...(ENGINE === 'chromium' && args ? { args } : {}) };
  let browser;
  try {
    browser = await type.launch(settings);
  } catch (error) {
    const executablePath = preinstalled();
    if (!executablePath) throw error;
    browser = await type.launch({ ...settings, executablePath });
  }
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (contextOptions = {}) => {
    // O WebKit não aceita isMobile em todas as plataformas; o toque continua.
    const context = await newContext(ENGINE === 'webkit' ? { ...contextOptions, isMobile: false } : contextOptions);
    await blockOutside(context);
    return context;
  };
  browser.newPage = async (pageOptions = {}) => {
    const context = await browser.newContext(pageOptions);
    return context.newPage();
  };
  return browser;
}

/** Pasta para as capturas de tela de um teste (fica fora do git). */
export function saida(nome) {
  const dir = fileURLToPath(new URL(`../.saida/${ENGINE}/${nome}/`, import.meta.url));
  mkdirSync(dir, { recursive: true });
  return dir;
}
