import test from 'node:test';
import assert from 'node:assert/strict';
import { demoProdutos, ehCor, resolverVariante, trocarCorPreservandoOpcoes, varianteInicial, urlProduto, urlSegura, imagemProduto, precoFormatado, corOpcao, informacoesEditoriaisProduto, dimensoesProduto } from '../catalogo.js';

const variante = (id, cor, tamanho, acabamento, extras = {}) => ({
  id: `gid://shopify/ProductVariant/${id}`, sku: `obra-${id}`, availableForSale: true,
  selectedOptions: [{ name: 'Cor', value: cor }, { name: 'Tamanho', value: tamanho }, { name: 'Acabamento', value: acabamento }],
  image: { url: `https://cdn.shopify.com/obra-${id}.jpg`, altText: `Obra ${cor}` },
  price: { amount: '250.00', currencyCode: 'BRL' }, ...extras,
});
const produto = {
  handle: 'obra', title: 'Obra',
  featuredImage: { url: 'https://cdn.shopify.com/generica-brasa.jpg' },
  options: [
    { name: 'Cor', values: ['Brasa', 'Lago'] },
    { name: 'Tamanho', values: ['P', 'G'] },
    { name: 'Acabamento', values: ['Preto', 'Dourado'] },
  ],
  variants: { nodes: [
    variante('1', 'Brasa', 'P', 'Preto'),
    variante('2', 'Lago', 'G', 'Dourado'),
    variante('3', 'Lago', 'P', 'Preto', { image: null, availableForSale: false }),
    variante('4', 'Brasa', 'P', 'Dourado'),
  ] },
};

test('trocar a cor preserva tamanho e acabamento, mesmo quando outra combinação aparece antes', () => {
  const resultado = trocarCorPreservandoOpcoes(produto, produto.variants.nodes[0], 'Lago');
  assert.equal(resultado.id, 'gid://shopify/ProductVariant/3');
  assert.equal(resultado.availableForSale, false, 'Indisponibilidade não autoriza mudar a combinação escolhida.');
  assert.equal(ehCor('Acabamento'), false);
  assert.equal(ehCor('Rod finish'), false);
  assert.equal(ehCor('Color'), true);
});

test('uma combinação inexistente não cai na primeira variante da mesma cor', () => {
  assert.equal(trocarCorPreservandoOpcoes(produto, produto.variants.nodes[1], 'Brasa'), null);
  assert.equal(resolverVariante(produto, { Cor: 'Lago', Tamanho: 'P', Acabamento: 'Dourado' }), null);
  assert.equal(resolverVariante(produto, { Cor: 'Lago' }), null);
  assert.equal(resolverVariante(produto, { Cor: 'Lago', Tamanho: 'P', Acabamento: 'Preto', Voltagem: '220 V' }), null);
});

test('metadado parcial de firstSelectableVariant não pode resolver uma combinação comercial', () => {
  const parcial = { ...produto, variants: { nodes: [{ id: 'gid://shopify/ProductVariant/99', availableForSale: true }, ...produto.variants.nodes] } };
  assert.equal(resolverVariante(parcial, {}), null);
  assert.equal(resolverVariante(parcial, { Cor: 'Lago', Tamanho: 'P', Acabamento: 'Preto' }).id, 'gid://shopify/ProductVariant/3');
});

test('URL preserva a variante e SKU e dá precedência ao ID em links conflitantes', () => {
  for (const item of produto.variants.nodes) {
    const url = new URL(urlProduto(produto, item), 'https://perparte.test');
    assert.equal(varianteInicial(produto, url.searchParams), item);
    assert.equal(url.searchParams.get('sku'), item.sku);
  }
  assert.equal(varianteInicial(produto, new URLSearchParams('variant=3&sku=obra-1')), produto.variants.nodes[2]);
  assert.equal(varianteInicial(produto, new URLSearchParams('sku=obra-4')), produto.variants.nodes[3]);
});

test('variante ou SKU removidos não são substituídos silenciosamente por algo comprável', () => {
  assert.equal(varianteInicial(produto, new URLSearchParams('variant=999')), null);
  assert.equal(varianteInicial(produto, new URLSearchParams('sku=removida')), null);
  assert.equal(varianteInicial(produto, new URLSearchParams('variant=999&sku=obra-1')), null);
  assert.equal(varianteInicial(produto), produto.variants.nodes[0]);
});

