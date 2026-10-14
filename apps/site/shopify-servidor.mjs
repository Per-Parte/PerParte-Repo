import { isIP } from 'node:net';

// Operações fechadas: nunca encaminhar GraphQL arbitrário nem credenciais Admin.
// Contrato Storefront 2026-10; preços, estoque e imagens vêm do catálogo publicado.
const IMAGEM = 'url altText width height';
const VARIANTE = `id title sku availableForSale selectedOptions { name value } price { amount currencyCode } compareAtPrice { amount currencyCode } image { ${IMAGEM} }`;
const OPCOES = `options { id name values optionValues { id name swatch { color image { previewImage { ${IMAGEM} } } } firstSelectableVariant { id availableForSale image { ${IMAGEM} } } } }`;
const METACAMPOS = `metafields(identifiers: [{namespace: "perparte", key: "especificacoes"}, {namespace: "perparte", key: "dimensoes"}, {namespace: "perparte", key: "materiais"}, {namespace: "perparte", key: "cuidados"}, {namespace: "perparte", key: "prazo_producao"}, {namespace: "perparte", key: "brilho"}, {namespace: "perparte", key: "difusao"}, {namespace: "perparte", key: "tamanho"}, {namespace: "perparte", key: "criador"}, {namespace: "perparte", key: "ambiente"}, {namespace: "perparte", key: "cores_criador"}, {namespace: "perparte", key: "historia_titulo"}, {namespace: "perparte", key: "historia"}, {namespace: "perparte", key: "ano_criacao"}, {namespace: "perparte", key: "imagem_escala"}, {namespace: "perparte", key: "legenda_escala"}]) { namespace key value type reference { ... on MediaImage { image { ${IMAGEM} } } } }`;
const PRODUTO = `id handle title description productType vendor tags availableForSale featuredImage { ${IMAGEM} } priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } ${OPCOES} ${METACAMPOS}`;
const PAGINA = 'pageInfo { hasNextPage endCursor }';
const FILTROS = 'filters { id label type values { id label count input } }';
const CARTAO = `${PRODUTO} images(first: 4) { nodes { ${IMAGEM} } } variants(first: 50) { nodes { ${VARIANTE} } ${PAGINA} }`;
const DETALHE = `${PRODUTO} seo { title description } images(first: 100) { nodes { ${IMAGEM} } ${PAGINA} } variants(first: 100, after: $variantesDepois) { nodes { ${VARIANTE} } ${PAGINA} }`;
const CARRINHO = `id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } totalTaxAmount { amount currencyCode } } lines(first: 100) { nodes { id quantity cost { totalAmount { amount currencyCode } } merchandise { ... on ProductVariant { ${VARIANTE} product { id handle title featuredImage { ${IMAGEM} } } } } } ${PAGINA} }`;
const ERROS_MUTACAO = 'userErrors { field message code } warnings { code message }';
export const OPERACOES = Object.freeze({
  colecao: `query ColecaoPerParte($handle: String!, $first: Int!, $after: String, $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!) @inContext(country: BR, language: PT_BR) { collection(handle: $handle) { id title products(first: $first, after: $after, filters: $filters, sortKey: $sortKey, reverse: $reverse) { nodes { ${CARTAO} } ${PAGINA} ${FILTROS} } } }`,
  produtos: `query CatalogoPerParte($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) @inContext(country: BR, language: PT_BR) { products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${CARTAO} } ${PAGINA} ${FILTROS} } }`,
  busca: `query BuscaPerParte($first: Int!, $after: String, $query: String!, $filters: [ProductFilter!], $sortKey: SearchSortKeys!, $reverse: Boolean!) @inContext(country: BR, language: PT_BR) { search(first: $first, after: $after, query: $query, types: [PRODUCT], productFilters: $filters, sortKey: $sortKey, reverse: $reverse) { nodes { ... on Product { ${CARTAO} } } ${PAGINA} filters: productFilters { id label type values { id label count input } } totalCount } }`,
  produto: `query ProdutoPerParte($handle: String!, $variantesDepois: String) @inContext(country: BR, language: PT_BR) { product(handle: $handle) { ${DETALHE} } }`,
  carrinho: `query CarrinhoPerParte($id: ID!) { cart(id: $id) { ${CARRINHO} } }`,
  criar: `mutation CriarCarrinhoPerParte($input: CartInput!) { cartCreate(input: $input) { cart { ${CARRINHO} } ${ERROS_MUTACAO} } }`,
  adicionar: `mutation AdicionarAoCarrinhoPerParte($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CARRINHO} } ${ERROS_MUTACAO} } }`,
  atualizar: `mutation AtualizarCarrinhoPerParte($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CARRINHO} } ${ERROS_MUTACAO} } }`,
  remover: `mutation RemoverDoCarrinhoPerParte($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CARRINHO} } ${ERROS_MUTACAO} } }`,
});

