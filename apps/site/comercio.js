import { apiLoja, demoProdutos, normalizar, nos, variantesProduto, imagensProduto, opcoesProduto, resolverVariante, varianteInicial, trocarCorPreservandoOpcoes, completarVariantesProduto, urlProduto, urlSegura, imagemProduto, ehCor, corOpcao, coresProduto, precoFormatado, metacampo, informacoesEditoriaisProduto, dimensoesProduto, CHAVE_CARRINHO, lerCarrinhoLocal, guardarCarrinho } from './catalogo.js';
import { montarPaleta } from './paleta.js';
import { fecharNavegacao, focoNavegacao, categoriasLuminarias } from './navegacao.js';

const $ = (seletor, contexto = document) => contexto.querySelector(seletor);
const $$ = (seletor, contexto = document) => [...contexto.querySelectorAll(seletor)];
const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caractere]));
const seta = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m4.5 3 3 3-3 3"/></svg>';
const chevron = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg>';
const fechar = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M4 12l8-8"/></svg>';
const mais = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10"/></svg>';
const menos = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>';
let configuracao;
let ultimoFoco;
let temporizadorAviso;
let requisicaoLoja = 0;
let produtosCarregados = [];
let facetasCarregadas = [];
let paginacao = {};
let modoCatalogo = '';
let densidade = 'normal';
let produtoAtual;
let varianteAtual;
let selecaoAtual = {};
let ocupada = false;
let carrinhoAtual;
let corCriador = false;
const controladoresCartoes = new Map();

function migalhas(itens) { return `<nav class="migalhas" aria-label="Caminho da página"><a href="/">Início</a>${itens.map(item => `${seta}${item.href ? `<a href="${escapar(item.href)}">${escapar(item.nome)}</a>` : `<span aria-current="page">${escapar(item.nome)}</span>`}`).join('')}</nav>`; }
function tituloPagina(titulo, descricao) {
  document.title = `${titulo} — Per Parte`;
  if (descricao) $('meta[name=description]').content = descricao;
}
function avisar(texto, link = '') {
  const mensagem = $('.mensagem-flutuante');
  mensagem.innerHTML = `${escapar(texto)}${link ? `<a href="${escapar(link)}">Ver sacola</a>` : ''}`;
  mensagem.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { mensagem.hidden = true; }, 7000);
}
function atualizarContador(carrinho) {
  const quantidade = carrinho?.totalQuantity ?? lerCarrinhoLocal().quantidade;
  $$('[data-contador]').forEach(elemento => { elemento.textContent = quantidade; elemento.hidden = !quantidade; });
  $('.sacola-nav').setAttribute('aria-label', quantidade ? `Sacola, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}` : 'Sacola');
}
function abrirDialogo(dialogo) {
  ultimoFoco = focoNavegacao();
  fecharNavegacao();
  dialogo.showModal();
  document.body.classList.add('dialogo-aberto');
}
$$('[data-buscar]').forEach(botao => botao.addEventListener('click', () => { abrirDialogo($('#busca-dialogo')); $('#busca-termo').focus(); }));
$$('[data-fechar]').forEach(botao => botao.addEventListener('click', () => botao.closest('dialog').close()));
$$('dialog:not(.nav-favoritas)').forEach(dialogo => {
  dialogo.addEventListener('close', () => { document.body.classList.remove('dialogo-aberto'); ultimoFoco?.focus({ preventScroll: true }); });
  dialogo.addEventListener('click', evento => { if (evento.target === dialogo && dialogo.id !== 'zoom-dialogo') { const limites = dialogo.getBoundingClientRect(); if (evento.clientX < limites.left || evento.clientX > limites.right || evento.clientY < limites.top || evento.clientY > limites.bottom) dialogo.close(); } });
});
document.addEventListener('keydown', evento => {
  if (evento.key === 'Escape') {
    $$('.filtro[open],.cores-cartao-menu[open]').forEach(item => { item.open = false; $('summary', item).focus(); });
  }
});
document.addEventListener('click', evento => { $$('.filtro[open],.cores-cartao-menu[open]').forEach(item => { if (!item.contains(evento.target)) item.open = false; }); });
window.addEventListener('perparte:carrinho', evento => atualizarContador(evento.detail));
window.addEventListener('storage', evento => { if (evento.key === CHAVE_CARRINHO) atualizarContador(); });
atualizarContador();

function renderizarErro(erro, titulo = 'Não foi possível abrir a loja') {
  $('#conteudo').innerHTML = `<section class="erro-pagina"><h1>${escapar(titulo)}</h1><p>${escapar(mensagemErro(erro))}</p><button class="botao" data-tentar>Tentar novamente</button><a class="link-texto" href="/">Voltar ao início</a></section>`;
  $('[data-tentar]').addEventListener('click', () => location.reload());
}

function mensagemErro(erro) {
  if (erro instanceof TypeError || erro instanceof ReferenceError || erro instanceof SyntaxError) {
    console.error('Falha ao exibir a loja:', erro.name, erro.message);
    return 'Não foi possível carregar esta parte da loja. Atualize a página para tentar novamente.';
  }
  return erro?.message || String(erro);
}

function cartaoProduto(produto) {
  const variante = varianteInicial(produto);
  const foto = imagemProduto(produto, variante);
  const imagens = imagensProduto(produto);
  const secundaria = imagens.find(imagem => imagem.url !== foto?.url);
  const preco = precoFormatado(variante?.price || produto.priceRange?.minVariantPrice);
  const cores = coresProduto(produto);
  const nomeCor = variante?.selectedOptions?.find(opcao => ehCor(opcao.name))?.value;
  const tamanho = dimensoesProduto(produto) || (produto.estudo ? 'dimensões em definição' : '');
  return `<article class="cartao-produto" data-cartao="${escapar(produto.id)}">
    <a class="foto-cartao" href="${escapar(urlProduto(produto, variante))}" aria-label="Ver ${escapar(produto.title)}">
      <img class="foto-principal" ${foto && urlSegura(foto.url) ? `src="${escapar(urlSegura(foto.url))}"` : 'hidden'} alt="${escapar(foto?.altText || produto.title)}" loading="lazy" width="600" height="600"><span class="imagem-pendente" ${foto ? 'hidden' : ''}>Imagem desta opção em preparação.</span>
      ${secundaria && urlSegura(secundaria.url) && produto.estudo ? `<img class="foto-alternativa" src="${escapar(urlSegura(secundaria.url))}" alt="" loading="lazy" width="600" height="600">` : ''}
      ${produto.estudo ? '<span class="selo-estudo">Em estudo</span>' : ''}
    </a>
    <div class="texto-cartao"><div class="titulo-cartao"><h2><a data-link-produto href="${escapar(urlProduto(produto, variante))}">${escapar(produto.title)}</a></h2>
    ${cores.length ? `<details class="cores-cartao-menu"><summary aria-label="Ver cores de ${escapar(produto.title)}" title="Ver cores"><span class="anel-cores" aria-hidden="true"></span></summary><div class="cores-cartao" role="group" aria-label="Cores de ${escapar(produto.title)}">${cores.map(cor => `<button type="button" data-cor-cartao="${escapar(cor.name)}" class="${corOpcao(cor) ? '' : 'sem-amostra'}" ${corOpcao(cor) ? `style="--cor:${escapar(corOpcao(cor))}"` : ''} aria-label="${escapar(cor.name)}" title="${escapar(cor.name)}" aria-pressed="${nomeCor === cor.name}">${corOpcao(cor) ? '' : escapar(cor.name)}</button>`).join('')}</div></details>` : ''}</div>
    <p class="metadados-cartao"><span class="preco-cartao" ${preco ? '' : 'hidden'}>${escapar(preco)}</span>${!preco && produto.estudo ? '<span>Em estudo</span>' : ''}${tamanho ? `<span class="tamanho-cartao">${preco || produto.estudo ? ', ' : ''}${escapar(tamanho)}</span>` : ''}</p></div><p class="status-cor-cartao" aria-live="polite"></p>
  </article>`;
}

