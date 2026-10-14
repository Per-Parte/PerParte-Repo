import { criarApiLoja } from './shopify-servidor.mjs';

const headersErro = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const rotaPermitida = /^(?:loja\/config|produtos(?:\/[a-z0-9][a-z0-9-]{0,254})?|carrinho(?:\/itens)?)$/;

// Ponte Web Request/Response -> API Node existente, mantendo a leitura limitada em fluxo.
// Não carrega .env.local nem arquivos do disco no ambiente de publicação.
export function criarAdaptadorVercel({ ambiente = process.env, fetchImpl = globalThis.fetch, timeoutMs } = {}) {
  const api = criarApiLoja({ ambiente, fetchImpl, timeoutMs });
  return async function atender(request) {
    try {
      const url = new URL(request.url);
      const rotas = url.searchParams.getAll('__rota');
      const rota = rotas.length ? rotas[0] : url.pathname.replace(/^\/api\//, '');
      // A Vercel também repassa a captura nomeada :rota* na query do rewrite.
      // Só retiramos esse metadado quando ele confirma uma única rota validada.
      const capturas = url.searchParams.getAll('rota');
      if (rotas.length > 1 || !rotaPermitida.test(rota) || capturas.length > 1 || (capturas.length === 1 && capturas[0] !== rota)) {
        return new Response(JSON.stringify({ erro: { codigo: 'ROTA_INEXISTENTE', mensagem: 'Esta operação não existe.' } }), { status: 404, headers: headersErro });
      }
      url.pathname = `/api/${rota}`;
      url.searchParams.delete('__rota');
      url.searchParams.delete('rota');
      const pedido = {
        method: request.method,
        headers: Object.fromEntries(request.headers),
        // Este cabeçalho é estabelecido pelo proxy Vercel. Fora dele, não é confiável.
        socket: { remoteAddress: ambiente.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') || undefined : undefined },
        async *[Symbol.asyncIterator]() {
          if (request.body) for await (const parte of request.body) yield Buffer.from(parte);
        },
      };
      let status = 500; let headers = headersErro; let corpo = '';
      const resposta = {
        writeHead(codigo, cabecalhos) { status = codigo; headers = cabecalhos; },
        end(dados = '') { corpo = dados; },
      };
      await api(pedido, resposta, url);
      return new Response(request.method === 'HEAD' ? null : corpo, { status, headers });
    } catch {
      return new Response(JSON.stringify({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Não foi possível concluir a operação.' } }), { status: 500, headers: headersErro });
    }
  };
}
