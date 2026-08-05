/**
 * Regra de composição dupla — regressão das auditorias A2–A4 (04/08) e
 * B3/B4/B8 (05/08): base vira PRATO de verdade e alarga até as colunas
 * terem ar; difusor raseia com a junta re-grampeada; corpo raseia por
 * último; curva S "para dentro" para onde o ar acaba.
 */

import { describe, expect, it } from "vitest";
import {
  alturaSuperficieBaseMm,
  BASES,
  ajustarComposicaoDupla,
  CORPOS,
  DIFUSORES,
  FOLGA_AR_MM,
  grampearCorpo,
  grampearDifusor,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  raioEnvelopeColunaMm,
  separacaoMaximaMm,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "../src";

const CORPO: ParametrosCorpo = CORPOS[0];
const SINO: ParametrosDifusor = DIFUSORES[1];

const raioDe = (d: ParametrosDifusor) =>
  perfilDifusor(d).reduce((r, p) => Math.max(r, p.x), 0);

describe("composição dupla — separação × raios × envelopes", () => {
  it("o cenário da auditoria (Sino a 7 cm) ganha ar sozinho", () => {
    const c = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 70,
    });
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(2 * raioCol + FOLGA_AR_MM - 1e-6);
    expect(c.ajustes.separacaoSubiu).toBe(true);
  });

  it("a regra do ar NUNCA é violada — nem no pior canto (B4)", () => {
    // Corpo no teto do slider (60) + difusor grande: antes da cirurgia as
    // colunas se atravessavam 42 mm com o clamp do teto da pastilha.
    const corpoGordo = grampearCorpo({
      ...CORPO,
      perfilLivre: [60, 60, 60, 60, 60],
    });
    const grande: ParametrosDifusor = { ...SINO, raioMm: 90, alturaMm: 100 };
    const c = ajustarComposicaoDupla(BASES[0], corpoGordo, grande, [], {
      comPlaca: false,
      separacaoPedidaMm: 70,
    });
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(2 * raioCol + FOLGA_AR_MM - 1e-6);
    // A base alargou para dar esse ar (espírito do E2).
    expect(c.ajustes.baseAlargou).toBe(true);
    expect(c.base.raioMm).toBeGreaterThan(BASES[0].raioMm);
  });

  it("facetada, a base alarga até o F1 e o CORPO raseia por último (B4)", () => {
    const corpoGordo = grampearCorpo({
      ...CORPO,
      perfilLivre: [60, 60, 60, 60, 60],
    });
    const c = ajustarComposicaoDupla(BASES[0], corpoGordo, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 70,
      lados: 4, // quadrado: o raio útil no meio da face cai para r·cos(π/4)
    });
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(2 * raioCol + FOLGA_AR_MM - 1e-6);
    expect(c.ajustes.corpoRaseou).toBe(true);
    // O prato não passa do F1 (mesa 250 → raio 123).
    expect(c.base.raioMm).toBeLessThanOrEqual(123);
    // E o teto do corpo é o que o slider vai explicar.
    const rMaxCorpo = perfilCorpo(c.corpo).reduce((r, p) => Math.max(r, p.x), 0);
    expect(rMaxCorpo).toBeLessThanOrEqual(c.raioCorpoTetoMm + 0.05);
  });

  it("dois difusores no teto do slider raseiam até caber", () => {
    const grande: ParametrosDifusor = { ...SINO, raioMm: 90, alturaMm: 100 };
    const c = ajustarComposicaoDupla(BASES[0], CORPO, grande, [], {
      comPlaca: false,
      separacaoPedidaMm: 160,
    });
    expect(2 * raioDe(c.difusor) + FOLGA_AR_MM).toBeLessThanOrEqual(
      c.separacaoMm + 1e-6
    );
  });

  it("curva S para dentro respeita o ar entre as colunas", () => {
    const corpoDebrucado: ParametrosCorpo = {
      ...CORPO,
      alturaMm: 240,
      deslocamentoMm: -84,
    };
    const c = ajustarComposicaoDupla(BASES[0], corpoDebrucado, DIFUSORES[0], [], {
      comPlaca: false,
      separacaoPedidaMm: 160,
    });
    expect(c.corpo.deslocamentoMm).toBeGreaterThanOrEqual(-c.tetoInternoMm - 1e-6);
    expect(c.ajustes.deslocamentoParou).toBe(true);
    // Para FORA continua livre.
    const fora = ajustarComposicaoDupla(
      BASES[0],
      { ...corpoDebrucado, deslocamentoMm: 84 },
      DIFUSORES[0],
      [],
      { comPlaca: false, separacaoPedidaMm: 160 }
    );
    expect(fora.corpo.deslocamentoMm).toBe(84);
  });

  it("com refletor, o envelope da placa entra na conta", () => {
    const grande: ParametrosDifusor = { ...DIFUSORES[0], raioMm: 90 };
    const c = ajustarComposicaoDupla(BASES[0], CORPO, grande, [], {
      comPlaca: true,
      separacaoPedidaMm: 70,
    });
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(raioCol + 26 + FOLGA_AR_MM - 1e-6);
  });

  it("determinística: mesma entrada, mesma saída (contrato preview = STL)", () => {
    const a = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
    });
    const b = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
    });
    expect(a).toEqual(b);
  });
});

