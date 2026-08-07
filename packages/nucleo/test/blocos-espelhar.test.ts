/**
 * Montagem v2 — ferramenta ESPELHAR: contrato de teste da inversão
 * vertical (item 6 do plano).
 *
 * Varredura (4 formas × 8 variações do catálogo, com invertido: true):
 * a malha espelhada é um sólido ESTANQUE com volume positivo e IGUAL ao
 * da peça em pé (é o mesmo sólido de cabeça para baixo), base de volta
 * em z = 0 e caixa envolvente idêntica à da peça em pé. Depois: a
 * pirâmide invertida fica com o ápice na MESA e a base larga em cima, o
 * APOIO é confrontado com os vértices REAIS da malha invertida (A1 — o
 * apoio nunca promete acima do material), a composição com a borda
 * encurvada (o alargamento troca de extremidade) e os clamps do
 * grampeador (invertido é booleano coagido, nunca erro).
 */

import { describe, expect, it } from "vitest";
import {
  FORMAS_BLOCO,
  PRIMITIVOS_BLOCO,
  VARIACOES_BLOCO,
  alturaBrutaMm,
  arcoBorda,
  blocoDaVariacao,
  grampearBloco,
  larguraBrutaMm,
  type MalhaBloco,
  type ParametrosBloco,
} from "../src";
// blocos/index.ts ganha estas duas na integração; o teste importa do
// módulo para não depender da ordem em que as frentes entram no barrel.
import { apoioEspelhado, espelharMalhaBloco } from "../src/blocos/espelhar";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

/**
 * Desvio tolerado entre o modelo SUAVE do apoio e a malha facetada, em
 * mm — a promessa do apoio é confrontada com os vértices reais e nunca
 * pode ficar ACIMA do material além disto.
 */
const TOLERANCIA_APOIO_MM = 0.05;

/** Folga da facetação para as comparações de envelope (sagita), em mm. */
const FOLGA_FACETACAO_MM = 1;

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

/** A variação do catálogo, materializada já invertida (e grampeada). */
function blocoInvertido(
  variacao: (typeof VARIACOES_BLOCO)[number],
  forma: (typeof FORMAS_BLOCO)[number]
): ParametrosBloco {
  return grampearBloco({ ...blocoDaVariacao(variacao, forma), invertido: true });
}

describe.each(FORMAS_BLOCO)(
  "espelhar — varredura do catálogo (%s)",
  (forma) => {
    it("toda peça invertida é o MESMO sólido, de cabeça para baixo", () => {
      for (const variacao of VARIACOES_BLOCO) {
        const p = blocoInvertido(variacao, forma);
        expect(p.invertido, `${forma}/${variacao.id}`).toBe(true);
        const nome = `${forma}/${variacao.id}`;

        // Os primitivos ignoram `invertido` (a inversão é pós-processo).
        const emPe = PRIMITIVOS_BLOCO[forma].gerarMalha(p);
        const invertida = espelharMalhaBloco(emPe, p);
        esperarEstanque(invertida, nome);

        // O mesmo sólido: volume idêntico (o espelho é uma isometria e a
        // troca de enrolamento mantém as normais para fora).
        const volumeEmPe = volumeAssinadoMm3(emPe);
        const volumeInvertida = volumeAssinadoMm3(invertida);
        expect(
          Math.abs(volumeInvertida - volumeEmPe),
          `${nome}: mesmo volume`
        ).toBeLessThan(Math.max(1e-3, volumeEmPe * 1e-5));

        // Base de volta em z = 0 e caixa envolvente idêntica: z' = H − z
        // mapeia [0, H] em [0, H] e a planta não muda.
        const caixaEmPe = caixaEnvolvente(emPe);
        const caixa = caixaEnvolvente(invertida);
        expect(caixa.minZ, `${nome}: base em z = 0`).toBeCloseTo(0, 4);
        expect(caixa.maxZ, `${nome}: mesma altura`).toBeCloseTo(
          caixaEmPe.maxZ,
          4
        );
        // O topo fica em alturaBruta — a borda nunca muda a altura. A
        // exceção honesta é a esfera OCA: o respiro trunca o polo e o
        // topo real (das DUAS orientações) é a borda dele.
        if (!(forma === "esfera" && p.oca)) {
          expect(caixa.maxZ, `${nome}: maxZ = alturaBruta`).toBeCloseTo(
            alturaBrutaMm(p),
            3
          );
        }
        expect(caixa.minX, nome).toBeCloseTo(caixaEmPe.minX, 4);
        expect(caixa.maxX, nome).toBeCloseTo(caixaEmPe.maxX, 4);
        expect(caixa.minY, nome).toBeCloseTo(caixaEmPe.minY, 4);
        expect(caixa.maxY, nome).toBeCloseTo(caixaEmPe.maxY, 4);
      }
    }, 300_000);
  }
);

