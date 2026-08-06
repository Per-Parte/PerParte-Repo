/**
 * Montagem v2 · F1 — ponto de luz padronizado: base quadrada 50 × 50 mm
 * + bulbo de 40 mm (cápsula Ø 40). Base e bulbo são malhas SEPARADAS
 * (o bulbo é o emissivo da cena), cada uma estanque por si.
 */

import { describe, expect, it } from "vitest";
import {
  alturaPontoDeLuzMm,
  apoioPontoDeLuz,
  gerarMalhaPontoDeLuz,
  PONTO_DE_LUZ,
  PONTOS_DE_LUZ_POR_OBRA,
} from "../src/blocos/ponto-de-luz";
import type { Malha } from "../src/malha";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

function caixaEnvolvente(m: Malha) {
  const caixa = {
    xMin: Infinity,
    xMax: -Infinity,
    yMin: Infinity,
    yMax: -Infinity,
    zMin: Infinity,
    zMax: -Infinity,
  };
  for (let i = 0; i < m.posicoes.length; i += 3) {
    caixa.xMin = Math.min(caixa.xMin, m.posicoes[i]);
    caixa.xMax = Math.max(caixa.xMax, m.posicoes[i]);
    caixa.yMin = Math.min(caixa.yMin, m.posicoes[i + 1]);
    caixa.yMax = Math.max(caixa.yMax, m.posicoes[i + 1]);
    caixa.zMin = Math.min(caixa.zMin, m.posicoes[i + 2]);
    caixa.zMax = Math.max(caixa.zMax, m.posicoes[i + 2]);
  }
  return caixa;
}

describe("gerarMalhaPontoDeLuz", () => {
  const { base, bulbo } = gerarMalhaPontoDeLuz();

  it("base e bulbo são estanques, com normais para fora", () => {
    for (const m of [base, bulbo]) {
      expect(verificarEstanque(m).ok).toBe(true);
      expect(volumeAssinadoMm3(m)).toBeGreaterThan(0);
      expect(m.indices.length).toBeGreaterThan(0);
      expect(m.indices.length % 3).toBe(0);
    }
  });

  it("base: caixa exata de 50 × 50 × 12 mm centrada no eixo", () => {
    const meio = PONTO_DE_LUZ.baseLadoMm / 2;
    const caixa = caixaEnvolvente(base);
    expect(caixa.xMin).toBeCloseTo(-meio);
    expect(caixa.xMax).toBeCloseTo(meio);
    expect(caixa.yMin).toBeCloseTo(-meio);
    expect(caixa.yMax).toBeCloseTo(meio);
    expect(caixa.zMin).toBeCloseTo(0);
    expect(caixa.zMax).toBeCloseTo(PONTO_DE_LUZ.baseAlturaMm);
    expect(volumeAssinadoMm3(base)).toBeCloseTo(
      PONTO_DE_LUZ.baseLadoMm ** 2 * PONTO_DE_LUZ.baseAlturaMm
    );
  });

  it("bulbo: assentado no topo da base, altura total exata", () => {
    const caixa = caixaEnvolvente(bulbo);
    expect(caixa.zMin).toBeCloseTo(PONTO_DE_LUZ.baseAlturaMm);
    expect(caixa.zMax).toBeCloseTo(alturaPontoDeLuzMm());
    // Ø 40: nenhum vértice além do raio; o equador alcança o raio.
    expect(caixa.xMax).toBeLessThanOrEqual(PONTO_DE_LUZ.bulboRaioMm + 1e-4);
    expect(caixa.xMax).toBeCloseTo(PONTO_DE_LUZ.bulboRaioMm);
    expect(caixa.yMin).toBeCloseTo(-PONTO_DE_LUZ.bulboRaioMm);
  });

  it("bulbo: volume perto da cápsula analítica (discretização ≤ 5%)", () => {
    const r = PONTO_DE_LUZ.bulboRaioMm;
    const pescoco = PONTO_DE_LUZ.bulboAlturaMm - r;
    const analitico = Math.PI * r * r * pescoco + (2 / 3) * Math.PI * r ** 3;
    const volume = volumeAssinadoMm3(bulbo);
    expect(volume).toBeGreaterThan(analitico * 0.95);
    expect(volume).toBeLessThan(analitico * 1.001);
  });

  it("mais ou menos segmentos não muda a estanqueidade", () => {
    for (const segmentos of [24, 96]) {
      const malhas = gerarMalhaPontoDeLuz(segmentos);
      expect(verificarEstanque(malhas.base).ok).toBe(true);
      expect(verificarEstanque(malhas.bulbo).ok).toBe(true);
      expect(volumeAssinadoMm3(malhas.bulbo)).toBeGreaterThan(0);
    }
  });
});

describe("constantes e apoio do ponto de luz", () => {
  it("altura total = base + bulbo (52 mm)", () => {
    expect(alturaPontoDeLuzMm()).toBeCloseTo(
      PONTO_DE_LUZ.baseAlturaMm + PONTO_DE_LUZ.bulboAlturaMm
    );
    expect(alturaPontoDeLuzMm()).toBeCloseTo(52);
  });

  it("apoio coerente com a geometria gerada", () => {
    const p = null as never; // o apoio ignora os params (peça padronizada)
    expect(apoioPontoDeLuz.alturaTopoMm(p)).toBeCloseTo(alturaPontoDeLuzMm());
    // Assenta-se no ANEL da base ao redor do bulbo…
    expect(
      apoioPontoDeLuz.zSuperficieTopoMm(p, PONTO_DE_LUZ.bulboRaioMm + 1)
    ).toBeCloseTo(PONTO_DE_LUZ.baseAlturaMm);
    // …e sobre o bulbo o pouso é na CÁPSULA (revisão de 06/08: devolver
    // null deixava um bloco de fundo fechado "pousar" no anel
    // atravessando o bulbo inteiro): no eixo, o topo do bulbo.
    expect(apoioPontoDeLuz.zSuperficieTopoMm(p, 0)).toBeCloseTo(
      alturaPontoDeLuzMm()
    );
    // Meio caminho da cúpula: base + pescoço + √(r² − d²).
    const r = PONTO_DE_LUZ.bulboRaioMm;
    expect(apoioPontoDeLuz.zSuperficieTopoMm(p, r / 2)).toBeCloseTo(
      PONTO_DE_LUZ.baseAlturaMm +
        (PONTO_DE_LUZ.bulboAlturaMm - r) +
        Math.sqrt(r * r - (r / 2) ** 2)
    );
    // Fora da base, nada pousa.
    expect(
      apoioPontoDeLuz.zSuperficieTopoMm(p, PONTO_DE_LUZ.baseLadoMm / 2 + 1)
    ).toBeNull();
    // Degraus declarados para a varredura da tangência (borda do bulbo
    // e borda da base).
    expect(apoioPontoDeLuz.raiosNotaveisMm?.(p)).toEqual([
      PONTO_DE_LUZ.bulboRaioMm,
      PONTO_DE_LUZ.baseLadoMm / 2,
    ]);
  });

  it("clamp de quantidade por obra: mínimo 1, máximo 2 (espec §6)", () => {
    expect(PONTOS_DE_LUZ_POR_OBRA.min).toBe(1);
    expect(PONTOS_DE_LUZ_POR_OBRA.max).toBe(2);
  });
});
