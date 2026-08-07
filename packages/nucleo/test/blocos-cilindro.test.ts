/**
 * Montagem v2 · F1 — CILINDRO: contrato de teste da espec aplicado ao
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
  apoioCilindro,
  arcoBorda,
  blocoDaVariacao,
  bordaTamanhoMaxMm,
  furoMaximoMm,
  gerarMalhaCilindro,
  grampearBloco,
  primitivoCilindro,
  type MalhaBloco,
  type ParametrosBloco,
  type PosicaoBorda,
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

describe("cilindro — malha estanque em todas as variações", () => {
  it("as 8 variações do Montar são sólidos estanques de volume positivo", () => {
    for (const variacao of VARIACOES_BLOCO) {
      const params = blocoDaVariacao(variacao, "cilindro");
      esperarEstanque(gerarMalhaCilindro(params), `variação ${variacao.id}`);
    }
  });

  it("oca desloca menos material que pura; furos tiram ainda mais", () => {
    const pura = grampearBloco({ forma: "cilindro", oca: false, furos: null });
    const oca = grampearBloco({
      forma: "cilindro",
      oca: true,
      espessuraParedeMm: 2,
      furos: null,
    });
    const furada = grampearBloco({
      forma: "cilindro",
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 6, tamanhoMm: 12 },
    });
    const volumePura = volumeAssinadoMm3(gerarMalhaCilindro(pura));
    const volumeOca = volumeAssinadoMm3(gerarMalhaCilindro(oca));
    const volumeFurada = volumeAssinadoMm3(gerarMalhaCilindro(furada));
    expect(volumeOca).toBeLessThan(volumePura);
    expect(volumeFurada).toBeLessThan(volumeOca);
    expect(volumeFurada).toBeGreaterThan(0);
  });

  it("furo no piso (4 mm) e no teto furoMaximoMm(p) não degeneram a malha", () => {
    for (const formaFuro of ["circulo", "quadrado", "triangulo"] as const) {
      const noPiso = grampearBloco({
        forma: "cilindro",
        furos: {
          forma: formaFuro,
          quantidade: 6,
          tamanhoMm: LIMITES_BLOCO.furoTamanhoMm.min,
        },
      });
      expect(noPiso.furos?.tamanhoMm).toBe(LIMITES_BLOCO.furoTamanhoMm.min);
      esperarEstanque(gerarMalhaCilindro(noPiso), `${formaFuro} no piso`);

      const noTeto = grampearBloco({
        forma: "cilindro",
        furos: { forma: formaFuro, quantidade: 6, tamanhoMm: 999 },
      });
      expect(noTeto.furos?.tamanhoMm).toBeCloseTo(furoMaximoMm(noTeto));
      esperarEstanque(gerarMalhaCilindro(noTeto), `${formaFuro} no teto`);
    }
    // Teto de quantidade junto com teto de tamanho: o caso mais denso.
    const denso = grampearBloco({
      forma: "cilindro",
      furos: { forma: "triangulo", quantidade: 12, tamanhoMm: 999 },
    });
    esperarEstanque(gerarMalhaCilindro(denso), "12 furos no teto de tamanho");
  });

  it("mais segmentos refinam sem quebrar a estanqueidade", () => {
    const furada = grampearBloco({
      forma: "cilindro",
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 14 },
    });
    const pura = grampearBloco({ forma: "cilindro", oca: false, furos: null });
    let triangulosAntes = 0;
    for (const segmentos of [24, 48, 96]) {
      const malha = gerarMalhaCilindro(furada, segmentos);
      esperarEstanque(malha, `furada com ${segmentos} segmentos`);
      expect(malha.indices.length / 3).toBeGreaterThanOrEqual(triangulosAntes);
      triangulosAntes = malha.indices.length / 3;
      esperarEstanque(
        gerarMalhaCilindro(pura, segmentos),
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
        forma: "cilindro",
        tamanhoMm: 100,
        ...caso,
      });
      const malha = gerarMalhaCilindro(params);
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

describe("cilindro — clamps do grampeador", () => {
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
      const umaVez = primitivoCilindro.grampear(caso);
      expect(primitivoCilindro.grampear(umaVez)).toEqual(umaVez);
      expect(umaVez.forma).toBe("cilindro");
      expect(umaVez.espessuraParedeMm).toBeGreaterThanOrEqual(
        PAREDE_MINIMA_BLOCO_MM
      );
    }
  });

  it("furos forçam oca e respeitam o teto derivado do tamanho", () => {
    const grampeado = primitivoCilindro.grampear({
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
    esperarEstanque(gerarMalhaCilindro(grampeado), "furos forçaram oca");
  });

  it("a quantidade cai (nunca erro) quando o furo mínimo não cabe", () => {
    // Cilindro fino (Ø 20 mm): 12 furos de 4 mm não deixam parede F2.
    const grampeado = primitivoCilindro.grampear({
      tamanhoMm: 40,
      escalaLargura: 0.5,
      furos: { forma: "circulo", quantidade: 12, tamanhoMm: 4 },
    });
    expect(grampeado.furos).not.toBeNull();
    expect(grampeado.furos!.quantidade).toBeLessThan(12);
    expect(grampeado.furos!.quantidade).toBeGreaterThanOrEqual(1);
    esperarEstanque(gerarMalhaCilindro(grampeado), "quantidade grampeada");
  });
});

/* ---------------------------------------------------------------------
 * BORDA ENCURVADA (pedido do Davi, 06/08) — a faixa de cima da silhueta
 * vira um arco: para FORA abre como aba de abajur, para DENTRO fecha como
 * lábio. O que estes testes protegem: estanqueidade em toda a matriz de
 * variações, a caixa envolvente (a borda muda a PLANTA do topo, nunca a
 * altura), o teto de balanço F4 medido NA MALHA e o apoio dizendo a
 * verdade sobre a malha real (invariante A1).
 * ------------------------------------------------------------------- */

