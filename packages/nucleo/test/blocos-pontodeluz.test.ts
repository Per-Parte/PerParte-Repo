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

  it("base: coluna exata de 20 × 20 × 40 mm centrada no eixo (item 3 do plano)", () => {
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

  it("bulbo: volume perto do analítico (ombro + pescoço + cúpula, ≤ 5%)", () => {
    const r = PONTO_DE_LUZ.bulboRaioMm;
    const rColuna = PONTO_DE_LUZ.baseLadoMm / 2;
    const ombro = PONTO_DE_LUZ.ombroAlturaMm;
    const pescoco = PONTO_DE_LUZ.bulboAlturaMm - r - ombro;
    // Tronco de cone (ombro 45°) + cilindro (pescoço) + semiesfera.
    const analitico =
      ((Math.PI * ombro) / 3) * (rColuna ** 2 + rColuna * r + r ** 2) +
      Math.PI * r * r * pescoco +
      (2 / 3) * Math.PI * r ** 3;
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
  it("altura total = coluna + conjunto luminoso (80 mm)", () => {
    expect(alturaPontoDeLuzMm()).toBeCloseTo(
      PONTO_DE_LUZ.baseAlturaMm + PONTO_DE_LUZ.bulboAlturaMm
    );
    expect(alturaPontoDeLuzMm()).toBeCloseTo(80);
    // As dimensões pedidas pelo Davi (item 3): 4 cm × 2 cm × 2 cm.
    expect(PONTO_DE_LUZ.baseAlturaMm).toBe(40);
    expect(PONTO_DE_LUZ.baseLadoMm).toBe(20);
  });

  it("apoio coerente com a geometria gerada", () => {
    const p = null as never; // o apoio ignora os params (peça padronizada)
    expect(apoioPontoDeLuz.alturaTopoMm(p)).toBeCloseTo(alturaPontoDeLuzMm());
    // O bulbo (Ø 40) é mais largo que a coluna (20 × 20): o anel de
    // pouso da base antiga deixou de existir — além do raio do bulbo,
    // nada pousa.
    expect(
      apoioPontoDeLuz.zSuperficieTopoMm(p, PONTO_DE_LUZ.bulboRaioMm + 1)
    ).toBeNull();
    // Sobre o bulbo o pouso é na CÁPSULA (revisão de 06/08: devolver
    // null deixava um bloco de fundo fechado atravessá-lo): no eixo, o
    // topo do bulbo.
    expect(apoioPontoDeLuz.zSuperficieTopoMm(p, 0)).toBeCloseTo(
      alturaPontoDeLuzMm()
    );
    // Meio caminho da cúpula: coluna + (ombro + pescoço) + √(r² − d²).
    const r = PONTO_DE_LUZ.bulboRaioMm;
    expect(apoioPontoDeLuz.zSuperficieTopoMm(p, r / 2)).toBeCloseTo(
      PONTO_DE_LUZ.baseAlturaMm +
        (PONTO_DE_LUZ.bulboAlturaMm - r) +
        Math.sqrt(r * r - (r / 2) ** 2)
    );
    // Cúpula: pouso com offset escorrega — apoio superior é coaxial.
    expect(apoioPontoDeLuz.raioApoioSuperiorMm(p)).toBe(0);
    // O envelope conta o ombro cônico: no meio dele, raio intermediário.
    const meioOmbro =
      PONTO_DE_LUZ.baseAlturaMm + PONTO_DE_LUZ.ombroAlturaMm / 2;
    expect(apoioPontoDeLuz.raioEnvelopeMm(p, meioOmbro)).toBeCloseTo(
      PONTO_DE_LUZ.baseLadoMm / 2 + PONTO_DE_LUZ.ombroAlturaMm / 2
    );
    // Degrau declarado para a varredura da tangência: a borda do bulbo.
    expect(apoioPontoDeLuz.raiosNotaveisMm?.(p)).toEqual([
      PONTO_DE_LUZ.bulboRaioMm,
    ]);
  });

  it("clamp de quantidade por obra: mínimo 1, máximo 2 (espec §6)", () => {
    expect(PONTOS_DE_LUZ_POR_OBRA.min).toBe(1);
    expect(PONTOS_DE_LUZ_POR_OBRA.max).toBe(2);
  });
});
