import { fecharNavegacao, focoNavegacao } from './navegacao.js';
import { apiLoja, nos, varianteInicial, imagemProduto, urlProduto, urlSegura } from './catalogo.js';

const $ = (seletor, contexto = document) => contexto.querySelector(seletor);
const $$ = (seletor, contexto = document) => [...contexto.querySelectorAll(seletor)];
const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
const produtos = {
  marco: { nome: 'Marco', familia: 'Família Marco · luminária de mesa', chamada: 'A primeira de muitas.', descricao: 'Verde Marco na base. Âmbar nos três anéis. Areia no difusor. A obra-manifesto dá forma à nossa ideia: toda parte tem um porquê.', imagem: '/images/marco.png', busca: 'verde oliva ambar aneis anéis areia modular base', cores: [['Verde Marco', 'verde-marco'], ['Âmbar', 'ambar-marco'], ['Areia', 'areia']] },
  duna: { nome: 'Duna', familia: 'Família Brasa · luminária de mesa', chamada: 'Uma pausa em forma de luz.', descricao: 'Um volume suave encontra uma base de cor. Duna explora o contraste entre a calma da luz e a força de uma única parte. Curvas amplas para acompanhar o seu canto preferido.', imagem: '/images/duna.png', busca: 'vermelho brasa creme cupula cúpula curva baixa aconchego', cores: [['Brasa', 'brasa'], ['Luz Acesa', 'luz-acesa']] },
  farol: { nome: 'Farol', familia: 'Família Lago · luminária de mesa', chamada: 'Presença que acende o espaço.', descricao: 'Luz Acesa em um volume contínuo. Lago marca a base e o encontro entre as partes. Uma composição vertical, simples e com personalidade, para dar outro ritmo à sua mesa.', imagem: '/images/farol.png', busca: 'azul verde lago teal vertical cilindro cilindrica alta escritorio', cores: [['Lago', 'lago'], ['Luz Acesa', 'luz-acesa']] }
};
let favoritas;
function lerFavoritas() {
  try { const dados = JSON.parse(localStorage.getItem('perparte.favoritas.v1') || '[]'); return new Set(Array.isArray(dados) ? dados.filter(id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,254}$/.test(id)) : []); } catch { return new Set(); }
}
favoritas = lerFavoritas();
let idsBusca = Object.keys(produtos);
let catalogoRemoto = false;
let colecaoEmEstudo = true;
let buscaAtual = 0;
let esperaBusca;
const consultasFavoritas = new Map();

