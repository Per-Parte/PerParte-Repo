/**
 * Montagem v2 · F1 — primitivo CILINDRO.
 *
 * ⚑ casca.ts: este arquivo é a cópia-MÃE da "receita única" do furo
 * (contorno do polígono, zíper ordenado por ângulo, túnel e inversão de
 * trios) copiada por esfera.ts, cubo.ts e piramide.ts — extrair para um
 * casca.ts compartilhado na consolidação, sem mudar comportamento.
 *
 * Receita de topologia (espec da F1, seção "cilindro"):
 * — PURA: malhaRevolucao do perfil retangular (pé no raio, sobe, fecha no
 *   eixo em cima e embaixo pelos ápices) — o caminho de todo o núcleo.
 * — OCA: borda ABERTA em cima (espec §4 — "oca (borda aberta em cima)"):
 *   parede externa de z = 0 a z = H com FUNDO FECHADO (restrição honesta
 *   da F1: a abertura de encaixe do ponto de luz é fase posterior ⚑),
 *   cavidade invertida (piso em leque em zPiso + parede θ × z de zPiso a
 *   H) e um ANEL plano de quads em z = H ligando a borda externa à
 *   interna (largura = parede) — topo de parede vertical, ZERO ponte, e
 *   a luz sai por cima. A revisão de 06/08 derrubou os tetos fechados
 *   (cone/pirâmide truncados): viravam placa-ponte acima do teto de
 *   ponte do FDM e contrariavam a espec.
 * — FUROS: é o "cubo enrolado" — receita única do furo na grade (θ, z) da
 *   lateral: cada furo reserva um bloco retangular inteiro de células
 *   (tamanho do furo + 1 célula de moldura), o contorno do furo é um
 *   polígono em espaço de parâmetro (○ M = 16, □ M = 8, △ M = 6 com o
 *   vértice para CIMA), a borda do bloco costura no polígono como cinta
 *   ordenada por ângulo ("zipper") e um anel de M quads liga o polígono
 *   externo ao interno — o túnel RADIAL de parede.
 * — BORDA ENCURVADA (pedidos do Davi, 06/08 e 07/08): as faixas das
 *   extremidades viram ARCOS (blocos/borda.ts) — no TOPO abre como aba de
 *   abajur ("fora") ou fecha como lábio ("dentro"); no FUNDO abre como pé
 *   de cálice ("fora") ou recolhe como barriga ("dentro"). As duas podem
 *   coexistir (clamps de limites.ts garantem lateral reta no meio). Como o
 *   cilindro descreve a planta por "raio em função de z", cada arco entra
 *   como OFFSET radial somado a esse raio — o offset total é a SOMA dos
 *   dois (as faixas nunca se sobrepõem) — nas DUAS paredes da oca, para a
 *   espessura ficar constante e o anel do topo continuar ligando as duas
 *   (agora deslocado). Na pura o perfil da revolução ganha os pontos do
 *   arco do fundo no começo (antes do pé reto) e os do topo no fim. A
 *   TAMPA da base continua plana em z = 0, no raio deslocado — quem
 *   encurva é a lateral.
 *
 * Convenções do núcleo (malha.ts): mm; Z é a vertical de impressão (F8);
 * origem no eixo com base em z = 0; enrolamento anti-horário visto de
 * fora (volumeAssinadoMm3 > 0). Estanqueidade por ÍNDICE: vértices são
 * COMPARTILHADOS entre células vizinhas — nunca duplicados numa costura.
 *
 * gerarMalhaCilindro assume params já grampeados (grampearBloco antes).
 */

import { malhaRevolucao } from "../malha";
import { anguloBordaRad, arcoBorda } from "./borda";
import type {
  ApoioBloco,
  FormaFuro,
  MalhaBloco,
  ParametrosBloco,
  PosicaoBorda,
  PrimitivoBloco,
} from "./tipos";
import {
  MOLDURA_FURO_MM,
  TIRA_BANDA_MM,
  alturaBrutaMm,
  grampearBloco,
  larguraBrutaMm,
} from "./limites";

const DOIS_PI = Math.PI * 2;

/** Mesmo piso de raio no eixo da geometria do núcleo (geometria.ts). */
const RAIO_EIXO_MM = 0.6;

/** Passo-alvo das linhas z da grade da casca oca, em mm. */
const PASSO_LINHA_MM = 4;

/**
 * Passo-alvo (⚑) e piso de segmentos das linhas de grade DENTRO da faixa
 * do arco da borda: a borda é a silhueta que o cliente vê de perto, e com
 * 2 segmentos a curva sairia facetada.
 */
const PASSO_LINHA_BORDA_MM = 1.5;
const SEGMENTOS_MINIMOS_BORDA = 8;

/** Raio externo com o mesmo piso de eixo da malha — helper único. */
function raioExternoMm(p: ParametrosBloco): number {
  return Math.max(RAIO_EIXO_MM * 2, larguraBrutaMm(p) / 2);
}

/**
 * Raio da boca/cavidade da casca oca — a MESMA conta da malha, usada
 * pelo apoio (assentamento e raiosNotaveisMm nunca podem divergir da
 * geometria real).
 */
function raioInternoMm(p: ParametrosBloco): number {
  return Math.max(RAIO_EIXO_MM * 2, raioExternoMm(p) - p.espessuraParedeMm);
}