function ligarCartoes(produtos) {
  controladoresCartoes.clear();
  $$('[data-cartao]').forEach(cartao => {
    const produto = produtos.find(item => item.id === cartao.dataset.cartao);
    if (!produto) return;
    let atual = varianteInicial(produto);
    let escolha = 0;
    const escolherCor = async nome => {
      const sequencia = ++escolha;
      const status = $('.status-cor-cartao', cartao);
      status.textContent = '';
      try { await completarVariantesProduto(produto); } catch (erro) { if (sequencia === escolha) status.textContent = mensagemErro(erro); return; }
      if (sequencia !== escolha) return;
      const variante = nome ? trocarCorPreservandoOpcoes(produto, atual, nome) : varianteInicial(produto);
      if (!variante) { status.textContent = `${nome} não está disponível na combinação mostrada. Veja as opções na página da obra.`; return; }
      atual = variante;
      const foto = imagemProduto(produto, variante);
      const imagem = $('.foto-principal', cartao);
      if (imagem && foto && urlSegura(foto.url)) { imagem.src = urlSegura(foto.url); imagem.alt = foto.altText || `${produto.title}, ${nome}`; }
      imagem.hidden = !foto || !urlSegura(foto.url);
      $('.imagem-pendente', cartao).hidden = !imagem.hidden;
      const alternativa = $('.foto-alternativa', cartao);
      // A prévia neutra e o reset conservam o hover editorial; uma cor ativa o oculta.
      if (alternativa) alternativa.hidden = Boolean(nome);
      $$('a', cartao).forEach(link => { link.href = urlProduto(produto, variante); });
      const nomeSelecionado = variante.selectedOptions?.find(opcao => ehCor(opcao.name))?.value;
      $$('[data-cor-cartao]', cartao).forEach(item => item.setAttribute('aria-pressed', String(item.dataset.corCartao === nomeSelecionado)));
      const preco = $('.preco-cartao', cartao);
      if (preco) preco.textContent = precoFormatado(variante.price);
      status.textContent = !produto.estudo && !variante.availableForSale ? 'Esta opção está indisponível.' : foto ? nome || '' : 'Imagem desta opção em preparação.';
    };
    controladoresCartoes.set(produto.id, escolherCor);
    $$('[data-cor-cartao]', cartao).forEach(botao => botao.addEventListener('click', () => escolherCor(botao.dataset.corCartao)));
  });
}

function lerFiltros() {
  const parametros = new URLSearchParams(location.search);
  let filtros = [];
  try { const dados = JSON.parse(parametros.get('filtros') || '[]'); if (Array.isArray(dados)) filtros = dados.filter(item => item && typeof item === 'object' && !Array.isArray(item)); } catch { /* A API informa filtros inválidos sem executar uma consulta diferente. */ }
  if (parametros.has('tipo')) filtros.push({ productType: parametros.get('tipo') });
  if (parametros.has('cor')) filtros.push({ variantOption: { name: 'Cor', value: parametros.get('cor') } });
  ['ambiente', 'criador', 'brilho', 'difusao', 'tamanho'].forEach(key => { if (parametros.has(key)) filtros.push({ productMetafield: { namespace: 'perparte', key, value: parametros.get(key) } }); });
  if (['true', 'false'].includes(parametros.get('disponivel'))) filtros.push({ available: parametros.get('disponivel') === 'true' });
  const price = {};
  if (parametros.has('precoMin') && Number.isFinite(Number(parametros.get('precoMin')))) price.min = Number(parametros.get('precoMin'));
  if (parametros.has('precoMax') && Number.isFinite(Number(parametros.get('precoMax')))) price.max = Number(parametros.get('precoMax'));
  if (Object.keys(price).length) filtros.push({ price });
  return filtros.slice(0, 20);
}
function serializarFiltro(valor) {
  try { return JSON.stringify(typeof valor === 'string' ? JSON.parse(valor) : valor); } catch { return ''; }
}
function filtroAtivo(valor, filtros = lerFiltros()) { const chave = serializarFiltro(valor); return chave && filtros.some(filtro => serializarFiltro(filtro) === chave); }
function mudarFiltros(filtros) {
  if (filtros.length > 20) { avisar('Escolha até 20 filtros por vez.'); return; }
  const url = new URL(location.href);
  ['tipo', 'cor', 'ambiente', 'criador', 'brilho', 'difusao', 'tamanho', 'precoMin', 'precoMax', 'disponivel'].forEach(chave => url.searchParams.delete(chave));
  if (filtros.length) url.searchParams.set('filtros', JSON.stringify(filtros)); else url.searchParams.delete('filtros');
  url.searchParams.delete('depois');
  history.pushState({}, '', url);
  carregarLoja();
}
function nomeFiltro(filtro) {
  const chave = normalizar(`${filtro.label || ''} ${filtro.id || ''}`);
  if (/product_type|categoria|category|tipo de produto/.test(chave)) return 'Categoria';
  if (/brilho|brightness/.test(chave)) return 'Brilho';
  if (/difusao|diffusion/.test(chave)) return 'Difusão';
  if (/tamanho|size/.test(chave)) return 'Tamanho';
  if (/filter.v.option.cor|color|colour|^cor$/.test(chave)) return 'Cor';
  if (/availability|disponib/.test(chave)) return 'Disponibilidade';
  if (/price|preco/.test(chave)) return 'Preço';
  return filtro.label || 'Filtro';
}
function filtrosEstudos() {
  return [{ id: 'filter.p.product_type', label: 'Categoria', type: 'LIST', values: [{ label: 'Luminária de mesa', count: 3, input: JSON.stringify({ productType: 'Luminária de mesa' }) }] },
    { id: 'filter.v.option.cor', label: 'Cor', type: 'LIST', values: demoProdutos.map(produto => ({ label: coresProduto(produto)[0].name, count: 1, input: JSON.stringify({ variantOption: { name: 'Cor', value: coresProduto(produto)[0].name } }) })) }];
}
function aplicarFiltrosEstudos(produtos) {
  const parametros = new URLSearchParams(location.search);
  const busca = normalizar(parametros.get('q') || '').trim();
  const filtros = lerFiltros();
  const filtrosCor = filtros.filter(filtro => filtro.variantOption && ehCor(filtro.variantOption.name));
  return produtos.filter(produto => (!busca || normalizar(`${produto.title} ${produto.description} ${produto.productType}`).includes(busca)) && (!filtrosCor.length || filtrosCor.some(filtro => variantesProduto(produto).some(variante => variante.selectedOptions.some(opcao => opcao.name === filtro.variantOption.name && opcao.value === filtro.variantOption.value)))) && filtros.filter(filtro => !filtrosCor.includes(filtro)).every(filtro => {
    if (filtro.productType) return produto.productType === filtro.productType;
    if (filtro.variantOption) return variantesProduto(produto).some(variante => variante.selectedOptions.some(opcao => opcao.name === filtro.variantOption.name && opcao.value === filtro.variantOption.value));
    return true;
  }));
}

function filtroHtml(filtro, rotulo) {
  const selecionados = lerFiltros();
  let conteudo = '<p>As opções aparecem quando os produtos tiverem essa informação.</p>';
  if (filtro?.type === 'PRICE_RANGE') {
    const atual = selecionados.find(item => item.price)?.price || {};
    conteudo = `<form data-filtro-preco><div class="faixa-preco"><label>De<input name="min" type="number" min="0" step="0.01" inputmode="decimal" value="${escapar(atual.min ?? '')}" aria-label="Preço mínimo"></label><label>Até<input name="max" type="number" min="0" step="0.01" inputmode="decimal" value="${escapar(atual.max ?? '')}" aria-label="Preço máximo"></label></div><button type="submit" class="botao botao-secundario">Aplicar</button></form>`;
  } else if (filtro?.values?.length) {
    conteudo = filtro.values.map(valor => `<label><input type="checkbox" data-filtro="${escapar(serializarFiltro(valor.input))}" ${filtroAtivo(valor.input, selecionados) ? 'checked' : ''} ${!valor.count && !filtroAtivo(valor.input, selecionados) ? 'disabled' : ''}><span>${escapar(valor.label)}</span>${Number.isInteger(valor.count) ? `<small>${valor.count}</small>` : ''}</label>`).join('');
  }
  const quantidade = filtro?.values?.filter(valor => filtroAtivo(valor.input, selecionados)).length || (filtro?.type === 'PRICE_RANGE' && selecionados.some(item => item.price) ? 1 : 0);
  return `<details class="filtro"><summary>${escapar(rotulo)}${quantidade ? ` (${quantidade})` : ''}${chevron}</summary><div class="filtro-conteudo">${conteudo}</div></details>`;
}

function corVisualAtual() {
  const parametros = new URLSearchParams(location.search);
  if (parametros.has('visualizarCor')) return parametros.get('visualizarCor');
  try { return sessionStorage.getItem('perparte.cor-catalogo.v1') || ''; } catch { return ''; }
}

