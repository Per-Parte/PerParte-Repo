const $ = (seletor, contexto = document) => contexto.querySelector(seletor);
const $$ = (seletor, contexto = document) => [...contexto.querySelectorAll(seletor)];
const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
const produtos = {
  marco: { nome: 'Marco', familia: 'Família Marco · luminária de mesa', chamada: 'A primeira de muitas.', descricao: 'Verde Marco na base. Âmbar nos três anéis. Areia no difusor. A obra-manifesto dá forma à nossa ideia: toda parte tem um porquê.', imagem: '/images/marco.png', busca: 'verde oliva ambar aneis anéis areia modular base', cores: [['Verde Marco', 'verde-marco'], ['Âmbar', 'ambar-marco'], ['Areia', 'areia']] },
  duna: { nome: 'Duna', familia: 'Família Brasa · luminária de mesa', chamada: 'Uma pausa em forma de luz.', descricao: 'Um volume suave encontra uma base de cor. Duna explora o contraste entre a calma da luz e a força de uma única parte. Curvas amplas para acompanhar o seu canto preferido.', imagem: '/images/duna.png', busca: 'vermelho brasa creme cupula cúpula curva baixa aconchego', cores: [['Brasa', 'brasa'], ['Luz Acesa', 'luz-acesa']] },
  farol: { nome: 'Farol', familia: 'Família Lago · luminária de mesa', chamada: 'Presença que acende o espaço.', descricao: 'Luz Acesa em um volume contínuo. Lago marca a base e o encontro entre as partes. Uma composição vertical, simples e com personalidade, para dar outro ritmo à sua mesa.', imagem: '/images/farol.png', busca: 'azul verde lago teal vertical cilindro cilindrica alta escritorio', cores: [['Lago', 'lago'], ['Luz Acesa', 'luz-acesa']] }
};
let favoritas;
try { const dados = JSON.parse(localStorage.getItem('perparte.favoritas.v1') || '[]'); favoritas = new Set(Array.isArray(dados) ? dados.filter(id => produtos[id]) : []); } catch { favoritas = new Set(); }
let produtoAberto = null;
let temporizadorToast;
function avisar(mensagem) { const toast = $('#toast'); toast.textContent = mensagem; toast.classList.add('visible'); clearTimeout(temporizadorToast); temporizadorToast = setTimeout(() => toast.classList.remove('visible'), 3000); }
function sincronizarFavoritas() {
  $$('[data-save]').forEach(botao => { const salvo = favoritas.has(botao.dataset.save); botao.setAttribute('aria-pressed', String(salvo)); botao.setAttribute('aria-label', `${salvo ? 'Remover' : 'Salvar'} ${produtos[botao.dataset.save].nome}${salvo ? ' das favoritas' : ''}`); });
  $$('.favorites-count').forEach(contador => { contador.textContent = favoritas.size; contador.hidden = favoritas.size === 0; });
  if (produtoAberto) { const salvo = favoritas.has(produtoAberto); $('#dialog-save').setAttribute('aria-pressed', String(salvo)); $('#dialog-save span').textContent = salvo ? 'Composição salva' : 'Salvar esta composição'; }
  if ($('#favorites-dialog').open) renderizarFavoritas();
}
function alternarFavorita(id) { if (!produtos[id]) return; const estavaSalva = favoritas.has(id); if (estavaSalva) favoritas.delete(id); else favoritas.add(id); try { localStorage.setItem('perparte.favoritas.v1', JSON.stringify([...favoritas])); avisar(estavaSalva ? `${produtos[id].nome} removida das favoritas.` : `${produtos[id].nome} salva nas suas favoritas.`); } catch { avisar('Escolha salva nesta visita. O armazenamento do navegador está indisponível.'); } sincronizarFavoritas(); }
let ultimoFoco = null;
function abrirDialogo(dialogo) {
  const origem = megaAtual
    ? gatilhosMega.find(item => item.dataset.mega === megaAtual)
    : document.activeElement;
  fecharMegaMenu();
  fecharMenu();
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
  const produto = produtos[id]; if (!produto) return; produtoAberto = id;
  $('#dialog-product-title').textContent = produto.nome; $('#dialog-product-family').textContent = produto.familia; $('#dialog-product-tagline').textContent = produto.chamada; $('#dialog-product-description').textContent = produto.descricao; $('#dialog-product-image').src = produto.imagem; $('#dialog-product-image').alt = `${produto.nome}, composição conceitual da Per Parte`;
  $('#dialog-product-palette').replaceChildren(...produto.cores.map(([nome, cor]) => { const item = document.createElement('span'); const ponto = document.createElement('i'); ponto.style.setProperty('--swatch', `var(--pp-cor-${cor})`); item.append(ponto, document.createTextNode(nome)); return item; }));
  sincronizarFavoritas(); abrirDialogo($('#product-dialog'));
}
document.addEventListener('click', evento => { const produto = evento.target.closest('[data-product]'); if (produto) abrirProduto(produto.dataset.product); const salvar = evento.target.closest('[data-save]'); if (salvar) alternarFavorita(salvar.dataset.save); });
$('#dialog-save').addEventListener('click', () => alternarFavorita(produtoAberto));
function criarResultado(id) { const produto = produtos[id]; const botao = document.createElement('button'); botao.className = 'search-result'; botao.dataset.product = id; const foto = document.createElement('img'); foto.src = produto.imagem; foto.alt = ''; const texto = document.createElement('span'); const nome = document.createElement('strong'); nome.textContent = produto.nome; const descricao = document.createElement('small'); descricao.textContent = produto.chamada; texto.append(nome, descricao); botao.append(foto, texto); const seta = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const uso = document.createElementNS('http://www.w3.org/2000/svg', 'use'); uso.setAttribute('href', '#i-arrow'); seta.append(uso); botao.append(seta); return botao; }
const normalizar = texto => texto.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function buscar() { const termo = normalizar($('#search-input').value.trim()); const ids = Object.entries(produtos).filter(([, p]) => normalizar(`${p.nome} ${p.familia} ${p.chamada} ${p.busca}`).includes(termo)).map(([id]) => id); const resultados = $('#search-results'); resultados.replaceChildren(...ids.map(criarResultado)); if (!ids.length) { const vazio = document.createElement('p'); vazio.className = 'empty-state'; vazio.textContent = 'Nenhuma composição encontrada. Experimente “Brasa”, “Marco” ou “vertical”.'; resultados.append(vazio); } }
$$('[data-open-search]').forEach(botao => botao.addEventListener('click', () => { $('#search-input').value = ''; buscar(); abrirDialogo($('#search-dialog')); $('#search-input').focus(); }));
$('#search-input').addEventListener('input', buscar);
function renderizarFavoritas() { const resultados = $('#favorites-results'); resultados.replaceChildren(...[...favoritas].map(criarResultado)); if (!favoritas.size) { const vazio = document.createElement('div'); vazio.className = 'empty-state'; const p = document.createElement('p'); p.textContent = 'Suas escolhas começam aqui. Toque no coração de uma luminária para guardar sua composição preferida.'; const link = document.createElement('a'); link.className = 'button button-brasa'; link.href = '#colecao'; link.textContent = 'Explorar a coleção'; link.addEventListener('click', () => fecharDialogo($('#favorites-dialog'))); vazio.append(p, link); resultados.append(vazio); } }
$$('[data-open-favorites]').forEach(botao => botao.addEventListener('click', () => { renderizarFavoritas(); abrirDialogo($('#favorites-dialog')); }));
sincronizarFavoritas();
const cabecalho = $('#site-header');
const menu = $('#mobile-nav');
const botaoMenu = $('.menu-trigger');
const fundoMenu = $('.nav-scrim');
const megaShell = $('#mega-shell');
const gatilhosMega = $$('[data-mega]');
const podeHover = matchMedia('(hover: hover) and (min-width: 801px)');
let megaAtual = null;
let fecharMegaPendente;