/** Cota do piso da cavidade da casca oca. */
function zPisoMm(p: ParametrosBloco): number {
  return Math.min(p.espessuraParedeMm, alturaBrutaMm(p) / 3);
}

/**
 * O arco da borda deste cilindro (topo OU fundo) com o offset já
 * GRAMPEADO à geometria — fonte única da malha E do apoio (o apoio tem de
 * dizer a verdade sobre a malha real). Cinto de segurança: se o offset
 * para DENTRO comesse o raio inteiro (ou a parede interna da casca), o
 * offset trunca no que sobra, deixando um piso de material (~RAIO_EIXO_MM)
 * — clamp geométrico, nunca erro. bordaTamanhoMaxMm (limites.ts) já evita
 * isso no caso normal, nas duas posições.
 */
function bordaCilindro(
  p: ParametrosBloco,
  alturaTotalMm: number,
  posicao: PosicaoBorda = "topo"
) {
  const arco = arcoBorda(p, alturaTotalMm, posicao);
  // O raio que aperta primeiro é o da boca quando oca (a parede desliza
  // inteira: as duas superfícies levam o MESMO offset).
  const menorRaio = p.oca ? raioInternoMm(p) : raioExternoMm(p);
  const pisoOffset = -Math.max(0, menorRaio - RAIO_EIXO_MM);
  const limitar = (o: number) => (o < pisoOffset ? pisoOffset : o);
  return {
    alturaMm: arco.alturaMm,
    offsetTopoMm: limitar(arco.offsetTopoMm),
    offsetEmMm: (zMm: number) => limitar(arco.offsetEmMm(zMm)),
    // Inverso do arco CRU: só é consultado com offsets de magnitude ≤ a que
    // sobrou depois do truncamento, onde os dois coincidem.
    zDoOffsetMm: (offsetMm: number) => arco.zDoOffsetMm(offsetMm),
  };
}

type BordaCilindro = ReturnType<typeof bordaCilindro>;

/**
 * Cotas z das linhas de grade DENTRO da faixa do arco, ascendentes — a
 * linha que a grade do corpo JÁ tem fica de fora (o pé da faixa no topo;
 * a base z = 0 no fundo) e a última é a outra ponta EXATA (o topo do
 * bloco; o pé da faixa do fundo). Amostra em passos iguais de ÂNGULO do
 * arco (usando o inverso zDoOffsetMm, sem refazer a conta do arco):
 * comprimento de arco constante deixa a curva lisa nas duas pontas — em z
 * uniforme, o último segmento de um arco de 90° (cúpula convergente,
 * sólida) daria um salto grosseiro de raio.
 */
function linhasBordaMm(
  p: ParametrosBloco,
  alturaTotalMm: number,
  borda: BordaCilindro,
  posicao: PosicaoBorda = "topo"
): number[] {
  const parametros = posicao === "topo" ? p.bordaTopo : p.bordaFundo;
  if (borda.alturaMm <= 0 || !parametros) return [];
  const theta = anguloBordaRad(posicao, parametros.sentido, p.oca);
  const senTheta = Math.sin(theta);
  const versseno = 1 - Math.cos(theta);
  if (senTheta <= 0 || versseno <= 0) return [];
  // comprimento = R·θ, com R tirado da altura da faixa (R·sen θ).
  const comprimento = (borda.alturaMm / senTheta) * theta;
  const segmentos = Math.max(
    SEGMENTOS_MINIMOS_BORDA,
    Math.ceil(comprimento / PASSO_LINHA_BORDA_MM)
  );
  // A linha final exata: o topo do bloco (faixa do topo) ou o pé da faixa
  // (fundo — a extremidade z = 0 já é a linha da base).
  const zFinal = posicao === "topo" ? alturaTotalMm : borda.alturaMm;
  const zs: number[] = [];
  for (let k = 1; k < segmentos; k++) {
    const offset =
      (borda.offsetTopoMm * (1 - Math.cos((theta * k) / segmentos))) / versseno;
    const z = borda.zDoOffsetMm(offset);
    if (z == null) continue;
    if (z > 1e-6 && z < zFinal - 1e-6) zs.push(z);
  }
  // No fundo o inverso devolve z DECRESCENTE com o ângulo — ordena e
  // deduplica para a grade sempre subir.
  zs.sort((a, b) => a - b);
  const unicas = zs.filter((z, i) => i === 0 || z > zs[i - 1] + 1e-6);
  unicas.push(zFinal);
  return unicas;
}

