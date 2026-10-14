import test from 'node:test';
import assert from 'node:assert/strict';
import { criarModelo, atualizarParte, PARTES, FORMAS, VARIACOES, LIMITES } from '../src/dominio.mjs';
import { renderizarMiniatura } from '../src/renderizador.mjs';
test('prévia aceita combinações e extremos do domínio sem coordenadas inválidas',()=>{
  for(const parte of PARTES) for(const forma of FORMAS) for(const variacao of VARIACOES) for(const extremo of ['min','max']){
    const m=atualizarParte(criarModelo('livre'),parte,{forma:forma.id,variacao:variacao.id,largura:LIMITES[parte].largura[extremo],altura:LIMITES[parte].altura[extremo]});
    const svg=renderizarMiniatura(m);
    assert.match(svg,/viewBox="0 0 400 400"/);
    assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
    for(const p of PARTES) assert.ok(svg.includes('data-parte="'+p+'"'));
  }
});
test('rotação e parâmetros mudam o desenho, sem modificar o modelo salvo',()=>{
  const m=criarModelo('marco');const copia=structuredClone(m);const a=renderizarMiniatura(m);
  assert.notEqual(a,renderizarMiniatura(m,{angulo:1.5}));
  assert.notEqual(a,renderizarMiniatura(atualizarParte(m,'difusor',{variacao:'perfurado'})));
  assert.notEqual(a,renderizarMiniatura(atualizarParte(m,'base',{largura:180})));
  assert.notEqual(a,renderizarMiniatura(atualizarParte(m,'corpo',{cor:'lago'})));
  assert.deepEqual(m,copia);
});
