/* Paleta alimentada somente por opções reais do catálogo Shopify. */
let desmontarPaleta = () => {};
export function montarPaleta(coresReferencia, { seletorRegioes = '#colecao, #categorias' } = {}) {
desmontarPaleta();
const regioes = [...document.querySelectorAll(seletorRegioes)];

if (regioes.length && coresReferencia.length) {
  const eventos = new AbortController();
  let observador;
  const seletor = document.createElement('div');
  seletor.className = 'pp-palette';
  seletor.dataset.expanded = 'false';
  seletor.dataset.compact = 'false';
  seletor.setAttribute('aria-hidden', 'true');
  seletor.inert = true;
  seletor.innerHTML = `
    <div class="pp-palette-surface">
      <button class="pp-palette-trigger" type="button" aria-expanded="false" aria-controls="pp-palette-panel" aria-haspopup="dialog" aria-label="Escolher cor da luminária">
        <span class="pp-palette-indicator" aria-hidden="true"></span>
        <span class="pp-palette-label">Escolher cor</span>
      </button>
      <div class="pp-palette-panel" id="pp-palette-panel" role="dialog" aria-label="Escolher cor da luminária" aria-describedby="pp-palette-description" aria-hidden="true" inert>
        <p class="pp-palette-sr-only" id="pp-palette-description">Cores cadastradas no catálogo. A seleção muda a imagem dos produtos que têm essa variante. Use as setas para explorar as cores.</p>
        <div class="pp-palette-grid" role="group" aria-label="Cores disponíveis no catálogo"></div>
      </div>
    </div>
    <div class="pp-palette-close-wrap" aria-hidden="true" inert>
      <button type="button" class="pp-palette-close pp-palette-reset" aria-label="Restaurar cores iniciais" title="Restaurar cores iniciais" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 10a7 7 0 1 1 0 5M5 4v6h6"/></svg>
      </button>
      <button type="button" class="pp-palette-close" aria-label="Fechar seletor de cores">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M7 17 17 7"/></svg>
      </button>
    </div>
    <p class="pp-palette-tooltip" role="tooltip" id="pp-palette-tooltip" hidden></p>
    <p class="pp-palette-sr-only pp-palette-status" role="status" aria-live="polite" aria-atomic="true"></p>
  `;

  const gatilho = seletor.querySelector('.pp-palette-trigger');
  const indicador = seletor.querySelector('.pp-palette-indicator');
  const painel = seletor.querySelector('.pp-palette-panel');
  const grade = seletor.querySelector('.pp-palette-grid');
  const areaFechar = seletor.querySelector('.pp-palette-close-wrap');
  const botaoFechar = seletor.querySelector('.pp-palette-close:not(.pp-palette-reset)');
  const botaoRestaurar = seletor.querySelector('.pp-palette-reset');
  const rotulo = seletor.querySelector('.pp-palette-label');
  const legenda = seletor.querySelector('.pp-palette-tooltip');
  const status = seletor.querySelector('.pp-palette-status');
  const visiveis = new Set();
  let aberta = false;
  let selecionada = -1;
  let quadroFoco = null;
  areaFechar.style.display = 'flex';
  areaFechar.style.justifyContent = 'center';
  areaFechar.style.gap = '8px';
  rotulo.style.maxWidth = '95px';
  rotulo.style.overflow = 'hidden';
  rotulo.style.textOverflow = 'ellipsis';
  rotulo.style.whiteSpace = 'nowrap';

  function esconderLegenda() {
    legenda.hidden = true;
    grade.querySelector('[aria-describedby]')?.removeAttribute('aria-describedby');
  }

  function mostrarLegenda(botao) {
    esconderLegenda();
    legenda.textContent = botao.dataset.nome;
    legenda.hidden = false;
    botao.setAttribute('aria-describedby', legenda.id);
  }

  function focarCor(indice) {
    [...grade.children].forEach((botao, i) => { botao.tabIndex = i === indice ? 0 : -1; });
    grade.children[indice]?.focus({ preventScroll: true });
  }

  function sincronizarCor(nome, anunciar = false) {
    selecionada = coresReferencia.findIndex(([rotuloCor]) => rotuloCor === nome);
    [...grade.children].forEach((botao, i) => { botao.setAttribute('aria-pressed', String(i === selecionada)); botao.tabIndex = i === (selecionada >= 0 ? selecionada : 0) ? 0 : -1; });
    indicador.classList.toggle('has-choice', selecionada >= 0);
    if (selecionada >= 0) indicador.style.setProperty('--pp-palette-choice', coresReferencia[selecionada][1]);
    else indicador.style.removeProperty('--pp-palette-choice');
    rotulo.textContent = nome || 'Escolher cor';
    gatilho.setAttribute('aria-label', nome ? `Alterar cor: ${nome}` : 'Escolher cor da luminária');
    botaoRestaurar.disabled = !nome;
    if (anunciar) status.textContent = nome ? `${nome} selecionada. As obras com essa combinação mostram a imagem cadastrada.` : 'Cores iniciais restauradas.';
  }

  function escolherCor(indice) {
    const [nome] = coresReferencia[indice];
    sincronizarCor(nome, true);
    document.dispatchEvent(new CustomEvent('perparte:cor', { detail: { nome } }));
  }

  coresReferencia.forEach(([nome, cor], indice) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'pp-palette-color';
    botao.style.setProperty('--pp-palette-swatch', cor);
    botao.dataset.nome = nome;
    botao.setAttribute('aria-label', nome);
    botao.setAttribute('aria-pressed', 'false');
    botao.tabIndex = indice === 0 ? 0 : -1;
    botao.addEventListener('click', () => escolherCor(indice));
    botao.addEventListener('pointerenter', () => mostrarLegenda(botao));
    botao.addEventListener('pointerleave', esconderLegenda);
    botao.addEventListener('focus', () => mostrarLegenda(botao));
    botao.addEventListener('blur', esconderLegenda);
    botao.addEventListener('keydown', evento => {
      let proximo;
      if (evento.key === 'ArrowRight') proximo = (indice + 1) % coresReferencia.length;
      if (evento.key === 'ArrowLeft') proximo = (indice + coresReferencia.length - 1) % coresReferencia.length;
      if (evento.key === 'ArrowDown') proximo = Math.min(indice + 7, coresReferencia.length - 1);
      if (evento.key === 'ArrowUp') proximo = Math.max(indice - 7, 0);
      if (evento.key === 'Home') proximo = 0;
      if (evento.key === 'End') proximo = coresReferencia.length - 1;
      if (proximo !== undefined) {
        evento.preventDefault();
        focarCor(proximo);
      }
    });
    grade.append(botao);
  });

  function abrir() {
    if (seletor.inert || aberta) return;
    aberta = true;
    seletor.dataset.expanded = 'true';
    gatilho.setAttribute('aria-expanded', 'true');
    gatilho.inert = true;
    painel.inert = false;
    painel.setAttribute('aria-hidden', 'false');
    areaFechar.inert = false;
    areaFechar.setAttribute('aria-hidden', 'false');
    // A grade só aceita foco depois de o navegador aplicar sua visibilidade.
    quadroFoco = requestAnimationFrame(() => {
      quadroFoco = requestAnimationFrame(() => {
        quadroFoco = null;
        if (aberta && !seletor.inert) focarCor(selecionada >= 0 ? selecionada : 0);
      });
    });
  }

  function fechar(devolverFoco = true) {
    if (!aberta) return;
    aberta = false;
    cancelAnimationFrame(quadroFoco);
    quadroFoco = null;
    seletor.dataset.expanded = 'false';
    seletor.dataset.compact = 'true';
    gatilho.inert = false;
    gatilho.setAttribute('aria-expanded', 'false');
    if (devolverFoco && !seletor.inert) gatilho.focus({ preventScroll: true });
    painel.inert = true;
    painel.setAttribute('aria-hidden', 'true');
    areaFechar.inert = true;
    areaFechar.setAttribute('aria-hidden', 'true');
    esconderLegenda();
  }

  gatilho.addEventListener('click', abrir);
  botaoFechar.addEventListener('click', () => fechar());
  botaoRestaurar.addEventListener('click', () => {
    sincronizarCor('', true);
    try { sessionStorage.removeItem('perparte.cor-catalogo.v1'); } catch { /* A restauração funciona sem persistência. */ }
    document.dispatchEvent(new CustomEvent('perparte:cor', { detail: { nome: '' } }));
    focarCor(0);
  });
  document.addEventListener('perparte:cor', evento => sincronizarCor(evento.detail?.nome || ''), { signal: eventos.signal });
  try { sincronizarCor(sessionStorage.getItem('perparte.cor-catalogo.v1') || ''); } catch { sincronizarCor(''); }
  seletor.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && aberta) {
      evento.preventDefault();
      evento.stopPropagation();
      fechar();
    }
  });
  seletor.addEventListener('focusout', evento => {
    if (aberta && evento.relatedTarget && !seletor.contains(evento.relatedTarget)) fechar(false);
  });
  document.addEventListener('pointerdown', evento => {
    if (aberta && !seletor.contains(evento.target)) fechar(false);
  }, { signal: eventos.signal });

  function atualizarVisibilidade() {
    const obstruido = document.body.classList.contains('modal-open') || document.querySelector('dialog[open], #site-header.menu-open, #site-header.mega-open');
    const visivel = visiveis.size > 0 && !obstruido;
    if (!visivel) {
      fechar(false);
      if (seletor.contains(document.activeElement)) document.activeElement.blur();
    }
    seletor.classList.toggle('is-visible', visivel);
    seletor.inert = !visivel;
    seletor.setAttribute('aria-hidden', String(!visivel));
  }

  document.body.append(seletor);
  if ('IntersectionObserver' in window) {
    observador = new IntersectionObserver(entradas => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) visiveis.add(entrada.target);
        else visiveis.delete(entrada.target);
      });
      atualizarVisibilidade();
    }, { threshold: 0 });
    regioes.forEach(regiao => observador.observe(regiao));
  } else {
    const conferirRegioes = () => {
      regioes.forEach(regiao => {
        const limites = regiao.getBoundingClientRect();
        if (limites.top < innerHeight && limites.bottom > 0) visiveis.add(regiao);
        else visiveis.delete(regiao);
      });
      atualizarVisibilidade();
    };
    addEventListener('scroll', conferirRegioes, { passive: true, signal: eventos.signal });
    addEventListener('resize', conferirRegioes, { passive: true, signal: eventos.signal });
    conferirRegioes();
  }

  const observarSobreposicoes = new MutationObserver(atualizarVisibilidade);
  observarSobreposicoes.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const cabecalho = document.querySelector('#site-header');
  if (cabecalho) observarSobreposicoes.observe(cabecalho, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('dialog').forEach(dialogo => observarSobreposicoes.observe(dialogo, { attributes: true, attributeFilter: ['open'] }));
  desmontarPaleta = () => {
    cancelAnimationFrame(quadroFoco);
    eventos.abort();
    observador?.disconnect();
    observarSobreposicoes.disconnect();
    seletor.remove();
  };
}

}
