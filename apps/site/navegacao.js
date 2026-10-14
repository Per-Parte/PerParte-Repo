import { apiLoja, demoProdutos, urlProduto, urlSegura, imagemProduto, varianteInicial } from './catalogo.js';

export const categoriasLuminarias = Object.freeze([
  { nome: 'De mesa', tipo: 'Luminária de mesa' },
  { nome: 'De piso', tipo: 'Luminária de piso' },
  { nome: 'De parede', tipo: 'Luminária de parede' },
  { nome: 'Pendentes', tipo: 'Luminária pendente' },
]);

// A mesma estrutura, iconografia e conteúdo são usados em todas as páginas.
const estrutura = `    <header class="site-header" id="site-header">
      <a class="wordmark" href="#inicio" aria-label="Per Parte, início">
        Per Parte
      </a>
      <nav class="desktop-nav" aria-label="Principal">
        <a href="/loja">Loja</a>
        <button class="nav-disclosure" data-mega="luminarias" aria-expanded="false" aria-controls="mega-luminarias">
          Luminárias
          <svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </button>
        <button class="nav-disclosure" data-mega="inspire" aria-expanded="false" aria-controls="mega-inspire">
          Inspire-se
          <svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </button>
        <button class="nav-disclosure" data-mega="processo" aria-expanded="false" aria-controls="mega-processo">
          Como é feita
          <svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </button>
        <button class="nav-disclosure" data-mega="marca" aria-expanded="false" aria-controls="mega-marca">
          Per Parte
          <svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </button>
      </nav>
      <div class="header-actions">
        <a href="/loja" class="header-pill">
          Encontre sua luz
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
        </a>
        <button class="icon-button" data-open-search data-buscar aria-label="Buscar luminárias">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/>
        <path d="m16 16 5 5"/></svg>
        </button>
        <button class="icon-button favorites-trigger" data-open-favorites aria-label="Ver luminárias salvas">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 5.8c-2.1-2.2-5.5-1.6-8.5 1.7-3-3.3-6.4-3.9-8.5-1.7-2.1 2.2-1.8 5.1.3 7.3L12 21l8.2-7.9c2.1-2.2 2.4-5.1.3-7.3Z"/></svg>
          <span class="favorites-count" hidden>
            0
          </span>
        </button>
        <a class="icon-button account-trigger" href="/conta" aria-label="Entrar ou criar conta"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6" r="3"/><path d="m5 21 7-9 7 9Z"/></svg></a>
        <a class="icon-button cart-trigger sacola-nav" href="/carrinho" aria-label="Ver sacola"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14v13H5zM8 8V6a4 4 0 0 1 8 0v2"/></svg><span class="cart-count" data-contador hidden>0</span></a>
        <button class="icon-button menu-trigger" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-nav">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M3 16h18"/></svg>
        </button>
      </div>
    </header>
    <div class="nav-scrim" hidden>
    </div>
    <div class="mega-shell" id="mega-shell" hidden>
      <section class="mega-panel" id="mega-luminarias" aria-label="Explore as luminárias" hidden>
        <div class="mega-links mega-primary">
          <p class="eyebrow">
            Luminárias
          </p>
          <a href="/loja">
            Toda a coleção
          </a>
          ${categoriasLuminarias.map(({ nome, tipo }) => `<a href="/loja?tipo=${encodeURIComponent(tipo)}">${nome}</a>`).join('\n          ')}
        </div>
        <div class="mega-links">
          <p class="eyebrow">
            Composições
          </p>
          <a href="/produtos/marco">Marco</a>
          <a href="/produtos/duna">Duna</a>
          <a href="/produtos/farol">Farol</a>
          <p class="eyebrow mega-second-label">Uma luz, seu jeito</p>
          <a href="#ambientes" data-mood-link="habitar">
            Para habitar
          </a>
          <a href="#ambientes" data-mood-link="pausar">
            Para pausar
          </a>
          <a href="#ambientes" data-mood-link="criar">
            Para criar
          </a>
          <p class="eyebrow mega-second-label">
            Suas escolhas
          </p>
          <button data-open-favorites>
            Composições salvas
          </button>
        </div>
        <a href="/produtos/marco" class="mega-feature" data-product="marco">
          <img src="/images/campanha-marco-orbita.png" alt="Um jovem de óculos e casaco gráfico junto de Marco, sob anéis gigantes suspensos">
          <span>
            <strong>
              A primeira de muitas.
            </strong>
            <small>
              Conheça Marco.
            </small>
          </span>
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
          </i>
        </a>
      </section>
      <section class="mega-panel" id="mega-inspire" aria-label="Inspiração para seus ambientes" hidden>
        <div class="mega-links mega-primary">
          <p class="eyebrow">
            Inspire-se
          </p>
          <a href="#ambientes">
            Novas atmosferas
          </a>
          <a href="#ambientes" data-mood-link="habitar">
            Habitar
          </a>
          <a href="#ambientes" data-mood-link="pausar">
            Pausar
          </a>
          <a href="#ambientes" data-mood-link="criar">
            Criar
          </a>
        </div>
        <div class="mega-links">
          <p class="eyebrow">
            A luz muda tudo
          </p>
          <a href="#galeria">
            Pequenos cenários
          </a>
          <a href="#colecao">
            Escolha uma composição
          </a>
          <p class="eyebrow mega-second-label">
            Encontre a sua
          </p>
          <button data-open-search data-buscar>
            Buscar luminárias
          </button>
          <button data-open-favorites>
            Suas favoritas
          </button>
        </div>
        <a class="mega-feature" href="#galeria">
          <img src="/images/insp-duna-nuvens.png" alt="Duna junto de uma mulher em um sofá ondulado, entre flores gigantes">
          <span>
            <strong>
              Dê espaço à imaginação.
            </strong>
            <small>
              Explore nossas cenas.
            </small>
          </span>
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
          </i>
        </a>
      </section>
      <section class="mega-panel" id="mega-processo" aria-label="Conheça o processo" hidden>
        <div class="mega-links mega-primary">
          <p class="eyebrow">
            Como é feita
          </p>
          <a href="#processo">
            Feito por partes
          </a>
          <a href="#processo" data-process-link="0">
            A composição
          </a>
          <a href="#processo" data-process-link="1">
            A matéria
          </a>
          <a href="#processo" data-process-link="2">
            O encontro
          </a>
        </div>
        <div class="mega-links">
          <p class="eyebrow">
            Do encontro à matéria
          </p>
          <a href="#processo">
            Impressão 3D
          </a>
          <a href="#duvidas">
            Dúvidas sobre a coleção
          </a>
          <p class="eyebrow mega-second-label">
            A marca
          </p>
          <a href="#essencia">
            Nossa missão
          </a>
        </div>
        <a class="mega-feature" href="#processo">
          <img src="/images/detalhes-duna.png" alt="Camadas e junções de Duna em detalhe">
          <span>
            <strong>
              Toda parte tem um porquê.
            </strong>
            <small>
              Olhe mais de perto.
            </small>
          </span>
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
          </i>
        </a>
      </section>
      <section class="mega-panel" id="mega-marca" aria-label="Conheça a Per Parte" hidden>
        <div class="mega-links mega-primary">
          <p class="eyebrow">
            Per Parte
          </p>
          <a href="#essencia">
            Nossa missão
          </a>
          <a href="#era-do-criar">
            A era do criar
          </a>
          <a href="#colecao">
            O começo
          </a>
        </div>
        <div class="mega-links">
          <p class="eyebrow">
            Criado por você
          </p>
          <a href="#processo">
            Feito por partes
          </a>
          <a href="#duvidas">
            Vamos por partes
          </a>
          <p class="eyebrow mega-second-label">
            Seu universo
          </p>
          <button data-open-favorites>
            Suas favoritas
          </button>
        </div>
        <a class="mega-feature" href="#essencia">
          <img src="/images/campanha-farol-cenario.png" alt="Farol em um cenário surreal Lago, com roupa escultural e azulejos">
          <span>
            <strong>
              Mais de você.
            </strong>
            <small>
              Em cada parte.
            </small>
          </span>
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
          </i>
        </a>
      </section>
    </div>
`;

