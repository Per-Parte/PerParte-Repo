/**
 * Montagem v2 · F1 — ESFERA: contrato de teste da espec aplicado ao
 * primitivo. Estanqueidade de TODAS as variações (verificarEstanque +
 * volume assinado positivo), clamps idempotentes e furos que preservam
 * parede — sem tocar em nenhum teste existente.
 */

import { describe, expect, it } from "vitest";
import {
  LIMITES_BLOCO,
  MOLDURA_FURO_MM,
  PAREDE_MINIMA_BLOCO_MM,
  VARIACOES_BLOCO,
  apoioEsfera,
  blocoDaVariacao,
  furoMaximoMm,
  gerarMalhaEsfera,
  grampearBloco,
  primitivoEsfera,
  respiroEsferaMm,
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

describe("esfera — malha estanque em todas as variações", () => {
  it("as 8 variações do Montar são sólidos estanques de volume positivo", () => {
    for (const variacao of VARIACOES_BLOCO) {
      const params = blocoDaVariacao(variacao, "esfera");
      esperarEstanque(gerarMalhaEsfera(params), `variação ${variacao.id}`);
    }
  });

  it("oca desloca menos material que pura; furos tiram ainda mais", () => {
    const pura = grampearBloco({ forma: "esfera", oca: false, furos: null });
    const oca = grampearBloco({
      forma: "esfera",
      oca: true,
      espessuraParedeMm: 2,
      furos: null,
    });
    const furada = grampearBloco({
      forma: "esfera",
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 6, tamanhoMm: 12 },
    });
    const volumePura = volumeAssinadoMm3(gerarMalhaEsfera(pura));
    const volumeOca = volumeAssinadoMm3(gerarMalhaEsfera(oca));
    const volumeFurada = volumeAssinadoMm3(gerarMalhaEsfera(furada));
    expect(volumeOca).toBeLessThan(volumePura);
    expect(volumeFurada).toBeLessThan(volumeOca);
    expect(volumeFurada).toBeGreaterThan(0);
  });

  it("furo no piso (4 mm) e no teto furoMaximoMm(p) não degeneram a malha", () => {
    for (const formaFuro of ["circulo", "quadrado", "triangulo"] as const) {
      const noPiso = grampearBloco({
        forma: "esfera",
        furos: {
          forma: formaFuro,
          quantidade: 6,
          tamanhoMm: LIMITES_BLOCO.furoTamanhoMm.min,
        },
      });
      expect(noPiso.furos?.tamanhoMm).toBe(LIMITES_BLOCO.furoTamanhoMm.min);
      esperarEstanque(gerarMalhaEsfera(noPiso), `${formaFuro} no piso`);

      const noTeto = grampearBloco({
        forma: "esfera",
        furos: { forma: formaFuro, quantidade: 6, tamanhoMm: 999 },
      });
      expect(noTeto.furos?.tamanhoMm).toBeCloseTo(furoMaximoMm(noTeto));
      esperarEstanque(gerarMalhaEsfera(noTeto), `${formaFuro} no teto`);
    }
    // Teto de quantidade junto com teto de tamanho: o caso mais denso.
    const denso = grampearBloco({
      forma: "esfera",
      furos: { forma: "triangulo", quantidade: 12, tamanhoMm: 999 },
    });
    esperarEstanque(gerarMalhaEsfera(denso), "12 furos no teto de tamanho");
  });

  it("achatada: o furo grampeado cabe na banda F4 sem encolher na vertical", () => {
    // Regressão do achado de 06/08: a banda de furos era ±30° paramétricos
    // FIXOS — no esferoide achatado o teto do furo real deitava a 48–63°
    // da vertical (F4 = 45°) e, com a banda paramétrica, o gerador
    // encolheria o furo prometido. Agora furoMaximoMm e o gerador usam a
    // MESMA bandaFuroEsferaRad: o furo prometido é o entregue, inteiro.
    const params = grampearBloco({
      forma: "esfera",
      tamanhoMm: 100,
      escalaAltura: 0.5,
      escalaLargura: 1.5,
      furos: { forma: "circulo", quantidade: 1, tamanhoMm: 999 },
    });
    expect(params.furos).not.toBeNull();
    const furoMm = params.furos!.tamanhoMm;
    expect(furoMm).toBeCloseTo(furoMaximoMm(params));
    const malha = gerarMalhaEsfera(params);
    esperarEstanque(malha, "achatada com furo único no teto");

    // Vértices do polígono EXTERNO do furo, garimpados da malha: usados
    // por algum triângulo (as colunas da grade interiores ao bloco
    // recortado ficam órfãs), sobre a superfície externa, com θ ≈ π
    // (centro determinístico do furo único) e latitude estritamente
    // DENTRO do bloco recortado (as linhas de borda ficam fora da janela).
    const a = (params.tamanhoMm * params.escalaLargura) / 2;
    const c = (params.tamanhoMm * params.escalaAltura) / 2;
    const usados = new Set<number>(malha.indices);
    const meiaThetaFuro = furoMm / 2 / a;
    const zJanela = c * Math.sin((furoMm / 2 + MOLDURA_FURO_MM) / c) - 0.5;
    const zsDoFuro: number[] = [];
    for (let v = 0; v < malha.posicoes.length / 3; v++) {
      if (!usados.has(v)) continue;
      const x = malha.posicoes[3 * v];
      const y = malha.posicoes[3 * v + 1];
      const z = malha.posicoes[3 * v + 2];
      const r = Math.hypot(x, y);
      const naExterna =
        Math.abs((r / a) ** 2 + ((z - c) / c) ** 2 - 1) < 1e-3;
      let theta = Math.atan2(y, x);
      if (theta < 0) theta += 2 * Math.PI;
      if (
        naExterna &&
        Math.abs(theta - Math.PI) <= meiaThetaFuro + 0.01 &&
        Math.abs(z - c) < zJanela
      ) {
        zsDoFuro.push(z);
      }
    }
    // ○ tem 16 vértices; todos caem no filtro (nenhuma coluna órfã entra).
    expect(zsDoFuro.length).toBe(16);
    const extensaoZ = Math.max(...zsDoFuro) - Math.min(...zsDoFuro);
    expect(extensaoZ).toBeGreaterThanOrEqual(0.9 * furoMm);
  });

  it("mais segmentos refinam sem quebrar a estanqueidade", () => {
    const furada = grampearBloco({
      forma: "esfera",
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 14 },
    });
    const pura = grampearBloco({ forma: "esfera", oca: false, furos: null });
    let triangulosAntes = 0;
    for (const segmentos of [24, 48, 96]) {
      const malha = gerarMalhaEsfera(furada, segmentos);
      esperarEstanque(malha, `furada com ${segmentos} segmentos`);
      expect(malha.indices.length / 3).toBeGreaterThanOrEqual(triangulosAntes);
      triangulosAntes = malha.indices.length / 3;
      esperarEstanque(
        gerarMalhaEsfera(pura, segmentos),
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
        // Freio de curvatura ATIVO: o grampeador entrega parede 5 mm
        // (menor/4) e o freio da cavidade aperta para 2,5 mm (0,75·c²/a)
        // — a caixa continua batendo com a borda do respiro.
        rotulo: "oca achatada com freio",
        tamanhoMm: 40,
        escalaAltura: 0.5,
        escalaLargura: 1.5,
        oca: true as const,
        espessuraParedeMm: 999,
      },
      {
        rotulo: "com furos",
        furos: { forma: "quadrado" as const, quantidade: 4, tamanhoMm: 12 },
      },
    ];
    for (const { rotulo, ...caso } of casos) {
      const params = grampearBloco({
        forma: "esfera",
        tamanhoMm: 100,
        ...caso,
      });
      const malha = gerarMalhaEsfera(params);
      const caixa = caixaEnvolvente(malha);
      const largura = params.tamanhoMm * params.escalaLargura;
      const altura = params.tamanhoMm * params.escalaAltura;
      // O equador é linha exata da grade: a planta bate com 2a.
      expect(caixa.maxX - caixa.minX, rotulo).toBeCloseTo(largura, 1);
      expect(caixa.maxY - caixa.minY, rotulo).toBeCloseTo(largura, 1);
      if (rotulo === "oca achatada com freio") {
        expect(params.espessuraParedeMm, rotulo).toBe(5);
        expect(respiroEsferaMm(params).paredeMm, rotulo).toBeCloseTo(2.5, 5);
      }
      if (params.oca) {
        // OCA: o respiro polar trunca o topo externo — maxZ fica na borda
        // da abertura, sempre abaixo da altura nominal (receita da espec).
        // A cota vem da fonte ÚNICA respiroEsferaMm (a mesma da malha e
        // do apoio A1), com o freio de curvatura incluído.
        expect(caixa.maxZ, rotulo).toBeCloseTo(respiroEsferaMm(params).zBordaMm, 1);
        expect(caixa.maxZ, rotulo).toBeLessThanOrEqual(altura);
      } else {
        expect(caixa.maxZ, rotulo).toBeCloseTo(altura, 1);
      }
      expect(caixa.minZ, `${rotulo}: nenhum vértice abaixo da mesa`).toBeCloseTo(
        0,
        5
      );
      expect(caixa.minZ, rotulo).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("esfera — apoio A1 diz a verdade sobre o topo truncado", () => {
  it("oca: alturaTopoMm bate com o maxZ REAL da malha (nada pousa flutuando)", () => {
    const oca = grampearBloco({
      forma: "esfera",
      oca: true,
      espessuraParedeMm: 2,
    });
    const caixa = caixaEnvolvente(gerarMalhaEsfera(oca));
    expect(apoioEsfera.alturaTopoMm(oca)).toBeCloseTo(caixa.maxZ, 1);

    // Dentro do respiro o pouso é no PISO INTERNO da cavidade — o objeto
    // cai pela abertura e assenta no fundo do bowl (A1 verdadeiro; null
    // deixava um bloco pequeno "assentar" na mesa DENTRO da esfera). Em
    // d = 0 a cota é a parede (o apiceInterno da malha); na borda do
    // respiro, exatamente o topo real.
    const { raioMm, paredeMm } = respiroEsferaMm(oca);
    expect(apoioEsfera.zSuperficieTopoMm(oca, 0)).toBeCloseTo(paredeMm, 5);
    const noMeio = apoioEsfera.zSuperficieTopoMm(oca, raioMm / 2);
    expect(noMeio).not.toBeNull();
    expect(noMeio!).toBeGreaterThan(paredeMm);
    // O piso da cavidade fica abaixo do centro do esferoide (é o fundo).
    expect(noMeio!).toBeLessThan((oca.tamanhoMm * oca.escalaAltura) / 2);
    expect(apoioEsfera.zSuperficieTopoMm(oca, raioMm)).toBeCloseTo(
      apoioEsfera.alturaTopoMm(oca),
      5
    );
    // A borda do respiro é a descontinuidade que a varredura de
    // tangencia.ts precisa amostrar exatamente (raios notáveis).
    expect(apoioEsfera.raiosNotaveisMm!(oca)).toEqual([raioMm]);
    // Acima da borda do respiro não há material: envelope lateral zera.
    expect(
      apoioEsfera.raioEnvelopeMm(oca, apoioEsfera.alturaTopoMm(oca) + 0.5)
    ).toBe(0);
  });

  it("pura: apoio continua o esferoide cheio (ponto de pouso no polo)", () => {
    const pura = grampearBloco({ forma: "esfera", oca: false, furos: null });
    const altura = pura.tamanhoMm * pura.escalaAltura;
    expect(apoioEsfera.alturaTopoMm(pura)).toBeCloseTo(altura, 5);
    expect(apoioEsfera.zSuperficieTopoMm(pura, 0)).toBeCloseTo(altura, 5);
    // Sem respiro não há degrau na superfície superior.
    expect(apoioEsfera.raiosNotaveisMm!(pura)).toEqual([]);
  });
});

describe("esfera — clamps do grampeador", () => {
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
      const umaVez = primitivoEsfera.grampear(caso);
      expect(primitivoEsfera.grampear(umaVez)).toEqual(umaVez);
      expect(umaVez.forma).toBe("esfera");
      expect(umaVez.espessuraParedeMm).toBeGreaterThanOrEqual(
        PAREDE_MINIMA_BLOCO_MM
      );
    }
  });

  it("furos forçam oca e respeitam o teto derivado do tamanho", () => {
    const grampeado = primitivoEsfera.grampear({
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
    esperarEstanque(gerarMalhaEsfera(grampeado), "furos forçaram oca");
  });

  it("a quantidade cai (nunca erro) quando o furo mínimo não cabe", () => {
    // Esfera fina (Ø 20 mm em planta): 12 furos de 4 mm não deixam parede F2.
    const grampeado = primitivoEsfera.grampear({
      tamanhoMm: 40,
      escalaLargura: 0.5,
      furos: { forma: "circulo", quantidade: 12, tamanhoMm: 4 },
    });
    expect(grampeado.furos).not.toBeNull();
    expect(grampeado.furos!.quantidade).toBeLessThan(12);
    expect(grampeado.furos!.quantidade).toBeGreaterThanOrEqual(1);
    esperarEstanque(gerarMalhaEsfera(grampeado), "quantidade grampeada");
  });
});