function registrarProduto(produto, variante = varianteInicial(produto)) {
  const foto = imagemProduto(produto, variante);
  produtos[produto.handle] = {
    nome: produto.title, familia: produto.estudo ? 'Composição em estudo' : produto.productType || produto.vendor || 'Per Parte',
    chamada: produto.estudo ? 'Imagem conceitual · composição em estudo' : (produto.description || produto.productType || '').slice(0, 150),
    descricao: produto.description || '', imagem: urlSegura(foto?.url), url: urlProduto(produto, variante),
    busca: [produto.description, produto.productType, ...(produto.tags || []), ...(produto.options || []).flatMap(opcao => opcao.values || opcao.optionValues?.map(valor => valor.name) || [])].join(' '),
  };
}
let produtoAberto = null;
let temporizadorToast;
function avisar(mensagem) { const toast = $('#toast'); toast.textContent = mensagem; toast.classList.add('visible'); clearTimeout(temporizadorToast); temporizadorToast = setTimeout(() => toast.classList.remove('visible'), 3000); }
function sincronizarFavoritas() {
  $$('[data-save]').forEach(botao => { const salvo = favoritas.has(botao.dataset.save); const nome = Object.hasOwn(produtos, botao.dataset.save) ? produtos[botao.dataset.save].nome : 'composição'; botao.setAttribute('aria-pressed', String(salvo)); botao.setAttribute('aria-label', `${salvo ? 'Remover' : 'Salvar'} ${nome}${salvo ? ' das favoritas' : ''}`); });
  $$('.favorites-count').forEach(contador => { contador.textContent = favoritas.size; contador.hidden = favoritas.size === 0; });
  if (produtoAberto) { const salvo = favoritas.has(produtoAberto); $('#dialog-save').setAttribute('aria-pressed', String(salvo)); $('#dialog-save span').textContent = salvo ? 'Composição salva' : 'Salvar esta composição'; }
  if ($('#favorites-dialog').open) renderizarFavoritas();
}
function alternarFavorita(id) { const estavaSalva = favoritas.has(id); if (!estavaSalva && !Object.hasOwn(produtos, id)) return; const nome = Object.hasOwn(produtos, id) ? produtos[id].nome : 'Composição'; if (estavaSalva) favoritas.delete(id); else favoritas.add(id); try { localStorage.setItem('perparte.favoritas.v1', JSON.stringify([...favoritas])); avisar(estavaSalva ? `${nome} removida das favoritas.` : `${nome} salva nas suas favoritas.`); } catch { avisar('Escolha salva nesta visita. O armazenamento do navegador está indisponível.'); } sincronizarFavoritas(); }
let ultimoFoco = null;
function abrirDialogo(dialogo) {
  const origem = focoNavegacao();
  fecharNavegacao();
  const aberto = $('dialog[open]');
  if (aberto) aberto.close();
  else ultimoFoco = origem;
  dialogo.showModal();
  document.body.classList.add('modal-open');
}
function fecharDialogo(dialogo) { dialogo.close(); }
$$('dialog').forEach(dialogo => { dialogo.addEventListener('close', () => { if (!$('dialog[open]')) { document.body.classList.remove('modal-open'); ultimoFoco?.focus({ preventScroll: true }); } }); dialogo.addEventListener('click', evento => { if (evento.target === dialogo) { const r = dialogo.getBoundingClientRect(); if (evento.clientX < r.left || evento.clientX > r.right || evento.clientY < r.top || evento.clientY > r.bottom) fecharDialogo(dialogo); } }); });
$$('[data-close-dialog]').forEach(botao => botao.addEventListener('click', () => fecharDialogo(botao.closest('dialog'))));
$$('[data-dialog-anchor]').forEach(link => link.addEventListener('click', () => fecharDialogo(link.closest('dialog'))));
function abrirProduto(id) {
  location.assign(`/produtos/${encodeURIComponent(id)}`);
}
document.addEventListener('click', evento => { const produto = evento.target.closest('[data-product]'); if (produto && produto.tagName !== 'A') abrirProduto(produto.dataset.product); const salvar = evento.target.closest('[data-save]'); if (salvar) alternarFavorita(salvar.dataset.save); });
$('#dialog-save').addEventListener('click', () => alternarFavorita(produtoAberto));
function criarResultado(id) { const produto = Object.hasOwn(produtos, id) ? produtos[id] : { nome: 'Composição salva', chamada: 'Consulte a página para ver a disponibilidade.', imagem: '' }; const link = document.createElement('a'); link.className = 'search-result'; link.href = produto.url || urlProduto(id); const foto = document.createElement('img'); foto.src = produto.imagem || '/favicon.svg'; foto.alt = ''; const texto = document.createElement('span'); const nome = document.createElement('strong'); nome.textContent = produto.nome; const descricao = document.createElement('small'); descricao.textContent = produto.chamada; texto.append(nome, descricao); link.append(foto, texto); const seta = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const uso = document.createElementNS('http://www.w3.org/2000/svg', 'use'); uso.setAttribute('href', '#i-arrow'); seta.append(uso); link.append(seta); return link; }
const normalizar = texto => texto.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function resultadosBusca(ids, mensagem = 'Nenhuma composição encontrada. Experimente outro nome ou uma cor.') { const resultados = $('#search-results'); resultados.replaceChildren(...ids.map(criarResultado)); if (!ids.length) { const vazio = document.createElement('p'); vazio.className = 'empty-state'; vazio.textContent = mensagem; resultados.append(vazio); } }
function buscar() {
  const consulta = ++buscaAtual;
  clearTimeout(esperaBusca);
  const texto = $('#search-input').value.trim();
  const termo = normalizar(texto);
  $('#search-all').href = texto ? `/loja?q=${encodeURIComponent(texto)}` : '/loja';
  const locais = idsBusca.filter(id => { const p = produtos[id]; return normalizar(`${p.nome} ${p.familia} ${p.chamada} ${p.busca}`).includes(termo); });
  if (!catalogoRemoto || !texto) { resultadosBusca(locais); return; }
  resultadosBusca([], 'Buscando no catálogo…');
  esperaBusca = setTimeout(async () => {
    try {
      const resposta = await apiLoja(`/api/produtos?limite=8&q=${encodeURIComponent(texto)}`);
      if (consulta !== buscaAtual) return;
      const encontrados = nos(resposta.produtos);
      encontrados.forEach(produto => registrarProduto(produto));
      resultadosBusca(encontrados.length ? encontrados.map(produto => produto.handle) : colecaoEmEstudo ? locais : []);
    } catch { if (consulta === buscaAtual) resultadosBusca([], 'Não foi possível consultar o catálogo. Use “Buscar em toda a loja” para tentar novamente.'); }
  }, 220);
}
$$('[data-open-search]').forEach(botao => botao.addEventListener('click', () => { $('#search-input').value = ''; buscar(); abrirDialogo($('#search-dialog')); $('#search-input').focus(); }));
$('#search-input').addEventListener('input', buscar);
$('#search-input').addEventListener('keydown', evento => { if (evento.key === 'Enter') { evento.preventDefault(); location.assign($('#search-all').href); } });
function renderizarFavoritas() {
  const resultados = $('#favorites-results');
  resultados.replaceChildren(...[...favoritas].map(id => {
    const linha = document.createElement('div'); linha.style.display = 'grid'; linha.style.gridTemplateColumns = 'minmax(0,1fr) 42px'; linha.style.alignItems = 'center';
    const remover = document.createElement('button'); remover.className = 'icon-button'; remover.dataset.save = id; remover.setAttribute('aria-label', `Remover ${Object.hasOwn(produtos, id) ? produtos[id].nome : 'composição'} das favoritas`); remover.setAttribute('aria-pressed', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('aria-hidden', 'true'); const uso = document.createElementNS('http://www.w3.org/2000/svg', 'use'); uso.setAttribute('href', '#i-heart'); svg.append(uso); remover.append(svg);
    linha.append(criarResultado(id), remover); return linha;
  }));
  if (!favoritas.size) { const vazio = document.createElement('div'); vazio.className = 'empty-state'; const p = document.createElement('p'); p.textContent = 'Suas escolhas começam aqui. Toque no coração de uma luminária para guardar sua composição preferida.'; const link = document.createElement('a'); link.className = 'button button-brasa'; link.href = '#colecao'; link.textContent = 'Explorar a coleção'; link.addEventListener('click', () => fecharDialogo($('#favorites-dialog'))); vazio.append(p, link); resultados.append(vazio); }
}
async function consultarFavoritasAusentes() {
  await Promise.all([...favoritas].filter(id => !Object.hasOwn(produtos, id)).map(async id => {
    if (consultasFavoritas.has(id)) return consultasFavoritas.get(id);
    const consulta = apiLoja(`/api/produtos/${encodeURIComponent(id)}`).then(resposta => { if (resposta.produto) registrarProduto(resposta.produto); }).catch(() => {}).finally(() => consultasFavoritas.delete(id));
    consultasFavoritas.set(id, consulta); return consulta;
  }));
  if ($('#favorites-dialog').open) renderizarFavoritas();
}
$$('[data-open-favorites]').forEach(botao => botao.addEventListener('click', () => { renderizarFavoritas(); abrirDialogo($('#favorites-dialog')); consultarFavoritasAusentes(); }));
document.addEventListener('perparte:catalogo', evento => {
  const lista = evento.detail?.produtos || [];
  lista.forEach(produto => registrarProduto(produto));
  idsBusca = lista.map(produto => produto.handle);
  catalogoRemoto = evento.detail?.modo === 'shopify';
  colecaoEmEstudo = Boolean(evento.detail?.emEstudo);
  sincronizarFavoritas();
  if ($('#search-dialog').open) buscar();
});
document.addEventListener('perparte:variante', evento => { if (evento.detail?.produto) { registrarProduto(evento.detail.produto, evento.detail.variante); if ($('#favorites-dialog').open) renderizarFavoritas(); } });
window.addEventListener('storage', evento => { if (evento.key === 'perparte.favoritas.v1') { favoritas = lerFavoritas(); sincronizarFavoritas(); } });
window.addEventListener('pageshow', evento => { if (evento.persisted) { favoritas = lerFavoritas(); sincronizarFavoritas(); } });
sincronizarFavoritas();
let indiceCena = 0;
let pausado = movimentoReduzido.matches;
let intervaloHero;
function exibirCena(indice) {
  const cenas = $$('.hero-slide');
  indiceCena = ((indice % cenas.length) + cenas.length) % cenas.length;
  cenas.forEach((slide, i) => slide.classList.toggle('active', i === indiceCena));
  $$('[data-go-slide]').forEach((botao, i) => {
    botao.classList.toggle('active', i === indiceCena);
    botao.setAttribute('aria-pressed', String(i === indiceCena));
  });
  const produtoId = cenas[indiceCena].dataset.slideProduct;
  if (produtos[produtoId]) {
    const miniatura = $('.hero-product');
    const produto = produtos[produtoId];
    miniatura.dataset.product = produtoId;
    if (miniatura.tagName === 'A') miniatura.href = '/produtos/' + encodeURIComponent(produtoId);
    $('img', miniatura).src = produto.imagem;
    $('strong', miniatura).textContent = produto.nome;
    $('small', miniatura).textContent = produto.chamada;
  }
}
function controlarHero() { clearInterval(intervaloHero); if (!pausado && !document.hidden) intervaloHero = setInterval(() => exibirCena(indiceCena + 1), 7000); $('.pause-button').setAttribute('aria-pressed', String(pausado)); $('.pause-button').setAttribute('aria-label', pausado ? 'Reproduzir alternância de imagens' : 'Pausar alternância de imagens'); $('.pause-button use').setAttribute('href', pausado ? '#i-play' : '#i-pause'); }
$('.pause-button').addEventListener('click', () => { pausado = !pausado; controlarHero(); });
$$('[data-go-slide]').forEach(botao => botao.addEventListener('click', () => { exibirCena(Number(botao.dataset.goSlide)); controlarHero(); }));
document.addEventListener('visibilitychange', controlarHero);
movimentoReduzido.addEventListener('change', evento => { pausado = evento.matches; controlarHero(); }); controlarHero();
const momentos = { habitar: { imagem: '/images/ambiente-duna.png', alt: 'Duna em uma sala acolhedora', titulo: 'Seu canto. Outra luz.', texto: 'Uma presença tranquila para os momentos que ficam.', produto: 'duna' }, pausar: { imagem: '/images/manifesto.png', alt: 'Marco acesa em um ambiente de luz baixa', titulo: 'O tempo pode esperar.', texto: 'Diminua o ritmo. Deixe a luz fazer o resto.', produto: 'marco' }, criar: { imagem: '/images/ambiente-farol.png', alt: 'Farol iluminando uma escrivaninha criativa', titulo: 'Espaço para suas ideias.', texto: 'Uma nova atmosfera para o que ainda está por vir.', produto: 'farol' } };
const trocasPendentes = new WeakMap();
function trocarImagem(elemento, src, alt) { clearTimeout(trocasPendentes.get(elemento)); if (movimentoReduzido.matches) { elemento.src = src; elemento.alt = alt; return; } elemento.classList.add('changing'); trocasPendentes.set(elemento, setTimeout(() => { elemento.src = src; elemento.alt = alt; elemento.classList.remove('changing'); }, 180)); }
function selecionarMomento(chave) { const momento = momentos[chave]; $$('[data-mood]').forEach(botao => { const ativo = botao.dataset.mood === chave; botao.setAttribute('aria-selected', String(ativo)); botao.tabIndex = ativo ? 0 : -1; }); $('#mood-panel').setAttribute('aria-labelledby', `tab-${chave}`); trocarImagem($('#mood-image'), momento.imagem, momento.alt); $('#mood-caption-title').textContent = momento.titulo; $('#mood-caption-text').textContent = momento.texto; $('#mood-product').dataset.product = momento.produto; $('#mood-product').href = '/produtos/' + encodeURIComponent(momento.produto); $('#mood-product').firstChild.textContent = `Conheça ${produtos[momento.produto].nome} `; }
$$('[data-mood]').forEach((botao, indice, botoes) => { botao.addEventListener('click', () => selecionarMomento(botao.dataset.mood)); botao.addEventListener('keydown', evento => { let novo; if (evento.key === 'ArrowRight') novo = (indice + 1) % botoes.length; if (evento.key === 'ArrowLeft') novo = (indice - 1 + botoes.length) % botoes.length; if (evento.key === 'Home') novo = 0; if (evento.key === 'End') novo = botoes.length - 1; if (novo !== undefined) { evento.preventDefault(); botoes[novo].focus(); selecionarMomento(botoes[novo].dataset.mood); } }); });
const cenasProcesso = [['/images/marco.png', 'A composição de Marco em base, anéis e difusor', '01 — A beleza do encontro'], ['/images/detalhes-duna.png', 'Textura fosca e junção das partes de Duna', '02 — A matéria conta uma história'], ['/images/ambiente-duna.png', 'Duna acesa em um espaço de estar', '03 — Um lugar para chamar de seu']];
const processo = $('#processo');
const palcoProcesso = $('.process-stage');
const telaProcesso = matchMedia('(min-width: 1000px) and (min-height: 560px)');
let passoAtual = 0;
let posicaoEscolhaManual = null;
let quadroProcessoPendente = false;

function selecionarProcesso(indice, pelaRolagem = false) {
  if (indice === passoAtual) return;
  const painelAtual = $('#process-panel-' + passoAtual);
  if (pelaRolagem && painelAtual.contains(document.activeElement)) return;
  passoAtual = indice;
  $$('[data-process]').forEach((item, i) => {
    const ativo = i === indice;
    item.setAttribute('aria-expanded', String(ativo));
    item.closest('.process-item').classList.toggle('active', ativo);
    $('#process-panel-' + i).hidden = !ativo;
  });
  const [src, alt, legenda] = cenasProcesso[indice];
  trocarImagem($('#process-image'), src, alt);
  $('#process-image-caption').textContent = legenda;
}

function atualizarProcessoNaRolagem() {
  quadroProcessoPendente = false;
  if (!processo.classList.contains('scroll-process')) return;
  if (posicaoEscolhaManual !== null && Math.abs(scrollY - posicaoEscolhaManual) < 70) return;
  posicaoEscolhaManual = null;
  const topo = processo.getBoundingClientRect().top - 86;
  const percurso = Math.max(1, processo.offsetHeight - palcoProcesso.offsetHeight - 86);
  const progresso = Math.min(1, Math.max(0, -topo / percurso));
  selecionarProcesso(Math.min(2, Math.floor(progresso * 3)), true);
}

function agendarProcesso() {
  if (quadroProcessoPendente) return;
  quadroProcessoPendente = true;
  requestAnimationFrame(atualizarProcessoNaRolagem);
}

function configurarProcesso() {
  processo.classList.toggle('scroll-process', telaProcesso.matches && !movimentoReduzido.matches);
  agendarProcesso();
}

$$('[data-process]').forEach(botao => botao.addEventListener('click', () => {
  selecionarProcesso(Number(botao.dataset.process));
  posicaoEscolhaManual = scrollY;
}));
addEventListener('scroll', agendarProcesso, { passive: true });
addEventListener('resize', configurarProcesso, { passive: true });
telaProcesso.addEventListener('change', configurarProcesso);
movimentoReduzido.addEventListener('change', configurarProcesso);
configurarProcesso();
$$('[data-mood-link]').forEach(link => link.addEventListener('click', () => selecionarMomento(link.dataset.moodLink)));
$$('[data-process-link]').forEach(link => link.addEventListener('click', () => {
  const indice = Number(link.dataset.processLink);
  if (processo.classList.contains('scroll-process')) {
    const topo = processo.getBoundingClientRect().top + scrollY - 86;
    const percurso = Math.max(1, processo.offsetHeight - palcoProcesso.offsetHeight - 86);
    const destino = topo + (indice + .16) / 3 * percurso;
    requestAnimationFrame(() => scrollTo({ top:destino, behavior:movimentoReduzido.matches ? 'instant' : 'smooth' }));
  }
  selecionarProcesso(indice);
  posicaoEscolhaManual = scrollY;
}));
$$('[data-scroll]').forEach(botao => botao.addEventListener('click', () => { const trilho = document.getElementById(botao.dataset.scroll); const item = trilho.firstElementChild; const distancia = item.getBoundingClientRect().width + parseFloat(getComputedStyle(trilho).gap || 0); const direcao = Number(botao.dataset.direction); const limite = trilho.scrollWidth - trilho.clientWidth; if (limite < 2) { const cards = $$('button[data-product]', trilho); (direcao > 0 ? cards.at(-1) : cards[0])?.focus({ preventScroll: true }); return; } const destino = direcao > 0 && trilho.scrollLeft >= limite - 3 ? 0 : direcao < 0 && trilho.scrollLeft <= 3 ? limite : trilho.scrollLeft + distancia * direcao; trilho.scrollTo({ left: destino, behavior: movimentoReduzido.matches ? 'instant' : 'smooth' }); }));
if ('IntersectionObserver' in window && !movimentoReduzido.matches) { document.documentElement.classList.add('js-reveal'); const observador = new IntersectionObserver(entradas => entradas.forEach(entrada => { if (entrada.isIntersecting) { entrada.target.classList.add('is-visible'); observador.unobserve(entrada.target); } }), { threshold: .08, rootMargin: '0px 0px -25px 0px' }); $$('.reveal').forEach(elemento => observador.observe(elemento)); }
