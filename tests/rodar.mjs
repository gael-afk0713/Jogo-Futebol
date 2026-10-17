// Roda os testes do jogo.
//
//   node tests/rodar.mjs            -> verificação do código e testes do motor
//   node tests/rodar.mjs navegador  -> testes no navegador (Chromium)
//   node tests/rodar.mjs safari     -> testes no navegador com o WebKit (o motor do Safari)
//   node tests/rodar.mjs tudo       -> tudo acima
//
// Um nome depois do grupo roda só os arquivos que contêm esse nome:
//   node tests/rodar.mjs navegador escalacao
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer } from './ajuda/servidor.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const HERE = fileURLToPath(new URL('./', import.meta.url));

const group = process.argv[2] ?? 'motor';
const filter = process.argv[3] ?? '';

const list = (dir) =>
  readdirSync(`${HERE}${dir}`)
    .filter((file) => file.endsWith('.test.mjs') && file.includes(filter))
    .sort()
    .map((file) => `tests/${dir}/${file}`);

function run(file, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [file], { cwd: ROOT, env: { ...process.env, ...env } });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => resolve({ file, code, output, seconds: (Date.now() - started) / 1000 }));
  });
}

function report(result) {
  const oks = (result.output.match(/^ok\b/gm) ?? []).length;
  const fails = result.output.split('\n').filter((line) => /FALHOU|NÃO USADO|IMPORT FAIL/.test(line));
  const status = result.code === 0 ? 'ok' : 'FALHOU';
  console.log(`${status.padEnd(6)} ${result.file.padEnd(42)} ${String(oks).padStart(3)} verificações  ${result.seconds.toFixed(1)}s`);
  if (result.code !== 0) {
    for (const line of fails.length ? fails : result.output.trim().split('\n').slice(-25)) console.log(`         ${line}`);
  }
  return result.code === 0;
}

async function runGroup(files, env) {
  let passed = true;
  for (const file of files) passed = report(await run(file, env)) && passed;
  return passed;
}

async function browserGroup(engine) {
  const server = await startServer();
  console.log(`\nNavegador (${engine}) em ${server.url}`);
  try {
    return await runGroup(list('navegador'), { BASE_URL: server.url, NAVEGADOR: engine });
  } finally {
    await server.close();
  }
}

let passed = true;
if (group === 'motor' || group === 'tudo') {
  console.log('Verificação do código e motor do jogo');
  if (!filter || 'verificacao'.includes(filter)) passed = (await runGroup(['tests/verificacao.mjs'])) && passed;
  passed = (await runGroup(list('motor'))) && passed;
}
if (group === 'navegador' || group === 'tudo') passed = (await browserGroup('chromium')) && passed;
if (group === 'safari' || group === 'tudo') passed = (await browserGroup('webkit')) && passed;
if (!['motor', 'navegador', 'safari', 'tudo'].includes(group)) {
  console.log(`Grupo desconhecido: ${group}. Use motor, navegador, safari ou tudo.`);
  passed = false;
}

console.log(passed ? '\nTudo certo.' : '\nHá falhas acima.');
process.exitCode = passed ? 0 : 1;
