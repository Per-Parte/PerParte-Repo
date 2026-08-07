/**
 * Montagem v2 — ferramenta FATIAR: contrato de teste do corte plano.
 *
 * Varredura grande (4 formas × 8 variações do catálogo × 3 eixos × 2 lados
 * × 3 posições da faixa de limitesFatiaMm): toda malha cortada é um sólido
 * ESTANQUE, com volume positivo e menor que a inteira, base de volta em
 * z = 0 e caixa envolvente coerente. Fecha com o teste que só a soma pega:
 * o volume dos DOIS lados do mesmo corte soma o volume da peça inteira —
 * tampa que sobra, que falta ou que se dobra aparece aí.
 *
 * Depois: a face do corte é realmente PLANA, os clamps da fatia, e o
 * APOIO (A1) confrontado com a malha REAL — o apoio de um bloco fatiado
 * tem de dizer a verdade sobre topo, pouso e envelope da peça cortada,
 * senão a F2 deixa bloco flutuando ou atravessando.
 */

import { describe, expect, it } from "vitest";
import {
  EIXOS_FATIA,
  FATIA_MARGEM_MM,
  FORMAS_BLOCO,
  PRIMITIVOS_BLOCO,
  VARIACOES_BLOCO,
  blocoDaVariacao,
  grampearBloco,
  limitesFatiaMm,
  type EixoFatia,
  type MalhaBloco,
  type ParametrosBloco,
} from "../src";
// blocos/index.ts ganha estas duas na integração; o teste importa do
// módulo para não depender da ordem em que as frentes entram no barrel.
import { apoioComFatia, fatiarMalhaBloco } from "../src/blocos/fatiar";
import { verificarEstanque, volumeAssinadoMm3 } from "./apoio";

/**
 * Desvio tolerado entre o modelo SUAVE do apoio e a malha facetada, em mm.
 * Duas fontes, as duas herdadas do primitivo (não da fatia): o platô do
 * polo da esfera (⚑ 0,6 mm, para o ápice não degenerar) e a sagita da
 * facetação de superfície curva. O resto do núcleo já mede o apoio pelo
 * modelo suave — a fatia segue a mesma casa.
 */
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

const INDICE_EIXO: Record<EixoFatia, number> = { x: 0, y: 1, z: 2 };

/** As três posições do enunciado: início, meio e fim da faixa. */
function posicoesDaFaixa(p: ParametrosBloco, eixo: EixoFatia): number[] {
  const faixa = limitesFatiaMm(p, eixo);
  return [faixa.min, (faixa.min + faixa.max) / 2, faixa.max];
}

function comFatia(
  p: ParametrosBloco,
  eixo: EixoFatia,
  posicaoMm: number,
  lado: "menor" | "maior"
): ParametrosBloco {
  return grampearBloco({ ...p, fatia: { eixo, posicaoMm, lado } });
}

/**
 * Onde o plano do corte ficou NA MALHA cortada: corte em x/y não translada
 * a planta; corte em z do lado "maior" reassenta a peça e o plano do corte
 * vira o z = 0 da mesa.
 */
function planoNaMalhaMm(p: ParametrosBloco): number {
  const fatia = p.fatia!;
  return fatia.eixo === "z" && fatia.lado === "maior" ? 0 : fatia.posicaoMm;
}

/** A face do corte: triângulos com os três vértices no plano. */
function faceDoCorte(malha: MalhaBloco, p: ParametrosBloco) {
  const fatia = p.fatia!;
  const k = INDICE_EIXO[fatia.eixo];
  const plano = planoNaMalhaMm(p);
  const outros = [0, 1, 2].filter((e) => e !== k);
  const perto = (id: number) =>
    Math.abs(malha.posicoes[id * 3 + k] - plano) <= 1e-3;
  let triangulos = 0;
  let area = 0;
  let piorDesvio = 0;
  for (let t = 0; t < malha.indices.length; t += 3) {
    const trio = [malha.indices[t], malha.indices[t + 1], malha.indices[t + 2]];
    if (!perto(trio[0]) || !perto(trio[1]) || !perto(trio[2])) continue;
    triangulos++;
    for (const id of trio) {
      piorDesvio = Math.max(
        piorDesvio,
        Math.abs(malha.posicoes[id * 3 + k] - plano)
      );
    }
    const u = trio.map((id) => malha.posicoes[id * 3 + outros[0]]);
    const v = trio.map((id) => malha.posicoes[id * 3 + outros[1]]);
    area +=
      Math.abs((u[1] - u[0]) * (v[2] - v[0]) - (v[1] - v[0]) * (u[2] - u[0])) /
      2;
  }
  // O lado descartado nunca deixa resto: nada além do plano.
  let piorSobra = 0;
  const sinal = fatia.lado === "menor" ? 1 : -1;
  for (let i = 0; i < malha.posicoes.length; i += 3) {
    piorSobra = Math.max(piorSobra, sinal * (malha.posicoes[i + k] - plano));
  }
  return { triangulos, area, piorDesvio, piorSobra };
}