function aplicarCorLoja(nome, atualizarEndereco = true) {
  try { if (nome) sessionStorage.setItem('perparte.cor-catalogo.v1', nome); else sessionStorage.removeItem('perparte.cor-catalogo.v1'); } catch { /* A seleção continua nesta página. */ }
  if (atualizarEndereco) {
    const url = new URL(location.href);
    if (nome) url.searchParams.set('visualizarCor', nome); else url.searchParams.delete('visualizarCor');
    history.replaceState({}, '', url);
  }
  controladoresCartoes.forEach(escolher => escolher(nome));
}

document.addEventListener('perparte:cor', evento => {
  if (location.pathname.replace(/\/$/, '') === '/loja' && typeof evento.detail?.nome === 'string') aplicarCorLoja(evento.detail.nome);
});

function botoesDensidade() {
  return `<div class="acoes-grade" aria-label="Densidade da grade">${[['ampla', 'Grade ampla', 2], ['normal', 'Grade média', 4], ['compacta', 'Grade compacta', 6]].map(([valor, rotulo, colunas]) => {
    const largura = (18 - (colunas - 1)) / colunas;
    const celulas = [2, 11].flatMap(y => Array.from({ length: colunas }, (_, x) => `<rect x="${x * (largura + 1)}" y="${y}" width="${largura}" height="5"/>`)).join('');
    return `<button type="button" data-densidade="${valor}" aria-label="${rotulo}" aria-pressed="${densidade === valor}"><svg viewBox="-1 0 20 18" aria-hidden="true">${celulas}</svg></button>`;
  }).join('')}</div>`;
}

function renderizarLoja() {
  const parametros = new URLSearchParams(location.search);
  const busca = parametros.get('q') || '';
  const filtros = lerFiltros();
  const estudo = modoCatalogo === 'demonstracao';
  const buscaGlobal = Boolean(busca) || (!configuracao?.catalogo?.colecao && filtros.some(filtro => filtro.variantOption || filtro.productMetafield));
  const vazia = produtosCarregados.length === 0;
  const padrao = ['Categoria', 'Brilho', 'Difusão', 'Tamanho'];
  const facetas = facetasCarregadas;
  const filtrosHtml = padrao.map(nome => filtroHtml(facetas.find(filtro => nomeFiltro(filtro) === nome), nome)).join('') + facetas.filter(filtro => !padrao.includes(nomeFiltro(filtro))).map(filtro => filtroHtml(filtro, nomeFiltro(filtro))).join('');
  const filtrosAtivosHtml = filtros.map((filtro, indice) => {
    const valor = facetas.flatMap(item => item.values || []).find(item => serializarFiltro(item.input) === serializarFiltro(filtro));
    const nome = valor?.label || filtro.variantOption?.value || filtro.productType || (filtro.price ? 'Faixa de preço' : filtro.productMetafield?.value || 'Filtro aplicado');
    return `<button class="etiqueta-filtro" type="button" data-remover-filtro="${indice}" aria-label="Remover filtro ${escapar(nome)}">${escapar(nome)}${fechar}</button>`;
  }).join('');
  const vazioHtml = `<div class="estado-vazio"><h2>${filtros.length || busca ? 'Nenhuma obra com essa combinação.' : 'Nossa próxima coleção começa aqui.'}</h2><p>${filtros.length || busca ? 'Experimente outra busca ou remova alguns filtros para encontrar a sua luz.' : 'As luminárias estarão disponíveis aqui assim que a coleção for apresentada. Enquanto isso, conheça os estudos da Per Parte.'}</p>${filtros.length || busca ? '<a class="botao botao-secundario" href="/loja">Ver toda a coleção</a>' : ''}</div>`;
  const extras = !estudo && vazia && !filtros.length && !busca ? `<section class="colecao-estudo"><h2>Coleção em estudo</h2><p class="aviso-estudo">Marco, Duna e Farol exploram as possibilidades da Per Parte. Imagens conceituais; estas composições ainda não estão à venda.</p><div class="grade-produtos">${demoProdutos.map(cartaoProduto).join('')}</div></section>` : '';
  $('#conteudo').innerHTML = `<section class="pagina-loja">${migalhas([{ nome: 'Loja' }])}
    <div class="abertura-loja"><div><h1>Todas as luminárias</h1><p>Formas que se encontram. Luz para ser sua.</p></div><span class="contador-produtos" aria-live="polite">${produtosCarregados.length}${paginacao.hasNextPage ? '+' : ''} ${produtosCarregados.length === 1 ? 'composição' : 'composições'}${estudo ? ' em estudo' : ''}</span></div>
    ${estudo ? '<p class="aviso-estudo">Coleção em estudo · imagens conceituais. Marco, Duna e Farol ainda não estão à venda.</p>' : ''}
    ${busca ? `<div class="barra-busca-loja"><span>Resultados para “${escapar(busca)}”</span><a href="/loja">Limpar busca</a></div>` : ''}
    <nav class="categorias-loja" aria-label="Categorias de luminárias">${[{nome:'Todas',tipo:''}, ...categoriasLuminarias].map(categoria => `<button type="button" data-categoria="${escapar(categoria.tipo)}" aria-pressed="${categoria.tipo ? filtros.some(filtro => filtro.productType === categoria.tipo) : !filtros.some(filtro => filtro.productType)}">${escapar(categoria.nome)}</button>`).join('')}</nav>
    <div class="barra-filtros">${filtrosHtml}${botoesDensidade()}<div class="ordenar"><label for="ordem-loja">Ordenar por</label><select id="ordem-loja" aria-label="Ordenar luminárias">${[['destaques','Destaques'],['novidades','Novidades'],['preco-menor','Menor preço'],['preco-maior','Maior preço'],['nome','Nome'],['mais-vendidos','Mais vendidos']].filter(([valor]) => !estudo || ['destaques', 'nome'].includes(valor)).map(([valor, texto]) => `<option value="${valor}" ${parametros.get('ordem') === valor ? 'selected' : ''}>${texto}</option>`).join('')}</select></div></div>
    ${filtros.length ? `<div class="filtros-ativos">${filtrosAtivosHtml}<button type="button" class="limpar-filtros" data-limpar-filtros>Limpar filtros</button></div>` : ''}
    <div class="mensagem-erro" role="alert" id="erro-loja"></div>
    ${vazia ? vazioHtml : `<div class="grade-produtos" data-grade-loja data-densidade="${densidade}">${produtosCarregados.map(cartaoProduto).join('')}</div>`}
    ${paginacao.hasNextPage ? '<div class="carregar-mais"><button type="button" class="botao botao-secundario" data-carregar-mais>Ver mais luminárias</button></div>' : ''}${extras}
  </section>`;
  ligarCartoes([...produtosCarregados, ...demoProdutos]);
  const coresPaleta = [...new Map([...produtosCarregados, ...(estudo ? demoProdutos : [])].flatMap(coresProduto).filter(cor => corOpcao(cor)).map(cor => [cor.name, corOpcao(cor)])).entries()];
  aplicarCorLoja(corVisualAtual(), false);
  montarPaleta(coresPaleta, { seletorRegioes: '.pagina-loja' });
  $$('[data-categoria]').forEach(botao => botao.addEventListener('click', () => mudarFiltros([...filtros.filter(filtro => !filtro.productType), ...(botao.dataset.categoria ? [{productType:botao.dataset.categoria}] : [])])));
  $$('[data-filtro]').forEach(input => input.addEventListener('change', () => {
    const filtro = JSON.parse(input.dataset.filtro);
    mudarFiltros(input.checked ? [...filtros, filtro] : filtros.filter(item => serializarFiltro(item) !== serializarFiltro(filtro)));
  }));
  $$('[data-remover-filtro]').forEach(botao => botao.addEventListener('click', () => mudarFiltros(filtros.filter((_, indice) => indice !== Number(botao.dataset.removerFiltro)))));
  $('[data-limpar-filtros]')?.addEventListener('click', () => mudarFiltros([]));
  $('[data-filtro-preco]')?.addEventListener('submit', evento => {
    evento.preventDefault();
    const dados = new FormData(evento.target);
    const price = {};
    if (dados.get('min') !== '') price.min = Number(dados.get('min'));
    if (dados.get('max') !== '') price.max = Number(dados.get('max'));
    if (price.min !== undefined && price.max !== undefined && price.min > price.max) { avisar('O valor mínimo precisa ser menor que o máximo.'); return; }
    mudarFiltros([...filtros.filter(filtro => !filtro.price), ...(Object.keys(price).length ? [{ price }] : [])]);
  });
  $('#ordem-loja').addEventListener('change', evento => { const url = new URL(location.href); url.searchParams.set('ordem', evento.target.value); history.pushState({}, '', url); carregarLoja(); });
  if (buscaGlobal && !estudo) {
    $$('option', $('#ordem-loja')).forEach(opcao => { if (!['destaques', 'preco-menor', 'preco-maior'].includes(opcao.value)) opcao.remove(); });
    if (!$('#ordem-loja').value) $('#ordem-loja').value = 'destaques';
  }
  $$('button[data-densidade]').forEach(botao => botao.addEventListener('click', () => { densidade = botao.dataset.densidade; $('[data-grade-loja]')?.setAttribute('data-densidade', densidade); $$('button[data-densidade]').forEach(item => item.setAttribute('aria-pressed', String(item === botao))); }));
  $('[data-carregar-mais]')?.addEventListener('click', () => carregarLoja(true));
}