function sincronizarFundoMenu() {
  fundoMenu.hidden = !megaAtual && !menu.classList.contains('open');
}

function fecharMegaMenu(devolverFoco = false) {
  clearTimeout(fecharMegaPendente);
  if (!megaAtual) return;
  const gatilho = gatilhosMega.find(item => item.dataset.mega === megaAtual);
  megaAtual = null;
  gatilhosMega.forEach(item => item.setAttribute('aria-expanded', 'false'));
  $$('.mega-panel').forEach(painel => { painel.hidden = true; });
  megaShell.hidden = true;
  cabecalho.classList.remove('mega-open');
  sincronizarFundoMenu();
  if (devolverFoco) gatilho?.focus({ preventScroll: true });
}

function abrirMegaMenu(chave, focar = false) {
  if (!matchMedia('(min-width: 801px)').matches) return;
  clearTimeout(fecharMegaPendente);
  fecharMenu();
  megaAtual = chave;
  megaShell.hidden = false;
  cabecalho.classList.add('mega-open');
  gatilhosMega.forEach(item => item.setAttribute('aria-expanded', String(item.dataset.mega === chave)));
  $$('.mega-panel').forEach(painel => { painel.hidden = painel.id !== 'mega-' + chave; });
  sincronizarFundoMenu();
  if (focar) $('#mega-' + chave + ' a, #mega-' + chave + ' button')?.focus();
}