describe.each(FORMAS_BLOCO)("fatiar — varredura do catálogo (%s)", (forma) => {
  it("toda fatia é sólido estanque, reassentado e coerente", () => {
    for (const variacao of VARIACOES_BLOCO) {
      const params = blocoDaVariacao(variacao, forma);
      const inteira = PRIMITIVOS_BLOCO[forma].gerarMalha(params);
      const caixaInteira = caixaEnvolvente(inteira);
      const volumeInteira = volumeAssinadoMm3(inteira);

      for (const eixo of EIXOS_FATIA) {
        const faixa = limitesFatiaMm(params, eixo);
        expect(faixa.min, `${forma}/${eixo}: faixa útil`).toBeLessThanOrEqual(
          faixa.max
        );
        for (const posicaoMm of posicoesDaFaixa(params, eixo)) {
          let soma = 0;
          for (const lado of ["menor", "maior"] as const) {
            const nome = `${forma}/${variacao.id}/${eixo} ${lado} @${posicaoMm.toFixed(1)}`;
            const cortados = comFatia(params, eixo, posicaoMm, lado);
            expect(cortados.fatia, nome).not.toBeNull();
            expect(cortados.fatia!.posicaoMm, nome).toBeCloseTo(posicaoMm, 6);
            const malha = fatiarMalhaBloco(inteira, cortados);
            esperarEstanque(malha, nome);
            const volume = volumeAssinadoMm3(malha);
            soma += volume;
            expect(volume, `${nome}: menos material que a inteira`).toBeLessThan(
              volumeInteira
            );

            const caixa = caixaEnvolvente(malha);
            expect(caixa.minZ, `${nome}: nada abaixo da mesa`).toBeCloseTo(0, 4);

            if (eixo === "z") {
              // Altura = zc (topo removido) ou H − zc (base removida).
              const esperada =
                lado === "menor"
                  ? Math.min(posicaoMm, caixaInteira.maxZ)
                  : caixaInteira.maxZ - posicaoMm;
              expect(caixa.maxZ, `${nome}: altura`).toBeCloseTo(esperada, 3);
              // A planta não cresce.
              expect(caixa.maxX, nome).toBeLessThanOrEqual(
                caixaInteira.maxX + 1e-4
              );
              expect(caixa.minX, nome).toBeGreaterThanOrEqual(
                caixaInteira.minX - 1e-4
              );
            } else {
              // Corte em x/y: a planta encurta DO LADO cortado, e o outro
              // lado fica intacto (o vértice extremo sobrevive ao corte).
              const eixoX = eixo === "x";
              const menorInteira = eixoX ? caixaInteira.minX : caixaInteira.minY;
              const maiorInteira = eixoX ? caixaInteira.maxX : caixaInteira.maxY;
              const menorCorte = eixoX ? caixa.minX : caixa.minY;
              const maiorCorte = eixoX ? caixa.maxX : caixa.maxY;
              if (lado === "menor") {
                expect(maiorCorte, `${nome}: face do corte`).toBeCloseTo(
                  posicaoMm,
                  3
                );
                expect(menorCorte, `${nome}: lado intacto`).toBeCloseTo(
                  menorInteira,
                  3
                );
              } else {
                expect(menorCorte, `${nome}: face do corte`).toBeCloseTo(
                  posicaoMm,
                  3
                );
                expect(maiorCorte, `${nome}: lado intacto`).toBeCloseTo(
                  maiorInteira,
                  3
                );
              }
              expect(caixa.maxZ, nome).toBeLessThanOrEqual(
                caixaInteira.maxZ + 1e-4
              );
            }
          }
          // Os dois lados do MESMO corte somam a peça inteira: a tampa
          // cobre a seção exatamente uma vez, dos dois lados.
          expect(
            Math.abs(soma - volumeInteira),
            `${forma}/${variacao.id}/${eixo} @${posicaoMm.toFixed(1)}: menor + maior = inteira`
          ).toBeLessThan(Math.max(1e-3, volumeInteira * 1e-6));
        }
      }
    }
  }, 300_000);
});

