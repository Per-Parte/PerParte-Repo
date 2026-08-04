/**
 * Corte de terminação (z(θ)) — oblíquo e dentes na borda livre do difusor.
 * Garantias: estanque, borda desce conforme δ(θ), nada abaixo do corte
 * muda (fêmea intacta, F4 intacto), silhueta lateral inalterada.
 */

import { describe, expect, it } from "vitest";
import {
  deltaCorteMm,
  grampearCorteBorda,
  malhaRevolucao,
  perfilDifusor,
  profundidadeMaximaCorteMm,
  type CorteBorda,
  type Malha,
  type ParametrosDifusor,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

const DIFUSOR: ParametrosDifusor = {
  forma: "cone",
  alturaMm: 100,
  raioMm: 70,
  gomos: 0,
  profundidadeGomosMm: 0,
};

const OBLIQUO: CorteBorda = { tipo: "obliquo", profundidadeMm: 18 };
const DENTES: CorteBorda = { tipo: "dentes", profundidadeMm: 12, repeticao: 8 };

/** z máximo e mínimo dos vértices do último anel do perfil. */
function bordaDa(m: Malha, seg: number, nAneis: number) {
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 0; i < seg; i++) {
    const z = m.posicoes[((nAneis - 1) * seg + i) * 3 + 2];
    zMin = Math.min(zMin, z);
    zMax = Math.max(zMax, z);
  }
  return { zMin, zMax };
}

describe("z(θ) — corte de terminação", () => {
  it("δ(θ) é periódico e respeita a profundidade", () => {
    for (const corte of [OBLIQUO, DENTES]) {
      for (let k = 0; k <= 40; k++) {
        const d = deltaCorteMm(corte, k / 40);
        expect(d).toBeGreaterThanOrEqual(-1e-9);
        expect(d).toBeLessThanOrEqual(corte.profundidadeMm + 1e-9);
      }
      expect(deltaCorteMm(corte, 0)).toBeCloseTo(deltaCorteMm(corte, 1), 9);
    }
  });

  it("a borda desce a profundidade inteira e o sólido continua estanque", () => {
    const perfil = perfilDifusor(DIFUSOR);
    for (const corte of [OBLIQUO, DENTES]) {
      const m = malhaRevolucao(perfil, 96, undefined, undefined, undefined, corte);
      const r = verificarEstanque(m);
      expect(r.ok, `${corte.tipo}: ${r.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(m)).toBeGreaterThan(0);

      const { zMin, zMax } = bordaDa(m, 96, perfil.length);
      const topo = Math.max(...perfil.map((p) => p.y));
      expect(zMax, corte.tipo).toBeCloseTo(topo, 1);
      expect(zMin, corte.tipo).toBeCloseTo(topo - corte.profundidadeMm, 1);
    }
  });

  it("abaixo do corte nada muda — fêmea intacta, silhueta intacta", () => {
    const perfil = perfilDifusor(DIFUSOR);
    const topo = Math.max(...perfil.map((p) => p.y));
    const sem = malhaRevolucao(perfil, 96);
    const com = malhaRevolucao(perfil, 96, undefined, undefined, undefined, OBLIQUO);
    for (let v = 0; v < perfil.length * 96; v++) {
      const o = v * 3;
      if (sem.posicoes[o + 2] < topo - OBLIQUO.profundidadeMm - 1e-6) {
        expect(com.posicoes[o]).toBe(sem.posicoes[o]);
        expect(com.posicoes[o + 1]).toBe(sem.posicoes[o + 1]);
        expect(com.posicoes[o + 2]).toBe(sem.posicoes[o + 2]);
      }
      // O corte mexe em z, nunca em r: x/y idênticos em TODO vértice.
      expect(com.posicoes[o]).toBe(sem.posicoes[o]);
      expect(com.posicoes[o + 1]).toBe(sem.posicoes[o + 1]);
      // E nenhum vértice sobe.
      expect(com.posicoes[o + 2]).toBeLessThanOrEqual(
        sem.posicoes[o + 2] + 1e-6
      );
    }
  });

  it("grampear: profundidade limitada pela altura, tipo inválido cai fora", () => {
    expect(grampearCorteBorda(undefined, 100)).toBeUndefined();
    expect(grampearCorteBorda({ tipo: "espiral" }, 100)).toBeUndefined();
    const fundo = grampearCorteBorda(
      { tipo: "obliquo", profundidadeMm: 999 },
      60
    );
    expect(fundo?.profundidadeMm).toBe(profundidadeMaximaCorteMm(60));
    expect(profundidadeMaximaCorteMm(60)).toBeLessThanOrEqual(18);
    const dentes = grampearCorteBorda(
      { tipo: "dentes", profundidadeMm: 10, repeticao: 99 },
      100
    );
    expect(dentes?.repeticao).toBe(20);
  });
});
