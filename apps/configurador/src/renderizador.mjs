/**
 * Desenho paramétrico original: projeção ortográfica, superfícies ordenadas por
 * profundidade e traço fino. Inspirado na linguagem visual do Hairline;
 * nenhuma geometria ou implementação do pacote foi copiada.
 * As dimensões descrevem um estudo visual, não um arquivo de fabricação.
 */
import { CORES, LIMITES } from './dominio.mjs';

const PARTES = ['base', 'corpo', 'difusor'];
const NOMES = { base: 'Base', corpo: 'Corpo', difusor: 'Difusor' };
const TAU = Math.PI * 2;
const ANGULO_INICIAL = -0.46;
const INCLINACAO = 0.19;
const SVG_NS = 'http://www.w3.org/2000/svg';
const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));
const numero = valor => Number(valor).toFixed(2);
const interpolar = (a, b, t) => a + (b - a) * t;

function normalizarPartes(modelo) {
  return PARTES.map(id => {
    const parte = modelo?.partes?.[id] || modelo?.[id] || {};
    return {
      id, forma: parte.forma || 'circulo', variacao: parte.variacao || 'liso',
      largura: limitar(Number(parte.largura) || LIMITES[id].largura.padrao, LIMITES[id].largura.min, LIMITES[id].largura.max),
      altura: limitar(Number(parte.altura) || LIMITES[id].altura.padrao, LIMITES[id].altura.min, LIMITES[id].altura.max),
      cor: parte.cor || 'luz',
    };
  });
}

function corSuperficie(id, luz, colorido) {
  const hex = colorido ? (CORES.find(cor => cor.id === id)?.hex || '#F6E7C4') : '#eeeee9';
  const base = hex.replace('#', '').match(/.{2}/g).map(valor => parseInt(valor, 16));
  const clareza = colorido ? 0.09 : 0.02;
  return `rgb(${base.map(canal => Math.round(limitar((canal + (255 - canal) * clareza) * luz, 0, 255))).join(',')})`;
}

function secao(forma, angulo) {
  if (forma === 'quadrado') {
    const x = Math.cos(angulo), z = Math.sin(angulo);
    return [Math.sign(x) * Math.abs(x) ** 0.30, Math.sign(z) * Math.abs(z) ** 0.30];
  }
  if (forma === 'triangulo') {
    const posicao = ((angulo / TAU) % 1 + 1) % 1 * 3;
    const indice = Math.floor(posicao), t = posicao - indice;
    const a = -Math.PI / 2 + indice * TAU / 3, b = a + TAU / 3;
    return [interpolar(Math.cos(a), Math.cos(b), t) / 0.8660254, interpolar(Math.sin(a), Math.sin(b), t)];
  }
  return [Math.cos(angulo), Math.sin(angulo)];
}

function perfil(parte, t) {
  // Lábios discretos e ombros arredondados mantêm as três partes legíveis.
  if (parte.id === 'base') return 0.96 + 0.04 * Math.sin(Math.PI * t);
  if (parte.id === 'corpo') return 0.90 + 0.10 * Math.sin(Math.PI * t);
  return 1 - 0.30 * t + 0.035 * Math.sin(Math.PI * t);
}

function pontoDaParte(parte, angulo, t, piso) {
  const [x, z] = secao(parte.forma, angulo);
  const onda = parte.variacao === 'ondulado' ? 0.94 + 0.06 * Math.cos(angulo * 16) : 1;
  const raio = parte.largura / 2 * perfil(parte, t) * onda;
  return [x * raio, piso + parte.altura * t, z * raio];
}

function criarProjecao(partes, tamanho, angulo, zoom, miniatura) {
  const altura = partes.reduce((total, parte) => total + parte.altura, 0);
  const maiorLargura = Math.max(...partes.map(parte => parte.largura));
  const margem = miniatura ? 0.81 : 0.66;
  // A diagonal limita o enquadramento mesmo ao girar bases quadradas.
  const escala = Math.min(tamanho * margem / (altura + maiorLargura * 0.20), tamanho * (miniatura ? 0.72 : 0.58) / (maiorLargura * 1.40)) * zoom;
  const centroX = tamanho / 2, centroY = tamanho * (miniatura ? 0.52 : 0.49);
  const cos = Math.cos(angulo), sin = Math.sin(angulo);
  const cosElevacao = Math.cos(INCLINACAO), sinElevacao = Math.sin(INCLINACAO);
  const projetar = ([x, y, z]) => {
    const horizontal = x * cos + z * sin, profundidade = -x * sin + z * cos;
    return [centroX + horizontal * escala, centroY - (y - altura / 2) * escala * cosElevacao + profundidade * escala * sinElevacao, profundidade * cosElevacao + y * sinElevacao];
  };
  return { projetar, escala, altura };
}

