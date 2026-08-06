/**
 * Montagem v2 · F1 — tangência (invariante A1): assentamento por
 * varredura radial, deslizar com clamp na região de apoio e "imã".
 *
 * Testado contra a INTERFACE de contato (ApoioBloco) com apoios
 * SINTÉTICOS — platô (cubo/cilindro de mentira) e calota (esferoide de
 * mentira, a mesma matemática da esfera real) — para não depender dos
 * quatro primitivos, que são implementados em paralelo. O apoio REAL do
 * ponto de luz (anel com buraco no meio) entra como caso de borda.
 */

import { describe, expect, it } from "vitest";
import {
  assentarAoEntrar,
  contatoIma,
  cotaAssentamentoMm,
  deslizarContato,
  type ApoioDe,
} from "../src/blocos/tangencia";
import type {
  ApoioBloco,
  BlocoNaCena,
  ContatoBloco,
  FormaBloco,
  ParametrosBloco,
} from "../src/blocos/tipos";
import { apoioPontoDeLuz, PONTO_DE_LUZ } from "../src/blocos/ponto-de-luz";

const larguraMm = (p: ParametrosBloco) => p.tamanhoMm * p.escalaLargura;
const alturaMm = (p: ParametrosBloco) => p.tamanhoMm * p.escalaAltura;

/** Platô sintético: topo e base planos, envelope reto (cubo/cilindro). */
const apoioPlato: ApoioBloco = {
  alturaTopoMm: alturaMm,
  raioApoioSuperiorMm: (p) => larguraMm(p) / 2,
  raioApoioInferiorMm: (p) => larguraMm(p) / 2,
  raioEnvelopeMm: (p, zMm) =>
    zMm < 0 || zMm > alturaMm(p) ? 0 : larguraMm(p) / 2,
  zSuperficieTopoMm: (p, dMm) =>
    dMm > larguraMm(p) / 2 ? null : alturaMm(p),
  zSuperficieBaseMm: (p, dMm) => (dMm > larguraMm(p) / 2 ? null : 0),
};

/** Calota sintética: esferoide (a mesma matemática da esfera real). */
const apoioCalota: ApoioBloco = {
  alturaTopoMm: alturaMm,
  raioApoioSuperiorMm: () => 0,
  raioApoioInferiorMm: () => 0,
  raioEnvelopeMm(p, zMm) {
    const a = larguraMm(p) / 2;
    const c = alturaMm(p) / 2;
    const u = (zMm - c) / c;
    if (u < -1 || u > 1) return 0;
    return a * Math.sqrt(Math.max(0, 1 - u * u));
  },
  zSuperficieTopoMm(p, dMm) {
    const a = larguraMm(p) / 2;
    const c = alturaMm(p) / 2;
    if (dMm > a) return null;
    return c + c * Math.sqrt(Math.max(0, 1 - (dMm / a) ** 2));
  },
  zSuperficieBaseMm(p, dMm) {
    const a = larguraMm(p) / 2;
    const c = alturaMm(p) / 2;
    if (dMm > a) return null;
    return c - c * Math.sqrt(Math.max(0, 1 - (dMm / a) ** 2));
  },
};

/** Apoios de mentira: esfera → calota; todo o resto → platô. */
const apoioDe: ApoioDe = (forma: FormaBloco) =>
  forma === "esfera" ? apoioCalota : apoioPlato;

function params(
  forma: FormaBloco,
  tamanhoMm: number,
  escalaAltura = 1,
  escalaLargura = 1
): ParametrosBloco {
  return {
    forma,
    tamanhoMm,
    escalaAltura,
    escalaLargura,
    oca: false,
    espessuraParedeMm: 2,
    furos: null,
    corIdx: 0,
  };
}

function bloco(
  id: number,
  p: ParametrosBloco,
  contato: ContatoBloco
): BlocoNaCena {
  return { id, params: p, contato };
}

/**
 * Invariante A1 pós-operação: gap 0 (dentro da amostragem) com a mesa
 * ou com a superfície de quem apoia.
 */
function gapDoContatoMm(
  p: ParametrosBloco,
  contato: ContatoBloco,
  cena: readonly BlocoNaCena[]
): number {
  if (contato.sobre == null) return contato.zBaseMm; // mesa: base em z = 0
  const suporte = cena.find((b) => b.id === contato.sobre);
  expect(suporte).toBeDefined();
  const cota = cotaAssentamentoMm(
    p,
    suporte!.params,
    contato.xMm - suporte!.contato.xMm,
    contato.yMm - suporte!.contato.yMm,
    apoioDe
  );
  expect(cota).not.toBeNull();
  return contato.zBaseMm - (suporte!.contato.zBaseMm + cota!);
}