const TAN_F4 = Math.tan((BALANCO_MAXIMO_BLOCO_GRAUS * Math.PI) / 180);

/** Miolo comum: params grampeados de um cilindro com borda. */
function cilindroComBorda(
  sentido: SentidoBorda,
  tamanhoBordaMm: number,
  extra: Record<string, unknown> = {}
): ParametrosBloco {
  return grampearBloco({
    forma: "cilindro",
    tamanhoMm: 100,
    espessuraParedeMm: 2,
    ...extra,
    bordaTopo: { sentido, tamanhoMm: tamanhoBordaMm },
  });
}

/** Teto do slider da borda para estes params já grampeados. */
function tetoBordaMm(
  p: ParametrosBloco,
  sentido: SentidoBorda,
  posicao: PosicaoBorda = "topo"
): number {
  return bordaTamanhoMaxMm({
    tamanhoMm: p.tamanhoMm,
    escalaAltura: p.escalaAltura,
    escalaLargura: p.escalaLargura,
    oca: p.oca,
    espessuraParedeMm: p.espessuraParedeMm,
    sentido,
    posicao,
  });
}

/**
 * Anéis da malha: para cada cota z, o maior e o menor raio dos vértices
 * daquela cota. Como a grade em θ é múltipla de 4, existe vértice em θ = 0
 * — o maior raio de um anel é o raio EXATO da seção naquela cota (e o
 * menor, num sólido de revolução puro, é o raio inscrito do polígono).
 */
function aneisDaMalha(
  malha: MalhaBloco
): { z: number; raio: number; raioInterno: number }[] {
  const porZ = new Map<string, { raio: number; raioInterno: number }>();
  for (let i = 0; i < malha.posicoes.length; i += 3) {
    const z = malha.posicoes[i + 2];
    const raio = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
    // Vértices NO eixo (ápices e centros dos leques) não são anel.
    if (raio < 0.05) continue;
    const chave = z.toFixed(4);
    const atual = porZ.get(chave);
    if (!atual) porZ.set(chave, { raio, raioInterno: raio });
    else {
      atual.raio = Math.max(atual.raio, raio);
      atual.raioInterno = Math.min(atual.raioInterno, raio);
    }
  }
  return [...porZ]
    .map(([z, r]) => ({ z: Number(z), ...r }))
    .sort((a, b) => a.z - b.z);
}

/** Maior |Δr|/Δz entre anéis consecutivos DENTRO da faixa da borda. */
function inclinacaoMaximaNaFaixa(
  malha: MalhaBloco,
  zPeMm: number
): number {
  const aneis = aneisDaMalha(malha).filter((a) => a.z >= zPeMm - 1e-6);
  let pior = 0;
  for (let i = 1; i < aneis.length; i++) {
    const dz = aneis[i].z - aneis[i - 1].z;
    if (dz <= 1e-9) continue;
    pior = Math.max(pior, Math.abs(aneis[i].raio - aneis[i - 1].raio) / dz);
  }
  return pior;
}