export const apoioCilindro: ApoioBloco = {
  // As bordas encurvam as faixas das extremidades mas nunca mudam a ALTURA.
  alturaTopoMm: (p) => alturaBrutaMm(p),
  // O platô do topo é o raio do TOPO: maior com a borda para fora (aba),
  // menor com a borda para dentro (lábio).
  raioApoioSuperiorMm: (p) => raioTopoCilindroMm(p),
  // A base REAL: com fundo para fora ela alarga (pé de cálice); para
  // dentro encolhe (barriga) — a tampa plana de z = 0 vive nesse raio.
  raioApoioInferiorMm: (p) => raioBaseCilindroMm(p),
  raioEnvelopeMm(p, zMm) {
    const alturaTotal = alturaBrutaMm(p);
    if (zMm < 0 || zMm > alturaTotal) return 0;
    // Dentro das faixas dos arcos a silhueta é a dos arcos (planta
    // redonda: o envelope É o raio da seção) — o offset total é a SOMA
    // dos dois (as faixas nunca se sobrepõem; fora delas cada um é 0).
    return (
      raioExternoMm(p) +
      bordaCilindro(p, alturaTotal, "topo").offsetEmMm(zMm) +
      bordaCilindro(p, alturaTotal, "fundo").offsetEmMm(zMm)
    );
  },
  zSuperficieTopoMm(p, dMm) {
    const alturaTotal = alturaBrutaMm(p);
    const bordaDoTopo = bordaCilindro(p, alturaTotal, "topo");
    const bordaDoFundo = bordaCilindro(p, alturaTotal, "fundo");
    const raioCorpo = raioExternoMm(p);
    const raioTopo = raioCorpo + bordaDoTopo.offsetTopoMm;
    const raioBase = raioCorpo + bordaDoFundo.offsetTopoMm;
    if (dMm > Math.max(raioCorpo, raioTopo, raioBase)) return null;
    if (p.oca) {
      const raioBoca = raioInternoMm(p);
      const raioBocaTopo = raioBoca + bordaDoTopo.offsetTopoMm;
      const zPiso = zPisoMm(p);
      // Gargalo do fundo para DENTRO: quando a faixa do fundo passa de
      // zPiso, a cavidade afunila e o raio interno NO PISO é o deslocado.
      const raioBocaPiso = raioBoca + bordaDoFundo.offsetEmMm(zPiso);
      // Borda aberta (espec §4): quem passa pela cavidade INTEIRA assenta
      // no piso dela.
      if (dMm <= Math.min(raioBoca, raioBocaTopo, raioBocaPiso)) return zPiso;
      // Passou pela boca mas não pelo gargalo: pousa no FUNIL do arco do
      // fundo (a parede interna da barriga olha para cima).
      if (
        bordaDoFundo.offsetTopoMm < 0 &&
        dMm <= Math.min(raioBoca, raioBocaTopo)
      ) {
        return bordaDoFundo.zDoOffsetMm(dMm - raioBoca) ?? zPiso;
      }
      // Borda do topo para FORA: a boca ABRE com z, e a parede interna do
      // arco é uma rampa que sobe — quem não passa pela boca de baixo
      // pousa nela.
      if (bordaDoTopo.offsetTopoMm > 0 && dMm < raioBocaTopo) {
        return bordaDoTopo.zDoOffsetMm(dMm - raioBoca) ?? alturaTotal;
      }
    }
    // Platô do topo (disco da pura, anel da oca) — agora deslocado.
    if (dMm <= raioTopo) return alturaTotal;
    // Borda do topo para DENTRO: entre o raio do topo e o do corpo a
    // superfície é o ARCO (o lábio olha para cima). O inverso do arco dá
    // a cota exata de assentamento.
    if (dMm <= raioCorpo) {
      return bordaDoTopo.zDoOffsetMm(dMm - raioCorpo) ?? alturaTotal;
    }
    // Só sobra o pé de cálice (fundo para FORA): entre o corpo e a base a
    // superfície de CIMA é o arco do fundo, descendo até a mesa.
    return bordaDoFundo.zDoOffsetMm(dMm - raioCorpo) ?? 0;
  },
  zSuperficieBaseMm(p, dMm) {
    const alturaTotal = alturaBrutaMm(p);
    const bordaDoFundo = bordaCilindro(p, alturaTotal, "fundo");
    const raioCorpo = raioExternoMm(p);
    const raioBase = raioCorpo + bordaDoFundo.offsetTopoMm;
    if (dMm > Math.max(raioCorpo, raioBase)) return null;
    // A TAMPA continua plana em z = 0, no raio deslocado da base.
    if (dMm <= Math.min(raioCorpo, raioBase)) return 0;
    // Fundo para FORA: a base ALARGA e o arco viceja ACIMA dela — a
    // superfície de baixo é a tampa até o raio da base.
    if (bordaDoFundo.offsetTopoMm > 0) return 0;
    // Fundo para DENTRO: entre a base (menor) e o corpo a superfície de
    // baixo é o ARCO da barriga (ela olha para baixo) — o inverso do arco
    // dá a cota da superfície inferior naquela distância.
    return bordaDoFundo.zDoOffsetMm(dMm - raioCorpo) ?? 0;
  },
  // Degraus da superfície superior: a boca da casca aberta (embaixo e no
  // topo, quando a borda do topo a desloca; o gargalo do funil do fundo),
  // a QUINA do raio do topo onde o platô acaba, e as duas quinas do pé de
  // cálice (tangencia.ts amostra estes raios exatos).
  raiosNotaveisMm(p) {
    const alturaTotal = alturaBrutaMm(p);
    const bordaDoTopo = bordaCilindro(p, alturaTotal, "topo");
    const bordaDoFundo = bordaCilindro(p, alturaTotal, "fundo");
    const raios: number[] = [];
    if (p.oca) {
      raios.push(raioInternoMm(p));
      if (bordaDoTopo.offsetTopoMm !== 0) {
        raios.push(raioInternoMm(p) + bordaDoTopo.offsetTopoMm);
      }
      // Gargalo do funil (fundo para dentro passando de zPiso): o degrau
      // piso → funil da superfície superior.
      const offsetPiso = bordaDoFundo.offsetEmMm(zPisoMm(p));
      if (offsetPiso !== 0) raios.push(raioInternoMm(p) + offsetPiso);
    }
    if (bordaDoTopo.alturaMm > 0) {
      raios.push(raioExternoMm(p) + bordaDoTopo.offsetTopoMm);
    }
    if (bordaDoFundo.offsetTopoMm > 0) {
      // Pé de cálice: o platô/lábio de cima acaba na quina do corpo, e a
      // aba do fundo termina no raio da base — dois degraus de cima.
      raios.push(raioExternoMm(p), raioExternoMm(p) + bordaDoFundo.offsetTopoMm);
    }
    return raios;
  },
  // Planta redonda: o raio inscrito da seção É o raio dela — medido no
  // contorno EXTERNO (a fatia expõe a casca inteira; todo bloco da F1 tem
  // fundo fechado e o corte assenta sobre o anel), com os offsets dos DOIS
  // arcos dentro das faixas. Em z = 0 isto é o raio da BASE real — é o que
  // a regra de base estável (base-estavel.ts) lê para reagir ao fundo
  // recolhido sozinha.
  raioPlatoMm(p, zMm) {
    const alturaTotal = alturaBrutaMm(p);
    if (zMm < 0 || zMm > alturaTotal) return 0;
    return (
      raioExternoMm(p) +
      bordaCilindro(p, alturaTotal, "topo").offsetEmMm(zMm) +
      bordaCilindro(p, alturaTotal, "fundo").offsetEmMm(zMm)
    );
  },
};

