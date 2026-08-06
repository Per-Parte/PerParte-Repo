/**
 * Montagem v2 · F1 — CUBO: contrato de teste da espec aplicado ao
 * primitivo. Estanqueidade de TODAS as variações (verificarEstanque +
 * volume assinado positivo), clamps idempotentes e furos que preservam
 * parede — sem tocar em nenhum teste existente.
 */

import { describe, expect, it } from "vitest";
import {
  LIMITES_BLOCO,
  PAREDE_MINIMA_BLOCO_MM,
  VARIACOES_BLOCO,
  blocoDaVariacao,
  furoMaximoMm,
  gerarMalhaCubo,
  grampearBloco,
  primitivoCubo,
  type MalhaBloco,
} from "../src";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

function esperarEstanque(malha: MalhaBloco, nome: string): void {
  const r = verificarEstanque(malha);
  expect(r.problema ?? "ok", nome).toBe("ok");
  expect(
    volumeAssinadoMm3(malha),
    `${nome}: volume deve ser positivo`
  ).toBeGreaterThan(0);
  expect(malha.indices.length % 3, nome).toBe(0);
  expect(malha.indices.length, nome).toBeGreaterThan(0);
}

function caixaEnvolvente(malha: MalhaBloco) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < malha.posicoes.length; i += 3) {
    minX = Math.min(minX, malha.posicoes[i]);
    maxX = Math.max(maxX, malha.posicoes[i]);
    minY = Math.min(minY, malha.posicoes[i + 1]);
    maxY = Math.max(maxY, malha.posicoes[i + 1]);
    minZ = Math.min(minZ, malha.posicoes[i + 2]);
    maxZ = Math.max(maxZ, malha.posicoes[i + 2]);
  }
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

