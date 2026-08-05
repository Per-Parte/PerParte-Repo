/**
 * Regra de composição dupla — regressão da auditoria A2–A4 (04/08):
 * separação sobe até as colunas terem ar; difusor raseia quando nem o teto
 * dá conta; curva S "para dentro" para onde o ar acaba.
 */

import { describe, expect, it } from "vitest";
import {
  alturaSuperficieBaseMm,
  BASES,
  ajustarComposicaoDupla,
  CORPOS,
  DIFUSORES,
  FOLGA_AR_MM,
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
    const teto = separacaoMaximaMm(110, 1); // base larga: teto alto
    const c = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 70,
      separacaoTetoMm: teto,
    });
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(2 * raioCol + FOLGA_AR_MM - 1e-6);
    expect(c.ajustes.separacaoSubiu).toBe(true);
  });

  it("dois difusores no teto do slider raseiam até caber", () => {
    const grande: ParametrosDifusor = { ...SINO, raioMm: 90, alturaMm: 100 };
    const teto = separacaoMaximaMm(82, 1); // base padrão: teto ~96
    const c = ajustarComposicaoDupla(BASES[0], CORPO, grande, [], {
      comPlaca: false,
      separacaoPedidaMm: 160,
      separacaoTetoMm: teto,
    });
    expect(c.ajustes.difusorRaseou).toBe(true);
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
      separacaoTetoMm: 160,
    });
    expect(c.corpo.deslocamentoMm).toBeGreaterThanOrEqual(-c.tetoInternoMm - 1e-6);
    expect(c.ajustes.deslocamentoParou).toBe(true);
    // Para FORA continua livre.
    const fora = ajustarComposicaoDupla(
      BASES[0],
      { ...corpoDebrucado, deslocamentoMm: 84 },
      DIFUSORES[0],
      [],
      { comPlaca: false, separacaoPedidaMm: 160, separacaoTetoMm: 160 }
    );
    expect(fora.corpo.deslocamentoMm).toBe(84);
  });

  it("com refletor, o envelope da placa entra na conta", () => {
    const grande: ParametrosDifusor = { ...DIFUSORES[0], raioMm: 90 };
    const c = ajustarComposicaoDupla(BASES[0], CORPO, grande, [], {
      comPlaca: true,
      separacaoPedidaMm: 70,
      separacaoTetoMm: separacaoMaximaMm(110, 1),
    });
    const raioCol = raioEnvelopeColunaMm(c.corpo, c.difusor, []);
    expect(c.separacaoMm).toBeGreaterThanOrEqual(raioCol + 26 + FOLGA_AR_MM - 1e-6);
  });

  it("determinística: mesma entrada, mesma saída (contrato preview = STL)", () => {
    const a = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
      separacaoTetoMm: 150,
    });
    const b = ajustarComposicaoDupla(BASES[0], CORPO, SINO, [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
      separacaoTetoMm: 150,
    });
    expect(a).toEqual(b);
  });
});

describe("composição dupla — a base precisa de PRATO (auditoria 05/08)", () => {
  it("base Cone vira prato reto (as pastilhas não têm onde assentar no flanco)", () => {
    const cone = BASES.find((b) => b.curva === "cone")!;
    const c = ajustarComposicaoDupla(cone, CORPO, DIFUSORES[0], [], {
      comPlaca: false,
      separacaoPedidaMm: 100,
      separacaoTetoMm: 150,
    });
    expect(c.base.curva).toBe("reta");
    expect(c.ajustes.baseVirouPrato).toBe(true);
  });

  it("as pastilhas assentam onde a superfície REALMENTE está", () => {
    // No ombro da base reta, a superfície no raio das pastilhas fica
    // abaixo do topo nominal — o assento acompanha.
    const reta = { alturaMm: 26, raioMm: 82, curva: "reta" as const };
    const ySup = alturaSuperficieBaseMm(reta, 1, 50);
    expect(ySup).toBeGreaterThan(0);
    expect(ySup).toBeLessThanOrEqual(reta.alturaMm);
    // Mais para fora, a superfície só desce (monotônico no ombro).
    expect(alturaSuperficieBaseMm(reta, 1, 60)).toBeLessThanOrEqual(ySup);
  });
});