describe("cilindro — borda encurvada", () => {
  it("estanque nos dois sentidos × sólida/oca/furada × tamanhos × escalas", () => {
    const variantes = [
      { rotulo: "sólida", extra: { oca: false, furos: null } },
      { rotulo: "oca", extra: { oca: true, furos: null } },
      {
        rotulo: "oca com furos",
        extra: { furos: { forma: "circulo" as const, quantidade: 6, tamanhoMm: 10 } },
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
              forma: "cilindro",
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
              const params = cilindroComBorda(sentido, pedido, dimensoes);
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
              esperarEstanque(gerarMalhaCilindro(params), nome);
            }
          }
        }
      }
    }
  });

  it("a borda muda a PLANTA do topo, nunca a altura nem o assentamento na mesa", () => {
    for (const oca of [false, true]) {
      const semBorda = grampearBloco({
        forma: "cilindro",
        tamanhoMm: 100,
        espessuraParedeMm: 2,
        oca,
      });
      const largura = semBorda.tamanhoMm * semBorda.escalaLargura;
      const altura = semBorda.tamanhoMm * semBorda.escalaAltura;

      const fora = cilindroComBorda("fora", 999, { oca });
      const arcoFora = arcoBorda(fora, altura);
      const caixaFora = caixaEnvolvente(gerarMalhaCilindro(fora));
      // "Fora" ALARGA a planta exatamente o offset do topo (aba de abajur).
      expect(caixaFora.maxX - caixaFora.minX, "fora alarga X").toBeCloseTo(
        largura + 2 * arcoFora.offsetTopoMm,
        2
      );
      expect(caixaFora.maxY - caixaFora.minY, "fora alarga Y").toBeCloseTo(
        largura + 2 * arcoFora.offsetTopoMm,
        2
      );
      expect(arcoFora.offsetTopoMm).toBeGreaterThan(0);
      expect(caixaFora.maxZ, "fora não mexe na altura").toBeCloseTo(altura, 3);
      expect(caixaFora.minZ, "fora: nada abaixo da mesa").toBeCloseTo(0, 5);

      const dentro = cilindroComBorda("dentro", 999, { oca });
      const caixaDentro = caixaEnvolvente(gerarMalhaCilindro(dentro));
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
      const params = cilindroComBorda(sentido, 999, { oca });
      const altura = params.tamanhoMm * params.escalaAltura;
      const arco = arcoBorda(params, altura);
      const inclinacao = inclinacaoMaximaNaFaixa(
        gerarMalhaCilindro(params),
        altura - arco.alturaMm
      );
      // Cada camada avança sobre o vazio no ângulo do arco — é o balanço.
      expect(inclinacao, rotulo).toBeLessThanOrEqual(TAN_F4 + 1e-6);
      expect(inclinacao, `${rotulo}: a faixa realmente encurva`).toBeGreaterThan(
        0.05
      );
    }

    // DENTRO + SÓLIDA é a exceção documentada em blocos/borda.ts: a faixa é
    // uma cúpula CONVERGENTE (o arco fecha até 90°, como o polo de uma
    // esfera). Cada camada assenta INTEIRA na de baixo, então não há
    // balanço a pagar — e a inclinação medida passa de F4 de propósito.
    const dentroSolida = cilindroComBorda("dentro", 999, { oca: false });
    const alturaSolida = dentroSolida.tamanhoMm * dentroSolida.escalaAltura;
    const arcoSolido = arcoBorda(dentroSolida, alturaSolida);
    const inclinacaoSolida = inclinacaoMaximaNaFaixa(
      gerarMalhaCilindro(dentroSolida),
      alturaSolida - arcoSolido.alturaMm
    );
    expect(inclinacaoSolida).toBeGreaterThan(TAN_F4);
  });

  it("o apoio conta a verdade sobre a malha com borda (A1)", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = cilindroComBorda(sentido, 999, { oca });
        const nome = `${sentido}/${oca ? "oca" : "sólida"}`;
        const malha = gerarMalhaCilindro(params);
        const caixa = caixaEnvolvente(malha);
        const aneis = aneisDaMalha(malha);
        const altura = params.tamanhoMm * params.escalaAltura;
        const arco = arcoBorda(params, altura);
        const zPe = altura - arco.alturaMm;

        // Topo: a altura e o raio do platô batem com a malha real.
        expect(apoioCilindro.alturaTopoMm(params), nome).toBeCloseTo(
          caixa.maxZ,
          3
        );
        const anelTopo = aneis[aneis.length - 1];
        expect(anelTopo.z, nome).toBeCloseTo(altura, 3);
        expect(
          apoioCilindro.raioApoioSuperiorMm(params),
          `${nome}: raio do topo`
        ).toBeCloseTo(anelTopo.raio, 2);
        // O sentido da borda decide se o platô cresce ou encolhe.
        const raioCorpo = (params.tamanhoMm * params.escalaLargura) / 2;
        if (sentido === "fora") {
          expect(anelTopo.raio, nome).toBeGreaterThan(raioCorpo);
        } else {
          expect(anelTopo.raio, nome).toBeLessThan(raioCorpo);
        }
        // A quina do raio do topo é raio NOTÁVEL (tangencia.ts amostra lá).
        const notaveis = apoioCilindro.raiosNotaveisMm!(params);
        expect(
          // tolerância folgada só pelo Float32 das posições da malha.
          notaveis.some((r) => Math.abs(r - anelTopo.raio) < 1e-3),
          `${nome}: raio do topo entre os notáveis`
        ).toBe(true);

        // Platô da fatia: o raio inscrito da seção numa cota da faixa bate
        // com a meia-largura medida na malha (tolerância de 1 célula).
        const naFaixa = aneis.filter((a) => a.z > zPe + 1e-6 && a.z < altura);
        expect(naFaixa.length, `${nome}: a faixa tem linhas de grade`).toBeGreaterThanOrEqual(
          4
        );
        const meio = naFaixa[Math.floor(naFaixa.length / 2)];
        expect(
          apoioCilindro.raioPlatoMm!(params, meio.z),
          `${nome}: platô na faixa`
        ).toBeCloseTo(meio.raio, 2);
        // Envelope idem: a silhueta da faixa é o arco.
        expect(
          apoioCilindro.raioEnvelopeMm(params, meio.z),
          `${nome}: envelope na faixa`
        ).toBeCloseTo(meio.raio, 2);
        expect(apoioCilindro.raioPlatoMm!(params, -1), nome).toBe(0);
        expect(apoioCilindro.raioPlatoMm!(params, altura + 1), nome).toBe(0);

        // Assentamento: dentro do platô do topo pousa em H; além do
        // envelope, não há superfície.
        expect(
          apoioCilindro.zSuperficieTopoMm(params, anelTopo.raio * 0.99),
          `${nome}: pousa no platô do topo`
        ).toBeCloseTo(altura, 3);
        expect(
          apoioCilindro.zSuperficieTopoMm(
            params,
            Math.max(anelTopo.raio, raioCorpo) + 1
          ),
          `${nome}: fora do envelope`
        ).toBeNull();
        if (sentido === "dentro") {
          // O lábio olha para cima: quem pousa entre o raio do topo e o do
          // corpo assenta na SUPERFÍCIE DO ARCO, na cota exata da malha.
          expect(
            apoioCilindro.zSuperficieTopoMm(params, meio.raio),
            `${nome}: pousa no arco`
          ).toBeCloseTo(meio.z, 1);
        }
        if (oca) {
          // Boca da casca: o que passa pela cavidade inteira cai no piso.
          const zPiso = Math.min(params.espessuraParedeMm, altura / 3);
          // A boca mais estreita da cavidade na malha real (com a borda
          // para dentro é o topo; para fora, o pé da parede).
          const raioBoca = Math.min(
            ...aneis
              .filter((a) => a.z > zPiso + 1e-6)
              .map((a) => a.raioInterno)
          );
          expect(
            apoioCilindro.zSuperficieTopoMm(params, raioBoca * 0.9),
            `${nome}: cai na boca até o piso`
          ).toBeCloseTo(zPiso, 3);
          if (sentido === "fora") {
            // Com a boca ABRINDO, a parede interna do arco é uma rampa que
            // sobe: quem não passa pela boca de baixo pousa NELA, na cota
            // que a malha mostra.
            expect(
              apoioCilindro.zSuperficieTopoMm(params, meio.raioInterno),
              `${nome}: pousa na parede interna do arco`
            ).toBeCloseTo(meio.z, 1);
          }
        }
      }
    }
  });

  it("cinto de segurança: offset que comeria o raio inteiro trunca, sem erro", () => {
    // Fora do contrato de propósito (gerarMalha recebe params grampeados):
    // um raio de arco absurdo para DENTRO comeria o raio/a parede inteiros.
    // O gerador trunca o offset no material que sobra — clamp geométrico,
    // nunca erro, nunca malha degenerada.
    for (const oca of [false, true]) {
      const params: ParametrosBloco = {
        ...grampearBloco({
          forma: "cilindro",
          tamanhoMm: 40,
          escalaLargura: 0.5,
          espessuraParedeMm: 2,
          oca,
        }),
        bordaTopo: { sentido: "dentro", tamanhoMm: 400 },
      };
      const malha = gerarMalhaCilindro(params);
      const nome = `absurdo/${oca ? "oca" : "sólida"}`;
      esperarEstanque(malha, nome);
      const aneis = aneisDaMalha(malha);
      // Sobra material: nem o raio do topo nem a boca colapsam no eixo.
      expect(aneis[aneis.length - 1].raioInterno, nome).toBeGreaterThan(0.5);
      // E o apoio continua contando a mesma verdade da malha.
      expect(apoioCilindro.raioApoioSuperiorMm(params), nome).toBeCloseTo(
        aneis[aneis.length - 1].raio,
        2
      );
    }
  });

  it("dentro desloca menos material que sem borda; fora desloca mais", () => {
    const semBorda = grampearBloco({
      forma: "cilindro",
      tamanhoMm: 100,
      oca: false,
    });
    const volumeSem = volumeAssinadoMm3(gerarMalhaCilindro(semBorda));
    const volumeFora = volumeAssinadoMm3(
      gerarMalhaCilindro(cilindroComBorda("fora", 999, { oca: false }))
    );
    const volumeDentro = volumeAssinadoMm3(
      gerarMalhaCilindro(cilindroComBorda("dentro", 999, { oca: false }))
    );
    expect(volumeFora).toBeGreaterThan(volumeSem);
    expect(volumeDentro).toBeLessThan(volumeSem);
    expect(volumeDentro).toBeGreaterThan(0);
  });
});