async function carregarLoja(maisItens = false) {
  const identificador = ++requisicaoLoja;
  const focoOrigem = document.activeElement;
  const indiceFiltro = $$('.filtro').indexOf(focoOrigem?.closest('.filtro'));
  const valorFoco = focoOrigem?.dataset?.filtro;
  const quantidadeAnterior = produtosCarregados.length;
  const botao = $('[data-carregar-mais]');
  if (botao) { botao.disabled = true; botao.textContent = 'Carregando…'; }
  $('#conteudo').setAttribute('aria-busy', 'true');
  try {
    const origem = new URLSearchParams(location.search);
    const parametros = new URLSearchParams();
    ['ordem', 'q', 'filtros', 'tipo', 'cor', 'ambiente', 'criador', 'brilho', 'difusao', 'tamanho', 'precoMin', 'precoMax', 'disponivel'].forEach(chave => { if (origem.has(chave)) parametros.set(chave, origem.get(chave)); });
    parametros.set('limite', '24');
    const buscaGlobal = Boolean(parametros.get('q')) || (!configuracao?.catalogo?.colecao && (lerFiltros().some(filtro => filtro.variantOption || filtro.productMetafield) || ['cor', 'ambiente', 'criador', 'brilho', 'difusao', 'tamanho'].some(chave => parametros.has(chave))));
    if (buscaGlobal && !['destaques', 'preco-menor', 'preco-maior'].includes(parametros.get('ordem') || 'destaques')) parametros.set('ordem', 'destaques');
    if (maisItens && paginacao.endCursor) parametros.set('depois', paginacao.endCursor); else parametros.delete('depois');
    const resposta = await apiLoja(`/api/produtos?${parametros}`);
    if (identificador !== requisicaoLoja) return;
    let produtos = nos(resposta.produtos);
    let mostrarEstudos = resposta.modo === 'demonstracao';
    if (resposta.modo === 'shopify' && !produtos.length && !maisItens) {
      // Confirmar o catálogo inteiro antes de usar a prévia: um filtro sem
      // resultados não pode substituir produtos comerciais por estudos.
      const consultaRestrita = Boolean(parametros.get('q')?.trim()) || lerFiltros().length > 0;
      const catalogo = consultaRestrita ? await apiLoja('/api/produtos?limite=1') : resposta;
      if (identificador !== requisicaoLoja) return;
      mostrarEstudos = catalogo.modo === 'shopify' && !nos(catalogo.produtos).length && !catalogo.produtos?.pageInfo?.hasNextPage;
    }
    modoCatalogo = mostrarEstudos ? 'demonstracao' : resposta.modo;
    if (modoCatalogo === 'demonstracao') {
      produtos = aplicarFiltrosEstudos(demoProdutos);
      if (parametros.get('ordem') === 'nome') produtos.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    }
    produtosCarregados = maisItens ? [...new Map([...produtosCarregados, ...produtos].map(produto => [produto.id, produto])).values()] : produtos;
    facetasCarregadas = modoCatalogo === 'demonstracao' ? filtrosEstudos() : resposta.produtos?.filters || [];
    paginacao = modoCatalogo === 'demonstracao' ? {} : resposta.produtos?.pageInfo || {};
    tituloPagina('Loja', 'Explore as luminárias Per Parte. Escolha cores e encontre a sua composição.');
    const restaurarFoco = document.activeElement === focoOrigem;
    renderizarLoja();
    if (restaurarFoco) {
      if (indiceFiltro >= 0) {
        const filtro = $$('.filtro')[indiceFiltro];
        if (filtro) {
          filtro.open = true;
          const destino = valorFoco ? $$('[data-filtro]', filtro).find(item => item.dataset.filtro === valorFoco) : null;
          (destino || $('summary', filtro)).focus({ preventScroll: true });
        }
      } else if (focoOrigem?.id === 'ordem-loja') $('#ordem-loja').focus({ preventScroll: true });
      else if (maisItens) ($$('[data-grade-loja] .foto-cartao')[quantidadeAnterior] || $('[data-carregar-mais]'))?.focus({ preventScroll: true });
    }
  } catch (erro) {
    if ($('#erro-loja')) $('#erro-loja').textContent = mensagemErro(erro);
    else renderizarErro(erro);
    if (botao) { botao.disabled = false; botao.textContent = 'Tentar novamente'; }
  } finally { if (identificador === requisicaoLoja) $('#conteudo').removeAttribute('aria-busy'); }
}

function informacoesProduto(produto) {
  const editorial = informacoesEditoriaisProduto(produto);
  const especificacoes = [...editorial.especificacoes];
  const dimensoes = dimensoesProduto(produto);
  if (produto.estudo && !especificacoes.length) especificacoes.push({ id: 'composicao', titulo: 'Composição', texto: 'Estudo visual da Per Parte. Desenho, cores e materiais dependem de validação antes de virar produto.' });
  if ((dimensoes || produto.estudo) && !especificacoes.some(item => /dimens|tamanho/.test(normalizar(item.id + ' ' + item.titulo)))) especificacoes.unshift({ id: 'dimensoes', titulo: 'Dimensões', texto: dimensoes || 'Dimensões em definição.' });
  if (!especificacoes.length && !editorial.escala) return '';
  const escala = editorial.escala;
  const imagem = escala?.imagem;
  const endereco = urlSegura(imagem?.url);
  return `<section class="especificacoes-produto" id="especificacoes" aria-labelledby="titulo-especificacoes"><div class="conteudo-especificacoes"><h2 id="titulo-especificacoes">Especificações</h2>${especificacoes.length ? `<div class="tabs-especificacoes" role="tablist" aria-orientation="vertical" aria-label="Informações da composição">${especificacoes.map((item, indice) => `<button type="button" role="tab" id="especificacao-tab-${indice}" aria-controls="especificacao-painel-${indice}" aria-selected="${indice === 0}" tabindex="${indice === 0 ? '0' : '-1'}" data-especificacao="${indice}">${escapar(item.titulo)}</button>`).join('')}</div>` : ''}</div><div class="visual-especificacoes">${especificacoes.map((item, indice) => `<div class="painel-especificacao" id="especificacao-painel-${indice}" role="tabpanel" aria-labelledby="especificacao-tab-${indice}" tabindex="0" ${indice ? 'hidden' : ''}><p>${escapar(item.texto)}</p></div>`).join('')}${endereco ? `<figure class="escala-produto" id="tamanho"><img src="${escapar(endereco)}" alt="${escapar(imagem.altText || produto.title)}" loading="lazy" width="${Number(imagem.width) || 1000}" height="${Number(imagem.height) || 1000}">${escala.legenda ? `<figcaption>${escapar(escala.legenda)}</figcaption>` : ''}</figure>` : dimensoes ? `<div class="medidas-produto" id="tamanho"><span class="rotulo-editorial">Tamanho</span><p>${escapar(dimensoes)}</p></div>` : ''}</div></section>`;
}