export function htmlNavegacao(inicio = false) {
  const grupos = [...estrutura.matchAll(/<section class="mega-panel" id="mega-([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
  const nomes = { luminarias: 'Luminárias', inspire: 'Inspire-se', processo: 'Como é feita', marca: 'Per Parte' };
  const movel = `<nav class="mobile-nav" id="mobile-nav" aria-label="Navegação móvel" inert>
    <a href="/loja">Loja <span>01</span></a>
    ${grupos.map(([_, chave, conteudo]) => `<details class="mobile-grupo"><summary>${nomes[chave]}<svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5"/></svg></summary><div class="mobile-links">${[...conteudo.matchAll(/<div class="mega-links[^>]*>[\s\S]*?<\/div>/g)].map(item => item[0]).join('')}</div></details>`).join('')}
    <div class="mobile-utilidades"><button type="button" data-open-search data-buscar>Buscar luminárias</button><button type="button" data-open-favorites>Composições salvas</button><a href="/conta">Minha conta</a><a href="/carrinho">Sacola</a></div>
    <p>Criado por você,<br>feito por partes.</p>
  </nav>`;
  const html = estrutura + movel;
  return inicio ? html : html.replaceAll('href="#', 'href="/#');
}

let controle;
export function fecharNavegacao() { controle?.fechar(); }
export function focoNavegacao() { return controle?.foco() || document.activeElement; }

