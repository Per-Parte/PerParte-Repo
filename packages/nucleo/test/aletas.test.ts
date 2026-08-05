/**
 * Aletas profundas + torção (raio-X 05/08): profundidade de gomo até 12 mm
 * com a hélice clampada pelo F4 (tan = r·τ/h ≤ 1). Garantias: estanque,
 * S2 intacto (pisoMm), silhueta = envelope, e o clamp helicoidal age em
 * peça larga e baixa.
 */

import { describe, expect, it } from "vitest";
import {
  grampearCorpo,
  LIMITES_CRIAR,
  malhaRevolucao,
  perfilCorpo,
  RAIO_LIVRE_MIOLO_MM,
  type Malha,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

function raioMinLateral(m: Malha, nAneis: number, seg: number): number {
  let r = Infinity;
  for (let v = 0; v < nAneis * seg; v++) {
    const o = v * 3;
    const z = m.posicoes[o + 2];
    if (z > 20 && z < 140) r = Math.min(r, Math.hypot(m.posicoes[o], m.posicoes[o + 1]));
  }
  return r;
}

describe("aletas profundas × torção", () => {
  it("o teto novo permite 12 mm e a coluna torcida continua estanque", () => {
    expect(LIMITES_CRIAR.corpo.profundidadeGomosMm.max).toBe(12);
    const corpo = grampearCorpo({
      alturaMm: 200, volumeBojoMm: 0, posicaoBojo: 0, ondulacao: 0,
      amplitudeOndaMm: 0, gomos: 22, profundidadeGomosMm: 12, torcaoGraus: 60,
      deslocamentoMm: 0, posicaoDobra: 0,
      perfilLivre: [42, 42, 42, 42, 42],
    });
    const perfil = perfilCorpo(corpo);
    const m = malhaRevolucao(perfil, 192, {
      gomos: 22, profundidadeMm: 12, torcaoGraus: 60,
      alturaMm: 200, pisoMm: RAIO_LIVRE_MIOLO_MM,
    });
    const r = verificarEstanque(m);
    expect(r.ok, r.problema ?? "").toBe(true);
    expect(volumeAssinadoMm3(m)).toBeGreaterThan(0);
    // S2: o vale de 12 mm nunca cruza o miolo.
    expect(raioMinLateral(m, perfil.length, 192)).toBeGreaterThanOrEqual(
      RAIO_LIVRE_MIOLO_MM - 1e-3
    );
  });

  it("hélice × F4: o pior caso dos sliders fica DENTRO do teto (clamp é defesa)", () => {
    // Pior caso alcançável: corpo mais largo (bojo máx) e mais baixo (100).
    // tan da hélice = r·τ/h com τ = 90°: rMax·(π/2)/100 ≤ 1 ⇔ h/rMax ≥ π/2.
    const alturaMm = 100;
    const perfil = perfilCorpo(
      grampearCorpo({
        alturaMm, volumeBojoMm: 35, posicaoBojo: 0, ondulacao: 0,
        amplitudeOndaMm: 0, gomos: 12, profundidadeGomosMm: 8,
        torcaoGraus: 90, deslocamentoMm: 0, posicaoDobra: 0,
      })
    );
    const rMax = perfil.reduce((r, p) => Math.max(r, p.x), 0);
    // Dentro do espaço de sliders o teto nunca é atingido — o clamp da
    // malha é defesa em profundidade para limites futuros.
    expect(alturaMm / rMax).toBeGreaterThan(Math.PI / 2);
    const m = malhaRevolucao(perfil, 96, {
      gomos: 12, profundidadeMm: 8, torcaoGraus: 90,
      alturaMm, pisoMm: RAIO_LIVRE_MIOLO_MM,
    });
    const r = verificarEstanque(m);
    expect(r.ok, r.problema ?? "").toBe(true);
  });

  it("difusor continua com teto raso (casca fina F3)", () => {
    expect(LIMITES_CRIAR.difusor.profundidadeGomosMm.max).toBe(3);
  });
});
