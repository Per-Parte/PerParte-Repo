// Smoke opt-in contra a loja configurada, sem criar produto, carrinho ou pedido.
// Executar: node apps/site/tests/shopify-real.mjs
// As mutações são validadas pelo GraphQL com o campo raiz @skip(if: true).
import { carregarAmbiente } from '../servidor.mjs';
import { lerConfiguracao, OPERACOES } from '../shopify-servidor.mjs';

carregarAmbiente();
const config = lerConfiguracao();
if (!config.configurado) {
  console.error('Configure o token Storefront em apps/site/.env.local antes do smoke real.');
  process.exitCode = 1;
} else {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (config.tokenPublico) headers['X-Shopify-Storefront-Access-Token'] = config.tokenPublico;
  else headers['Shopify-Storefront-Private-Token'] = config.tokenPrivado;
  const padrao = { first: 24, after: null, reverse: false };
  const idTeste = 'gid://shopify/Cart/perparte-validacao-sem-escrita';
  const casos = [
    ...(config.colecao ? [{ nome: 'colecao', variables: { ...padrao, handle: config.colecao, filters: [], sortKey: 'COLLECTION_DEFAULT' } }] : []),
    { nome: 'produtos', variables: { ...padrao, query: null, sortKey: 'ID' } },
    { nome: 'busca', variables: { ...padrao, query: 'perparte-validacao-sem-produto', filters: [], sortKey: 'RELEVANCE' } },
    { nome: 'produto', variables: { handle: 'perparte-validacao-sem-produto', variantesDepois: null } },
    { nome: 'carrinho', variables: { id: idTeste } },
    { nome: 'criar', variables: { input: { buyerIdentity: { countryCode: 'BR' } } }, ignorar: true },
    { nome: 'adicionar', variables: { cartId: idTeste, lines: [{ merchandiseId: 'gid://shopify/ProductVariant/0', quantity: 1 }] }, ignorar: true },
    { nome: 'atualizar', variables: { cartId: idTeste, lines: [{ id: 'gid://shopify/CartLine/validacao', quantity: 1 }] }, ignorar: true },
    { nome: 'remover', variables: { cartId: idTeste, lineIds: ['gid://shopify/CartLine/validacao'] }, ignorar: true },
  ];
  const resultados = [];
  for (const caso of casos) {
    let query = OPERACOES[caso.nome];
    if (caso.ignorar) {
      const alterada = query.replace(/\b(cartCreate|cartLinesAdd|cartLinesUpdate|cartLinesRemove)(\([^{}]*\))\s*\{/, '$1$2 @skip(if: true) {');
      if (alterada === query || !alterada.includes('@skip(if: true)')) throw new Error('A validação sem escrita não pôde ser garantida.');
      query = alterada;
    }
    try {
      const resposta = await fetch(`https://${config.dominio}/api/${config.versao}/graphql.json`, { method: 'POST', headers, body: JSON.stringify({ query, variables: caso.variables }), signal: AbortSignal.timeout(20000), redirect: 'error' });
      const json = await resposta.json();
      const erros = (json.errors || []).map(erro => String(erro.message).replaceAll(config.tokenPublico || '\0', '[oculto]').replaceAll(config.tokenPrivado || '\0', '[oculto]'));
      const versaoRetornada = resposta.headers.get('x-shopify-api-version');
      const ok = resposta.ok && !erros.length && Boolean(json.data) && (!versaoRetornada || versaoRetornada === config.versao);
      resultados.push({ operacao: caso.nome, semEscrita: true, schemaAceito: ok, status: resposta.status, versaoRetornada, ...(erros.length ? { erros } : {}), ...(caso.nome === 'colecao' ? { colecaoDisponivel: Boolean(json.data?.collection), produtosRetornados: json.data?.collection?.products?.nodes?.length ?? null } : {}), ...(caso.nome === 'produtos' ? { produtosRetornados: json.data?.products?.nodes?.length ?? null } : {}) });
      if (!ok || (caso.nome === 'colecao' && !json.data?.collection)) process.exitCode = 1;
    } catch (erro) {
      resultados.push({ operacao: caso.nome, semEscrita: true, schemaAceito: false, erro: erro.name === 'TimeoutError' ? 'Tempo de consulta excedido.' : 'Não foi possível consultar o endpoint Shopify.' });
      process.exitCode = 1;
    }
  }
  console.log(JSON.stringify({ dominio: config.dominio, versaoSolicitada: config.versao, observacao: 'Validação sem escrita. Mutações usam @skip; não comprova compra nem disponibilidade de variantes. Catálogo vazio não comprova acesso aos campos de produtos preenchidos.', resultados }, null, 2));
}
