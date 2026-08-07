/**
 * Montagem v2 · F1 — PIRÂMIDE: contrato de teste da espec aplicado ao
 * primitivo. Estanqueidade de TODAS as variações (verificarEstanque +
 * volume assinado positivo), clamps idempotentes (incluindo o piso de
 * altura próprio da oca — F4 no teto da cavidade) e furos que preservam
 * parede — sem tocar em nenhum teste existente.
 */

import { describe, expect, it } from "vitest";
import {
  BALANCO_MAXIMO_BLOCO_GRAUS,
  FURO_PONTE_MAX_MM,
  LIMITES_BLOCO,
  PAREDE_MINIMA_BLOCO_MM,
  VARIACOES_BLOCO,
  apoioPiramide,
  arcoBorda,
  blocoDaVariacao,
  bordaTamanhoMaxMm,
  escalaAlturaMinimaPiramideOca,
  furoMaximoMm,
  gerarMalhaPiramide,
  grampearBloco,
  primitivoPiramide,
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

/** Miolo comum: params grampeados de uma pirâmide com borda encurvada. */
function piramideComBorda(
  sentido: SentidoBorda,
  tamanhoBordaMm: number,
  extra: Record<string, unknown> = {}
): ParametrosBloco {
  return grampearBloco({
    forma: "piramide",
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
 * (max(|x|, |y|) do vértice mais afastado). Planta quadrada: todo vértice do
 * perímetro tem max(|x|, |y|) = meia-largura da seção. ATENÇÃO: na pirâmide
 * OCA a casca da cavidade tem linhas z PRÓPRIAS (rampa própria), então uma
 * cota pode ser só da cavidade — daí o teste de silhueta usar a maciça, e o
 * da oca cobrar só o que vale nas duas (nada passa do envelope declarado).
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

const TAN_F4 = Math.tan((BALANCO_MAXIMO_BLOCO_GRAUS * Math.PI) / 180);

/**
 * Folga numérica do balanço medido na malha: as posições são Float32 e a
 * cavidade nasce de uma silhueta paralela amostrada, então uma pirâmide que
 * o grampeador coloca EXATAMENTE em F4 (escalaAlturaMinimaPiramideOca) mede
 * 45,00x° em vez de 45°. 1e-3 em tangente = 0,03°.
 */
const FOLGA_TAN = 1e-3;

/**
 * BALANÇO máximo (tangente do ângulo da vertical) das superfícies que olham
 * PARA BAIXO dentro da faixa da borda, e o VÃO das que passam de F4.
 *
 * Na pirâmide o balanço se mede pela NORMAL, não por |Δr|/Δz entre anéis
 * como no cubo/cilindro: (a) as faces já convergem, então |Δr|/Δz somaria a
 * rampa da pirâmide ao arco; (b) uma superfície CONVERGENTE nunca é balanço
 * (cada camada assenta inteira na de baixo); (c) as duas cascas da oca têm
 * linhas z próprias, e agrupar por cota misturaria as duas. Para qualquer
 * face virada para baixo, balanço = asin(|n_z|) — e a normal também pega o
 * TETO DA CAVIDADE, que é justamente quem paga F4 na borda para dentro.
 * Quem passa de F4 é PONTE (apoiada nas duas pontas) e vale pelo VÃO: num
 * platô quadrado a camada atravessa o LADO (não a diagonal).
 */
function balancoNaFaixa(
  malha: MalhaBloco,
  zPeMm: number
): { tanMax: number; vaoPonteMm: number; facesParaBaixo: number } {
  const p = malha.posicoes;
  let tanMax = 0;
  let vaoPonteMm = 0;
  let facesParaBaixo = 0;
  for (let t = 0; t < malha.indices.length; t += 3) {
    const a = malha.indices[t] * 3;
    const b = malha.indices[t + 1] * 3;
    const c = malha.indices[t + 2] * 3;
    if ((p[a + 2] + p[b + 2] + p[c + 2]) / 3 < zPeMm - 1e-6) continue;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a];
    const vy = p[c + 1] - p[a + 1];
    const vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const norma = Math.hypot(nx, ny, nz);
    if (norma <= 1e-12) continue;
    const cosZ = nz / norma;
    if (cosZ >= -1e-6) continue; // olha para cima ou é parede vertical
    facesParaBaixo++;
    const tan =
      cosZ <= -1 + 1e-12
        ? Infinity
        : Math.abs(cosZ) / Math.sqrt(1 - cosZ * cosZ);
    if (tan > TAN_F4 + FOLGA_TAN) {
      const lado = Math.max(
        Math.abs(p[a]),
        Math.abs(p[a + 1]),
        Math.abs(p[b]),
        Math.abs(p[b + 1]),
        Math.abs(p[c]),
        Math.abs(p[c + 1])
      );
      vaoPonteMm = Math.max(vaoPonteMm, 2 * lado);
      continue;
    }
    tanMax = Math.max(tanMax, tan);
  }
  return { tanMax, vaoPonteMm, facesParaBaixo };
}

describe("pirâmide — borda encurvada", () => {
  it("estanque nos dois sentidos × sólida/oca/furada × tamanhos × escalas", () => {
    const variantes = [
      { rotulo: "sólida", extra: { oca: false, furos: null } },
      { rotulo: "oca", extra: { oca: true, furos: null } },
      {
        rotulo: "oca com furos",
        extra: {
          furos: { forma: "circulo" as const, quantidade: 4, tamanhoMm: 10 },
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
              forma: "piramide",
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
              const params = piramideComBorda(sentido, pedido, dimensoes);
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
                expect(params.bordaTopo, nome).toBeNull();
              }
              esperarEstanque(gerarMalhaPiramide(params), nome);
            }
          }
        }
      }
    }
    // 162 malhas com a verificação de estanqueidade aresta por aresta:
    // passa dos 5 s padrão do vitest.
  }, 60000);

  it("a borda alarga o TOPO (pináculo), nunca a caixa nem a altura", () => {
    for (const oca of [false, true]) {
      const semBorda = grampearBloco({
        forma: "piramide",
        tamanhoMm: 100,
        espessuraParedeMm: 2,
        oca,
      });
      const largura = semBorda.tamanhoMm * semBorda.escalaLargura;
      const altura = semBorda.tamanhoMm * semBorda.escalaAltura;
      // O ápice da pirâmide sem borda é um PONTO: nada de platô.
      expect(apoioPiramide.raioApoioSuperiorMm(semBorda)).toBe(0);

      for (const sentido of ["fora", "dentro"] as const) {
        const params = piramideComBorda(sentido, 999, { oca });
        const nome = `${sentido}/${oca ? "oca" : "maciça"}`;
        const caixa = caixaEnvolvente(gerarMalhaPiramide(params));
        // A seção MAIS LARGA da pirâmide é sempre a base: o alargamento da
        // aba é local no topo (offsetTopo ≤ largura/4, e a rampa já comeu
        // pelo menos 2/3 dela) — a caixa envolvente não muda em NENHUM dos
        // dois sentidos. É a diferença em relação ao cubo/cilindro, onde a
        // aba cresce para fora da caixa.
        expect(caixa.maxX - caixa.minX, `${nome}: X é o da base`).toBeCloseTo(
          largura,
          1
        );
        expect(caixa.maxY - caixa.minY, `${nome}: Y é o da base`).toBeCloseTo(
          largura,
          1
        );
        expect(caixa.maxZ, `${nome}: a altura não muda`).toBeCloseTo(altura, 3);
        expect(caixa.minZ, `${nome}: nada abaixo da mesa`).toBeCloseTo(0, 5);
      }

      // "Fora": o ápice virou PLATÔ de meia-largura = offset do topo.
      const fora = piramideComBorda("fora", 999, { oca });
      const arcoFora = arcoBorda(fora, altura);
      expect(arcoFora.offsetTopoMm).toBeGreaterThan(0);
      expect(apoioPiramide.raioApoioSuperiorMm(fora)).toBeCloseTo(
        arcoFora.offsetTopoMm,
        6
      );
      // "Dentro": o lábio afina a ponta, mas ela continua fechando no ápice.
      const dentro = piramideComBorda("dentro", 999, { oca });
      expect(apoioPiramide.raioApoioSuperiorMm(dentro)).toBe(0);
      const alturaMeia = altura / 2;
      expect(
        apoioPiramide.raioPlatoMm!(dentro, altura - 1),
        "o lábio encolhe a seção perto do topo"
      ).toBeLessThan(apoioPiramide.raioPlatoMm!(semBorda, altura - 1));
      expect(
        apoioPiramide.raioPlatoMm!(dentro, alturaMeia),
        "abaixo da faixa a rampa é a mesma"
      ).toBeCloseTo(apoioPiramide.raioPlatoMm!(semBorda, alturaMeia), 6);
    }
  });

  it("a faixa da borda respeita o balanço F4 (fora sempre; dentro quando oca)", () => {
    const casos = [
      { rotulo: "fora maciça", sentido: "fora" as const, oca: false },
      { rotulo: "fora oca", sentido: "fora" as const, oca: true },
      { rotulo: "dentro oca", sentido: "dentro" as const, oca: true },
    ];
    for (const { rotulo, sentido, oca } of casos) {
      const params = piramideComBorda(sentido, 999, { oca });
      const altura = params.tamanhoMm * params.escalaAltura;
      const arco = arcoBorda(params, altura);
      const medida = balancoNaFaixa(
        gerarMalhaPiramide(params),
        altura - arco.alturaMm
      );
      expect(medida.tanMax, rotulo).toBeLessThanOrEqual(TAN_F4 + FOLGA_TAN);
      // O único teto plano tolerado é o da cavidade quando a aba a mantém
      // viva até a tampa: é PONTE (apoiada nas duas pontas), e cabe no teto
      // de ponte declarado para o FDM (⚑ FURO_PONTE_MAX_MM).
      expect(medida.vaoPonteMm, `${rotulo}: vão de ponte`).toBeLessThanOrEqual(
        FURO_PONTE_MAX_MM
      );
    }

    // DENTRO + MACIÇA é a exceção documentada em blocos/borda.ts: o arco
    // fecha até 90° porque a faixa é uma cúpula CONVERGENTE (como o polo de
    // uma esfera) e cada camada assenta INTEIRA na de baixo. Na pirâmide
    // isso é ainda mais claro: a faixa não tem UMA face virada para baixo.
    const dentroMacica = piramideComBorda("dentro", 999, { oca: false });
    const alturaMacica = dentroMacica.tamanhoMm * dentroMacica.escalaAltura;
    const arcoMacico = arcoBorda(dentroMacica, alturaMacica);
    const medidaMacica = balancoNaFaixa(
      gerarMalhaPiramide(dentroMacica),
      alturaMacica - arcoMacico.alturaMm
    );
    expect(medidaMacica.facesParaBaixo).toBe(0);
  });

  it("o apoio conta a verdade sobre a malha com borda (A1)", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = piramideComBorda(sentido, 999, { oca });
        const nome = `${sentido}/${oca ? "oca" : "maciça"}`;
        const malha = gerarMalhaPiramide(params);
        const caixa = caixaEnvolvente(malha);
        const aneis = aneisDaMalha(malha);
        const altura = params.tamanhoMm * params.escalaAltura;
        const arco = arcoBorda(params, altura);
        const zPe = altura - arco.alturaMm;

        expect(apoioPiramide.alturaTopoMm(params), nome).toBeCloseTo(
          caixa.maxZ,
          3
        );
        const anelTopo = aneis[aneis.length - 1];
        expect(anelTopo.z, nome).toBeCloseTo(altura, 3);
        // O platô do topo declarado é o medido na malha (0 = ápice ponto).
        expect(
          apoioPiramide.raioApoioSuperiorMm(params),
          `${nome}: platô do topo`
        ).toBeCloseTo(sentido === "fora" ? anelTopo.meia : 0, 2);

        // Envelope honesto: NENHUMA seção da malha passa do platô declarado
        // (vale para as duas cascas — a da cavidade é sempre menor).
        for (const anel of aneis) {
          expect(
            anel.meia,
            `${nome}: seção em z=${anel.z.toFixed(2)} dentro do envelope`
          ).toBeLessThanOrEqual(apoioPiramide.raioPlatoMm!(params, anel.z) + 0.2);
        }
        expect(apoioPiramide.raioPlatoMm!(params, -1), nome).toBe(0);
        expect(apoioPiramide.raioPlatoMm!(params, altura + 1), nome).toBe(0);

        const naFaixa = aneis.filter((a) => a.z > zPe + 1e-6 && a.z < altura);
        expect(
          naFaixa.length,
          `${nome}: a faixa tem linhas de grade próprias`
        ).toBeGreaterThanOrEqual(4);
        const meio = naFaixa[Math.floor(naFaixa.length / 2)];
        if (!oca) {
          // Maciça: uma casca só, então a meia-largura medida na cota é a da
          // silhueta — o platô da fatia bate com ela (tolerância de 1 célula).
          expect(
            apoioPiramide.raioPlatoMm!(params, meio.z),
            `${nome}: platô na faixa`
          ).toBeCloseTo(meio.meia, 2);
          expect(
            apoioPiramide.raioEnvelopeMm(params, meio.z),
            `${nome}: envelope na faixa`
          ).toBeCloseTo(meio.meia * Math.SQRT2, 2);
        }

        // Assentamento: no platô/ápice pousa em H; fora do envelope da base
        // não há superfície.
        expect(
          apoioPiramide.zSuperficieTopoMm(params, 0),
          `${nome}: pousa no topo`
        ).toBeCloseTo(altura, 3);
        expect(
          apoioPiramide.zSuperficieTopoMm(
            params,
            (params.tamanhoMm * params.escalaLargura) / 2 + 1
          ),
          `${nome}: fora do envelope`
        ).toBeNull();
        // Na faixa, quem pousa no raio de um anel assenta na SUPERFÍCIE dele
        // — nunca mais alto que o material real (A1). Para "fora" a silhueta
        // BULE: o pouso legítimo pode ser mais alto (o ramo de cima da aba),
        // nunca acima do topo.
        const zPouso = apoioPiramide.zSuperficieTopoMm(params, meio.meia);
        expect(zPouso, `${nome}: pouso na faixa`).not.toBeNull();
        if (sentido === "dentro") {
          expect(zPouso!, `${nome}: pousa no lábio`).toBeCloseTo(meio.z, 1);
        } else {
          expect(zPouso!, `${nome}: pousa na aba`).toBeGreaterThanOrEqual(
            meio.z - 0.5
          );
          expect(zPouso!, `${nome}: nunca acima do topo`).toBeLessThanOrEqual(
            altura + 1e-6
          );
        }
      }
    }
  });

  it("dentro desloca menos material que sem borda; fora desloca mais", () => {
    const semBorda = grampearBloco({
      forma: "piramide",
      tamanhoMm: 100,
      oca: false,
    });
    const volumeSem = volumeAssinadoMm3(gerarMalhaPiramide(semBorda));
    const volumeFora = volumeAssinadoMm3(
      gerarMalhaPiramide(piramideComBorda("fora", 999, { oca: false }))
    );
    const volumeDentro = volumeAssinadoMm3(
      gerarMalhaPiramide(piramideComBorda("dentro", 999, { oca: false }))
    );
    expect(volumeFora).toBeGreaterThan(volumeSem);
    expect(volumeDentro).toBeLessThan(volumeSem);
    expect(volumeDentro).toBeGreaterThan(0);
  });
});

