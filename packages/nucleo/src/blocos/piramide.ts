/**
 * Montagem v2 · F1 — primitivo PIRÂMIDE (base quadrada, ápice no eixo).
 *
 * Receita de topologia (espec da F1, seção "pirâmide"):
 * — PURA: 4 faces inclinadas em grade (anéis quadrados que encolhem ao
 *   subir + leque no ápice, o mesmo fecho de malhaRevolucao) e base em
 *   grade de quads que COMPARTILHA os índices do perímetro com o anel 0
 *   (a verificação de estanqueidade é por índice — nunca duplicar vértice
 *   na mesma costura). As faces sobem para dentro: sem problema de F4 no
 *   casco externo.
 * — OCA: pirâmide interna paralela (offset perpendicular às faces =
 *   espessura), com orientação invertida; o teto da cavidade é o plano da
 *   face e o piso escalaAlturaMinimaPiramideOca (JÁ aplicado pelo
 *   grampeador) garante inclinação ≤ F4 — não re-verificamos aqui.
 * — FUROS: só nas 4 faces INCLINADAS, centrados a meia altura da face e
 *   igualmente espaçados na banda utilizável; recorte em espaço de
 *   parâmetro da face (u ao longo da aresta da base, w ao longo da rampa)
 *   pela receita única do furo (§1): bloco retangular de células
 *   reservado, polígono de M vértices, costura em zíper e túnel na
 *   NORMAL da face ligando o polígono externo ao interno. △ sempre com o
 *   vértice apontando para o ápice (F4 de graça).
 *
 * ⚑ Clamp geométrico interno do furo: a heurística de furoMaximoMm (que é
 *   dos limites, congelada) mede a parede a meia altura, mas as faces
 *   CONVERGEM ao subir e a casca interna é menor que a externa — um furo
 *   no teto do clamp pode não caber inteiro na região convexa das duas
 *   faces. Quando isso acontece, o polígono ENCOLHE até caber (nunca
 *   erro), na mesma família do teto truncado do cubo. Validar com impresso
 *   e, se necessário, apertar a heurística em limites.ts.
 */

