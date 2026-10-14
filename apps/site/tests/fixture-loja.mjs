// Servidor isolado de QA. Não lê .env.local e NUNCA faz requisições à Shopify.
// Valores, variantes, disponibilidade e checkout abaixo são exclusivamente fictícios.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { criarServidor } from '../servidor.mjs';

const dinheiro = valor => ({ amount: Number(valor).toFixed(2), currencyCode: 'BRL' });
const fotoBrasa = { url: '/images/duna.png', altText: 'Imagem conceitual usada somente no ensaio local — Brasa', width: 1024, height: 1024 };
const fotoLago = { url: '/images/farol.png', altText: 'Imagem conceitual usada somente no ensaio local — Lago', width: 1024, height: 1024 };
const pagina = { hasNextPage: false, endCursor: null };
const criarVariante = (id, cor, tamanho, preco, disponivel = true) => ({
  id: `gid://shopify/ProductVariant/${id}`, title: `${cor} / ${tamanho}`, sku: `TESTE-${id}`,
  availableForSale: disponivel, selectedOptions: [{ name: 'Cor', value: cor }, { name: 'Tamanho', value: tamanho }],
  price: dinheiro(preco), compareAtPrice: null, image: cor === 'Brasa' ? fotoBrasa : fotoLago,
});
const variantes = [
  criarVariante(90011, 'Brasa', 'Pequeno', 120),
  criarVariante(90012, 'Brasa', 'Grande', 160, false),
  criarVariante(90013, 'Lago', 'Pequeno', 140),
];
export const produtoEnsaio = {
  id: 'gid://shopify/Product/9001', handle: 'ensaio', title: 'Ensaio — produto de teste',
  description: 'Somente para testar esta vitrine local. Valores e disponibilidade fictícios. Nada é criado na Shopify e este item não pode ser comprado de verdade.',
  productType: 'Luminária de mesa', vendor: 'Per Parte — ensaio local', tags: ['fixture-local'], availableForSale: true,
  featuredImage: fotoBrasa, images: { nodes: [fotoBrasa, fotoLago], pageInfo: pagina },
  priceRange: { minVariantPrice: dinheiro(120), maxVariantPrice: dinheiro(160) },
  options: [
    { id: 'gid://shopify/ProductOption/9001', name: 'Cor', values: ['Brasa', 'Lago'], optionValues: [
      { id: 'gid://shopify/ProductOptionValue/9011', name: 'Brasa', swatch: { color: '#A90000', image: null }, firstSelectableVariant: variantes[0] },
      { id: 'gid://shopify/ProductOptionValue/9012', name: 'Lago', swatch: { color: '#008795', image: null }, firstSelectableVariant: variantes[2] },
    ] },
    { id: 'gid://shopify/ProductOption/9002', name: 'Tamanho', values: ['Pequeno', 'Grande'], optionValues: [
      { id: 'gid://shopify/ProductOptionValue/9021', name: 'Pequeno', swatch: null, firstSelectableVariant: variantes[0] },
      { id: 'gid://shopify/ProductOptionValue/9022', name: 'Grande', swatch: null, firstSelectableVariant: variantes[1] },
    ] },
  ],
  variants: { nodes: variantes, pageInfo: pagina },
  metafields: [
    ['especificacoes', 'Dados exclusivamente fictícios para QA local.'],
    ['dimensoes', 'Medidas de ensaio, sem validade para fabricação.'],
    ['materiais', 'Sem material comercial cadastrado neste ensaio.'],
    ['cuidados', 'Texto de exemplo para verificar o acordeão.'],
    ['prazo_producao', 'Não há produção nem entrega neste ambiente de teste.'],
    ['brilho', 'Suave'], ['difusao', 'Difusa'], ['tamanho', 'Pequeno'], ['ambiente', 'Sala'], ['criador', 'Equipe de testes'],
    ['cores_criador', '["Lago"]'],
  ].map(([key, value]) => ({ namespace: 'perparte', key, value, type: key === 'cores_criador' ? 'list.single_line_text_field' : 'single_line_text_field' })),
};