/** Miolo comum: params grampeados de uma pirâmide com borda de FUNDO. */
function piramideComBordaFundo(
  sentido: SentidoBorda,
  tamanhoBordaMm: number,
  extra: Record<string, unknown> = {}
): ParametrosBloco {
  return grampearBloco({
    forma: "piramide",
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

/**
 * BALANÇO na faixa do FUNDO — a mesma medida por NORMAL de balancoNaFaixa,
 * olhando o PÉ da peça: só triângulos com centro abaixo de zTetoMm.
 * Superfícies HORIZONTAIS viradas para baixo em cota ≤ zApoioMm não são
 * balanço nenhum: são a TAMPA da base (assenta na mesa) e o PISO da
 * cavidade (assenta no maciço de baixo — abaixo do piso a casca é sólida
 * até a mesa) — ficam fora da medida.
 */
function balancoNaFaixaFundo(
  malha: MalhaBloco,
  zTetoMm: number,
  zApoioMm: number
): { tanMax: number; vaoPonteMm: number; facesParaBaixo: number } {
  const p = malha.posicoes;
  let tanMax = 0;
  let vaoPonteMm = 0;
  let facesParaBaixo = 0;
  for (let t = 0; t < malha.indices.length; t += 3) {
    const a = malha.indices[t] * 3;
    const b = malha.indices[t + 1] * 3;
    const c = malha.indices[t + 2] * 3;
    const zCentro = (p[a + 2] + p[b + 2] + p[c + 2]) / 3;
    if (zCentro > zTetoMm + 1e-6) continue;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a];
    const vy = p[c + 1] - p[a + 1];
    const vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const norma = Math.hypot(nx, ny, nz);
    if (norma <= 1e-12) continue;
    const cosZ = nz / norma;
    if (cosZ >= -1e-6) continue; // olha para cima ou é parede vertical
    // Tampa da base e piso da cavidade: planos apoiados, não balanço.
    if (cosZ < -0.9999 && zCentro <= zApoioMm + 1e-6) continue;
    facesParaBaixo++;
    const tan =
      cosZ <= -1 + 1e-12
        ? Infinity
        : Math.abs(cosZ) / Math.sqrt(1 - cosZ * cosZ);
    if (tan > TAN_F4 + FOLGA_TAN) {
      const lado = Math.max(
        Math.abs(p[a]),
        Math.abs(p[a + 1]),
        Math.abs(p[b]),
        Math.abs(p[b + 1]),
        Math.abs(p[c]),
        Math.abs(p[c + 1])
      );
      vaoPonteMm = Math.max(vaoPonteMm, 2 * lado);
      continue;
    }
    tanMax = Math.max(tanMax, tan);
  }
  return { tanMax, vaoPonteMm, facesParaBaixo };
}

describe("pirâmide — borda de fundo", () => {
  it("estanque nos dois sentidos × sólida/oca/furada × tamanhos × escalas", () => {
    const variantes = [
      { rotulo: "sólida", extra: { oca: false, furos: null } },
      { rotulo: "oca", extra: { oca: true, furos: null } },
      {
        rotulo: "oca com furos",
        extra: {
          furos: { forma: "circulo" as const, quantidade: 4, tamanhoMm: 10 },
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
              forma: "piramide",
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
              const params = piramideComBordaFundo(sentido, pedido, dimensoes);
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
                expect(params.bordaFundo, nome).toBeNull();
              }
              esperarEstanque(gerarMalhaPiramide(params), nome);
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
            forma: "piramide",
            tamanhoMm: 100,
            espessuraParedeMm: 2,
            oca,
            bordaTopo: { sentido: sentidoTopo, tamanhoMm: 999 },
            bordaFundo: { sentido: sentidoFundo, tamanhoMm: 999 },
          });
          const nome = `topo ${sentidoTopo} + fundo ${sentidoFundo}/${oca ? "oca" : "maciça"}`;
          expect(params.bordaTopo, nome).not.toBeNull();
          expect(params.bordaFundo, nome).not.toBeNull();
          const altura = params.tamanhoMm * params.escalaAltura;
          const arcoTopo = arcoBorda(params, altura, "topo");
          const arcoFundo = arcoBorda(params, altura, "fundo");
          // As duas faixas juntas em ≤ 2/3 da altura: sobra rampa reta.
          expect(
            arcoTopo.alturaMm + arcoFundo.alturaMm,
            nome
          ).toBeLessThanOrEqual((2 * altura) / 3 + 1e-6);
          const malha = gerarMalhaPiramide(params);
          esperarEstanque(malha, nome);
          // Apoio honesto na base: o raio declarado é o do anel de z = 0
          // da malha REAL (A1) — pela malha, não pelo arco cru (a oca
          // freia a saia para o teto da cavidade caber em F4, e com
          // "dentro" a caixa é o bojo, não a base).
          const anelBase = aneisDaMalha(malha)[0];
          expect(anelBase.z, nome).toBeCloseTo(0, 3);
          expect(
            apoioPiramide.raioApoioInferiorMm(params),
            `${nome}: base real`
          ).toBeCloseTo(anelBase.meia, 2);
        }
      }
    }
    // Com furos: a banda espremida entre as DUAS faixas ainda entrega
    // furos de verdade (ou os derruba na cascata — nunca erro).
    const furada = grampearBloco({
      forma: "piramide",
      tamanhoMm: 100,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 10 },
      bordaTopo: { sentido: "fora", tamanhoMm: 999 },
      bordaFundo: { sentido: "fora", tamanhoMm: 999 },
    });
    expect(furada.bordaTopo).not.toBeNull();
    expect(furada.bordaFundo).not.toBeNull();
    const comFuros = gerarMalhaPiramide(furada);
    esperarEstanque(comFuros, "duas bordas + furos");
    if (furada.furos) {
      const semFuros = gerarMalhaPiramide({ ...furada, furos: null });
      expect(volumeAssinadoMm3(comFuros)).toBeLessThan(
        volumeAssinadoMm3(semFuros)
      );
    }
  });

  it("no fundo a caixa INVERTE em relação ao topo: 'fora' alarga a base (saia), 'dentro' recolhe", () => {
    for (const oca of [false, true]) {
      const semBorda = grampearBloco({
        forma: "piramide",
        tamanhoMm: 100,
        espessuraParedeMm: 2,
        oca,
      });
      const largura = semBorda.tamanhoMm * semBorda.escalaLargura;
      const altura = semBorda.tamanhoMm * semBorda.escalaAltura;

      // A BASE é o lado largo da pirâmide: a saia ("fora") ALARGA a caixa
      // envolvente — o contrário do topo, onde a aba morre dentro dela.
      const fora = piramideComBordaFundo("fora", 999, { oca });
      const nomeFora = `fora/${oca ? "oca" : "maciça"}`;
      const rBaseFora = apoioPiramide.raioApoioInferiorMm(fora);
      const caixaFora = caixaEnvolvente(gerarMalhaPiramide(fora));
      expect(rBaseFora, nomeFora).toBeGreaterThan(largura / 2);
      expect(caixaFora.maxX - caixaFora.minX, `${nomeFora}: X`).toBeCloseTo(
        2 * rBaseFora,
        1
      );
      expect(caixaFora.maxY - caixaFora.minY, `${nomeFora}: Y`).toBeCloseTo(
        2 * rBaseFora,
        1
      );
      expect(caixaFora.maxZ, `${nomeFora}: altura intocada`).toBeCloseTo(
        altura,
        3
      );
      expect(caixaFora.minZ, `${nomeFora}: nada abaixo da mesa`).toBeCloseTo(
        0,
        5
      );
      if (!oca) {
        // Na maciça a saia é o arco cru; na oca o freio de F4 achata a
        // saia (bisel) e o offset da base fica menor que o do arco.
        const arcoFora = arcoBorda(fora, altura, "fundo");
        expect(rBaseFora, nomeFora).toBeCloseTo(
          largura / 2 + arcoFora.offsetTopoMm,
          3
        );
      }

      // "Dentro" recolhe a base: cintura invertida perto do chão — o BOJO
      // fica mais largo que a base, mas nunca mais que o corpo.
      const dentro = piramideComBordaFundo("dentro", 999, { oca });
      const nomeDentro = `dentro/${oca ? "oca" : "maciça"}`;
      const rBaseDentro = apoioPiramide.raioApoioInferiorMm(dentro);
      const malhaDentro = gerarMalhaPiramide(dentro);
      const caixaDentro = caixaEnvolvente(malhaDentro);
      expect(rBaseDentro, nomeDentro).toBeLessThan(largura / 2);
      expect(
        caixaDentro.maxX - caixaDentro.minX,
        `${nomeDentro}: a caixa não passa do corpo`
      ).toBeLessThan(largura);
      expect(
        caixaDentro.maxX - caixaDentro.minX,
        `${nomeDentro}: o bojo é mais largo que a base`
      ).toBeGreaterThan(2 * rBaseDentro + 0.5);
      expect(caixaDentro.maxZ, `${nomeDentro}: altura intocada`).toBeCloseTo(
        altura,
        3
      );
      expect(caixaDentro.minZ, `${nomeDentro}: nada abaixo da mesa`).toBeCloseTo(
        0,
        5
      );
    }
  });

  it("F4 na faixa do fundo: a regra INVERTE — fora maciça é livre, dentro paga (e a oca sempre)", () => {
    // Quem paga F4 no fundo: "dentro" (barriga em balanço — a peça
    // DIVERGE subindo) e qualquer OCA (uma parede paira sobre a cavidade;
    // na "fora" oca o teto da cavidade soma a saia à convergência da
    // rampa, e o primitivo freia o arco num bisel ≤ F4).
    const casos = [
      { rotulo: "dentro maciça", sentido: "dentro" as const, oca: false },
      { rotulo: "dentro oca", sentido: "dentro" as const, oca: true },
      { rotulo: "fora oca", sentido: "fora" as const, oca: true },
    ];
    for (const { rotulo, sentido, oca } of casos) {
      const params = piramideComBordaFundo(sentido, 999, { oca });
      const altura = params.tamanhoMm * params.escalaAltura;
      const arco = arcoBorda(params, altura, "fundo");
      const medida = balancoNaFaixaFundo(
        gerarMalhaPiramide(params),
        arco.alturaMm + params.espessuraParedeMm,
        oca ? params.espessuraParedeMm : 0
      );
      expect(medida.tanMax, rotulo).toBeLessThanOrEqual(TAN_F4 + FOLGA_TAN);
      expect(medida.vaoPonteMm, `${rotulo}: vão de ponte`).toBeLessThanOrEqual(
        FURO_PONTE_MAX_MM
      );
      // A barriga/o teto da cavidade existem de verdade na malha.
      expect(medida.facesParaBaixo, rotulo).toBeGreaterThan(0);
    }

    // FORA + MACIÇA é a exceção do fundo: pé de cálice CONVERGE SUBINDO
    // (cúpula de cabeça para baixo — cada camada assenta inteira na de
    // baixo), então o arco é livre até 90° e a faixa não tem UMA face
    // virada para baixo (a tampa da base assenta na mesa e fica fora).
    const foraMacica = piramideComBordaFundo("fora", 999, { oca: false });
    const alturaMacica = foraMacica.tamanhoMm * foraMacica.escalaAltura;
    const arcoMacico = arcoBorda(foraMacica, alturaMacica, "fundo");
    const medidaMacica = balancoNaFaixaFundo(
      gerarMalhaPiramide(foraMacica),
      arcoMacico.alturaMm,
      0
    );
    expect(medidaMacica.facesParaBaixo).toBe(0);
  });

  it("o apoio conta a verdade sobre a malha com borda de fundo (A1)", () => {
    for (const sentido of ["fora", "dentro"] as const) {
      for (const oca of [false, true]) {
        const params = piramideComBordaFundo(sentido, 999, { oca });
        const nome = `fundo ${sentido}/${oca ? "oca" : "maciça"}`;
        const malha = gerarMalhaPiramide(params);
        const caixa = caixaEnvolvente(malha);
        const aneis = aneisDaMalha(malha);
        const altura = params.tamanhoMm * params.escalaAltura;
        const largura = params.tamanhoMm * params.escalaLargura;
        const arco = arcoBorda(params, altura, "fundo");

        // O topo é intocado pela borda de fundo: ápice ponto, altura igual.
        expect(apoioPiramide.alturaTopoMm(params), nome).toBeCloseTo(
          caixa.maxZ,
          3
        );
        expect(apoioPiramide.raioApoioSuperiorMm(params), nome).toBe(0);

        // BASE real: o anel de z = 0 da malha é o raio declarado — é o
        // que a regra de base estável (base-estavel.ts) lê para decidir pé.
        const anelBase = aneis[0];
        expect(anelBase.z, nome).toBeCloseTo(0, 3);
        expect(
          apoioPiramide.raioApoioInferiorMm(params),
          `${nome}: raio real da base`
        ).toBeCloseTo(anelBase.meia, 2);
        expect(
          apoioPiramide.raioPlatoMm!(params, 0),
          `${nome}: platô na cota 0 reflete o fundo`
        ).toBeCloseTo(anelBase.meia, 2);
        // A quina da base deslocada é raio NOTÁVEL.
        const notaveis = apoioPiramide.raiosNotaveisMm!(params);
        expect(
          notaveis.some((r) => Math.abs(r - anelBase.meia) < 1e-2),
          `${nome}: raio da base entre os notáveis`
        ).toBe(true);

        // Envelope honesto: NENHUMA seção da malha passa do declarado
        // (vale para as duas cascas — a da cavidade é sempre menor).
        for (const anel of aneis) {
          expect(
            anel.meia,
            `${nome}: seção em z=${anel.z.toFixed(2)} dentro do envelope`
          ).toBeLessThanOrEqual(
            apoioPiramide.raioPlatoMm!(params, anel.z) + 0.2
          );
        }

        const naFaixa = aneis.filter(
          (a) => a.z > 1e-6 && a.z < arco.alturaMm - 1e-6
        );
        expect(
          naFaixa.length,
          `${nome}: a faixa tem linhas de grade próprias`
        ).toBeGreaterThanOrEqual(4);

        if (!oca) {
          // Maciça: uma casca só — a meia-largura medida numa cota da
          // faixa é a silhueta, e o platô da fatia bate com ela.
          const meio = naFaixa[Math.floor(naFaixa.length / 2)];
          expect(
            apoioPiramide.raioPlatoMm!(params, meio.z),
            `${nome}: platô na faixa`
          ).toBeCloseTo(meio.meia, 2);
          expect(
            apoioPiramide.raioEnvelopeMm(params, meio.z),
            `${nome}: envelope na faixa`
          ).toBeCloseTo(meio.meia * Math.SQRT2, 2);

          if (sentido === "dentro") {
            // A superfície de BAIXO é o arco da barriga: um anel no ramo
            // de baixo da faixa assenta na própria cota (zSuperficieBaseMm
            // varre de baixo para cima e devolve a cota mais BAIXA).
            const baixo = naFaixa[1];
            expect(
              apoioPiramide.zSuperficieBaseMm(params, anelBase.meia * 0.99),
              `${nome}: tampa plana`
            ).toBeCloseTo(0, 6);
            expect(
              apoioPiramide.zSuperficieBaseMm(params, baixo.meia),
              `${nome}: superfície de baixo é o arco`
            ).toBeCloseTo(baixo.z, 1);
            expect(
              apoioPiramide.zSuperficieBaseMm(params, largura / 2 + 1),
              `${nome}: fora do corpo`
            ).toBeNull();
          } else {
            // Base alargada: superfície inferior plana em 0 até o raio da
            // saia; a saia olha para CIMA — quem pousa nela assenta no arco.
            expect(
              apoioPiramide.zSuperficieBaseMm(params, anelBase.meia - 0.5),
              `${nome}: 0 até a base alargada`
            ).toBeCloseTo(0, 6);
            expect(
              apoioPiramide.zSuperficieBaseMm(params, anelBase.meia + 1),
              `${nome}: além da saia`
            ).toBeNull();
            expect(
              apoioPiramide.zSuperficieTopoMm(params, meio.meia),
              `${nome}: quem pousa na saia assenta no arco`
            ).toBeCloseTo(meio.z, 1);
          }
        }
      }
    }
  });

  it("fundo fora desloca mais material; fundo dentro desloca menos", () => {
    const semBorda = grampearBloco({
      forma: "piramide",
      tamanhoMm: 100,
      oca: false,
    });
    const volumeSem = volumeAssinadoMm3(gerarMalhaPiramide(semBorda));
    const volumeFora = volumeAssinadoMm3(
      gerarMalhaPiramide(piramideComBordaFundo("fora", 999, { oca: false }))
    );
    const volumeDentro = volumeAssinadoMm3(
      gerarMalhaPiramide(piramideComBordaFundo("dentro", 999, { oca: false }))
    );
    expect(volumeFora).toBeGreaterThan(volumeSem);
    expect(volumeDentro).toBeLessThan(volumeSem);
    expect(volumeDentro).toBeGreaterThan(0);
  });
});
