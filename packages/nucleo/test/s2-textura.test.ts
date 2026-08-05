/**
 * S2 na MALHA texturizada — regressão da auditoria de 04/08: num corpo
 * magro (cintura/silhueta no mínimo), o vale do sulco descia para dentro
 * do cilindro do miolo elétrico (11,5 mm < 15,5). Com `pisoMm` na textura,
 * o sulco raseia sozinho onde falta parede.
 */

import { describe, expect, it } from "vitest";
import {
  grampearCorpo,
  malhaRevolucao,
  perfilCorpo,
  RAIO_LIVRE_MIOLO_MM,
  type Malha,
} from "../src";
import { verificarEstanque } from "./apoio";

function raioMinimoLateral(m: Malha, nAneis: number, seg: number): number {
  let r = Infinity;
  for (let v = 0; v < nAneis * seg; v++) {
    const o = v * 3;
    const z = m.posicoes[o + 2];
    if (z > 20 && z < 140) {
      r = Math.min(r, Math.hypot(m.posicoes[o], m.posicoes[o + 1]));
    }
  }
  return r;
}

describe("S2 — a textura nunca invade o miolo elétrico", () => {
  const casos = [
    ["cintura −12 + gomos 24×4", { volumeBojoMm: -12 }],
    ["silhueta livre 16 + gomos 24×4", { perfilLivre: [16, 16, 16, 16, 16] }],
  ] as const;

  for (const [nome, extra] of casos) {
    it(nome, () => {
      const corpo = grampearCorpo({
        alturaMm: 160, volumeBojoMm: 0, posicaoBojo: 0, ondulacao: 0,
        amplitudeOndaMm: 0, gomos: 24, profundidadeGomosMm: 4, torcaoGraus: 0,
        deslocamentoMm: 0, posicaoDobra: 0, ...extra,
      });
      const perfil = perfilCorpo(corpo);
      const m = malhaRevolucao(perfil, 96, {
        gomos: 24,
        profundidadeMm: 4,
        torcaoGraus: 0,
        alturaMm: corpo.alturaMm,
        pisoMm: RAIO_LIVRE_MIOLO_MM,
      });
      expect(raioMinimoLateral(m, perfil.length, 96)).toBeGreaterThanOrEqual(
        RAIO_LIVRE_MIOLO_MM - 1e-3
      );
      const r = verificarEstanque(m);
      expect(r.ok, r.problema ?? "").toBe(true);
    });
  }

  it("sem piso, o comportamento antigo continua (difusor não tem miolo)", () => {
    const corpo = grampearCorpo({
      alturaMm: 160, volumeBojoMm: -12, posicaoBojo: 0, ondulacao: 0,
      amplitudeOndaMm: 0, gomos: 24, profundidadeGomosMm: 4, torcaoGraus: 0,
      deslocamentoMm: 0, posicaoDobra: 0,
    });
    const perfil = perfilCorpo(corpo);
    const m = malhaRevolucao(perfil, 96, {
      gomos: 24, profundidadeMm: 4, torcaoGraus: 0, alturaMm: corpo.alturaMm,
    });
    expect(raioMinimoLateral(m, perfil.length, 96)).toBeLessThan(
      RAIO_LIVRE_MIOLO_MM
    );
  });
});
