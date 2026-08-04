/**
 * E1/E2 — a base alarga sozinha e o aviso de tombamento é honesto.
 * Preço — estimativa sã: mais material custa mais, duo custa mais que solo.
 */

import { describe, expect, it } from "vitest";
import {
  BASES,
  contrapesoNecessarioG,
  CORPOS,
  DIFUSORES,
  estabilidade,
  estimarPreco,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
  REGRAS,
  type ParametrosCorpo,
} from "../src";

const CORPO_RETO: ParametrosCorpo = {
  alturaMm: 240,
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

describe("estabilidade", () => {
  it("composição equilibrada do catálogo não pede ajuste", () => {
    const r = estabilidade(BASES[0], CORPOS[0], DIFUSORES[0]);
    expect(r.escala).toBe(1);
    expect(r.ajustada).toBe(false);
    expect(r.tombando).toBe(false);
    expect(r.ladoTombando).toBeNull();
  });

  it("difusor grande em corpo alto sobre base mínima alarga a base (E2)", () => {
    const r = estabilidade(
      { alturaMm: 20, raioMm: 60, curva: "reta" },
      { ...CORPO_RETO },
      { forma: "globo", alturaMm: 130, raioMm: 90, gomos: 0, profundidadeGomosMm: 0 }
    );
    expect(r.escala).toBeGreaterThan(1);
    expect(r.escala).toBeLessThanOrEqual(1.45);
    expect(r.ajustada).toBe(true);
  });

  it("espinha no máximo sobre base mínima tomba para o lado certo (E1)", () => {
    const r = estabilidade(
      { alturaMm: 20, raioMm: 60, curva: "reta" },
      { ...CORPO_RETO, deslocamentoMm: 80 },
      { forma: "globo", alturaMm: 130, raioMm: 90, gomos: 0, profundidadeGomosMm: 0 }
    );
    expect(r.tombando).toBe(true);
    expect(r.ladoTombando).toBe("direita");
    const esquerda = estabilidade(
      { alturaMm: 20, raioMm: 60, curva: "reta" },
      { ...CORPO_RETO, deslocamentoMm: -80 },
      { forma: "globo", alturaMm: 130, raioMm: 90, gomos: 0, profundidadeGomosMm: 0 }
    );
    expect(esquerda.ladoTombando).toBe("esquerda");
  });

  it("dois pontos de luz são simétricos: espinha não desloca o CG", () => {
    const r = estabilidade(
      { alturaMm: 20, raioMm: 60, curva: "reta" },
      { ...CORPO_RETO, deslocamentoMm: 80 },
      { forma: "globo", alturaMm: 130, raioMm: 90, gomos: 0, profundidadeGomosMm: 0 },
      2
    );
    expect(r.xCgMm).toBe(0);
    expect(r.tombando).toBe(false);
  });
});

describe("E3 — contrapeso", () => {
  const BASE_MINIMA = { alturaMm: 20, raioMm: 60, curva: "reta" as const };
  const DIFUSOR_GRANDE = {
    forma: "globo" as const,
    alturaMm: 130,
    raioMm: 90,
    gomos: 0,
    profundidadeGomosMm: 0,
  };

  it("composição estável não pede contrapeso", () => {
    const r = estabilidade(BASES[0], CORPOS[0], DIFUSORES[0]);
    expect(contrapesoNecessarioG(r, BASES[0].raioMm, 400)).toBe(0);
  });

  it("corpo debruçado além do que a base segura pede gramas — e mais inclinação pede mais", () => {
    const g = (deslocamentoMm: number) =>
      contrapesoNecessarioG(
        estabilidade(
          BASE_MINIMA,
          { ...CORPO_RETO, deslocamentoMm },
          DIFUSOR_GRANDE
        ),
        BASE_MINIMA.raioMm,
        400
      );
    expect(g(84)).toBeGreaterThan(0);
    expect(g(84)).toBeGreaterThanOrEqual(g(60));
    // Granularidade de BOM: passos de 10 g.
    expect(g(84) % 10).toBe(0);
  });

  it("a física é a do momento: dobro de massa impressa, dobro de contrapeso", () => {
    const est = estabilidade(
      BASE_MINIMA,
      { ...CORPO_RETO, deslocamentoMm: 84 },
      DIFUSOR_GRANDE
    );
    const g1 = contrapesoNecessarioG(est, BASE_MINIMA.raioMm, 400);
    const g2 = contrapesoNecessarioG(est, BASE_MINIMA.raioMm, 800);
    expect(g2).toBeGreaterThanOrEqual(g1 * 2 - 10);
    expect(g2).toBeLessThanOrEqual(g1 * 2 + 10);
  });

  it("o teto E3 existe e é positivo (produção decide o valor ▸)", () => {
    expect(REGRAS.E.contrapesoMaximoG).toBeGreaterThan(0);
  });
});

describe("estimarPreco", () => {
  const perfis = (raioDifusorMm: number, pontosDeLuz = 1) =>
    estimarPreco(
      perfilBase(BASES[0]),
      perfilCorpo(CORPOS[0]),
      perfilDifusor({
        forma: "globo",
        alturaMm: 100,
        raioMm: raioDifusorMm,
        gomos: 0,
        profundidadeGomosMm: 0,
      }),
      pontosDeLuz
    );

  it("mais material custa mais", () => {
    expect(perfis(90).gramas).toBeGreaterThan(perfis(45).gramas);
    expect(perfis(90).precoBRL).toBeGreaterThan(perfis(45).precoBRL);
  });

  it("dois pontos de luz custam mais que um", () => {
    expect(perfis(65, 2).gramas).toBeGreaterThan(perfis(65, 1).gramas);
    expect(perfis(65, 2).precoBRL).toBeGreaterThan(perfis(65, 1).precoBRL);
  });

  it("preço em reais termina em 9 (política de vitrine)", () => {
    for (const raio of [45, 65, 90]) {
      expect(perfis(raio).precoBRL % 10).toBe(9);
    }
  });
});