function iniciarNavegacao(raiz) {
  const inicio = location.pathname === '/' || location.pathname === '/index.html';
  raiz.dataset.pagina = inicio ? 'inicio' : 'comercio';
  raiz.innerHTML = htmlNavegacao(inicio);
  const $ = seletor => raiz.querySelector(seletor);
  const $$ = seletor => [...raiz.querySelectorAll(seletor)];
  const cabecalho = $('#site-header');
  const menu = $('#mobile-nav');
  const botaoMenu = $('.menu-trigger');
  const fundo = $('.nav-scrim');
  const painel = $('#mega-shell');
  const gatilhos = $$('[data-mega]');
  const desktop = matchMedia('(min-width: 801px)');
  const hover = matchMedia('(hover: hover) and (min-width: 801px)');
  let aberto = null;
  let fecharPendente;
  let restaurandoFoco = false;
  const foco = () => aberto ? gatilhos.find(item => item.dataset.mega === aberto) : menu.classList.contains('open') ? botaoMenu : document.activeElement;
  const atualizarFundo = () => { fundo.hidden = !aberto && !menu.classList.contains('open'); };
  function fecharMega() {
    clearTimeout(fecharPendente);
    aberto = null;
    gatilhos.forEach(item => item.setAttribute('aria-expanded', 'false'));
    $$('.mega-panel').forEach(item => { item.hidden = true; });
    painel.hidden = true;
    cabecalho.classList.remove('mega-open');
    atualizarFundo();
  }
  function fecharMovel() {
    menu.classList.remove('open');
    menu.inert = true;
    cabecalho.classList.remove('menu-open');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
    botaoMenu.querySelector('path').setAttribute('d', 'M3 8h18M3 16h18');
    document.body.classList.remove('navegacao-aberta');
    atualizarFundo();
  }
  function fechar() { fecharMega(); fecharMovel(); }
  function abrirMega(chave, entrar = false) {
    if (!desktop.matches) return;
    fecharMovel(); clearTimeout(fecharPendente);
    aberto = chave; painel.hidden = false;
    cabecalho.classList.add('mega-open');
    gatilhos.forEach(item => item.setAttribute('aria-expanded', String(item.dataset.mega === chave)));
    $$('.mega-panel').forEach(item => { item.hidden = item.id !== `mega-${chave}`; });
    atualizarFundo();
    if (entrar) $(`#mega-${chave} a, #mega-${chave} button`)?.focus();
  }
  gatilhos.forEach((gatilho, indice) => {
    gatilho.addEventListener('pointerenter', () => { if (hover.matches) abrirMega(gatilho.dataset.mega); });
    gatilho.addEventListener('focus', () => { if (!restaurandoFoco && gatilho.matches(':focus-visible')) abrirMega(gatilho.dataset.mega); });
    gatilho.addEventListener('click', evento => {
      if (aberto === gatilho.dataset.mega && (!hover.matches || evento.detail === 0)) fecharMega();
      else abrirMega(gatilho.dataset.mega);
    });
    gatilho.addEventListener('keydown', evento => {
      if (evento.key === 'ArrowDown' || (evento.key === 'Tab' && !evento.shiftKey && aberto === gatilho.dataset.mega)) {
        evento.preventDefault(); abrirMega(gatilho.dataset.mega, true);
      }
      if (['ArrowRight', 'ArrowLeft'].includes(evento.key)) {
        evento.preventDefault(); const proximo = gatilhos[(indice + (evento.key === 'ArrowRight' ? 1 : -1) + gatilhos.length) % gatilhos.length];
        proximo.focus(); abrirMega(proximo.dataset.mega);
      }
    });
  });
  for (const area of [cabecalho, painel]) {
    area.addEventListener('pointerenter', () => clearTimeout(fecharPendente));
    area.addEventListener('pointerleave', () => { if (hover.matches) fecharPendente = setTimeout(fecharMega, 180); });
  }
  document.addEventListener('focusin', evento => {
    if (aberto && !painel.contains(evento.target) && !gatilhos.includes(evento.target)) fecharMega();
  });
  fundo.addEventListener('click', fechar);
  botaoMenu.addEventListener('click', () => {
    if (menu.classList.contains('open')) { fecharMovel(); return; }
    fecharMega(); menu.classList.add('open'); menu.inert = false;
    cabecalho.classList.add('menu-open');
    botaoMenu.setAttribute('aria-expanded', 'true'); botaoMenu.setAttribute('aria-label', 'Fechar menu');
    botaoMenu.querySelector('path').setAttribute('d', 'm6 6 12 12M6 18 18 6');
    document.body.classList.add('navegacao-aberta'); atualizarFundo();
  });
  $$('.mega-shell a, .mobile-nav a').forEach(link => link.addEventListener('click', fechar));
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && (aberto || menu.classList.contains('open'))) {
      const destino = foco(); fechar(); restaurandoFoco = true; destino?.focus({ preventScroll: true });
      queueMicrotask(() => { restaurandoFoco = false; });
    }
    if (evento.key === 'Tab' && menu.classList.contains('open')) {
      const itens = $$('header a, header button, .mobile-nav a, .mobile-nav button, .mobile-nav summary').filter(item => item.offsetParent !== null);
      if (evento.shiftKey && document.activeElement === itens[0]) { evento.preventDefault(); itens.at(-1)?.focus(); }
      else if (!evento.shiftKey && document.activeElement === itens.at(-1)) { evento.preventDefault(); itens[0]?.focus(); }
    }
  });
  desktop.addEventListener('change', fechar);
  const atualizarCabecalho = () => cabecalho.classList.toggle('scrolled', !inicio || scrollY > 35);
  addEventListener('scroll', atualizarCabecalho, { passive: true }); atualizarCabecalho();
  if (!inicio) iniciarFavoritas(raiz, { fechar, foco });
  return { fechar, foco };
}

