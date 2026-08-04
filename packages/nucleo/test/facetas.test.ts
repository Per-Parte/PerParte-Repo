/**
 * Facetas com junta redonda (EXT): a lateral vira prisma de N faces, mas as
 * zonas de encaixe continuam CIRCULARES — o ajuste F5 não pode depender do
 * acabamento. Também: o meio da face nunca mergulha além do piso físico
 * (miolo elétrico) e o sólido continua estanque.
 */

import { describe, expect, it } from "vitest";
import {
  facetasParaCorpo,
  facetasParaDifusor,
  malhaRevolucao,
  perfilCorpo,
  perfilDifusor,
  RAIO_LIVRE_MIOLO_MM,
  type Malha,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

const CORPO: ParametrosCorpo = {
  alturaMm: 160,
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

const DIFUSOR: ParametrosDifusor = {
  forma: "globo",
  alturaMm: 100,
  raioMm: 65,
  gomos: 0,
  profundidadeGomosMm: 0,
};

/** Raio mínimo e máximo de cada anel da malha (layout: anel a anel + 2 ápices). */
function aneisDa(m: Malha, seg: number): { y: number; rMin: number; rMax: number }[] {
  const nAneis = (m.posicoes.length / 3 - 2) / seg;
  const aneis: { y: number; rMin: number; rMax: number }[] = [];
  for (let j = 0; j < nAneis; j++) {
    let rMin = Infinity;
    let rMax = 0;
    for (let i = 0; i < seg; i++) {
      const o = (j * seg + i) * 3;
      const r = Math.hypot(m.posicoes[o], m.posicoes[o + 1]);
      rMin = Math.min(rMin, r);
      rMax = Math.max(rMax, r);
    }
    aneis.push({ y: m.posicoes[j * seg * 3 + 2], rMin, rMax });
  }
  return aneis;
}

describe("EXT — facetas com junta redonda", () => {
  it("zonas de encaixe ficam circulares; a lateral, facetada", () => {
    for (const lados of [4, 6, 16]) {
      const f = facetasParaCorpo(lados, CORPO.alturaMm);
      const m = malhaRevolucao(perfilCorpo(CORPO), 192, undefined, undefined, f);
      const aneis = aneisDa(m, 192);
      let viuFacetado = false;
      for (const a of aneis) {
        const achatamento = a.rMax - a.rMin;
        if (a.y <= f.yMinMm || a.y >= f.yMaxMm) {
          // Fêmea, pé e assento do macho: redondos (F5 não depende do acabamento).
          expect(achatamento, `lados=${lados} y=${a.y.toFixed(1)}`).toBeLessThan(
            1e-3
          );
        } else if (
          a.y > f.yMinMm + (f.transicaoMm ?? 8) &&
          a.y < f.yMaxMm - (f.transicaoMm ?? 8)
        ) {
          // Miolo da janela: faces planas de verdade — o achatamento esperado
          // do polígono inscrito é r·(1 − cos(π/N)).
          const esperado = a.rMax * (1 - Math.cos(Math.PI / lados));
          if (achatamento > esperado * 0.8) viuFacetado = true;
        }
      }
      expect(viuFacetado, `lados=${lados}`).toBe(true);
    }
  });

  it("o meio da face nunca invade o miolo elétrico (corpo, 4 faces)", () => {
    const f = facetasParaCorpo(4, CORPO.alturaMm);
    const m = malhaRevolucao(perfilCorpo(CORPO), 192, undefined, undefined, f);
    for (const a of aneisDa(m, 192)) {
      if (a.y > f.yMinMm && a.y < f.yMaxMm) {
        expect(a.rMin, `y=${a.y.toFixed(1)}`).toBeGreaterThanOrEqual(
          RAIO_LIVRE_MIOLO_MM - 1e-6
        );
      }
    }
  });

  it("a silhueta continua sendo o envelope: facetar nunca aumenta o raio", () => {
    const perfil = perfilCorpo(CORPO);
    const liso = malhaRevolucao(perfil, 192);
    const facetado = malhaRevolucao(
      perfil,
      192,
      undefined,
      undefined,
      facetasParaCorpo(6, CORPO.alturaMm)
    );
    const rMaxLiso = Math.max(...aneisDa(liso, 192).map((a) => a.rMax));
    const rMaxFacetado = Math.max(...aneisDa(facetado, 192).map((a) => a.rMax));
    expect(rMaxFacetado).toBeLessThanOrEqual(rMaxLiso + 1e-6);
  });

  it("corpo e difusor facetados continuam sólidos estanques", () => {
    for (const lados of [4, 8, 16]) {
      const mc = malhaRevolucao(
        perfilCorpo(CORPO),
        96,
        undefined,
        undefined,
        facetasParaCorpo(lados, CORPO.alturaMm)
      );
      const rc = verificarEstanque(mc);
      expect(rc.ok, `corpo lados=${lados}: ${rc.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(mc)).toBeGreaterThan(0);

      const md = malhaRevolucao(
        perfilDifusor(DIFUSOR),
        96,
        undefined,
        undefined,
        facetasParaDifusor(lados, DIFUSOR.alturaMm)
      );
      const rd = verificarEstanque(md);
      expect(rd.ok, `difusor lados=${lados}: ${rd.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(md)).toBeGreaterThan(0);
    }
  });

  it("sem facetas, a malha sai idêntica à de antes", () => {
    const perfil = perfilCorpo(CORPO);
    const a = malhaRevolucao(perfil, 128);
    const b = malhaRevolucao(perfil, 128, undefined, undefined, undefined);
    expect(Array.from(a.posicoes)).toEqual(Array.from(b.posicoes));
    expect(Array.from(a.indices)).toEqual(Array.from(b.indices));
  });
});
