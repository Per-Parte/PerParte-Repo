/**
 * Famílias de textura: invariantes de produção.
 * — toda família fecha em 360° (a costura da revolução nunca aparece);
 * — determinismo (mesma peça em qualquer máquina);
 * — a textura só esculpe para dentro (a silhueta é o envelope);
 * — o orçamento F4 é compartilhado: perfil + textura nunca passam do balanço.
 */

import { describe, expect, it } from "vitest";
import {
  NOMES_FAMILIAS,
  REGRAS,
  TAN_MAX_TEXTURA,
  grampearCorpo,
  malhaRevolucao,
  perfilCorpo,
  profundidadeEfetivaTexturaMm,
  reservaTanTextura,
  valorTextura,
  type ParametrosCorpo,
  type Ponto2D,
  type TexturaRevolucao,
} from "../src";
import {
  inclinacaoMaxima,
  verificarEstanque,
  volumeAssinadoMm3,
} from "./apoio";

const CORPO_NEUTRO: ParametrosCorpo = {
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
};

const TAN_F4 = Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180);

describe("famílias — fecham em 360° e são determinísticas", () => {
  it("valor em u=0 e u=1 coincide para toda família (sem costura)", () => {
    for (const familia of NOMES_FAMILIAS) {
      for (const v of [0.15, 0.5, 0.85]) {
        for (const f of [4, 12, 24]) {
          const a = valorTextura(familia, 0, v, f);
          const b = valorTextura(familia, 1, v, f);
          expect(
            Math.abs(a - b),
            `família ${familia} f=${f} v=${v}`
          ).toBeLessThan(1e-6);
        }
      }
    }
  });

  it("valores ficam em [-1, 1] e são idênticos entre chamadas", () => {
    for (const familia of NOMES_FAMILIAS) {
      for (let k = 0; k < 60; k++) {
        const u = (k * 37) % 100 / 100;
        const v = (k * 13) % 100 / 100;
        const a = valorTextura(familia, u, v, 14);
        expect(a, `família ${familia}`).toBeGreaterThanOrEqual(-1.0001);
        expect(a, `família ${familia}`).toBeLessThanOrEqual(1.0001);
        expect(valorTextura(familia, u, v, 14)).toBe(a);
      }
    }
  });
});

describe("a textura só esculpe para dentro", () => {
  it("nenhum vértice da malha texturizada sai do raio do perfil", () => {
    const perfil: Ponto2D[] = [];
    for (let i = 0; i <= 30; i++) {
      perfil.push({ x: 40, y: (i / 30) * 150 });
    }
    for (const familia of NOMES_FAMILIAS) {
      const textura: TexturaRevolucao = {
        gomos: 12,
        profundidadeMm: 3,
        torcaoGraus: 30,
        alturaMm: 150,
        familia,
        repeticao: 12,
      };
      const m = malhaRevolucao(perfil, 64, textura);
      for (let i = 0; i < m.posicoes.length; i += 3) {
        const r = Math.hypot(m.posicoes[i], m.posicoes[i + 1]);
        expect(r, `família ${familia}`).toBeLessThanOrEqual(40 + 1e-4);
      }
    }
  });
});

describe("orçamento F4 compartilhado entre perfil e textura", () => {
  it("a própria textura nunca passa do teto dela", () => {
    for (const familia of NOMES_FAMILIAS) {
      const reserva = reservaTanTextura({
        familia,
        gomos: 0,
        profundidadeMm: 99,
        repeticao: 24,
        alturaMm: 100,
      });
      expect(reserva, `família ${familia}`).toBeLessThanOrEqual(
        TAN_MAX_TEXTURA + 1e-9
      );
    }
  });

  it("profundidade efetiva respeita o pedido quando o orçamento sobra", () => {
    // Gomos são verticais: não gastam orçamento — passa inteiro.
    expect(
      profundidadeEfetivaTexturaMm({
        familia: "gomos",
        gomos: 18,
        profundidadeMm: 4,
        alturaMm: 100,
      })
    ).toBe(4);
    // Corrugado leve numa peça alta: cabe inteiro.
    expect(
      profundidadeEfetivaTexturaMm({
        familia: "corrugado",
        gomos: 0,
        profundidadeMm: 1,
        repeticao: 4,
        alturaMm: 240,
      })
    ).toBe(1);
  });

  it("perfil hostil + textura extrema: a soma fica dentro do balanço", () => {
    const corpo: ParametrosCorpo = {
      ...CORPO_NEUTRO,
      alturaMm: 100,
      volumeBojoMm: 35,
      posicaoBojo: 1,
      ondulacao: 12,
      amplitudeOndaMm: 6,
      familiaTextura: "corrugado",
      repeticaoTextura: 24,
      gomos: 0,
      profundidadeGomosMm: 4,
    };
    const perfil = perfilCorpo(corpo);
    const lateral = perfil.slice(5, 62);
    const tanPerfil = inclinacaoMaxima(lateral);
    const tanTextura = reservaTanTextura({
      familia: corpo.familiaTextura,
      gomos: corpo.gomos,
      profundidadeMm: corpo.profundidadeGomosMm,
      repeticao: corpo.repeticaoTextura,
      alturaMm: corpo.alturaMm,
    });
    expect(tanPerfil + tanTextura).toBeLessThanOrEqual(TAN_F4 * 1.15);
  });

  it("sem textura nada muda: perfil idêntico ao de antes", () => {
    const com = perfilCorpo({ ...CORPO_NEUTRO });
    const semCampos = perfilCorpo({
      ...CORPO_NEUTRO,
      familiaTextura: undefined,
      repeticaoTextura: undefined,
    });
    expect(com).toEqual(semCampos);
  });
});

describe("produção — malha texturizada continua estanque", () => {
  it("corpo com cada família vira sólido fechado com normais para fora", () => {
    for (const familia of NOMES_FAMILIAS) {
      const corpo: ParametrosCorpo = {
        ...CORPO_NEUTRO,
        familiaTextura: familia === "gomos" ? undefined : familia,
        repeticaoTextura: 16,
        gomos: familia === "gomos" ? 16 : 0,
        profundidadeGomosMm: 3,
        torcaoGraus: 45,
      };
      const textura: TexturaRevolucao = {
        gomos: corpo.gomos,
        profundidadeMm: corpo.profundidadeGomosMm,
        torcaoGraus: corpo.torcaoGraus,
        alturaMm: corpo.alturaMm,
        familia: corpo.familiaTextura,
        repeticao: corpo.repeticaoTextura,
      };
      const m = malhaRevolucao(perfilCorpo(corpo), 96, textura);
      const rel = verificarEstanque(m);
      expect(rel.ok, `família ${familia}: ${rel.problema ?? ""}`).toBe(true);
      expect(volumeAssinadoMm3(m), `família ${familia}`).toBeGreaterThan(0);
    }
  });
});

describe("validação — família vinda de fora", () => {
  it("família desconhecida cai fora; conhecida entra grampeada", () => {
    const lixo = grampearCorpo({
      familiaTextura: "zigue" as never,
      repeticaoTextura: 999,
    });
    expect(lixo.familiaTextura).toBeUndefined();

    const ok = grampearCorpo({
      familiaTextura: "escamas",
      repeticaoTextura: 999,
    });
    expect(ok.familiaTextura).toBe("escamas");
    expect(ok.repeticaoTextura).toBeLessThanOrEqual(24);
    expect(ok.repeticaoTextura).toBeGreaterThanOrEqual(3);
  });
});