describe("espelhar — pirâmide invertida", () => {
  it("o ápice desce à mesa e a base larga vai para cima", () => {
    const p = grampearBloco({ forma: "piramide", invertido: true });
    const malha = espelharMalhaBloco(
      PRIMITIVOS_BLOCO.piramide.gerarMalha(p),
      p
    );
    const H = alturaBrutaMm(p);
    const meiaBase = larguraBrutaMm(p) / 2;

    // Medido nos vértices: o mais BAIXO tem raio ~0 em planta (o ápice
    // virou o pé) e a faixa do topo alcança a base quadrada inteira.
    let raioNoPe = -Infinity;
    let raioNoTopo = -Infinity;
    let maxXNoTopo = -Infinity;
    for (let i = 0; i < malha.posicoes.length; i += 3) {
      const raio = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
      const z = malha.posicoes[i + 2];
      if (z < 1e-4) raioNoPe = Math.max(raioNoPe, raio);
      if (z > H - 1e-3) {
        raioNoTopo = Math.max(raioNoTopo, raio);
        maxXNoTopo = Math.max(maxXNoTopo, malha.posicoes[i]);
      }
    }
    expect(raioNoPe, "ápice em z = 0 com raio ~0").toBeGreaterThanOrEqual(0);
    expect(raioNoPe, "ápice em z = 0 com raio ~0").toBeLessThan(1e-3);
    expect(maxXNoTopo, "base larga em cima").toBeCloseTo(meiaBase, 3);
    // O canto da base (agora em cima) alcança o circunscrito da planta.
    expect(raioNoTopo, "canto da base em cima").toBeCloseTo(
      meiaBase * Math.SQRT2,
      3
    );
  });
});

