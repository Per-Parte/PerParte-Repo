/**
 * Desenho paramétrico original: projeção ortográfica, superfícies ordenadas por
 * profundidade e traço fino. Inspirado na linguagem visual do Hairline;
 * nenhuma geometria ou implementação do pacote foi copiada.
 * As dimensões descrevem um estudo visual, não um arquivo de fabricação.
 */
import { CORES, LIMITES, posicionarPecas } from './dominio.mjs';

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
    const x = Math.cos(angulo), z = Math.sin(angulo), fator = 1 / Math.max(Math.abs(x), Math.abs(z));
    return [x * fator, z * fator];
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

function geometriaLegada(modelo, opcoes = {}) {
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
  const guia = '';
  return { svg: guia + objetos.map(objeto => objeto.svg).join('') + silhuetas.join(''), limites, escala, altura, tamanho };
}

function faceDaSecao(angulo) {
  const x = Math.cos(angulo), z = Math.sin(angulo);
  return Math.abs(x) > Math.abs(z) ? (x > 0 ? 'direita' : 'esquerda') : (z > 0 ? 'frente' : 'tras');
}

/** Escala automática baseada nos extremos do modelo após a projeção da câmera. */
export function calcularEnquadramento(bbox, largura, altura, padding = 48, angulo = ANGULO_INICIAL, elevacao = .46) {
  const centro = [(bbox.minX+bbox.maxX)/2,(bbox.minY+bbox.maxY)/2,(bbox.minZ+bbox.maxZ)/2];
  const ca=Math.cos(angulo),sa=Math.sin(angulo),ce=Math.cos(elevacao),se=Math.sin(elevacao),pontos=[];
  for(const x of [bbox.minX,bbox.maxX])for(const y of [bbox.minY,bbox.maxY])for(const z of [bbox.minZ,bbox.maxZ]){
    const dx=x-centro[0],dy=y-centro[1],dz=z-centro[2],h=dx*ca-dz*sa,d=dx*sa+dz*ca;
    pontos.push([h,-dy*ce+d*se]);
  }
  const sx=Math.max(...pontos.map(p=>p[0]))-Math.min(...pontos.map(p=>p[0]));
  const sy=Math.max(...pontos.map(p=>p[1]))-Math.min(...pontos.map(p=>p[1]));
  const pads=typeof padding==='number'?{left:padding,right:padding,top:padding,bottom:padding}:padding;
  return Math.max(.01,Math.min((largura-pads.left-pads.right)/Math.max(1,sx),(altura-pads.top-pads.bottom)/Math.max(1,sy)));
}

