/* Contrato da vitrine. Dados comerciais vêm exclusivamente da Shopify. */
export const normalizar = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
export const nos = conexao => Array.isArray(conexao) ? conexao : conexao?.nodes || conexao?.edges?.map(item => item.node) || [];
export const variantesProduto = produto => nos(produto?.variants);
export const imagensProduto = produto => nos(produto?.images);
export const ehCor = nome => /^(cor|cores|color|colour|colorway)$/i.test(normalizar(nome));

const estudos = [
  { handle: 'marco', title: 'Marco', description: 'Verde Marco na base. Âmbar nos três anéis. Areia no difusor. A obra-manifesto dá forma à nossa ideia: toda parte tem um porquê.', cor: 'Verde Marco', hexadecimal: '#7D8C6F', fotos: ['marco', 'categoria-marco-violeta', 'campanha-marco-orbita', 'insp-marco-escada'], autoria: 'Composição-base da Revista de Marca' },
  { handle: 'duna', title: 'Duna', description: 'Um volume suave encontra uma base de cor. Duna explora o contraste entre a calma da luz e a força de uma única parte. Curvas amplas para acompanhar o seu canto preferido.', cor: 'Brasa', hexadecimal: '#A90000', fotos: ['duna', 'categoria-duna-verde', 'ambiente-duna', 'detalhes-duna'], autoria: 'Proposta de composição Per Parte' },
  { handle: 'farol', title: 'Farol', description: 'Luz Acesa em um volume contínuo. Lago marca a base e o encontro entre as partes. Uma composição vertical para dar outro ritmo à sua mesa.', cor: 'Lago', hexadecimal: '#008795', fotos: ['farol', 'categoria-farol-ambar', 'ambiente-farol', 'insp-farol-mar'], autoria: 'Proposta de composição Per Parte' },
];

// Textos próprios derivados da Revista de Marca e de docs/site-direcao-conteudo.md.
// Imagens de campanha são estudos; não representam medição de uma peça fabricada.
const editoriaisEstudo = {
  marco: {
    titulo: 'Toda parte tem um porquê.',
    paragrafos: [
      'Marco é a composição-base apresentada na Revista de Marca: Verde Marco na base, três anéis Âmbar e Areia no difusor.',
      'A separação entre base, corpo e difusor torna visível a ideia que orienta a Per Parte: criar a obra parte por parte. Cada encontro participa do desenho.',
    ],
    design: { titulo: 'Base, anéis e luz.', texto: 'Uma base cilíndrica sustenta três anéis arredondados e um difusor amplo. A composição combina volumes simples e junções visíveis.' },
    detalhes: { titulo: 'O encontro das partes.', texto: 'Os três anéis marcam o corpo de Marco. Verde, Âmbar e Areia distinguem as partes da composição.' },
    imagemEscala: 'campanha-marco-orbita',
    altEscala: 'Estudo de Marco sobre um pedestal, ao lado de uma pessoa sentada, em cenário verde.',
  },
  duna: {
    titulo: 'Uma pausa em forma de luz.',
    paragrafos: [
      'Duna é um estudo de uma silhueta baixa e larga. Uma cúpula arredondada em creme encontra uma base curta em Brasa.',
      'A proposta explora o contraste entre a calma da luz e a presença de uma única parte de cor. Curvas amplas dão à composição sua expressão tranquila.',
    ],
    design: { titulo: 'Curvas que se encontram.', texto: 'O difusor hemisférico de borda suave se apoia em um pedestal cilíndrico curto. A separação entre os dois volumes permanece visível.' },
    detalhes: { titulo: 'Cor no encontro.', texto: 'As ranhuras verticais da base em Brasa contrastam com a superfície suave da cúpula.', imagem: { url: '/images/detalhes-duna.png', altText: 'Detalhe conceitual do encontro entre a base Brasa e o difusor creme de Duna.' } },
    imagemEscala: 'campanha-duna-jardim',
    altEscala: 'Estudo de Duna apoiada no colo de uma pessoa sentada em cenário Brasa.',
  },
  farol: {
    titulo: 'Uma linha vertical de luz.',
    paragrafos: [
      'Farol é uma proposta de composição vertical, com um difusor alto de superfície canelada e uma base em Lago.',
      'Um anel discreto marca o encontro entre base e difusor. Luz Acesa percorre o volume, enquanto a cor se concentra na base.',
    ],
    design: { titulo: 'Presença vertical.', texto: 'O difusor cilíndrico de extremidades arredondadas forma uma silhueta esguia, apoiada em uma base baixa e larga.' },
    detalhes: { titulo: 'Uma junção em Lago.', texto: 'O anel junto à base acompanha a cor Lago. As caneluras verticais reforçam a continuidade do difusor.' },
    imagemEscala: 'campanha-farol-cenario',
    altEscala: 'Estudo de Farol sobre um pedestal de azulejos, junto a uma pessoa em cenário azul.',
  },
};