describe("espelhar — o apoio diz a verdade sobre a malha invertida (A1)", () => {
  it("pirâmide invertida: apoio pontual embaixo, meia-base em cima", () => {
    const p = grampearBloco({ forma: "piramide", invertido: true });
    const base = PRIMITIVOS_BLOCO.piramide.apoio;
    const apoio = apoioEspelhado(base);
    const malha = espelharMalhaBloco(
      PRIMITIVOS_BLOCO.piramide.gerarMalha(p),
      p
    );
    const caixa = caixaEnvolvente(malha);
    const H = alturaBrutaMm(p);
    const meiaBase = larguraBrutaMm(p) / 2;

    expect(apoio.alturaTopoMm(p), "topo real").toBeCloseTo(caixa.maxZ, 3);
    // Aproximação do cone (documentada em tipos.ts): o ápice na mesa é
    // apoio PONTUAL — e a base larga vira o platô de cima.
    expect(apoio.raioApoioInferiorMm(p), "apoio pontual na mesa").toBe(0);
    expect(apoio.raioApoioSuperiorMm(p), "platô = meia-base").toBeCloseTo(
      meiaBase,
      6
    );

    // O platô de cima responde a cota do topo real — nunca acima do
    // material (confrontado com os vértices da malha invertida).
    for (const dMm of [0, 10, 25, meiaBase * 0.99]) {
      const pouso = apoio.zSuperficieTopoMm(p, dMm);
      expect(pouso, `pouso em d=${dMm}`).not.toBeNull();
      expect(pouso!, `pouso em d=${dMm}`).toBeCloseTo(H, 6);
      expect(pouso!, `pouso ≤ material em d=${dMm}`).toBeLessThanOrEqual(
        caixa.maxZ + TOLERANCIA_APOIO_MM
      );
    }
    expect(apoio.zSuperficieTopoMm(p, meiaBase + 1)).toBeNull();

    // A superfície INFERIOR é a rampa: a concavidade agora olha para
    // baixo e sobe com a distância ao eixo (z = H·d/meia-base).
    expect(apoio.zSuperficieBaseMm(p, 0), "pé na mesa").toBeCloseTo(0, 6);
    expect(
      apoio.zSuperficieBaseMm(p, meiaBase / 2),
      "rampa a meia distância"
    ).toBeCloseTo(H / 2, 6);

    // Envelope: nunca menor que o raio REAL da malha em cada cota.
    for (let i = 0; i < malha.posicoes.length; i += 3) {
      const raio = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
      const envelope = apoio.raioEnvelopeMm(p, malha.posicoes[i + 2]);
      expect(
        raio - envelope,
        `envelope ≥ raio real em z=${malha.posicoes[i + 2].toFixed(2)}`
      ).toBeLessThanOrEqual(FOLGA_FACETACAO_MM);
    }
  });

  it("cilindro oco invertido: a boca abre para baixo e o apoio acompanha", () => {
    const p = grampearBloco({
      forma: "cilindro",
      oca: true,
      espessuraParedeMm: 2,
      invertido: true,
    });
    const apoio = apoioEspelhado(PRIMITIVOS_BLOCO.cilindro.apoio);
    const malha = espelharMalhaBloco(
      PRIMITIVOS_BLOCO.cilindro.gerarMalha(p),
      p
    );
    const H = alturaBrutaMm(p);
    const raioExterno = larguraBrutaMm(p) / 2;
    // O piso da cavidade da casca em pé (a MESMA conta de cilindro.ts).
    const zPiso = Math.min(p.espessuraParedeMm, H / 3);

    // Vértices reais perto do eixo: o fundo fechado de antes é o topo, e
    // o piso da cavidade virou o teto da boca aberta para baixo.
    let topoNoEixo = -Infinity;
    let fundoNoEixo = Infinity;
    for (let i = 0; i < malha.posicoes.length; i += 3) {
      const raio = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
      if (raio > 1) continue;
      topoNoEixo = Math.max(topoNoEixo, malha.posicoes[i + 2]);
      fundoNoEixo = Math.min(fundoNoEixo, malha.posicoes[i + 2]);
    }
    expect(topoNoEixo, "tampo de cima").toBeCloseTo(H, 3);
    expect(fundoNoEixo, "teto da boca").toBeCloseTo(H - zPiso, 3);

    // zSuperficieTopoMm no eixo = o tampo (o piso da cavidade, visto de
    // cima) — confrontado com os vértices reais, nunca acima deles.
    const pouso = apoio.zSuperficieTopoMm(p, 0);
    expect(pouso, "pouso no eixo").not.toBeNull();
    expect(Math.abs(pouso! - topoNoEixo)).toBeLessThanOrEqual(
      TOLERANCIA_APOIO_MM
    );
    expect(pouso!).toBeLessThanOrEqual(topoNoEixo + TOLERANCIA_APOIO_MM);

    // A superfície INFERIOR no eixo é o teto da cavidade aberta.
    const teto = apoio.zSuperficieBaseMm(p, 0);
    expect(teto, "teto da cavidade").not.toBeNull();
    expect(Math.abs(teto! - fundoNoEixo)).toBeLessThanOrEqual(
      TOLERANCIA_APOIO_MM
    );
    // Fora da boca, a parede desce inteira até a mesa.
    expect(apoio.zSuperficieBaseMm(p, raioExterno - 0.5)).toBeCloseTo(0, 6);

    // Topo e fundo trocaram; os raios em planta ficaram como estavam.
    expect(apoio.raioApoioSuperiorMm(p)).toBeCloseTo(raioExterno, 6);
    expect(apoio.raioApoioInferiorMm(p)).toBeCloseTo(raioExterno, 6);
    expect(apoio.raiosNotaveisMm?.(p), "boca da casca").toContain(
      raioExterno - p.espessuraParedeMm
    );
    // O platô inscrito lê a cota espelhada (a seção é a mesma da peça em
    // pé na cota H − z).
    expect(apoio.raioPlatoMm?.(p, 0.5)).toBeCloseTo(raioExterno, 6);

    // Envelope espelhado: nunca menor que o raio real; nada fora de
    // [0, H].
    for (let i = 0; i < malha.posicoes.length; i += 3) {
      const raio = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
      const envelope = apoio.raioEnvelopeMm(p, malha.posicoes[i + 2]);
      expect(
        raio - envelope,
        `envelope ≥ raio real em z=${malha.posicoes[i + 2].toFixed(2)}`
      ).toBeLessThanOrEqual(FOLGA_FACETACAO_MM);
    }
    expect(apoio.raioEnvelopeMm(p, -1)).toBe(0);
    expect(apoio.raioEnvelopeMm(p, H + 1)).toBe(0);
  });

  it("sem inversão, o apoio espelhado é o apoio da forma", () => {
    for (const forma of FORMAS_BLOCO) {
      const base = PRIMITIVOS_BLOCO[forma].apoio;
      const apoio = apoioEspelhado(base);
      for (const variacao of VARIACOES_BLOCO) {
        const p = blocoDaVariacao(variacao, forma);
        expect(p.invertido).toBe(false);
        const nome = `${forma}/${variacao.id}`;
        expect(apoio.alturaTopoMm(p), nome).toBe(base.alturaTopoMm(p));
        expect(apoio.raioApoioSuperiorMm(p), nome).toBe(
          base.raioApoioSuperiorMm(p)
        );
        expect(apoio.raioApoioInferiorMm(p), nome).toBe(
          base.raioApoioInferiorMm(p)
        );
        expect(apoio.raiosNotaveisMm?.(p), nome).toEqual(
          base.raiosNotaveisMm?.(p) ?? []
        );
        for (const z of [0, 1, 25, 50, 99, 150, 1000]) {
          expect(apoio.raioEnvelopeMm(p, z), `${nome} z=${z}`).toBe(
            base.raioEnvelopeMm(p, z)
          );
          if (base.raioPlatoMm) {
            expect(apoio.raioPlatoMm!(p, z), `${nome} z=${z}`).toBe(
              base.raioPlatoMm(p, z)
            );
          }
        }
        for (const d of [0, 1, 10, 25, 49, 60, 1000]) {
          expect(apoio.zSuperficieTopoMm(p, d), `${nome} d=${d}`).toBe(
            base.zSuperficieTopoMm(p, d)
          );
          expect(apoio.zSuperficieBaseMm(p, d), `${nome} d=${d}`).toBe(
            base.zSuperficieBaseMm(p, d)
          );
        }
      }
    }
  });
});

