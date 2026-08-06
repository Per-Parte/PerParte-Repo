/**
 * Montagem v2 · F1 — primitivo CUBO (paralelepípedo com as escalas).
 *
 * Receita de topologia (espec da F1, seção "cubo") — a pirâmide é o molde
 * direto, com a diferença de que os anéis NÃO encolhem:
 * — CASCO: anéis QUADRADOS de perímetro 4·S colunas, meia-largura
 *   constante a0 = tamanho·escalaLargura/2, de z = 0 a z = H; tampa de
 *   BAIXO e tampa de CIMA em grade de quads S×S que COMPARTILHAM os
 *   índices do perímetro com o anel 0 e o anel do topo (a técnica da base
 *   da pirâmide). 6 faces em grade, tudo estanque por índice; os 4 cantos
 *   verticais são vértices do perímetro contínuo — nunca duplicados.
 * — OCA: caixa ABERTA em cima (espec §4 — "oca (borda aberta em cima)"):
 *   fundo externo fechado, 4 paredes externas até H, cavidade = prisma
 *   interno paralelo (offset t = espessura nas 4 laterais, meia-largura
 *   b_i = a0 − t) com piso em grade em z = t e paredes de zPiso a H, e
 *   uma MOLDURA quadrada plana em z = H ligando o perímetro externo ao
 *   interno (um quad por coluna, vértices compartilhados com o topo das
 *   duas paredes) — paredes verticais, ZERO ponte, e a luz sai por cima.
 *   A revisão de 06/08 derrubou o teto piramidal truncado: a placa do
 *   truncamento virava ponte de até 66 mm (teto declarado do FDM: 20 mm)
 *   e contrariava a espec. Casca interna invertida por inteiro no fim.
 * — FUROS: SÓ nas 4 faces laterais, round-robin entre as faces (mesma
 *   regra da pirâmide), centrados a meia altura e igualmente espaçados na
 *   largura útil da face; recorte em espaço de parâmetro da face (u ao
 *   longo da aresta, w = z) pela receita única (⚑ casca.ts — a cópia-MÃE
 *   mora em cilindro.ts): bloco retangular de células reservado (moldura
 *   + divisa entre vizinhos), polígono de M vértices (○ 16, □ 8, △ 6 com
 *   vértice para CIMA), costura em zíper ordenada por ângulo e túnel na
 *   NORMAL da face — nas faces verticais o túnel é um prisma horizontal
 *   reto (mesmo u e mesmo z dos dois lados, offset só na normal). As duas
 *   grades laterais compartilham as MESMAS linhas z na banda dos furos.
 *
 * ⚑ Clamp geométrico interno do furo: furoMaximoMm (limites.ts) já mede a
 *   casca INTERNA (revisão de 06/08), mas a fatia REAL da face interna
 *   ainda depende da grade (células inteiras, moldura em células) — se o
 *   furo com moldura não couber na fatia, o polígono ENCOLHE até caber
 *   (nunca erro), na mesma família do clamp da pirâmide. Validar impresso.
 *
 * Convenções do núcleo (malha.ts): mm; Z é a vertical de impressão (F8);
 * origem no eixo com base em z = 0; enrolamento anti-horário visto de
 * fora (volumeAssinadoMm3 > 0). Estanqueidade por ÍNDICE: vértices são
 * COMPARTILHADOS entre células vizinhas — nunca duplicados numa costura.
 *
 * gerarMalhaCubo assume params já grampeados (grampearBloco antes).
 */

