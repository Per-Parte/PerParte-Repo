import test from 'node:test';
import assert from 'node:assert/strict';
import { criarModelo, adicionarPeca, atualizarPeca, obterPecas, posicionarPecas, PARTES, FORMAS, VARIACOES, LIMITES } from '../src/dominio.mjs';
import { renderizarMiniatura, calcularEnquadramento, posicionarCotas } from '../src/renderizador.mjs';

test('montagens e extremos paramétricos geram SVG válido com faces identificáveis',()=>{
  for(const tipo of PARTES) for(const forma of FORMAS) for(const variacao of VARIACOES) for(const extremo of ['min','max']){
    let m=criarModelo('livre');
    if(tipo!=='base') m=adicionarPeca(m,{tipo,pecaId:'peca-base',face:'cima',forma:forma.id,variacao:variacao.id,
      largura:LIMITES[tipo].largura[extremo],altura:LIMITES[tipo].altura[extremo]});
    else m=atualizarPeca(m,'peca-base',{forma:forma.id,variacao:variacao.id,
      largura:LIMITES.base.largura[extremo],altura:LIMITES.base.altura[extremo]});
    const svg=renderizarMiniatura(m);
    assert.match(svg,/viewBox="0 0 400 400"/);
    assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
    for(const peca of obterPecas(m)) assert.ok(svg.includes('data-peca="'+peca.id+'"'));
    assert.ok(svg.includes('data-face="cima"'));
  }
});

test('oculta as faces de trás e os caps fora da vista atual, restaurando-os ao orbitar',()=>{
  const modelo=criarModelo('livre');
  const frente=renderizarMiniatura(modelo,{angulo:-.46,elevacao:.46});
  assert.ok(frente.includes('data-face="cima"'));
  assert.ok(!frente.includes('data-face="baixo"'));
  assert.ok(frente.includes('data-face="frente"'));
  assert.ok(!frente.includes('data-face="tras"'));
  const tras=renderizarMiniatura(modelo,{angulo:Math.PI-.46,elevacao:.46});
  assert.ok(tras.includes('data-face="tras"'));
  assert.ok(!tras.includes('data-face="frente"'));
  const abaixo=renderizarMiniatura(modelo,{angulo:-.46,elevacao:-.46});
  assert.ok(abaixo.includes('data-face="baixo"'));
  assert.ok(!abaixo.includes('data-face="cima"'));
});

test('rotação em dois eixos, encaixe lateral e variações alteram a prévia sem mudar o modelo',()=>{
  let m=criarModelo('livre'), pai='peca-base';
  for(let i=0;i<3;i++){m=adicionarPeca(m,{tipo:'corpo',pecaId:pai,face:'cima',forma:'quadrado',largura:90,altura:90});pai=obterPecas(m).at(-1).id;}
  m=adicionarPeca(m,{tipo:'difusor',pecaId:pai,face:'direita',forma:'quadrado',largura:90,altura:90});
  const copia=structuredClone(m), base=renderizarMiniatura(m);
  assert.equal(obterPecas(m).length,5);
  assert.notEqual(base,renderizarMiniatura(m,{angulo:1.5}));
  assert.notEqual(base,renderizarMiniatura(m,{elevacao:1.0}));
  assert.notEqual(base,renderizarMiniatura(atualizarPeca(m,obterPecas(m)[4].id,{variacao:'perfurado'})));
  assert.notEqual(base,renderizarMiniatura(atualizarPeca(m,obterPecas(m)[4].id,{cor:'brasa'})));
  assert.ok(base.includes('data-peca="'+obterPecas(m)[4].id+'" data-face="frente"'));
  assert.deepEqual(m,copia);
});

test('fit automático mantém envelopes altos e largos dentro de viewports desktop e móveis',()=>{
  let modelo=criarModelo('livre'),pai='peca-base';
  for(let i=0;i<3;i++){modelo=adicionarPeca(modelo,{tipo:'corpo',pecaId:pai,face:'cima',forma:'quadrado',largura:90,altura:90});pai=obterPecas(modelo).at(-1).id;}
  modelo=adicionarPeca(modelo,{tipo:'difusor',pecaId:pai,face:'direita',forma:'quadrado',largura:90,altura:90});
  const bbox=posicionarPecas(modelo).bbox;
  for(const [largura,altura] of [[1440,560],[900,420],[390,285],[320,270]]){
    for(const [angulo,elevacao] of [[-.46,.46],[1.2,.9],[-2.2,-.5]]){
      const escala=calcularEnquadramento(bbox,largura,altura,48,angulo,elevacao);
      const centro=[(bbox.minX+bbox.maxX)/2,(bbox.minY+bbox.maxY)/2,(bbox.minZ+bbox.maxZ)/2],ca=Math.cos(angulo),sa=Math.sin(angulo),ce=Math.cos(elevacao),se=Math.sin(elevacao),pts=[];
      for(const x of [bbox.minX,bbox.maxX])for(const y of [bbox.minY,bbox.maxY])for(const z of [bbox.minZ,bbox.maxZ]){
        const dx=x-centro[0],dy=y-centro[1],dz=z-centro[2],h=dx*ca-dz*sa,d=dx*sa+dz*ca;pts.push([h,-dy*ce+d*se]);
      }
      const spanX=Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),spanY=Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1]));
      assert.ok(spanX*escala<=largura-96+.01);
      assert.ok(spanY*escala<=altura-96+.01);
    }
  }
});

test('cotas e rótulos cabem no viewport móvel com modelo encostado nas margens reservadas',()=>{
  const largura=390,altura=310,caixa={minX:28,minY:34,maxX:322,maxY:262,topo:34,fundo:262};
  const cotas=posicionarCotas(caixa,largura,altura);
  assert.ok(cotas.largura.x-34>=0);
  assert.ok(cotas.largura.x+34<=largura);
  assert.ok(cotas.largura.rotuloY-8>=0);
  assert.ok(cotas.largura.rotuloY+8<=altura);
  assert.ok(cotas.altura.rotuloX-34>=0);
  assert.ok(cotas.altura.rotuloX+34<=largura);
  assert.ok(cotas.altura.y-8>=0);
  assert.ok(cotas.altura.y+8<=altura);
});