const caminho = pontos => `M${pontos.map(ponto => `${numero(ponto[0])},${numero(ponto[1])}`).join('L')}Z`;
const linha = pontos => `M${pontos.map(ponto => `${numero(ponto[0])},${numero(ponto[1])}`).join('L')}`;

function geometria(modelo, opcoes = {}) {
  const tamanho = opcoes.tamanho || 600;
  const miniatura = Boolean(opcoes.miniatura);
  const partes = normalizarPartes(modelo);
  const { projetar, escala, altura } = criarProjecao(partes, tamanho, opcoes.angulo ?? ANGULO_INICIAL, opcoes.zoom || 1, miniatura);
  const objetos = [], silhuetas = [], limites = {};
  const traco = opcoes.colorido ? '#3e4039' : '#525c56';
  let piso = 0;

  for (const parte of partes) {
    const inicio = piso;
    const segmentos = parte.variacao === 'ondulado' ? (miniatura ? 48 : 64) : parte.forma === 'triangulo' ? (miniatura ? 24 : 36) : (miniatura ? 32 : 40);
    const faixas = parte.variacao === 'perfurado' ? (miniatura ? 5 : 8) : parte.variacao === 'vazado' ? (miniatura ? 4 : 6) : (miniatura ? 3 : 5);
    const pontosLimite = [];
    const avaliar = (a, t) => projetar(pontoDaParte(parte, a, t, inicio));
    for (let i = 0; i < segmentos; i++) {
      const a = i * TAU / segmentos, b = (i + 1) * TAU / segmentos;
      for (let j = 0; j < faixas; j++) {
        const t0 = j / faixas, t1 = (j + 1) / faixas;
        const pontos = [avaliar(a, t0), avaliar(b, t0), avaliar(b, t1), avaliar(a, t1)];
        pontosLimite.push(...pontos);
        if (parte.variacao === 'vazado' && j > 0 && j < faixas - 1 && Math.floor(i / 2) % 2 === 1) continue;

        const medio = (a + b) / 2;
        const normal = Math.cos(medio - 3.9) * 0.07 + Math.sin(medio + (opcoes.angulo ?? ANGULO_INICIAL)) * 0.045;
        const luz = 0.94 + normal + t1 * 0.035;
        const preenchimento = corSuperficie(parte.cor, luz, opcoes.colorido);
        let contorno = caminho(pontos), abertura = '';

        // Aberturas recortadas na própria superfície: o verso aparece através.
        if (parte.variacao === 'perfurado' && i % 3 === 1 && j > 0 && j < faixas - 1) {
          const centroA = medio, centroT = (t0 + t1) / 2;
          const furo = Array.from({ length: 12 }, (_, k) => {
            const theta = TAU * k / 12;
            return avaliar(centroA + (b - a) * 0.39 * Math.cos(theta), centroT + (t1 - t0) * 0.30 * Math.sin(theta));
          });
          abertura = caminho(furo);
          contorno += abertura;
        }

        const nervuras = [];
        const camadas = miniatura ? 2 : 4;
        for (let r = 1; r <= camadas; r++) {
          const t = interpolar(t0, t1, r / camadas);
          if (abertura && r !== camadas) continue;
          nervuras.push(linha([avaliar(a, t), avaliar(b, t)]));
        }
        const detalhe = parte.variacao === 'ondulado' || parte.variacao === 'vazado';
        const bordaVertical = detalhe ? linha([pontos[0], pontos[3]]) : '';
        const profundidade = pontos.reduce((total, p) => total + p[2], 0) / pontos.length;
        objetos.push({ profundidade, svg: `<g data-parte="${parte.id}"><path d="${contorno}" fill="${preenchimento}" fill-rule="evenodd" stroke="${preenchimento}" stroke-width=".38"/><path d="${nervuras.join('')}" fill="none" stroke="${traco}" stroke-width="${miniatura ? '.35' : '.42'}" opacity=".24"/>${bordaVertical ? `<path d="${bordaVertical}" fill="none" stroke="${traco}" stroke-width=".48" opacity=".40"/>` : ''}${abertura ? `<path d="${abertura}" fill="none" stroke="${traco}" stroke-width=".65" opacity=".65"/>` : ''}</g>` });
      }
    }

    for (const t of [0, 1]) {
      const aro = Array.from({ length: segmentos }, (_, i) => avaliar(i * TAU / segmentos, t));
      let d = caminho(aro);
      // Boca superior do difusor, com um pequeno lábio de espessura visual.
      if (parte.id === 'difusor' && t === 1) {
        const interno = Array.from({ length: segmentos }, (_, i) => {
          const p = pontoDaParte(parte, (segmentos - i - 1) * TAU / segmentos, t, inicio);
          return projetar([p[0] * .81, p[1], p[2] * .81]);
        });
        d += caminho(interno);
      }
      const profundidade = aro.reduce((total, p) => total + p[2], 0) / aro.length;
      objetos.push({ profundidade: profundidade + (t === 1 ? .05 : -.05), svg: `<path data-parte="${parte.id}" d="${d}" fill="${corSuperficie(parte.cor, t === 1 ? 1.045 : .88, opcoes.colorido)}" fill-rule="evenodd" stroke="${traco}" stroke-opacity=".66" stroke-width="${miniatura ? '.7' : '.85'}" stroke-linejoin="round"/>` });
    }

    const esquerda = [], direita = [];
    for (let j = 0; j <= faixas; j++) {
      const secaoProjetada = Array.from({ length: segmentos }, (_, i) => avaliar(i * TAU / segmentos, j / faixas));
      esquerda.push(secaoProjetada.reduce((a, b) => a[0] < b[0] ? a : b));
      direita.push(secaoProjetada.reduce((a, b) => a[0] > b[0] ? a : b));
    }
    silhuetas.push(`<path d="${linha(esquerda)}${linha(direita)}" fill="none" stroke="${traco}" stroke-width="${miniatura ? '.65' : '.85'}" stroke-opacity=".65" stroke-linejoin="round" pointer-events="none"/>`);
    limites[parte.id] = {
      minX: Math.min(...pontosLimite.map(p => p[0])), maxX: Math.max(...pontosLimite.map(p => p[0])),
      minY: Math.min(...pontosLimite.map(p => p[1])), maxY: Math.max(...pontosLimite.map(p => p[1])),
      topo: projetar([0, inicio + parte.altura, 0])[1], fundo: projetar([0, inicio, 0])[1], parte,
    };
    piso += parte.altura;
  }

  objetos.sort((a, b) => a.profundidade - b.profundidade);
  const pisoY = projetar([0, 0, 0])[1];
  const guia = miniatura ? '' : `<path d="M${numero(tamanho * .22)},${numero(pisoY + 30)}H${numero(tamanho * .78)}" fill="none" stroke="#a3a79d" stroke-width=".6" opacity=".22"/><path d="M${numero(tamanho / 2 - 4)},${numero(pisoY + 30)}h8m-4,-4v8" fill="none" stroke="#91998c" stroke-width=".65" opacity=".40"/>`;
  return { svg: guia + objetos.map(objeto => objeto.svg).join('') + silhuetas.join(''), limites, escala, altura, tamanho };
}