import type {
  ApoioBloco,
  FormaFuro,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import {
  alturaBrutaMm,
  grampearBloco,
  larguraBrutaMm,
  PAREDE_MINIMA_BLOCO_MM,
} from "./limites";

const F2 = PAREDE_MINIMA_BLOCO_MM;

export const apoioPiramide: ApoioBloco = {
  alturaTopoMm: (p) => alturaBrutaMm(p),
  // O topo é o ápice: apoio pontual (como a esfera).
  raioApoioSuperiorMm: () => 0,
  raioApoioInferiorMm: (p) => larguraBrutaMm(p) / 2,
  raioEnvelopeMm(p, zMm) {
    const h = alturaBrutaMm(p);
    if (zMm < 0 || zMm > h) return 0;
    // Planta quadrada que encolhe ao subir: circunscrito da seção.
    return (larguraBrutaMm(p) / 2) * Math.SQRT2 * (1 - zMm / h);
  },
  zSuperficieTopoMm(p, dMm) {
    // Rampa ao ápice, aproximada pelo cone inscrito (documentado em tipos.ts).
    const L = larguraBrutaMm(p) / 2;
    if (dMm > L) return null;
    return alturaBrutaMm(p) * (1 - dMm / L);
  },
  zSuperficieBaseMm(p, dMm) {
    if (dMm > larguraBrutaMm(p) / 2) return null;
    return 0;
  },
};

/**
 * Ponto no plano 2D de uma face inclinada: u ao longo da aresta da base
 * (0 no meio da aresta), w ao longo da rampa (0 na base, s no ápice).
 */
interface PontoFace {
  u: number;
  w: number;
}

/** Furo pronto para recorte numa face: centro + contorno (offsets, CCW). */
interface FuroNaFace {
  centro: PontoFace;
  contorno: PontoFace[];
}

/** Bloco retangular de células reservado por um furo (i coluna, j anel). */
interface BlocoCelulas {
  i0: number;
  i1: number;
  j0: number;
  j1: number;
  cMin: number;
  cMax: number;
}

/** Dimensões de um casco piramidal (o externo ou o da cavidade). */
interface CascoPiramidal {
  /** Meia-aresta da base, em mm. */
  a0: number;
  /** Altura base→ápice, em mm. */
  altura: number;
  /** Cota Z da base. */
  zBase: number;
  /** Altura inclinada da face (comprimento da rampa), em mm. */
  s: number;
}

/**
 * Inverte a orientação dos trios (b↔c): normais trocam de lado — é o que
 * transforma o casco interno em superfície de cavidade.
 * ⚑ casca.ts: este utilitário e a costura em zíper abaixo são a "receita
 * única" da espec e deveriam morar em src/blocos/casca.ts compartilhado
 * pelos 4 primitivos; ficaram locais porque a F1 dividiu a propriedade
 * por arquivo — extrair na consolidação, sem mudar comportamento.
 */
function inverterTrios(trios: number[]): number[] {
  const saida = new Array<number>(trios.length);
  for (let t = 0; t < trios.length; t += 3) {
    saida[t] = trios[t];
    saida[t + 1] = trios[t + 2];
    saida[t + 2] = trios[t + 1];
  }
  return saida;
}

/**
 * Costura em zíper (espec §1.4) entre o contorno do bloco reservado
 * (anel, CCW, convexo) e o polígono do furo (CCW, estrela-convexo em
 * relação ao centro). Determinístico: os dois contornos giram para
 * começar no vértice de menor ângulo ≥ 0 e o merge avança sempre o
 * contorno cujo PRÓXIMO vértice tem ângulo menor (empate → anel).
 * Orientação: arestas do anel percorridas no sentido CCW e as do
 * polígono no sentido oposto — o túnel fornece os pares das do polígono.
 */
function costurarZiper(
  trios: number[],
  anelIdx: number[],
  anel2D: PontoFace[],
  furoIdx: number[],
  furo2D: PontoFace[],
  centro: PontoFace
): void {
  const angulo = (p: PontoFace) => {
    const a = Math.atan2(p.w - centro.w, p.u - centro.u);
    return a < 0 ? a + 2 * Math.PI : a;
  };
  const girar = (idx: number[], pts: PontoFace[]) => {
    const angs = pts.map(angulo);
    let inicio = 0;
    for (let i = 1; i < angs.length; i++) {
      if (angs[i] < angs[inicio]) inicio = i;
    }
    const n = idx.length;
    const idxG = new Array<number>(n);
    const angsG = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      idxG[i] = idx[(inicio + i) % n];
      angsG[i] = angs[(inicio + i) % n];
    }
    return { idx: idxG, angs: angsG };
  };
  const A = girar(anelIdx, anel2D);
  const P = girar(furoIdx, furo2D);
  const nA = A.idx.length;
  const nP = P.idx.length;
  let ia = 0;
  let ip = 0;
  while (ia < nA || ip < nP) {
    const proximoA =
      ia >= nA
        ? Infinity
        : ia + 1 < nA
          ? A.angs[ia + 1]
          : A.angs[0] + 2 * Math.PI;
    const proximoP =
      ip >= nP
        ? Infinity
        : ip + 1 < nP
          ? P.angs[ip + 1]
          : P.angs[0] + 2 * Math.PI;
    const va = A.idx[ia % nA];
    const vp = P.idx[ip % nP];
    if (proximoA <= proximoP) {
      trios.push(va, A.idx[(ia + 1) % nA], vp);
      ia++;
    } else {
      trios.push(va, P.idx[(ip + 1) % nP], vp);
      ip++;
    }
  }
}