function historiaProduto(produto) {
  const editorial = informacoesEditoriaisProduto(produto);
  const paragrafos = editorial.paragrafos.filter(Boolean);
  const historia = paragrafos.length ? `<section class="historia-produto" id="historia" aria-labelledby="titulo-historia"><div class="introducao-historia"><span class="rotulo-editorial">${escapar([editorial.ano, editorial.rotulo].filter(Boolean).join(' · '))}</span><h2 id="titulo-historia">${escapar(editorial.titulo || produto.title)}</h2></div><div class="texto-historia">${paragrafos.map(texto => `<p>${escapar(texto)}</p>`).join('')}${editorial.credito ? `<p class="credito-historia">${escapar(editorial.credito)}</p>` : ''}</div></section>` : '';
  const secoes = [['design', editorial.design], ['materiais', editorial.materiais], ['detalhes', editorial.detalhes]].filter(([, secao]) => secao?.texto);
  return historia + secoes.map(([id, secao]) => {
    const imagem = secao.imagem;
    const endereco = urlSegura(imagem?.url);
    return `<section class="secao-editorial-produto ${endereco ? 'com-imagem' : ''}" id="${id}" aria-labelledby="titulo-${id}">${endereco ? `<figure><img src="${escapar(endereco)}" alt="${escapar(imagem.altText || produto.title)}" loading="lazy" width="${Number(imagem.width) || 1000}" height="${Number(imagem.height) || 1000}"></figure>` : ''}<div><span class="rotulo-editorial">${escapar({ design: 'Design', materiais: 'Materiais', detalhes: 'Detalhes' }[id])}</span><h2 id="titulo-${id}">${escapar(secao.titulo || { design: 'Design', materiais: 'Materiais', detalhes: 'Detalhes' }[id])}</h2><p>${escapar(secao.texto)}</p></div></section>`;
  }).join('');
}

function barraProduto(produto) {
  const secoes = [['visao-geral', 'Visão geral'], ['design', 'Design'], ['materiais', 'Materiais'], ['detalhes', 'Detalhes'], ['tamanho', 'Tamanho']].filter(([id]) => document.getElementById(id));
  if (!document.getElementById('detalhes') && document.getElementById('especificacoes')) secoes.splice(secoes.findIndex(([id]) => id === 'tamanho') < 0 ? secoes.length : secoes.findIndex(([id]) => id === 'tamanho'), 0, ['especificacoes', 'Detalhes']);
  return `<div class="barra-produto" hidden><strong class="nome-barra-produto">${escapar(produto.title)}</strong><nav aria-label="Seções da composição">${secoes.map(([id, nome]) => `<a href="#${id}" data-ancora-produto="${id}">${nome}</a>`).join('')}</nav><div class="compra-barra-produto"><span data-preco-produto hidden></span><button type="button" class="botao botao-brasa" data-adicionar-produto>Adicionar à sacola</button></div></div>`;
}

function ligarEditorialProduto() {
  const tabs = $$('[data-especificacao]');
  function selecionarAba(botao, focar = false) {
    tabs.forEach(item => { const ativo = item === botao; item.setAttribute('aria-selected', String(ativo)); item.tabIndex = ativo ? 0 : -1; document.getElementById(item.getAttribute('aria-controls')).hidden = !ativo; });
    if (focar) botao.focus({ preventScroll: true });
  }
  tabs.forEach((botao, indice) => {
    botao.addEventListener('click', () => selecionarAba(botao));
    botao.addEventListener('keydown', evento => {
      const destino = ['ArrowDown', 'ArrowRight'].includes(evento.key) ? (indice + 1) % tabs.length : ['ArrowUp', 'ArrowLeft'].includes(evento.key) ? (indice - 1 + tabs.length) % tabs.length : evento.key === 'Home' ? 0 : evento.key === 'End' ? tabs.length - 1 : -1;
      if (destino >= 0) { evento.preventDefault(); selecionarAba(tabs[destino], true); }
    });
  });
  const barra = $('.barra-produto');
  const galeria = $('.pagina-produto');
  const ancoras = $$('[data-ancora-produto]', barra);
  let quadroPendente = false;
  function atualizarPosicao() {
    quadroPendente = false;
    const fimConteudo = galeria.getBoundingClientRect().bottom - parseFloat(getComputedStyle(galeria).paddingBottom);
    barra.hidden = fimConteudo > 88;
    let atual = ancoras[0];
    for (const ancora of ancoras) if (document.getElementById(ancora.dataset.ancoraProduto).getBoundingClientRect().top <= innerHeight * .4) atual = ancora;
    ancoras.forEach(ancora => { if (ancora === atual) ancora.setAttribute('aria-current', 'location'); else ancora.removeAttribute('aria-current'); });
  }
  const agendarPosicao = () => { if (!quadroPendente) { quadroPendente = true; requestAnimationFrame(atualizarPosicao); } };
  addEventListener('scroll', agendarPosicao, { passive: true });
  addEventListener('resize', agendarPosicao, { passive: true });
  ancoras.forEach(ancora => ancora.addEventListener('click', evento => {
    evento.preventDefault();
    const destino = document.getElementById(ancora.dataset.ancoraProduto);
    destino.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    history.replaceState({}, '', location.pathname + location.search + ancora.getAttribute('href'));
    destino.tabIndex = -1;
    destino.focus({ preventScroll: true });
  }));
  atualizarPosicao();
}
function atualizarGaleria(variante) {
  const foto = variante ? imagemProduto(produtoAtual, variante) : null;
  const imagemValida = Boolean(foto && urlSegura(foto.url));
  const botao = $('[data-foto-principal]');
  if (!botao) return;
  const imagem = $('img', botao);
  imagem.hidden = !imagemValida;
  $('.imagem-pendente', botao).hidden = imagemValida;
  $('.ampliar-foto', botao).hidden = !imagemValida;
  botao.disabled = !imagemValida;
  if (imagemValida) { imagem.src = urlSegura(foto.url); imagem.alt = foto.altText || `${produtoAtual.title}, ${variante?.title || ''}`; botao.dataset.zoom = urlSegura(foto.url); }
  else delete botao.dataset.zoom;
  const miniatura = $('[data-miniatura="0"] img');
  if (miniatura) { miniatura.hidden = !imagemValida; if (imagemValida) miniatura.src = urlSegura(foto.url); }
  if ($('[data-miniatura="0"]')) $('[data-miniatura="0"]').disabled = !imagemValida;
  $$('[data-miniatura]').forEach((item, indice) => item.setAttribute('aria-pressed', String(indice === 0)));
}

function opcoesHtml() {
  const favoritos = new Set(informacoesEditoriaisProduto(produtoAtual).coresCuradas.map(normalizar));
  return opcoesProduto(produtoAtual).map(opcao => {
    const cor = ehCor(opcao.name);
    return `<fieldset class="opcao-produto ${cor ? 'opcao-produto-cor' : ''}"><legend>${escapar(opcao.name)}${!cor ? `<span>${escapar(selecaoAtual[opcao.name] || 'Escolha uma opção')}</span>` : ''}</legend>${cor ? `<div class="cabecalho-cores"><div class="tabs-cores" role="group" aria-label="Seleção de cores"><button type="button" data-tab-cor="todas" aria-pressed="${!corCriador}">Todas as cores</button><button type="button" data-tab-cor="criador" aria-pressed="${corCriador}" ${!favoritos.size ? 'disabled title="Seleção do criador ainda não informada"' : ''}>Seleção do criador</button></div><span class="nome-cor-produto">${escapar(selecaoAtual[opcao.name] || 'Escolha uma cor')}</span></div>` : ''}<div class="${cor ? 'seletor-cores' : 'seletor-texto'}" ${cor ? `data-curadoria="${corCriador}"` : ''} role="group" aria-label="${escapar(opcao.name)}">${opcao.optionValues.map(valor => {
      const combinacao = { ...selecaoAtual, [opcao.name]: valor.name };
      const variante = resolverVariante(produtoAtual, combinacao);
      const existe = Boolean(variante);
      const indisponivel = !produtoAtual.estudo && (!variante || !variante.availableForSale);
      const curada = favoritos.has(normalizar(valor.name));
      const amostra = cor ? corOpcao(valor) : '';
      const amostraImagem = cor ? urlSegura(valor.swatch?.image?.previewImage?.url) : '';
      const conteudo = amostraImagem ? `<img src="${escapar(amostraImagem)}" alt="" loading="lazy">` : cor && amostra ? '' : escapar(valor.name);
      return `<button type="button" data-opcao="${escapar(opcao.name)}" data-valor="${escapar(valor.name)}" ${cor ? `data-curada="${curada}"` : ''} class="${indisponivel ? 'esgotada ' : ''}${cor && !amostra && !amostraImagem ? 'sem-amostra' : ''}" aria-label="${escapar(valor.name)}${!existe ? ', combinação indisponível' : indisponivel ? ', indisponível' : ''}" title="${escapar(valor.name)}" aria-pressed="${selecaoAtual[opcao.name] === valor.name}" ${cor && corCriador && !curada ? 'disabled' : ''} ${amostra ? `style="--cor:${escapar(amostra)}"` : ''}>${cor ? `<span class="amostra-opcao">${conteudo}</span>` : conteudo}</button>`;
    }).join('')}</div>${cor && produtoAtual.estudo ? '<p class="nota-variante">Cor representada no estudo. Novas cores serão apresentadas com a coleção.</p>' : ''}</fieldset>`;
  }).join('');
}

