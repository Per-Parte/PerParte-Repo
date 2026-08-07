/**
 * Montagem v2 · F1 — CUBO: contrato de teste da espec aplicado ao
 * primitivo. Estanqueidade de TODAS as variações (verificarEstanque +
 * volume assinado positivo), clamps idempotentes e furos que preservam
 * parede — sem tocar em nenhum teste existente.
 */

import { describe, expect, it } from "vitest";
import {
  BALANCO_MAXIMO_BLOCO_GRAUS,
  LIMITES_BLOCO,
  PAREDE_MINIMA_BLOCO_MM,
  VARIACOES_BLOCO,
  apoioCubo,
  arcoBorda,
  blocoDaVariacao,
  bordaTamanhoMaxMm,
  furoMaximoMm,
  gerarMalhaCubo,
  grampearBloco,
  primitivoCubo,
  type MalhaBloco,
  type ParametrosBloco,
  type SentidoBorda,
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

/** Miolo comum: params grampeados de um cubo com borda encurvada. */
function cuboComBorda(
  sentido: SentidoBorda,
  tamanhoBordaMm: number,
  extra: Record<string, unknown> = {}
): ParametrosBloco {
  return grampearBloco({
    forma: "cubo",
    tamanhoMm: 100,
    espessuraParedeMm: 2,
    ...extra,
    bordaTopo: { sentido, tamanhoMm: tamanhoBordaMm },
  });
}

/** Teto do slider da borda para estes params já grampeados. */
function tetoBordaMm(p: ParametrosBloco, sentido: SentidoBorda): number {
  return bordaTamanhoMaxMm({
    tamanhoMm: p.tamanhoMm,
    escalaAltura: p.escalaAltura,
    escalaLargura: p.escalaLargura,
    oca: p.oca,
    espessuraParedeMm: p.espessuraParedeMm,
    sentido,
    posicao: "topo",
  });
}

/**
 * Anéis da malha: para cada cota z, a MEIA-LARGURA da planta naquela cota
 * (max(|x|, |y|) do vértice mais afastado). Planta quadrada: todo vértice
 * do perímetro tem max(|x|, |y|) = meia-largura, então o maior valor da
 * cota é a meia-largura EXATA da seção — e as duas paredes da oca
 * compartilham as linhas z, logo o maior é sempre o da parede externa.
 */
function aneisDaMalha(malha: MalhaBloco): { z: number; meia: number }[] {
  const porZ = new Map<string, number>();
  for (let i = 0; i < malha.posicoes.length; i += 3) {
    const z = malha.posicoes[i + 2];
    const meia = Math.max(
      Math.abs(malha.posicoes[i]),
      Math.abs(malha.posicoes[i + 1])
    );
    const chave = z.toFixed(4);
    porZ.set(chave, Math.max(porZ.get(chave) ?? 0, meia));
  }
  return [...porZ]
    .map(([z, meia]) => ({ z: Number(z), meia }))
    .sort((a, b) => a.z - b.z);
}

/** Maior |Δmeia|/Δz entre anéis consecutivos DENTRO da faixa da borda. */
function inclinacaoMaximaNaFaixa(malha: MalhaBloco, zPeMm: number): number {
  const aneis = aneisDaMalha(malha).filter((a) => a.z >= zPeMm - 1e-6);
  let pior = 0;
  for (let i = 1; i < aneis.length; i++) {
    const dz = aneis[i].z - aneis[i - 1].z;
    if (dz <= 1e-9) continue;
    pior = Math.max(pior, Math.abs(aneis[i].meia - aneis[i - 1].meia) / dz);
  }
  return pior;
}

const TAN_F4 = Math.tan((BALANCO_MAXIMO_BLOCO_GRAUS * Math.PI) / 180);

describe("cubo — borda encurvada", () => {
  it("estanque nos dois sentidos × sólida/oca/furada × tamanhos × escalas", () => {
    const variantes = [
      { rotulo: "sólida", extra: { oca: false, furos: null } },
      { rotulo: "oca", extra: { oca: true, furos: null } },
      {
        rotulo: "oca com furos",
        extra: {
          furos: { forma: "circulo" as const, quantidade: 6, tamanhoMm: 10 },
        },
      },
    ];
    for (const sentido of ["fora", "dentro"] as const) {
      for (const { rotulo, extra } of variantes) {
        for (const tamanhoMm of [40, 100, 200]) {
          for (const escala of [0.5, 1, 1.5]) {
            const dimensoes = {
              tamanhoMm,
              escalaAltura: escala,
              escalaLargura: escala,
              ...extra,
            };
            const semBorda = grampearBloco({
              forma: "cubo",
              espessuraParedeMm: 2,
              ...dimensoes,
            });
            const teto = tetoBordaMm(semBorda, sentido);
            const pedidos =
              teto > 0
                ? [
                    LIMITES_BLOCO.bordaTamanhoMm.min,
                    (LIMITES_BLOCO.bordaTamanhoMm.min + teto) / 2,
                    999,
                  ]
                : [999];
            for (const pedido of pedidos) {
              const params = cuboComBorda(sentido, pedido, dimensoes);
              const nome = `${sentido}/${rotulo}/${tamanhoMm}mm/×${escala}/borda ${pedido}`;
              if (teto > 0) {
                // Clamp geométrico: o slider encosta no teto, nunca erra.
                expect(params.bordaTopo, nome).not.toBeNull();
                expect(params.bordaTopo!.tamanhoMm, nome).toBeLessThanOrEqual(
                  teto + 1e-9
                );
                if (pedido === 999) {
                  expect(params.bordaTopo!.tamanhoMm, nome).toBeCloseTo(teto, 6);
                }
              } else {
                // Nem o arco mínimo cabe: a borda simplesmente some.
                expect(params.bordaTopo, nome).toBeNull();
              }
              esperarEstanque(gerarMalhaCubo(params), nome);
            }
          }
        }
      }
    }
    // 162 malhas de 48 colunas por face com a verificação de estanqueidade
    // aresta por aresta: passa dos 5 s padrão do vitest.
  }, 60000);

  it("a borda muda a PLANTA do topo, nunca a altura nem o assentamento na mesa", () => {
    for (const oca of [false, true]) {
      const semBorda = grampearBloco({
        forma: "cubo",
        tamanhoMm: 100,
        espessuraParedeMm: 2,
        oca,
      });
      const largura = semBorda.tamanhoMm * semBorda.escalaLargura;
      const altura = semBorda.tamanhoMm * semBorda.escalaAltura;

      const fora = cuboComBorda("fora", 999, { oca });
      const arcoFora = arcoBorda(fora, altura);
      const caixaFora = caixaEnvolvente(gerarMalhaCubo(fora));
      // "Fora" ALARGA a planta exatamente o offset do topo (aba de abajur).
      expect(arcoFora.offsetTopoMm).toBeGreaterThan(0);
      expect(caixaFora.maxX - caixaFora.minX, "fora alarga X").toBeCloseTo(
        largura + 2 * arcoFora.offsetTopoMm,
        2
      );
      expect(caixaFora.maxY - caixaFora.minY, "fora alarga Y").toBeCloseTo(
        largura + 2 * arcoFora.offsetTopoMm,
        2
      );
      expect(caixaFora.maxZ, "fora não mexe na altura").toBeCloseTo(altura, 3);
      expect(caixaFora.minZ, "fora: nada abaixo da mesa").toBeCloseTo(0, 5);

      const dentro = cuboComBorda("dentro", 999, { oca });
      const caixaDentro = caixaEnvolvente(gerarMalhaCubo(dentro));
      // "Dentro" só encolhe o topo: a caixa continua a da BASE.
      expect(caixaDentro.maxX - caixaDentro.minX, "dentro mantém X").toBeCloseTo(
        largura,
        2
      );
      expect(caixaDentro.maxY - caixaDentro.minY, "dentro mantém Y").toBeCloseTo(
        largura,
        2
      );
      expect(caixaDentro.maxZ, "dentro não mexe na altura").toBeCloseTo(
        altura,
        3
      );
      expect(caixaDentro.minZ, "dentro: nada abaixo da mesa").toBeCloseTo(0, 5);
    }
  });

  it("a superfície da faixa respeita o balanço F4 (fora sempre; dentro quando oca)", () => {
    const casos = [
      { rotulo: "fora sólida", sentido: "fora" as const, oca: false },
      { rotulo: "fora oca", sentido: "fora" as const, oca: true },
      { rotulo: "dentro oca", sentido: "dentro" as const, oca: true },
    ];
    for (const { rotulo, sentido, oca } of casos) {
      const params = cuboComBorda(sentido, 999, { oca });
      const altura = params.tamanhoMm * params.escalaAltura;
      const arco = arcoBorda(params, altura);
      const inclinacao = inclinacaoMaximaNaFaixa(
        gerarMalhaCubo(params),
        altura - arco.alturaMm
      );
      // A lateral do cubo é VERTICAL: a inclinação da faixa é o próprio
      // ângulo do arco, e cada camada avança sobre o vazio nele.
      expect(inclinacao, rotulo).toBeLessThanOrEqual(TAN_F4 + 1e-6);
      expect(inclinacao, `${rotulo}: a faixa realmente encurva`).toBeGreaterThan(
        0.05
      );
    }

    // DENTRO + SÓLIDA é a exceção documentada em blocos/borda.ts: a faixa é
    // uma cúpula CONVERGENTE (o arco fecha até 90°, como o polo de uma
    // esfera). Cada camada assenta INTEIRA na de baixo, então não há
    // balanço a pagar — e a inclinação medida passa de F4 de propósito.
    const dentroSolida = cuboComBorda("dentro", 999, { oca: false });
    const alturaSolida = dentroSolida.tamanhoMm * dentroSolida.escalaAltura;
    const arcoSolido = arcoBorda(dentroSolida, alturaSolida);
    expect(
      inclinacaoMaximaNaFaixa(
        gerarMalhaCubo(dentroSolida),
        alturaSolida - arcoSolido.alturaMm
      )
    ).toBeGreaterThan(TAN_F4);
  });

  it("o apoio conta a verdade sobre a malha com borda (A1)", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = cuboComBorda(sentido, 999, { oca });
        const nome = `${sentido}/${oca ? "oca" : "sólida"}`;
        const malha = gerarMalhaCubo(params);
        const caixa = caixaEnvolvente(malha);
        const aneis = aneisDaMalha(malha);
        const altura = params.tamanhoMm * params.escalaAltura;
        const meiaCorpo = (params.tamanhoMm * params.escalaLargura) / 2;
        const arco = arcoBorda(params, altura);
        const zPe = altura - arco.alturaMm;

        // Topo: a altura e o platô do topo batem com a malha real.
        expect(apoioCubo.alturaTopoMm(params), nome).toBeCloseTo(caixa.maxZ, 3);
        const anelTopo = aneis[aneis.length - 1];
        expect(anelTopo.z, nome).toBeCloseTo(altura, 3);
        expect(
          apoioCubo.raioApoioSuperiorMm(params),
          `${nome}: meia-largura do topo`
        ).toBeCloseTo(anelTopo.meia, 2);
        // O sentido da borda decide se o platô cresce ou encolhe.
        if (sentido === "fora") {
          expect(anelTopo.meia, nome).toBeGreaterThan(meiaCorpo);
        } else {
          expect(anelTopo.meia, nome).toBeLessThan(meiaCorpo);
        }
        // A quina do topo é raio NOTÁVEL (tangencia.ts amostra lá).
        const notaveis = apoioCubo.raiosNotaveisMm!(params);
        expect(
          notaveis.some((r) => Math.abs(r - anelTopo.meia) < 1e-3),
          `${nome}: meia-largura do topo entre os notáveis`
        ).toBe(true);

        // Platô da fatia: o raio INSCRITO da seção numa cota da faixa bate
        // com a meia-largura medida na malha (tolerância de 1 célula).
        const naFaixa = aneis.filter((a) => a.z > zPe + 1e-6 && a.z < altura);
        expect(
          naFaixa.length,
          `${nome}: a faixa tem linhas de grade próprias`
        ).toBeGreaterThanOrEqual(4);
        const meio = naFaixa[Math.floor(naFaixa.length / 2)];
        expect(
          apoioCubo.raioPlatoMm!(params, meio.z),
          `${nome}: platô na faixa`
        ).toBeCloseTo(meio.meia, 2);
        // Envelope: planta quadrada, circunscrito da seção do arco.
        expect(
          apoioCubo.raioEnvelopeMm(params, meio.z),
          `${nome}: envelope na faixa`
        ).toBeCloseTo(meio.meia * Math.SQRT2, 2);
        expect(apoioCubo.raioPlatoMm!(params, -1), nome).toBe(0);
        expect(apoioCubo.raioPlatoMm!(params, altura + 1), nome).toBe(0);

        // Assentamento: dentro do platô do topo pousa em H; além do
        // envelope, não há superfície.
        expect(
          apoioCubo.zSuperficieTopoMm(params, anelTopo.meia * 0.99),
          `${nome}: pousa no platô do topo`
        ).toBeCloseTo(altura, 3);
        expect(
          apoioCubo.zSuperficieTopoMm(
            params,
            Math.max(anelTopo.meia, meiaCorpo) + 1
          ),
          `${nome}: fora do envelope`
        ).toBeNull();
        if (sentido === "dentro") {
          // O lábio olha para cima: quem pousa entre a meia-largura do topo
          // e a do corpo assenta na SUPERFÍCIE DO ARCO, na cota da malha.
          expect(
            apoioCubo.zSuperficieTopoMm(params, meio.meia),
            `${nome}: pousa no arco`
          ).toBeCloseTo(meio.z, 1);
        }
      }
    }
  });

  it("dentro desloca menos material que sem borda; fora desloca mais", () => {
    const semBorda = grampearBloco({
      forma: "cubo",
      tamanhoMm: 100,
      oca: false,
    });
    const volumeSem = volumeAssinadoMm3(gerarMalhaCubo(semBorda));
    const volumeFora = volumeAssinadoMm3(
      gerarMalhaCubo(cuboComBorda("fora", 999, { oca: false }))
    );
    const volumeDentro = volumeAssinadoMm3(
      gerarMalhaCubo(cuboComBorda("dentro", 999, { oca: false }))
    );
    expect(volumeFora).toBeGreaterThan(volumeSem);
    expect(volumeDentro).toBeLessThan(volumeSem);
    expect(volumeDentro).toBeGreaterThan(0);
  });
});

