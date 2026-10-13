import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = fileURLToPath(new URL(process.argv.includes('--dist') ? './dist/' : './', import.meta.url));
const porta = Number(process.env.PORT || 4174);
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
createServer(async (pedido, resposta) => {
  try {
    const caminho = decodeURIComponent(new URL(pedido.url, 'http://localhost').pathname);
    const relativo = caminho === '/' ? 'index.html' : caminho.replace(/^\/+/, '');
    const permitido = ['index.html', 'styles.css', 'app.js', 'fonts.css', 'favicon.svg', 'tokens.css'].includes(relativo) || relativo.startsWith('images/') || relativo.startsWith('fonts/');
    if (!permitido) { resposta.writeHead(404); resposta.end('Página não encontrada.'); return; }
    const base = relativo.startsWith('images/') || relativo.startsWith('fonts/') ? (process.argv.includes('--dist') ? raiz : path.join(raiz, 'public')) : raiz;
    const arquivo = relativo === 'tokens.css' && !process.argv.includes('--dist') ? fileURLToPath(new URL('../../packages/design-system/tokens.css', import.meta.url)) : path.resolve(base, relativo);
    if (relativo !== 'tokens.css' && !arquivo.startsWith(path.resolve(base) + path.sep)) { resposta.writeHead(403); resposta.end(); return; }
    const info = await stat(arquivo);
    if (!info.isFile()) throw new Error('Não é arquivo.');
    resposta.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (pedido.method === 'HEAD') resposta.end(); else resposta.end(await readFile(arquivo));
  } catch { resposta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); resposta.end('Esta parte ainda não existe.'); }
}).listen(porta, '127.0.0.1', () => console.log(`Per Parte — http://127.0.0.1:${porta}`));