export const demoProdutos = estudos.map(estudo => ({
  id: `estudo:${estudo.handle}`, handle: estudo.handle, title: estudo.title, description: estudo.description,
  productType: 'Luminária de mesa', vendor: 'Per Parte', estudo: true, availableForSale: false, tags: [],
  featuredImage: { url: `/images/${estudo.fotos[0]}.png`, altText: `${estudo.title}, imagem conceitual` },
  images: { nodes: estudo.fotos.map((foto, indice) => ({ id: `${estudo.handle}:${indice}`, url: `/images/${foto}.png`, altText: `${estudo.title}, ${indice === 0 ? 'composição' : 'ambiente'} conceitual` })) },
  options: [{ name: 'Cor', optionValues: [{ name: estudo.cor, swatch: { color: estudo.hexadecimal } }], values: [estudo.cor] }],
  variants: { nodes: [{ id: `estudo:${estudo.handle}:original`, title: estudo.cor, sku: `${estudo.handle}-estudo`, availableForSale: false, image: { url: `/images/${estudo.fotos[0]}.png`, altText: `${estudo.title}, imagem conceitual` }, selectedOptions: [{ name: 'Cor', value: estudo.cor }] }] },
  metafields: [
    { namespace: 'perparte', key: 'autoria', value: estudo.autoria },
    { namespace: 'perparte', key: 'cores_criador', type: 'list.single_line_text_field', value: JSON.stringify([estudo.cor]) },
  ],
  editorial: {
    rotulo: 'Composição em estudo', titulo: editoriaisEstudo[estudo.handle].titulo,
    paragrafos: editoriaisEstudo[estudo.handle].paragrafos, credito: 'Per Parte',
    design: editoriaisEstudo[estudo.handle].design, detalhes: editoriaisEstudo[estudo.handle].detalhes,
    escala: {
      imagem: { url: `/images/${editoriaisEstudo[estudo.handle].imagemEscala}.png`, altText: editoriaisEstudo[estudo.handle].altEscala, width: 1536, height: 1024 },
      legenda: 'Imagem conceitual; proporções ilustrativas. Dimensões em definição.',
    },
    especificacoes: [],
  },
}));

export async function apiLoja(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, { ...opcoes, headers: { Accept: 'application/json', ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}), ...opcoes.headers } });
  const tipo = resposta.headers.get('content-type') || '';
  if (!tipo.includes('application/json')) throw new Error('A loja não está disponível neste endereço. Tente novamente em instantes.');
  const dados = await resposta.json();
  if (!resposta.ok || dados.erro || dados.error) {
    const erro = dados.erro || dados.error;
    const falha = new Error(typeof erro === 'string' ? erro : erro?.mensagem || erro?.message || dados.mensagem || `Não foi possível concluir a solicitação (${resposta.status}).`);
    if (dados.carrinho) falha.carrinho = dados.carrinho;
    falha.codigo = erro?.codigo || '';
    falha.produtoAusente = resposta.status === 404 && Object.hasOwn(dados, 'produto') && dados.produto === null;
    throw falha;
  }
  return dados;
}
export const request = apiLoja;

export function metacampo(produto, chave) {
  return nos(produto?.metafields).find(item => item && item.key === chave && ['perparte', 'custom'].includes(item.namespace))?.value ?? '';
}

const textoEditorial = valor => typeof valor === 'string' ? valor.trim() : '';
function imagemEditorial(imagem) {
  const url = urlSegura(imagem?.url);
  if (!url) return null;
  const resultado = { url, altText: textoEditorial(imagem.altText) };
  for (const eixo of ['width', 'height']) if (Number.isFinite(imagem[eixo]) && imagem[eixo] > 0) resultado[eixo] = imagem[eixo];
  return resultado;
}
function secaoEditorial(secao) {
  const texto = textoEditorial(secao?.texto);
  if (!texto) return null;
  const resultado = { titulo: textoEditorial(secao.titulo), texto };
  const imagem = imagemEditorial(secao.imagem);
  if (imagem) resultado.imagem = imagem;
  return resultado;
}

/** Rótulo de medida cadastrado para os cards; nunca deduz medidas de imagens/presets. */
export function dimensoesProduto(produto) {
  return textoEditorial(metacampo(produto, 'tamanho')) || textoEditorial(metacampo(produto, 'dimensoes'));
}