/** Raio externo no TOPO do bloco — com a borda, o raio do fim do arco. */
function raioTopoCilindroMm(p: ParametrosBloco): number {
  const alturaTotal = alturaBrutaMm(p);
  return raioExternoMm(p) + bordaCilindro(p, alturaTotal, "topo").offsetTopoMm;
}

/** Raio externo na BASE do bloco — com borda de fundo, o arco em z = 0. */
function raioBaseCilindroMm(p: ParametrosBloco): number {
  const alturaTotal = alturaBrutaMm(p);
  return raioExternoMm(p) + bordaCilindro(p, alturaTotal, "fundo").offsetTopoMm;
}

/** Ponto no espaço de parâmetro da lateral (a = arco em mm, b = z em mm). */
interface PontoParam {
  a: number;
  b: number;
}

/** Contorno fechado, ordenado por ângulo ao redor do centro do furo. */
interface ContornoAnel {
  indices: number[];
  angulos: number[];
}

/**
 * Colunas da grade θ: múltiplas de 4 × furos, para os centros dos furos
 * caírem exatamente em coluna, os pontos cardeais (±X, ±Y) existirem
 * (a caixa envolvente bate com tamanho × escala) e cada setor ter pelo
 * menos 12 células (espaço para furo + moldura + parede).
 */
function segmentosGrade(segmentos: number, quantidadeFuros: number): number {
  const bloco = 4 * Math.max(1, Math.round(quantidadeFuros));
  return bloco * Math.max(Math.ceil(Math.max(8, segmentos) / bloco), 3);
}

/**
 * Contorno do furo em espaço de parâmetro local, centrado na caixa do
 * próprio polígono — a receita única da F1: ○ M = 16; □ M = 8 (4 cantos
 * + 4 meios de aresta; teto reto vira ponte ≤ FURO_PONTE_MAX_MM ⚑);
 * △ M = 6 (3 cantos + 3 meios), SEMPRE com o vértice para CIMA (arestas
 * a ~30° da vertical: F4 de graça).
 */
function contornoFuroMm(forma: FormaFuro, tamanhoMm: number): PontoParam[] {
  const metade = tamanhoMm / 2;
  let pontos: PontoParam[];
  if (forma === "circulo") {
    pontos = [];
    for (let m = 0; m < 16; m++) {
      const fi = (m / 16) * DOIS_PI;
      pontos.push({ a: metade * Math.cos(fi), b: metade * Math.sin(fi) });
    }
  } else if (forma === "quadrado") {
    pontos = [
      { a: metade, b: 0 },
      { a: metade, b: metade },
      { a: 0, b: metade },
      { a: -metade, b: metade },
      { a: -metade, b: 0 },
      { a: -metade, b: -metade },
      { a: 0, b: -metade },
      { a: metade, b: -metade },
    ];
  } else {
    const altura = (tamanhoMm * Math.sqrt(3)) / 2;
    const topo: PontoParam = { a: 0, b: (2 * altura) / 3 };
    const esquerda: PontoParam = { a: -metade, b: -altura / 3 };
    const direita: PontoParam = { a: metade, b: -altura / 3 };
    const meio = (q: PontoParam, r: PontoParam): PontoParam => ({
      a: (q.a + r.a) / 2,
      b: (q.b + r.b) / 2,
    });
    pontos = [
      topo,
      meio(topo, esquerda),
      esquerda,
      meio(esquerda, direita),
      direita,
      meio(direita, topo),
    ];
  }
  // Recentra pela caixa (o baricentro do △ não é o centro da caixa):
  // o bloco recortado fica simétrico ao redor do centro do furo.
  let aMin = Infinity;
  let aMax = -Infinity;
  let bMin = Infinity;
  let bMax = -Infinity;
  for (const q of pontos) {
    aMin = Math.min(aMin, q.a);
    aMax = Math.max(aMax, q.a);
    bMin = Math.min(bMin, q.b);
    bMax = Math.max(bMax, q.b);
  }
  const ca = (aMin + aMax) / 2;
  const cb = (bMin + bMax) / 2;
  return pontos.map((q) => ({ a: q.a - ca, b: q.b - cb }));
}