/* ---------------------------------------------------------------------
 * BORDA DE FUNDO (item 2 do plano, 07/08) — a mesma borda encurvada, na
 * OUTRA extremidade e independente da do topo: para FORA abre como pé de
 * cálice, para DENTRO recolhe como barriga. O que estes testes protegem:
 * estanqueidade nos dois sentidos × sólida/oca/furada × piso/meio/teto do
 * slider (posicao "fundo"), coexistência com a borda do TOPO, o F4 medido
 * NA MALHA (a regra INVERTE em relação ao topo — ver blocos/borda.ts), a
 * caixa envolvente ("fora" alarga a PLANTA DA BASE) e o apoio dizendo a
 * verdade sobre a malha real (A1): superfície inferior, raio da base e
 * raioPlatoMm em z = 0 — é ele que a regra de base estável lê.
 * ------------------------------------------------------------------- */

/** Miolo comum: params grampeados de um cilindro com borda de FUNDO. */
function cilindroComBordaFundo(
  sentido: SentidoBorda,
  tamanhoBordaMm: number,
  extra: Record<string, unknown> = {}
): ParametrosBloco {
  return grampearBloco({
    forma: "cilindro",
    tamanhoMm: 100,
    espessuraParedeMm: 2,
    ...extra,
    bordaFundo: { sentido, tamanhoMm: tamanhoBordaMm },
  });
}