/**
 * Conteúdo em texto simples: a interface deve escapar os textos antes de inserir HTML.
 * Retorna {rotulo,titulo,paragrafos,credito,ano,coresCuradas,design,materiais,detalhes,
 * escala,especificacoes}. As três seções são null ou {titulo,texto,imagem?}; escala é
 * null ou {imagem:{url,altText,width?,height?},legenda}. Especificações são
 * [{id,titulo,texto}]. Campos ausentes não recebem medidas, datas ou histórias inferidas.
 * historia é multi_line_text_field; imagem_escala é file_reference para MediaImage.
 */
export function informacoesEditoriaisProduto(produto) {
  const local = produto?.estudo ? produto.editorial || {} : {};
  const campo = chave => nos(produto?.metafields).find(item => item && item.key === chave && ['perparte', 'custom'].includes(item.namespace));
  const historiaCampo = campo('historia');
  const historia = historiaCampo?.type === 'rich_text_field' ? '' : textoEditorial(historiaCampo?.value);
  const paragrafos = Array.isArray(local.paragrafos)
    ? local.paragrafos.map(textoEditorial).filter(Boolean)
    : historia.split(/\r?\n\s*\r?\n/).map(textoEditorial).filter(Boolean);
  const titulo = textoEditorial(local.titulo) || textoEditorial(metacampo(produto, 'historia_titulo'))
    || (paragrafos.length && textoEditorial(produto?.title) ? `A história de ${produto.title}` : '');
  const escalaCampo = campo('imagem_escala');
  const imagem = imagemEditorial(local.escala?.imagem || escalaCampo?.reference?.image);
  const legenda = textoEditorial(local.escala?.legenda) || textoEditorial(metacampo(produto, 'legenda_escala'));
  let coresCuradas = [];
  try {
    const lista = JSON.parse(metacampo(produto, 'cores_criador') || '[]');
    const existentes = new Set(coresProduto(produto).map(cor => cor.name).filter(nome =>
      variantesProduto(produto).some(variante => variante.selectedOptions?.some(opcao => ehCor(opcao.name) && opcao.value === nome))));
    if (Array.isArray(lista)) coresCuradas = [...new Set(lista.filter(nome => typeof nome === 'string' && existentes.has(nome)))];
  } catch { /* Curadoria inválida não inventa cores nem altera variantes. */ }
  const ano = textoEditorial(metacampo(produto, 'ano_criacao'));
  const especificacoes = [['dimensoes', 'Dimensões'], ['materiais', 'Materiais'], ['cuidados', 'Cuidados'], ['prazo_producao', 'Produção'], ['especificacoes', 'Especificações']]
    .map(([id, tituloCampo]) => ({ id, titulo: tituloCampo, texto: textoEditorial(metacampo(produto, id)) }))
    .filter(item => item.texto);
  return {
    rotulo: textoEditorial(local.rotulo), titulo, paragrafos,
    credito: textoEditorial(local.credito) || textoEditorial(metacampo(produto, 'criador')) || textoEditorial(produto?.vendor),
    ano: /^\d{4}$/.test(ano) ? ano : '', coresCuradas,
    design: secaoEditorial(local.design || { titulo: 'O desenho', texto: produto?.description }),
    materiais: secaoEditorial(local.materiais || { titulo: 'Materiais', texto: metacampo(produto, 'materiais') }),
    detalhes: secaoEditorial(local.detalhes || { titulo: 'Detalhes', texto: metacampo(produto, 'especificacoes') }),
    escala: imagem ? { imagem, legenda } : null,
    especificacoes,
  };
}

export function opcoesProduto(produto) {
  return (produto?.options || []).filter(opcao => normalizar(opcao.name) !== 'title').map(opcao => ({
    ...opcao,
    optionValues: opcao.optionValues?.length ? opcao.optionValues : (opcao.values || []).map(name => ({ name })),
  }));
}

export function resolverVariante(produto, selecionadas = {}) {
  return variantesProduto(produto).find(variante => {
    const opcoes = variante.selectedOptions;
    if (!Array.isArray(opcoes) || !opcoes.length) return false;
    return opcoes.every(opcao => selecionadas[opcao.name] === opcao.value)
      && Object.entries(selecionadas).every(([nome, valor]) => opcoes.some(opcao => opcao.name === nome && opcao.value === valor))
      && (produto.options || []).every(opcao => opcoes.some(selecionada => selecionada.name === opcao.name));
  }) || null;
}

export function varianteInicial(produto, parametros = new URLSearchParams()) {
  const variantes = variantesProduto(produto);
  const id = parametros.get('variant');
  const sku = parametros.get('sku');
  if (id) return variantes.find(variante => variante.id === id || variante.id?.split('/').at(-1) === id) || null;
  if (sku) return variantes.find(variante => variante.sku === sku) || null;
  return variantes.find(variante => variante.availableForSale) || variantes[0] || null;
}

