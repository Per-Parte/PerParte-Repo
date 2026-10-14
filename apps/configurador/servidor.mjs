import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const build = process.argv.includes('--dist');
const raiz = fileURLToPath(new URL(build ? './dist/' : './', import.meta.url));
const porta = Number(process.env.PORT || 4175);
const tipos = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8' };
createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const relativo = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    if (!/^(index\.html|styles\.css|fonts\.css|favicon\.svg|tokens\.css|src\/[a-z-]+\.mjs|fonts\/[a-zA-Z0-9.-]+)$/.test(relativo)) { res.writeHead(404); res.end('Página não encontrada.'); return; }
    let arquivo = path.resolve(raiz,relativo);
    if (!build && relativo === 'tokens.css') arquivo = fileURLToPath(new URL('../../packages/design-system/tokens.css',import.meta.url));
    if (!build && relativo.startsWith('fonts/')) arquivo = fileURLToPath(new URL('../site/public/'+relativo,import.meta.url));
    const conteudo = await readFile(arquivo);
    res.writeHead(200,{'Content-Type':tipos[path.extname(arquivo)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : conteudo);
  } catch { res.writeHead(404); res.end('Esta parte ainda não existe.'); }
}).listen(porta,'127.0.0.1',()=>console.log('Per Parte — ateliê em http://127.0.0.1:'+porta));