function corresponde(produto, filtro) {
  if ('available' in filtro) return produto.availableForSale === filtro.available;
  if (filtro.productType) return produto.productType === filtro.productType;
  if (filtro.productVendor) return produto.vendor === filtro.productVendor;
  if (filtro.tag) return produto.tags.includes(filtro.tag);
  if (filtro.variantOption) return variantes.some(variante => variante.selectedOptions.some(opcao => opcao.name === filtro.variantOption.name && opcao.value === filtro.variantOption.value));
  if (filtro.productMetafield) return produto.metafields.some(campo => campo.namespace === filtro.productMetafield.namespace && campo.key === filtro.productMetafield.key && campo.value === filtro.productMetafield.value);
  if (filtro.price) return variantes.some(variante => Number(variante.price.amount) >= (filtro.price.min ?? 0) && Number(variante.price.amount) <= (filtro.price.max ?? Infinity));
  return false;
}
const valorFaceta = (label, input, count = 1) => ({ id: `teste-${label}`, label, count, input: JSON.stringify(input) });
const facetas = [
  { id: 'filter.p.product_type', label: 'Categoria', type: 'LIST', values: [valorFaceta('Luminária de mesa', { productType: 'Luminária de mesa' })] },
  ...[['brilho', 'Brilho', 'Suave'], ['difusao', 'Difusão', 'Difusa'], ['tamanho', 'Tamanho', 'Pequeno']].map(([key, label, value]) => ({ id: `filter.p.m.perparte.${key}`, label, type: 'LIST', values: [valorFaceta(value, { productMetafield: { namespace: 'perparte', key, value } })] })),
  { id: 'filter.v.option.cor', label: 'Cor', type: 'LIST', values: ['Brasa', 'Lago'].map(value => valorFaceta(value, { variantOption: { name: 'Cor', value } })) },
  { id: 'filter.v.availability', label: 'Disponibilidade', type: 'LIST', values: [valorFaceta('Disponível', { available: true }), valorFaceta('Indisponível', { available: false }, 0)] },
  { id: 'filter.v.price', label: 'Preço', type: 'PRICE_RANGE', values: [valorFaceta('Preço', { price: { min: 120, max: 160 } })] },
];