function agendarFechamentoMega() {
  clearTimeout(fecharMegaPendente);
  fecharMegaPendente = setTimeout(() => fecharMegaMenu(), 180);
}

gatilhosMega.forEach((gatilho, indice) => {
  gatilho.addEventListener('pointerenter', () => { if (podeHover.matches) abrirMegaMenu(gatilho.dataset.mega); });
  gatilho.addEventListener('click', () => {
    if (megaAtual === gatilho.dataset.mega && !podeHover.matches) fecharMegaMenu();
    else abrirMegaMenu(gatilho.dataset.mega);
  });
  gatilho.addEventListener('keydown', evento => {
    if (evento.key === 'ArrowDown' || (evento.key === 'Tab' && !evento.shiftKey && megaAtual === gatilho.dataset.mega)) {
      evento.preventDefault();
      abrirMegaMenu(gatilho.dataset.mega, true);
    }
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
      evento.preventDefault();
      const direcao = evento.key === 'ArrowRight' ? 1 : -1;
      const proximo = gatilhosMega[(indice + direcao + gatilhosMega.length) % gatilhosMega.length];
      proximo.focus();
      abrirMegaMenu(proximo.dataset.mega);
    }
  });
});
cabecalho.addEventListener('pointerleave', () => { if (podeHover.matches) agendarFechamentoMega(); });
cabecalho.addEventListener('pointerenter', () => clearTimeout(fecharMegaPendente));
megaShell.addEventListener('pointerenter', () => clearTimeout(fecharMegaPendente));
megaShell.addEventListener('pointerleave', () => { if (podeHover.matches) agendarFechamentoMega(); });
megaShell.addEventListener('focusout', evento => {
  if (!megaShell.contains(evento.relatedTarget) && !gatilhosMega.includes(evento.relatedTarget)) fecharMegaMenu();
});
$$('a[href^="#"]', megaShell).forEach(link => link.addEventListener('click', () => fecharMegaMenu()));
fundoMenu.addEventListener('click', () => { fecharMegaMenu(); fecharMenu(); });

function fecharMenu() {
  if (!menu.classList.contains('open')) return;
  menu.classList.remove('open');
  menu.inert = true;
  cabecalho.classList.remove('menu-open');
  botaoMenu.setAttribute('aria-expanded', 'false');
  botaoMenu.setAttribute('aria-label', 'Abrir menu');
  $('use', botaoMenu).setAttribute('href', '#i-menu');
  document.body.classList.remove('modal-open');
  sincronizarFundoMenu();
}

botaoMenu.addEventListener('click', () => {
  if (menu.classList.contains('open')) fecharMenu();
  else {
    fecharMegaMenu();
    menu.classList.add('open');
    menu.inert = false;
    cabecalho.classList.add('menu-open');
    botaoMenu.setAttribute('aria-expanded', 'true');
    botaoMenu.setAttribute('aria-label', 'Fechar menu');
    $('use', botaoMenu).setAttribute('href', '#i-close');
    document.body.classList.add('modal-open');
    sincronizarFundoMenu();
  }
});
$$('a', menu).forEach(link => link.addEventListener('click', fecharMenu));
document.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && megaAtual) fecharMegaMenu(true);
  if (evento.key === 'Escape' && menu.classList.contains('open')) { fecharMenu(); botaoMenu.focus(); }
  if (evento.key === 'Tab' && menu.classList.contains('open')) {
    const itens = [...$$('a,button', cabecalho), ...$$('a', menu)].filter(el => el.offsetParent !== null);
    const primeiro = itens[0];
    const ultimo = itens.at(-1);
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  }
});
function atualizarCabecalho() { cabecalho.classList.toggle('scrolled', scrollY > 35); }
addEventListener('scroll', atualizarCabecalho, { passive: true });
atualizarCabecalho();
matchMedia('(min-width: 801px)').addEventListener('change', evento => {
  if (evento.matches) fecharMenu();
  else fecharMegaMenu();
});
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
function selecionarMomento(chave) { const momento = momentos[chave]; $$('[data-mood]').forEach(botao => { const ativo = botao.dataset.mood === chave; botao.setAttribute('aria-selected', String(ativo)); botao.tabIndex = ativo ? 0 : -1; }); $('#mood-panel').setAttribute('aria-labelledby', `tab-${chave}`); trocarImagem($('#mood-image'), momento.imagem, momento.alt); $('#mood-caption-title').textContent = momento.titulo; $('#mood-caption-text').textContent = momento.texto; $('#mood-product').dataset.product = momento.produto; $('#mood-product').firstChild.textContent = `Conheça ${produtos[momento.produto].nome} `; }
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