class ErroLoja extends Error {
  constructor(status, codigo, mensagem) { super(mensagem); this.status = status; this.codigo = codigo; }
}
const falhar = (status, codigo, mensagem) => { throw new ErroLoja(status, codigo, mensagem); };
const objeto = valor => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
function texto(valor, nome, max = 255) {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > max || /[\u0000-\u001f\u007f]/u.test(valor)) falhar(400, 'DADO_INVALIDO', `${nome} inválido.`);
  return valor.trim();
}
function inteiro(valor, nome, min = 1, max = 99) {
  if (!Number.isInteger(valor) || valor < min || valor > max) falhar(400, 'DADO_INVALIDO', `${nome} deve estar entre ${min} e ${max}.`);
  return valor;
}
function chaves(valor, permitidas) {
  if (!objeto(valor) || Object.keys(valor).some(chave => !permitidas.includes(chave))) falhar(400, 'DADO_INVALIDO', 'Campos não reconhecidos.');
}
function identificador(valor, tipo) {
  const id = texto(valor, 'Identificador', 2048);
  const prefixos = { variante: /^gid:\/\/shopify\/ProductVariant\/\d+$/, carrinho: /^gid:\/\/shopify\/Cart\/[A-Za-z0-9_=-]+(?:\?key=[A-Za-z0-9_=-]+)?$/, linha: /^gid:\/\/shopify\/(?:CartLine|ComponentizableCartLine)\/[A-Za-z0-9_=-]+(?:\?cart=[A-Za-z0-9_=-]+)?$/ };
  if (!prefixos[tipo].test(id)) falhar(400, 'DADO_INVALIDO', 'Identificador Shopify inválido.');
  return id;
}

export function lerConfiguracao(ambiente = process.env) {
  const dominio = (ambiente.SHOPIFY_STORE_DOMAIN || '').trim().toLowerCase();
  const tokenPublico = (ambiente.SHOPIFY_STOREFRONT_PUBLIC_TOKEN || '').trim();
  const tokenPrivado = (ambiente.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || '').trim();
  const versao = (ambiente.SHOPIFY_API_VERSION || '2026-10').trim();
  const colecao = (ambiente.SHOPIFY_COLLECTION_HANDLE ?? 'todas').trim();
  let contaUrl = null;
  if (ambiente.SHOPIFY_CUSTOMER_ACCOUNT_URL) {
    try {
      const url = new URL(ambiente.SHOPIFY_CUSTOMER_ACCOUNT_URL);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error();
      contaUrl = url.href;
    } catch { falhar(503, 'CONFIGURACAO_INVALIDA', 'O endereço da conta Shopify precisa de configuração.'); }
  }
  const configurado = Boolean(dominio && (tokenPublico || tokenPrivado));
  if ((dominio && !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(dominio)) || !/^20\d{2}-(01|04|07|10)$/.test(versao) || (colecao && !/^[a-z0-9][a-z0-9-]{0,254}$/.test(colecao)) || (tokenPublico && tokenPrivado) || /[\r\n]/.test(tokenPublico + tokenPrivado)) falhar(503, 'CONFIGURACAO_INVALIDA', 'A conexão Shopify precisa de configuração.');
  const origens = (ambiente.SITE_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean).map(item => {
    try { const url = new URL(item); if (!['https:', 'http:'].includes(url.protocol) || url.origin !== item) throw new Error(); return url.origin; }
    catch { falhar(503, 'CONFIGURACAO_INVALIDA', 'A origem do site precisa de configuração.'); }
  });
  return { dominio, tokenPublico, tokenPrivado, versao, colecao, contaUrl, configurado, origens };
}