/** Miolo comum: params grampeados de um cubo com borda de FUNDO. */
function cuboComBordaFundo(
  sentido: SentidoBorda,
  tamanhoBordaMm: number,
  extra: Record<string, unknown> = {}
): ParametrosBloco {
  return grampearBloco({
    forma: "cubo",
    tamanhoMm: 100,
    espessuraParedeMm: 2,
    ...extra,
    bordaFundo: { sentido, tamanhoMm: tamanhoBordaMm },
  });
}

/** Teto do slider da borda de FUNDO para estes params já grampeados. */
function tetoBordaFundoMm(p: ParametrosBloco, sentido: SentidoBorda): number {
  return bordaTamanhoMaxMm({
    tamanhoMm: p.tamanhoMm,
    escalaAltura: p.escalaAltura,
    escalaLargura: p.escalaLargura,
    oca: p.oca,
    espessuraParedeMm: p.espessuraParedeMm,
    sentido,
    posicao: "fundo",
  });
}

/** Maior |Δmeia|/Δz entre anéis consecutivos DENTRO da faixa do fundo. */
function inclinacaoMaximaNaFaixaFundo(
  malha: MalhaBloco,
  zTetoMm: number
): number {
  const aneis = aneisDaMalha(malha).filter((a) => a.z <= zTetoMm + 1e-6);
  let pior = 0;
  for (let i = 1; i < aneis.length; i++) {
    const dz = aneis[i].z - aneis[i - 1].z;
    if (dz <= 1e-9) continue;
    pior = Math.max(pior, Math.abs(aneis[i].meia - aneis[i - 1].meia) / dz);
  }
  return pior;
}

