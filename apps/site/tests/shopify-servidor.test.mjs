import test from 'node:test';
import assert from 'node:assert/strict';
import { criarServidor } from '../servidor.mjs';
import { lerConfiguracao, parametrosCatalogo } from '../shopify-servidor.mjs';

const ambiente = { SHOPIFY_STORE_DOMAIN: 'cpegt6-2x.myshopify.com', SHOPIFY_STOREFRONT_PUBLIC_TOKEN: 'token-publico-de-teste', SHOPIFY_CUSTOMER_ACCOUNT_URL: 'https://shopify.com/102503383338/account' };
const variante = 'gid://shopify/ProductVariant/123';
const cartId = 'gid://shopify/Cart/abc_123?key=chave-privada';
const lineId = 'gid://shopify/CartLine/uuid-123?cart=abc_123';
const pagina = { nodes: [{ id: 'gid://shopify/Product/1', handle: 'marco', title: 'Marco' }], filters: [], pageInfo: { hasNextPage: true, endCursor: 'cursor-real' } };
const cart = { id: cartId, checkoutUrl: 'https://cpegt6-2x.myshopify.com/checkouts/cn/abc', totalQuantity: 2, lines: { nodes: [{ id: lineId, quantity: 2 }] } };
async function iniciar(t, dados = {}, cliente) {
  const chamadas = [];
  const servidor = criarServidor({ ambiente: dados, fetchImpl: async (url, opcoes) => {
    const consulta = JSON.parse(opcoes.body); chamadas.push({ url, opcoes, consulta });
    return cliente ? cliente(consulta, opcoes) : Response.json({ data: { collection: { products: pagina } } });
  }, timeoutMs: 100 });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { servidor.closeAllConnections(); servidor.close(resolve); }));
  const origem = `http://127.0.0.1:${servidor.address().port}`;
  const consultar = (rota, opcoes) => fetch(`${origem}${rota}`, opcoes);
  const alterar = (rota, corpo, method = 'POST', extras = {}) => consultar(rota, { method, headers: { 'Content-Type': 'application/json', Origin: origem, ...extras }, body: JSON.stringify(corpo) });
  return { consultar, alterar, chamadas, origem };
}

test('configuração pública distingue demonstração, não expõe tokens e usa URL real de conta', async t => {
  const demo = await iniciar(t);
  const configDemo = await (await demo.consultar('/api/loja/config')).json();
  assert.equal(configDemo.modo, 'demonstracao');
  assert.equal(configDemo.conta.disponivel, false);
  assert.equal((await (await demo.consultar('/api/produtos')).json()).produtos.nodes.length, 0);
  assert.equal((await demo.alterar('/api/carrinho', { linhas: [{ merchandiseId: variante, quantity: 1 }] })).status, 503);
  assert.equal(demo.chamadas.length, 0);
  const loja = await iniciar(t, ambiente);
  const resposta = await loja.consultar('/api/loja/config');
  const config = await resposta.json();
  assert.equal(config.modo, 'shopify');
  assert.equal(config.conta.url, ambiente.SHOPIFY_CUSTOMER_ACCOUNT_URL);
  assert(!JSON.stringify(config).includes(ambiente.SHOPIFY_STOREFRONT_PUBLIC_TOKEN));
  assert.equal(resposta.headers.get('cache-control'), 'no-store');
});

test('coleção envia filtros, paginação, contexto e ordenação ao Shopify sem filtrar só a página local', async t => {
  const loja = await iniciar(t, ambiente);
  const filtros = [{ variantOption: { name: 'Cor', value: 'Brasa' } }, { price: { min: 100, max: 400 } }];
  const resposta = await loja.consultar(`/api/produtos?limite=24&depois=abc&ordem=preco-maior&filtros=${encodeURIComponent(JSON.stringify(filtros))}`);
  assert.equal(resposta.status, 200);
  assert.deepEqual((await resposta.json()).produtos, pagina);
  const chamada = loja.chamadas[0];
  assert.equal(chamada.url, 'https://cpegt6-2x.myshopify.com/api/2026-10/graphql.json');
  assert.equal(chamada.opcoes.headers['X-Shopify-Storefront-Access-Token'], ambiente.SHOPIFY_STOREFRONT_PUBLIC_TOKEN);
  assert.deepEqual(chamada.consulta.variables, { handle: 'todas', first: 24, after: 'abc', filters: filtros, sortKey: 'PRICE', reverse: true });
  assert.match(chamada.consulta.query, /@inContext\(country: BR, language: PT_BR\)/);
});

