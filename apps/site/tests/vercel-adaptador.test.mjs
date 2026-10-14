import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { criarAdaptadorVercel } from '../vercel-adaptador.mjs';

const origem = 'https://site.exemplo.test';
const ambiente = { SHOPIFY_STORE_DOMAIN: 'loja-exemplo.myshopify.com', SHOPIFY_STOREFRONT_PUBLIC_TOKEN: 'token-somente-teste', SITE_ORIGINS: origem };
const variante = 'gid://shopify/ProductVariant/123';
const carrinho = { id: 'gid://shopify/Cart/ensaio?key=apenas-teste', checkoutUrl: 'https://loja-exemplo.myshopify.com/checkouts/teste', totalQuantity: 1 };
const dadosCatalogo = { nodes: [{ handle: 'ensaio' }], filters: [], pageInfo: { hasNextPage: false, endCursor: null } };
function cliente(dadosAmbiente = ambiente) {
  const chamadas = [];
  const atender = criarAdaptadorVercel({ ambiente: dadosAmbiente, fetchImpl: async (url, opcoes) => {
    const consulta = JSON.parse(opcoes.body); chamadas.push({ url, opcoes, consulta });
    const data = consulta.query.includes('mutation')
      ? { cartCreate: { cart: carrinho, userErrors: [], warnings: [] }, cartLinesUpdate: { cart: { ...carrinho, totalQuantity: 2 }, userErrors: [], warnings: [] } }
      : { collection: { products: dadosCatalogo }, product: { handle: 'ensaio' }, cart: carrinho };
    return Response.json({ data });
  } });
  return { chamadas, atender, consultar: (rota, init) => atender(new Request(`${origem}${rota}`, init)) };
}
const enviar = (corpo, method = 'POST', headers = {}) => ({ method, headers: { 'Content-Type': 'application/json', Origin: origem, ...headers }, body: JSON.stringify(corpo) });

test('rewrite mantém filtros e cursores; config não revela token', async () => {
  const loja = cliente();
  const resposta = await loja.consultar('/api/index?__rota=produtos&cor=Lago&ordem=preco-maior&depois=cursor%2Bteste');
  assert.equal(resposta.status, 200);
  assert.deepEqual((await resposta.json()).produtos, dadosCatalogo);
  assert.deepEqual(loja.chamadas[0].consulta.variables.filters, [{ variantOption: { name: 'Cor', value: 'Lago' } }]);
  assert.equal(loja.chamadas[0].consulta.variables.after, 'cursor+teste');
  assert.equal(loja.chamadas[0].consulta.variables.reverse, true);
  const config = await loja.consultar('/api/index?__rota=loja/config');
  assert.equal(config.headers.get('cache-control'), 'no-store');
  assert.equal((await config.text()).includes(ambiente.SHOPIFY_STOREFRONT_PUBLIC_TOKEN), false);
  assert.equal((await loja.consultar('/api/produtos/ensaio')).status, 200);
  assert.equal((await loja.consultar('/api/index?__rota=produtos/ensaio&variantesDepois=pagina2')).status, 200);
  assert.equal(loja.chamadas.at(-1).consulta.variables.variantesDepois, 'pagina2');
});

test('captura nomeada do rewrite é removida sem perder filtros, cursor ou rota de produto', async () => {
  const loja = cliente();
  const resposta = await loja.consultar('/api/index?__rota=produtos&rota=produtos&limite=24&cor=Lago&depois=cursor%2Bteste');
  assert.equal(resposta.status, 200);
  assert.deepEqual((await resposta.json()).produtos, dadosCatalogo);
  assert.equal(loja.chamadas[0].consulta.variables.first, 24);
  assert.equal(loja.chamadas[0].consulta.variables.after, 'cursor+teste');
  assert.deepEqual(loja.chamadas[0].consulta.variables.filters, [{ variantOption: { name: 'Cor', value: 'Lago' } }]);
  assert.equal((await loja.consultar('/api/index?__rota=produtos%2Fensaio&rota=produtos%2Fensaio&variantesDepois=pagina2')).status, 200);
  assert.equal(loja.chamadas.at(-1).consulta.variables.variantesDepois, 'pagina2');
  assert.equal((await loja.consultar('/api/produtos?rota=produtos&limite=24')).status, 200);
});