describe("composição dupla — a base é um PRATO de verdade (B3)", () => {
  it("toda base vira prato: cilindro de topo plano, sem ombro", () => {
    for (const base of BASES) {
      const c = ajustarComposicaoDupla(base, CORPO, DIFUSORES[0], [], {
        comPlaca: false,
        separacaoPedidaMm: 100,
      });
      expect(c.base.curva).toBe("prato");
      // A superfície no raio das pastilhas é o PRÓPRIO topo da base — a
      // pastilha aflora inteira (antes: enterrada 9 mm no ombro da reta).
      expect(c.superficieBaseMm).toBeCloseTo(c.base.alturaMm, 5);
    }
  });

  it("curvas que mudam de cara avisam; a reta vira prato em silêncio", () => {
    const cone = BASES.find((b) => b.curva === "cone")!;
    const cCone = ajustarComposicaoDupla(cone, CORPO, DIFUSORES[0], [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
    });
    expect(cCone.ajustes.baseVirouPrato).toBe(true);
    const reta = BASES.find((b) => b.curva === "reta")!;
    const cReta = ajustarComposicaoDupla(reta, CORPO, DIFUSORES[0], [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
    });
    expect(cReta.ajustes.baseVirouPrato).toBe(false);
  });

  it("o prato cobre a pastilha inteira no perfil real", () => {
    const c = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 160,
    });
    const perfil = perfilBase(c.base, 1, false);
    const bordaPastilhaMm = c.separacaoMm / 2 + 30;
    // No raio da borda externa da pastilha, a superfície está no topo.
    let yNaBorda = 0;
    for (const p of perfil) if (p.x >= bordaPastilhaMm) yNaBorda = Math.max(yNaBorda, p.y);
    expect(yNaBorda).toBeCloseTo(c.base.alturaMm, 5);
  });

  it("alturaSuperficieBaseMm segue honesta para curvas com ombro (defesa)", () => {
    const reta = { alturaMm: 26, raioMm: 82, curva: "reta" as const };
    const ySup = alturaSuperficieBaseMm(reta, 1, 50);
    expect(ySup).toBeGreaterThan(0);
    expect(ySup).toBeLessThanOrEqual(reta.alturaMm);
    expect(alturaSuperficieBaseMm(reta, 1, 60)).toBeLessThanOrEqual(ySup);
  });
});

describe("composição dupla × junta inclinada (B8)", () => {
  it("o raseio re-grampeia a junta: a cabeça continua sobre o pescoço", () => {
    const comCabeca = grampearDifusor({
      forma: "lanterna",
      alturaMm: 80,
      raioMm: 90,
      gomos: 0,
      profundidadeGomosMm: 0,
      junta: { inclinacaoGraus: 25, deslocamentoMm: 40 },
    });
    const c = ajustarComposicaoDupla(BASES[0], CORPO, comCabeca, [], {
      comPlaca: false,
      separacaoPedidaMm: 70,
    });
    if (c.ajustes.difusorRaseou && c.difusor.junta) {
      // O grampo da junta para o raio NOVO: desloc ≤ raio − 25.
      expect(c.difusor.junta.deslocamentoMm).toBeLessThanOrEqual(
        Math.max(0, c.difusor.raioMm - 25)
      );
    }
    // E a regra do ar usa o alcance REAL da nuca da cabeça.
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(2 * raioCol + FOLGA_AR_MM - 1e-6);
  });
});