describe("cotaAssentamentoMm (varredura radial)", () => {
  it("cubo sobre cubo coaxial: assenta na altura do de baixo", () => {
    const cota = cotaAssentamentoMm(
      params("cubo", 40),
      params("cubo", 100),
      0,
      0,
      apoioDe
    );
    expect(cota).toBeCloseTo(100);
  });

  it("esfera sobre cubo com offset dentro do platô: altura do cubo", () => {
    const esfera = params("esfera", 60);
    const cubo = params("cubo", 100);
    expect(cotaAssentamentoMm(esfera, cubo, 20, 0, apoioDe)).toBeCloseTo(100);
    // Offset diagonal (30, 40): distância 50 = borda do platô — ainda vale.
    expect(cotaAssentamentoMm(esfera, cubo, 30, 40, apoioDe)).toBeCloseTo(
      100
    );
  });

  it("esfera sobre esfera coaxial: toca num ponto (polo com polo)", () => {
    const cota = cotaAssentamentoMm(
      params("esfera", 60),
      params("esfera", 100),
      0,
      0,
      apoioDe
    );
    expect(cota).toBeCloseTo(100);
  });

  it("esferoide achatado por baixo, esticado por cima: cota exata no eixo", () => {
    const cota = cotaAssentamentoMm(
      params("esfera", 60, 1.5),
      params("esfera", 100, 0.5),
      0,
      0,
      apoioDe
    );
    expect(cota).toBeCloseTo(50); // altura do achatado
  });

  it("sem sobreposição em planta: null", () => {
    expect(
      cotaAssentamentoMm(
        params("cubo", 40),
        params("cubo", 100),
        200,
        0,
        apoioDe
      )
    ).toBeNull();
  });

  it("superfície ANULAR (ponto de luz real): cubo assenta no anel da base", () => {
    // Apoio de mentira que devolve o apoio REAL do ponto de luz para a
    // forma "cilindro" — exercita o buraco no meio do domínio (o topo
    // só existe entre o raio do bulbo e a borda da base).
    const apoioComPonto: ApoioDe = (forma) =>
      forma === "cilindro" ? apoioPontoDeLuz : apoioPlato;
    const cota = cotaAssentamentoMm(
      params("cubo", 100),
      params("cilindro", 50), // params ignorados pelo apoio do ponto de luz
      0,
      0,
      apoioComPonto
    );
    expect(cota).toBeCloseTo(PONTO_DE_LUZ.baseAlturaMm);
  });
});

describe("assentarAoEntrar", () => {
  it("cena vazia: esfera assenta na mesa em (0, 0, 0)", () => {
    const contato = assentarAoEntrar(params("esfera", 60), [], apoioDe);
    expect(contato).toEqual({ sobre: null, xMm: 0, yMm: 0, zBaseMm: 0 });
  });

  it("entra no topo da forma mais alta, coaxial", () => {
    const cena = [
      bloco(1, params("cubo", 100), {
        sobre: null,
        xMm: 0,
        yMm: 0,
        zBaseMm: 0,
      }),
      bloco(2, params("cubo", 40), {
        sobre: null,
        xMm: 150,
        yMm: 0,
        zBaseMm: 0,
      }),
    ];
    const contato = assentarAoEntrar(params("cilindro", 40), cena, apoioDe);
    expect(contato.sobre).toBe(1);
    expect(contato.xMm).toBeCloseTo(0);
    expect(contato.yMm).toBeCloseTo(0);
    expect(contato.zBaseMm).toBeCloseTo(100);
    expect(gapDoContatoMm(params("cilindro", 40), contato, cena)).toBeCloseTo(
      0
    );
  });

  it("pilha: assenta no topo ABSOLUTO mais alto (bloco empilhado)", () => {
    const cena = [
      bloco(1, params("cubo", 100), {
        sobre: null,
        xMm: 0,
        yMm: 0,
        zBaseMm: 0,
      }),
      bloco(2, params("cubo", 40), {
        sobre: 1,
        xMm: 0,
        yMm: 0,
        zBaseMm: 100,
      }),
    ];
    const contato = assentarAoEntrar(params("cubo", 40), cena, apoioDe);
    expect(contato.sobre).toBe(2);
    expect(contato.zBaseMm).toBeCloseTo(140);
    expect(gapDoContatoMm(params("cubo", 40), contato, cena)).toBeCloseTo(0);
  });
});