test('captura interna conflitante ou repetida é recusada e filtros desconhecidos continuam inválidos', async () => {
  const loja = cliente();
  for (const rota of [
    '/api/index?__rota=produtos&rota=carrinho',
    '/api/index?__rota=produtos&rota=produtos&rota=produtos',
    '/api/index?__rota=produtos&rota=',
    '/api/produtos?rota=carrinho',
  ]) {
    assert.equal((await loja.consultar(rota)).status, 404, rota);
  }
  for (const rota of [
    '/api/index?__rota=produtos&rota=produtos&desconhecido=1',
    '/api/index?__rota=produtos&rota=produtos&limite=24&limite=24',
  ]) {
    const resposta = await loja.consultar(rota);
    assert.equal(resposta.status, 400, rota);
    assert.equal((await resposta.json()).erro.codigo, 'PARAMETRO_INVALIDO');
  }
  assert.equal(loja.chamadas.length, 0);
});

test('corpo JSON da Web Request chega intacto ao criar e alterar carrinho', async () => {
  const loja = cliente();
  const criado = await loja.consultar('/api/index?__rota=carrinho', enviar({ linhas: [{ merchandiseId: variante, quantity: 1 }] }));
  assert.equal(criado.status, 201);
  assert.equal((await criado.json()).carrinho.checkoutUrl, carrinho.checkoutUrl);
  assert.deepEqual(loja.chamadas[0].consulta.variables.input.lines, [{ merchandiseId: variante, quantity: 1 }]);
  const alterado = await loja.consultar('/api/index?__rota=carrinho/itens', enviar({ carrinhoId: carrinho.id, linhas: [{ id: 'gid://shopify/CartLine/linha1', quantity: 2 }] }, 'PATCH'));
  assert.equal(alterado.status, 200);
  assert.equal((await alterado.json()).carrinho.totalQuantity, 2);
  const recuperado = await loja.consultar(`/api/index?__rota=carrinho&id=${encodeURIComponent(carrinho.id)}`);
  assert.equal(recuperado.status, 200);
  assert.equal(loja.chamadas.at(-1).consulta.variables.id, carrinho.id);
});

test('adaptação mantém recusa de origem, limite de corpo e JSON inválido', async () => {
  const loja = cliente();
  const linhas = { linhas: [{ merchandiseId: variante, quantity: 1 }] };
  assert.equal((await loja.consultar('/api/index?__rota=carrinho', enviar(linhas, 'POST', { Origin: 'https://terceiro.test' }))).status, 403);
  assert.equal((await loja.consultar('/api/index?__rota=carrinho', { ...enviar(linhas), body: '{' })).status, 400);
  assert.equal((await loja.consultar('/api/index?__rota=carrinho', { ...enviar(linhas), body: ' '.repeat(16385) })).status, 413);
  assert.equal((await loja.consultar('/api/index?__rota=carrinho', enviar(linhas, 'POST', { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal(loja.chamadas.length, 0);
});

test('rota interna não aceita caminhos arbitrários ou parâmetros repetidos', async () => {
  const loja = cliente();
  for (const rota of ['/api/index?__rota=produtos&__rota=carrinho', '/api/index?__rota=../.env.local', '/api/index?__rota=https://terceiro.test', '/api/index', '/arquivo']) {
    assert.equal((await loja.consultar(rota)).status, 404, rota);
  }
  assert.equal(loja.chamadas.length, 0);
});

test('IP de proxy só é considerado no ambiente Vercel e precisa ser um IP válido', async () => {
  const privado = { ...ambiente, SHOPIFY_STOREFRONT_PUBLIC_TOKEN: '', SHOPIFY_STOREFRONT_PRIVATE_TOKEN: 'privado-apenas-teste' };
  for (const [vercel, ip, esperado] of [['', '203.0.113.11', undefined], ['1', '203.0.113.11', '203.0.113.11'], ['1', '203.0.113.11, 198.51.100.1', undefined]]) {
    const loja = cliente({ ...privado, VERCEL: vercel });
    await loja.consultar('/api/index?__rota=produtos', { headers: { 'x-vercel-forwarded-for': ip, 'x-forwarded-for': '198.51.100.9' } });
    assert.equal(loja.chamadas[0].opcoes.headers['Shopify-Storefront-Buyer-IP'], esperado);
  }
});

test('função exporta a assinatura Web e configuração cobre as páginas sem expor fontes', async () => {
  const entrada = (await import('../../../api/index.mjs')).default;
  assert.equal(typeof entrada.fetch, 'function');
  const config = JSON.parse(await readFile(new URL('../../../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.outputDirectory, 'apps/site/dist');
  for (const rota of ['/loja', '/conta', '/carrinho', '/produtos/:handle']) assert(config.rewrites.some(item => item.source === rota && item.destination === '/comercio.html'));
  assert.equal(config.rewrites.find(item => item.source === '/api/:rota*').destination, '/api/index?__rota=:rota*');
  assert.equal(config.functions['api/index.mjs'].maxDuration >= 12, true);
});