function geometriaMontagem(modelo, opcoes = {}) {
  const miniatura = Boolean(opcoes.miniatura);
  const largura = opcoes.largura || opcoes.tamanho || 600;
  const alturaViewport = opcoes.altura || opcoes.tamanho || 600;
  const posicionadas = posicionarPecas(modelo);
  const { bbox, pecas } = posicionadas;
  const angulo = opcoes.angulo ?? ANGULO_INICIAL;
  const elevacao = limitar(opcoes.elevacao ?? 0.46, -1.25, 1.25);
  const centroMundo = [(bbox.minX+bbox.maxX)/2,(bbox.minY+bbox.maxY)/2,(bbox.minZ+bbox.maxZ)/2];
  const cosA=Math.cos(angulo),sinA=Math.sin(angulo),cosE=Math.cos(elevacao),sinE=Math.sin(elevacao);
  const transformar = p => {
    const x=p[0]-centroMundo[0],y=p[1]-centroMundo[1],z=p[2]-centroMundo[2];
    const horizontal=x*cosA-z*sinA,profundidade=x*sinA+z*cosA;
    return [horizontal,-y*cosE+profundidade*sinE,profundidade*cosE+y*sinE];
  };
  const cantos=[];
  for(const x of [bbox.minX,bbox.maxX])for(const y of [bbox.minY,bbox.maxY])for(const z of [bbox.minZ,bbox.maxZ])cantos.push(transformar([x,y,z]));
  const minX=Math.min(...cantos.map(p=>p[0])),maxX=Math.max(...cantos.map(p=>p[0]));
  const minY=Math.min(...cantos.map(p=>p[1])),maxY=Math.max(...cantos.map(p=>p[1]));
  const margens=miniatura?{left:32,right:32,top:32,bottom:32}:(opcoes.mostrarCotas
    ?{left:28,right:68,top:34,bottom:48}
    :{left:28,right:28,top:28,bottom:28});
  const escala=calcularEnquadramento(bbox,largura,alturaViewport,margens,angulo,elevacao)*(opcoes.zoom||1);
  const centroTelaX=(margens.left+largura-margens.right)/2, centroTelaY=(margens.top+alturaViewport-margens.bottom)/2;
  const projetar=p=>{const q=transformar(p);return [centroTelaX+q[0]*escala,centroTelaY+q[1]*escala,q[2]];};
  const objetos=[],limites={};
  for(const peca of pecas){
    const segmentos=peca.variacao==='ondulado'?(miniatura?48:64):peca.forma==='triangulo'?(miniatura?24:36):(miniatura?32:48);
    const faixas=peca.variacao==='perfurado'?(miniatura?5:8):peca.variacao==='vazado'?(miniatura?4:6):(miniatura?3:5);
    const inicio=peca.y-peca.altura/2, pontos=[];
    const avaliar=(a,t)=>{
      const [ux,uz]=secao(peca.forma,a), onda=peca.variacao==='ondulado'?.94+.06*Math.cos(a*16):1;
      const perfil=peca.forma==='quadrado'?1:(peca.tipo==='difusor'?1-.30*t+.035*Math.sin(Math.PI*t):.96+.04*Math.sin(Math.PI*t));
      const raio=peca.largura/2*perfil*onda;
      const p=projetar([peca.x+ux*raio,inicio+peca.altura*t,peca.z+uz*raio]);pontos.push(p);return p;
    };
    for(let i=0;i<segmentos;i++){
      const a=i*TAU/segmentos,b=(i+1)*TAU/segmentos,medio=(a+b)/2,face=faceDaSecao(medio);
      const pa=secao(peca.forma,a),pb=secao(peca.forma,b);
      const nx=pb[1]-pa[1],nz=pa[0]-pb[0];
      const produto=nx*Math.sin(angulo)*Math.cos(elevacao)+nz*Math.cos(angulo)*Math.cos(elevacao);
      if(produto<=1e-6)continue;
      for(let j=0;j<faixas;j++){
        if(peca.variacao==='vazado'&&j>0&&j<faixas-1&&Math.floor(i/2)%2===1)continue;
        const t0=j/faixas,t1=(j+1)/faixas,quad=[avaliar(a,t0),avaliar(b,t0),avaliar(b,t1),avaliar(a,t1)];
        const depth=quad.reduce((s,p)=>s+p[2],0)/quad.length;
        const luz=.92+.055*Math.cos(medio-3.9)+t1*.04;
        const fill=corSuperficie(peca.cor,luz,opcoes.colorido),tag=' data-peca="'+peca.id+'" data-face="'+face+'"';
        const nervuras=[];
        for(let r=1;r<=(miniatura?2:4);r++){const t=t0+(t1-t0)*r/(miniatura?2:4);nervuras.push(linha([avaliar(a,t),avaliar(b,t)]));}
        const furo=peca.variacao==='perfurado'&&i%3===1&&j>0&&j<faixas-1
          ?'<circle cx="'+numero((quad[0][0]+quad[2][0])/2)+'" cy="'+numero((quad[0][1]+quad[2][1])/2)+'" r="'+numero(Math.max(1,escala*peca.largura*.012))+'" fill="#f4f2ed" stroke="#525c56" stroke-width=".45"/>':'';
        objetos.push({z:depth,svg:'<g'+tag+' class="face-superficie"><path d="'+caminho(quad)+'" fill="'+fill+'" stroke="'+fill+'" stroke-width=".35"/><path d="'+nervuras.join('')+'" fill="none" stroke="#525c56" stroke-width=".42" opacity=".24"/>'+furo+'</g>'});
        if(j===0){
          const baixo=[avaliar(a,0),avaliar(b,0)],alto=[avaliar(a,1),avaliar(b,1)];
          const opacidade=peca.forma==='quadrado'?.66:.42;
          objetos.push({z:(baixo[0][2]+baixo[1][2])/2+.001,svg:'<path d="'+linha(baixo)+'" fill="none" stroke="#525c56" stroke-width="'+(miniatura?'.55':'.8')+'" stroke-opacity="'+opacidade+'" pointer-events="none"/>'});
          objetos.push({z:(alto[0][2]+alto[1][2])/2+.001,svg:'<path d="'+linha(alto)+'" fill="none" stroke="#525c56" stroke-width="'+(miniatura?'.55':'.8')+'" stroke-opacity="'+opacidade+'" pointer-events="none"/>'});
        }
      }
    }
    for(const item of [{t:0,face:'baixo'},{t:1,face:'cima'}]){
      if(item.face==='cima'&&Math.sin(elevacao)<=1e-6)continue;
      if(item.face==='baixo'&&Math.sin(elevacao)>=-1e-6)continue;
      const aro=Array.from({length:segmentos},(_,i)=>avaliar(i*TAU/segmentos,item.t));
      const z=aro.reduce((s,p)=>s+p[2],0)/aro.length;
      const fill=corSuperficie(peca.cor,item.t?1.045:.88,opcoes.colorido);
      objetos.push({z:z+(item.t ? .04 : -.04),svg:'<g data-peca="'+peca.id+'" data-face="'+item.face+'" class="face-superficie"><path d="'+caminho(aro)+'" fill="'+fill+'" stroke="#525c56" stroke-opacity=".66" stroke-width=".8"/></g>'});
    }
    limites[peca.id]={minX:Math.min(...pontos.map(p=>p[0])),maxX:Math.max(...pontos.map(p=>p[0])),minY:Math.min(...pontos.map(p=>p[1])),maxY:Math.max(...pontos.map(p=>p[1])),topo:Math.min(...pontos.map(p=>p[1])),fundo:Math.max(...pontos.map(p=>p[1])),peca};
  }
  objetos.sort((a,b)=>a.z-b.z);
  return {svg:'<g class="modelo-flutuante">'+objetos.map(o=>o.svg).join('')+'</g>',limites,escala,altura:alturaViewport,largura,tamanho:largura,bbox,pecas};
}