describe("cubo — malha estanque em todas as variações", () => {
  it("as 8 variações do Montar são sólidos estanques de volume positivo", () => {
    for (const variacao of VARIACOES_BLOCO) {
      const params = blocoDaVariacao(variacao, "cubo");
      esperarEstanque(gerarMalhaCubo(params), `variação ${variacao.id}`);
    }
  });

  it("oca desloca menos material que pura; furos tiram ainda mais", () => {
    const pura = grampearBloco({ forma: "cubo", oca: false, furos: null });
    const oca = grampearBloco({
      forma: "cubo",
      oca: true,
      espessuraParedeMm: 2,
      furos: null,
    });
    const furada = grampearBloco({
      forma: "cubo",
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 6, tamanhoMm: 12 },
    });
    const volumePura = volumeAssinadoMm3(gerarMalhaCubo(pura));
    const volumeOca = volumeAssinadoMm3(gerarMalhaCubo(oca));
    const volumeFurada = volumeAssinadoMm3(gerarMalhaCubo(furada));
    expect(volumeOca).toBeLessThan(volumePura);
    expect(volumeFurada).toBeLessThan(volumeOca);
    expect(volumeFurada).toBeGreaterThan(0);
  });

  it("furo no piso (4 mm) e no teto furoMaximoMm(p) não degeneram a malha", () => {
    for (const formaFuro of ["circulo", "quadrado", "triangulo"] as const) {
      const noPiso = grampearBloco({
        forma: "cubo",
        furos: {
          forma: formaFuro,
          quantidade: 6,
          tamanhoMm: LIMITES_BLOCO.furoTamanhoMm.min,
        },
      });
      expect(noPiso.furos?.tamanhoMm).toBe(LIMITES_BLOCO.furoTamanhoMm.min);
      esperarEstanque(gerarMalhaCubo(noPiso), `${formaFuro} no piso`);

      const noTeto = grampearBloco({
        forma: "cubo",
        furos: { forma: formaFuro, quantidade: 6, tamanhoMm: 999 },
      });
      expect(noTeto.furos?.tamanhoMm).toBeCloseTo(furoMaximoMm(noTeto));
      esperarEstanque(gerarMalhaCubo(noTeto), `${formaFuro} no teto`);
    }
    // Teto de quantidade junto com teto de tamanho: o caso mais denso.
    const denso = grampearBloco({
      forma: "cubo",
      furos: { forma: "triangulo", quantidade: 12, tamanhoMm: 999 },
    });
    esperarEstanque(gerarMalhaCubo(denso), "12 furos no teto de tamanho");
  });

  it("mais segmentos refinam sem quebrar a estanqueidade", () => {
    const furada = grampearBloco({
      forma: "cubo",
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 14 },
    });
    const pura = grampearBloco({ forma: "cubo", oca: false, furos: null });
    let triangulosAntes = 0;
    for (const segmentos of [24, 48, 96]) {
      const malha = gerarMalhaCubo(furada, segmentos);
      esperarEstanque(malha, `furada com ${segmentos} segmentos`);
      expect(malha.indices.length / 3).toBeGreaterThanOrEqual(triangulosAntes);
      triangulosAntes = malha.indices.length / 3;
      esperarEstanque(
        gerarMalhaCubo(pura, segmentos),
        `pura com ${segmentos} segmentos`
      );
    }
  });

  it("caixa envolvente bate com tamanho × escalas e nada fica abaixo da mesa", () => {
    const casos = [
      { rotulo: "pura", oca: false as const },
      { rotulo: "achatada larga", escalaAltura: 0.5, escalaLargura: 1.2 },
      { rotulo: "esticada fina", escalaAltura: 1.5, escalaLargura: 0.8 },
      { rotulo: "oca", oca: true as const, espessuraParedeMm: 2 },
      {
        rotulo: "com furos",
        furos: { forma: "quadrado" as const, quantidade: 4, tamanhoMm: 12 },
      },
    ];
    for (const { rotulo, ...caso } of casos) {
      const params = grampearBloco({
        forma: "cubo",
        tamanhoMm: 100,
        ...caso,
      });
      const malha = gerarMalhaCubo(params);
      const caixa = caixaEnvolvente(malha);
      const largura = params.tamanhoMm * params.escalaLargura;
      const altura = params.tamanhoMm * params.escalaAltura;
      expect(caixa.maxX - caixa.minX, rotulo).toBeCloseTo(largura, 1);
      expect(caixa.maxY - caixa.minY, rotulo).toBeCloseTo(largura, 1);
      expect(caixa.maxZ, rotulo).toBeCloseTo(altura, 1);
      expect(caixa.minZ, `${rotulo}: nenhum vértice abaixo da mesa`).toBeCloseTo(
        0,
        5
      );
      expect(caixa.minZ, rotulo).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("cubo — clamps do grampeador", () => {
  it("grampear é idempotente para lixo, extremos e todas as variações", () => {
    const casos: unknown[] = [
      undefined,
      "lixo",
      {},
      {
        tamanhoMm: -50,
        escalaAltura: 99,
        escalaLargura: -3,
        espessuraParedeMm: 999,
        furos: { forma: "circulo", quantidade: 99, tamanhoMm: 999 },
      },
      { tamanhoMm: 5000, oca: true, espessuraParedeMm: 0.01 },
      {
        tamanhoMm: 40,
        escalaLargura: 0.5,
        furos: { forma: "triangulo", quantidade: 12, tamanhoMm: 4 },
      },
      { tamanhoMm: Number.NaN, escalaAltura: Number.POSITIVE_INFINITY },
      ...VARIACOES_BLOCO.map((variacao) => ({ ...variacao.params })),
    ];
    for (const caso of casos) {
      const umaVez = primitivoCubo.grampear(caso);
      expect(primitivoCubo.grampear(umaVez)).toEqual(umaVez);
      expect(umaVez.forma).toBe("cubo");
      expect(umaVez.espessuraParedeMm).toBeGreaterThanOrEqual(
        PAREDE_MINIMA_BLOCO_MM
      );
    }
  });

  it("furos forçam oca e respeitam o teto derivado do tamanho", () => {
    const grampeado = primitivoCubo.grampear({
      oca: false,
      furos: { forma: "quadrado", quantidade: 5, tamanhoMm: 999 },
    });
    expect(grampeado.oca).toBe(true);
    expect(grampeado.furos).not.toBeNull();
    expect(grampeado.furos!.tamanhoMm).toBeLessThanOrEqual(
      furoMaximoMm(grampeado)
    );
    expect(grampeado.furos!.tamanhoMm).toBeGreaterThanOrEqual(
      LIMITES_BLOCO.furoTamanhoMm.min
    );
    esperarEstanque(gerarMalhaCubo(grampeado), "furos forçaram oca");
  });

  it("a quantidade cai (nunca erro) quando o furo mínimo não cabe na casca interna", () => {
    // Regressão do achado de 06/08: furoMaximoMm media a face EXTERNA e
    // o grampeador prometia 12 furos que o gerador descartava em silêncio
    // (malha sem furo algum). Agora a heurística mede a casca INTERNA
    // (W − 2t) — a quantidade cai na cascata e os furos que sobram
    // EXISTEM de verdade na malha.
    const grampeado = primitivoCubo.grampear({
      tamanhoMm: 40,
      escalaLargura: 0.5,
      espessuraParedeMm: 999,
      furos: { forma: "circulo", quantidade: 12, tamanhoMm: 4 },
    });
    expect(grampeado.furos).not.toBeNull();
    expect(grampeado.furos!.quantidade).toBeLessThan(12);
    expect(grampeado.furos!.quantidade).toBeGreaterThanOrEqual(1);
    expect(grampeado.furos!.tamanhoMm).toBeGreaterThanOrEqual(
      LIMITES_BLOCO.furoTamanhoMm.min
    );
    const comFuros = gerarMalhaCubo(grampeado);
    esperarEstanque(comFuros, "quantidade grampeada");
    const semFuros = gerarMalhaCubo({ ...grampeado, furos: null });
    expect(volumeAssinadoMm3(comFuros)).toBeLessThan(
      volumeAssinadoMm3(semFuros)
    );
  });
});