describe("deslizarContato", () => {
  const cuboBaixo = bloco(1, params("cubo", 100), {
    sobre: null,
    xMm: 0,
    yMm: 0,
    zBaseMm: 0,
  });

  it("desliza pelo platô re-assentando o z", () => {
    const deCima = bloco(2, params("cubo", 40), {
      sobre: 1,
      xMm: 0,
      yMm: 0,
      zBaseMm: 100,
    });
    const cena = [cuboBaixo, deCima];
    const contato = deslizarContato(deCima, cena, 30, 0, apoioDe);
    expect(contato).toEqual({ sobre: 1, xMm: 30, yMm: 0, zBaseMm: 100 });
    expect(gapDoContatoMm(deCima.params, contato, cena)).toBeCloseTo(0);
  });

  it("clampa na borda da região de apoio (limite encosta, nunca erro)", () => {
    const deCima = bloco(2, params("cubo", 40), {
      sobre: 1,
      xMm: 0,
      yMm: 0,
      zBaseMm: 100,
    });
    const cena = [cuboBaixo, deCima];
    const contato = deslizarContato(deCima, cena, 80, 0, apoioDe);
    expect(contato.sobre).toBe(1);
    expect(contato.xMm).toBeCloseTo(50); // raioApoioSuperior do cubo 100
    expect(contato.yMm).toBeCloseTo(0);
    expect(contato.zBaseMm).toBeCloseTo(100);
  });

  it("apoio pontual (esfera embaixo): qualquer delta volta ao coaxial", () => {
    const esferaBaixo = bloco(1, params("esfera", 100), {
      sobre: null,
      xMm: 0,
      yMm: 0,
      zBaseMm: 0,
    });
    const deCima = bloco(2, params("esfera", 60), {
      sobre: 1,
      xMm: 0,
      yMm: 0,
      zBaseMm: 100,
    });
    const cena = [esferaBaixo, deCima];
    const contato = deslizarContato(deCima, cena, 25, -10, apoioDe);
    expect(contato.xMm).toBeCloseTo(0);
    expect(contato.yMm).toBeCloseTo(0);
    expect(contato.zBaseMm).toBeCloseTo(100);
  });

  it("na mesa: desliza livre pelo plano (z = 0)", () => {
    const naMesa = bloco(3, params("cilindro", 60), {
      sobre: null,
      xMm: 10,
      yMm: 5,
      zBaseMm: 0,
    });
    const contato = deslizarContato(naMesa, [naMesa], 5, -5, apoioDe);
    expect(contato).toEqual({ sobre: null, xMm: 15, yMm: 0, zBaseMm: 0 });
  });
});

describe("contatoIma", () => {
  const cena = [
    bloco(1, params("cubo", 100), {
      sobre: null,
      xMm: 0,
      yMm: 0,
      zBaseMm: 0,
    }),
  ];
  const novo = params("cubo", 40);

  it("prefere topo alcançável a lateral", () => {
    const contato = contatoIma(novo, cena, 10, 0, apoioDe);
    expect(contato.sobre).toBe(1);
    expect(contato.xMm).toBeCloseTo(10);
    expect(contato.yMm).toBeCloseTo(0);
    expect(contato.zBaseMm).toBeCloseTo(100);
    expect(gapDoContatoMm(novo, contato, cena)).toBeCloseTo(0);
  });

  it("fora do platô mas interpenetrando: empurra até a lateral encostada", () => {
    // Alvo a 60 mm do eixo: fora do apoio (50) mas dentro da soma dos
    // envelopes (50 + 20 = 70) → tangência de envelopes a 70 mm.
    const contato = contatoIma(novo, cena, 60, 0, apoioDe);
    expect(contato.sobre).toBeNull();
    expect(contato.xMm).toBeCloseTo(70);
    expect(contato.yMm).toBeCloseTo(0);
    expect(contato.zBaseMm).toBeCloseTo(0);
  });

  it("alvo livre: mesa no próprio (x, y)", () => {
    const contato = contatoIma(novo, cena, 300, -40, apoioDe);
    expect(contato).toEqual({ sobre: null, xMm: 300, yMm: -40, zBaseMm: 0 });
  });

  it("entre dois topos alcançáveis, pousa no mais alto", () => {
    const cenaDupla = [
      ...cena,
      bloco(2, params("cubo", 100, 1.2), {
        sobre: null,
        xMm: 40,
        yMm: 0,
        zBaseMm: 0,
      }),
    ];
    const contato = contatoIma(novo, cenaDupla, 20, 0, apoioDe);
    expect(contato.sobre).toBe(2);
    expect(contato.zBaseMm).toBeCloseTo(120);
  });

  it("invariante A1: toda operação devolve contato com gap 0", () => {
    const alvos: [number, number][] = [
      [0, 0],
      [10, 0],
      [49, 0],
      [300, 5],
      [-120, 60],
    ];
    for (const [x, y] of alvos) {
      const contato = contatoIma(novo, cena, x, y, apoioDe);
      expect(gapDoContatoMm(novo, contato, cena)).toBeCloseTo(0);
    }
  });
});
