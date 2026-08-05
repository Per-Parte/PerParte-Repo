/**
 * ESTICAR (a×b) — terceira função da máquina r(θ) (pedido do Caio, 04/08):
 * seção anisotrópica. Garantias: envelope preservado no eixo X, eixo Y
 * encolhe para a proporção, encaixes redondos pela mesma janela/piso,
 * sólido estanque, compõe com facetas (quadrado → retângulo).
 */

import { describe, expect, it } from "vitest";
import {
  facetasParaBase,
  facetasParaCorpo,
  grampearProporcao,
  malhaRevolucao,
  perfilBase,
  perfilCorpo,
  RAIO_LIVRE_MIOLO_MM,
  type Malha,
  type ParametrosCorpo,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

const CORPO: ParametrosCorpo = {
  alturaMm: 160, volumeBojoMm: 20, posicaoBojo: 0, ondulacao: 0,
  amplitudeOndaMm: 0, gomos: 0, profundidadeGomosMm: 0, torcaoGraus: 0,
  deslocamentoMm: 0, posicaoDobra: 0,
};

/** Extensões X e Y de um anel da malha na altura mais próxima de yAlvo. */
function eixosNoY(m: Malha, nAneis: number, seg: number, yAlvo: number) {
  let melhorJ = 0;
  let melhorDist = Infinity;
  for (let j = 0; j < nAneis; j++) {
    const z = m.posicoes[j * seg * 3 + 2];
    const d = Math.abs(z - yAlvo);
    if (d < melhorDist) {
      melhorDist = d;
      melhorJ = j;
    }
  }
  let xMax = 0;
  let yMax = 0;
  for (let i = 0; i < seg; i++) {
    const o = (melhorJ * seg + i) * 3;
    xMax = Math.max(xMax, Math.abs(m.posicoes[o]));
    yMax = Math.max(yMax, Math.abs(m.posicoes[o + 1]));
  }
  return { xMax, yMax };
}

describe("esticar — seção anisotrópica a×b", () => {
  it("oval: X guarda o envelope, Y encolhe para a proporção", () => {
    const perfil = perfilCorpo(CORPO);
    const f = facetasParaCorpo(0, CORPO.alturaMm, undefined, 0.6);
    const m = malhaRevolucao(perfil, 96, undefined, undefined, f);
    const meio = eixosNoY(m, perfil.length, 96, 80);
    const rPerfil = perfil.reduce(
      (r, p) => (Math.abs(p.y - 80) < 6 ? Math.max(r, p.x) : r),
      0
    );
    expect(meio.xMax).toBeGreaterThan(rPerfil * 0.97);
    expect(meio.yMax).toBeLessThan(rPerfil * 0.6 + 1.5);
    expect(meio.yMax).toBeGreaterThan(rPerfil * 0.6 - 3);
  });

  it("quadrado → retângulo: compõe com 4 facetas", () => {
    // Corpo gordo: o eixo curto (0,6×) fica acima do piso do miolo.
    const perfil = perfilCorpo({
      ...CORPO,
      volumeBojoMm: 0,
      perfilLivre: [45, 45, 45, 45, 45],
    });
    const f = facetasParaCorpo(4, CORPO.alturaMm, undefined, 0.6);
    const m = malhaRevolucao(perfil, 192, undefined, undefined, f);
    const meio = eixosNoY(m, perfil.length, 192, 80);
    // Largura ≈ envelope; profundidade ≈ 0,6× — um retângulo de verdade.
    expect(meio.yMax / meio.xMax).toBeLessThan(0.66);
    expect(meio.yMax / meio.xMax).toBeGreaterThan(0.5);
    const r = verificarEstanque(m);
    expect(r.ok, r.problema ?? "").toBe(true);
  });

  it("as zonas de encaixe continuam redondas e fora do miolo", () => {
    const perfil = perfilCorpo(CORPO);
    const f = facetasParaCorpo(0, CORPO.alturaMm, undefined, 0.55);
    const m = malhaRevolucao(perfil, 96, undefined, undefined, f);
    // Fêmea (y≈2) e assento do macho (y≈159): X ≈ Y (redondos).
    for (const yAlvo of [1, CORPO.alturaMm - 0.5]) {
      const e = eixosNoY(m, perfil.length, 96, yAlvo);
      expect(Math.abs(e.xMax - e.yMax), `y=${yAlvo}`).toBeLessThan(0.05);
    }
    // O eixo curto nunca entra no miolo elétrico (piso da janela).
    const meio = eixosNoY(m, perfil.length, 96, 80);
    expect(meio.yMax).toBeGreaterThanOrEqual(RAIO_LIVRE_MIOLO_MM - 1e-3);
  });

  it("base oval (a Persiana): estanque e com envelope certo", () => {
    const perfil = perfilBase({ alturaMm: 40, raioMm: 100, curva: "reta" });
    const f = facetasParaBase(0, 40, undefined, 0.6);
    const m = malhaRevolucao(perfil, 96, undefined, undefined, f);
    const r = verificarEstanque(m);
    expect(r.ok, r.problema ?? "").toBe(true);
    expect(volumeAssinadoMm3(m)).toBeGreaterThan(0);
    const pe = eixosNoY(m, perfil.length, 96, 2);
    expect(pe.xMax).toBeGreaterThan(95);
    expect(pe.yMax).toBeLessThan(100 * 0.6 + 2);
  });

  it("grampear: 1/os inválidos somem, resto entra na faixa", () => {
    expect(grampearProporcao(1)).toBeUndefined();
    expect(grampearProporcao("x")).toBeUndefined();
    expect(grampearProporcao(0.1)).toBe(0.55);
    expect(grampearProporcao(0.8)).toBe(0.8);
  });
});
