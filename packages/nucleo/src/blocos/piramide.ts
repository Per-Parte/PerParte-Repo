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
 * — BORDA ENCURVADA (pedido do Davi, 06/08): a meia-largura da pirâmide já
 *   é função de z — a(z) = a0·(1 − z/H) — então o ARCO da borda
 *   (blocos/borda.ts) entra somado nela: a(z) + offset(z). Consequências
 *   que a geometria assume de propósito:
 *   · para FORA o ÁPICE deixa de ser um ponto e vira um PLATÔ de
 *     meia-largura offsetTopoMm (pináculo alargado) — e o apoio passa a
 *     dizer isso (raioApoioSuperiorMm era 0);
 *   · para DENTRO a(z) encolhe mais rápido e chegaria a zero antes do
 *     topo: clamp geométrico (fração da seção local — ver
 *     FRACAO_MIOLO_BORDA), a ponta continua fechando no ápice;
 *   · a cavidade da oca acompanha o MESMO z global (ela tem altura e rampa
 *     próprias, hi/si — calcular o offset no parâmetro local torceria a
 *     parede): dentro da faixa a casca interna é a silhueta externa
 *     deslocada espessuraParedeMm na NORMAL, então a parede tem a mesma
 *     espessura em qualquer direção e o teto da cavidade herda as
 *     inclinações da externa (F4 continua valendo). Sem borda isso é
 *     exatamente a pirâmide interna paralela da F1. A cavidade fecha onde a
 *     paralela zera — mais cedo com o lábio, e com a aba ela chega viva até
 *     uma parede abaixo da tampa, onde o teto vira um platô plano (PONTE
 *     curta, ⚑ FURO_PONTE_MAX_MM).
 *
 * ⚑ Clamp geométrico interno do furo: a heurística de furoMaximoMm (que é
 *   dos limites, congelada) mede a parede a meia altura, mas as faces
 *   CONVERGEM ao subir e a casca interna é menor que a externa — um furo
 *   no teto do clamp pode não caber inteiro na região convexa das duas
 *   faces. Quando isso acontece, o polígono ENCOLHE até caber (nunca
 *   erro), na mesma família do teto truncado do cubo. Validar com impresso
 *   e, se necessário, apertar a heurística em limites.ts.
 */