test('foto de outra cor nunca é usada como foto da variante selecionada', () => {
  assert.equal(imagemProduto(produto, produto.variants.nodes[2]), null);
  assert.equal(imagemProduto(produto, produto.variants.nodes[1]).url, 'https://cdn.shopify.com/obra-2.jpg');
  assert.equal(imagemProduto(produto).url, 'https://cdn.shopify.com/generica-brasa.jpg', 'Galeria geral pode usar imagem geral sem seleção de variante.');
});

test('URLs e amostras rejeitam protocolos ativos e CSS injetável', () => {
  for (const valor of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', '//evil.example/a', '/\\evil.example/a', '/images/\nfoto.png', 'file:///segredo']) assert.equal(urlSegura(valor), '');
  assert.equal(urlSegura('/images/marco.png'), '/images/marco.png');
  assert.equal(urlSegura('/conta', { externa: true }), '');
  assert.equal(urlSegura('https://shopify.com/123/account', { externa: true }), 'https://shopify.com/123/account');
  assert.equal(corOpcao({ name: 'Nova', swatch: { color: 'red;background:url(https://evil.example)' } }), '');
});

test('preço ausente ou inválido não vira valor gratuito', () => {
  for (const amount of [null, undefined, '', ' ', -1, 'NaN', Infinity]) assert.equal(precoFormatado({ amount, currencyCode: 'BRL' }), '');
  assert.match(precoFormatado({ amount: '0.00', currencyCode: 'BRL' }), /0,00$/);
  assert.match(precoFormatado({ amount: '250.50', currencyCode: 'BRL' }), /250,50$/);
});

test('estudos editoriais nunca carregam preço, disponibilidade ou variante comercial', () => {
  assert.deepEqual(demoProdutos.map(item => item.handle), ['marco', 'duna', 'farol']);
  for (const estudo of demoProdutos) {
    assert.equal(estudo.estudo, true);
    assert.equal(estudo.availableForSale, false);
    assert.equal(estudo.priceRange, undefined);
    assert.equal(estudo.variants.nodes.length, 1, 'Cenários de foto não são variantes de cor.');
    const item = estudo.variants.nodes[0];
    assert.equal(item.price, undefined);
    assert.equal(item.availableForSale, false);
    assert.equal(urlProduto(estudo, item), `/produtos/${estudo.handle}`);
    assert.equal(imagemProduto(estudo, item).url, `/images/${estudo.handle}.png`);
  }
});

const metadados = valores => Object.entries(valores).map(([key, value]) => ({ namespace: 'perparte', key, value }));

test('editorial dos estudos identifica conceito sem inventar medidas, datas ou cores adicionais', () => {
  const campanhas = { marco: 'campanha-marco-orbita', duna: 'campanha-duna-jardim', farol: 'campanha-farol-cenario' };
  for (const estudo of demoProdutos) {
    const info = informacoesEditoriaisProduto(estudo);
    assert.equal(info.rotulo, 'Composição em estudo');
    assert.equal(info.credito, 'Per Parte');
    assert.equal(info.paragrafos.length, 2);
    assert.equal(info.ano, '');
    assert.equal(dimensoesProduto(estudo), '');
    assert.equal(info.materiais, null);
    assert.deepEqual(info.especificacoes, []);
    assert.deepEqual(info.coresCuradas, [estudo.options[0].values[0]]);
    assert.equal(info.escala.imagem.url, `/images/${campanhas[estudo.handle]}.png`);
    assert.equal(info.escala.legenda, 'Imagem conceitual; proporções ilustrativas. Dimensões em definição.');
    assert.ok(info.design.texto && info.detalhes.texto);
  }
});

test('editorial remoto usa campos cadastrados e resolve referência de imagem separada da galeria', () => {
  const remoto = { ...produto, vendor: 'Marca cadastrada', metafields: [
    ...metadados({ historia_titulo: 'Título cadastrado', historia: 'Primeiro parágrafo.\n\nSegundo parágrafo.', ano_criacao: '2025', criador: 'Crédito cadastrado', legenda_escala: 'Legenda cadastrada.', materiais: 'Material informado.', cuidados: 'Cuidados informados.', especificacoes: 'Detalhes informados.', dimensoes: 'Medida aprovada.', tamanho: 'Grande' }),
    { namespace: 'perparte', key: 'imagem_escala', type: 'file_reference', value: 'gid://shopify/MediaImage/10', reference: { image: { url: 'https://cdn.shopify.com/escala.jpg', altText: 'Foto cadastrada', width: 1200, height: 800 } } },
  ] };
  const info = informacoesEditoriaisProduto(remoto);
  assert.equal(info.titulo, 'Título cadastrado');
  assert.deepEqual(info.paragrafos, ['Primeiro parágrafo.', 'Segundo parágrafo.']);
  assert.equal(info.credito, 'Crédito cadastrado');
  assert.equal(info.ano, '2025');
  assert.equal(info.rotulo, '');
  assert.equal(info.escala.imagem.url, 'https://cdn.shopify.com/escala.jpg');
  assert.equal(info.escala.imagem.width, 1200);
  assert.equal(info.escala.legenda, 'Legenda cadastrada.');
  assert.equal(info.materiais.texto, 'Material informado.');
  assert.equal(info.detalhes.texto, 'Detalhes informados.');
  assert.equal(info.especificacoes.find(item => item.id === 'dimensoes').texto, 'Medida aprovada.');
  assert.equal(dimensoesProduto(remoto), 'Grande');
  assert.equal(dimensoesProduto({ metafields: metadados({ tamanho: ' ', dimensoes: 'Medida aprovada.' }) }), 'Medida aprovada.');
});

test('produto remoto sem editorial não herda história de estudo, ano atual ou imagem genérica de escala', () => {
  const info = informacoesEditoriaisProduto({ ...produto, handle: 'marco', editorial: demoProdutos[0].editorial });
  assert.deepEqual(info.paragrafos, []);
  assert.equal(info.titulo, '');
  assert.equal(info.ano, '');
  assert.equal(info.credito, '');
  assert.equal(info.rotulo, '');
  assert.equal(info.escala, null);
  assert.equal(info.materiais, null);
  assert.deepEqual(info.especificacoes, []);
  assert.equal(dimensoesProduto(produto), '');
  const formatoNaoSuportado = informacoesEditoriaisProduto({ metafields: [{ namespace: 'perparte', key: 'historia', type: 'rich_text_field', value: '{"type":"root"}' }, ...metadados({ ano_criacao: 'feito ontem' })] });
  assert.deepEqual(formatoNaoSuportado.paragrafos, [], 'JSON rich text não deve aparecer como história em texto simples.');
  assert.equal(formatoNaoSuportado.ano, '');
});

test('curadoria aceita somente cores com opção e variante existentes e não modifica a seleção', () => {
  const dados = { ...produto, options: [{ name: 'Cor', values: ['Brasa', 'Lago', 'Mata'] }, ...produto.options.slice(1)], metafields: metadados({ cores_criador: '["Lago","Mata","Inexistente","Lago",null,3]' }) };
  assert.deepEqual(informacoesEditoriaisProduto(dados).coresCuradas, ['Lago']);
  assert.equal(dados.variants.nodes.length, 4);
  assert.equal(dados.variants.nodes[0].selectedOptions[0].value, 'Brasa');
  for (const value of ['sem JSON', '{"cor":"Lago"}', 'null', '[]']) {
    assert.deepEqual(informacoesEditoriaisProduto({ ...produto, metafields: metadados({ cores_criador: value }) }).coresCuradas, []);
  }
});

test('imagem editorial rejeita URL ativa e referência sem mídia, sem usar a primeira foto como substituta', () => {
  for (const url of ['javascript:alert(1)', '//evil.example/foto', '/\\evil.example/foto', 'data:image/svg+xml,script']) {
    const remoto = { ...produto, metafields: [{ namespace: 'perparte', key: 'imagem_escala', reference: { image: { url } } }] };
    assert.equal(informacoesEditoriaisProduto(remoto).escala, null);
    const estudo = { estudo: true, editorial: { escala: { imagem: { url } }, design: { titulo: 'Desenho', texto: 'Texto', imagem: { url } } } };
    assert.equal(informacoesEditoriaisProduto(estudo).escala, null);
    assert.equal(informacoesEditoriaisProduto(estudo).design.imagem, undefined);
  }
  assert.equal(informacoesEditoriaisProduto({ ...produto, metafields: metadados({ imagem_escala: 'gid://shopify/MediaImage/10' }) }).escala, null);
});