function aplicarCuradoriaProduto() {
  $$('.seletor-cores', $('#opcoes-produto')).forEach(grade => {
    grade.dataset.curadoria = String(corCriador);
    $$('[data-curada]', grade).forEach(botao => { botao.disabled = corCriador && botao.dataset.curada !== 'true'; });
  });
  $$('[data-tab-cor]').forEach(botao => botao.setAttribute('aria-pressed', String((botao.dataset.tabCor === 'criador') === corCriador)));
}

function rgbComputado(cor) {
  const amostra = document.createElement('span');
  amostra.style.color = cor;
  amostra.hidden = true;
  document.body.append(amostra);
  const componentes = getComputedStyle(amostra).color.match(/[\d.]+/g)?.map(Number) || [];
  amostra.remove();
  if (componentes.length < 3) return null;
  return { r: componentes[0], g: componentes[1], b: componentes[2], a: componentes[3] ?? 1 };
}

function luminancia({ r, g, b }) {
  return [r, g, b].map(valor => {
    const canal = valor / 255;
    return canal <= .04045 ? canal / 12.92 : ((canal + .055) / 1.055) ** 2.4;
  }).reduce((total, canal, indice) => total + canal * [0.2126, 0.7152, 0.0722][indice], 0);
}

function contraste(fundo, texto) {
  const [claro, escuro] = [luminancia(fundo), luminancia(texto)].sort((a, b) => b - a);
  return (claro + .05) / (escuro + .05);
}

function corSobreFundo(cor, fundo) {
  return {
    r: cor.r * cor.a + fundo.r * (1 - cor.a),
    g: cor.g * cor.a + fundo.g * (1 - cor.a),
    b: cor.b * cor.a + fundo.b * (1 - cor.a),
  };
}

function corDaVarianteAtual() {
  const nome = varianteAtual?.selectedOptions?.find(opcao => ehCor(opcao.name))?.value;
  const opcao = coresProduto(produtoAtual).find(valor => normalizar(valor.name) === normalizar(nome));
  return opcao ? corOpcao(opcao) : '';
}

function restaurarRodapePadrao() {
  const rodape = $('.rodape');
  if (!rodape) return;
  rodape.style.removeProperty('--rodape-fundo');
  rodape.style.removeProperty('--rodape-texto');
  delete rodape.dataset.corVariante;
}

function atualizarRodapeProduto() {
  const rodape = $('.rodape');
  if (!rodape) return;
  const cor = corDaVarianteAtual();
  if (!cor) {
    restaurarRodapePadrao();
    return;
  }
  const fundo = rgbComputado(cor);
  const tinta = rgbComputado('#1E1E1E');
  const luzAcesa = rgbComputado('var(--pp-cor-luz-acesa)');
  const papel = rgbComputado('var(--papel)');
  if (!fundo || !tinta || !luzAcesa || !papel) return;
  const fundoVisivel = corSobreFundo(fundo, papel);
  const texto = contraste(fundoVisivel, tinta) >= contraste(fundoVisivel, luzAcesa) ? '#1E1E1E' : 'var(--pp-cor-luz-acesa)';
  rodape.style.setProperty('--rodape-fundo', cor);
  rodape.style.setProperty('--rodape-texto', texto);
  rodape.dataset.corVariante = varianteAtual?.selectedOptions?.find(opcao => ehCor(opcao.name))?.value || '';
}

function atualizarPainelProduto(atualizarUrl = false) {
  varianteAtual = resolverVariante(produtoAtual, selecaoAtual);
  $('#opcoes-produto').innerHTML = opcoesHtml();
  const preco = precoFormatado(varianteAtual?.price);
  const anterior = varianteAtual?.compareAtPrice && Number(varianteAtual.compareAtPrice.amount) > Number(varianteAtual.price?.amount) ? precoFormatado(varianteAtual.compareAtPrice) : '';
  $('#preco-produto').innerHTML = preco ? `${anterior ? `<del>${escapar(anterior)}</del>` : ''}${escapar(preco)}` : '';
  $('#preco-produto').hidden = !preco;
  const podeComprar = !produtoAtual.estudo && Boolean(varianteAtual?.availableForSale) && configuracao?.carrinho?.disponivel;
  const textoCompra = ocupada ? 'Adicionando…' : produtoAtual.estudo ? 'Composição em estudo' : !varianteAtual ? 'Combinação indisponível' : !varianteAtual.availableForSale ? 'Indisponível' : !configuracao?.carrinho?.disponivel ? 'Compra ainda não disponível' : 'Adicionar à sacola';
  $$('[data-adicionar-produto]').forEach(botao => { botao.disabled = !podeComprar || ocupada; botao.textContent = textoCompra; });
  $$('[data-preco-produto]').forEach(elemento => { elemento.textContent = preco; elemento.hidden = !preco; });
  $('#status-produto').textContent = produtoAtual.estudo ? 'Conheça a composição e suas imagens. Esta obra ainda não está à venda.' : !varianteAtual ? 'Escolha outra combinação de opções para esta luminária.' : !varianteAtual.availableForSale ? 'Esta variante não está disponível para compra no momento.' : '';
  $$('[data-opcao]').forEach(botaoOpcao => botaoOpcao.addEventListener('click', () => {
    const { opcao, valor } = botaoOpcao.dataset;
    selecaoAtual[opcao] = valor;
    if (ehCor(opcao)) {
      try { sessionStorage.setItem('perparte.cor-catalogo.v1', valor); } catch { /* A seleção continua nesta página. */ }
      window.dispatchEvent(new CustomEvent('perparte:cor', { detail: { nome: valor } }));
    }
    atualizarPainelProduto(true);
    $$('[data-opcao]').find(item => item.dataset.opcao === opcao && item.dataset.valor === valor)?.focus({ preventScroll: true });
  }));
  $$('.seletor-cores').forEach(grade => $$('button', grade).forEach((botaoCor, indice, botoes) => botaoCor.addEventListener('keydown', evento => {
    const passo = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[evento.key];
    if (passo !== undefined) {
      evento.preventDefault();
      let destino = indice + passo;
      while (destino >= 0 && destino < botoes.length && botoes[destino].disabled) destino += Math.sign(passo);
      if (botoes[destino] && !botoes[destino].disabled) botoes[destino].focus();
    }
    if (evento.key === 'Home' || evento.key === 'End') { evento.preventDefault(); const ativos = botoes.filter(botao => !botao.disabled); (evento.key === 'Home' ? ativos[0] : ativos.at(-1))?.focus(); }
  })));
  $$('[data-tab-cor]').forEach(botaoTab => botaoTab.addEventListener('click', () => { corCriador = botaoTab.dataset.tabCor === 'criador'; aplicarCuradoriaProduto(); }));
  atualizarGaleria(varianteAtual);
  atualizarRodapeProduto();
  if (atualizarUrl) {
    const destino = (varianteAtual ? urlProduto(produtoAtual, varianteAtual) : urlProduto(produtoAtual)) + location.hash;
    history.replaceState({}, '', destino);
  }
}

