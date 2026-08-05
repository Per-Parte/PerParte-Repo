/**
 * Regressão da auditoria 2 (05/08) — B1, B2 e B7:
 * o slider da silhueta é o raio DE VERDADE (Catmull sem barriga);
 * esticar é seção e compõe com textura; o peso enxerga o perímetro real.
 */

import { describe, expect, it } from "vitest";
import {
  facetasParaCorpo,
  fatorPerimetroSecao,
  grampearCorpo,
  LIMITES_CRIAR,
  malhaRevolucao,
  perfilCorpo,
  RAIO_LIVRE_MIOLO_MM,
  type ParametrosCorpo,
  type TexturaRevolucao,
} from "../src";

const CORPO0: ParametrosCorpo = {
  alturaMm: 200,
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

const rMaxDe = (p: ParametrosCorpo) =>
  perfilCorpo(p).reduce((r, q) => Math.max(r, q.x), 0);

describe("B1 — a silhueta livre nunca passa dos controles", () => {
  it("platôs iguais ficam NO valor do controle (nada de barriga)", () => {
    for (const v of [45, 60]) {
      const corpo = grampearCorpo({
        ...CORPO0,
        perfilLivre: [v, v, v, v, v],
      });
      expect(rMaxDe(corpo)).toBeLessThanOrEqual(v + 1e-9);
    }
  });

  it("o teto do slider é o teto da geometria", () => {
    const teto = LIMITES_CRIAR.corpo.perfilLivreRaioMm.max;
    const corpo = grampearCorpo({
      ...CORPO0,
      perfilLivre: [teto, teto, teto, teto, teto],
    });
    expect(rMaxDe(corpo)).toBeLessThanOrEqual(teto + 1e-9);
  });

  it("cada trecho fica na faixa dos dois controles vizinhos", () => {
    const livre = [60, 16, 60, 16, 60];
    const corpo = grampearCorpo({ ...CORPO0, perfilLivre: livre });
    // O máximo global continua 60 e o mínimo nunca fura abaixo do PISO da
    // cascata (miolo elétrico) nem do menor controle.
    const perfil = perfilCorpo(corpo).filter(
      (p) => p.y > 10 && p.y < corpo.alturaMm - 10
    );
    const rMax = perfil.reduce((r, p) => Math.max(r, p.x), 0);
    expect(rMax).toBeLessThanOrEqual(60 + 1e-9);
  });

  it("morros intencionais continuam existindo (o clamp não achata o desenho)", () => {
    const corpo = grampearCorpo({
      ...CORPO0,
      perfilLivre: [20, 50, 20, 50, 20],
    });
    const perfil = perfilCorpo(corpo);
    const rMax = perfil.reduce((r, p) => Math.max(r, p.x), 0);
    const rMin = perfil
      .filter((p) => p.y > 20 && p.y < corpo.alturaMm - 20)
      .reduce((r, p) => Math.min(r, p.x), Infinity);
    expect(rMax).toBeGreaterThan(45); // os morros chegam perto de 50
    expect(rMin).toBeLessThan(30); // os vales descem de verdade
  });
});

describe("B2 — esticar é seção: compõe com a textura", () => {
  it("corpo esticado COM gomos tem os dois efeitos na malha", () => {
    const corpo = grampearCorpo({
      ...CORPO0,
      perfilLivre: [45, 45, 45, 45, 45],
      gomos: 16,
      profundidadeGomosMm: 6,
    });
    const perfil = perfilCorpo(corpo);
    const textura: TexturaRevolucao = {
      gomos: 16,
      profundidadeMm: 6,
      torcaoGraus: 0,
      alturaMm: corpo.alturaMm,
      pisoMm: RAIO_LIVRE_MIOLO_MM,
    };
    const facetas = facetasParaCorpo(0, corpo.alturaMm, undefined, 0.7);
    const m = malhaRevolucao(perfil, 192, textura, undefined, facetas);
    // No meio do corpo: X esticado ~45, Y encolhido ~31,5 — e os SULCOS
    // presentes (máximos locais de r(θ) ≈ nº de gomos).
    let cristas = 0;
    const anel: number[] = [];
    const alvoY = corpo.alturaMm / 2;
    let jMeio = 0;
    for (let j = 0; j < perfil.length; j++) {
      if (Math.abs(perfil[j].y - alvoY) < Math.abs(perfil[jMeio].y - alvoY))
        jMeio = j;
    }
    for (let i = 0; i < 192; i++) {
      const o = (jMeio * 192 + i) * 3;
      anel.push(Math.hypot(m.posicoes[o], m.posicoes[o + 1]));
    }
    for (let i = 0; i < 192; i++) {
      const a = anel[(i + 191) % 192];
      const b = anel[i];
      const c = anel[(i + 1) % 192];
      if (b > a && b >= c) cristas++;
    }
    expect(cristas).toBeGreaterThanOrEqual(12); // gomos vivos (16 ± tolerância)
    // E a seção está de fato esticada: bbox Y do anel < bbox X.
    let xMax = 0;
    let yMax = 0;
    for (let i = 0; i < 192; i++) {
      const o = (jMeio * 192 + i) * 3;
      xMax = Math.max(xMax, Math.abs(m.posicoes[o]));
      yMax = Math.max(yMax, Math.abs(m.posicoes[o + 1]));
    }
    expect(yMax / xMax).toBeLessThan(0.78); // ~0,7 com sulcos
  });
});

describe("B7 — o peso enxerga o perímetro real da seção", () => {
  const perfil = perfilCorpo(
    grampearCorpo({ ...CORPO0, perfilLivre: [45, 45, 45, 45, 45] })
  );

  it("liso e redondo = fator 1", () => {
    expect(fatorPerimetroSecao(perfil)).toBe(1);
  });

  it("aletas fundas ENGORDAM o material (o caso dos +73 %)", () => {
    const f = fatorPerimetroSecao(perfil, {
      gomos: 22,
      profundidadeMm: 12,
      torcaoGraus: 0,
      alturaMm: 200,
      pisoMm: RAIO_LIVRE_MIOLO_MM,
    });
    expect(f).toBeGreaterThan(1.3);
    expect(f).toBeLessThan(2.2);
  });

  it("esticar ENCOLHE o material (elipse tem perímetro menor)", () => {
    const f = fatorPerimetroSecao(
      perfil,
      undefined,
      facetasParaCorpo(0, 200, undefined, 0.55)
    );
    expect(f).toBeLessThan(0.9);
    expect(f).toBeGreaterThan(0.7);
  });

  it("facetas 4 lados encolhem ~10 %", () => {
    const f = fatorPerimetroSecao(
      perfil,
      undefined,
      facetasParaCorpo(4, 200)
    );
    expect(f).toBeLessThan(0.95);
    expect(f).toBeGreaterThan(0.85);
  });

  it("determinístico (contrato preview = backend)", () => {
    const t: TexturaRevolucao = {
      gomos: 12,
      profundidadeMm: 4,
      torcaoGraus: 30,
      alturaMm: 200,
    };
    const fac = facetasParaCorpo(0, 200, 4, 0.7);
    expect(fatorPerimetroSecao(perfil, t, fac)).toBe(
      fatorPerimetroSecao(perfil, t, fac)
    );
  });
});
