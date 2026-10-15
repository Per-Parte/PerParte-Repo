import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { criarApiLoja } from './shopify-servidor.mjs';
import { criarApiCaptacao } from './captacao.mjs';
import { lerModoCaptacao, lerModoGerado } from './modo-captacao.mjs';

const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

// Os dois arquivos são ignorados pelo Git e nunca entram na lista de assets públicos.
export function carregarAmbiente() {
  if (typeof process.loadEnvFile !== 'function') return;
  for (const local of ['./.env.local', '../../.env.local']) {
    try { process.loadEnvFile(fileURLToPath(new URL(local, import.meta.url))); }
    catch (erro) { if (erro.code !== 'ENOENT') throw new Error('Não foi possível carregar a configuração local.'); }
  }
}

export function criarServidor({ dist = false, ambiente = process.env, fetchImpl = globalThis.fetch, timeoutMs, raizSite = fileURLToPath(new URL('./', import.meta.url)) } = {}) {
 const raiz = path.resolve(raizSite, dist ? 'dist' : '.');
 // A prévia respeita o modo da saída gerada, inclusive no bloqueio da API.
 const captacaoAtiva = dist ? lerModoGerado(readFileSync(path.join(raiz, 'modo-site.json'), 'utf8')) : lerModoCaptacao(ambiente);
 const api = criarApiLoja({ ambiente, fetchImpl, timeoutMs });
 const apiCaptacao = criarApiCaptacao({ ambiente, fetchImpl, timeoutMs });
 const servidor = createServer(async (pedido, resposta) => {
  try {
    const url = new URL(pedido.url, 'http://localhost');
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      if (captacaoAtiva ? await apiCaptacao(pedido, resposta, url) : url.pathname !== '/api/captacao' && await api(pedido, resposta, url)) return;
      resposta.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      resposta.end(JSON.stringify({ erro: { codigo: 'ROTA_INEXISTENTE', mensagem: 'Esta operação não existe.' } })); return;
    }
    if (!['GET', 'HEAD'].includes(pedido.method)) { resposta.writeHead(405, { Allow: 'GET, HEAD' }); resposta.end(); return; }
    const caminho = decodeURIComponent(url.pathname);
    const comercio = /^\/(?:loja|conta|carrinho)\/?$/.test(caminho) || /^\/produtos\/[a-z0-9][a-z0-9-]{0,254}\/?$/.test(caminho);
    const entrada = caminho === '/' ? 'index.html' : comercio ? 'comercio.html' : caminho.replace(/^\/+/, '');
    const arquivos = captacaoAtiva
      ? ['index.html', 'comercio.html', 'captacao.css', 'captacao.js', 'fonts.css', 'favicon.svg', 'tokens.css']
      : ['index.html', 'comercio.html', 'comercio.css', 'comercio.js', 'catalogo.js', 'vitrine.js', 'navegacao.js', 'navegacao.css', 'styles.css', 'app.js', 'paleta.css', 'paleta.js', 'fonts.css', 'favicon.svg', 'tokens.css'];
    const permitido = arquivos.includes(entrada) || entrada.startsWith('images/') || entrada.startsWith('fonts/');
    if (!permitido) { resposta.writeHead(404); resposta.end('Página não encontrada.'); return; }
    const relativo = captacaoAtiva && !dist && ['index.html', 'comercio.html'].includes(entrada) ? 'captacao.html' : entrada;
    const base = relativo.startsWith('images/') || relativo.startsWith('fonts/') ? (dist ? raiz : path.join(raiz, 'public')) : raiz;
    const arquivo = relativo === 'tokens.css' && !dist ? path.resolve(raizSite, '../../packages/design-system/tokens.css') : path.resolve(base, relativo);
    if (relativo !== 'tokens.css' && !arquivo.startsWith(path.resolve(base) + path.sep)) { resposta.writeHead(403); resposta.end(); return; }
    const info = await stat(arquivo);
    if (!info.isFile()) throw new Error('Não é arquivo.');
    resposta.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    if (pedido.method === 'HEAD') resposta.end(); else resposta.end(await readFile(arquivo));
  } catch { resposta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); resposta.end('Esta parte ainda não existe.'); }
 });
 servidor.requestTimeout = 20000;
 servidor.headersTimeout = 15000;
 return servidor;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 carregarAmbiente();
 const porta = Number(process.env.PORT || 4174);
 const host = process.env.HOST || '127.0.0.1';
 criarServidor({ dist: process.argv.includes('--dist') }).listen(porta, host, () => console.log(`Per Parte — http://${host}:${porta}`));
}