function cotasDaParte(desenho, parteAtiva) {
  const caixa = desenho.limites[parteAtiva];
  if (!caixa) return '';
  const { parte } = caixa;
  const y = Math.min(desenho.tamanho - 40, caixa.maxY + 26);
  const x = Math.min(desenho.tamanho - 48, caixa.maxX + 34);
  const meioX = (caixa.minX + caixa.maxX) / 2;
  const meioY = (caixa.topo + caixa.fundo) / 2;
  const cor = '#8a473b';
  const linhaLargura = 'M'+numero(caixa.minX)+','+numero(y)+'H'+numero(caixa.maxX);
  const linhaAltura = 'M'+numero(x)+','+numero(caixa.topo)+'V'+numero(caixa.fundo);
  const rotulo = (chave, transformacao) => '<g transform="'+transformacao+'" stroke="none" fill="'+cor+'" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle"><rect x="-34" y="-8" width="68" height="17" rx="5" fill="#f5f3ed" fill-opacity=".94"/><text y="4">'+parte[chave]+' mm</text></g>';
  const handle = (chave, px, py, orientacao, d, conteudo) => '<g data-dimensao="'+chave+'" role="slider" tabindex="0" aria-label="'+(chave==='largura'?'Largura':'Altura')+': '+NOMES[parte.id]+'" aria-valuemin="'+LIMITES[parte.id][chave].min+'" aria-valuemax="'+LIMITES[parte.id][chave].max+'" aria-valuenow="'+parte[chave]+'" aria-valuetext="'+parte[chave]+' milímetros" aria-orientation="'+orientacao+'" style="cursor:'+(chave==='largura'?'ew':'ns')+'-resize;outline:none"><path d="'+d+'" stroke="transparent" stroke-width="22" pointer-events="stroke"/><path d="'+d+'"/><circle cx="'+numero(px)+'" cy="'+numero(py)+'" r="19" fill="transparent" stroke="none"/><circle class="cota-puxador" cx="'+numero(px)+'" cy="'+numero(py)+'" r="5.4" fill="#faf7f0" stroke="'+cor+'" stroke-width="1.2"/>'+conteudo+'</g>';
  const ticks = '<path d="M'+numero(caixa.minX)+','+numero(y-8)+'v16M'+numero(caixa.maxX)+','+numero(y-8)+'v16M'+numero(x-8)+','+numero(caixa.topo)+'h16M'+numero(x-8)+','+numero(caixa.fundo)+'h16" pointer-events="none"/>';
  const guias = '<path d="M'+numero(caixa.minX)+','+numero(caixa.maxY+6)+'V'+numero(y-10)+'M'+numero(caixa.maxX)+','+numero(caixa.maxY+6)+'V'+numero(y-10)+'M'+numero(caixa.maxX+8)+','+numero(caixa.topo)+'H'+numero(x-10)+'M'+numero(caixa.maxX+8)+','+numero(caixa.fundo)+'H'+numero(x-10)+'" opacity=".35" stroke-dasharray="3 4" pointer-events="none"/>';
  return '<g class="cotas" fill="none" stroke="'+cor+'" stroke-width=".85">'+guias+ticks+handle('largura',caixa.maxX,y,'horizontal',linhaLargura,rotulo('largura','translate('+numero(meioX)+','+numero(y)+')'))+handle('altura',x,caixa.topo,'vertical',linhaAltura,rotulo('altura','translate('+numero(x+17)+','+numero(meioY)+') rotate(-90)'))+'</g>';
}