function renderizarProduto(produto) {
  produtoAtual = produto;
  corCriador = false;
  varianteAtual = varianteInicial(produto, new URLSearchParams(location.search));
  const parametros = new URLSearchParams(location.search);
  if (!parametros.has('variant') && !parametros.has('sku')) {
    try {
      const lembrada = sessionStorage.getItem('perparte.cor-catalogo.v1');
      const correspondente = lembrada ? trocarCorPreservandoOpcoes(produto, varianteAtual, lembrada) : null;
      if (correspondente) varianteAtual = correspondente;
    } catch { /* A variante inicial continua disponível sem armazenamento. */ }
  }
  selecaoAtual = Object.fromEntries((varianteAtual?.selectedOptions || []).map(opcao => [opcao.name, opcao.value]));
  const principal = imagemProduto(produto, varianteAtual);
  const imagens = [principal || { url: '', altText: '' }, ...imagensProduto(produto).filter(imagem => imagem.url !== principal?.url)];
  const autoria = metacampo(produto, 'criador') || metacampo(produto, 'autoria') || produto.vendor || 'Per Parte';
  const dimensoes = dimensoesProduto(produto);
  tituloPagina(produto.title, produto.description?.slice(0, 155) || `${produto.title}, uma composição Per Parte.`);
  $('#conteudo').innerHTML = `<article class="produto-completo"><section class="pagina-produto" id="visao-geral" aria-label="Visão geral da composição"><div class="galeria-produto"><div class="miniaturas" role="group" aria-label="Imagens de ${escapar(produto.title)}">${imagens.map((imagem, indice) => `<button type="button" data-miniatura="${indice}" aria-label="Ver imagem ${indice + 1} de ${escapar(produto.title)}" aria-pressed="${indice === 0}"><img ${urlSegura(imagem.url) ? `src="${escapar(urlSegura(imagem.url))}"` : 'hidden'} alt="" loading="${indice ? 'lazy' : 'eager'}" width="44" height="44"></button>`).join('')}</div><div class="fotos-produto">${imagens.map((imagem, indice) => `<button type="button" class="foto-produto" data-foto="${indice}" ${indice === 0 ? 'data-foto-principal' : ''} data-zoom="${escapar(urlSegura(imagem.url))}" aria-label="Ampliar imagem ${indice + 1} de ${escapar(produto.title)}"><img ${urlSegura(imagem.url) ? `src="${escapar(urlSegura(imagem.url))}"` : 'hidden'} alt="${escapar(imagem.altText || produto.title)}" loading="${indice ? 'lazy' : 'eager'}" ${indice === 0 ? 'fetchpriority="high"' : ''} width="1000" height="1000"><span class="imagem-pendente" hidden>Imagem desta opção em preparação.</span><span class="ampliar-foto" aria-hidden="true">${mais}</span></button>`).join('')}</div></div>
    <div class="painel-produto">${migalhas([{ nome: 'Loja', href: '/loja' }, { nome: produto.title }])}<h1>${escapar(produto.title)}</h1><p class="autoria-produto">${escapar(autoria)}</p><p class="descricao-produto">${escapar(produto.description || '')}</p><p class="dimensoes-resumo-produto">${escapar(dimensoes || 'Dimensões em definição')}</p><div id="opcoes-produto"></div><div class="preco-produto" id="preco-produto"></div><button type="button" class="botao comprar-produto" id="adicionar-produto" data-adicionar-produto>Adicionar à sacola</button><p class="status-produto" id="status-produto" aria-live="polite"></p><p class="mensagem-erro" id="erro-produto" role="alert"></p>${produto.estudo ? '<div class="nota-estudo-produto"><strong>Coleção em estudo</strong>Imagens conceituais. A apresentação explora forma e cor; não representa produto fabricado, estoque ou especificações finais.</div>' : ''}</div>
  </section>${historiaProduto(produto)}${informacoesProduto(produto)}</article>${produto.estudo ? `<section class="mais-obras"><h2>Outras formas de ser sua.</h2><div class="grade-produtos">${demoProdutos.filter(item => item.handle !== produto.handle).map(cartaoProduto).join('')}</div></section>` : ''}`;
  $('.produto-completo').insertAdjacentHTML('beforeend', barraProduto(produto));
  atualizarPainelProduto();
  $$('[data-adicionar-produto]').forEach(botao => botao.addEventListener('click', adicionarProduto));
  ligarEditorialProduto();
  $$('[data-miniatura]').forEach(botao => botao.addEventListener('click', () => {
    const indice = Number(botao.dataset.miniatura);
    if (matchMedia('(max-width:800px)').matches) {
      const imagem = indice === 0 ? imagemProduto(produto, varianteAtual) : imagens[indice];
      if (!imagem || !urlSegura(imagem.url)) return;
      const principalElemento = $('[data-foto-principal]');
      $('img', principalElemento).src = urlSegura(imagem.url);
      $('img', principalElemento).alt = imagem.altText || produto.title;
      $('img', principalElemento).hidden = false;
      $('.imagem-pendente', principalElemento).hidden = true;
      $('.ampliar-foto', principalElemento).hidden = false;
      principalElemento.disabled = false;
      principalElemento.dataset.zoom = urlSegura(imagem.url);
    } else $('[data-foto="' + indice + '"]')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    $$('[data-miniatura]').forEach(item => item.setAttribute('aria-pressed', String(item === botao)));
  }));
  $$('[data-foto]').forEach(botao => botao.addEventListener('click', () => {
    if (!botao.dataset.zoom) return;
    $('#zoom-imagem').src = botao.dataset.zoom;
    $('#zoom-imagem').alt = $('img', botao).alt;
    abrirDialogo($('#zoom-dialogo'));
  }));
  ligarCartoes(demoProdutos);
}

async function carregarProduto(handle) {
  try {
    const resposta = await apiLoja(`/api/produtos/${encodeURIComponent(handle)}`);
    const produto = resposta.produto || demoProdutos.find(item => item.handle === handle);
    if (!produto) { renderizarErro('Esta luminária não foi encontrada no catálogo.', 'Ainda não encontramos esta obra'); return; }
    if (resposta.modo === 'shopify' && !produto.estudo) await completarVariantesProduto(produto);
    // O servidor em demonstração pode retornar fixtures; o estudo editorial local é explícito e nunca comercial.
    renderizarProduto(resposta.modo === 'demonstracao' ? demoProdutos.find(item => item.handle === handle) || { ...produto, estudo: true } : produto);
  } catch (erro) {
    const estudo = erro.produtoAusente ? demoProdutos.find(item => item.handle === handle) : null;
    if (estudo) renderizarProduto(estudo);
    else renderizarErro(erro, 'Não foi possível abrir esta luminária');
  }
}

async function adicionarProduto() {
  if (ocupada || produtoAtual.estudo || !varianteAtual?.availableForSale || !configuracao?.carrinho?.disponivel) return;
  const salvo = lerCarrinhoLocal();
  if (!salvo.valido) { $('#erro-produto').innerHTML = 'O carrinho salvo não pôde ser lido. <a class="link-texto" href="/carrinho">Abra a sacola para recuperá-lo.</a>'; avisar('O carrinho salvo não pôde ser lido. Abra a sacola para recuperá-lo.', '/carrinho'); return; }
  ocupada = true;
  $$('[data-adicionar-produto]').forEach(botao => { botao.disabled = true; botao.textContent = 'Adicionando…'; });
  $('#erro-produto').textContent = '';
  try {
    const linhas = [{ merchandiseId: varianteAtual.id, quantity: 1 }];
    const resposta = await apiLoja(salvo.id ? '/api/carrinho/itens' : '/api/carrinho', { method: 'POST', body: JSON.stringify(salvo.id ? { carrinhoId: salvo.id, linhas } : { linhas }) });
    if (!resposta.carrinho?.id) throw new Error('A Shopify não retornou uma sacola. Tente novamente.');
    const guardou = guardarCarrinho(resposta.carrinho);
    if (!guardou) throw new Error('A sacola foi criada, mas o navegador não permitiu salvá-la. Habilite o armazenamento local antes de continuar.');
    atualizarContador(resposta.carrinho);
    avisar(`${produtoAtual.title} adicionada à sacola.`, '/carrinho');
    const aviso = mensagemAvisos(resposta.avisos);
    if (aviso) { $('#erro-produto').textContent = aviso; avisar(aviso, '/carrinho'); }
  } catch (erro) { if (erro.carrinho) guardarCarrinho(erro.carrinho); const mensagem = mensagemErro(erro); $('#erro-produto').textContent = mensagem; avisar(mensagem); }
  finally { ocupada = false; atualizarPainelProduto(); }
}

function renderizarConta() {
  tituloPagina('Minha conta');
  const url = urlSegura(configuracao?.conta?.url, { externa: true });
  const disponivel = configuracao?.conta?.disponivel && url;
  $('#conteudo').innerHTML = `<section class="pagina-conta">${migalhas([{ nome: 'Minha conta' }])}<div class="conta-painel"><span class="icone" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="3"/><path d="m5 21 7-9 7 9Z"/></svg></span><h1>Seu lugar na Per Parte.</h1><p>Acompanhe seus pedidos e mantenha seus dados em um só lugar.</p>${disponivel ? `<a class="botao botao-brasa" href="${escapar(url)}">Entrar ou criar conta</a><p class="conta-explicacao">Use seu e-mail para receber um código de acesso. Se for sua primeira visita, sua conta será criada ao entrar.</p>` : '<p>O acesso às contas estará disponível em breve.</p><a class="botao botao-secundario" href="/loja">Explorar luminárias</a>'}<p class="conta-explicacao">Suas criações no ateliê continuam salvas neste navegador. Elas ainda não estão vinculadas à conta da loja.</p></div></section>`;
}

