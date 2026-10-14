import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const HOST = '127.0.0.1';
const PORTA = 4182;
const rotas = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/boas-vindas.html', ['boas-vindas.html', 'text/html; charset=utf-8']],
  ['/orcamento-disponivel.html', ['orcamento-disponivel.html', 'text/html; charset=utf-8']],
  ['/atualizacao-pedido.html', ['atualizacao-pedido.html', 'text/html; charset=utf-8']],
  ['/boas-vindas.txt', ['boas-vindas.txt', 'text/plain; charset=utf-8']],
  ['/orcamento-disponivel.txt', ['orcamento-disponivel.txt', 'text/plain; charset=utf-8']],
  ['/atualizacao-pedido.txt', ['atualizacao-pedido.txt', 'text/plain; charset=utf-8']],
  ['/manifesto.json', ['manifesto.json', 'application/json; charset=utf-8']],
  ['/README.md', ['README.md', 'text/plain; charset=utf-8']],
]);

function responder(requisicao, resposta, status, conteudo, tipo = 'text/plain; charset=utf-8', extras = {}) {
  const corpo = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo, 'utf8');
  resposta.writeHead(status, {
    'Content-Type': tipo,
    'Content-Length': corpo.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extras,
  });
  resposta.end(requisicao.method === 'HEAD' ? undefined : corpo);
}

const servidor = createServer(async (requisicao, resposta) => {
  if (!['GET', 'HEAD'].includes(requisicao.method)) {
    responder(requisicao, resposta, 405, 'Método não permitido.', undefined, { Allow: 'GET, HEAD' });
    return;
  }
  let caminho;
  try { caminho = new URL(requisicao.url || '/', `http://${HOST}:${PORTA}`).pathname; }
  catch { responder(requisicao, resposta, 400, 'Endereço inválido.'); return; }
  const rota = rotas.get(caminho);
  if (!rota) { responder(requisicao, resposta, 404, 'Prévia não encontrada.'); return; }
  try {
    // Apenas nomes fixos da allowlist chegam ao disco; a URL não vira um caminho.
    const corpo = await readFile(new URL(rota[0], import.meta.url));
    responder(requisicao, resposta, 200, corpo, rota[1]);
  } catch {
    responder(requisicao, resposta, 404, 'Prévia indisponível. Gere os arquivos antes de abrir a galeria.');
  }
});

servidor.on('error', erro => {
  console.error(erro.code === 'EADDRINUSE' ? `A porta ${PORTA} já está em uso.` : 'Não foi possível iniciar o servidor local de prévias.');
  process.exitCode = 1;
});
servidor.listen(PORTA, HOST, () => {
  console.log(`Prévias de e-mail: http://${HOST}:${PORTA}`);
  console.log('Simulações locais, sem envio ou gatilhos ativos. Encerre com Ctrl+C.');
});