import type {
  ApoioBloco,
  FormaFuro,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import {
  MOLDURA_FURO_MM,
  TIRA_BANDA_MM,
  alturaBrutaMm,
  grampearBloco,
  larguraBrutaMm,
  PAREDE_MINIMA_BLOCO_MM,
} from "./limites";

const DOIS_PI = Math.PI * 2;
const F2 = PAREDE_MINIMA_BLOCO_MM;

/** Passo-alvo das linhas z da grade da casca oca, em mm. */
const PASSO_LINHA_MM = 4;

/** Meia-largura externa da planta — helper único (malha e apoio). */
function meiaLarguraMm(p: ParametrosBloco): number {
  return Math.max(1, larguraBrutaMm(p) / 2);
}

/**
 * Meia-largura da cavidade (b_i = a0 − t, com freio defensivo — nunca
 * ativo com os clamps de limites.ts: t ≤ menor/4). A MESMA conta da
 * malha, usada pelo apoio (assentamento e raiosNotaveisMm nunca podem
 * divergir da geometria real).
 */
function meiaLarguraInternaMm(p: ParametrosBloco): number {
  const a0 = meiaLarguraMm(p);
  return Math.max(a0 / 4, a0 - p.espessuraParedeMm);
}

/** Cota do piso da cavidade da casca oca. */
function zPisoMm(p: ParametrosBloco): number {
  return Math.min(p.espessuraParedeMm, alturaBrutaMm(p) / 3);
}

export const apoioCubo: ApoioBloco = {
  alturaTopoMm: (p) => alturaBrutaMm(p),
  // Platôs quadrados: raio do círculo INSCRITO (pousar perto do canto
  // conta como fora — conservador, documentado em tipos.ts).
  raioApoioSuperiorMm: (p) => larguraBrutaMm(p) / 2,
  raioApoioInferiorMm: (p) => larguraBrutaMm(p) / 2,
  raioEnvelopeMm(p, zMm) {
    if (zMm < 0 || zMm > alturaBrutaMm(p)) return 0;
    // Planta quadrada: envelope pelo raio CIRCUNSCRITO (nunca interpenetra).
    return (larguraBrutaMm(p) / 2) * Math.SQRT2;
  },
  zSuperficieTopoMm(p, dMm) {
    if (dMm > meiaLarguraMm(p)) return null;
    // Caixa aberta (modelo radial inscrito, conservador — tipos.ts): quem
    // cabe na boca assenta no piso; na moldura (b_i ≤ d ≤ a0), em H.
    if (p.oca && dMm < meiaLarguraInternaMm(p)) return zPisoMm(p);
    return alturaBrutaMm(p);
  },
  zSuperficieBaseMm(p, dMm) {
    if (dMm > meiaLarguraMm(p)) return null;
    return 0;
  },
  // O degrau da boca da caixa aberta (tangencia.ts amostra este raio).
  raiosNotaveisMm: (p) => (p.oca ? [meiaLarguraInternaMm(p)] : []),
};

/** Cantos da planta (CCW visto de cima) — mesma ordem da pirâmide. */
const CANTOS = [
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
] as const;

/** Direções por face (planta, CCW visto de cima): normal horizontal e ê_u. */
const NORMAL_PLANTA = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
const EIXO_U = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
] as const;

/** Ponto no espaço de parâmetro da face (a = u em mm, b = z em mm). */
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
 * Anel quadrado de perímetro 4·S colunas (CCW visto de cima, começando no
 * canto (+a, −a)); face f vai do canto f ao canto f+1 — o mesmo layout da
 * pirâmide, então a coluna i da face f é o índice f·S + i do anel.
 */
function anelQuadrado(
  posicoes: number[],
  a: number,
  z: number,
  S: number
): number[] {
  const ids: number[] = [];
  for (let f = 0; f < 4; f++) {
    const [cx, cy] = CANTOS[f];
    const [px, py] = CANTOS[(f + 1) % 4];
    for (let i = 0; i < S; i++) {
      const t = i / S;
      posicoes.push(a * (cx + (px - cx) * t), a * (cy + (py - cy) * t), z);
      ids.push(posicoes.length / 3 - 1);
    }
  }
  return ids;
}

/**
 * Grade S×S de uma tampa: interior novo, perímetro REUSA os índices do
 * anel de referência (técnica da base da pirâmide — estanque por índice).
 */