/** Contorno do furo em espaço de parâmetro da face (offsets CCW, mm). */
function contornoDoFuro(forma: FormaFuro, tamanhoMm: number): PontoFace[] {
  const contorno: PontoFace[] = [];
  if (forma === "circulo") {
    // ○: M = 16 — fecha em arco (perdoa a ponte; ⚑ FURO_PONTE_MAX_MM).
    const r = tamanhoMm / 2;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 2 * Math.PI;
      contorno.push({ u: r * Math.cos(a), w: r * Math.sin(a) });
    }
  } else if (forma === "quadrado") {
    // □: M = 8 (4 cantos + 4 meios) — teto reto em ponte (⚑ validar vão).
    const r = tamanhoMm / 2;
    contorno.push(
      { u: r, w: 0 },
      { u: r, w: r },
      { u: 0, w: r },
      { u: -r, w: r },
      { u: -r, w: 0 },
      { u: -r, w: -r },
      { u: 0, w: -r },
      { u: r, w: -r }
    );
  } else {
    // △: M = 6 (3 cantos + 3 meios), vértice para CIMA — na pirâmide,
    // apontando para o ápice; arestas a ~30° da vertical (F4 de graça).
    const R = tamanhoMm / Math.sqrt(3);
    for (let k = 0; k < 6; k++) {
      const g = ((30 + 60 * k) * Math.PI) / 180;
      const raio = k % 2 === 1 ? R : R / 2;
      contorno.push({ u: raio * Math.cos(g), w: raio * Math.sin(g) });
    }
  }
  return contorno;
}

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

/**
 * Constrói um casco piramidal fechado (4 faces em grade + leque do ápice +
 * base em grade de quads), recortando os furos pedidos. Devolve os trios
 * e, POR FURO (ordem: face 0→3, depois posição na face), os índices do
 * polígono — é com eles que o túnel liga casco externo e interno.
 * Vértices são compartilhados entre células vizinhas, entre faces (nas
 * arestas inclinadas) e entre faces e base (no perímetro do anel 0).
 */
