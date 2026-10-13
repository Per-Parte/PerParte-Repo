import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const appDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(appDir, '../..');
const port = Number(process.env.PORT || 4173);
const routes = new Map([
  ['/', ['apps/quadro/index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['apps/quadro/app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['apps/quadro/style.css', 'text/css; charset=utf-8']],
  ['/tokens.css', ['packages/design-system/tokens.css', 'text/css; charset=utf-8']],
  ['/conteudo/revista', ['docs/fonte/Per-Parte-Revista-de-Marca.pdf', 'application/pdf']],
  ['/conteudo/visao', ['docs/visao-geral.md', 'text/plain; charset=utf-8']],
  ['/conteudo/design', ['docs/design-system.md', 'text/plain; charset=utf-8']],
  ['/conteudo/gantri', ['docs/pesquisa/gantri.md', 'text/plain; charset=utf-8']],
  ['/conteudo/requisitos', ['.claude/requirements.md', 'text/plain; charset=utf-8']],
  ['/conteudo/roadmap', ['.claude/roadmap.md', 'text/plain; charset=utf-8']],
  ['/conteudo/site', ['.claude/fluxo-site.md', 'text/plain; charset=utf-8']],
  ['/conteudo/configurador', ['.claude/fluxo-configurador.md', 'text/plain; charset=utf-8']]
]);

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  const route = routes.get(pathname);
  if (!route || request.method !== 'GET') {
    response.writeHead(404).end('Não encontrado');
    return;
  }
  try {
    const body = await readFile(resolve(rootDir, route[0]));
    response.writeHead(200, {
      'Content-Type': route[1],
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).end(body);
  } catch {
    response.writeHead(404).end('Arquivo indisponível');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Quadro Per Parte: http://127.0.0.1:${port}`);
});