function gradeTampa(
  posicoes: number[],
  anelRef: number[],
  a: number,
  z: number,
  S: number
): number[][] {
  const grade: number[][] = [];
  for (let gx = 0; gx <= S; gx++) {
    const coluna: number[] = [];
    for (let gy = 0; gy <= S; gy++) {
      let idx: number;
      if (gy === 0) idx = anelRef[gx === S ? 0 : 3 * S + gx];
      else if (gx === S) idx = anelRef[gy === S ? S : gy];
      else if (gy === S) idx = anelRef[2 * S - gx];
      else if (gx === 0) idx = anelRef[3 * S - gy];
      else {
        posicoes.push(-a + (2 * a * gx) / S, -a + (2 * a * gy) / S, z);
        idx = posicoes.length / 3 - 1;
      }
      coluna.push(idx);
    }
    grade.push(coluna);
  }
  return grade;
}

/** Tampa com normais para −Z (fundo de um sólido). */
function tamparParaBaixo(trios: number[], g: number[][], S: number): void {
  for (let gx = 0; gx < S; gx++) {
    for (let gy = 0; gy < S; gy++) {
      const p00 = g[gx][gy];
      const p01 = g[gx][gy + 1];
      const p11 = g[gx + 1][gy + 1];
      const p10 = g[gx + 1][gy];
      trios.push(p00, p01, p11, p00, p11, p10);
    }
  }
}

