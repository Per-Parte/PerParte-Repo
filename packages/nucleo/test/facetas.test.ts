/**
 * Facetas com junta redonda (EXT): a lateral vira prisma de N faces, mas as
 * zonas de encaixe continuam CIRCULARES — o ajuste F5 não pode depender do
 * acabamento. Também: o meio da face nunca mergulha além do piso físico
 * (miolo elétrico) e o sólido continua estanque.
 */

import { describe, expect, it } from "vitest";
import {
  ENCAIXES,
  facetasParaBase,
  facetasParaCorpo,
  facetasParaDifusor,
  facetasParaEstrutural,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  perfilEstrutural,
  RAIO_LIVRE_MIOLO_MM,
  REGRAS,
  type CurvaBase,
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

const BASE = { alturaMm: 26, raioMm: 82, curva: "reta" as CurvaBase };

/**
 * Maior balanço da MALHA, em graus da vertical: compara cada vértice com o de
 * mesmo índice angular no anel de cima. Só sobe (dz > 0) e só conta o que
 * cresce para fora — é o que pede suporte na impressão (F4).
 */
function balancoDaMalha(m: Malha, seg: number): number {
  const nAneis = (m.posicoes.length / 3 - 2) / seg;
  let pior = 0;
  for (let j = 0; j < nAneis - 1; j++) {
    for (let i = 0; i < seg; i++) {
      const a = (j * seg + i) * 3;
      const b = ((j + 1) * seg + i) * 3;
      const dz = m.posicoes[b + 2] - m.posicoes[a + 2];
      if (dz <= 1e-9) continue;
      const dr =
        Math.hypot(m.posicoes[b], m.posicoes[b + 1]) -
        Math.hypot(m.posicoes[a], m.posicoes[a + 1]);
      if (dr <= 0) continue;
      pior = Math.max(pior, (Math.atan2(dr, dz) * 180) / Math.PI);
    }
  }
  return pior;
}

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

  it("base facetada: encaixe redondo, face de apoio poligonal", () => {
    const piso =
      ENCAIXES.baseCorpo.anel.externoMm +
      ENCAIXES.folgaPadraoMm +
      REGRAS.F.paredeEstruturalMm.min;
    for (const lados of [4, 6, 12]) {
      const perfil = perfilBase(BASE);
      const f = facetasParaBase(lados, BASE.alturaMm);
      const m = malhaRevolucao(perfil, 192, undefined, undefined, f);
      const aneis = aneisDa(m, 192);

      // Todo ponto do perfil no raio da interface (ou abaixo) sai circular —
      // é a canaleta, o anel macho e o eixo que se protegem sozinhos.
      aneis.forEach((a, j) => {
        if (perfil[j].x <= piso + 1e-9) {
          expect(
            a.rMax - a.rMin,
            `lados=${lados} j=${j} r=${perfil[j].x.toFixed(1)}`
          ).toBeLessThan(1e-3);
        }
        // Tolerância de 1e-4: a malha é Float32, que já erra ~2e-6 em 26 mm.
        expect(a.rMin, `lados=${lados} j=${j}`).toBeGreaterThanOrEqual(
          Math.min(perfil[j].x, piso) - 1e-4
        );
      });

      // A face que apoia na mesa é o gesto do arquétipo: precisa ser plana.
      const apoio = aneis.find((a) => a.y === 0 && a.rMax > piso)!;
      expect(apoio.rMax - apoio.rMin, `lados=${lados}`).toBeGreaterThan(
        apoio.rMax * (1 - Math.cos(Math.PI / lados)) * 0.8
      );
    }
  });

  it("estrutural facetada: as duas pontas de encaixe ficam redondas", () => {
    const piso =
      ENCAIXES.baseCorpo.anel.externoMm +
      ENCAIXES.folgaPadraoMm +
      REGRAS.F.paredeEstruturalMm.min;
    for (const p of [
      { tipo: "haste" as const, alturaMm: 120, barrigaMm: 12 },
      { tipo: "anel" as const, alturaMm: 24, barrigaMm: 9 },
    ]) {
      const perfil = perfilEstrutural(p);
      const f = facetasParaEstrutural(4, p.alturaMm);
      const m = malhaRevolucao(perfil, 192, undefined, undefined, f);
      aneisDa(m, 192).forEach((a, j) => {
        if (perfil[j].x <= piso + 1e-9) {
          expect(a.rMax - a.rMin, `${p.tipo} j=${j}`).toBeLessThan(1e-3);
        }
        expect(a.rMin, `${p.tipo} j=${j}`).toBeGreaterThanOrEqual(
          Math.min(perfil[j].x, piso) - 1e-4
        );
      });
    }
  });

  it("facetar base/estrutural não piora o balanço (F4 de graça, sem rampa)", () => {
    const curvas: CurvaBase[] = ["reta", "cone", "concava", "degrau"];
    for (const curva of curvas) {
      for (const alturaMm of [20, 26, 60]) {
        for (const lados of [4, 6, 16]) {
          const perfil = perfilBase({ ...BASE, curva, alturaMm });
          const liso = balancoDaMalha(malhaRevolucao(perfil, 192), 192);
          const facetado = balancoDaMalha(
            malhaRevolucao(
              perfil,
              192,
              undefined,
              undefined,
              facetasParaBase(lados, alturaMm)
            ),
            192
          );
          expect(
            facetado,
            `base ${curva} h=${alturaMm} lados=${lados}`
          ).toBeLessThanOrEqual(liso + 1e-4);
        }
      }
    }
    for (const barrigaMm of [-8, 0, 14]) {
      const perfil = perfilEstrutural({ tipo: "haste", alturaMm: 120, barrigaMm });
      const liso = balancoDaMalha(malhaRevolucao(perfil, 192), 192);
      const facetado = balancoDaMalha(
        malhaRevolucao(
          perfil,
          192,
          undefined,
          undefined,
          facetasParaEstrutural(4, 120)
        ),
        192
      );
      expect(facetado, `estrutural barriga=${barrigaMm}`).toBeLessThanOrEqual(
        liso + 1e-4
      );
    }
  });

  it("base e estrutural facetadas continuam sólidos estanques", () => {
    for (const lados of [4, 8, 12]) {
      const mb = malhaRevolucao(
        perfilBase(BASE),
        96,
        undefined,
        undefined,
        facetasParaBase(lados, BASE.alturaMm)
      );
      const rb = verificarEstanque(mb);
      expect(rb.ok, `base lados=${lados}: ${rb.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(mb)).toBeGreaterThan(0);

      const me = malhaRevolucao(
        perfilEstrutural({ tipo: "haste", alturaMm: 120, barrigaMm: 12 }),
        96,
        undefined,
        undefined,
        facetasParaEstrutural(lados, 120)
      );
      const re = verificarEstanque(me);
      expect(re.ok, `estrutural lados=${lados}: ${re.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(me)).toBeGreaterThan(0);
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