function construirCascoPiramidal(
  posicoes: number[],
  casco: CascoPiramidal,
  S: number,
  nR: number,
  furosPorFace: FuroNaFace[][]
): { trios: number[]; indicesDosFuros: number[][] } {
  const { a0, altura, zBase, s } = casco;
  const trios: number[] = [];
  const addV = (x: number, y: number, z: number) => {
    posicoes.push(x, y, z);
    return posicoes.length / 3 - 1;
  };

  // — Anéis quadrados que encolhem ao subir (perímetro CCW visto de cima).
  const CANTOS = [
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ];
  const anel: number[][] = [];
  for (let j = 0; j < nR; j++) {
    const v = j / nR;
    const a = a0 * (1 - v);
    const z = zBase + altura * v;
    const linha: number[] = [];
    for (let f = 0; f < 4; f++) {
      const [cx, cy] = CANTOS[f];
      const [px, py] = CANTOS[(f + 1) % 4];
      for (let i = 0; i < S; i++) {
        const t = i / S;
        linha.push(
          addV(a * (cx + (px - cx) * t), a * (cy + (py - cy) * t), z)
        );
      }
    }
    anel.push(linha);
  }
  const apice = addV(0, 0, zBase + altura);

  // — Grade da base: interior novo, perímetro REUSA os índices do anel 0.
  const base: number[][] = [];
  for (let gx = 0; gx <= S; gx++) {
    const coluna: number[] = [];
    for (let gy = 0; gy <= S; gy++) {
      let idx: number;
      if (gy === 0) idx = anel[0][gx === S ? 0 : 3 * S + gx];
      else if (gx === S) idx = anel[0][gy === S ? S : gy];
      else if (gy === S) idx = anel[0][2 * S - gx];
      else if (gx === 0) idx = anel[0][3 * S - gy];
      else
        idx = addV(-a0 + (2 * a0 * gx) / S, -a0 + (2 * a0 * gy) / S, zBase);
      coluna.push(idx);
    }
    base.push(coluna);
  }

  // — Blocos de células reservados pelos furos (§1.2): células que cobrem
  //   o polígono em coordenadas de grade + 1 célula de moldura, presos ao
  //   miolo da face ([1, S-1] × [1, nR-1] — o leque do ápice fica de fora).
  const blocosPorFace: BlocoCelulas[][] = furosPorFace.map((furos) =>
    furos.map((furo) => {
      let cMin = Infinity;
      let cMax = -Infinity;
      let rMin = Infinity;
      let rMax = -Infinity;
      for (const p of furo.contorno) {
        const u = furo.centro.u + p.u;
        const w = furo.centro.w + p.w;
        const aw = a0 * (1 - w / s);
        const col = ((u / aw + 1) * S) / 2;
        const row = (w * nR) / s;
        cMin = Math.min(cMin, col);
        cMax = Math.max(cMax, col);
        rMin = Math.min(rMin, row);
        rMax = Math.max(rMax, row);
      }
      return {
        i0: Math.max(1, Math.floor(cMin) - 1),
        i1: Math.min(S - 1, Math.ceil(cMax) + 1),
        j0: Math.max(1, Math.floor(rMin) - 1),
        j1: Math.min(nR - 1, Math.ceil(rMax) + 1),
        cMin,
        cMax,
      };
    })
  );
  // Furos vizinhos nunca disputam célula: a divisa fica na coluna média
  // entre os dois blocos. Blocos podem se ENCOSTAR — cada aresta da coluna
  // compartilhada é percorrida uma vez por cada zíper (ou pela célula
  // mantida do outro lado), sempre em sentidos opostos: continua manifold.
  for (const blocos of blocosPorFace) {
    for (let h = 0; h + 1 < blocos.length; h++) {
      const divisa = Math.round((blocos[h].cMax + blocos[h + 1].cMin) / 2);
      blocos[h].i1 = Math.min(blocos[h].i1, divisa);
      blocos[h + 1].i0 = Math.max(blocos[h + 1].i0, divisa);
    }
  }
  const removida = (f: number, i: number, j: number) => {
    for (const b of blocosPorFace[f]) {
      if (i >= b.i0 && i < b.i1 && j >= b.j0 && j < b.j1) return true;
    }
    return false;
  };

  // — Quads das faces (fora dos blocos) + leque do ápice.
  for (let f = 0; f < 4; f++) {
    for (let j = 0; j < nR - 1; j++) {
      for (let i = 0; i < S; i++) {
        if (removida(f, i, j)) continue;
        const k = f * S + i;
        const k2 = (k + 1) % (4 * S);
        const va = anel[j][k];
        const vb = anel[j][k2];
        const vc = anel[j + 1][k2];
        const vd = anel[j + 1][k];
        trios.push(va, vb, vc, va, vc, vd);
      }
    }
  }
  for (let k = 0; k < 4 * S; k++) {
    const k2 = (k + 1) % (4 * S);
    trios.push(apice, anel[nR - 1][k], anel[nR - 1][k2]);
  }

  // — Tampa da base (normais para −Z).
  for (let gx = 0; gx < S; gx++) {
    for (let gy = 0; gy < S; gy++) {
      const p00 = base[gx][gy];
      const p01 = base[gx][gy + 1];
      const p11 = base[gx + 1][gy + 1];
      const p10 = base[gx + 1][gy];
      trios.push(p00, p01, p11, p00, p11, p10);
    }
  }

  // — Recorte dos furos: contorno do bloco → polígono, costura em zíper.
  const indicesDosFuros: number[][] = [];
  for (let f = 0; f < 4; f++) {
    const [nx, ny] = NORMAL_PLANTA[f];
    const [ux, uy] = EIXO_U[f];
    const furos = furosPorFace[f];
    for (let h = 0; h < furos.length; h++) {
      const furo = furos[h];
      const b = blocosPorFace[f][h];
      const anelIdx: number[] = [];
      const anel2D: PontoFace[] = [];
      const meter = (i: number, j: number) => {
        anelIdx.push(anel[j][f * S + i]);
        const aj = a0 * (1 - j / nR);
        anel2D.push({ u: aj * ((2 * i) / S - 1), w: (j * s) / nR });
      };
      for (let i = b.i0; i < b.i1; i++) meter(i, b.j0);
      for (let j = b.j0; j < b.j1; j++) meter(b.i1, j);
      for (let i = b.i1; i > b.i0; i--) meter(i, b.j1);
      for (let j = b.j1; j > b.j0; j--) meter(b.i0, j);
      const furoIdx: number[] = [];
      const furo2D: PontoFace[] = [];
      for (const p of furo.contorno) {
        const u = furo.centro.u + p.u;
        const w = furo.centro.w + p.w;
        const v = w / s;
        const aw = a0 * (1 - v);
        furo2D.push({ u, w });
        furoIdx.push(
          addV(nx * aw + ux * u, ny * aw + uy * u, zBase + altura * v)
        );
      }
      costurarZiper(trios, anelIdx, anel2D, furoIdx, furo2D, furo.centro);
      indicesDosFuros.push(furoIdx);
    }
  }

  return { trios, indicesDosFuros };
}