test('coleção ausente, falha de rede e GraphQL recusado nunca viram produtos de demonstração', async t => {
  for (const [cliente, codigo] of [
    [() => Response.json({ data: { collection: null } }), 'COLECAO_INDISPONIVEL'],
    [() => { throw new Error('SEGREDO INTERNO'); }, 'SHOPIFY_INDISPONIVEL'],
    [() => Response.json({ errors: [{ message: 'SEGREDO INTERNO' }] }), 'SHOPIFY_CONSULTA_RECUSADA'],
  ]) {
    const loja = await iniciar(t, ambiente, cliente);
    const resposta = await loja.consultar('/api/produtos');
    assert(resposta.status >= 500);
    const resultado = await resposta.json();
    assert.equal(resultado.erro.codigo, codigo);
    assert(!JSON.stringify(resultado).includes('SEGREDO'));
    assert.notEqual(resultado.modo, 'demonstracao');
  }
});

test('busca é global com facetas e rejeita ordenação que a API não suporta', async t => {
  const loja = await iniciar(t, ambiente, () => Response.json({ data: { search: pagina } }));
  const resposta = await loja.consultar('/api/produtos?q=Marco&cor=Brasa&brilho=Intenso');
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).escopo, 'busca');
  assert.deepEqual(loja.chamadas[0].consulta.variables.filters, [{ variantOption: { name: 'Cor', value: 'Brasa' } }, { productMetafield: { namespace: 'perparte', key: 'brilho', value: 'Intenso' } }]);
  assert.equal((await loja.consultar('/api/produtos?q=Marco&ordem=novidades')).status, 400);
});

test('sem coleção usa products e constrói filtros a partir de valores escapados', async t => {
  const loja = await iniciar(t, { ...ambiente, SHOPIFY_COLLECTION_HANDLE: '' }, () => Response.json({ data: { products: pagina } }));
  const resposta = await loja.consultar('/api/produtos?tipo=Mesa&precoMin=10&ordem=novidades');
  assert.equal(resposta.status, 200);
  assert.equal(loja.chamadas[0].consulta.variables.query, 'product_type:"Mesa" AND variants.price:>=10');
  assert.equal(loja.chamadas[0].consulta.variables.sortKey, 'CREATED_AT');
  assert.equal(loja.chamadas[0].consulta.variables.reverse, true);
});

test('produto desconhecido retorna 404 e variantes podem ser paginadas', async t => {
  const loja = await iniciar(t, ambiente, () => Response.json({ data: { product: null } }));
  const resposta = await loja.consultar('/api/produtos/obra-ausente?variantesDepois=proxima');
  assert.equal(resposta.status, 404);
  assert.deepEqual(loja.chamadas[0].consulta.variables, { handle: 'obra-ausente', variantesDepois: 'proxima' });
  assert.equal((await resposta.json()).produto, null);
});

test('criação, leitura, adição, atualização e remoção preservam IDs e checkout reais', async t => {
  const loja = await iniciar(t, ambiente, consulta => {
    const chave = consulta.query.includes('mutation Criar') ? 'cartCreate' : consulta.query.includes('mutation Adicionar') ? 'cartLinesAdd' : consulta.query.includes('mutation Atualizar') ? 'cartLinesUpdate' : consulta.query.includes('mutation Remover') ? 'cartLinesRemove' : 'cart';
    return Response.json({ data: { [chave]: chave === 'cart' ? cart : { cart, userErrors: [], warnings: [] } } });
  });
  const criacao = await loja.alterar('/api/carrinho', { linhas: [{ merchandiseId: variante, quantity: 2 }] });
  assert.equal(criacao.status, 201);
  assert.equal((await criacao.json()).carrinho.checkoutUrl, cart.checkoutUrl);
  assert.deepEqual(loja.chamadas[0].consulta.variables.input.buyerIdentity, { countryCode: 'BR' });
  const leitura = await loja.consultar(`/api/carrinho?id=${encodeURIComponent(cartId)}`);
  assert.equal((await leitura.json()).carrinho.id, cartId);
  assert.equal((await loja.alterar('/api/carrinho/itens', { carrinhoId: cartId, linhas: [{ merchandiseId: variante, quantity: 1 }] })).status, 200);
  assert.equal((await loja.alterar('/api/carrinho/itens', { carrinhoId: cartId, linhas: [{ id: lineId, quantity: 0 }] }, 'PATCH')).status, 200);
  assert.equal((await loja.alterar('/api/carrinho/itens', { carrinhoId: cartId, linhasIds: [lineId] }, 'DELETE')).status, 200);
  assert.deepEqual(loja.chamadas.at(-1).consulta.variables, { cartId, lineIds: [lineId] });
});