describe("espelhar — composição com a borda encurvada", () => {
  it("cubo com bordaTopo 'fora' invertido: o alargamento aparece na BASE", () => {
    const p = grampearBloco({
      forma: "cubo",
      bordaTopo: { sentido: "fora", tamanhoMm: 20 },
      invertido: true,
    });
    expect(p.bordaTopo).not.toBeNull();
    const malha = espelharMalhaBloco(PRIMITIVOS_BLOCO.cubo.gerarMalha(p), p);
    esperarEstanque(malha, "cubo/bordaTopo fora invertido");
    const H = alturaBrutaMm(p);
    const meia = larguraBrutaMm(p) / 2;
    const arco = arcoBorda(p, H, "topo");
    expect(arco.offsetTopoMm).toBeGreaterThan(0);

    // Caixa envolvente por faixas de z: a aba (que era do topo) mora na
    // base da peça invertida; o meio e o topo ficam retos.
    const maxXNaFaixa = (zDe: number, zAte: number) => {
      let maxX = -Infinity;
      for (let i = 0; i < malha.posicoes.length; i += 3) {
        const z = malha.posicoes[i + 2];
        if (z < zDe || z > zAte) continue;
        maxX = Math.max(maxX, malha.posicoes[i]);
      }
      return maxX;
    };
    // Na extremidade de BAIXO o offset é o máximo do arco…
    expect(maxXNaFaixa(0, 0.1), "aba na base").toBeCloseTo(
      meia + arco.offsetTopoMm,
      2
    );
    // …acima do alcance da faixa (arco.alturaMm) a lateral volta a ser
    // reta, e o topo (a base de antes) também.
    expect(maxXNaFaixa(arco.alturaMm + 0.1, H), "lateral reta").toBeCloseTo(
      meia,
      2
    );
    expect(maxXNaFaixa(H - 0.1, H), "topo reto").toBeCloseTo(meia, 2);

    // O apoio acompanha (A1): envelope espelhado ≥ raio real, e a base
    // alargada é a nova área de contato com a mesa.
    const apoio = apoioEspelhado(PRIMITIVOS_BLOCO.cubo.apoio);
    for (let i = 0; i < malha.posicoes.length; i += 3) {
      const raio = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
      const envelope = apoio.raioEnvelopeMm(p, malha.posicoes[i + 2]);
      expect(
        raio - envelope,
        `envelope ≥ raio real em z=${malha.posicoes[i + 2].toFixed(2)}`
      ).toBeLessThanOrEqual(FOLGA_FACETACAO_MM);
    }
    expect(apoio.raioApoioInferiorMm(p), "base alargada").toBeCloseTo(
      meia + arco.offsetTopoMm,
      6
    );
  });
});