/** Maior |Δr|/Δz entre anéis consecutivos DENTRO da faixa do FUNDO. */
function inclinacaoMaximaNoFundo(
  malha: MalhaBloco,
  zTetoFaixaMm: number
): number {
  const aneis = aneisDaMalha(malha).filter((a) => a.z <= zTetoFaixaMm + 1e-6);
  let pior = 0;
  for (let i = 1; i < aneis.length; i++) {
    const dz = aneis[i].z - aneis[i - 1].z;
    if (dz <= 1e-9) continue;
    pior = Math.max(pior, Math.abs(aneis[i].raio - aneis[i - 1].raio) / dz);
  }
  return pior;
}

describe("cilindro — borda de fundo", () => {
  it("estanque nos dois sentidos × sólida/oca/furada × piso/meio/teto do slider", () => {
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
        const semBorda = grampearBloco({
          forma: "cilindro",
          tamanhoMm: 100,
          espessuraParedeMm: 2,
          ...extra,
        });
        const teto = tetoBordaMm(semBorda, sentido, "fundo");
        expect(teto, `${sentido}/${rotulo}: teto existe`).toBeGreaterThan(0);
        const pedidos = [
          LIMITES_BLOCO.bordaTamanhoMm.min,
          (LIMITES_BLOCO.bordaTamanhoMm.min + teto) / 2,
          999,
        ];
        for (const pedido of pedidos) {
          const params = cilindroComBordaFundo(sentido, pedido, extra);
          const nome = `fundo ${sentido}/${rotulo}/borda ${pedido}`;
          // Clamp geométrico: o slider encosta no teto, nunca erra.
          expect(params.bordaFundo, nome).not.toBeNull();
          expect(params.bordaFundo!.tamanhoMm, nome).toBeLessThanOrEqual(
            teto + 1e-9
          );
          if (pedido === 999) {
            expect(params.bordaFundo!.tamanhoMm, nome).toBeCloseTo(teto, 6);
          }
          esperarEstanque(gerarMalhaCilindro(params), nome);
        }
      }
    }
  });

  it("coexiste com a borda do TOPO: as quatro combinações de sentidos, sólida/oca/furada", () => {
    for (const sentidoTopo of ["fora", "dentro"] as const) {
      for (const sentidoFundo of ["fora", "dentro"] as const) {
        for (const extra of [
          { oca: false, furos: null },
          { oca: true, furos: null },
          {
            furos: {
              forma: "quadrado" as const,
              quantidade: 4,
              tamanhoMm: 10,
            },
          },
        ]) {
          const params = grampearBloco({
            forma: "cilindro",
            tamanhoMm: 100,
            espessuraParedeMm: 2,
            ...extra,
            bordaTopo: { sentido: sentidoTopo, tamanhoMm: 999 },
            bordaFundo: { sentido: sentidoFundo, tamanhoMm: 999 },
          });
          const nome = `topo ${sentidoTopo} + fundo ${sentidoFundo}${
            params.furos ? "/furada" : params.oca ? "/oca" : "/sólida"
          }`;
          expect(params.bordaTopo, nome).not.toBeNull();
          expect(params.bordaFundo, nome).not.toBeNull();
          const altura = params.tamanhoMm * params.escalaAltura;
          const arcoTopo = arcoBorda(params, altura, "topo");
          const arcoFundo = arcoBorda(params, altura, "fundo");
          // As duas faixas juntas ≤ 2/3 da altura: sobra lateral reta.
          expect(
            arcoTopo.alturaMm + arcoFundo.alturaMm,
            `${nome}: sobra lateral reta`
          ).toBeLessThanOrEqual((2 * altura) / 3 + 1e-6);
          const malha = gerarMalhaCilindro(params);
          esperarEstanque(malha, nome);
          // Com furos: a banda sobreviveu ENTRE as duas faixas.
          if (extra.furos) expect(params.furos, nome).not.toBeNull();
          // Extremidades reais: topo no raio do topo, base no raio da base.
          const aneis = aneisDaMalha(malha);
          expect(
            apoioCilindro.raioApoioInferiorMm(params),
            `${nome}: raio da base`
          ).toBeCloseTo(aneis[0].raio, 2);
          expect(
            apoioCilindro.raioApoioSuperiorMm(params),
            `${nome}: raio do topo`
          ).toBeCloseTo(aneis[aneis.length - 1].raio, 2);
          expect(apoioCilindro.alturaTopoMm(params), nome).toBeCloseTo(
            altura,
            3
          );
        }
      }
    }
  });

  it("F4 medido na malha na faixa do fundo — a regra INVERTE em relação ao topo", () => {
    // No fundo quem CONVERGE SUBINDO é o sentido FORA (pé de cálice: cada
    // camada assenta inteira na de baixo) — a SÓLIDA pra fora é LIVRE.
    // Pra DENTRO a peça DIVERGE subindo (barriga em balanço) e paga F4;
    // a OCA paga sempre (uma das paredes paira sobre a cavidade).
    const pagamF4 = [
      { rotulo: "dentro sólida", sentido: "dentro" as const, oca: false },
      { rotulo: "dentro oca", sentido: "dentro" as const, oca: true },
      { rotulo: "fora oca", sentido: "fora" as const, oca: true },
    ];
    for (const { rotulo, sentido, oca } of pagamF4) {
      const params = cilindroComBordaFundo(sentido, 999, { oca });
      const altura = params.tamanhoMm * params.escalaAltura;
      const arco = arcoBorda(params, altura, "fundo");
      const inclinacao = inclinacaoMaximaNoFundo(
        gerarMalhaCilindro(params),
        arco.alturaMm
      );
      expect(inclinacao, rotulo).toBeLessThanOrEqual(TAN_F4 + 1e-6);
      expect(inclinacao, `${rotulo}: a faixa realmente encurva`).toBeGreaterThan(
        0.05
      );
    }

    // FORA + SÓLIDA é a exceção documentada em blocos/borda.ts: é uma
    // cúpula convergente DE CABEÇA PARA BAIXO — convergente na direção da
    // impressão (cada camada assenta inteira na de baixo), então o arco
    // fecha até 90° e a inclinação medida passa de F4 de propósito.
    const foraSolida = cilindroComBordaFundo("fora", 999, { oca: false });
    const alturaSolida = foraSolida.tamanhoMm * foraSolida.escalaAltura;
    const arcoSolido = arcoBorda(foraSolida, alturaSolida, "fundo");
    const inclinacaoSolida = inclinacaoMaximaNoFundo(
      gerarMalhaCilindro(foraSolida),
      arcoSolido.alturaMm
    );
    expect(inclinacaoSolida).toBeGreaterThan(TAN_F4);
  });

  it("fora ALARGA a planta na base; dentro mantém — altura e mesa intactas", () => {
    for (const oca of [false, true]) {
      const semBorda = grampearBloco({
        forma: "cilindro",
        tamanhoMm: 100,
        espessuraParedeMm: 2,
        oca,
      });
      const largura = semBorda.tamanhoMm * semBorda.escalaLargura;
      const altura = semBorda.tamanhoMm * semBorda.escalaAltura;

      const fora = cilindroComBordaFundo("fora", 999, { oca });
      const arcoFora = arcoBorda(fora, altura, "fundo");
      const caixaFora = caixaEnvolvente(gerarMalhaCilindro(fora));
      // "Fora" ALARGA a planta exatamente o offset da BASE (pé de cálice).
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

      const dentro = cilindroComBordaFundo("dentro", 999, { oca });
      const caixaDentro = caixaEnvolvente(gerarMalhaCilindro(dentro));
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

  it("o apoio conta a verdade sobre a malha com borda de fundo (A1)", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = cilindroComBordaFundo(sentido, 999, { oca });
        const nome = `fundo ${sentido}/${oca ? "oca" : "sólida"}`;
        const malha = gerarMalhaCilindro(params);
        const caixa = caixaEnvolvente(malha);
        const aneis = aneisDaMalha(malha);
        const altura = params.tamanhoMm * params.escalaAltura;
        const raioCorpo = (params.tamanhoMm * params.escalaLargura) / 2;
        const arco = arcoBorda(params, altura, "fundo");

        // A borda nunca muda a altura nem tira a peça da mesa.
        expect(apoioCilindro.alturaTopoMm(params), nome).toBeCloseTo(
          caixa.maxZ,
          3
        );
        expect(caixa.minZ, nome).toBeCloseTo(0, 5);

        // Base REAL: o anel de z = 0 é o raio deslocado — e é o que
        // raioApoioInferiorMm e raioPlatoMm(p, 0) respondem (é o
        // raioPlatoMm que a regra de base estável lê para reagir sozinha
        // ao fundo recolhido).
        const anelBase = aneis[0];
        expect(anelBase.z, nome).toBeCloseTo(0, 5);
        expect(
          apoioCilindro.raioApoioInferiorMm(params),
          `${nome}: raio da base`
        ).toBeCloseTo(anelBase.raio, 2);
        expect(
          apoioCilindro.raioPlatoMm!(params, 0),
          `${nome}: platô em z = 0`
        ).toBeCloseTo(anelBase.raio, 2);
        if (sentido === "fora") {
          expect(anelBase.raio, nome).toBeGreaterThan(raioCorpo);
        } else {
          expect(anelBase.raio, nome).toBeLessThan(raioCorpo);
        }

        // Na faixa: envelope e platô batem com os anéis da malha.
        const naFaixa = aneis.filter(
          (a) => a.z > 1e-6 && a.z < arco.alturaMm - 1e-6
        );
        expect(
          naFaixa.length,
          `${nome}: a faixa tem linhas de grade`
        ).toBeGreaterThanOrEqual(4);
        const meio = naFaixa[Math.floor(naFaixa.length / 2)];
        expect(
          apoioCilindro.raioEnvelopeMm(params, meio.z),
          `${nome}: envelope na faixa`
        ).toBeCloseTo(meio.raio, 2);
        expect(
          apoioCilindro.raioPlatoMm!(params, meio.z),
          `${nome}: platô na faixa`
        ).toBeCloseTo(meio.raio, 2);

        // Superfície INFERIOR: a tampa é plana em z = 0 até o raio da base…
        expect(
          apoioCilindro.zSuperficieBaseMm(params, anelBase.raio * 0.99),
          `${nome}: tampa plana`
        ).toBeCloseTo(0, 5);
        if (sentido === "fora") {
          // …e com pé de cálice a base ALARGOU: embaixo é tampa até o raio
          // da base; o arco viceja ACIMA dela — a superfície de CIMA entre
          // o corpo e a base é o arco, na cota exata da malha.
          expect(
            apoioCilindro.zSuperficieBaseMm(params, meio.raio),
            `${nome}: embaixo da aba é tampa`
          ).toBeCloseTo(0, 5);
          expect(
            apoioCilindro.zSuperficieTopoMm(params, meio.raio),
            `${nome}: em cima da aba é o arco`
          ).toBeCloseTo(meio.z, 1);
          expect(
            apoioCilindro.zSuperficieBaseMm(params, anelBase.raio + 1),
            `${nome}: fora do envelope`
          ).toBeNull();
          // As duas quinas do pé (corpo e base) são raios NOTÁVEIS.
          const notaveis = apoioCilindro.raiosNotaveisMm!(params);
          expect(
            notaveis.some((r) => Math.abs(r - anelBase.raio) < 1e-3),
            `${nome}: raio da base entre os notáveis`
          ).toBe(true);
          expect(
            notaveis.some((r) => Math.abs(r - raioCorpo) < 1e-3),
            `${nome}: quina do corpo entre os notáveis`
          ).toBe(true);
        } else {
          // Barriga recolhida: entre a base (menor) e o corpo a superfície
          // de BAIXO é o arco (ela olha para baixo), na cota da malha.
          expect(
            apoioCilindro.zSuperficieBaseMm(params, meio.raio),
            `${nome}: embaixo da barriga é o arco`
          ).toBeCloseTo(meio.z, 1);
          expect(
            apoioCilindro.zSuperficieBaseMm(params, raioCorpo + 1),
            `${nome}: fora do envelope`
          ).toBeNull();
        }
      }
    }
  });

  it("fundo pra dentro na oca: o piso da cavidade sai no raio deslocado e o funil assenta certo", () => {
    const params = cilindroComBordaFundo("dentro", 999, { oca: true });
    const altura = params.tamanhoMm * params.escalaAltura;
    const largura = params.tamanhoMm * params.escalaLargura;
    const arco = arcoBorda(params, altura, "fundo");
    const zPiso = Math.min(params.espessuraParedeMm, altura / 3);
    // O caso interessante: a faixa do fundo PASSA do piso da cavidade.
    expect(arco.alturaMm).toBeGreaterThan(zPiso);

    const malha = gerarMalhaCilindro(params);
    esperarEstanque(malha, "fundo dentro oca");
    const aneis = aneisDaMalha(malha);
    const raioInterno = largura / 2 - params.espessuraParedeMm;
    const raioBocaPiso = raioInterno + arco.offsetEmMm(zPiso);
    expect(raioBocaPiso).toBeLessThan(raioInterno);

    // O anel do piso NA MALHA vive no raio deslocado dessa cota.
    const anelPiso = aneis.find((a) => Math.abs(a.z - zPiso) < 1e-4);
    expect(anelPiso, "existe anel no piso").toBeDefined();
    expect(anelPiso!.raioInterno, "piso deslocado").toBeCloseTo(
      raioBocaPiso,
      2
    );

    // Quem passa pelo GARGALO cai no piso; quem passa só pela boca pousa
    // no FUNIL do arco — na cota que a própria malha mostra.
    expect(
      apoioCilindro.zSuperficieTopoMm(params, raioBocaPiso * 0.9),
      "cai até o piso"
    ).toBeCloseTo(zPiso, 3);
    const dFunil = (raioBocaPiso + raioInterno) / 2;
    const zFunil = apoioCilindro.zSuperficieTopoMm(params, dFunil);
    expect(zFunil, "pousa no funil").not.toBeNull();
    expect(zFunil!).toBeGreaterThan(zPiso);
    expect(zFunil!).toBeLessThanOrEqual(arco.alturaMm + 1e-6);
    // A cota é a do próprio arco: o raio interno da malha nela bate com d.
    expect(raioInterno + arco.offsetEmMm(zFunil!)).toBeCloseTo(dFunil, 2);

    // O gargalo é um raio NOTÁVEL (degrau piso → funil).
    const notaveis = apoioCilindro.raiosNotaveisMm!(params);
    expect(notaveis.some((r) => Math.abs(r - raioBocaPiso) < 1e-6)).toBe(true);
  });

  it("fundo pra fora desloca mais material que sem borda; pra dentro menos", () => {
    const semBorda = grampearBloco({
      forma: "cilindro",
      tamanhoMm: 100,
      oca: false,
    });
    const volumeSem = volumeAssinadoMm3(gerarMalhaCilindro(semBorda));
    const volumeFora = volumeAssinadoMm3(
      gerarMalhaCilindro(cilindroComBordaFundo("fora", 999, { oca: false }))
    );
    const volumeDentro = volumeAssinadoMm3(
      gerarMalhaCilindro(cilindroComBordaFundo("dentro", 999, { oca: false }))
    );
    expect(volumeFora).toBeGreaterThan(volumeSem);
    expect(volumeDentro).toBeLessThan(volumeSem);
    expect(volumeDentro).toBeGreaterThan(0);
  });

  it("grampear com borda de fundo continua idempotente", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = cilindroComBordaFundo(sentido, 999, { oca });
        expect(grampearBloco(params)).toEqual(params);
        expect(params.bordaFundo!.tamanhoMm).toBeCloseTo(
          tetoBordaMm(params, sentido, "fundo"),
          6
        );
      }
    }
  });
});
