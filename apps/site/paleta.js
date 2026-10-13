/* Estudo visual da interação Gantri. Cores e ordem medidas em
 * docs/pesquisa/gantri-revisao/paleta-medida.json.
 * Não são tokens da Per Parte nem filamentos disponíveis para compra. */
const coresReferencia = [
  ['Flor', 'rgb(203, 140, 123)'],
  ['Cânion', 'rgb(161, 41, 40)'],
  ['Carvão', 'rgb(46, 47, 49)'],
  ['Cobalto', 'rgb(0, 58, 165)'],
  ['Líquen', 'rgb(249, 234, 100)'],
  ['Lilás', 'rgb(205, 219, 252)'],
  ['Magnólia', 'rgb(249, 202, 220)'],
  ['Manzanita', 'rgb(104, 47, 54)'],
  ['Prado', 'rgb(196, 205, 186)'],
  ['Meia-noite', 'rgb(37, 65, 103)'],
  ['Névoa', 'rgb(193, 198, 200)'],
  ['Mostarda', 'rgb(209, 144, 0)'],
  ['Oliva', 'rgb(94, 103, 56)'],
  ['Pêssego', 'rgb(243, 207, 179)'],
  ['Caqui', 'rgb(242, 125, 59)'],
  ['Papoula', 'rgb(225, 6, 0)'],
  ['Sálvia', 'rgb(110, 152, 112)'],
  ['Areia', 'rgb(223, 213, 190)'],
  ['Sedona', 'rgb(137, 67, 31)'],
  ['Fumaça', 'rgb(131, 120, 111)'],
  ['Neve', 'rgb(241, 241, 241)'],
  ['Abeto', 'rgb(2, 69, 62)'],
  ['Pedra', 'rgb(225, 219, 214)'],
  ['Amanhecer', 'rgb(241, 189, 86)'],
  ['Nogueira', 'rgb(99, 81, 61)']
];

const regioes = [...document.querySelectorAll('#colecao, #categorias')];

if (regioes.length) {
  const seletor = document.createElement('div');
  seletor.className = 'pp-palette';
  seletor.dataset.expanded = 'false';
  seletor.dataset.compact = 'false';
  seletor.setAttribute('aria-hidden', 'true');
  seletor.inert = true;
  seletor.innerHTML = `
    <div class="pp-palette-surface">
      <button class="pp-palette-trigger" type="button" aria-expanded="false" aria-controls="pp-palette-panel" aria-haspopup="dialog" aria-label="Escolher cor de referência">
        <span class="pp-palette-indicator" aria-hidden="true"></span>
        <span class="pp-palette-label">Escolher cor</span>
      </button>
      <div class="pp-palette-panel" id="pp-palette-panel" role="dialog" aria-label="Escolher cor de referência" aria-describedby="pp-palette-description" aria-hidden="true" inert>
        <p class="pp-palette-sr-only" id="pp-palette-description">Paleta de referência do estudo visual. As cores não representam filamentos disponíveis e não alteram as imagens das luminárias. Use as setas para explorar as cores.</p>
        <div class="pp-palette-grid" role="group" aria-label="25 cores de referência"></div>
      </div>
    </div>
    <div class="pp-palette-close-wrap" aria-hidden="true" inert>
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
  const botaoFechar = seletor.querySelector('.pp-palette-close');
  const legenda = seletor.querySelector('.pp-palette-tooltip');
  const status = seletor.querySelector('.pp-palette-status');
  const visiveis = new Set();
  let aberta = false;
  let selecionada = -1;
  let quadroFoco = null;

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

  function escolherCor(indice) {
    selecionada = indice;
    const [nome, cor] = coresReferencia[indice];
    [...grade.children].forEach((botao, i) => botao.setAttribute('aria-pressed', String(i === indice)));
    indicador.style.setProperty('--pp-palette-choice', cor);
    indicador.classList.add('has-choice');
    gatilho.setAttribute('aria-label', `Alterar cor de referência: ${nome}`);
    status.textContent = `${nome} selecionada neste estudo visual. As imagens das luminárias permanecem iguais.`;
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
  });

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
    const observador = new IntersectionObserver(entradas => {
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
    addEventListener('scroll', conferirRegioes, { passive: true });
    addEventListener('resize', conferirRegioes, { passive: true });
    conferirRegioes();
  }

  const observarSobreposicoes = new MutationObserver(atualizarVisibilidade);
  observarSobreposicoes.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const cabecalho = document.querySelector('#site-header');
  if (cabecalho) observarSobreposicoes.observe(cabecalho, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('dialog').forEach(dialogo => observarSobreposicoes.observe(dialogo, { attributes: true, attributeFilter: ['open'] }));
}