function configuracaoPublica(config) {
  return { modo: config.configurado ? 'shopify' : 'demonstracao', loja: { dominio: config.dominio || null, moeda: 'BRL', pais: 'BR', idioma: 'PT_BR' }, conta: { disponivel: Boolean(config.contaUrl), url: config.contaUrl }, catalogo: { disponivel: config.configurado, colecao: config.colecao || null }, carrinho: { disponivel: config.configurado } };
}

export function validarFiltros(filtros) {
  if (!Array.isArray(filtros) || filtros.length > 20) falhar(400, 'FILTROS_INVALIDOS', 'Escolha até 20 filtros.');
  return filtros.map(filtro => {
    chaves(filtro, ['available', 'price', 'productType', 'productVendor', 'tag', 'variantOption', 'productMetafield']);
    if (Object.keys(filtro).length !== 1) falhar(400, 'FILTROS_INVALIDOS', 'Cada filtro deve ter um campo.');
    const [chave, valor] = Object.entries(filtro)[0];
    if (chave === 'available') { if (typeof valor !== 'boolean') falhar(400, 'FILTROS_INVALIDOS', 'Disponibilidade inválida.'); return { available: valor }; }
    if (chave === 'price') {
      chaves(valor, ['min', 'max']);
      if (!Object.keys(valor).length || Object.values(valor).some(numero => typeof numero !== 'number' || !Number.isFinite(numero) || numero < 0 || numero > 1000000) || (valor.min !== undefined && valor.max !== undefined && valor.min > valor.max)) falhar(400, 'FILTROS_INVALIDOS', 'Faixa de preço inválida.');
      return { price: { ...valor } };
    }
    if (chave === 'variantOption') { chaves(valor, ['name', 'value']); return { variantOption: { name: texto(valor.name, 'Opção'), value: texto(valor.value, 'Valor da opção') } }; }
    if (chave === 'productMetafield') {
      chaves(valor, ['namespace', 'key', 'value']);
      if (valor.namespace !== 'perparte' || !['ambiente', 'criador', 'material', 'familia_cor', 'composicao', 'brilho', 'difusao', 'tamanho'].includes(valor.key)) falhar(400, 'FILTROS_INVALIDOS', 'Metacampo de filtro não reconhecido.');
      return { productMetafield: { namespace: 'perparte', key: valor.key, value: texto(valor.value, 'Valor do filtro') } };
    }
    return { [chave]: texto(valor, 'Valor do filtro') };
  });
}

export function parametrosCatalogo(params) {
  const permitidos = ['limite', 'depois', 'ordem', 'q', 'filtros', 'tipo', 'cor', 'ambiente', 'criador', 'brilho', 'difusao', 'tamanho', 'precoMin', 'precoMax', 'disponivel'];
  if ([...params.keys()].some(chave => !permitidos.includes(chave)) || [...new Set(params.keys())].some(chave => params.getAll(chave).length > 1)) falhar(400, 'PARAMETRO_INVALIDO', 'Parâmetro de catálogo não reconhecido ou repetido.');
  const first = inteiro(Number(params.get('limite') || 12), 'Quantidade de produtos', 1, 24);
  const after = params.has('depois') ? texto(params.get('depois'), 'Cursor', 2048) : null;
  const busca = params.get('q')?.trim() || '';
  if (busca) texto(busca, 'Busca', 150);
  const ordem = params.get('ordem') || 'destaques';
  if (!['destaques', 'novidades', 'preco-menor', 'preco-maior', 'nome', 'mais-vendidos'].includes(ordem)) falhar(400, 'ORDEM_INVALIDA', 'Ordenação não reconhecida.');
  let filtros = [];
  if (params.has('filtros')) { try { filtros = JSON.parse(params.get('filtros')); } catch { falhar(400, 'FILTROS_INVALIDOS', 'Os filtros precisam de um JSON válido.'); } }
  filtros = validarFiltros(filtros);
  if (params.has('tipo')) filtros.push({ productType: params.get('tipo') });
  if (params.has('cor')) filtros.push({ variantOption: { name: 'Cor', value: params.get('cor') } });
  for (const nome of ['ambiente', 'criador', 'brilho', 'difusao', 'tamanho']) if (params.has(nome)) filtros.push({ productMetafield: { namespace: 'perparte', key: nome, value: params.get(nome) } });
  if (params.has('precoMin') || params.has('precoMax')) { const price = {}; if (params.has('precoMin')) price.min = Number(params.get('precoMin')); if (params.has('precoMax')) price.max = Number(params.get('precoMax')); filtros.push({ price }); }
  if (params.has('disponivel')) { if (!['true', 'false'].includes(params.get('disponivel'))) falhar(400, 'FILTROS_INVALIDOS', 'Disponibilidade inválida.'); filtros.push({ available: params.get('disponivel') === 'true' }); }
  return { first, after, busca, ordem, filters: validarFiltros(filtros) };
}

