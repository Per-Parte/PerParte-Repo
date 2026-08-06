/**
 * Montagem v2 · F1 — PIRÂMIDE: contrato de teste da espec aplicado ao
 * primitivo. Estanqueidade de TODAS as variações (verificarEstanque +
 * volume assinado positivo), clamps idempotentes (incluindo o piso de
 * altura próprio da oca — F4 no teto da cavidade) e furos que preservam
 * parede — sem tocar em nenhum teste existente.
 */

import { describe, expect, it } from "vitest";
import {
  LIMITES_BLOCO,
  PAREDE_MINIMA_BLOCO_MM,
  VARIACOES_BLOCO,
  blocoDaVariacao,
  escalaAlturaMinimaPiramideOca,
  furoMaximoMm,
  gerarMalhaPiramide,
  grampearBloco,
  primitivoPiramide,
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

describe("pirâmide — malha estanque em todas as variações", () => {
  it("as 8 variações do Montar são sólidos estanques de volume positivo", () => {
    for (const variacao of VARIACOES_BLOCO) {
      const params = blocoDaVariacao(variacao, "piramide");
      esperarEstanque(gerarMalhaPiramide(params), `variação ${variacao.id}`);
    }
  });

  it("oca desloca menos material que pura; furos tiram ainda mais", () => {
    const pura = grampearBloco({ forma: "piramide", oca: false, furos: null });
    const oca = grampearBloco({
      forma: "piramide",
      oca: true,
      espessuraParedeMm: 2,
      furos: null,
    });
    const furada = grampearBloco({
      forma: "piramide",
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 12 },
    });
    const volumePura = volumeAssinadoMm3(gerarMalhaPiramide(pura));
    const volumeOca = volumeAssinadoMm3(gerarMalhaPiramide(oca));
    const volumeFurada = volumeAssinadoMm3(gerarMalhaPiramide(furada));
    expect(volumeOca).toBeLessThan(volumePura);
    expect(volumeFurada).toBeLessThan(volumeOca);
    expect(volumeFurada).toBeGreaterThan(0);
  });

  it("furo no piso (4 mm) e no teto furoMaximoMm(p) não degeneram a malha", () => {
    for (const formaFuro of ["circulo", "quadrado", "triangulo"] as const) {
      const noPiso = grampearBloco({
        forma: "piramide",
        furos: {
          forma: formaFuro,
          quantidade: 4,
          tamanhoMm: LIMITES_BLOCO.furoTamanhoMm.min,
        },
      });
      expect(noPiso.furos?.tamanhoMm).toBe(LIMITES_BLOCO.furoTamanhoMm.min);
      esperarEstanque(gerarMalhaPiramide(noPiso), `${formaFuro} no piso`);

      const noTeto = grampearBloco({
        forma: "piramide",
        furos: { forma: formaFuro, quantidade: 4, tamanhoMm: 999 },
      });
      expect(noTeto.furos?.tamanhoMm).toBeCloseTo(furoMaximoMm(noTeto));
      esperarEstanque(gerarMalhaPiramide(noTeto), `${formaFuro} no teto`);
    }
    // Teto de quantidade junto com teto de tamanho: o caso mais denso.
    const denso = grampearBloco({
      forma: "piramide",
      furos: { forma: "triangulo", quantidade: 12, tamanhoMm: 999 },
    });
    esperarEstanque(gerarMalhaPiramide(denso), "12 furos no teto de tamanho");
  });

  it("mais segmentos refinam sem quebrar a estanqueidade", () => {
    const furada = grampearBloco({
      forma: "piramide",
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 10 },
    });
    const pura = grampearBloco({ forma: "piramide", oca: false, furos: null });
    for (const segmentos of [24, 48, 96]) {
      esperarEstanque(
        gerarMalhaPiramide(furada, segmentos),
        `furada com ${segmentos} segmentos`
      );
      esperarEstanque(
        gerarMalhaPiramide(pura, segmentos),
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
        furos: { forma: "quadrado" as const, quantidade: 4, tamanhoMm: 10 },
      },
    ];
    for (const { rotulo, ...caso } of casos) {
      const params = grampearBloco({
        forma: "piramide",
        tamanhoMm: 100,
        ...caso,
      });
      const malha = gerarMalhaPiramide(params);
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

describe("pirâmide — clamps do grampeador", () => {
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
      const umaVez = primitivoPiramide.grampear(caso);
      expect(primitivoPiramide.grampear(umaVez)).toEqual(umaVez);
      expect(umaVez.forma).toBe("piramide");
      expect(umaVez.espessuraParedeMm).toBeGreaterThanOrEqual(
        PAREDE_MINIMA_BLOCO_MM
      );
    }
  });

  it("oca alonga até o teto da cavidade respeitar F4 (piso de altura)", () => {
    // Achatada oca: o grampeador sobe a escala de altura até o piso F4.
    const achatadaOca = primitivoPiramide.grampear({
      escalaAltura: LIMITES_BLOCO.escalaAltura.min,
      escalaLargura: 1.2,
      oca: true,
    });
    expect(achatadaOca.escalaAltura).toBeGreaterThanOrEqual(
      escalaAlturaMinimaPiramideOca(achatadaOca.escalaLargura)
    );
    esperarEstanque(gerarMalhaPiramide(achatadaOca), "achatada oca no piso F4");
    // A maciça não precisa do piso: achatada de verdade é permitida.
    const achatadaPura = primitivoPiramide.grampear({
      escalaAltura: LIMITES_BLOCO.escalaAltura.min,
      escalaLargura: 1.2,
      oca: false,
    });
    expect(achatadaPura.escalaAltura).toBe(LIMITES_BLOCO.escalaAltura.min);
  });

  it("furos forçam oca e respeitam o teto derivado do tamanho", () => {
    const grampeado = primitivoPiramide.grampear({
      oca: false,
      furos: { forma: "quadrado", quantidade: 5, tamanhoMm: 999 },
    });
    expect(grampeado.oca).toBe(true);
    expect(grampeado.furos).not.toBeNull();
    expect(grampeado.furos!.tamanhoMm).toBeLessThanOrEqual(
      furoMaximoMm(grampeado)
    );
    esperarEstanque(gerarMalhaPiramide(grampeado), "furos forçaram oca");
  });

  it("a quantidade cai (nunca erro) quando o furo mínimo não cabe", () => {
    // Pirâmide pequena e fina: 12 furos de 4 mm não deixam parede F2.
    const grampeado = primitivoPiramide.grampear({
      tamanhoMm: 40,
      escalaLargura: 0.5,
      furos: { forma: "circulo", quantidade: 12, tamanhoMm: 4 },
    });
    expect(grampeado.furos).not.toBeNull();
    expect(grampeado.furos!.quantidade).toBeLessThan(12);
    expect(grampeado.furos!.quantidade).toBeGreaterThanOrEqual(1);
    esperarEstanque(gerarMalhaPiramide(grampeado), "quantidade grampeada");
  });
});