/** Restrições de UMA face (externa ou interna) para o ajuste do furo. */
interface FaceParaAjuste {
  /** Meia-base do casco hospedeiro. */
  a0: number;
  /** Rampa (altura inclinada) do casco. */
  s: number;
  /** Centro do furo em w nesta face. */
  wc: number;
  /** Margem vertical mínima (mm) até a base e até o ápice. */
  mV: number;
  /** Divisa com o vizinho, como fração γ do meio-lado a(w) (null = sem). */
  gEsq: number | null;
  gDir: number | null;
}

/** O ponto (u, w) cabe na face com as margens de parede e de moldura? */
function cabeNaFace(
  u: number,
  w: number,
  face: FaceParaAjuste,
  S: number
): boolean {
  if (w < face.mV || w > face.s - face.mV) return false;
  const aw = face.a0 * (1 - w / face.s);
  if (aw <= 0) return false;
  const cw = (2 * aw) / S;
  // Margem à borda da face: metade da parede F2 (cada face vizinha põe a
  // outra metade) e pelo menos ~2 células (moldura do bloco + folga).
  const mBorda = Math.max(F2 / 2, 2.2 * cw);
  if (u < -aw + mBorda || u > aw - mBorda) return false;
  const mDivisa = Math.max(F2 / 2, 1.5 * cw);
  if (face.gEsq !== null && u < face.gEsq * aw + mDivisa) return false;
  if (face.gDir !== null && u > face.gDir * aw - mDivisa) return false;
  return true;
}

/**
 * Escala 0 < k ≤ k0 do polígono para caber nas DUAS faces (⚑ clamp
 * geométrico do cabeçalho). Busca determinística por encolhimento
 * geométrico; 0 = nem o centro cabe (o furo é descartado, nunca erro).
 */
function ajustarEscalaDoFuro(
  contorno: PontoFace[],
  uCentro: number,
  externa: FaceParaAjuste,
  interna: FaceParaAjuste,
  S: number,
  k0: number
): number {
  let k = k0;
  while (k >= 0.02) {
    let cabe = true;
    for (const p of contorno) {
      const u = uCentro + k * p.u;
      if (
        !cabeNaFace(u, externa.wc + k * p.w, externa, S) ||
        !cabeNaFace(u, interna.wc + k * p.w, interna, S)
      ) {
        cabe = false;
        break;
      }
    }
    if (cabe) return k;
    k *= 0.9;
  }
  return 0;
}

function paraMalha(posicoes: number[], trios: number[]): MalhaBloco {
  return {
    posicoes: Float32Array.from(posicoes),
    indices: Uint32Array.from(trios),
  };
}