const ORDEM = { destaques: 'COLLECTION_DEFAULT', novidades: 'CREATED', 'preco-menor': 'PRICE', 'preco-maior': 'PRICE', nome: 'TITLE', 'mais-vendidos': 'BEST_SELLING' };
function escaparBusca(textoBusca) { return `"${textoBusca.replace(/[\\"]/g, '\\$&')}"`; }
function queryFiltros(filtros) {
  // Esta rota sem coleção só usa campos documentados de products(query:).
  const termos = filtros.map(filtro => {
    if ('available' in filtro) return `available_for_sale:${filtro.available}`;
    if ('price' in filtro) return Object.entries(filtro.price).map(([chave, valor]) => `variants.price:${chave === 'min' ? '>=' : '<='}${valor}`).join(' AND ');
    const nomes = { productType: 'product_type', productVendor: 'vendor', tag: 'tag' };
    const [chave, valor] = Object.entries(filtro)[0];
    return `${nomes[chave]}:${escaparBusca(valor)}`;
  });
  return termos.join(' AND ') || null;
}

function origemPermitida(pedido, config) {
  const origem = pedido.headers.origin;
  if (pedido.headers['sec-fetch-site'] === 'cross-site') falhar(403, 'ORIGEM_INVALIDA', 'A operação deve começar neste site.');
  if (!origem) return; // CLIs não enviam Origin. Navegadores enviam JSON com Origin.
  const host = pedido.headers.host;
  const origens = new Set(config.origens);
  // Comparação ao host apenas no desenvolvimento, para impedir confiança em Host arbitrário.
  if (/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host || '')) origens.add(`http://${host}`);
  if (!origens.has(origem)) falhar(403, 'ORIGEM_INVALIDA', 'A operação deve começar neste site.');
}
async function lerCorpo(pedido) {
  if (pedido.headers['content-type']?.split(';')[0].trim() !== 'application/json') falhar(415, 'FORMATO_INVALIDO', 'Envie application/json.');
  if (Number(pedido.headers['content-length']) > 16384) falhar(413, 'CORPO_GRANDE', 'O pedido é muito grande.');
  const partes = []; let tamanho = 0;
  for await (const parte of pedido) { tamanho += parte.length; if (tamanho > 16384) falhar(413, 'CORPO_GRANDE', 'O pedido é muito grande.'); partes.push(parte); }
  try { const corpo = JSON.parse(Buffer.concat(partes).toString('utf8')); if (!objeto(corpo)) throw new Error(); return corpo; }
  catch { falhar(400, 'JSON_INVALIDO', 'O pedido precisa de um objeto JSON válido.'); }
}
function validarLinhas(linhas, atualizacao = false) {
  if (!Array.isArray(linhas) || !linhas.length || linhas.length > 25) falhar(400, 'LINHAS_INVALIDAS', 'Envie entre 1 e 25 itens.');
  return linhas.map(linha => {
    chaves(linha, atualizacao ? ['id', 'quantity'] : ['merchandiseId', 'quantity']);
    const quantity = inteiro(linha.quantity, 'Quantidade', atualizacao ? 0 : 1, 99);
    return atualizacao ? { id: identificador(linha.id, 'linha'), quantity } : { merchandiseId: identificador(linha.merchandiseId, 'variante'), quantity };
  });
}

