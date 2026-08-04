/**
 * Junta inclinada — a cabeça do Gio Task (inclinar + deslocar na mesma
 * junta). Garantias: estanque, a borda mais baixa da cabeça nunca toca o
 * macho do corpo, pende para o lado certo, F5 do pescoço intacto,
 * grampeamento com contexto do difusor, E1 sente o desvio.
 */

import { describe, expect, it } from "vitest";
import {
  BASES,
  desvioCabecaMm,
  ENCAIXES,
  estabilidade,
  grampearDifusor,
  grampearJunta,
  JUNTA_PADRAO,
  LIMITES_JUNTA,
  malhaCabecaInclinada,
  medidasJunta,
  perfilPescocoJunta,
  type Malha,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

const TAMBOR: ParametrosDifusor = {
  forma: "lanterna",
  alturaMm: 80,
  raioMm: 70,
  gomos: 0,
  profundidadeGomosMm: 0,
};

const CORPO_RETO: ParametrosCorpo = {
  alturaMm: 200,
  volumeBojoMm: 0,
  posicaoBojo: 0,
  ondulacao: 0,
  amplitudeOndaMm: 0,
  gomos: 0,
  profundidadeGomosMm: 0,
  torcaoGraus: 0,
  deslocamentoMm: 0,
  posicaoDobra: 0,
};

function extremos(m: Malha) {
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < m.posicoes.length; i += 3) {
    xMin = Math.min(xMin, m.posicoes[i]);
    xMax = Math.max(xMax, m.posicoes[i]);
    zMin = Math.min(zMin, m.posicoes[i + 2]);
    zMax = Math.max(zMax, m.posicoes[i + 2]);
  }
  return { xMin, xMax, zMin, zMax };
}

describe("junta inclinada — a cabeça do Gio Task", () => {
  it("a malha completa é estanque e tem volume", () => {
    const m = malhaCabecaInclinada(TAMBOR, JUNTA_PADRAO, 96);
    const r = verificarEstanque(m);
    expect(r.ok, r.problema ?? "").toBe(true);
    expect(volumeAssinadoMm3(m)).toBeGreaterThan(0);
  });

  it("a borda mais baixa da cabeça fica acima do macho do corpo", () => {
    // O macho do corpo sobe até 6 mm acima do plano do encaixe (z = 0 da
    // peça); a cabeça girada nunca desce até lá.
    for (const junta of [
      JUNTA_PADRAO,
      { inclinacaoGraus: 25, deslocamentoMm: 40 },
      { inclinacaoGraus: 5, deslocamentoMm: 0 },
    ]) {
      const seg = 64;
      const m = malhaCabecaInclinada(TAMBOR, junta, seg);
      const anel = ENCAIXES.corpoDifusor.anel;
      // A cabeça é o SEGUNDO sólido da união: os vértices dela vêm depois
      // dos do pescoço (perfil do pescoço × segmentos + 2 ápices).
      const { pescocoMm } = medidasJunta(TAMBOR, junta);
      const inicioCabeca = (perfilPescocoJunta(pescocoMm).length * seg + 2) * 3;
      let zMinCabeca = Infinity;
      for (let i = inicioCabeca; i < m.posicoes.length; i += 3) {
        zMinCabeca = Math.min(zMinCabeca, m.posicoes[i + 2]);
      }
      expect(zMinCabeca, JSON.stringify(junta)).toBeGreaterThan(
        anel.alturaMm + 1
      );
    }
  });

  it("pende para +X e o deslocamento vai para o mesmo lado", () => {
    const { zCentroMm } = medidasJunta(TAMBOR, JUNTA_PADRAO);
    expect(zCentroMm).toBeGreaterThan(0);
    const m = malhaCabecaInclinada(TAMBOR, JUNTA_PADRAO, 64);
    const e = extremos(m);
    expect(e.xMax).toBeGreaterThan(-e.xMin);
  });

  it("o pescoço carrega a fêmea F5 padrão", () => {
    const perfil = perfilPescocoJunta(40);
    const anel = ENCAIXES.corpoDifusor.anel;
    expect(perfil[1].x).toBeCloseTo(anel.internoMm - ENCAIXES.folgaPadraoMm, 6);
    expect(perfil[3].x).toBeCloseTo(anel.externoMm + ENCAIXES.folgaPadraoMm, 6);
  });

  it("grampear: inclinação na faixa, deslocamento limitado pelo raio da cabeça", () => {
    expect(grampearJunta(undefined, 70)).toBeUndefined();
    expect(grampearJunta({ inclinacaoGraus: 0 }, 70)).toBeUndefined();
    const j = grampearJunta({ inclinacaoGraus: 90, deslocamentoMm: 99 }, 50);
    expect(j?.inclinacaoGraus).toBe(LIMITES_JUNTA.inclinacaoGraus.max);
    expect(j?.deslocamentoMm).toBe(25); // 50 − 25
    // Via grampearDifusor, a junta desliga vazado e corte (cabeça lisa ⚑).
    const d = grampearDifusor({
      ...TAMBOR,
      junta: { inclinacaoGraus: 20, deslocamentoMm: 20 },
      vazado: { padrao: "pontos", densidade: 0.5, gradiente: 0 },
      corte: { tipo: "obliquo", profundidadeMm: 10 },
    });
    expect(d.junta).toBeDefined();
    expect(d.vazado).toBeUndefined();
    expect(d.corte).toBeUndefined();
  });

  it("E1 sente o desvio da cabeça: inclinar+deslocar sobre base mínima tomba", () => {
    const desvio = desvioCabecaMm(TAMBOR, {
      inclinacaoGraus: 25,
      deslocamentoMm: 40,
    });
    expect(desvio).toBeGreaterThan(40);
    const semJunta = estabilidade(BASES[0], CORPO_RETO, TAMBOR, 1, 0);
    const comJunta = estabilidade(
      { alturaMm: 20, raioMm: 60, curva: "reta" },
      CORPO_RETO,
      TAMBOR,
      1,
      desvio
    );
    expect(Math.abs(comJunta.xCgMm)).toBeGreaterThan(Math.abs(semJunta.xCgMm));
    // E o desvio entra na escada normal (alarga/contrapeso/aviso) — aqui
    // só garantimos que o CG saiu do lugar na direção certa.
    expect(comJunta.xCgMm).toBeGreaterThan(0);
  });
});