describe("fatiar — a face do corte é plana", () => {
  it("os vértices do corte têm a MESMA coordenada no eixo (1e-4)", () => {
    for (const forma of FORMAS_BLOCO) {
      // "oca" e a grade de furos dão os casos de vários laços (coroa e ilhas).
      for (const id of ["pura", "oca", "furos-circulo-grade"]) {
        const variacao = VARIACOES_BLOCO.find((v) => v.id === id)!;
        const params = blocoDaVariacao(variacao, forma);
        const inteira = PRIMITIVOS_BLOCO[forma].gerarMalha(params);
        for (const eixo of EIXOS_FATIA) {
          for (const posicaoMm of posicoesDaFaixa(params, eixo)) {
            for (const lado of ["menor", "maior"] as const) {
              const p = comFatia(params, eixo, posicaoMm, lado);
              const malha = fatiarMalhaBloco(inteira, p);
              const nome = `${forma}/${id}/${eixo} ${lado} @${posicaoMm.toFixed(1)}`;
              const face = faceDoCorte(malha, p);
              expect(
                face.triangulos,
                `${nome}: a tampa existe`
              ).toBeGreaterThan(0);
              expect(face.area, `${nome}: a tampa tem área`).toBeGreaterThan(
                0.5
              );
              expect(face.piorDesvio, `${nome}: face plana`).toBeLessThanOrEqual(
                1e-4
              );
              expect(
                face.piorSobra,
                `${nome}: nada além do plano`
              ).toBeLessThanOrEqual(1e-4);
            }
          }
        }
      }
    }
  }, 300_000);
});

describe("fatiar — a malha de entrada não importa", () => {
  it("mais segmentos refinam sem quebrar a estanqueidade da fatia", () => {
    for (const forma of FORMAS_BLOCO) {
      const params = grampearBloco({
        forma,
        furos: { forma: "circulo", quantidade: 4, tamanhoMm: 14 },
      });
      for (const segmentos of [24, 48, 96]) {
        const inteira = PRIMITIVOS_BLOCO[forma].gerarMalha(params, segmentos);
        for (const eixo of EIXOS_FATIA) {
          for (const lado of ["menor", "maior"] as const) {
            const meio =
              (limitesFatiaMm(params, eixo).min +
                limitesFatiaMm(params, eixo).max) /
              2;
            const p = comFatia(params, eixo, meio, lado);
            esperarEstanque(
              fatiarMalhaBloco(inteira, p),
              `${forma}/${segmentos} seg/${eixo} ${lado}`
            );
          }
        }
      }
    }
  }, 300_000);

  it("fatia sobre BORDA encurvada continua estanque", () => {
    // A fatia é agnóstica à receita da forma: recorta qualquer malha
    // estanque. Cruzamento com a outra frente da v2 (borda no topo) —
    // vale para as três formas de lado reto (a esfera não tem borda).
    for (const forma of ["cubo", "cilindro", "piramide"] as const) {
      for (const sentido of ["fora", "dentro"] as const) {
        for (const oca of [false, true]) {
          const params = grampearBloco({
            forma,
            oca,
            espessuraParedeMm: 3,
            bordaTopo: { sentido, tamanhoMm: 999 },
          });
          expect(params.bordaTopo, `${forma}/${sentido}`).not.toBeNull();
          const inteira = PRIMITIVOS_BLOCO[forma].gerarMalha(params);
          for (const eixo of EIXOS_FATIA) {
            for (const posicaoMm of posicoesDaFaixa(params, eixo)) {
              for (const lado of ["menor", "maior"] as const) {
                const p = comFatia(params, eixo, posicaoMm, lado);
                esperarEstanque(
                  fatiarMalhaBloco(inteira, p),
                  `${forma}/borda ${sentido}${oca ? " oca" : ""}/${eixo} ${lado} @${posicaoMm.toFixed(1)}`
                );
              }
            }
          }
        }
      }
    }
  }, 300_000);
});