/** Ordena vértices por ângulo ao redor do centro, começando no menor ≥ 0. */
function ordenarPorAngulo(
  itens: { indice: number; a: number; b: number }[]
): ContornoAnel {
  const ordenados = itens
    .map((q) => {
      let ang = Math.atan2(q.b, q.a);
      if (ang < 0) ang += DOIS_PI;
      return { indice: q.indice, ang };
    })
    .sort((x, y) => x.ang - y.ang);
  return {
    indices: ordenados.map((q) => q.indice),
    angulos: ordenados.map((q) => q.ang),
  };
}

/**
 * Costura do anel (borda do bloco recortado → polígono do furo): cinta
 * monotônica em ângulo ("zipper"). Ambos os contornos são estrela-convexos
 * em relação ao centro do furo → a cinta nunca se cruza. Determinístico:
 * os dois começam no vértice de menor ângulo ≥ 0. Triângulos anti-horários
 * no espaço de parâmetro (θ crescente, z crescente) = normais para fora.
 */
function costurarAnel(
  destino: number[],
  fora: ContornoAnel,
  dentro: ContornoAnel
): void {
  const nA = fora.indices.length;
  const nB = dentro.indices.length;
  let i = 0;
  let j = 0;
  for (let passo = 0; passo < nA + nB; passo++) {
    const proximoA =
      i >= nA
        ? Infinity
        : i + 1 < nA
          ? fora.angulos[i + 1]
          : fora.angulos[0] + DOIS_PI;
    const proximoB =
      j >= nB
        ? Infinity
        : j + 1 < nB
          ? dentro.angulos[j + 1]
          : dentro.angulos[0] + DOIS_PI;
    if (i < nA && proximoA <= proximoB) {
      destino.push(
        fora.indices[i % nA],
        fora.indices[(i + 1) % nA],
        dentro.indices[j % nB]
      );
      i++;
    } else {
      destino.push(
        dentro.indices[(j + 1) % nB],
        dentro.indices[j % nB],
        fora.indices[i % nA]
      );
      j++;
    }
  }
}

/** Plano dos furos: polígono (já grampeado à geometria) + blocos na grade. */
interface PlanoFuros {
  pontos: PontoParam[];
  zCentro: number;
  zBlocoBaixo: number;
  zBlocoAlto: number;
  blocos: { thetaCentro: number; colEsq: number; colDir: number }[];
}

/**
 * Cascata geométrica dos furos — clamp, nunca erro: o grampeador já
 * garante furo ≤ furoMaximoMm; aqui só sobram ajustes finos de grade
 * (célula inteira, moldura, tira) que em caso extremo encolhem o furo
 * em vez de falhar. null = nem o furo raso coube (gera sem furos).
 */
function planejarFuros(
  p: ParametrosBloco,
  raioExterno: number,
  nColunas: number,
  zPiso: number,
  zTetoMax: number,
  zAlvoMm: number
): PlanoFuros | null {
  const furos = p.furos;
  if (!furos || furos.quantidade < 1) return null;
  const n = Math.max(1, Math.round(furos.quantidade));
  const base = contornoFuroMm(furos.forma, furos.tamanhoMm);
  let meiaA = 0;
  let meiaB = 0;
  for (const q of base) {
    meiaA = Math.max(meiaA, Math.abs(q.a));
    meiaB = Math.max(meiaB, Math.abs(q.b));
  }

  // Altura: furos centrados na altura média (H/2), deslocados só quando
  // a banda não alcança; se nem encolhido cabe, o cilindro sai sem furos.
  let escalaB = 1;
  let zcMin = zPiso + meiaB + MOLDURA_FURO_MM + TIRA_BANDA_MM;
  let zcMax = zTetoMax - meiaB - MOLDURA_FURO_MM - TIRA_BANDA_MM;
  if (zcMin > zcMax) {
    const cabeMeia = (zTetoMax - zPiso) / 2 - MOLDURA_FURO_MM - TIRA_BANDA_MM;
    if (cabeMeia < 1) return null;
    escalaB = cabeMeia / meiaB;
    zcMin = (zPiso + zTetoMax) / 2;
    zcMax = zcMin;
  }
  const zCentro = Math.min(Math.max(zAlvoMm, zcMin), zcMax);

  // Arco: bloco inteiro de células ao redor do centro (furo + 1 célula de
  // moldura), sem nunca engolir a parede entre furos vizinhos.
  const arcoCelula = (DOIS_PI / nColunas) * raioExterno;
  const colunasPorFuro = nColunas / n; // inteiro e par, por construção
  const tetoMeiaColunas = Math.floor((colunasPorFuro - 1) / 2);
  const meiaColunas = Math.min(
    Math.ceil(meiaA / arcoCelula) + 1,
    tetoMeiaColunas
  );
  if (meiaColunas < 1) return null;
  const meiaArcoMax = meiaColunas * arcoCelula - 0.5;
  const escalaA = Math.min(1, meiaArcoMax / meiaA);
  if (escalaA <= 0) return null;

  const pontos = base.map((q) => ({ a: q.a * escalaA, b: q.b * escalaB }));
  const meiaBFinal = meiaB * escalaB;
  const blocos: PlanoFuros["blocos"] = [];
  for (let k = 0; k < n; k++) {
    // Centros igualmente espaçados em θ, fora da costura θ = 0.
    const centro = k * colunasPorFuro + colunasPorFuro / 2;
    blocos.push({
      thetaCentro: (centro / nColunas) * DOIS_PI,
      colEsq: centro - meiaColunas,
      colDir: centro + meiaColunas,
    });
  }
  return {
    pontos,
    zCentro,
    zBlocoBaixo: zCentro - meiaBFinal - MOLDURA_FURO_MM,
    zBlocoAlto: zCentro + meiaBFinal + MOLDURA_FURO_MM,
    blocos,
  };
}