describe("cubo — borda de fundo", () => {
  it("estanque nos dois sentidos × sólida/oca/furada × tamanhos × escalas", () => {
    const variantes = [
      { rotulo: "sólida", extra: { oca: false, furos: null } },
      { rotulo: "oca", extra: { oca: true, furos: null } },
      {
        rotulo: "oca com furos",
        extra: {
          furos: { forma: "circulo" as const, quantidade: 6, tamanhoMm: 10 },
        },
      },
    ];
    for (const sentido of ["fora", "dentro"] as const) {
      for (const { rotulo, extra } of variantes) {
        for (const tamanhoMm of [40, 100, 200]) {
          for (const escala of [0.5, 1, 1.5]) {
            const dimensoes = {
              tamanhoMm,
              escalaAltura: escala,
              escalaLargura: escala,
              ...extra,
            };
            const semBorda = grampearBloco({
              forma: "cubo",
              espessuraParedeMm: 2,
              ...dimensoes,
            });
            const teto = tetoBordaFundoMm(semBorda, sentido);
            const pedidos =
              teto > 0
                ? [
                    LIMITES_BLOCO.bordaTamanhoMm.min,
                    (LIMITES_BLOCO.bordaTamanhoMm.min + teto) / 2,
                    999,
                  ]
                : [999];
            for (const pedido of pedidos) {
              const params = cuboComBordaFundo(sentido, pedido, dimensoes);
              const nome = `fundo ${sentido}/${rotulo}/${tamanhoMm}mm/×${escala}/borda ${pedido}`;
              if (teto > 0) {
                // Clamp geométrico: o slider encosta no teto, nunca erra.
                expect(params.bordaFundo, nome).not.toBeNull();
                expect(params.bordaFundo!.tamanhoMm, nome).toBeLessThanOrEqual(
                  teto + 1e-9
                );
                if (pedido === 999) {
                  expect(params.bordaFundo!.tamanhoMm, nome).toBeCloseTo(
                    teto,
                    6
                  );
                }
              } else {
                // Nem o arco mínimo cabe: a borda simplesmente some.
                expect(params.bordaFundo, nome).toBeNull();
              }
              esperarEstanque(gerarMalhaCubo(params), nome);
            }
          }
        }
      }
    }
    // 162 malhas com a verificação de estanqueidade aresta por aresta:
    // passa dos 5 s padrão do vitest.
  }, 60000);

  it("as duas bordas coexistem — topo × fundo em todos os pares de sentido", () => {
    for (const sentidoTopo of ["fora", "dentro"] as const) {
      for (const sentidoFundo of ["fora", "dentro"] as const) {
        for (const oca of [false, true]) {
          const params = grampearBloco({
            forma: "cubo",
            tamanhoMm: 100,
            espessuraParedeMm: 2,
            oca,
            bordaTopo: { sentido: sentidoTopo, tamanhoMm: 999 },
            bordaFundo: { sentido: sentidoFundo, tamanhoMm: 999 },
          });
          const nome = `topo ${sentidoTopo} + fundo ${sentidoFundo}/${oca ? "oca" : "sólida"}`;
          expect(params.bordaTopo, nome).not.toBeNull();
          expect(params.bordaFundo, nome).not.toBeNull();
          const altura = params.tamanhoMm * params.escalaAltura;
          const largura = params.tamanhoMm * params.escalaLargura;
          const arcoTopo = arcoBorda(params, altura, "topo");
          const arcoFundo = arcoBorda(params, altura, "fundo");
          // As duas faixas juntas ficam em ≤ 2/3 da altura: sobra sempre
          // um terço de lateral reta no meio (clamp de limites.ts).
          expect(
            arcoTopo.alturaMm + arcoFundo.alturaMm,
            nome
          ).toBeLessThanOrEqual((2 * altura) / 3 + 1e-6);
          esperarEstanque(gerarMalhaCubo(params), nome);
          // O apoio declara cada extremidade com o SEU arco (A1).
          expect(apoioCubo.raioApoioSuperiorMm(params), nome).toBeCloseTo(
            largura / 2 + arcoTopo.offsetTopoMm,
            3
          );
          expect(apoioCubo.raioApoioInferiorMm(params), nome).toBeCloseTo(
            largura / 2 + arcoFundo.offsetTopoMm,
            3
          );
        }
      }
    }
    // Com furos: a banda espremida entre as DUAS faixas ainda entrega
    // furos de verdade (ou os derruba na cascata — nunca erro).
    const furada = grampearBloco({
      forma: "cubo",
      tamanhoMm: 100,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 10 },
      bordaTopo: { sentido: "fora", tamanhoMm: 999 },
      bordaFundo: { sentido: "fora", tamanhoMm: 999 },
    });
    expect(furada.bordaTopo).not.toBeNull();
    expect(furada.bordaFundo).not.toBeNull();
    const comFuros = gerarMalhaCubo(furada);
    esperarEstanque(comFuros, "duas bordas + furos");
    if (furada.furos) {
      const semFuros = gerarMalhaCubo({ ...furada, furos: null });
      expect(volumeAssinadoMm3(comFuros)).toBeLessThan(
        volumeAssinadoMm3(semFuros)
      );
    }
  });

  it("fora ALARGA a planta na base; dentro mantém a caixa — a altura nunca muda", () => {
    for (const oca of [false, true]) {
      const semBorda = grampearBloco({
        forma: "cubo",
        tamanhoMm: 100,
        espessuraParedeMm: 2,
        oca,
      });
      const largura = semBorda.tamanhoMm * semBorda.escalaLargura;
      const altura = semBorda.tamanhoMm * semBorda.escalaAltura;

      const fora = cuboComBordaFundo("fora", 999, { oca });
      const arcoFora = arcoBorda(fora, altura, "fundo");
      const caixaFora = caixaEnvolvente(gerarMalhaCubo(fora));
      // "Fora" no FUNDO alarga a planta NA BASE (pé de cálice) — é o
      // espelho da aba do topo.
      expect(arcoFora.offsetTopoMm).toBeGreaterThan(0);
      expect(caixaFora.maxX - caixaFora.minX, "fora alarga X").toBeCloseTo(
        largura + 2 * arcoFora.offsetTopoMm,
        2
      );
      expect(caixaFora.maxY - caixaFora.minY, "fora alarga Y").toBeCloseTo(
        largura + 2 * arcoFora.offsetTopoMm,
        2
      );
      expect(caixaFora.maxZ, "fora não mexe na altura").toBeCloseTo(altura, 3);
      expect(caixaFora.minZ, "fora: nada abaixo da mesa").toBeCloseTo(0, 5);

      const dentro = cuboComBordaFundo("dentro", 999, { oca });
      const caixaDentro = caixaEnvolvente(gerarMalhaCubo(dentro));
      // "Dentro" só recolhe a base: a caixa continua a do CORPO.
      expect(caixaDentro.maxX - caixaDentro.minX, "dentro mantém X").toBeCloseTo(
        largura,
        2
      );
      expect(caixaDentro.maxY - caixaDentro.minY, "dentro mantém Y").toBeCloseTo(
        largura,
        2
      );
      expect(caixaDentro.maxZ, "dentro não mexe na altura").toBeCloseTo(
        altura,
        3
      );
      expect(caixaDentro.minZ, "dentro: nada abaixo da mesa").toBeCloseTo(0, 5);
    }
  });

  it("F4 na faixa do fundo: a regra INVERTE — fora sólida é livre, dentro paga", () => {
    // No FUNDO quem CONVERGE SUBINDO é o pé de cálice (fora): cada camada
    // assenta inteira na de baixo, então a sólida é LIVRE (o arco fecha
    // até 90°). Quem paga F4 é o "dentro" (barriga em balanço: a peça
    // DIVERGE subindo e cada camada avança sobre o vazio) — e a oca paga
    // sempre, porque uma das paredes fica pairando sobre a cavidade.
    const pagantes = [
      { rotulo: "fundo fora oca", sentido: "fora" as const, oca: true },
      { rotulo: "fundo dentro sólida", sentido: "dentro" as const, oca: false },
      { rotulo: "fundo dentro oca", sentido: "dentro" as const, oca: true },
    ];
    for (const { rotulo, sentido, oca } of pagantes) {
      const params = cuboComBordaFundo(sentido, 999, { oca });
      const altura = params.tamanhoMm * params.escalaAltura;
      const arco = arcoBorda(params, altura, "fundo");
      const inclinacao = inclinacaoMaximaNaFaixaFundo(
        gerarMalhaCubo(params),
        arco.alturaMm
      );
      // A lateral do cubo é VERTICAL: a inclinação da faixa é o próprio
      // ângulo do arco.
      expect(inclinacao, rotulo).toBeLessThanOrEqual(TAN_F4 + 1e-6);
      expect(inclinacao, `${rotulo}: a faixa realmente encurva`).toBeGreaterThan(
        0.05
      );
    }

    // FORA + SÓLIDA é a exceção do fundo (o espelho do "dentro sólida" do
    // topo): a faixa é uma cúpula convergente DE CABEÇA PARA BAIXO — na
    // impressão ela converge subindo, sem balanço a pagar — e a
    // inclinação medida passa de F4 de propósito.
    const foraSolida = cuboComBordaFundo("fora", 999, { oca: false });
    const alturaSolida = foraSolida.tamanhoMm * foraSolida.escalaAltura;
    const arcoSolido = arcoBorda(foraSolida, alturaSolida, "fundo");
    expect(
      inclinacaoMaximaNaFaixaFundo(
        gerarMalhaCubo(foraSolida),
        arcoSolido.alturaMm
      )
    ).toBeGreaterThan(TAN_F4);
  });

  it("o apoio conta a verdade sobre a malha com borda de fundo (A1)", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = cuboComBordaFundo(sentido, 999, { oca });
        const nome = `fundo ${sentido}/${oca ? "oca" : "sólida"}`;
        const malha = gerarMalhaCubo(params);
        const caixa = caixaEnvolvente(malha);
        const aneis = aneisDaMalha(malha);
        const altura = params.tamanhoMm * params.escalaAltura;
        const meiaCorpo = (params.tamanhoMm * params.escalaLargura) / 2;
        const arco = arcoBorda(params, altura, "fundo");

        // A borda de fundo não mexe no TOPO: altura e platô superior são
        // os de sempre.
        expect(apoioCubo.alturaTopoMm(params), nome).toBeCloseTo(caixa.maxZ, 3);
        expect(apoioCubo.raioApoioSuperiorMm(params), nome).toBeCloseTo(
          meiaCorpo,
          6
        );

        // BASE real: o anel de z = 0 da malha é o raio declarado — é o que
        // a regra de base estável (base-estavel.ts) lê para decidir pé.
        const anelBase = aneis[0];
        expect(anelBase.z, nome).toBeCloseTo(0, 5);
        expect(
          apoioCubo.raioApoioInferiorMm(params),
          `${nome}: raio real da base`
        ).toBeCloseTo(anelBase.meia, 2);
        expect(
          apoioCubo.raioPlatoMm!(params, 0),
          `${nome}: platô na cota 0 reflete o fundo`
        ).toBeCloseTo(anelBase.meia, 2);
        expect(
          apoioCubo.raioEnvelopeMm(params, 0),
          `${nome}: envelope na base`
        ).toBeCloseTo(anelBase.meia * Math.SQRT2, 2);
        if (sentido === "fora") {
          expect(anelBase.meia, nome).toBeGreaterThan(meiaCorpo);
        } else {
          expect(anelBase.meia, nome).toBeLessThan(meiaCorpo);
        }
        // A quina da base é raio NOTÁVEL (tangencia.ts amostra lá).
        const notaveis = apoioCubo.raiosNotaveisMm!(params);
        expect(
          notaveis.some((r) => Math.abs(r - anelBase.meia) < 1e-3),
          `${nome}: raio da base entre os notáveis`
        ).toBe(true);

        // A faixa tem linhas de grade próprias e o platô da fatia bate.
        const naFaixa = aneis.filter(
          (a) => a.z > 1e-6 && a.z < arco.alturaMm - 1e-6
        );
        expect(
          naFaixa.length,
          `${nome}: a faixa tem linhas de grade próprias`
        ).toBeGreaterThanOrEqual(4);
        const meio = naFaixa[Math.floor(naFaixa.length / 2)];
        expect(
          apoioCubo.raioPlatoMm!(params, meio.z),
          `${nome}: platô na faixa`
        ).toBeCloseTo(meio.meia, 2);

        // Superfície INFERIOR honesta (é ela que assenta a peça na cena).
        if (sentido === "dentro") {
          // Tampa plana até a base recolhida; entre ela e o corpo a
          // superfície de baixo é o ARCO (a barriga olha para baixo).
          expect(
            apoioCubo.zSuperficieBaseMm(params, anelBase.meia * 0.99),
            `${nome}: tampa plana`
          ).toBeCloseTo(0, 6);
          expect(
            apoioCubo.zSuperficieBaseMm(params, meio.meia),
            `${nome}: superfície de baixo é o arco`
          ).toBeCloseTo(meio.z, 1);
          expect(
            apoioCubo.zSuperficieBaseMm(params, meiaCorpo + 1),
            `${nome}: fora do corpo`
          ).toBeNull();
        } else {
          // Base alargada: superfície inferior plana em 0 até o raio da
          // saia — o arco viceja ACIMA dela e olha para CIMA.
          expect(
            apoioCubo.zSuperficieBaseMm(params, anelBase.meia - 0.1),
            `${nome}: 0 até a base alargada`
          ).toBeCloseTo(0, 6);
          expect(
            apoioCubo.zSuperficieBaseMm(params, anelBase.meia + 1),
            `${nome}: além da saia`
          ).toBeNull();
          expect(
            apoioCubo.zSuperficieTopoMm(params, meio.meia),
            `${nome}: quem pousa na saia assenta no arco`
          ).toBeCloseTo(meio.z, 1);
        }
      }
    }
  });

  it("fundo fora desloca mais material; fundo dentro desloca menos", () => {
    const semBorda = grampearBloco({
      forma: "cubo",
      tamanhoMm: 100,
      oca: false,
    });
    const volumeSem = volumeAssinadoMm3(gerarMalhaCubo(semBorda));
    const volumeFora = volumeAssinadoMm3(
      gerarMalhaCubo(cuboComBordaFundo("fora", 999, { oca: false }))
    );
    const volumeDentro = volumeAssinadoMm3(
      gerarMalhaCubo(cuboComBordaFundo("dentro", 999, { oca: false }))
    );
    expect(volumeFora).toBeGreaterThan(volumeSem);
    expect(volumeDentro).toBeLessThan(volumeSem);
    expect(volumeDentro).toBeGreaterThan(0);
  });
});
