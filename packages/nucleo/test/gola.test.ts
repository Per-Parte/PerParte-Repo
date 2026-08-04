/**
 * Berço (gola) — a parede que sobe acima do plano do encaixe, com o macho
 * F5 rebaixado dentro (o gesto do Weight). Garantias: estanque, macho
 * intacto, corte nunca alcança o assento, interferência gola × difusor.
 */

import { describe, expect, it } from "vitest";
import {
  ajustarGolaAoDifusor,
  ENCAIXES,
  ESPESSURA_GOLA_MM,
  golaMaximaMm,
  grampearCorpo,
  malhaRevolucao,
  perfilCorpo,
  perfilDifusor,
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
  gola: { alturaMm: 30, raioMm: 50 },
};

const GLOBO: ParametrosDifusor = {
  forma: "globo",
  alturaMm: 100,
  raioMm: 65,
  gomos: 0,
  profundidadeGomosMm: 0,
};

describe("gola — o berço do Weight", () => {
  it("perfil com gola sobe acima do encaixe e continua estanque", () => {
    const perfil = perfilCorpo(CORPO);
    const yMax = Math.max(...perfil.map((p) => p.y));
    expect(yMax).toBeCloseTo(CORPO.alturaMm + 30, 5);
    // Parede externa e interna da gola presentes.
    expect(
      perfil.some((p) => p.y > CORPO.alturaMm && p.x >= 50 + ESPESSURA_GOLA_MM - 1e-6)
    ).toBe(true);
    expect(perfil.some((p) => p.y > CORPO.alturaMm && Math.abs(p.x - 50) < 1e-6)).toBe(
      true
    );
    const m = malhaRevolucao(perfil, 96);
    const r = verificarEstanque(m);
    expect(r.ok, r.problema ?? "").toBe(true);
    expect(volumeAssinadoMm3(m)).toBeGreaterThan(0);
  });

  it("o macho F5 continua no plano do encaixe, rebaixado dentro da gola", () => {
    const perfil = perfilCorpo(CORPO);
    const anel = ENCAIXES.corpoDifusor.anel;
    // pontosMacho: anel externo/interno presentes em h e h+altura do anel.
    expect(
      perfil.some(
        (p) => Math.abs(p.x - anel.externoMm) < 1e-6 && Math.abs(p.y - CORPO.alturaMm) < 1e-6
      )
    ).toBe(true);
    expect(
      perfil.some(
        (p) =>
          Math.abs(p.x - anel.externoMm) < 1e-6 &&
          Math.abs(p.y - (CORPO.alturaMm + anel.alturaMm)) < 1e-6
      )
    ).toBe(true);
  });

  it("corte na gola nunca alcança o assento do macho (grampeado)", () => {
    const corpo = grampearCorpo({
      ...CORPO,
      gola: { alturaMm: 20, raioMm: 50 },
      corte: { tipo: "obliquo", profundidadeMm: 25 },
    });
    expect(corpo.corte).toBeDefined();
    expect(corpo.corte!.profundidadeMm).toBeLessThanOrEqual(20 - 8);
  });

  it("corte sem gola cai fora no grampeamento", () => {
    const corpo = grampearCorpo({
      ...CORPO,
      gola: undefined,
      corte: { tipo: "obliquo", profundidadeMm: 15 },
    });
    expect(corpo.gola).toBeUndefined();
    expect(corpo.corte).toBeUndefined();
  });

  it("gola × difusor: a altura respeita onde o difusor alarga", () => {
    const teto = golaMaximaMm(perfilDifusor(GLOBO), 50);
    expect(teto).toBeGreaterThan(0);
    expect(teto).toBeLessThan(60);
    // O globo de raio 65 passa dos 50 mm de boca em pouca altura.
    const ajustado = ajustarGolaAoDifusor(
      { ...CORPO, gola: { alturaMm: 60, raioMm: 50 } },
      GLOBO
    );
    expect(ajustado.gola!.alturaMm).toBeLessThanOrEqual(teto);
    // E o perfil ajustado de fato não invade o difusor (folga 2 mm).
    const perfilD = perfilDifusor(GLOBO);
    for (const q of perfilD) {
      if (q.y > 0 && q.y < ajustado.gola!.alturaMm) {
        expect(q.x + 2).toBeLessThanOrEqual(50 + 1e-6);
      }
    }
  });

  it("difusor largo demais na boca: a gola sai inteira, sem erro", () => {
    const ajustado = ajustarGolaAoDifusor(
      { ...CORPO, gola: { alturaMm: 30, raioMm: 40 } },
      { ...GLOBO, forma: "sino", raioMm: 90 }
    );
    // Se nem o mínimo couber, some — nunca meia-gola inválida.
    if (ajustado.gola) {
      const teto = golaMaximaMm(
        perfilDifusor({ ...GLOBO, forma: "sino", raioMm: 90 }),
        40
      );
      expect(ajustado.gola.alturaMm).toBeLessThanOrEqual(teto);
    } else {
      expect(ajustado.corte).toBeUndefined();
    }
  });

  it("sem gola, o perfil sai idêntico ao de antes", () => {
    const semGola = { ...CORPO, gola: undefined };
    const a = perfilCorpo(semGola);
    const b = perfilCorpo({ ...semGola });
    expect(a).toEqual(b);
    expect(Math.max(...a.map((p) => p.y))).toBeCloseTo(
      CORPO.alturaMm + ENCAIXES.corpoDifusor.anel.alturaMm,
      5
    );
  });
});
