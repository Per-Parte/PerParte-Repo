/**
 * E1/E2 — a base alarga sozinha e o aviso de tombamento é honesto.
 * Preço — estimativa sã: mais material custa mais, duo custa mais que solo.
 */

import { describe, expect, it } from "vitest";
import {
  BASES,
  CORPOS,
  DIFUSORES,
  estabilidade,
  estimarPreco,
  perfilBase,
  perfilCorpo,
  perfilDifusor,
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
