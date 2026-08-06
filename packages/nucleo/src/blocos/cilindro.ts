/**
 * Montagem v2 · F1 — primitivo CILINDRO.
 *
 * Receita de topologia (espec da F1, seção "cilindro"):
 * — PURA: malhaRevolucao do perfil retangular (pé no raio, sobe, fecha no
 *   eixo em cima e embaixo pelos ápices) — o caminho de todo o núcleo.
 * — OCA: casca externa + interna invertida (grade θ × z), FUNDO FECHADO
 *   (Restrição honesta da F1: a abertura de encaixe do ponto de luz é
 *   fase posterior ⚑); a cavidade fecha em TETO CÔNICO a 45° (= F4) e o
 *   ápice trunca no que couber (clamp geométrico interno, não do usuário).
 * — FUROS: é o "cubo enrolado" — receita única do furo na grade (θ, z) da
 *   lateral: cada furo reserva um bloco retangular inteiro de células
 *   (tamanho do furo + 1 célula de moldura), o contorno do furo é um
 *   polígono em espaço de parâmetro (○ M = 16, □ M = 8, △ M = 6 com o
 *   vértice para CIMA), a borda do bloco costura no polígono como cinta
 *   ordenada por ângulo ("zipper") e um anel de M quads liga o polígono
 *   externo ao interno — o túnel RADIAL de parede.
 *
 * Convenções do núcleo (malha.ts): mm; Z é a vertical de impressão (F8);
 * origem no eixo com base em z = 0; enrolamento anti-horário visto de
 * fora (volumeAssinadoMm3 > 0). Estanqueidade por ÍNDICE: vértices são
 * COMPARTILHADOS entre células vizinhas — nunca duplicados numa costura.
 *
 * gerarMalhaCilindro assume params já grampeados (grampearBloco antes).
 */