function carrinhoVazio(mensagem = 'As suas escolhas vão aparecer aqui.') {
  return `<section class="pagina-carrinho">${migalhas([{ nome: 'Sacola' }])}<h1>Sua sacola</h1><div class="estado-vazio"><h2>Um espaço para a sua próxima luz.</h2><p>${escapar(mensagem)}</p><a class="botao botao-brasa" href="/loja">Explorar luminárias</a></div></section>`;
}
function recuperarCarrinho() {
  $('#conteudo').innerHTML = `<section class="pagina-carrinho">${migalhas([{ nome: 'Sacola' }])}<h1>Sua sacola</h1><div class="recuperar-carrinho"><p>Não foi possível ler a sacola salva neste navegador. Você pode iniciar uma nova sacola; essa ação apaga apenas o registro local da sacola anterior.</p><button type="button" class="botao botao-secundario" data-recuperar-carrinho>Iniciar uma nova sacola</button><p class="mensagem-erro" role="alert"></p></div></section>`;
  $('[data-recuperar-carrinho]').addEventListener('click', () => {
    try { localStorage.removeItem(CHAVE_CARRINHO); atualizarContador(); $('#conteudo').innerHTML = carrinhoVazio(); }
    catch { $('.mensagem-erro').textContent = 'O navegador bloqueou o armazenamento. Permita o armazenamento local para usar a sacola.'; }
  });
}

function renderizarCarrinho(carrinho) {
  carrinhoAtual = carrinho;
  if (!carrinho || !nos(carrinho.lines).length) { $('#conteudo').innerHTML = carrinhoVazio(); return; }
  const linhas = nos(carrinho.lines);
  const checkout = urlSegura(carrinho.checkoutUrl, { externa: true });
  $('#conteudo').innerHTML = `<section class="pagina-carrinho">${migalhas([{ nome: 'Sacola' }])}<h1>Sua sacola <span class="contador-produtos">(${carrinho.totalQuantity})</span></h1><div class="carrinho-layout"><div><div id="linhas-carrinho">${linhas.map(linha => {
    const variante = linha.merchandise;
    const produto = variante.product;
    const imagem = imagemProduto(produto, variante);
    const selecionadas = (variante.selectedOptions || []).filter(item => normalizar(item.name) !== 'title').map(item => `${item.name}: ${item.value}`).join(' · ');
    return `<article class="item-carrinho" data-linha="${escapar(linha.id)}"><a href="${escapar(urlProduto(produto, variante))}">${imagem ? `<img src="${escapar(urlSegura(imagem.url))}" alt="${escapar(imagem.altText || produto.title)}" width="130" height="130">` : ''}</a><div><h2><a href="${escapar(urlProduto(produto, variante))}">${escapar(produto.title)}</a></h2><p>${escapar(selecionadas)}</p><div class="quantidade-carrinho"><button type="button" data-quantidade-delta="-1" aria-label="Diminuir quantidade de ${escapar(produto.title)}" ${linha.quantity <= 1 ? 'disabled' : ''}>${menos}</button><input type="number" min="1" max="99" step="1" value="${linha.quantity}" data-quantidade aria-label="Quantidade de ${escapar(produto.title)}"><button type="button" data-quantidade-delta="1" aria-label="Aumentar quantidade de ${escapar(produto.title)}" ${linha.quantity >= 99 ? 'disabled' : ''}>${mais}</button></div><button type="button" class="remover-item" data-remover-item>Remover</button></div><span class="preco-item">${escapar(precoFormatado(linha.cost?.totalAmount))}</span></article>`;
  }).join('')}</div><p class="mensagem-erro" role="alert" id="erro-carrinho"></p></div><aside class="resumo-carrinho"><h2>Suas escolhas</h2><dl><dt>Subtotal</dt><dd>${escapar(precoFormatado(carrinho.cost?.subtotalAmount))}</dd></dl><p>Frete, impostos e total final são calculados na próxima etapa, conforme o endereço de entrega.</p>${checkout ? `<a class="botao botao-brasa" data-checkout href="${escapar(checkout)}">Continuar para pagamento</a>` : '<p>O pagamento está indisponível no momento. Atualize a página para tentar novamente.</p>'}<p>Você vai concluir o pedido no checkout seguro da Per Parte.</p><a class="link-texto" href="/loja">Continuar explorando</a></aside></div></section>`;
  $$('[data-linha]').forEach(elemento => {
    const id = elemento.dataset.linha;
    $$('[data-quantidade-delta]', elemento).forEach(botao => botao.addEventListener('click', () => alterarCarrinho(id, Number($('[data-quantidade]', elemento).value) + Number(botao.dataset.quantidadeDelta))));
    $('[data-quantidade]', elemento).addEventListener('change', evento => alterarCarrinho(id, Number(evento.target.value)));
    $('[data-remover-item]', elemento).addEventListener('click', () => alterarCarrinho(id, 0));
  });
  $('[data-checkout]')?.addEventListener('click', evento => { if (ocupada) evento.preventDefault(); });
}

async function alterarCarrinho(id, quantidade) {
  if (ocupada) return;
  if (!Number.isInteger(quantidade) || quantidade < 0 || quantidade > 99) { renderizarCarrinho(carrinhoAtual); $('#erro-carrinho').textContent = 'Escolha uma quantidade entre 1 e 99.'; return; }
  ocupada = true;
  $('[data-checkout]')?.setAttribute('aria-disabled', 'true');
  $$('button,input', $('#linhas-carrinho')).forEach(elemento => { elemento.disabled = true; });
  $('#erro-carrinho').textContent = '';
  try {
    const resposta = await apiLoja('/api/carrinho/itens', { method: quantidade ? 'PATCH' : 'DELETE', body: JSON.stringify(quantidade ? { carrinhoId: carrinhoAtual.id, linhas: [{ id, quantity: quantidade }] } : { carrinhoId: carrinhoAtual.id, linhasIds: [id] }) });
    guardarCarrinho(resposta.carrinho);
    renderizarCarrinho(resposta.carrinho);
    const aviso = mensagemAvisos(resposta.avisos);
    if (aviso) avisar(aviso);
  } catch (erro) { if (erro.carrinho) guardarCarrinho(erro.carrinho); renderizarCarrinho(erro.carrinho || carrinhoAtual); if ($('#erro-carrinho')) $('#erro-carrinho').textContent = mensagemErro(erro); else avisar(mensagemErro(erro)); }
  finally { ocupada = false; }
}

function mensagemAvisos(avisos) {
  if (!avisos?.length) return '';
  return avisos.map(item => item.message || item.mensagem).filter(Boolean).join(' ') || 'A disponibilidade ou quantidade de um item mudou. Confira a sacola atualizada antes de continuar.';
}

async function carregarCarrinho() {
  tituloPagina('Sua sacola');
  const salvo = lerCarrinhoLocal();
  if (!salvo.valido) { recuperarCarrinho(); return; }
  if (!salvo.id) { $('#conteudo').innerHTML = carrinhoVazio(); return; }
  if (!configuracao?.carrinho?.disponivel) { $('#conteudo').innerHTML = carrinhoVazio('A compra estará disponível quando a loja estiver pronta. Sua sacola salva será preservada.'); return; }
  try {
    const resposta = await apiLoja(`/api/carrinho?id=${encodeURIComponent(salvo.id)}`);
    guardarCarrinho(resposta.carrinho);
    if (!resposta.carrinho) $('#conteudo').innerHTML = carrinhoVazio('A sacola anterior expirou. Explore a coleção para começar de novo.');
    else renderizarCarrinho(resposta.carrinho);
  } catch (erro) { renderizarErro(erro, 'Não foi possível abrir a sacola'); }
}

async function iniciar() {
  try {
    configuracao = await apiLoja('/api/loja/config');
    const caminho = location.pathname.replace(/\/$/, '') || '/loja';
    if (!caminho.startsWith('/produtos/')) restaurarRodapePadrao();
    if (caminho === '/conta') renderizarConta();
    else if (caminho === '/carrinho') await carregarCarrinho();
    else if (caminho.startsWith('/produtos/')) await carregarProduto(decodeURIComponent(caminho.slice('/produtos/'.length)));
    else await carregarLoja();
  } catch (erro) { renderizarErro(erro); }
}
window.addEventListener('popstate', () => { if (location.pathname === '/loja') { restaurarRodapePadrao(); carregarLoja(); } });
iniciar();