describe("fatiar — clamps da fatia (limite como ferramenta)", () => {
  it("a posição é grampeada para dentro de limitesFatiaMm", () => {
    for (const forma of FORMAS_BLOCO) {
      for (const eixo of EIXOS_FATIA) {
        for (const tamanhoMm of [40, 100, 200]) {
          const alvo = { forma, tamanhoMm, escalaLargura: 0.5 };
          const faixa = limitesFatiaMm(grampearBloco(alvo), eixo);
          const alto = grampearBloco({
            ...alvo,
            fatia: { eixo, posicaoMm: 999, lado: "menor" },
          });
          const baixo = grampearBloco({
            ...alvo,
            fatia: { eixo, posicaoMm: -999, lado: "maior" },
          });
          expect(alto.fatia!.posicaoMm, `${forma}/${eixo}`).toBeCloseTo(
            faixa.max,
            6
          );
          expect(baixo.fatia!.posicaoMm, `${forma}/${eixo}`).toBeCloseTo(
            faixa.min,
            6
          );
          // O corte grampeado corta de verdade (sobra material dos dois
          // lados: é o que a margem da faixa garante).
          esperarEstanque(
            fatiarMalhaBloco(PRIMITIVOS_BLOCO[forma].gerarMalha(alto), alto),
            `${forma}/${eixo} no teto da faixa`
          );
        }
      }
    }
  }, 300_000);

  it("grampear a fatia é idempotente, inclusive para lixo", () => {
    const casos: unknown[] = [
      { forma: "cubo", fatia: { eixo: "w", posicaoMm: "muito", lado: "sim" } },
      { forma: "esfera", fatia: {} },
      {
        forma: "cilindro",
        fatia: { eixo: "y", posicaoMm: Number.NaN, lado: "maior" },
      },
      { forma: "piramide", fatia: { eixo: "z", posicaoMm: 1e9, lado: "menor" } },
      {
        forma: "cubo",
        tamanhoMm: 40,
        escalaLargura: 0.5,
        fatia: { eixo: "x", posicaoMm: 999, lado: "menor" },
      },
      ...FORMAS_BLOCO.flatMap((forma) =>
        EIXOS_FATIA.map((eixo) => ({
          forma,
          fatia: { eixo, posicaoMm: 30, lado: "maior" as const },
        }))
      ),
    ];
    for (const caso of casos) {
      const umaVez = grampearBloco(caso);
      expect(grampearBloco(umaVez)).toEqual(umaVez);
      if (umaVez.fatia) {
        const faixa = limitesFatiaMm(umaVez, umaVez.fatia.eixo);
        expect(umaVez.fatia.posicaoMm).toBeGreaterThanOrEqual(faixa.min);
        expect(umaVez.fatia.posicaoMm).toBeLessThanOrEqual(faixa.max);
        expect(["menor", "maior"]).toContain(umaVez.fatia.lado);
      }
    }
  });

  it("peça pequena demais para o eixo: a faixa fecha e a fatia some", () => {
    // A faixa exige FATIA_MARGEM_MM de material de cada lado. Numa peça
    // mais estreita que 2 × margem ela FECHA (min > max) e o grampeador
    // zera a fatia — clamp, nunca erro. Os pisos dos sliders (tamanho ≥ 40
    // mm, escalas ≥ 0,5) mantêm isso fora do alcance do usuário hoje: a
    // peça mais estreita possível (Ø 20 mm) ainda tem faixa [−5, +5].
    const minusculo = { tamanhoMm: 8, escalaAltura: 1, escalaLargura: 1 };
    for (const eixo of EIXOS_FATIA) {
      const faixa = limitesFatiaMm(minusculo, eixo);
      expect(faixa.min, eixo).toBeGreaterThan(faixa.max);
    }
    // O grampeador puxa a peça mínuscula para os pisos dos sliders antes de
    // olhar a fatia — o corte volta a caber, e é por isso que o usuário
    // nunca vê o caso de faixa fechada (nem erro nenhum).
    const puxado = grampearBloco({
      ...minusculo,
      forma: "cubo",
      fatia: { eixo: "x", posicaoMm: 0, lado: "menor" },
    });
    expect(puxado.tamanhoMm).toBeGreaterThanOrEqual(40);
    expect(puxado.fatia).not.toBeNull();

    const magro = grampearBloco({
      forma: "cilindro",
      tamanhoMm: 40,
      escalaLargura: 0.5,
      fatia: { eixo: "x", posicaoMm: 999, lado: "menor" },
    });
    const faixaMagra = limitesFatiaMm(magro, "x");
    expect(faixaMagra.min).toBeCloseTo(-FATIA_MARGEM_MM, 6);
    expect(faixaMagra.max).toBeCloseTo(FATIA_MARGEM_MM, 6);
    expect(magro.fatia!.posicaoMm).toBeCloseTo(FATIA_MARGEM_MM, 6);
  });

  it("sem fatia, fatiarMalhaBloco devolve a MESMA malha", () => {
    const params = grampearBloco({ forma: "cubo" });
    expect(params.fatia).toBeNull();
    const malha = PRIMITIVOS_BLOCO.cubo.gerarMalha(params);
    expect(fatiarMalhaBloco(malha, params)).toBe(malha);
  });
});