import { malhaRevolucao } from "../malha";
import type {
  ApoioBloco,
  FormaFuro,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import { alturaBrutaMm, grampearBloco, larguraBrutaMm } from "./limites";

const DOIS_PI = Math.PI * 2;

/** Mesmo piso de raio no eixo da geometria do núcleo (geometria.ts). */
const RAIO_EIXO_MM = 0.6;

/** Moldura entre o polígono do furo e a borda do bloco recortado (⚑). */
const MOLDURA_FURO_MM = 2;

/** Tira mínima de células entre o bloco do furo e as bordas da banda (⚑). */
const TIRA_BANDA_MM = 1;

/** Passo-alvo das linhas z da grade da casca oca, em mm. */
const PASSO_LINHA_MM = 4;

export const apoioCilindro: ApoioBloco = {
  alturaTopoMm: (p) => alturaBrutaMm(p),
  raioApoioSuperiorMm: (p) => larguraBrutaMm(p) / 2,
  raioApoioInferiorMm: (p) => larguraBrutaMm(p) / 2,
  raioEnvelopeMm(p, zMm) {
    if (zMm < 0 || zMm > alturaBrutaMm(p)) return 0;
    return larguraBrutaMm(p) / 2;
  },
  zSuperficieTopoMm(p, dMm) {
    if (dMm > larguraBrutaMm(p) / 2) return null;
    return alturaBrutaMm(p);
  },
  zSuperficieBaseMm(p, dMm) {
    if (dMm > larguraBrutaMm(p) / 2) return null;
    return 0;
  },
};

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
 * Casca oca (com ou sem furos): superfície externa fechada (tampas em
 * z = 0 e z = H) + cavidade interna invertida (piso, parede θ × z e teto
 * cônico a 45°). As duas laterais usam a MESMA grade (θ, z) na banda —
 * os furos recortam células idênticas nas duas e o túnel liga os anéis.
 */
function malhaCilindroOco(
  p: ParametrosBloco,
  raioExterno: number,
  alturaTotal: number,
  segmentos: number
): MalhaBloco {
  const parede = p.espessuraParedeMm;
  const raioInterno = Math.max(RAIO_EIXO_MM * 2, raioExterno - parede);
  const zPiso = Math.min(parede, alturaTotal / 3);
  const zTetoMax = alturaTotal - zPiso;
  // Ombro da cavidade: onde a parede interna vira o cone de 45° (F4).
  const zOmbroCheio = Math.max(zPiso, zTetoMax - raioInterno);

  const nColunas = segmentosGrade(segmentos, p.furos?.quantidade ?? 0);
  const plano = planejarFuros(
    p,
    raioExterno,
    nColunas,
    zPiso,
    zTetoMax,
    alturaTotal / 2
  );

  // Furos empurram o ombro para cima quando precisam de banda: o cone
  // trunca no que couber e o disco do teto vira ponte ⚑ (validar impresso
  // junto com FURO_PONTE_MAX_MM — furo grande pode passar do teto de ponte).
  const zOmbro = plano
    ? Math.min(
        zTetoMax,
        Math.max(zOmbroCheio, plano.zBlocoAlto + TIRA_BANDA_MM)
      )
    : zOmbroCheio;

  // Linhas z da banda compartilhada; as bordas do bloco do furo são
  // linhas EXATAS da grade (célula inteira, sem meia-célula).
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
    preencherAte(zOmbro);
  } else if (zOmbro - zPiso > 1e-9) {
    preencherAte(zOmbro);
  }
  const linhaOmbro = linhas.length - 1;

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
  const linhasExternas = [0, ...linhas, alturaTotal];
  const gradeExterna = linhasExternas.map((z) => anel(raioExterno, z));
  const gradeInterna = linhas.map((z) => anel(raioInterno, z));

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

  // Parede externa (z = 0 → H); na banda, células dos blocos ficam de fora.
  for (let j = 0; j < linhasExternas.length - 1; j++) {
    for (let i = 0; i < nColunas; i++) {
      if (j >= 1 && j <= linhaOmbro && celulaRemovida(i, j - 1)) continue;
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

  // Tampas externas — fundo SEMPRE fechado na F1 (abertura de encaixe do
  // ponto de luz é fase posterior ⚑).
  const centroBase = vertice(0, 0, 0);
  const centroTopo = vertice(0, 0, alturaTotal);
  const anelBase = gradeExterna[0];
  const anelTopoExterno = gradeExterna[gradeExterna.length - 1];
  for (let i = 0; i < nColunas; i++) {
    const i2 = (i + 1) % nColunas;
    externos.push(centroBase, anelBase[i2], anelBase[i]);
    externos.push(centroTopo, anelTopoExterno[i], anelTopoExterno[i2]);
  }

  // Parede da cavidade: cópia da grade deslocada para dentro, mesmo
  // recorte de células (receita única do furo, item 6 da espec).
  for (let j = 0; j < linhaOmbro; j++) {
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

  // Teto cônico a 45° (= F4 exato quando o cone cabe inteiro); truncado,
  // fecha num disco — clamp geométrico interno, nunca erro.
  const anelOmbro = gradeInterna[linhaOmbro];
  const alturaCone = zTetoMax - zOmbro;
  const raioTeto = raioInterno - alturaCone;
  if (alturaCone <= 1e-9) {
    // Caso extremo: banda comeu o cone inteiro — teto plano direto.
    const centroTeto = vertice(0, 0, zOmbro);
    for (let i = 0; i < nColunas; i++) {
      const i2 = (i + 1) % nColunas;
      internos.push(centroTeto, anelOmbro[i], anelOmbro[i2]);
    }
  } else if (raioTeto <= RAIO_EIXO_MM) {
    // Cone cheio: ápice no eixo.
    const apice = vertice(0, 0, zTetoMax);
    for (let i = 0; i < nColunas; i++) {
      const i2 = (i + 1) % nColunas;
      internos.push(apice, anelOmbro[i], anelOmbro[i2]);
    }
  } else {
    // Cone truncado: anel do teto + disco (⚑ ponte — ver zOmbro acima).
    const anelTeto = anel(raioTeto, zTetoMax);
    for (let i = 0; i < nColunas; i++) {
      const i2 = (i + 1) % nColunas;
      quad(internos, anelOmbro[i], anelOmbro[i2], anelTeto[i2], anelTeto[i]);
    }
    const centroTeto = vertice(0, 0, zTetoMax);
    for (let i = 0; i < nColunas; i++) {
      const i2 = (i + 1) % nColunas;
      internos.push(centroTeto, anelTeto[i], anelTeto[i2]);
    }
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
        doLadoExterno.push({
          indice: vertice(raioExterno * c, raioExterno * s, z),
          a: q.a,
          b: q.b,
        });
        doLadoInterno.push({
          indice: vertice(raioInterno * c, raioInterno * s, z),
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
  const raio = Math.max(RAIO_EIXO_MM * 2, larguraBrutaMm(p) / 2);
  const altura = alturaBrutaMm(p);
  if (!p.oca) {
    // Pura: o caminho de todo o núcleo — perfil retangular revolucionado.
    return malhaRevolucao(
      [
        { x: raio, y: 0 },
        { x: raio, y: altura },
      ],
      segmentosGrade(segmentos, 0)
    );
  }
  return malhaCilindroOco(p, raio, altura, segmentos);
}

export const primitivoCilindro: PrimitivoBloco = {
  forma: "cilindro",
  gerarMalha: gerarMalhaCilindro,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "cilindro" }),
  apoio: apoioCilindro,
};