export function gerarMalhaPiramide(
  p: ParametrosBloco,
  segmentos = 48
): MalhaBloco {
  const L = larguraBrutaMm(p);
  const H = alturaBrutaMm(p);
  const a0 = L / 2;
  const s = Math.hypot(H, a0);
  // Colunas por face: múltiplo de 6 (até 3 furos por face dividem a banda
  // em partes exatas) e nunca abaixo de 48 (célula fina para os blocos).
  const S = 6 * Math.max(8, Math.ceil(segmentos / 6));
  // Anéis: células ~2:1 na base; teto duro para não explodir a malha.
  const aneisBase = (meiaBase: number, rampa: number) =>
    Math.min(320, Math.max(8, Math.round((rampa * S) / (4 * meiaBase))));

  const posicoes: number[] = [];
  const externo: CascoPiramidal = { a0, altura: H, zBase: 0, s };

  if (!p.oca) {
    // PURA: um casco fechado, sem furos (o grampeador nunca entrega furos
    // com oca = false — furo é sempre passante de parede).
    const { trios } = construirCascoPiramidal(
      posicoes,
      externo,
      S,
      aneisBase(a0, s),
      [[], [], [], []]
    );
    return paraMalha(posicoes, trios);
  }

  // OCA: cavidade = pirâmide interna paralela (offset perpendicular às
  // faces = espessura), piso da cavidade em z = t. Derivando dos planos
  // das faces: meia-base interna b_i e ápice interno z_i. O freio 0,75
  // é defensivo (nunca ativo dentro dos clamps de limites.ts): t jamais
  // chega ao valor que degeneraria a cavidade.
  const t = Math.min(p.espessuraParedeMm, (0.75 * (a0 * H)) / (s + a0));
  const bi = a0 - (t * (s + a0)) / H;
  const zi = H - (t * s) / a0;
  const hi = zi - t;
  const si = Math.hypot(hi, bi);
  const interno: CascoPiramidal = { a0: bi, altura: hi, zBase: t, s: si };
  // O mesmo (u, w) da face externa, deslizado −t·n̂, cai na face interna
  // com u IGUAL e w deslocado desta constante (planos paralelos) — é o
  // que faz o túnel do furo ser um prisma reto na normal da face.
  const dw = (a0 * (a0 - bi) + t * H) / s;

  const furosExt: FuroNaFace[][] = [[], [], [], []];
  const furosInt: FuroNaFace[][] = [[], [], [], []];
  let nRExt = aneisBase(a0, s);
  let nRInt = aneisBase(bi, si);

  if (p.furos && p.furos.quantidade > 0) {
    const { forma: formaFuro, quantidade, tamanhoMm } = p.furos;
    const wcExt = s / 2; // meia altura da face
    const wcInt = wcExt - dw;
    const bandaExt = a0 * (1 - wcExt / s);
    const bandaInt = bi * (1 - Math.min(1, Math.max(0, wcInt / si)));
    // Centros na banda utilizável COMUM às duas faces (o túnel é normal à
    // face: mesmo u dos dois lados; a interna é a menor das duas).
    const U = Math.min(bandaExt, bandaInt);
    // Round-robin entre as 4 faces (mesma regra do cubo).
    const porFace = [0, 1, 2, 3].map(
      (f) => Math.floor(quantidade / 4) + (f < quantidade % 4 ? 1 : 0)
    );
    interface FuroPlanejado {
      f: number;
      u: number;
      uEsq: number | null;
      uDir: number | null;
      contorno: PontoFace[];
      k: number;
    }
    const planejados: FuroPlanejado[] = [];
    for (let f = 0; f < 4; f++) {
      const nf = porFace[f];
      const uDe = (m: number) => U * ((2 * (m + 0.5)) / nf - 1);
      for (let m = 0; m < nf; m++) {
        planejados.push({
          f,
          u: uDe(m),
          uEsq: m > 0 ? (uDe(m) + uDe(m - 1)) / 2 : null,
          uDir: m + 1 < nf ? (uDe(m) + uDe(m + 1)) / 2 : null,
          contorno: contornoDoFuro(formaFuro, tamanhoMm),
          k: 0,
        });
      }
    }
    const ajusteExt = (fp: FuroPlanejado, mV: number): FaceParaAjuste => ({
      a0,
      s,
      wc: wcExt,
      mV,
      gEsq: fp.uEsq === null ? null : fp.uEsq / bandaExt,
      gDir: fp.uDir === null ? null : fp.uDir / bandaExt,
    });
    const ajusteInt = (fp: FuroPlanejado, mV: number): FaceParaAjuste => ({
      a0: bi,
      s: si,
      wc: wcInt,
      mV,
      gEsq:
        fp.uEsq === null || bandaInt <= 0 ? null : fp.uEsq / bandaInt,
      gDir:
        fp.uDir === null || bandaInt <= 0 ? null : fp.uDir / bandaInt,
    });

    // Passo 1: ajusta com margem vertical F2 e mede a folga vertical real.
    let folgaExt = Infinity;
    let folgaInt = Infinity;
    for (const fp of planejados) {
      fp.k = ajustarEscalaDoFuro(
        fp.contorno,
        fp.u,
        ajusteExt(fp, F2),
        ajusteInt(fp, F2),
        S,
        1
      );
      if (fp.k <= 0) continue;
      let baixo = 0;
      let alto = 0;
      for (const q of fp.contorno) {
        baixo = Math.min(baixo, fp.k * q.w);
        alto = Math.max(alto, fp.k * q.w);
      }
      folgaExt = Math.min(folgaExt, wcExt + baixo, s - (wcExt + alto));
      folgaInt = Math.min(folgaInt, wcInt + baixo, si - (wcInt + alto));
    }

    // Passo 2: anéis finos o bastante para a moldura de células dos
    // blocos caber na folga; re-ajusta k com as margens de linha reais.
    if (planejados.some((fp) => fp.k > 0)) {
      nRExt = Math.min(
        320,
        Math.max(nRExt, Math.ceil((2.5 * s) / Math.max(folgaExt, F2 / 2)))
      );
      nRInt = Math.min(
        320,
        Math.max(nRInt, Math.ceil((2.5 * si) / Math.max(folgaInt, F2 / 2)))
      );
      const mVExt = Math.max(F2, (2.2 * s) / nRExt);
      const mVInt = Math.max(F2, (2.2 * si) / nRInt);
      for (const fp of planejados) {
        if (fp.k <= 0) continue;
        fp.k = ajustarEscalaDoFuro(
          fp.contorno,
          fp.u,
          ajusteExt(fp, mVExt),
          ajusteInt(fp, mVInt),
          S,
          fp.k
        );
        if (fp.k <= 0) continue;
        const escalado = fp.contorno.map((q) => ({
          u: q.u * fp.k,
          w: q.w * fp.k,
        }));
        furosExt[fp.f].push({ centro: { u: fp.u, w: wcExt }, contorno: escalado });
        furosInt[fp.f].push({ centro: { u: fp.u, w: wcInt }, contorno: escalado });
      }
    }
  }

  const cascoExt = construirCascoPiramidal(posicoes, externo, S, nRExt, furosExt);
  const cascoInt = construirCascoPiramidal(posicoes, interno, S, nRInt, furosInt);
  // Casco interno invertido: normais apontam para DENTRO da cavidade.
  const trios = cascoExt.trios.concat(inverterTrios(cascoInt.trios));

  // Túneis: M quads por furo ligando o polígono externo ao interno — a
  // parede do furo, com espessura = espessuraParedeMm (§1.5). A ordem dos
  // furos é a mesma nos dois cascos (face 0→3, posição na face).
  for (let h = 0; h < cascoExt.indicesDosFuros.length; h++) {
    const P = cascoExt.indicesDosFuros[h];
    const Q = cascoInt.indicesDosFuros[h];
    for (let k = 0; k < P.length; k++) {
      const k2 = (k + 1) % P.length;
      trios.push(P[k], P[k2], Q[k2], P[k], Q[k2], Q[k]);
    }
  }
  return paraMalha(posicoes, trios);
}

export const primitivoPiramide: PrimitivoBloco = {
  forma: "piramide",
  gerarMalha: gerarMalhaPiramide,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "piramide" }),
  apoio: apoioPiramide,
};