/**
 * Casca oca de borda ABERTA (com ou sem furos): parede externa z = 0 → H
 * com fundo fechado, cavidade invertida (piso em zPiso + parede θ × z de
 * zPiso a H) e anel plano em z = H ligando as duas bordas — topo de
 * parede, sem ponte. As duas laterais usam a MESMA grade (θ, z) na banda
 * — os furos recortam células idênticas nas duas e o túnel liga os anéis.
 */
function malhaCilindroOco(
  p: ParametrosBloco,
  raioExterno: number,
  alturaTotal: number,
  segmentos: number
): MalhaBloco {
  const raioInterno = raioInternoMm(p);
  const zPiso = zPisoMm(p);
  const bordaDoTopo = bordaCilindro(p, alturaTotal, "topo");
  const bordaDoFundo = bordaCilindro(p, alturaTotal, "fundo");
  // O offset radial total numa cota z: a SOMA dos dois arcos (as faixas
  // nunca se sobrepõem — fora de cada faixa o offset dela é 0).
  const offsetTotalMm = (zMm: number) =>
    bordaDoTopo.offsetEmMm(zMm) + bordaDoFundo.offsetEmMm(zMm);
  // Pé da faixa do arco do topo: acima dele a parede deixa de ser vertical.
  const zPeBorda = alturaTotal - bordaDoTopo.alturaMm;
  // A banda dos furos vive entre o TETO da faixa do fundo e o PÉ da faixa
  // do topo (nenhuma faixa de arco hospeda furo — furoMaximoMm já desconta
  // as duas no clamp; esta é a MESMA conta).
  const zPisoBanda = Math.max(zPiso, bordaDoFundo.alturaMm);
  const zTetoMax = Math.min(alturaTotal - zPiso, zPeBorda);

  const nColunas = segmentosGrade(segmentos, p.furos?.quantidade ?? 0);
  const plano = planejarFuros(
    p,
    raioExterno,
    nColunas,
    zPisoBanda,
    zTetoMax,
    alturaTotal / 2
  );

  // Linhas do arco do FUNDO: abaixo do piso da cavidade só a parede
  // externa existe (viram um prefixo próprio da grade externa); de zPiso
  // ao pé da faixa as DUAS paredes acompanham o arco (linhas
  // compartilhadas — é assim que o raio interno NO PISO sai deslocado
  // quando a faixa do fundo passa de zPiso). A linha do pé da faixa é
  // EXATA (última de linhasBordaMm); a extremidade z = 0 já é a base.
  const linhasDoFundo = linhasBordaMm(p, alturaTotal, bordaDoFundo, "fundo");
  const linhasFundoExternas = linhasDoFundo.filter((z) => z < zPiso - 1e-6);
  const linhasFundoComuns = linhasDoFundo.filter((z) => z > zPiso + 1e-6);

  // Linhas z da banda compartilhada (zPiso → H; a ÚLTIMA linha é H exato
  // nas duas paredes — é ela que o anel da borda costura); as bordas do
  // bloco do furo são linhas EXATAS da grade (célula inteira).
  const linhas: number[] = [zPiso, ...linhasFundoComuns];
  const preencherAte = (ate: number, passoMm = PASSO_LINHA_MM): number => {
    const de = linhas[linhas.length - 1];
    const passos = Math.max(1, Math.ceil((ate - de) / passoMm));
    for (let t = 1; t < passos; t++) {
      linhas.push(de + (t * (ate - de)) / passos);
    }
    linhas.push(ate);
    return linhas.length - 1;
  };
  let linhaBlocoBaixo = -1;
  let linhaBlocoAlto = -1;
  if (plano) {
    linhaBlocoBaixo = preencherAte(plano.zBlocoBaixo);
    preencherAte(plano.zCentro);
    linhaBlocoAlto = preencherAte(plano.zBlocoAlto);
  }
  // A faixa do arco do TOPO ganha linhas próprias, mais finas — o PÉ
  // (zPeBorda) e o TOPO (alturaTotal) são linhas EXATAS da grade, senão a
  // curva sairia facetada em dois segmentos.
  const linhasDaBorda = linhasBordaMm(p, alturaTotal, bordaDoTopo, "topo");
  if (linhasDaBorda.length > 0 && zPeBorda > linhas[linhas.length - 1] + 1e-6) {
    preencherAte(zPeBorda);
    for (const z of linhasDaBorda) linhas.push(z);
  } else {
    preencherAte(alturaTotal);
  }

  // ---- vértices (compartilhados por índice; a costura nunca duplica) ----
  const posicoes: number[] = [];
  const vertice = (x: number, y: number, z: number): number => {
    posicoes.push(x, y, z);
    return posicoes.length / 3 - 1;
  };
  const cossenos: number[] = [];
  const senos: number[] = [];
  for (let i = 0; i < nColunas; i++) {
    const th = (i / nColunas) * DOIS_PI;
    cossenos.push(Math.cos(th));
    senos.push(Math.sin(th));
  }
  const anel = (r: number, z: number): number[] => {
    const ids: number[] = [];
    for (let i = 0; i < nColunas; i++) {
      ids.push(vertice(r * cossenos[i], r * senos[i], z));
    }
    return ids;
  };
  // As DUAS paredes recebem o MESMO offset total na cota z: a espessura
  // fica constante, o anel do topo continua ligando as duas e o piso da
  // cavidade sai no raio deslocado quando a faixa do fundo o alcança. A
  // grade externa tem um prefixo só dela: a base (z = 0) e as linhas do
  // arco do fundo abaixo do piso da cavidade.
  const linhasExternas = [0, ...linhasFundoExternas, ...linhas];
  const prefixoExterno = 1 + linhasFundoExternas.length;
  const gradeExterna = linhasExternas.map((z) =>
    anel(raioExterno + offsetTotalMm(z), z)
  );
  const gradeInterna = linhas.map((z) =>
    anel(raioInterno + offsetTotalMm(z), z)
  );

  // ---- triângulos ----
  const externos: number[] = [];
  // A cavidade é construída com o enrolamento de um SÓLIDO (normais para
  // fora dela) e invertida por inteiro no fim — winding invertido.
  const internos: number[] = [];
  const quad = (
    destino: number[],
    a: number,
    b: number,
    c: number,
    d: number
  ) => {
    destino.push(a, b, c, a, c, d);
  };
  const celulaRemovida = (i: number, linha: number): boolean => {
    if (!plano || linha < linhaBlocoBaixo || linha >= linhaBlocoAlto) {
      return false;
    }
    for (const b of plano.blocos) {
      if (i >= b.colEsq && i < b.colDir) return true;
    }
    return false;
  };

  // Parede externa (z = 0 → H); na banda, células dos blocos ficam de fora
  // (o índice da grade interna correspondente desconta o prefixo externo).
  for (let j = 0; j < linhasExternas.length - 1; j++) {
    for (let i = 0; i < nColunas; i++) {
      if (j >= prefixoExterno && celulaRemovida(i, j - prefixoExterno)) continue;
      const i2 = (i + 1) % nColunas;
      quad(
        externos,
        gradeExterna[j][i],
        gradeExterna[j][i2],
        gradeExterna[j + 1][i2],
        gradeExterna[j + 1][i]
      );
    }
  }

  // Fundo externo SEMPRE fechado na F1 (abertura de encaixe do ponto de
  // luz é fase posterior ⚑) — a TAMPA é plana em z = 0, no raio deslocado
  // pelo arco do fundo (quem encurva é a lateral).
  const centroBase = vertice(0, 0, 0);
  const anelBase = gradeExterna[0];
  for (let i = 0; i < nColunas; i++) {
    const i2 = (i + 1) % nColunas;
    externos.push(centroBase, anelBase[i2], anelBase[i]);
  }

  // Borda ABERTA em cima (espec §4): anel plano de quads em z = H ligando
  // a borda externa à interna (largura = parede) — normais +Z, topo de
  // parede vertical, ponte nenhuma. Compartilha os vértices do topo das
  // duas paredes: estanque por índice.
  const anelTopoExterno = gradeExterna[gradeExterna.length - 1];
  const anelTopoInterno = gradeInterna[gradeInterna.length - 1];
  for (let i = 0; i < nColunas; i++) {
    const i2 = (i + 1) % nColunas;
    quad(
      externos,
      anelTopoExterno[i],
      anelTopoExterno[i2],
      anelTopoInterno[i2],
      anelTopoInterno[i]
    );
  }

  // Parede da cavidade: cópia da grade deslocada para dentro, mesmo
  // recorte de células (receita única do furo, item 6 da espec).
  for (let j = 0; j < linhas.length - 1; j++) {
    for (let i = 0; i < nColunas; i++) {
      if (celulaRemovida(i, j)) continue;
      const i2 = (i + 1) % nColunas;
      quad(
        internos,
        gradeInterna[j][i],
        gradeInterna[j][i2],
        gradeInterna[j + 1][i2],
        gradeInterna[j + 1][i]
      );
    }
  }

  // Piso da cavidade (leque no eixo, como malhaRevolucao).
  const centroPiso = vertice(0, 0, zPiso);
  const anelPiso = gradeInterna[0];
  for (let i = 0; i < nColunas; i++) {
    const i2 = (i + 1) % nColunas;
    internos.push(centroPiso, anelPiso[i2], anelPiso[i]);
  }

  // ---- furos: recorte + costura + túnel radial ----
  if (plano) {
    const contornoBloco = (
      grade: number[][],
      zsDaGrade: number[],
      linhaB: number,
      linhaA: number,
      bloco: PlanoFuros["blocos"][number]
    ): ContornoAnel => {
      const itens: { indice: number; a: number; b: number }[] = [];
      const arco = (i: number) =>
        ((i / nColunas) * DOIS_PI - bloco.thetaCentro) * raioExterno;
      for (let i = bloco.colEsq; i <= bloco.colDir; i++) {
        itens.push({
          indice: grade[linhaB][i],
          a: arco(i),
          b: zsDaGrade[linhaB] - plano.zCentro,
        });
        itens.push({
          indice: grade[linhaA][i],
          a: arco(i),
          b: zsDaGrade[linhaA] - plano.zCentro,
        });
      }
      for (let j = linhaB + 1; j < linhaA; j++) {
        const b = zsDaGrade[j] - plano.zCentro;
        itens.push({ indice: grade[j][bloco.colEsq], a: arco(bloco.colEsq), b });
        itens.push({ indice: grade[j][bloco.colDir], a: arco(bloco.colDir), b });
      }
      return ordenarPorAngulo(itens);
    };

    for (const bloco of plano.blocos) {
      // O MESMO polígono nas duas superfícies (mesmo θ e z, raios
      // diferentes): o anel de M quads entre eles é a parede do furo.
      const doLadoExterno: { indice: number; a: number; b: number }[] = [];
      const doLadoInterno: { indice: number; a: number; b: number }[] = [];
      for (const q of plano.pontos) {
        const th = bloco.thetaCentro + q.a / raioExterno;
        const z = plano.zCentro + q.b;
        const c = Math.cos(th);
        const s = Math.sin(th);
        // O offset dos arcos na cota do vértice (zero na prática — a
        // banda dos furos vive entre as duas faixas; somado para o raio
        // numa cota z ser SEMPRE a mesma conta, aqui e na grade).
        const off = offsetTotalMm(z);
        doLadoExterno.push({
          indice: vertice((raioExterno + off) * c, (raioExterno + off) * s, z),
          a: q.a,
          b: q.b,
        });
        doLadoInterno.push({
          indice: vertice((raioInterno + off) * c, (raioInterno + off) * s, z),
          a: q.a,
          b: q.b,
        });
      }
      const furoExterno = ordenarPorAngulo(doLadoExterno);
      const furoInterno = ordenarPorAngulo(doLadoInterno);
      costurarAnel(
        externos,
        contornoBloco(
          gradeExterna,
          linhasExternas,
          linhaBlocoBaixo + prefixoExterno,
          linhaBlocoAlto + prefixoExterno,
          bloco
        ),
        furoExterno
      );
      costurarAnel(
        internos,
        contornoBloco(gradeInterna, linhas, linhaBlocoBaixo, linhaBlocoAlto, bloco),
        furoInterno
      );
      // Túnel radial (não é invertido: nasce já com as normais para o furo).
      const nM = furoExterno.indices.length;
      for (let m = 0; m < nM; m++) {
        const m2 = (m + 1) % nM;
        externos.push(
          furoExterno.indices[m],
          furoExterno.indices[m2],
          furoInterno.indices[m2]
        );
        externos.push(
          furoExterno.indices[m],
          furoInterno.indices[m2],
          furoInterno.indices[m]
        );
      }
    }
  }

  // Inverte a cavidade por inteiro (troca b ↔ c de cada trio).
  const indices = externos;
  for (let t = 0; t < internos.length; t += 3) {
    indices.push(internos[t], internos[t + 2], internos[t + 1]);
  }
  return {
    posicoes: Float32Array.from(posicoes),
    indices: Uint32Array.from(indices),
  };
}