/** Tampa com normais para +Z (topo de um sólido). */
function tamparParaCima(trios: number[], g: number[][], S: number): void {
  for (let gx = 0; gx < S; gx++) {
    for (let gy = 0; gy < S; gy++) {
      const p00 = g[gx][gy];
      const p01 = g[gx][gy + 1];
      const p11 = g[gx + 1][gy + 1];
      const p10 = g[gx + 1][gy];
      trios.push(p00, p11, p01, p00, p10, p11);
    }
  }
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
 * no espaço de parâmetro (u crescente, z crescente) = normais para fora.
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

/** Plano dos furos: polígono (já grampeado à geometria) + centros por face. */
interface PlanoFuros {
  /** Contorno já encolhido, relativo ao centro (a = u − u_c, b = z − z_c). */
  pontos: PontoParam[];
  /** Meia-largura do contorno final (para os blocos de células). */
  meiaA: number;
  zCentro: number;
  zBlocoBaixo: number;
  zBlocoAlto: number;
  /** Centros dos furos em u, por face (round-robin 0→3). */
  centrosPorFace: number[][];
}

/** Bloco retangular de células reservado por um furo (colunas [i0, i1)). */
interface BlocoFace {
  i0: number;
  i1: number;
  cMin: number;
  cMax: number;
}

/**
 * Cascata geométrica dos furos — clamp, nunca erro: o grampeador já
 * garante furo ≤ furoMaximoMm; aqui sobra o ajuste à grade da casca
 * interna e à banda vertical, que encolhe o polígono uniformemente
 * (⚑ do cabeçalho) em vez de falhar. null = nem encolhido cabe (gera sem
 * furos).
 */
function planejarFuros(
  p: ParametrosBloco,
  a0: number,
  bi: number,
  S: number,
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

  // Round-robin entre as 4 faces (mesma regra da pirâmide); a face 0
  // sempre carrega o teto do rateio — é ela que dimensiona a fatia.
  const porFace = [0, 1, 2, 3].map(
    (f) => Math.floor(n / 4) + (f < n % 4 ? 1 : 0)
  );
  const nfMax = porFace[0];

  // Encolhimento uniforme do polígono (mesma escala em u e z, como a
  // pirâmide): horizontal, cada furo vive numa fatia da face INTERNA (a
  // menor das duas) com margem de moldura em células; vertical, metade
  // da banda menos moldura e tira. Menos de 1 mm de meia-medida = furo
  // sem função: gera sem furos (nunca erro).
  const celulaExterna = (2 * a0) / S;
  const margemU = Math.max(F2 / 2, 2.5 * celulaExterna);
  const cabeU = bi / nfMax - margemU;
  const cabeZ = (zTetoMax - zPiso) / 2 - MOLDURA_FURO_MM - TIRA_BANDA_MM;
  if (cabeU < 1 || cabeZ < 1) return null;
  const k = Math.min(1, cabeU / meiaA, cabeZ / meiaB);

  const pontos = base.map((q) => ({ a: q.a * k, b: q.b * k }));
  const meiaAFinal = meiaA * k;
  const meiaBFinal = meiaB * k;

  // Altura: furos centrados na altura média (H/2), deslocados só quando
  // a banda não alcança (k já garante que o centro clampado cabe).
  const zcMin = zPiso + meiaBFinal + MOLDURA_FURO_MM + TIRA_BANDA_MM;
  const zcMax = zTetoMax - meiaBFinal - MOLDURA_FURO_MM - TIRA_BANDA_MM;
  const zCentro = Math.min(Math.max(zAlvoMm, zcMin), zcMax);

  // Centros igualmente espaçados na largura útil da face (a interna).
  const centrosPorFace = porFace.map((nf) => {
    const us: number[] = [];
    for (let m = 0; m < nf; m++) {
      us.push(bi * ((2 * (m + 0.5)) / nf - 1));
    }
    return us;
  });

  return {
    pontos,
    meiaA: meiaAFinal,
    zCentro,
    zBlocoBaixo: zCentro - meiaBFinal - MOLDURA_FURO_MM,
    zBlocoAlto: zCentro + meiaBFinal + MOLDURA_FURO_MM,
    centrosPorFace,
  };
}

/**
 * Blocos de células reservados numa casca (externa OU interna — as
 * larguras de célula diferem): células que cobrem o polígono em colunas
 * da face + 1 célula de moldura, presos ao miolo ([1, S−1] — os cantos
 * verticais ficam de fora). Furos vizinhos nunca disputam célula: a
 * divisa fica na coluna média entre os dois blocos (regra da pirâmide);
 * blocos podem se ENCOSTAR — cada aresta da coluna compartilhada é
 * percorrida uma vez por cada zíper, em sentidos opostos: manifold.
 */
function blocosDaCasca(
  plano: PlanoFuros,
  aFace: number,
  S: number
): BlocoFace[][] {
  return plano.centrosPorFace.map((centros) => {
    const blocos = centros.map((uc) => {
      const col = (u: number) => ((u / aFace + 1) * S) / 2;
      const cMin = col(uc - plano.meiaA);
      const cMax = col(uc + plano.meiaA);
      return {
        i0: Math.max(1, Math.floor(cMin) - 1),
        i1: Math.min(S - 1, Math.ceil(cMax) + 1),
        cMin,
        cMax,
      };
    });
    for (let h = 0; h + 1 < blocos.length; h++) {
      const divisa = Math.round((blocos[h].cMax + blocos[h + 1].cMin) / 2);
      blocos[h].i1 = Math.min(blocos[h].i1, divisa);
      blocos[h + 1].i0 = Math.max(blocos[h + 1].i0, divisa);
    }
    return blocos;
  });
}

/** Cubo maciço: 4 laterais + 2 tampas em grade, um casco fechado. */
function malhaCuboPuro(a0: number, H: number, S: number): MalhaBloco {
  const posicoes: number[] = [];
  const trios: number[] = [];
  const anelBase = anelQuadrado(posicoes, a0, 0, S);
  const anelTopo = anelQuadrado(posicoes, a0, H, S);
  for (let k = 0; k < 4 * S; k++) {
    const k2 = (k + 1) % (4 * S);
    trios.push(anelBase[k], anelBase[k2], anelTopo[k2]);
    trios.push(anelBase[k], anelTopo[k2], anelTopo[k]);
  }
  tamparParaBaixo(trios, gradeTampa(posicoes, anelBase, a0, 0, S), S);
  tamparParaCima(trios, gradeTampa(posicoes, anelTopo, a0, H, S), S);
  return {
    posicoes: Float32Array.from(posicoes),
    indices: Uint32Array.from(trios),
  };
}

/**
 * Caixa ABERTA (com ou sem furos): fundo externo fechado em grade, 4
 * paredes externas até H, cavidade invertida (piso em grade em zPiso +
 * paredes u × z de zPiso a H) e moldura quadrada plana em z = H ligando
 * o perímetro externo ao interno — topo de parede, sem ponte. As duas
 * laterais usam as MESMAS linhas z na banda — os furos recortam blocos
 * equivalentes nas duas e o túnel liga os polígonos.
 */
function malhaCuboOco(
  p: ParametrosBloco,
  a0: number,
  H: number,
  S: number
): MalhaBloco {
  const bi = meiaLarguraInternaMm(p);
  const zPiso = zPisoMm(p);
  // Teto da banda dos furos (simétrico ao piso); as paredes sobem até H.
  const zTetoMax = H - zPiso;

  const plano = planejarFuros(p, a0, bi, S, zPiso, zTetoMax, H / 2);

  // Linhas z da banda compartilhada (zPiso → H; a ÚLTIMA linha é H exato
  // nas duas paredes — é ela que a moldura da borda costura); as bordas
  // do bloco do furo são linhas EXATAS da grade (célula inteira).
  const linhas: number[] = [zPiso];
  const preencherAte = (ate: number): number => {
    const de = linhas[linhas.length - 1];
    const passos = Math.max(1, Math.ceil((ate - de) / PASSO_LINHA_MM));
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
  preencherAte(H);

  // ---- vértices (compartilhados por índice; a costura nunca duplica) ----
  const posicoes: number[] = [];
  const vertice = (x: number, y: number, z: number): number => {
    posicoes.push(x, y, z);
    return posicoes.length / 3 - 1;
  };
  const linhasExternas = [0, ...linhas];
  const gradeExterna = linhasExternas.map((z) =>
    anelQuadrado(posicoes, a0, z, S)
  );
  const gradeInterna = linhas.map((z) => anelQuadrado(posicoes, bi, z, S));

  // Blocos por casca: as larguras de célula diferem (2a0/S vs 2bi/S).
  const blocosExt = plano ? blocosDaCasca(plano, a0, S) : null;
  const blocosInt = plano ? blocosDaCasca(plano, bi, S) : null;

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
  const celulaRemovida = (
    blocosPorFace: BlocoFace[][] | null,
    k: number,
    linha: number
  ): boolean => {
    if (
      !blocosPorFace ||
      linha < linhaBlocoBaixo ||
      linha >= linhaBlocoAlto
    ) {
      return false;
    }
    const i = k % S;
    for (const b of blocosPorFace[Math.floor(k / S)]) {
      if (i >= b.i0 && i < b.i1) return true;
    }
    return false;
  };

  // Parede externa (z = 0 → H); na banda, células dos blocos ficam de fora.
  for (let j = 0; j < linhasExternas.length - 1; j++) {
    for (let k = 0; k < 4 * S; k++) {
      if (j >= 1 && celulaRemovida(blocosExt, k, j - 1)) {
        continue;
      }
      const k2 = (k + 1) % (4 * S);
      quad(
        externos,
        gradeExterna[j][k],
        gradeExterna[j][k2],
        gradeExterna[j + 1][k2],
        gradeExterna[j + 1][k]
      );
    }
  }

  // Fundo externo em grade (compartilha o perímetro com o anel 0) —
  // SEMPRE fechado na F1 (abertura de encaixe é fase posterior ⚑).
  tamparParaBaixo(externos, gradeTampa(posicoes, gradeExterna[0], a0, 0, S), S);

  // Borda ABERTA em cima (espec §4): moldura quadrada plana em z = H
  // ligando o perímetro externo ao interno (um quad por coluna) —
  // normais +Z, topo de parede vertical, ponte nenhuma. Compartilha os
  // vértices do topo das duas paredes: estanque por índice.
  const anelTopoExterno = gradeExterna[gradeExterna.length - 1];
  const anelTopoInterno = gradeInterna[gradeInterna.length - 1];
  for (let k = 0; k < 4 * S; k++) {
    const k2 = (k + 1) % (4 * S);
    quad(
      externos,
      anelTopoExterno[k],
      anelTopoExterno[k2],
      anelTopoInterno[k2],
      anelTopoInterno[k]
    );
  }

  // Parede da cavidade: prisma paralelo para dentro, mesmo recorte de
  // células (receita única do furo).
  for (let j = 0; j < linhas.length - 1; j++) {
    for (let k = 0; k < 4 * S; k++) {
      if (celulaRemovida(blocosInt, k, j)) continue;
      const k2 = (k + 1) % (4 * S);
      quad(
        internos,
        gradeInterna[j][k],
        gradeInterna[j][k2],
        gradeInterna[j + 1][k2],
        gradeInterna[j + 1][k]
      );
    }
  }

  // Piso da cavidade em grade (compartilha o perímetro com o anel 0).
  tamparParaBaixo(
    internos,
    gradeTampa(posicoes, gradeInterna[0], bi, zPiso, S),
    S
  );

  // ---- furos: recorte + costura + túnel na normal da face ----
  if (plano) {
    const contornoBloco = (
      grade: number[][],
      zsDaGrade: number[],
      linhaB: number,
      linhaA: number,
      f: number,
      bloco: BlocoFace,
      aFace: number,
      uCentro: number
    ): ContornoAnel => {
      const itens: { indice: number; a: number; b: number }[] = [];
      const uDe = (i: number) => aFace * ((2 * i) / S - 1) - uCentro;
      for (let i = bloco.i0; i <= bloco.i1; i++) {
        itens.push({
          indice: grade[linhaB][f * S + i],
          a: uDe(i),
          b: zsDaGrade[linhaB] - plano.zCentro,
        });
        itens.push({
          indice: grade[linhaA][f * S + i],
          a: uDe(i),
          b: zsDaGrade[linhaA] - plano.zCentro,
        });
      }
      for (let j = linhaB + 1; j < linhaA; j++) {
        const b = zsDaGrade[j] - plano.zCentro;
        itens.push({
          indice: grade[j][f * S + bloco.i0],
          a: uDe(bloco.i0),
          b,
        });
        itens.push({
          indice: grade[j][f * S + bloco.i1],
          a: uDe(bloco.i1),
          b,
        });
      }
      return ordenarPorAngulo(itens);
    };

    for (let f = 0; f < 4; f++) {
      const [nx, ny] = NORMAL_PLANTA[f];
      const [ux, uy] = EIXO_U[f];
      const centros = plano.centrosPorFace[f];
      for (let h = 0; h < centros.length; h++) {
        const uc = centros[h];
        // O MESMO polígono nas duas faces (mesmo u e mesmo z, offset só
        // na normal): o anel de M quads entre eles é a parede do furo —
        // o prisma horizontal reto das faces verticais.
        const doLadoExterno: { indice: number; a: number; b: number }[] = [];
        const doLadoInterno: { indice: number; a: number; b: number }[] = [];
        for (const q of plano.pontos) {
          const u = uc + q.a;
          const z = plano.zCentro + q.b;
          doLadoExterno.push({
            indice: vertice(nx * a0 + ux * u, ny * a0 + uy * u, z),
            a: q.a,
            b: q.b,
          });
          doLadoInterno.push({
            indice: vertice(nx * bi + ux * u, ny * bi + uy * u, z),
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
            linhaBlocoBaixo + 1,
            linhaBlocoAlto + 1,
            f,
            blocosExt![f][h],
            a0,
            uc
          ),
          furoExterno
        );
        costurarAnel(
          internos,
          contornoBloco(
            gradeInterna,
            linhas,
            linhaBlocoBaixo,
            linhaBlocoAlto,
            f,
            blocosInt![f][h],
            bi,
            uc
          ),
          furoInterno
        );
        // Túnel na normal (não é invertido: nasce com as normais p/ o furo).
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

export function gerarMalhaCubo(
  p: ParametrosBloco,
  segmentos = 48
): MalhaBloco {
  const a0 = meiaLarguraMm(p);
  const H = alturaBrutaMm(p);
  // Colunas por face: múltiplo de 6 (até 3 furos por face dividem a banda
  // em partes exatas) e nunca abaixo de 48 — mesma régua da pirâmide.
  const S = 6 * Math.max(8, Math.ceil(segmentos / 6));
  if (!p.oca) {
    // Pura: um casco fechado, sem furos (o grampeador nunca entrega furos
    // com oca = false — furo é sempre passante de parede).
    return malhaCuboPuro(a0, H, S);
  }
  return malhaCuboOco(p, a0, H, S);
}

export const primitivoCubo: PrimitivoBloco = {
  forma: "cubo",
  gerarMalha: gerarMalhaCubo,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "cubo" }),
  apoio: apoioCubo,
};