export function criarApiLoja({ ambiente = process.env, fetchImpl = globalThis.fetch, timeoutMs = 12000 } = {}) {
  // Configuração é lida por pedido para os testes; não há logs de tokens ou IDs do carrinho.
  async function consultar(config, operacao, variables, pedido) {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (config.tokenPublico) headers['X-Shopify-Storefront-Access-Token'] = config.tokenPublico;
    else {
      headers['Shopify-Storefront-Private-Token'] = config.tokenPrivado;
      // Não confiar em X-Forwarded-For enviado pelo cliente. Proxy confiável exige adaptação do deploy.
      const ip = pedido.socket.remoteAddress?.replace(/^::ffff:/, '');
      if (isIP(ip || '')) headers['Shopify-Storefront-Buyer-IP'] = ip;
    }
    let resposta;
    try { resposta = await fetchImpl(`https://${config.dominio}/api/${config.versao}/graphql.json`, { method: 'POST', headers, body: JSON.stringify({ query: OPERACOES[operacao], variables }), signal: AbortSignal.timeout(timeoutMs), redirect: 'error' }); }
    catch { falhar(502, 'SHOPIFY_INDISPONIVEL', 'Não foi possível consultar a loja. Tente novamente.'); }
    if (!resposta.ok) falhar(resposta.status === 429 ? 429 : 502, 'SHOPIFY_INDISPONIVEL', 'A loja está temporariamente indisponível. Tente novamente.');
    let resultado;
    try { resultado = await resposta.json(); } catch { falhar(502, 'SHOPIFY_RESPOSTA_INVALIDA', 'A loja retornou uma resposta inválida.'); }
    if (resultado.errors?.length || !objeto(resultado.data)) falhar(502, 'SHOPIFY_CONSULTA_RECUSADA', 'Não foi possível carregar estes dados da loja. Confira a configuração Shopify.');
    return resultado.data;
  }
  function responder(resposta, status, dados) { resposta.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }); resposta.end(JSON.stringify(dados)); }
  return async function api(pedido, resposta, url) {
    if (!url.pathname.startsWith('/api/')) return false;
    try {
      if (url.href.length > 12000) falhar(414, 'URL_GRANDE', 'O endereço é muito grande.');
      const config = lerConfiguracao(ambiente);
      const modo = config.configurado ? 'shopify' : 'demonstracao';
      if (url.pathname === '/api/loja/config' && pedido.method === 'GET') { responder(resposta, 200, configuracaoPublica(config)); return true; }
      if (url.pathname === '/api/produtos' && pedido.method === 'GET') {
        const parametros = parametrosCatalogo(url.searchParams);
        if (!config.configurado) { responder(resposta, 200, { modo, produtos: { nodes: [], filters: [], pageInfo: { hasNextPage: false, endCursor: null } } }); return true; }
        const { first, after, busca, ordem, filters } = parametros;
        const reverse = ordem === 'preco-maior' || ordem === 'novidades';
        let produtos; let escopo = 'colecao';
        if (busca || (!config.colecao && filters.some(f => f.variantOption || f.productMetafield))) {
          // Busca global usa as mesmas facetas; a API suporta apenas relevância/preço nesta operação.
          if (!['destaques', 'preco-menor', 'preco-maior'].includes(ordem)) falhar(400, 'ORDEM_BUSCA_INVALIDA', 'A busca permite relevância ou preço.');
          produtos = (await consultar(config, 'busca', { first, after, query: busca || '*', filters, sortKey: ordem.startsWith('preco-') ? 'PRICE' : 'RELEVANCE', reverse }, pedido)).search;
          escopo = 'busca';
        } else if (config.colecao) {
          const resultado = await consultar(config, 'colecao', { handle: config.colecao, first, after, filters, sortKey: ORDEM[ordem], reverse }, pedido);
          if (!resultado.collection) falhar(503, 'COLECAO_INDISPONIVEL', 'A coleção da loja ainda não está disponível neste canal.');
          produtos = resultado.collection.products;
        } else {
          produtos = (await consultar(config, 'produtos', { first, after, query: queryFiltros(filters), sortKey: ordem === 'destaques' ? 'ID' : ordem === 'novidades' ? 'CREATED_AT' : ORDEM[ordem], reverse }, pedido)).products;
          escopo = 'catalogo';
        }
        if (!produtos) falhar(502, 'SHOPIFY_RESPOSTA_INVALIDA', 'O catálogo não pôde ser carregado.');
        responder(resposta, 200, { modo, escopo, produtos }); return true;
      }
      if (/^\/api\/produtos\/[^/]+$/.test(url.pathname) && pedido.method === 'GET') {
        const handle = decodeURIComponent(url.pathname.split('/').at(-1));
        if (!/^[a-z0-9][a-z0-9-]{0,254}$/.test(handle)) falhar(400, 'PRODUTO_INVALIDO', 'Endereço de produto inválido.');
        if ([...url.searchParams.keys()].some(chave => chave !== 'variantesDepois')) falhar(400, 'PARAMETRO_INVALIDO', 'Parâmetro de produto inválido.');
        if (!config.configurado) { responder(resposta, 200, { modo, produto: null }); return true; }
        const variantesDepois = url.searchParams.has('variantesDepois') ? texto(url.searchParams.get('variantesDepois'), 'Cursor', 2048) : null;
        const produto = (await consultar(config, 'produto', { handle, variantesDepois }, pedido)).product;
        responder(resposta, produto ? 200 : 404, { modo, produto: produto || null }); return true;
      }
      if (url.pathname === '/api/carrinho' && pedido.method === 'GET') {
        if (!config.configurado) { responder(resposta, 200, { modo, carrinho: null }); return true; }
        const id = identificador(url.searchParams.get('id'), 'carrinho');
        const carrinho = (await consultar(config, 'carrinho', { id }, pedido)).cart;
        responder(resposta, 200, { modo, carrinho: carrinho || null }); return true;
      }
      const criar = url.pathname === '/api/carrinho' && pedido.method === 'POST';
      const itens = url.pathname === '/api/carrinho/itens' && ['POST', 'PATCH', 'DELETE'].includes(pedido.method);
      if (criar || itens) {
        origemPermitida(pedido, config);
        if (!config.configurado) falhar(503, 'LOJA_NAO_CONFIGURADA', 'As compras estarão disponíveis quando a loja estiver conectada.');
        const corpo = await lerCorpo(pedido);
        let operacao; let variables; let chave;
        if (criar) {
          chaves(corpo, ['linhas']); operacao = 'criar'; chave = 'cartCreate';
          variables = { input: { lines: validarLinhas(corpo.linhas), buyerIdentity: { countryCode: 'BR' } } };
        } else {
          chaves(corpo, pedido.method === 'DELETE' ? ['carrinhoId', 'linhasIds'] : ['carrinhoId', 'linhas']);
          const cartId = identificador(corpo.carrinhoId, 'carrinho');
          if (pedido.method === 'DELETE') {
            if (!Array.isArray(corpo.linhasIds) || !corpo.linhasIds.length || corpo.linhasIds.length > 25) falhar(400, 'LINHAS_INVALIDAS', 'Escolha entre 1 e 25 itens.');
            operacao = 'remover'; chave = 'cartLinesRemove'; variables = { cartId, lineIds: corpo.linhasIds.map(id => identificador(id, 'linha')) };
          } else {
            const atualizacao = pedido.method === 'PATCH'; operacao = atualizacao ? 'atualizar' : 'adicionar'; chave = atualizacao ? 'cartLinesUpdate' : 'cartLinesAdd';
            variables = { cartId, lines: validarLinhas(corpo.linhas, atualizacao) };
          }
        }
        const resultado = (await consultar(config, operacao, variables, pedido))[chave];
        if (!resultado) falhar(502, 'SHOPIFY_RESPOSTA_INVALIDA', 'O carrinho não pôde ser carregado.');
        if (resultado.userErrors?.length) { responder(resposta, 422, { modo, erro: { codigo: 'CARRINHO_RECUSADO', mensagem: 'A Shopify não pôde atualizar estes itens. Confira as quantidades e a disponibilidade.' }, erros: resultado.userErrors.map(({ field, code }) => ({ campo: field, codigo: code })), carrinho: resultado.cart || null }); return true; }
        if (!resultado.cart) falhar(502, 'SHOPIFY_RESPOSTA_INVALIDA', 'O carrinho não pôde ser carregado.');
        responder(resposta, criar ? 201 : 200, { modo, carrinho: resultado.cart, avisos: (resultado.warnings || []).map(({ code }) => ({ codigo: code })) }); return true;
      }
      falhar(404, 'ROTA_INEXISTENTE', 'Esta operação não existe.');
    } catch (erro) {
      responder(resposta, erro instanceof ErroLoja ? erro.status : 500, { erro: { codigo: erro instanceof ErroLoja ? erro.codigo : 'ERRO_INTERNO', mensagem: erro instanceof ErroLoja ? erro.message : 'Não foi possível concluir a operação.' } });
    }
    return true;
  };
}