test('erros comerciais e avisos de estoque preservam carrinho sem afirmar sucesso falso', async t => {
  const loja = await iniciar(t, ambiente, () => Response.json({ data: { cartCreate: { cart, userErrors: [{ field: ['lines', '0'], code: 'INVALID', message: 'Mensagem upstream' }] } } }));
  const resposta = await loja.alterar('/api/carrinho', { linhas: [{ merchandiseId: variante, quantity: 2 }] });
  assert.equal(resposta.status, 422);
  const resultado = await resposta.json();
  assert.equal(resultado.erro.codigo, 'CARRINHO_RECUSADO');
  assert.deepEqual(resultado.carrinho, cart);
  assert.equal(resultado.erros[0].codigo, 'INVALID');
});

test('origem externa, payload excessivo, quantidades inválidas e GraphQL arbitrário são barrados', async t => {
  const loja = await iniciar(t, ambiente);
  const corpo = { linhas: [{ merchandiseId: variante, quantity: 1 }] };
  assert.equal((await loja.alterar('/api/carrinho', corpo, 'POST', { Origin: 'https://externo.example' })).status, 403);
  assert.equal((await loja.alterar('/api/carrinho', { linhas: [{ merchandiseId: variante, quantity: 100 }] })).status, 400);
  assert.equal((await loja.alterar('/api/carrinho', { linhas: [{ merchandiseId: variante, quantity: 1.5 }] })).status, 400);
  assert.equal((await loja.alterar('/api/carrinho', { ...corpo, query: 'mutation { qualquerCoisa }' })).status, 400);
  assert.equal((await loja.alterar('/api/carrinho', { texto: 'a'.repeat(18000) })).status, 413);
  assert.equal((await loja.consultar('/api/graphql')).status, 404);
  assert.equal(loja.chamadas.length, 0);
});

test('token privado fica no servidor e IP encaminhado não vem de header não confiável', async t => {
  const loja = await iniciar(t, { ...ambiente, SHOPIFY_STOREFRONT_PUBLIC_TOKEN: '', SHOPIFY_STOREFRONT_PRIVATE_TOKEN: 'shpat_PRIVADO_TESTE' });
  await loja.consultar('/api/produtos', { headers: { 'X-Forwarded-For': '203.0.113.99' } });
  assert.equal(loja.chamadas[0].opcoes.headers['Shopify-Storefront-Private-Token'], 'shpat_PRIVADO_TESTE');
  assert.equal(loja.chamadas[0].opcoes.headers['Shopify-Storefront-Buyer-IP'], '127.0.0.1');
  assert(!JSON.stringify(await (await loja.consultar('/api/loja/config')).json()).includes('PRIVADO'));
});

test('timeout e throttling da Shopify têm falhas controladas sem repetição automática de mutações', async t => {
  const lenta = await iniciar(t, ambiente, (_consulta, opcoes) => new Promise((_resolve, reject) => {
    opcoes.signal.addEventListener('abort', () => reject(opcoes.signal.reason), { once: true });
  }));
  const respostaLenta = await lenta.consultar('/api/produtos');
  assert.equal(respostaLenta.status, 502);
  assert.equal((await respostaLenta.json()).erro.codigo, 'SHOPIFY_INDISPONIVEL');
  assert.equal(lenta.chamadas.length, 1);
  const limitada = await iniciar(t, ambiente, () => new Response('', { status: 429 }));
  const respostaLimitada = await limitada.alterar('/api/carrinho', { linhas: [{ merchandiseId: variante, quantity: 1 }] });
  assert.equal(respostaLimitada.status, 429);
  assert.equal(limitada.chamadas.length, 1);
});

test('configuração inválida rejeita destinos externos e conta HTTP', () => {
  assert.throws(() => lerConfiguracao({ ...ambiente, SHOPIFY_STORE_DOMAIN: 'localhost:3000' }));
  assert.throws(() => lerConfiguracao({ ...ambiente, SHOPIFY_STORE_DOMAIN: 'evil.myshopify.com.example.org' }));
  assert.throws(() => lerConfiguracao({ ...ambiente, SHOPIFY_CUSTOMER_ACCOUNT_URL: 'javascript:alert(1)' }));
  assert.throws(() => lerConfiguracao({ ...ambiente, SHOPIFY_STOREFRONT_PRIVATE_TOKEN: 'segundo-token' }));
  assert.throws(() => parametrosCatalogo(new URLSearchParams('limite=250')));
  assert.throws(() => parametrosCatalogo(new URLSearchParams('limite=2&limite=3')));
  assert.throws(() => parametrosCatalogo(new URLSearchParams('precoMin=500&precoMax=100')));
});

test('servidor entrega apenas assets permitidos, mantém home e protege configuração', async t => {
  const loja = await iniciar(t);
  assert.equal((await loja.consultar('/')).status, 200);
  for (const caminho of ['/.env.local', '/shopify-servidor.mjs', '/servidor.mjs', '/package.json', '/images/%2e%2e/%2e%2e/.env.local']) assert.notEqual((await loja.consultar(caminho)).status, 200);
  assert.equal((await loja.consultar('/', { method: 'POST' })).status, 405);
});
