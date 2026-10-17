// Verificação do código, sem navegador:
//   1. todo módulo de src/ carrega sem erro;
//   2. nenhum import fica sem uso;
//   3. todo data-action do HTML tem quem trate.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.js')) files.push(path);
  }
})(join(ROOT, 'src'));

let problems = 0;

// 1. Carrega tudo (menos o que toca o DOM na carga).
const SKIP = ['main.js', 'boot-screen.js'];
let loaded = 0;
for (const file of files) {
  if (SKIP.some((name) => file.endsWith(name))) continue;
  try {
    await import(pathToFileURL(file).href);
    loaded += 1;
  } catch (error) {
    problems += 1;
    console.log(`FALHOU - não carrega: ${file.replace(ROOT, '')} -> ${error.message}`);
  }
}
console.log(`${problems ? 'FALHOU' : 'ok'} - ${loaded} módulos carregam sem erro`);

// 2. Imports sem uso.
let unused = 0;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const body = source.replace(/^import[\s\S]*?from\s+'[^']+';$/gm, '');
  for (const match of source.matchAll(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)';$/gm)) {
    for (let name of match[1].split(',')) {
      name = name.trim().split(/\s+as\s+/).pop().trim();
      if (!name) continue;
      if (!new RegExp(`\\b${name.replace(/[$]/g, '\\$')}\\b`).test(body)) {
        unused += 1;
        console.log(`FALHOU - import sem uso: ${file.replace(ROOT, '')} -> ${name}`);
      }
    }
  }
}
problems += unused;
console.log(`${unused ? 'FALHOU' : 'ok'} - imports sem uso: ${unused}`);

// 3. data-action sem quem trate.
const used = new Set();
const defined = new Set(['noop']);
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/data-action="([a-z-]+)"/g)) used.add(match[1]);
  for (const match of source.matchAll(/^\s{4}'?([a-zA-Z-]+)'?:\s*(?:async\s*)?\(ctx/gm)) defined.add(match[1]);
  for (const match of source.matchAll(/^\s{6}'([a-z-]+)':\s*(?:async\s*)?\(\)/gm)) defined.add(match[1]);
}
const missing = [...used].filter((action) => !defined.has(action));
problems += missing.length;
console.log(`${missing.length ? 'FALHOU' : 'ok'} - ações sem quem trate: ${missing.length ? missing.join(', ') : 'nenhuma'}`);

if (problems) process.exitCode = 1;