import { anguloBordaRad, arcoBorda } from "./borda";
import type {
  ApoioBloco,
  FormaFuro,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import {
  BALANCO_MAXIMO_BLOCO_GRAUS,
  FURO_PONTE_MAX_MM,
  alturaBrutaMm,
  grampearBloco,
  larguraBrutaMm,
  PAREDE_MINIMA_BLOCO_MM,
} from "./limites";

const F2 = PAREDE_MINIMA_BLOCO_MM;

/** Balanço máximo em tangente (F4 importado, nunca copiado). */
const TAN_F4 = Math.tan((BALANCO_MAXIMO_BLOCO_GRAUS * Math.PI) / 180);

/**
 * Passo-alvo (⚑) e piso de segmentos das linhas de grade DENTRO da faixa
 * do arco da borda: a borda é a silhueta que o cliente vê de perto, e com
 * 2 segmentos a curva sairia facetada. As MESMAS réguas de cubo.ts e
 * cilindro.ts (⚑ casca.ts: consolidar junto com a receita do furo).
 */
const PASSO_LINHA_BORDA_MM = 1.5;
const SEGMENTOS_MINIMOS_BORDA = 8;

/**
 * Fração da seção local que o lábio (borda para DENTRO) nunca come — o
 * clamp geométrico da pirâmide (⚑ proposto, validar impresso). Aqui NÃO
 * cabe o piso ABSOLUTO de material do cubo/cilindro: o ápice da pirâmide é
 * um PONTO, e um piso em mm viraria agulha reta no topo. Uma fração deixa a
 * ponta fechar no ápice e mantém a parede da oca proporcional (a folga
 * horizontal da cavidade encolhe no mesmo fator, e a cavidade fecha antes
 * — ver zApiceCavidadeMm — em vez de virar casca fina).
 */
const FRACAO_MIOLO_BORDA = 0.25;

/** Passo da diferença central que mede a inclinação da silhueta (mm ⚑). */
const PASSO_DERIVADA_MM = 0.05;

/** Passo das varreduras que invertem a silhueta da faixa (mm ⚑). */
const PASSO_VARREDURA_MM = 0.25;

/** Passo da amostragem da silhueta paralela que forma a cavidade (mm ⚑). */
const PASSO_PARALELA_MM = 0.1;

/** Metade do vão máximo de ponte que o teto plano da cavidade pode ter. */
const MEIO_VAO_PONTE_MM = FURO_PONTE_MAX_MM / 2;

/**
 * A silhueta EXTERNA da pirâmide: meia-largura da planta em função de z,
 * com a borda encurvada JÁ grampeada à geometria. Fonte única da malha e
 * do apoio — o apoio tem de dizer a verdade sobre a malha real (A1).
 */
interface SilhuetaPiramide {
  /** Meia-aresta da base, altura e rampa da RETA da face. */
  a0: number;
  H: number;
  s: number;
  /** Altura da faixa do arco (0 = borda reta) e a cota do PÉ dela. */
  alturaBordaMm: number;
  zPeMm: number;
  /** Meia-largura externa numa cota z. */
  meiaLarguraEmMm(zMm: number): number;
  /** Meia-largura no TOPO: 0 (ápice) ou o platô do pináculo (borda p/ fora). */
  meiaLarguraTopoMm: number;
  /**
   * Derivada d(meia-largura)/dz da silhueta numa cota z (ASSINADA: negativa
   * onde a rampa converge, positiva onde a aba abre) — é a normal dela que
   * gera a cavidade da oca.
   */
  derivadaEmMm(zMm: number): number;
}

function silhuetaPiramide(p: ParametrosBloco): SilhuetaPiramide {
  const H = alturaBrutaMm(p);
  const a0 = larguraBrutaMm(p) / 2;
  const s = Math.hypot(H, a0);
  const arco = arcoBorda(p, H);
  const zPeMm = H - arco.alturaMm;
  const paraDentro = arco.offsetTopoMm < 0;
  // Freio de F4 do lábio na pirâmide OCA: as faces já convergem
  // tan = a0/H e o arco soma NA MESMA direção, então o teto da cavidade
  // (superfície paralela à externa) passaria do balanço máximo. Clamp
  // geométrico, nunca erro: a inclinação do offset encosta no que sobra de
  // F4 e o lábio vira um bisel reto onde o arco seria íngreme. A maciça não
  // paga isso (cúpula convergente: cada camada assenta inteira na de
  // baixo — o mesmo argumento de blocos/borda.ts), e "para fora" nem chega
  // perto (lá o arco DESFAZ a convergência: |dr/dz| = |tan φ − a0/H|).
  // ⚑ proposto — validar impresso.
  const tetoInclinacao =
    paraDentro && p.oca ? Math.max(0, TAN_F4 - a0 / H) : Infinity;
  // O freio tem de limitar a INCLINAÇÃO, não a magnitude do offset (limitar
  // |off| ≤ teto·(z − pé) deixa o arco cruzar essa reta já com inclinação
  // tan(2·atan(teto)) — medido: 1,18·tan F4). No arco a inclinação É tan φ e
  // cresce com z, então o freio entra na cota onde tan φ = teto e daí para
  // cima o lábio segue RETO nessa inclinação: um bisel TANGENTE ao arco
  // (perfil C1, inclinação ≤ teto em toda a faixa).
  const raioArco = p.borda?.tamanhoMm ?? 0;
  const offNoFreio = Number.isFinite(tetoInclinacao)
    ? raioArco * (1 - 1 / Math.hypot(1, tetoInclinacao))
    : Infinity;
  const zFreio =
    Number.isFinite(offNoFreio) && offNoFreio <= Math.abs(arco.offsetTopoMm)
      ? arco.zDoOffsetMm(-offNoFreio)
      : null;
  const offsetEmMm = (zMm: number): number => {
    if (zFreio !== null && zMm > zFreio) {
      return -(offNoFreio + tetoInclinacao * (zMm - zFreio));
    }
    return arco.offsetEmMm(zMm);
  };
  const meiaLarguraEmMm = (zMm: number): number => {
    const reta = Math.max(0, a0 * (1 - zMm / H));
    const off = offsetEmMm(zMm);
    if (off >= 0) return reta + off;
    const comLabio = reta + off;
    const piso = FRACAO_MIOLO_BORDA * reta;
    return comLabio > piso ? comLabio : piso;
  };
  return {
    a0,
    H,
    s,
    alturaBordaMm: arco.alturaMm,
    zPeMm,
    meiaLarguraEmMm,
    meiaLarguraTopoMm: meiaLarguraEmMm(H),
    derivadaEmMm(zMm) {
      const zA = Math.max(0, zMm - PASSO_DERIVADA_MM);
      const zB = Math.min(H, zMm + PASSO_DERIVADA_MM);
      if (zB - zA <= 1e-9) return -a0 / H;
      return (meiaLarguraEmMm(zB) - meiaLarguraEmMm(zA)) / (zB - zA);
    },
  };
}

/**
 * Cotas z das linhas de grade DENTRO da faixa do arco — o PÉ entra à parte
 * (linha exata da grade) e a última é o topo EXATO. Amostra em passos
 * iguais de ÂNGULO do arco (pelo inverso zDoOffsetMm, sem refazer a conta
 * do arco): comprimento de arco constante deixa a curva lisa nas pontas.
 */
function linhasBordaMm(p: ParametrosBloco, alturaTotalMm: number): number[] {
  const arco = arcoBorda(p, alturaTotalMm);
  if (arco.alturaMm <= 0 || !p.borda) return [];
  const theta = anguloBordaRad(p.borda.sentido, p.oca);
  const senTheta = Math.sin(theta);
  const versseno = 1 - Math.cos(theta);
  if (senTheta <= 0 || versseno <= 0) return [];
  const comprimento = (arco.alturaMm / senTheta) * theta;
  const segmentos = Math.max(
    SEGMENTOS_MINIMOS_BORDA,
    Math.ceil(comprimento / PASSO_LINHA_BORDA_MM)
  );
  const zs: number[] = [];
  for (let k = 1; k < segmentos; k++) {
    const offset =
      (arco.offsetTopoMm * (1 - Math.cos((theta * k) / segmentos))) / versseno;
    const z = arco.zDoOffsetMm(offset);
    if (z == null) continue;
    const anterior = zs.length > 0 ? zs[zs.length - 1] : -Infinity;
    if (z > anterior + 1e-6 && z < alturaTotalMm - 1e-6) zs.push(z);
  }
  zs.push(alturaTotalMm);
  return zs;
}

export const apoioPiramide: ApoioBloco = {
  // A borda encurva a faixa do topo mas nunca muda a ALTURA do bloco.
  alturaTopoMm: (p) => alturaBrutaMm(p),
  // O topo é o ápice: apoio pontual (como a esfera) — MENOS quando a borda
  // para FORA alarga o pináculo, e aí o platô é o apoio de verdade. O apoio
  // acompanha a geometria (A1: peça flutuando é estado impossível).
  raioApoioSuperiorMm: (p) => silhuetaPiramide(p).meiaLarguraTopoMm,
  raioApoioInferiorMm: (p) => larguraBrutaMm(p) / 2,
  raioEnvelopeMm(p, zMm) {
    const sil = silhuetaPiramide(p);
    if (zMm < 0 || zMm > sil.H) return 0;
    // Planta quadrada que encolhe ao subir: circunscrito da seção.
    return sil.meiaLarguraEmMm(zMm) * Math.SQRT2;
  },
  zSuperficieTopoMm(p, dMm) {
    const sil = silhuetaPiramide(p);
    // Platô do pináculo (0 sem borda para fora: só o próprio ápice).
    if (dMm <= sil.meiaLarguraTopoMm) return sil.H;
    if (sil.alturaBordaMm > 0) {
      // A silhueta da faixa pode BULIR para fora (aba de abajur): o inverso
      // não é monotônico, então varre de CIMA para baixo e devolve a cota
      // mais alta onde a seção ainda alcança d — é onde a peça pousa.
      const passos = Math.max(
        SEGMENTOS_MINIMOS_BORDA,
        Math.ceil(sil.alturaBordaMm / PASSO_VARREDURA_MM)
      );
      let zAcima = sil.H;
      let meiaAcima = sil.meiaLarguraTopoMm;
      for (let k = passos - 1; k >= 0; k--) {
        const z = sil.zPeMm + (sil.alturaBordaMm * k) / passos;
        const meia = sil.meiaLarguraEmMm(z);
        if (meia >= dMm) {
          const salto = meia - meiaAcima;
          const fracao = salto > 1e-9 ? (meia - dMm) / salto : 0;
          return z + (zAcima - z) * Math.min(1, Math.max(0, fracao));
        }
        zAcima = z;
        meiaAcima = meia;
      }
    }
    // Abaixo da faixa: rampa ao ápice, aproximada pelo cone inscrito
    // (documentado em tipos.ts).
    if (dMm > sil.a0) return null;
    return sil.H * (1 - dMm / sil.a0);
  },
  zSuperficieBaseMm(p, dMm) {
    if (dMm > larguraBrutaMm(p) / 2) return null;
    return 0;
  },
  // A QUINA do platô do pináculo é degrau da superfície (tangencia.ts
  // amostra este raio exato); sem borda para fora o topo é um ponto.
  raiosNotaveisMm(p) {
    const topo = silhuetaPiramide(p).meiaLarguraTopoMm;
    return topo > 1e-9 ? [topo] : [];
  },
  // Planta quadrada: o raio INSCRITO da seção é a MEIA-ARESTA (não a
  // diagonal) do contorno EXTERNO — é o platô que a fatia no eixo Z expõe.
  raioPlatoMm(p, zMm) {
    const sil = silhuetaPiramide(p);
    if (zMm < 0 || zMm > sil.H) return 0;
    return sil.meiaLarguraEmMm(zMm);
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
  /**
   * Meia-largura REAL da planta numa cota z (a RETA da face mais a borda
   * encurvada). Ausente = a reta pura. A RETA continua sendo a
   * parametrização das grades e dos furos: a faixa da borda não hospeda
   * furo, e lá (u, w) e a reta coincidem.
   */
  meiaLarguraEm?: (zMm: number) => number;
  /** Cotas z EXTRAS de anel (o pé da faixa da borda e as linhas do arco). */
  linhasExtra?: number[];
  /**
   * Cota do ápice EFETIVO: a borda pode fechar a cavidade antes do ápice
   * da reta (lábio) ou mantê-la viva até uma parede abaixo da tampa (aba).
   */
  zApiceMm?: number;
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
  const zApice = casco.zApiceMm ?? zBase + altura;
  const meiaEm = (zMm: number): number =>
    casco.meiaLarguraEm
      ? casco.meiaLarguraEm(zMm)
      : a0 * (1 - (zMm - zBase) / altura);

  // — Cotas dos anéis: as nR linhas uniformes da RETA da face (a régua da
  //   F1) mais as linhas próprias da faixa da borda, em ordem e sem repetir
  //   cota. O anel só existe enquanto há seção — o leque fecha do último
  //   até o ápice: um PONTO na pirâmide fechada, um PLATÔ plano quando a
  //   borda para fora alarga o topo (ou o teto da cavidade).
  const candidatos: number[] = [];
  for (let j = 0; j <= nR; j++) candidatos.push(zBase + (altura * j) / nR);
  for (const z of casco.linhasExtra ?? []) candidatos.push(z);
  candidatos.sort((x, y) => x - y);
  const zsAnel: number[] = [];
  for (const z of candidatos) {
    if (z > zApice + 1e-9) continue;
    if (zsAnel.length > 0 && z <= zsAnel[zsAnel.length - 1] + 1e-9) continue;
    if (meiaEm(z) <= 1e-6) continue;
    zsAnel.push(z);
  }
  const nA = zsAnel.length;
  // — Anéis quadrados (perímetro CCW visto de cima).
  const CANTOS = [
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ];
  const anel: number[][] = [];
  for (let j = 0; j < nA; j++) {
    const z = zsAnel[j];
    const a = meiaEm(z);
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
  const apice = addV(0, 0, zApice);

  /**
   * Índice (fracionário) do anel na cota da rampa w — a grade não é mais
   * uniforme (a faixa da borda tem linhas próprias), então o bloco de
   * células do furo acha a linha pela COTA. Os furos vivem sempre abaixo da
   * faixa, onde as linhas ainda são as uniformes da reta.
   */
  const indiceDoW = (w: number): number => {
    const z = zBase + (altura * w) / s;
    if (z <= zsAnel[0]) return 0;
    for (let j = 1; j < nA; j++) {
      if (z <= zsAnel[j]) {
        return j - 1 + (z - zsAnel[j - 1]) / (zsAnel[j] - zsAnel[j - 1]);
      }
    }
    return nA - 1;
  };

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
        const row = indiceDoW(w);
        cMin = Math.min(cMin, col);
        cMax = Math.max(cMax, col);
        rMin = Math.min(rMin, row);
        rMax = Math.max(rMax, row);
      }
      return {
        i0: Math.max(1, Math.floor(cMin) - 1),
        i1: Math.min(S - 1, Math.ceil(cMax) + 1),
        j0: Math.max(1, Math.floor(rMin) - 1),
        j1: Math.min(nA - 1, Math.ceil(rMax) + 1),
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
    for (let j = 0; j < nA - 1; j++) {
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
    trios.push(apice, anel[nA - 1][k], anel[nA - 1][k2]);
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
        const aj = meiaEm(zsAnel[j]);
        anel2D.push({
          u: aj * ((2 * i) / S - 1),
          w: ((zsAnel[j] - zBase) * s) / altura,
        });
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
        const z = zBase + altura * v;
        // A meia-largura da cota (a reta na região do furo — a faixa da
        // borda não hospeda furo; somada aqui para o polígono morar sempre
        // na superfície REAL da parede).
        const aw = meiaEm(z);
        furo2D.push({ u, w });
        furoIdx.push(addV(nx * aw + ux * u, ny * aw + uy * u, z));
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
  /**
   * Teto da rampa que o furo pode ocupar (mm) — a rampa inteira menos a
   * margem, ou o PÉ DA FAIXA DA BORDA quando ela desce mais: a faixa do
   * arco não hospeda furo (furoMaximoMm já desconta a altura dela).
   */
  wTeto: number;
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
  if (w < face.mV || w > face.wTeto) return false;
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

/**
 * Cota onde a CAVIDADE fecha, varrendo a meia-largura interna até ela zerar
 * (interpolação linear no passo — exata quando a silhueta é a reta da F1).
 * Sem borda é o ápice da pirâmide paralela; com o lábio para dentro a
 * cavidade fecha mais cedo (a parede continua com a espessura honesta e o
 * teto vira um cone raso ≤ F4, em vez de casca fina); com a aba para fora a
 * parede acompanha o arco e a cavidade sobreviveria até o topo — aí ela
 * para uma parede ANTES da tampa (zAte = H − t) e o teto é o platô plano
 * paralelo à tampa do pináculo (ponte curta, ≤ 2·offset do topo: dentro do
 * teto ⚑ FURO_PONTE_MAX_MM declarado para o FDM — medir impresso).
 */
function zApiceCavidadeMm(
  meiaCavidade: (zMm: number) => number,
  zDeMm: number,
  zAteMm: number,
  zPisoDoTetoMm: number
): number {
  const passos = Math.max(
    8,
    Math.ceil((zAteMm - zDeMm) / PASSO_VARREDURA_MM)
  );
  const passo = (zAteMm - zDeMm) / passos;
  let zAnterior = zDeMm;
  let apice = zAteMm;
  for (let k = 1; k <= passos; k++) {
    const z = zDeMm + passo * k;
    const meia = meiaCavidade(z);
    if (meia <= 0) {
      const anterior = meiaCavidade(zAnterior);
      const fracao = anterior > 0 ? anterior / (anterior - meia) : 0;
      return zAnterior + (z - zAnterior) * fracao;
    }
    zAnterior = z;
  }
  // A cavidade chegou viva ao teto: o fecho é um PLATÔ plano (ponte). Onde a
  // aba manda na silhueta, DESCER o teto o estreita — desce até o vão caber
  // no teto de ponte do FDM (⚑ FURO_PONTE_MAX_MM). Numa pirâmide baixa e
  // larga a rampa manda: descer ALARGA, e aí o teto fica onde está (clamp,
  // nunca erro — o platô chega a ~22 mm nesse canto extremo; ⚑ medir
  // impresso, e se doer o teto é bordaTamanhoMaxMm que aperta).
  while (
    apice - passo > zPisoDoTetoMm &&
    meiaCavidade(apice) > MEIO_VAO_PONTE_MM
  ) {
    if (meiaCavidade(apice - passo) >= meiaCavidade(apice)) break;
    apice -= passo;
  }
  return apice;
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
  // Silhueta externa (com a borda encurvada já grampeada) e as linhas de
  // grade próprias da faixa do arco — o PÉ entra como linha exata.
  const sil = silhuetaPiramide(p);
  const linhasBorda =
    sil.alturaBordaMm > 0
      ? [sil.zPeMm, ...linhasBordaMm(p, H)].filter((z) => z > 1e-6)
      : [];
  const externo: CascoPiramidal = {
    a0,
    altura: H,
    zBase: 0,
    s,
    meiaLarguraEm: sil.alturaBordaMm > 0 ? sil.meiaLarguraEmMm : undefined,
    linhasExtra: linhasBorda,
  };

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
  // Com BORDA a cavidade acompanha o arco na MESMA cota z global (o
  // parâmetro local da cavidade tem rampa própria — calcular o offset nele
  // torceria a parede). Dentro da faixa a casca interna é a silhueta
  // externa deslocada t na NORMAL, amostrada como polilinha:
  //   r' = r − t/√(1+m²)   z' = z + t·m/√(1+m²)   (m = dr/dz)
  // — a espessura da parede fica ≈ espessuraParedeMm em QUALQUER direção e
  // a superfície da cavidade herda as inclinações da externa, logo continua
  // dentro de F4. Duas armadilhas que este caminho evita: recuar t·√(1+m²)
  // na HORIZONTAL só acerta em primeira ordem (onde o arco encurva muito o
  // teto passava de F4 — medido 1,29·tan F4 com parede grossa), e erodir por
  // um disco amostrado serrilha a superfície em ~passo/2t rad (o bastante
  // para estourar F4 numa pirâmide que já nasce no limite). Onde a normal se
  // cruza (o lábio dobra), o MENOR valor entre os segmentos que cobrem a
  // cota é o certo: a cavidade é o que sobra dos dois lados.
  // Abaixo do pé da faixa a conta é a reta da F1 (o deslocamento normal de
  // uma face plana É a face paralela, exatamente o que bi/hi/zi descrevem):
  // a malha sem borda fica idêntica à da F1.
  const paralela: { r: number; z: number }[] = [];
  if (sil.alturaBordaMm > 0) {
    const zDe = Math.max(0, sil.zPeMm - t);
    const passos = Math.max(8, Math.ceil((H - zDe) / PASSO_PARALELA_MM));
    for (let k = 0; k <= passos; k++) {
      const z = zDe + ((H - zDe) * k) / passos;
      // A silhueta CONVERGE (m < 0) fora da aba: o sinal vem da derivada.
      const m = sil.derivadaEmMm(z);
      const norma = Math.hypot(1, m);
      paralela.push({
        r: sil.meiaLarguraEmMm(z) - t / norma,
        z: z + (t * m) / norma,
      });
    }
  }
  const meiaCavidade = (zMm: number): number => {
    // A troca de conta fica t ABAIXO do pé da faixa, não no pé: o ponto da
    // cavidade em z nasce do ponto externo ~t·|m|/√(1+m²) mais ALTO, onde o
    // arco já começou — a cavidade encurva antes da superfície externa. Na
    // reta as duas contas coincidem, então a costura é lisa.
    if (sil.alturaBordaMm <= 0 || zMm <= sil.zPeMm - t) {
      return bi * (1 - (zMm - t) / hi);
    }
    let menor = Infinity;
    for (let i = 0; i + 1 < paralela.length; i++) {
      const A = paralela[i];
      const B = paralela[i + 1];
      if (zMm < Math.min(A.z, B.z) - 1e-9) continue;
      if (zMm > Math.max(A.z, B.z) + 1e-9) continue;
      const dz = B.z - A.z;
      const f = Math.abs(dz) < 1e-12 ? 0 : (zMm - A.z) / dz;
      const r = A.r + (B.r - A.r) * Math.min(1, Math.max(0, f));
      if (r < menor) menor = r;
    }
    return menor === Infinity ? 0 : Math.max(0, menor);
  };
  const zApiceCav =
    sil.alturaBordaMm > 0 && H - t > t
      ? zApiceCavidadeMm(meiaCavidade, t, H - t, sil.zPeMm)
      : zi;
  const interno: CascoPiramidal = {
    a0: bi,
    altura: hi,
    zBase: t,
    s: si,
    meiaLarguraEm: sil.alturaBordaMm > 0 ? meiaCavidade : undefined,
    // O ápice da cavidade entra como linha EXATA: quando ele é um platô (a
    // aba mantém a cavidade viva até z = H − t), o leque fecha o teto
    // horizontal — parede de espessura t sob a tampa do pináculo, PONTE
    // apoiada nas duas pontas. Sem a linha exata o leque sairia como um
    // cone rasíssimo, que é a mesma ponte com cara de balanço de 87°.
    linhasExtra: [...linhasBorda, zApiceCav],
    zApiceMm: zApiceCav,
  };
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
    // Teto da rampa: a faixa da borda não hospeda furo, então o furo para
    // no PÉ dela (em w de cada casca — a mesma cota z global).
    const wTetoBordaExt =
      sil.alturaBordaMm > 0 ? (sil.zPeMm * s) / H : Infinity;
    const wTetoBordaInt =
      sil.alturaBordaMm > 0 && hi > 0
        ? ((sil.zPeMm - t) * si) / hi
        : Infinity;
    const ajusteExt = (fp: FuroPlanejado, mV: number): FaceParaAjuste => ({
      a0,
      s,
      wc: wcExt,
      mV,
      wTeto: Math.min(s - mV, wTetoBordaExt - mV),
      gEsq: fp.uEsq === null ? null : fp.uEsq / bandaExt,
      gDir: fp.uDir === null ? null : fp.uDir / bandaExt,
    });
    const ajusteInt = (fp: FuroPlanejado, mV: number): FaceParaAjuste => ({
      a0: bi,
      s: si,
      wc: wcInt,
      mV,
      wTeto: Math.min(si - mV, wTetoBordaInt - mV),
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