describe("espelhar — invertido: false e true dão o mesmo sólido", () => {
  it("caixas envolventes iguais e volumes iguais (não é dupla aplicação)", () => {
    // O contrato NÃO é espelhar duas vezes a mesma malha: é gerar com
    // invertido false e true e comparar — o mesmo sólido, de cabeça para
    // baixo, ocupa a MESMA caixa e o MESMO volume.
    for (const forma of FORMAS_BLOCO) {
      for (const id of ["pura", "oca", "furos-circulo-poucos"]) {
        const variacao = VARIACOES_BLOCO.find((v) => v.id === id)!;
        const emPe = blocoDaVariacao(variacao, forma);
        const deCabeca = grampearBloco({ ...emPe, invertido: true });
        const nome = `${forma}/${id}`;

        const malhaEmPe = PRIMITIVOS_BLOCO[forma].gerarMalha(emPe);
        // Sem inversão, espelhar devolve a MESMA malha (sem cópia).
        expect(espelharMalhaBloco(malhaEmPe, emPe), nome).toBe(malhaEmPe);

        const malhaInvertida = espelharMalhaBloco(
          PRIMITIVOS_BLOCO[forma].gerarMalha(deCabeca),
          deCabeca
        );
        const caixaEmPe = caixaEnvolvente(malhaEmPe);
        const caixa = caixaEnvolvente(malhaInvertida);
        expect(caixa.minX, nome).toBeCloseTo(caixaEmPe.minX, 3);
        expect(caixa.maxX, nome).toBeCloseTo(caixaEmPe.maxX, 3);
        expect(caixa.minY, nome).toBeCloseTo(caixaEmPe.minY, 3);
        expect(caixa.maxY, nome).toBeCloseTo(caixaEmPe.maxY, 3);
        expect(caixa.minZ, nome).toBeCloseTo(caixaEmPe.minZ, 3);
        expect(caixa.maxZ, nome).toBeCloseTo(caixaEmPe.maxZ, 3);

        const volumeEmPe = volumeAssinadoMm3(malhaEmPe);
        expect(
          Math.abs(volumeAssinadoMm3(malhaInvertida) - volumeEmPe),
          `${nome}: mesmo volume`
        ).toBeLessThan(Math.max(1e-3, volumeEmPe * 1e-5));
      }
    }
  }, 300_000);
});

describe("espelhar — grampearBloco coage o invertido", () => {
  it("lixo vira false; true fica true; idempotente", () => {
    expect(grampearBloco({ forma: "cubo" }).invertido).toBe(false);
    expect(grampearBloco({ forma: "cubo", invertido: true }).invertido).toBe(
      true
    );
    for (const lixo of ["sim", 1, 0, {}, [], null, undefined, Number.NaN]) {
      const p = grampearBloco({ forma: "cubo", invertido: lixo });
      expect(p.invertido, `invertido = ${String(lixo)}`).toBe(false);
      expect(grampearBloco(p)).toEqual(p);
    }
    const deCabeca = grampearBloco({ forma: "piramide", invertido: true });
    expect(grampearBloco(deCabeca)).toEqual(deCabeca);
    expect(deCabeca.invertido).toBe(true);
  });
});
