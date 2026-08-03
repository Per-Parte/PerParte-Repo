/**
 * O Backend não confia em ninguém: entradas hostis (NaN, Infinity, strings,
 * valores gigantes) saem sempre grampeadas nos LIMITES_CRIAR — filosofia da
 * regra mestra: nunca erro, sempre limite.
 */

import { describe, expect, it } from "vitest";
import {
  LIMITES_CRIAR,
  deslocamentoMaximoMm,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  grampearLuminaria,
  grampearSegmentos,
} from "../src";

describe("grampearCorpo", () => {
  it("valores fora da faixa encostam no limite, lixo vira padrão", () => {
    const c = grampearCorpo({
      alturaMm: 1e9,
      volumeBojoMm: -999,
      posicaoBojo: Number.POSITIVE_INFINITY, // não finito → padrão, não máximo
      ondulacao: 7.6,
      amplitudeOndaMm: "muito" as unknown as number,
      gomos: Number.NaN,
      profundidadeGomosMm: 99,
      torcaoGraus: -1e6,
      posicaoDobra: 2,
    });
    expect(c.alturaMm).toBe(LIMITES_CRIAR.corpo.alturaMm.max);
    expect(c.volumeBojoMm).toBe(LIMITES_CRIAR.corpo.volumeBojoMm.min);
    expect(c.posicaoBojo).toBe(0);
    expect(c.ondulacao).toBe(8);
    expect(c.amplitudeOndaMm).toBe(0);
    expect(c.gomos).toBe(0);
    expect(c.profundidadeGomosMm).toBe(
      LIMITES_CRIAR.corpo.profundidadeGomosMm.max
    );
    expect(c.torcaoGraus).toBe(LIMITES_CRIAR.corpo.torcaoGraus.min);
    expect(c.posicaoDobra).toBe(1);
  });

  it("deslocamento da espinha respeita o teto que depende da altura", () => {
    const c = grampearCorpo({ alturaMm: 100, deslocamentoMm: 500 });
    expect(c.deslocamentoMm).toBe(deslocamentoMaximoMm(100));
    const c2 = grampearCorpo({ alturaMm: 100, deslocamentoMm: -500 });
    expect(c2.deslocamentoMm).toBe(-deslocamentoMaximoMm(100));
  });

  it("silhueta livre: comprimento errado é descartada, raios são grampeados", () => {
    expect(grampearCorpo({ perfilLivre: [20, 20] }).perfilLivre).toBeUndefined();
    const c = grampearCorpo({
      perfilLivre: [999, -5, Number.NaN, "x" as unknown as number, 20],
    });
    expect(c.perfilLivre).toEqual([
      LIMITES_CRIAR.corpo.perfilLivreRaioMm.max,
      LIMITES_CRIAR.corpo.perfilLivreRaioMm.min,
      LIMITES_CRIAR.corpo.perfilLivreRaioMm.min,
      LIMITES_CRIAR.corpo.perfilLivreRaioMm.min,
      20,
    ]);
  });
});

describe("grampearBase e grampearDifusor", () => {
  it("curva e forma inválidas caem no padrão", () => {
    expect(grampearBase({ curva: "espiral" as never }).curva).toBe("reta");
    expect(grampearDifusor({ forma: "cubo" as never }).forma).toBe("globo");
  });

  it("dimensões hostis saem dentro dos limites", () => {
    const b = grampearBase({ alturaMm: -50, raioMm: 1e6 });
    expect(b.alturaMm).toBe(LIMITES_CRIAR.base.alturaMm.min);
    expect(b.raioMm).toBe(LIMITES_CRIAR.base.raioMm.max);
    const d = grampearDifusor({ alturaMm: 0, raioMm: 0, gomos: 999 });
    expect(d.alturaMm).toBe(LIMITES_CRIAR.difusor.alturaMm.min);
    expect(d.raioMm).toBe(LIMITES_CRIAR.difusor.raioMm.min);
    expect(d.gomos).toBe(LIMITES_CRIAR.difusor.gomos.max);
  });
});

describe("grampearSegmentos e grampearLuminaria", () => {
  it("só aceita as facetas do catálogo", () => {
    expect(grampearSegmentos(6)).toBe(6);
    expect(grampearSegmentos("12")).toBe(12);
    expect(grampearSegmentos(7)).toBe(40);
    expect(grampearSegmentos(undefined)).toBe(40);
  });

  it("pontos de luz só podem ser 1 ou 2, separação grampeada", () => {
    expect(grampearLuminaria({ pontosDeLuz: 2 }).pontosDeLuz).toBe(2);
    expect(grampearLuminaria({ pontosDeLuz: "2" }).pontosDeLuz).toBe(2);
    expect(grampearLuminaria({ pontosDeLuz: 3 }).pontosDeLuz).toBe(1);
    expect(grampearLuminaria({ separacaoMm: 9999 }).separacaoMm).toBe(
      LIMITES_CRIAR.luminaria.separacaoMm.max
    );
    expect(grampearLuminaria({}).separacaoMm).toBe(100);
  });
});
