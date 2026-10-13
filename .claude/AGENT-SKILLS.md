# Skills do agent-skills (Addy Osmani)

Copiadas de [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills),
commit `1be8e34` (2026-10-10), e instaladas no próprio projeto para valerem em
toda sessão na nuvem. Nenhum script, hook ou servidor MCP do repositório foi
instalado.

## O que foi instalado

| Onde | O quê |
| --- | --- |
| `.claude/skills/` | `using-agent-skills`, `planning-and-task-breakdown`, `incremental-implementation`, `debugging-and-error-recovery`, `code-review-and-quality`, `security-and-hardening`, `code-simplification`, `browser-testing-with-devtools`, `frontend-ui-engineering`, `context-engineering` |
| `.claude/commands/` | `/plan`, `/review`, `/code-simplify`, `/test` |
| `.claude/references/` | checklists que as skills citam: definição de pronto, segurança, performance, acessibilidade e padrões de teste |

## O que mudou em relação ao original

- **Comandos:** chamam as skills pelo nome simples (`planning-and-task-breakdown`),
  sem o prefixo `agent-skills:` da instalação como plugin.
- **`/review`:** o eixo de performance aponta para
  `.claude/references/performance-checklist.md`, porque a skill
  `performance-optimization` não foi instalada.
- **`/test`:** no original roda o ciclo de TDD (skill `test-driven-development`,
  não instalada). Aqui verifica a mudança no navegador com o `playwright-cli`.
- **`browser-testing-with-devtools`:** o original instala e usa o Chrome DevTools
  MCP (`npx -y chrome-devtools-mcp@latest`). Aqui o mesmo fluxo usa o
  `playwright-cli`, que já está configurado; a seção de instalação foi trocada
  pela de uso do `playwright-cli` e o isolamento de perfil foi reescrito para ele.
- **`using-agent-skills` e `context-engineering`:** a menção ao Chrome DevTools
  passou a apontar para o `playwright-cli`.
- Os checklists citam comandos como `npx lighthouse`, `npx axe-core` e
  `npm audit` apenas como referência; nada roda sozinho.

A `using-agent-skills` descreve o pacote inteiro, então cita skills que não
foram instaladas aqui (spec, TDD, git, CI/CD e outras).

## Licença

```
MIT License

Copyright (c) 2025 Addy Osmani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