function iniciarFavoritas(raiz, navegacao) {
  const chave = 'perparte.favoritas.v1';
  const ler = () => {
    try { const valor = JSON.parse(localStorage.getItem(chave) || '[]'); return Array.isArray(valor) ? [...new Set(valor.filter(id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,254}$/.test(id)))].slice(0, 100) : []; }
    catch { return []; }
  };
  const dialogo = document.createElement('dialog');
  dialogo.className = 'nav-favoritas'; dialogo.setAttribute('aria-labelledby', 'nav-favoritas-titulo');
  dialogo.innerHTML = '<button type="button" class="nav-fechar" aria-label="Fechar composições salvas"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><h2 id="nav-favoritas-titulo">Suas composições salvas</h2><div class="nav-favoritas-lista" aria-live="polite"></div><a class="nav-explorar" href="/loja">Explorar a coleção</a>';
  raiz.append(dialogo);
  const lista = dialogo.querySelector('.nav-favoritas-lista');
  let ultimoFoco; let versao = 0;
  const contar = () => { const quantidade = ler().length; raiz.querySelectorAll('.favorites-count').forEach(item => { item.textContent = quantidade; item.hidden = !quantidade; }); };
  async function renderizar() {
    const atual = ++versao; const ids = ler(); contar(); lista.replaceChildren();
    if (!ids.length) { const vazio = document.createElement('p'); vazio.textContent = 'Guarde suas composições favoritas pelo coração na página inicial.'; lista.append(vazio); return; }
    const linhas = ids.map(id => {
      const linha = document.createElement('div'); linha.className = 'nav-favorita';
      const link = document.createElement('a'); link.href = urlProduto(id); link.textContent = 'Composição salva';
      const remover = document.createElement('button'); remover.type = 'button'; remover.textContent = 'Remover'; remover.setAttribute('aria-label', 'Remover composição salva');
      remover.addEventListener('click', () => { try { localStorage.setItem(chave, JSON.stringify(ler().filter(item => item !== id))); renderizar(); (lista.querySelector('button') || dialogo.querySelector('.nav-explorar')).focus(); } catch { remover.textContent = 'Não foi possível remover'; } });
      linha.append(link, remover); lista.append(linha); return { id, link, remover };
    });
    // Lotes pequenos evitam disparar uma consulta por favorita ao mesmo tempo.
    for (let i = 0; i < linhas.length && atual === versao; i += 4) await Promise.all(linhas.slice(i, i + 4).map(async ({ id, link, remover }) => {
      let produto = demoProdutos.find(item => item.handle === id);
      try { const resposta = await apiLoja(`/api/produtos/${encodeURIComponent(id)}`); produto = resposta.produto || produto; } catch { /* Manter link salvo mesmo se o catálogo estiver indisponível. */ }
      if (!produto || atual !== versao) return;
      link.replaceChildren(); link.href = urlProduto(produto);
      const imagem = imagemProduto(produto, varianteInicial(produto)); const src = urlSegura(imagem?.url);
      if (src) { const foto = document.createElement('img'); foto.src = src; foto.alt = ''; link.append(foto); }
      const nome = document.createElement('span'); nome.textContent = produto.title; link.append(nome);
      remover.setAttribute('aria-label', `Remover ${produto.title} das favoritas`);
    }));
  }
  raiz.querySelectorAll('[data-open-favorites]').forEach(botao => botao.addEventListener('click', () => {
    ultimoFoco = navegacao.foco(); navegacao.fechar(); dialogo.showModal(); document.body.classList.add('navegacao-dialogo'); renderizar();
  }));
  dialogo.querySelector('.nav-fechar').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('close', () => { versao++; document.body.classList.remove('navegacao-dialogo'); ultimoFoco?.focus({ preventScroll: true }); });
  dialogo.addEventListener('click', evento => { if (evento.target === dialogo) { const r = dialogo.getBoundingClientRect(); if (evento.clientX < r.left || evento.clientX > r.right || evento.clientY < r.top || evento.clientY > r.bottom) dialogo.close(); } });
  addEventListener('storage', evento => { if (evento.key === chave) { contar(); if (dialogo.open) renderizar(); } });
  contar();
}

if (typeof document !== 'undefined') {
  const raiz = document.querySelector('[data-navegacao-compartilhada]');
  if (raiz) controle = iniciarNavegacao(raiz);
}