export function criarFixtureLoja() {
  const carrinhos = new Map();
  let proximoCarrinho = 0;
  const materializar = carrinho => {
    const linhas = carrinho.linhas.map(linha => {
      const variante = variantes.find(item => item.id === linha.merchandiseId);
      return { id: linha.id, quantity: linha.quantity, cost: { totalAmount: dinheiro(Number(variante.price.amount) * linha.quantity) }, merchandise: { ...variante, product: { id: produtoEnsaio.id, handle: produtoEnsaio.handle, title: produtoEnsaio.title, featuredImage: produtoEnsaio.featuredImage } } };
    });
    const total = linhas.reduce((soma, linha) => soma + Number(linha.cost.totalAmount.amount), 0);
    return { id: carrinho.id, checkoutUrl: 'https://perparte-fixture.myshopify.com/checkouts/sem-transacao', totalQuantity: linhas.reduce((soma, linha) => soma + linha.quantity, 0), cost: { subtotalAmount: dinheiro(total), totalAmount: dinheiro(total), totalTaxAmount: null }, lines: { nodes: linhas, pageInfo: pagina } };
  };
  const aplicarItens = (carrinho, linhas, atualizar = false) => {
    const userErrors = [];
    const warnings = [];
    for (const item of linhas) {
      const existente = carrinho.linhas.find(linha => atualizar ? linha.id === item.id : linha.merchandiseId === item.merchandiseId);
      const merchandiseId = atualizar ? existente?.merchandiseId : item.merchandiseId;
      const variante = variantes.find(item => item.id === merchandiseId);
      if (!variante || !variante.availableForSale) { userErrors.push({ field: ['lines'], code: 'INVALID', message: 'Variante de ensaio indisponível.' }); continue; }
      const solicitada = atualizar ? item.quantity : (existente?.quantity || 0) + item.quantity;
      const quantity = Math.min(solicitada, 5);
      if (quantity !== solicitada) warnings.push({ code: 'MERCHANDISE_NOT_ENOUGH_STOCK', message: 'O estoque fictício foi limitado a cinco unidades.' });
      if (quantity === 0) carrinho.linhas = carrinho.linhas.filter(linha => linha !== existente);
      else if (existente) existente.quantity = quantity;
      else carrinho.linhas.push({ id: `gid://shopify/CartLine/teste-${variante.id.split('/').at(-1)}?cart=fixture-${carrinho.numero}`, merchandiseId, quantity });
    }
    return { cart: materializar(carrinho), userErrors, warnings };
  };
  const fetchImpl = async (url, opcoes) => {
    if (url !== 'https://perparte-fixture.myshopify.com/api/2026-10/graphql.json') throw new Error('Fixture bloqueou um destino inesperado.');
    const { query, variables } = JSON.parse(opcoes.body);
    if (/query (Colecao|Catalogo|Busca)PerParte/.test(query)) {
      const filtros = variables.filters || [];
      const grupos = Map.groupBy(filtros, filtro => filtro.variantOption ? `opcao:${filtro.variantOption.name}` : filtro.productMetafield ? `campo:${filtro.productMetafield.key}` : Object.keys(filtro)[0]);
      const combina = [...grupos.values()].every(grupo => grupo.some(filtro => corresponde(produtoEnsaio, filtro)));
      const termo = query.includes('query Busca') ? variables.query.toLocaleLowerCase('pt-BR') : '';
      const buscaCombina = !termo || termo === '*' || `${produtoEnsaio.title} ${produtoEnsaio.description}`.toLocaleLowerCase('pt-BR').includes(termo);
      const conexao = { nodes: combina && buscaCombina && !variables.after ? [produtoEnsaio] : [], filters: facetas, pageInfo: pagina };
      return Response.json({ data: query.includes('query Colecao') ? { collection: { id: 'gid://shopify/Collection/9001', title: 'Coleção de teste', products: conexao } } : query.includes('query Busca') ? { search: { ...conexao, totalCount: conexao.nodes.length } } : { products: conexao } });
    }
    if (query.includes('query ProdutoPerParte')) return Response.json({ data: { product: variables.handle === 'ensaio' ? produtoEnsaio : null } });
    if (query.includes('query CarrinhoPerParte')) return Response.json({ data: { cart: carrinhos.has(variables.id) ? materializar(carrinhos.get(variables.id)) : null } });
    if (query.includes('mutation CriarCarrinhoPerParte')) {
      const numero = ++proximoCarrinho;
      const carrinho = { numero, id: `gid://shopify/Cart/fixture-${numero}?key=apenas-teste-local`, linhas: [] };
      carrinhos.set(carrinho.id, carrinho);
      return Response.json({ data: { cartCreate: aplicarItens(carrinho, variables.input.lines || []) } });
    }
    const chave = query.includes('mutation Adicionar') ? 'cartLinesAdd' : query.includes('mutation Atualizar') ? 'cartLinesUpdate' : query.includes('mutation Remover') ? 'cartLinesRemove' : '';
    if (!chave) throw new Error('Operação não implementada na fixture.');
    const carrinho = carrinhos.get(variables.cartId);
    if (!carrinho) return Response.json({ data: { [chave]: { cart: null, warnings: [], userErrors: [{ field: ['cartId'], code: 'INVALID', message: 'Sacola de teste expirada.' }] } } });
    if (chave === 'cartLinesRemove') {
      carrinho.linhas = carrinho.linhas.filter(linha => !variables.lineIds.includes(linha.id));
      return Response.json({ data: { [chave]: { cart: materializar(carrinho), userErrors: [], warnings: [] } } });
    }
    return Response.json({ data: { [chave]: aplicarItens(carrinho, variables.lines, chave === 'cartLinesUpdate') } });
  };
  return criarServidor({ ambiente: { SHOPIFY_STORE_DOMAIN: 'perparte-fixture.myshopify.com', SHOPIFY_STOREFRONT_PUBLIC_TOKEN: 'somente-teste-em-memoria', SHOPIFY_COLLECTION_HANDLE: 'todas', SHOPIFY_CUSTOMER_ACCOUNT_URL: 'https://perparte-fixture.myshopify.com/account' }, fetchImpl });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  criarFixtureLoja().listen(4180, '127.0.0.1', () => console.log('QA isolado — http://127.0.0.1:4180/produtos/ensaio — dados fictícios; nenhuma conexão Shopify.'));
}