export function trocarCorPreservandoOpcoes(produto, variante, nome) {
  const opcao = opcoesProduto(produto).find(item => ehCor(item.name));
  const valor = opcao?.optionValues.find(item => normalizar(item.name) === normalizar(nome));
  if (!opcao || !valor || !variante?.selectedOptions?.length) return null;
  const selecao = Object.fromEntries(variante.selectedOptions.map(item => [item.name, item.value]));
  selecao[opcao.name] = valor.name;
  return resolverVariante(produto, selecao);
}

export async function completarVariantesProduto(produto) {
  let paginas = 0;
  while (produto.variants?.pageInfo?.hasNextPage) {
    const cursor = produto.variants.pageInfo.endCursor;
    if (!cursor || paginas++ >= 50) throw new Error('Não foi possível carregar todas as opções desta luminária. Tente novamente.');
    const proxima = await apiLoja(`/api/produtos/${encodeURIComponent(produto.handle)}?variantesDepois=${encodeURIComponent(cursor)}`);
    if (!proxima.produto?.variants) throw new Error('Não foi possível carregar as opções desta luminária. Tente novamente.');
    produto.variants = { nodes: [...new Map([...variantesProduto(produto), ...variantesProduto(proxima.produto)].map(variante => [variante.id, variante])).values()], pageInfo: proxima.produto.variants.pageInfo };
  }
  return produto;
}

export function urlProduto(produto, variante) {
  const handle = typeof produto === 'string' ? produto : produto.handle;
  const url = `/produtos/${encodeURIComponent(handle)}`;
  if (!variante || typeof variante.id !== 'string' || variante.id.startsWith('estudo:')) return url;
  const parametros = new URLSearchParams({ variant: variante.id.split('/').at(-1) });
  if (variante.sku) parametros.set('sku', variante.sku);
  return `${url}?${parametros}`;
}

export function urlSegura(valor, { externa = false } = {}) {
  if (typeof valor !== 'string') return '';
  if (!externa && valor.startsWith('/') && !valor.startsWith('//') && !/[\\\u0000-\u001f]/.test(valor)) return valor;
  try { const url = new URL(valor); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}

export function imagemProduto(produto, variante) {
  // Uma foto genérica não prova a cor de uma variante selecionada.
  if (variante) return variante.image || null;
  return produto?.featuredImage || imagensProduto(produto)[0] || null;
}

const coresMarca = { brasa: '#A90000', 'luz acesa': '#F6E7C4', areia: '#E4DCCB', lago: '#008795', agua: '#83CFCB', sol: '#FFCD00', mata: '#00875D', grafite: '#333333', nevoa: '#EEEEEE', 'verde marco': '#7D8C6F', ambar: '#D9A441', vinho: '#670700' };
export function corOpcao(valor) {
  const cor = valor?.swatch?.color;
  if (typeof cor === 'string' && /^(#[\da-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\))$/i.test(cor)) return cor;
  return coresMarca[normalizar(valor?.name)] || '';
}
export function coresProduto(produto) { return opcoesProduto(produto).find(opcao => ehCor(opcao.name))?.optionValues || []; }

export function precoFormatado(preco) {
  if (!preco || !['string', 'number'].includes(typeof preco.amount) || String(preco.amount).trim() === '' || !Number.isFinite(Number(preco.amount)) || Number(preco.amount) < 0 || !preco.currencyCode) return '';
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: preco.currencyCode }).format(Number(preco.amount)); } catch { return ''; }
}

export const CHAVE_CARRINHO = 'perparte.shopify.carrinho.v1';
export function lerCarrinhoLocal() {
  try {
    const bruto = localStorage.getItem(CHAVE_CARRINHO);
    if (bruto === null) return { id: '', quantidade: 0, valido: true };
    const dados = JSON.parse(bruto);
    if (dados?.versao !== 1 || typeof dados.id !== 'string' || !dados.id.startsWith('gid://shopify/Cart/') || !Number.isInteger(dados.quantidade) || dados.quantidade < 0) return { id: '', quantidade: 0, valido: false };
    return { ...dados, valido: true };
  } catch { return { id: '', quantidade: 0, valido: false }; }
}
export function guardarCarrinho(carrinho) {
  if (!lerCarrinhoLocal().valido) return false;
  try {
    if (!carrinho) localStorage.removeItem(CHAVE_CARRINHO);
    else localStorage.setItem(CHAVE_CARRINHO, JSON.stringify({ versao: 1, id: carrinho.id, quantidade: carrinho.totalQuantity || 0 }));
    window.dispatchEvent(new CustomEvent('perparte:carrinho', { detail: carrinho }));
    return true;
  } catch { return false; }
}