export function gerarMalhaCilindro(
  p: ParametrosBloco,
  segmentos = 48
): MalhaBloco {
  const raio = raioExternoMm(p);
  const altura = alturaBrutaMm(p);
  if (!p.oca) {
    // Pura: o caminho de todo o núcleo — perfil revolucionado. Sem borda é
    // o retângulo; com bordas o perfil ganha os pontos do arco do FUNDO no
    // começo (antes do pé reto — a base fecha no raio deslocado) e os do
    // TOPO no fim (o leque do ápice fecha o disco do topo no novo raio).
    const bordaDoTopo = bordaCilindro(p, altura, "topo");
    const bordaDoFundo = bordaCilindro(p, altura, "fundo");
    const raioEmMm = (z: number) =>
      raio + bordaDoTopo.offsetEmMm(z) + bordaDoFundo.offsetEmMm(z);
    const linhasDoFundo = linhasBordaMm(p, altura, bordaDoFundo, "fundo");
    const linhasDaBorda = linhasBordaMm(p, altura, bordaDoTopo, "topo");
    const perfil = [{ x: raioEmMm(0), y: 0 }];
    // A última linha do fundo é o PÉ da faixa (offset 0): dali o perfil
    // segue reto até o pé da faixa do topo (clamps garantem que as faixas
    // não se tocam — sobra sempre lateral reta no meio).
    for (const z of linhasDoFundo) perfil.push({ x: raioEmMm(z), y: z });
    if (linhasDaBorda.length > 0) {
      perfil.push({ x: raio, y: altura - bordaDoTopo.alturaMm });
      for (const z of linhasDaBorda) {
        perfil.push({ x: raioEmMm(z), y: z });
      }
    } else {
      perfil.push({ x: raio, y: altura });
    }
    return malhaRevolucao(perfil, segmentosGrade(segmentos, 0));
  }
  return malhaCilindroOco(p, raio, altura, segmentos);
}

export const primitivoCilindro: PrimitivoBloco = {
  forma: "cilindro",
  gerarMalha: gerarMalhaCilindro,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "cilindro" }),
  apoio: apoioCilindro,
};