/** Miniatura inteiramente vetorial; não depende do DOM. */
export function renderizarMiniatura(modelo, opcoes = {}) {
  const desenho = geometria(modelo, { ...opcoes, tamanho: 400, miniatura: true, colorido: opcoes.colorido ?? true });
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 400 400" aria-hidden="true" focusable="false" class="miniatura-obra">${desenho.svg}</svg>`;
}

/** Mantém o SVG estável para preservar captura do ponteiro durante mudanças. */
export function criarVisualizador(container, opcoes = {}) {
  let estado = { modelo: opcoes.modelo, parteAtiva: opcoes.parteAtiva || 'base', colorido: opcoes.colorido ?? false, mostrarCotas: opcoes.mostrarCotas ?? true };
  let angulo = ANGULO_INICIAL, fatorZoom = 1, arraste = null, desenho, quadro = null, destruido = false;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 600 600');
  svg.setAttribute('role', 'group');
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-label', 'Visualização da sua luminária. Arraste para girar; use as setas esquerda e direita pelo teclado. As cotas permitem ajustar a parte selecionada.');
  svg.setAttribute('class', 'visualizador-svg');
  svg.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;user-select:none;cursor:grab;overflow:visible';
  container.replaceChildren(svg);

  function desenhar() {
    if (destruido) return;
    quadro = null;
    const foco = svg.contains(document.activeElement) ? document.activeElement?.getAttribute?.('data-dimensao') : null;
    desenho = geometria(estado.modelo, { angulo, zoom: fatorZoom, colorido: estado.colorido });
    svg.innerHTML = `<style>.cota-puxador{transition:r .12s ease} [data-dimensao]:hover .cota-puxador,[data-dimensao]:focus-visible .cota-puxador{r:8;stroke-width:2} @media(prefers-reduced-motion:reduce){.cota-puxador{transition:none}}</style>${desenho.svg}${estado.mostrarCotas ? cotasDaParte(desenho, estado.parteAtiva) : ''}`;
    if (foco && !arraste) svg.querySelector(`[data-dimensao="${foco}"]`)?.focus({ preventScroll: true });
  }
  function agendar() {
    if (quadro === null && !destruido) quadro = requestAnimationFrame(desenhar);
  }
  function local(evento) {
    const ponto = new DOMPoint(evento.clientX, evento.clientY);
    const matriz = svg.getScreenCTM();
    return matriz ? ponto.matrixTransform(matriz.inverse()) : ponto;
  }
  function ajustar(chave, valor, parte = estado.parteAtiva) {
    const regra = LIMITES[parte][chave];
    const novo = limitar(Math.round(valor), regra.min, regra.max);
    const atual = estado.modelo?.partes?.[parte] || estado.modelo?.[parte];
    if (!atual || Number(atual[chave]) === novo) return;
    estado = { ...estado, modelo: { ...estado.modelo, partes: { ...(estado.modelo?.partes || {}), [parte]: { ...atual, [chave]: novo } } } };
    opcoes.onDimensao?.(parte, chave, novo);
    agendar();
  }
  function iniciar(evento) {
    if (evento.button !== 0 || arraste) return;
    const alvoCota = evento.target.closest?.('[data-dimensao]');
    const alvoParte = evento.target.closest?.('[data-parte]');
    const p = local(evento);
    const parte = estado.parteAtiva;
    const chave = alvoCota?.getAttribute('data-dimensao');
    const caixa = desenho.limites[parte];
    arraste = { id: evento.pointerId, x: p.x, y: p.y, angulo, chave, parte, valor: chave ? caixa.parte[chave] : 0, escala: chave === 'largura' ? (caixa.maxX - caixa.minX) / caixa.parte.largura : desenho.escala * Math.cos(INCLINACAO), movido: false, selecionar: alvoParte?.getAttribute('data-parte') };
    svg.setPointerCapture(evento.pointerId);
    svg.style.cursor = chave ? `${chave === 'largura' ? 'ew' : 'ns'}-resize` : 'grabbing';
    if (chave) alvoCota.focus({ preventScroll: true });
    else svg.focus({ preventScroll: true });
    evento.preventDefault();
  }
  function mover(evento) {
    if (!arraste || evento.pointerId !== arraste.id) return;
    const p = local(evento), dx = p.x - arraste.x, dy = p.y - arraste.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) arraste.movido = true;
    if (arraste.chave) ajustar(arraste.chave, arraste.valor + (arraste.chave === 'largura' ? dx : -dy) / arraste.escala, arraste.parte);
    else { angulo = arraste.angulo + dx * .011; agendar(); }
  }
  function encerrar(evento) {
    if (!arraste || evento.pointerId !== arraste.id) return;
    const anterior = arraste;
    arraste = null;
    if (svg.hasPointerCapture(evento.pointerId)) svg.releasePointerCapture(evento.pointerId);
    svg.style.cursor = 'grab';
    if (anterior.chave) svg.querySelector(`[data-dimensao="${anterior.chave}"]`)?.focus({ preventScroll: true });
    else if (!anterior.movido && anterior.selecionar && evento.type !== 'pointercancel') opcoes.onSelecionarParte?.(anterior.selecionar);
  }
  function teclado(evento) {
    const chave = evento.target.closest?.('[data-dimensao]')?.getAttribute('data-dimensao');
    if (chave && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(evento.key)) {
      evento.preventDefault(); evento.stopPropagation();
      const parte = estado.parteAtiva, atual = desenho.limites[parte].parte[chave];
      const passo = evento.shiftKey ? 10 : 1;
      ajustar(chave, evento.key === 'Home' ? LIMITES[parte][chave].min : evento.key === 'End' ? LIMITES[parte][chave].max : atual + (['ArrowRight', 'ArrowUp'].includes(evento.key) ? passo : -passo));
    } else if (['ArrowLeft', 'ArrowRight'].includes(evento.key)) {
      evento.preventDefault(); angulo += evento.key === 'ArrowRight' ? .12 : -.12; agendar();
    } else if (evento.key === 'Home') {
      evento.preventDefault(); angulo = ANGULO_INICIAL; fatorZoom = 1; agendar();
    }
  }
  const eventos = { pointerdown: iniciar, pointermove: mover, pointerup: encerrar, pointercancel: encerrar, lostpointercapture: encerrar, keydown: teclado };
  for (const [nome, funcao] of Object.entries(eventos)) svg.addEventListener(nome, funcao);
  desenhar();

  return {
    atualizar(proximo = {}) { estado = { ...estado, ...proximo }; agendar(); },
    girar(delta = 15) { angulo += Number(delta) * Math.PI / 180; agendar(); },
    zoom(delta = .1) { fatorZoom = limitar(fatorZoom + Number(delta), .7, 1.3); agendar(); },
    resetar() { angulo = ANGULO_INICIAL; fatorZoom = 1; agendar(); },
    destruir() {
      destruido = true;
      if (quadro !== null) cancelAnimationFrame(quadro);
      for (const [nome, funcao] of Object.entries(eventos)) svg.removeEventListener(nome, funcao);
      svg.remove();
    },
  };
}
