/**
 * As regras viram geometria de verdade: F4 (balanço), F5 (encaixes),
 * S2 (miolo elétrico livre) e E2 (alargamento) medidos no perfil gerado.
 */

import { describe, expect, it } from "vitest";
import {
  CORPOS,
  ENCAIXES,
  RAIO_LIVRE_MIOLO_MM,
  REGRAS,
  amostrarRaiosCorpo,
  anguloBalancoMaximoGraus,
  deslocamentoMaximoMm,
  perfilBase,
  perfilCorpo,
  pontosFemea,
  pontosMacho,
  type ParametrosCorpo,
  type Ponto2D,
} from "../src";
import { inclinacaoMaxima } from "./apoio";

/**
 * O perfil do corpo é: 5 pontos de fêmea, 57 pontos de lateral (n = 56),
 * 5 pontos de macho. Os marcos são conferidos antes de fatiar, para o teste
 * quebrar com clareza se a estrutura interna mudar.
 */
function lateralDoCorpo(perfil: Ponto2D[], alturaMm: number): Ponto2D[] {
  expect(perfil.length).toBe(5 + 57 + 5);
  expect(perfil[5].y).toBe(0);
  expect(perfil[61].y).toBeCloseTo(alturaMm, 6);
  expect(perfil[62].x).toBe(ENCAIXES.corpoDifusor.anel.externoMm);
  return perfil.slice(5, 62);
}

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

describe("F4 — balanço máximo imprimível", () => {
  it("silhueta livre hostil sai grampeada no balanço", () => {
    const perfil = perfilCorpo({
      ...CORPO_NEUTRO,
      alturaMm: 100,
      perfilLivre: [60, 16, 60, 16, 60],
    });
    const lateral = lateralDoCorpo(perfil, 100);
    expect(inclinacaoMaxima(lateral)).toBeLessThanOrEqual(TAN_F4 * 1.1);
  });

  it("ondas no extremo dos sliders também respeitam o balanço", () => {
    // Pior caso permitido pelos LIMITES_CRIAR: altura mínima, 12 ondas de
    // 6 mm — sem grampo, a inclinação passaria de 77° (tan ≈ 4,5).
    const perfil = perfilCorpo({
      ...CORPO_NEUTRO,
      alturaMm: 100,
      ondulacao: 12,
      amplitudeOndaMm: 6,
      volumeBojoMm: 35,
      posicaoBojo: 1,
    });
    const lateral = lateralDoCorpo(perfil, 100);
    expect(inclinacaoMaxima(lateral)).toBeLessThanOrEqual(TAN_F4 * 1.1);
  });

  it("os presets do catálogo já nascem dentro do balanço (grampo não altera)", () => {
    for (const corpo of CORPOS) {
      const lateral = lateralDoCorpo(perfilCorpo(corpo), corpo.alturaMm);
      expect(
        inclinacaoMaxima(lateral),
        `corpo ${corpo.nome}`
      ).toBeLessThanOrEqual(TAN_F4 * 1.1);
    }
  });

  it("anguloBalancoMaximoGraus mede o ângulo da vertical", () => {
    const angulo = anguloBalancoMaximoGraus([
      { x: 0.6, y: 0 },
      { x: 10.6, y: 10 },
    ]);
    expect(angulo).toBeCloseTo(45, 5);
  });

  it("deslocamento máximo da espinha usa o orçamento F4 inteiro (0,35·h) e satura em 85", () => {
    // (tan 45° − piso do perfil 0,25) · 0,7 / 1,5 = 0,35
    expect(deslocamentoMaximoMm(100)).toBe(35);
    expect(deslocamentoMaximoMm(240)).toBe(84);
    expect(deslocamentoMaximoMm(1000)).toBe(85);
  });

  it("no deslocamento máximo, espinha + perfil esgotam exatamente o balanço F4", () => {
    // No domínio das tangentes os custos somam: pico da espinha
    // 1,5·d/(0,7·h) + piso do perfil 0,25 = tan(45°).
    const h = 200;
    const d = deslocamentoMaximoMm(h);
    const tanEspinha = (1.5 * d) / (0.7 * h);
    expect(tanEspinha + 0.25).toBeLessThanOrEqual(
      Math.tan((REGRAS.F.balancoMaximoGraus * Math.PI) / 180) + 0.01
    );
  });
});