function geometria(modelo, opcoes = {}) {
  return Array.isArray(modelo?.pecas) ? geometriaMontagem(modelo, opcoes) : geometriaLegada(modelo, opcoes);
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

function cotasDaPeca(desenho, pecaId) {
  const caixa=desenho.limites[pecaId];if(!caixa)return '';
  const peca=caixa.peca,regras=LIMITES[peca.tipo];if(!regras)return '';
  const pos=posicionarCotas(caixa,desenho.largura,desenho.altura);
  const y=pos.largura.y,x=pos.altura.x,midX=pos.largura.x,midY=pos.altura.y,cor='#8a473b';
  const handle=(chave,px,py,orient,d)=>{
    const label=(chave==='largura'?'Largura':'Altura')+': '+(NOMES[peca.tipo]||'Peça');
    const labelX=chave==='altura'?pos.altura.rotuloX:px,labelY=chave==='largura'?pos.largura.rotuloY:py;
    return '<g data-dimensao="'+chave+'" data-peca="'+peca.id+'" role="slider" tabindex="0" aria-label="'+label+'" aria-valuemin="'+regras[chave].min+'" aria-valuemax="'+regras[chave].max+'" aria-valuenow="'+peca[chave]+'" aria-valuetext="'+peca[chave]+' milímetros" aria-orientation="'+orient+'"><path d="'+d+'" stroke="transparent" stroke-width="22" pointer-events="stroke"/><path d="'+d+'"/><circle cx="'+numero(px)+'" cy="'+numero(py)+'" r="5.4" fill="#faf7f0" stroke="'+cor+'" stroke-width="1.2"/><g transform="translate('+numero(labelX)+','+numero(labelY)+')" stroke="none" fill="'+cor+'" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle"><rect x="-34" y="-8" width="68" height="17" rx="5" fill="#f5f3ed" fill-opacity=".94"/><text y="4">'+peca[chave]+' mm</text></g></g>';
  };
  const linhaLargura='M'+numero(caixa.minX)+','+numero(y)+'H'+numero(caixa.maxX);
  const linhaAltura='M'+numero(x)+','+numero(caixa.topo)+'V'+numero(caixa.fundo);
  return '<g class="cotas" fill="none" stroke="'+cor+'" stroke-width=".85">'+handle('largura',midX,y,'horizontal',linhaLargura)+handle('altura',x,midY,'vertical',linhaAltura)+'</g>';
}

export function posicionarCotas(caixa, largura, altura) {
  const y=limitar(caixa.maxY+22,18,altura-24),x=limitar(caixa.maxX+25,18,largura-55);
  const meioX=(caixa.minX+caixa.maxX)/2,meioY=(caixa.topo+caixa.fundo)/2;
  return {
    largura:{x:limitar(meioX,34,largura-34),y,rotuloY:y-15},
    altura:{x,y:meioY,rotuloX:x+8},
  };
}

/** Miniatura inteiramente vetorial; não depende do DOM. */
export function renderizarMiniatura(modelo, opcoes = {}) {
  const desenho = geometria(modelo, { ...opcoes, tamanho: 400, miniatura: true, colorido: opcoes.colorido ?? true });
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 400 400" aria-hidden="true" focusable="false" class="miniatura-obra">${desenho.svg}</svg>`;
}

/** Mantém o SVG estável para preservar captura do ponteiro durante mudanças. */
export function criarVisualizador(container, opcoes = {}) {
  let estado = { modelo: opcoes.modelo, pecaAtiva: opcoes.pecaAtiva || opcoes.parteAtiva || opcoes.modelo?.pecas?.[0]?.id || 'base', faceAtiva: opcoes.faceAtiva || null, parteAtiva: opcoes.parteAtiva || 'base', colorido: opcoes.colorido ?? false, mostrarCotas: opcoes.mostrarCotas ?? true };
  let angulo = ANGULO_INICIAL, elevacao = .46, fatorZoom = 1, arraste = null, desenho, quadro = null, destruido = false;
  let largura = Math.max(1, container.clientWidth || 600), altura = Math.max(1, container.clientHeight || 600), hoverFace = null, pulsoPeca = null, timerPulso = null;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + largura + ' ' + altura);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'group');
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-label', 'Prévia da composição. Arraste para girar; use as setas para orbitar. Selecione uma face para montar outra peça.');
  svg.setAttribute('class', 'visualizador-svg');
  svg.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;user-select:none;cursor:grab;overflow:visible';
  container.replaceChildren(svg);

  function desenhar() {
    if (destruido) return;
    quadro = null;
    const foco = svg.contains(document.activeElement) ? document.activeElement?.getAttribute?.('data-dimensao') : null;
    desenho = geometria(estado.modelo, { angulo, elevacao, zoom: fatorZoom, colorido: estado.colorido, largura, altura, mostrarCotas: estado.mostrarCotas });
    svg.setAttribute('viewBox', '0 0 ' + largura + ' ' + altura);
    const cotas = estado.mostrarCotas ? (Array.isArray(estado.modelo?.pecas) ? cotasDaPeca(desenho, estado.pecaAtiva) : cotasDaParte(desenho, estado.parteAtiva)) : '';
    svg.classList.toggle('sem-flutuacao', estado.flutuacao === false);
    svg.innerHTML = `<style>.cota-puxador{transition:r .12s ease}.face-superficie{cursor:pointer}.face-hover path:first-child,.face-selecionada path:first-child{stroke:#a90000!important;stroke-width:1.35!important}.face-hover path:first-child{fill-opacity:.86}.modelo-flutuante{animation:flutuar-modelo 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.visualizador-svg.sem-flutuacao .modelo-flutuante{animation:none}.visualizador-svg.interagindo .modelo-flutuante{animation-play-state:paused}.peca-pulso{animation:realce-encaixe .7s ease-out 2}@keyframes flutuar-modelo{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes realce-encaixe{50%{filter:brightness(1.14)}}@media(prefers-reduced-motion:reduce){.cota-puxador{transition:none}.modelo-flutuante,.peca-pulso{animation:none}}</style>${desenho.svg}${cotas}`;
    if (hoverFace) svg.querySelectorAll('[data-face]').forEach(el => { if (el.dataset.peca === hoverFace.pecaId && el.dataset.face === hoverFace.faceId) el.classList.add('face-hover'); });
    if (estado.faceAtiva) svg.querySelectorAll('[data-face]').forEach(el => { if (el.dataset.peca === estado.pecaAtiva && el.dataset.face === estado.faceAtiva) el.classList.add('face-selecionada'); });
    if (pulsoPeca) svg.querySelectorAll('[data-peca]').forEach(el => { if (el.dataset.peca === pulsoPeca) el.classList.add('peca-pulso'); });
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
  function ajustar(chave, valor, pecaId = estado.pecaAtiva) {
    const peca = desenho?.limites?.[pecaId]?.peca || desenho?.limites?.[pecaId]?.parte;
    const tipo = peca?.tipo || peca?.id || pecaId;
    const regra = LIMITES[tipo]?.[chave];
    if (!regra || !peca) return;
    const novo = limitar(Math.round(valor), regra.min, regra.max);
    if (Number(peca[chave]) === novo) return;
    if (Array.isArray(estado.modelo?.pecas)) {
      const origem = estado.modelo;
      const aceito = opcoes.onDimensao?.(pecaId, chave, novo);
      if (aceito === false) return;
      if (estado.modelo === origem) estado = { ...estado, modelo: { ...origem, pecas: origem.pecas.map(item => item.id === pecaId ? { ...item, [chave]: novo } : item) } };
    } else {
      const atual = estado.modelo?.partes?.[tipo] || estado.modelo?.[tipo];
      if (!atual) return;
      const origem = estado.modelo;
      const aceito = opcoes.onDimensao?.(tipo, chave, novo);
      if (aceito === false) return;
      if (estado.modelo === origem) estado = { ...estado, modelo: { ...origem, partes: { ...(origem.partes || {}), [tipo]: { ...atual, [chave]: novo } } } };
    }
    agendar();
  }
  function iniciar(evento) {
    if (evento.button !== 0 || arraste) return;
    const alvoCota = evento.target.closest?.('[data-dimensao]');
    const alvoFace = evento.target.closest?.('[data-face][data-peca]');
    const alvoParte = evento.target.closest?.('[data-parte]');
    const p = local(evento);
    const chave = alvoCota?.getAttribute('data-dimensao');
    const pecaId = alvoCota?.getAttribute('data-peca') || estado.pecaAtiva;
    const caixa = desenho.limites[pecaId];
    const face = alvoFace ? { pecaId: alvoFace.dataset.peca, faceId: alvoFace.dataset.face } : null;
    const selecionar = face?.pecaId || alvoParte?.getAttribute('data-parte');
    if (!caixa && chave) return;
    arraste = { id: evento.pointerId, x: p.x, y: p.y, angulo, elevacao, chave, pecaId, face, valor: chave ? caixa?.peca?.[chave] : 0, escala: chave === 'largura' ? Math.max(.1, (caixa.maxX - caixa.minX) / caixa.peca.largura) : Math.max(.1, desenho.escala * Math.cos(elevacao)), movido: false, selecionar };
    svg.classList.add('interagindo');
    svg.setPointerCapture(evento.pointerId);
    svg.style.cursor = chave ? `${chave === 'largura' ? 'ew' : 'ns'}-resize` : 'grabbing';
    if (chave) alvoCota.focus({ preventScroll: true });
    else svg.focus({ preventScroll: true });
    evento.preventDefault();
  }
  function mover(evento) {
    if (!arraste || evento.pointerId !== arraste.id) {
      const el = evento.target.closest?.('[data-face][data-peca]');
      const face = el ? { pecaId: el.dataset.peca, faceId: el.dataset.face } : null;
      const chave = face ? face.pecaId + ':' + face.faceId : '';
      if ((hoverFace ? hoverFace.pecaId + ':' + hoverFace.faceId : '') !== chave) {
        hoverFace = face;
        svg.querySelectorAll('[data-face]').forEach(el => el.classList.toggle('face-hover', Boolean(face && el.dataset.peca === face.pecaId && el.dataset.face === face.faceId)));
        opcoes.onHoverFace?.(face);
      }
      return;
    }
    const p = local(evento), dx = p.x - arraste.x, dy = p.y - arraste.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) arraste.movido = true;
    if (arraste.chave) ajustar(arraste.chave, arraste.valor + (arraste.chave === 'largura' ? dx : -dy) / arraste.escala, arraste.pecaId);
    else { angulo = arraste.angulo + dx * .011; elevacao = limitar(arraste.elevacao + dy * .009, -1.25, 1.25); agendar(); }
  }
  function encerrar(evento) {
    if (!arraste || evento.pointerId !== arraste.id) return;
    const anterior = arraste;
    arraste = null;
    svg.classList.remove('interagindo');
    if (svg.hasPointerCapture(evento.pointerId)) svg.releasePointerCapture(evento.pointerId);
    svg.style.cursor = 'grab';
    if (anterior.chave) svg.querySelector(`[data-dimensao="${anterior.chave}"]`)?.focus({ preventScroll: true });
    else if (!anterior.movido && anterior.selecionar && evento.type !== 'pointercancel') {
      if (anterior.face) {
        estado = { ...estado, pecaAtiva: anterior.face.pecaId, faceAtiva: anterior.face.faceId };
        opcoes.onSelecionarFace?.(anterior.face);
        if (!opcoes.onSelecionarFace) opcoes.onSelecionarPeca?.(anterior.face.pecaId);
        const peca = desenho.pecas?.find(item => item.id === anterior.face.pecaId);
        if (peca) opcoes.onSelecionarParte?.(peca.tipo);
        svg.querySelectorAll('[data-face]').forEach(el => el.classList.toggle('face-selecionada', el.dataset.peca === anterior.face.pecaId && el.dataset.face === anterior.face.faceId));
      } else opcoes.onSelecionarParte?.(anterior.selecionar);
    }
  }
  function teclado(evento) {
    const chave = evento.target.closest?.('[data-dimensao]')?.getAttribute('data-dimensao');
    if (chave && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(evento.key)) {
      evento.preventDefault(); evento.stopPropagation();
      const pecaId = evento.target.closest?.('[data-peca]')?.getAttribute('data-peca') || estado.pecaAtiva;
      const parte = desenho.limites[pecaId]?.peca?.tipo || estado.parteAtiva, atual = desenho.limites[pecaId]?.peca?.[chave] ?? desenho.limites[pecaId]?.parte?.[chave];
      const passo = evento.shiftKey ? 10 : 1;
      if (atual === undefined) return;
      ajustar(chave, evento.key === 'Home' ? LIMITES[parte][chave].min : evento.key === 'End' ? LIMITES[parte][chave].max : atual + (['ArrowRight', 'ArrowUp'].includes(evento.key) ? passo : -passo), pecaId);
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(evento.key)) {
      evento.preventDefault();
      angulo += evento.key === 'ArrowRight' ? .12 : evento.key === 'ArrowLeft' ? -.12 : 0;
      elevacao = limitar(elevacao + (evento.key === 'ArrowDown' ? .12 : evento.key === 'ArrowUp' ? -.12 : 0), -1.25, 1.25); agendar();
    } else if (evento.key === 'Home') {
      evento.preventDefault(); angulo = ANGULO_INICIAL; elevacao = .46; fatorZoom = 1; agendar();
    }
  }
  function limparHover() { if (hoverFace) { hoverFace = null; svg.querySelectorAll('[data-face]').forEach(el=>el.classList.remove('face-hover')); opcoes.onHoverFace?.(null); } }
  function apontarFace(clientX, clientY) {
    const alvo = document.elementFromPoint(clientX, clientY)?.closest?.('[data-face][data-peca]');
    return alvo && svg.contains(alvo) ? { pecaId: alvo.dataset.peca, faceId: alvo.dataset.face } : null;
  }
  const eventos = { pointerdown: iniciar, pointermove: mover, pointerup: encerrar, pointercancel: encerrar, lostpointercapture: encerrar, pointerleave: limparHover, keydown: teclado };
  for (const [nome, funcao] of Object.entries(eventos)) svg.addEventListener(nome, funcao);
  const observador = typeof ResizeObserver === 'function' ? new ResizeObserver(entradas => {
    const caixa = entradas[0]?.contentRect;
    if (caixa?.width && caixa?.height) { largura = caixa.width; altura = caixa.height; agendar(); }
  }) : null;
  observador?.observe(container);
  desenhar();

  return {
    atualizar(proximo = {}) { estado = { ...estado, ...proximo }; agendar(); },
    apontarFace,
    girar(delta = 15, deltaElevacao = 0) { angulo += Number(delta) * Math.PI / 180; elevacao = limitar(elevacao + Number(deltaElevacao) * Math.PI / 180, -1.25, 1.25); agendar(); },
    zoom(delta = .1) { fatorZoom = limitar(fatorZoom + Number(delta), .55, 2.4); agendar(); },
    fit() { fatorZoom = 1; agendar(); },
    encaixar(pecaId) { if (!desenho?.pecas?.some(item => item.id === pecaId)) return; fatorZoom = 1; pulsoPeca = pecaId; if (timerPulso) clearTimeout(timerPulso); timerPulso = setTimeout(() => { pulsoPeca = null; svg.querySelectorAll('.peca-pulso').forEach(el=>el.classList.remove('peca-pulso')); }, 1500); agendar(); },
    resetar() { angulo = ANGULO_INICIAL; elevacao = .46; fatorZoom = 1; agendar(); },
    destruir() {
      destruido = true;
      if (timerPulso) clearTimeout(timerPulso);
      observador?.disconnect();
      if (quadro !== null) cancelAnimationFrame(quadro);
      for (const [nome, funcao] of Object.entries(eventos)) svg.removeEventListener(nome, funcao);
      svg.remove();
    },
  };
}
