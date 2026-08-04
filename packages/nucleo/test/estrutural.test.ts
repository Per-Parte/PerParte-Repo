/**
 * Peças estruturais empilháveis (hastes e anéis): a interface é a MESMA nas
 * duas pontas (F5), então a pilha monta em qualquer ordem — e todos os
 * invariantes de produção valem para elas: balanço F4, miolo S2, pé da
 * canaleta, sólido estanque.
 */

import { describe, expect, it } from "vitest";
import {
  ENCAIXES,
  ESTRUTURAIS,
  MAX_ESTRUTURAIS,
  RAIO_LIVRE_MIOLO_MM,
  REGRAS,
  grampearEstruturais,
  malhaRevolucao,
  perfilEstrutural,
  type ParametrosEstrutural,
  type Ponto2D,
} from "../src";
import {
  inclinacaoMaxima,
  verificarEstanque,
  volumeAssinadoMm3,
} from "./apoio";

/**
 * O perfil da estrutural é: 5 pontos de fêmea, 41 de lateral (n = 40),
 * 5 de macho. Marcos conferidos antes de fatiar.
 */
function lateralDaEstrutural(perfil: Ponto2D[], alturaMm: number): Ponto2D[] {
  expect(perfil.length).toBe(5 + 41 + 5);
  expect(perfil[5].y).toBe(0);
  expect(perfil[45].y).toBeCloseTo(alturaMm, 6);
  expect(perfil[46].x).toBe(ENCAIXES.baseCorpo.anel.externoMm);
  return perfil.slice(5, 46);
}

const TAN_F4 = Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180);

describe("F5 — a pilha monta em qualquer ordem", () => {
  it("fêmea embaixo e macho em cima usam a MESMA interface base↔corpo", () => {
    const perfil = perfilEstrutural({
      tipo: "haste",
      alturaMm: 100,
      barrigaMm: 0,
    });
    const anel = ENCAIXES.baseCorpo.anel;
    // Fêmea: abre a folga além do macho (pontos 1 e 3 do perfil).
    expect(perfil[1].x).toBeCloseTo(anel.internoMm - ENCAIXES.folgaPadraoMm, 9);
    expect(perfil[3].x).toBeCloseTo(anel.externoMm + ENCAIXES.folgaPadraoMm, 9);
    // Macho no topo: mesmas medidas do anel que a base oferece ao corpo.
    expect(perfil[46].x).toBe(anel.externoMm);
    expect(perfil[47].y).toBeCloseTo(100 + anel.alturaMm, 9);
    expect(perfil[48].x).toBe(anel.internoMm);
  });

  it("o pé e o assento do macho respeitam canaleta + parede estrutural", () => {
    const raioPeMm =
      ENCAIXES.baseCorpo.anel.externoMm +
      ENCAIXES.folgaPadraoMm +
      REGRAS.F.paredeEstruturalMm.min;
    const alturaFemea =
      ENCAIXES.baseCorpo.anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
    const p: ParametrosEstrutural = {
      tipo: "haste",
      alturaMm: 100,
      barrigaMm: -10,
    };
    const lateral = lateralDaEstrutural(perfilEstrutural(p), 100);
    for (const q of lateral) {
      if (q.y < alturaFemea + 1 || q.y > 100 - ENCAIXES.baseCorpo.anel.alturaMm - 1) {
        expect(q.x).toBeGreaterThanOrEqual(raioPeMm - 1e-6);
      }
    }
  });
});

describe("F4 e S2 — os clamps valem para a estrutural", () => {
  it("barriga hostil sai grampeada no balanço", () => {
    const perfil = perfilEstrutural({
      tipo: "anel",
      alturaMm: 24,
      barrigaMm: 60,
    });
    const lateral = lateralDaEstrutural(perfil, 24);
    expect(inclinacaoMaxima(lateral)).toBeLessThanOrEqual(TAN_F4 * 1.1);
  });

  it("cintura profunda nunca invade o miolo elétrico", () => {
    const perfil = perfilEstrutural({
      tipo: "haste",
      alturaMm: 160,
      barrigaMm: -60,
    });
    for (const q of lateralDaEstrutural(perfil, 160)) {
      expect(q.x).toBeGreaterThanOrEqual(RAIO_LIVRE_MIOLO_MM - 1e-6);
    }
  });

  it("os presets do catálogo já nascem dentro do balanço", () => {
    for (const e of ESTRUTURAIS) {
      const lateral = lateralDaEstrutural(perfilEstrutural(e), e.alturaMm);
      expect(
        inclinacaoMaxima(lateral),
        `estrutural ${e.nome}`
      ).toBeLessThanOrEqual(TAN_F4 * 1.1);
    }
  });
});

describe("produção — sólido estanque", () => {
  it("toda estrutural do catálogo vira sólido fechado com normais para fora", () => {
    for (const e of ESTRUTURAIS) {
      const malha = malhaRevolucao(perfilEstrutural(e), 64);
      const rel = verificarEstanque(malha);
      expect(rel.ok, `estrutural ${e.nome}: ${rel.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(malha), `estrutural ${e.nome}`).toBeGreaterThan(
        0
      );
    }
  });
});

describe("validação — o backend não confia na pilha que chega", () => {
  it("lixo vira pilha válida, nunca erro", () => {
    const pilha = grampearEstruturais([
      { tipo: "torre", alturaMm: NaN, barrigaMm: "muito" },
      { tipo: "anel", alturaMm: 9999, barrigaMm: -9999 },
      null,
      { tipo: "haste", alturaMm: 120, barrigaMm: 0 },
      { tipo: "haste", alturaMm: 120, barrigaMm: 0 },
    ]);
    expect(pilha).toHaveLength(MAX_ESTRUTURAIS);
    for (const p of pilha) {
      expect(["haste", "anel"]).toContain(p.tipo);
      expect(p.alturaMm).toBeGreaterThanOrEqual(20);
      expect(p.alturaMm).toBeLessThanOrEqual(160);
      expect(p.barrigaMm).toBeGreaterThanOrEqual(-10);
      expect(p.barrigaMm).toBeLessThanOrEqual(14);
    }
  });

  it("não-lista vira pilha vazia", () => {
    expect(grampearEstruturais(undefined)).toEqual([]);
    expect(grampearEstruturais("x")).toEqual([]);
    expect(grampearEstruturais(42)).toEqual([]);
  });
});