describe("S2 — miolo elétrico é volume proibido", () => {
  it("nenhuma parede lateral invade o cilindro do miolo", () => {
    const casos: ParametrosCorpo[] = [
      { ...CORPO_NEUTRO, volumeBojoMm: -12 },
      { ...CORPO_NEUTRO, alturaMm: 100, perfilLivre: [16, 16, 16, 16, 16] },
      { ...CORPO_NEUTRO, alturaMm: 100, ondulacao: 12, amplitudeOndaMm: 6, volumeBojoMm: -12 },
    ];
    for (const caso of casos) {
      const lateral = lateralDoCorpo(perfilCorpo(caso), caso.alturaMm);
      for (const p of lateral) {
        expect(p.x).toBeGreaterThanOrEqual(RAIO_LIVRE_MIOLO_MM - 1e-6);
      }
    }
  });

  it("o pé do corpo respeita a canaleta e a parede estrutural", () => {
    const raioPeMm =
      ENCAIXES.baseCorpo.anel.externoMm +
      ENCAIXES.folgaPadraoMm +
      REGRAS.F.paredeEstruturalMm.min;
    const lateral = lateralDoCorpo(
      perfilCorpo({ ...CORPO_NEUTRO, alturaMm: 100, perfilLivre: [16, 16, 16, 16, 16] }),
      100
    );
    const alturaFemea =
      ENCAIXES.baseCorpo.anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
    for (const p of lateral) {
      if (p.y < alturaFemea + 1) {
        expect(p.x).toBeGreaterThanOrEqual(raioPeMm - 1e-6);
      }
    }
  });
});

describe("F5 — encaixes padronizados", () => {
  it("os diâmetros das interfaces são os documentados (Ø 5,2 e Ø 3,8 cm)", () => {
    expect(ENCAIXES.baseCorpo.raioMm * 2).toBe(52);
    expect(ENCAIXES.corpoDifusor.raioMm * 2).toBe(38);
    expect(ENCAIXES.folgaPadraoMm).toBeGreaterThanOrEqual(
      REGRAS.F.folgaEncaixeMm.min
    );
    expect(ENCAIXES.folgaPadraoMm).toBeLessThanOrEqual(
      REGRAS.F.folgaEncaixeMm.max
    );
  });

  it("a fêmea abre exatamente a folga além do macho, com alívio no fundo", () => {
    const anel = ENCAIXES.baseCorpo.anel;
    for (const folga of [0.2, 0.3, 0.4]) {
      const femea = pontosFemea(anel, folga);
      expect(femea[1].x).toBeCloseTo(anel.internoMm - folga, 9);
      expect(femea[3].x).toBeCloseTo(anel.externoMm + folga, 9);
      expect(femea[2].y).toBeCloseTo(
        anel.alturaMm + ENCAIXES.folgaProfundidadeMm,
        9
      );
    }
    const macho = pontosMacho(anel, 30);
    expect(macho[0].x).toBe(anel.externoMm);
    expect(macho[1].y).toBe(30 + anel.alturaMm);
    expect(macho[3].x).toBe(anel.internoMm);
  });
});

describe("E2 e amostragem da silhueta", () => {
  it("o alargamento escala o raio máximo da base", () => {
    const base = { alturaMm: 26, raioMm: 82, curva: "reta" as const };
    const raioMax = (escala: number) =>
      Math.max(...perfilBase(base, escala).map((p) => p.x));
    expect(raioMax(1)).toBeCloseTo(82, 4);
    expect(raioMax(1.3)).toBeCloseTo(82 * 1.3, 4);
  });

  it("amostrarRaiosCorpo devolve 5 raios dentro dos limites do editor", () => {
    for (const corpo of CORPOS) {
      const raios = amostrarRaiosCorpo(corpo);
      expect(raios).toHaveLength(5);
      for (const r of raios) {
        expect(r).toBeGreaterThanOrEqual(RAIO_LIVRE_MIOLO_MM - 0.5);
        expect(r).toBeLessThanOrEqual(65);
      }
    }
  });
});