describe("fatiar — o apoio diz a verdade sobre a peça cortada (A1)", () => {
  const variacoesApoio = ["pura", "oca", "furos-circulo-grade"];

  it("corte em Z: alturaTopoMm é o topo REAL e o pouso no eixo bate", () => {
    for (const forma of FORMAS_BLOCO) {
      const apoioBase = PRIMITIVOS_BLOCO[forma].apoio;
      const apoio = apoioComFatia(apoioBase);
      for (const id of variacoesApoio) {
        const variacao = VARIACOES_BLOCO.find((v) => v.id === id)!;
        const params = blocoDaVariacao(variacao, forma);
        const inteira = PRIMITIVOS_BLOCO[forma].gerarMalha(params);
        for (const posicaoMm of posicoesDaFaixa(params, "z")) {
          for (const lado of ["menor", "maior"] as const) {
            const p = comFatia(params, "z", posicaoMm, lado);
            const malha = fatiarMalhaBloco(inteira, p);
            const caixa = caixaEnvolvente(malha);
            const nome = `${forma}/${id}/z ${lado} @${posicaoMm.toFixed(1)}`;
            expect(apoio.alturaTopoMm(p), `${nome}: topo real`).toBeCloseTo(
              caixa.maxZ,
              1
            );

            const platoDoCorte = apoioBase.raioPlatoMm?.(p, posicaoMm) ?? 0;
            const pousoNoEixo = apoio.zSuperficieTopoMm(p, 0);
            if (pousoNoEixo != null) {
              // Nunca acima do topo real: bloco flutuando é impossível.
              expect(pousoNoEixo, `${nome}: pouso ≤ topo`).toBeLessThanOrEqual(
                caixa.maxZ + 0.05
              );
            }
            if (id === "pura") {
              // Peça cheia: no eixo se pousa na cota do topo real.
              expect(pousoNoEixo, `${nome}: pouso no eixo`).not.toBeNull();
              expect(pousoNoEixo!, `${nome}: pouso no eixo`).toBeCloseTo(
                caixa.maxZ,
                1
              );
            }

            if (lado === "menor") {
              // O topo virou o platô do corte…
              expect(
                apoio.raioApoioSuperiorMm(p),
                `${nome}: apoio = platô do corte`
              ).toBeCloseTo(platoDoCorte, 6);
              if (platoDoCorte > 0) {
                expect(
                  apoio.raiosNotaveisMm?.(p) ?? [],
                  `${nome}: a borda do platô é raio notável`
                ).toContain(platoDoCorte);
                // …e dentro dele o pouso é a cota do corte.
                const dentro = apoio.zSuperficieTopoMm(p, platoDoCorte * 0.99);
                expect(dentro, `${nome}: platô plano`).not.toBeNull();
                expect(dentro!, `${nome}: platô plano`).toBeLessThanOrEqual(
                  posicaoMm + 1e-6
                );
              }
              // A base não mudou.
              expect(apoio.raioApoioInferiorMm(p), nome).toBeCloseTo(
                apoioBase.raioApoioInferiorMm(params),
                6
              );
            } else {
              // Base removida: a peça reassenta na seção do corte.
              expect(
                apoio.raioApoioInferiorMm(p),
                `${nome}: base = platô do corte`
              ).toBeCloseTo(platoDoCorte, 6);
              expect(apoio.zSuperficieBaseMm(p, 0), `${nome}: base plana`).toBe(
                0
              );
              expect(
                apoio.raioApoioSuperiorMm(p),
                `${nome}: topo intacto`
              ).toBeCloseTo(apoioBase.raioApoioSuperiorMm(params), 6);
            }

            // Envelope: nunca menor que o raio REAL da malha em cada cota.
            for (let i = 0; i < malha.posicoes.length; i += 3) {
              const r = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
              const env = apoio.raioEnvelopeMm(p, malha.posicoes[i + 2]);
              expect(
                r - env,
                `${nome}: envelope ≥ raio real em z=${malha.posicoes[i + 2].toFixed(2)}`
              ).toBeLessThanOrEqual(FOLGA_FACETACAO_MM);
            }
          }
        }
      }
    }
  }, 300_000);

  it("corte em X/Y: pouso só até o raio seguro; envelope inalterado", () => {
    for (const forma of FORMAS_BLOCO) {
      const apoio = apoioComFatia(PRIMITIVOS_BLOCO[forma].apoio);
      for (const id of variacoesApoio) {
        const variacao = VARIACOES_BLOCO.find((v) => v.id === id)!;
        const params = blocoDaVariacao(variacao, forma);
        const inteira = PRIMITIVOS_BLOCO[forma].gerarMalha(params);
        for (const eixo of ["x", "y"] as const) {
          for (const posicaoMm of posicoesDaFaixa(params, eixo)) {
            for (const lado of ["menor", "maior"] as const) {
              const p = comFatia(params, eixo, posicaoMm, lado);
              const malha = fatiarMalhaBloco(inteira, p);
              const caixa = caixaEnvolvente(malha);
              const nome = `${forma}/${id}/${eixo} ${lado} @${posicaoMm.toFixed(1)}`;
              // O eixo do bloco sobreviveu ao corte?
              const eixoFica =
                lado === "menor" ? posicaoMm >= 0 : posicaoMm <= 0;
              const raioSeguro = eixoFica ? Math.abs(posicaoMm) : 0;

              expect(
                apoio.raioApoioSuperiorMm(p),
                `${nome}: apoio ≤ raio seguro`
              ).toBeLessThanOrEqual(raioSeguro + 1e-9);
              // Além do raio seguro o material não sobrevive em TODAS as
              // direções: o modelo radial devolve null (conservador).
              for (const fator of [1.001, 1.2, 2]) {
                expect(
                  apoio.zSuperficieTopoMm(p, raioSeguro * fator + 0.01),
                  `${nome}: pouso além do raio seguro`
                ).toBeNull();
              }
              if (!eixoFica) {
                // O corte levou o próprio eixo: não há pouso nenhum.
                expect(
                  apoio.zSuperficieTopoMm(p, 0),
                  `${nome}: sem pouso`
                ).toBeNull();
                expect(apoio.raioApoioSuperiorMm(p), nome).toBe(0);
              }
              // Nunca promete topo acima do real (nada flutua).
              expect(
                apoio.alturaTopoMm(p) - caixa.maxZ,
                `${nome}: topo real`
              ).toBeLessThanOrEqual(FOLGA_FACETACAO_MM);
              // Envelope lateral inalterado: ≥ o raio real em cada cota.
              for (let i = 0; i < malha.posicoes.length; i += 3) {
                const r = Math.hypot(malha.posicoes[i], malha.posicoes[i + 1]);
                const env = apoio.raioEnvelopeMm(p, malha.posicoes[i + 2]);
                expect(
                  r - env,
                  `${nome}: envelope ≥ raio real em z=${malha.posicoes[i + 2].toFixed(2)}`
                ).toBeLessThanOrEqual(FOLGA_FACETACAO_MM);
              }
            }
          }
        }
      }
    }
  }, 300_000);

  it("sem fatia, o apoio composto é o apoio da forma", () => {
    for (const forma of FORMAS_BLOCO) {
      const base = PRIMITIVOS_BLOCO[forma].apoio;
      const apoio = apoioComFatia(base);
      for (const variacao of VARIACOES_BLOCO) {
        const p = blocoDaVariacao(variacao, forma);
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
