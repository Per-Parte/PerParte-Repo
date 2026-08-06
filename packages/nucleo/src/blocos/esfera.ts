/**
 * Montagem v2 · F1 — primitivo ESFERA (esferoide: escalas ≠ 1 alongam/achatam).
 *
 * Receita de topologia (espec da F1, seção "esfera" — siga-a, não invente):
 * — pura: malhaRevolucao do semicírculo (perfil x = r(y), y de 0 a altura),
 *   como todo sólido do núcleo;
 * — oca: casca externa + casca interna com orientação invertida, unidas por
 *   RESPIRO polar no topo (abertura circular que resolve o balanço do polo
 *   interno — F4 — e dá saída de luz): grade paramétrica (θ × latitude) com
 *   túnel de parede na borda do respiro;
 * — furos: aberturas na banda equatorial (meia-abertura PARAMÉTRICA de
 *   bandaFuroEsferaRad — ≤ ±30°, apertando com o achatamento para o teto
 *   do furo nunca deitar além de F4), recorte em espaço de parâmetro com
 *   túnel externa↔interna (receita única do furo).
 *
 * Convenções do núcleo (malha.ts): mm; Z é a vertical de impressão (F8);
 * origem no eixo com base em z = 0 (a esfera TANGENCIA a mesa no polo);
 * enrolamento anti-horário visto de fora (volumeAssinadoMm3 > 0).
 * Estanqueidade por ÍNDICE: vértices COMPARTILHADOS entre células
 * vizinhas — nunca duplicados numa costura.
 *
 * gerarMalhaEsfera assume params já grampeados (grampearBloco antes).
 */

import { malhaRevolucao } from "../malha";
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
  bandaFuroEsferaRad,
  grampearBloco,
  larguraBrutaMm,
} from "./limites";

const DOIS_PI = Math.PI * 2;

/**
 * Ângulo-alvo da INCLINAÇÃO real da casca (graus da vertical) na borda do
 * respiro polar quando OCA — resolve o teto da cavidade (F4) e vira saída
 * de luz (a "oca" nunca é 100% fechada). Uma FRAÇÃO fixa do raio deixava
 * o teto da oca achatada a ~83° da vertical (achado da revisão de 06/08);
 * com o ângulo-alvo a inclinação real na borda fica ≤ 69,5° para QUALQUER
 * esferoide. ⚑ 69,5° equivale a acos(0,35) da fração antiga na esfera
 * REDONDA — decisão anterior preservada; validar impresso.
 */
export const RESPIRO_ANGULO_GRAUS = 69.5;

/**
 * Platô mínimo no polo, em mm — mesma família do piso de raio no eixo do
 * núcleo (geometria.ts): o perfil da PURA termina num anel deste raio em
 * z = 0 e z = 2c em vez de raio zero, para o ápice de malhaRevolucao não
 * gerar um anel degenerado no polo (triângulos de área nula no STL).
 * Invisível a olho (Ø ~1,2 mm) e o minZ/maxZ ficam EXATOS. ⚑
 */
const RAIO_POLO_MM = 0.6;

/**
 * Geometria do respiro polar da OCA — fonte ÚNICA para a malha E o apoio
 * (A1: o respiro TRUNCA o topo externo, e o apoio precisa dizer a verdade
 * sobre o topo real; senão um bloco pousado sobre a esfera oca flutuaria).
 * Inclui o freio defensivo do offset pela normal (família do freio 0,75
 * da pirâmide): a parede afina antes de alcançar o menor raio de
 * curvatura do esferoide (c²/a no equador, a²/c no polo), onde normais
 * vizinhas se cruzam e a cavidade dobraria sobre si. Inativo em esferas
 * quase redondas (parede ≤ menor/4 pelos clamps). ⚑ validar extremos.
 */
export function respiroEsferaMm(p: ParametrosBloco): {
  paredeMm: number;
  raioMm: number;
  phi: number;
  zBordaMm: number;
} {
  const a = Math.max(RAIO_POLO_MM * 4, larguraBrutaMm(p) / 2);
  const c = Math.max(RAIO_POLO_MM * 4, alturaBrutaMm(p) / 2);
  const paredeMm = Math.min(
    p.espessuraParedeMm,
    0.75 * Math.min((c * c) / a, (a * a) / c)
  );
  // Latitude paramétrica cuja inclinação REAL da superfície é o alvo:
  // tan(inclinação) = (a/c)·tan(φ) → φ = atan((c/a)·tan(alvo)). Clamp
  // defensivo a ≤ 89° (com c/a ≤ 3 pelos limites, o pior caso é ~83°).
  const alvoRad = (RESPIRO_ANGULO_GRAUS * Math.PI) / 180;
  const phi = Math.min(
    (89 * Math.PI) / 180,
    Math.atan((c / a) * Math.tan(alvoRad))
  );
  const raioMm = a * Math.cos(phi);
  return { paredeMm, raioMm, phi, zBordaMm: c * (1 + Math.sin(phi)) };
}

export const apoioEsfera: ApoioBloco = {
  // OCA: o topo real é a borda do respiro (o polo está aberto).
  alturaTopoMm: (p) =>
    p.oca ? respiroEsferaMm(p).zBordaMm : alturaBrutaMm(p),
  // Pura apoia num PONTO (polo); oca só é estável coaxial (pousada na
  // borda do respiro — anel curvo, qualquer offset escorrega). Ambas: 0.
  raioApoioSuperiorMm: () => 0,
  raioApoioInferiorMm: () => 0,
  raioEnvelopeMm(p, zMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    if (p.oca && zMm > respiroEsferaMm(p).zBordaMm) return 0;
    const u = (zMm - c) / c;
    if (u < -1 || u > 1) return 0;
    return a * Math.sqrt(Math.max(0, 1 - u * u));
  },
  zSuperficieTopoMm(p, dMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    if (dMm > a) return null;
    if (p.oca) {
      const { raioMm, paredeMm } = respiroEsferaMm(p);
      // Dentro do respiro o pouso é no PISO INTERNO da cavidade: o objeto
      // cai pela abertura e assenta no fundo do "bowl" (A1 verdadeiro —
      // devolver null deixava um bloco pequeno "assentar" na mesa DENTRO
      // da esfera; achado da revisão de 06/08). Aproximação elipsoidal do
      // offset pela normal ⚑ (semi-eixos a−parede e c−parede): em d = 0
      // dá paredeMm, batendo com o apiceInterno da malha.
      if (dMm < raioMm) {
        const aInt = a - paredeMm;
        return (
          c - (c - paredeMm) * Math.sqrt(Math.max(0, 1 - (dMm / aInt) ** 2))
        );
      }
    }
    return c + c * Math.sqrt(Math.max(0, 1 - (dMm / a) ** 2));
  },
  zSuperficieBaseMm(p, dMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    if (dMm > a) return null;
    return c - c * Math.sqrt(Math.max(0, 1 - (dMm / a) ** 2));
  },
  // Borda do respiro: a superfície superior salta do piso da cavidade para
  // a calota externa — a varredura de tangencia.ts amostra o raio exato.
  raiosNotaveisMm: (p) => (p.oca ? [respiroEsferaMm(p).raioMm] : []),
  // Planta redonda: o raio inscrito da seção É o raio dela. Mede o
  // contorno EXTERNO (a casca da oca também apoia — todo bloco da F1 tem
  // fundo fechado e pousa sobre o anel, como no ponto de luz).
  raioPlatoMm(p, zMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    if (zMm < 0 || zMm > 2 * c) return 0;
    const u = (zMm - c) / c;
    return a * Math.sqrt(Math.max(0, 1 - u * u));
  },
};

/** Ponto no espaço de parâmetro da banda (a = arco equatorial em mm,
 * b = arco meridional em mm; centro do furo no equador = origem). */
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
 * ⚑ casca.ts: este utilitário, contornoFuroMm, ordenarPorAngulo e
 * costurarAnel são cópias fiéis da receita única do cilindro — extrair
 * para src/blocos/casca.ts na consolidação (mesma nota da pirâmide),
 * sem mudar comportamento.
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
 * no espaço de parâmetro (θ crescente, latitude crescente) = normais fora.
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

/**
 * Perfil do semicírculo x = r(y), y de 0 a 2c, amostrado da latitude.
 * O EQUADOR é ponto EXATO do perfil (nLat par → φ = 0 amostrado): a caixa
 * envolvente bate com 2a. As pontas terminam num anel de raio RAIO_POLO_MM
 * em z = 0 e z = 2c — malhaRevolucao fecha com os ápices no eixo nessas
 * MESMAS cotas (perfil[0].y e perfil[último].y), então minZ = 0 e
 * maxZ = 2c exatos, sem anel de raio zero no polo.
 */
function perfilEsferoide(
  a: number,
  c: number,
  nColunas: number
): { x: number; y: number }[] {
  const nLat = 2 * Math.max(8, Math.round(nColunas / 4));
  const rPolo = Math.min(RAIO_POLO_MM, (a * Math.sin(Math.PI / nLat)) / 2);
  const perfil: { x: number; y: number }[] = [{ x: rPolo, y: 0 }];
  for (let j = 1; j < nLat; j++) {
    const phi = -Math.PI / 2 + (j * Math.PI) / nLat;
    perfil.push({ x: a * Math.cos(phi), y: c * (1 + Math.sin(phi)) });
  }
  perfil.push({ x: rPolo, y: 2 * c });
  return perfil;
}

/** Plano dos furos: polígono (já grampeado à geometria) + blocos na grade. */
interface PlanoFurosEsfera {
  pontos: PontoParam[];
  /** Arco meridional (v = c·φ) das linhas de borda do bloco recortado. */
  vBlocoBaixo: number;
  vBlocoAlto: number;
  blocos: { thetaCentro: number; colEsq: number; colDir: number }[];
}

/**
 * Cascata geométrica dos furos — clamp, nunca erro: o grampeador já
 * garante furo ≤ furoMaximoMm; aqui só sobram ajustes finos de grade
 * (célula inteira, moldura, tira, banda de ±30°) que em caso extremo
 * ENCOLHEM o polígono em vez de falhar. null = nem raso coube (sem furo).
 */
function planejarFurosEsfera(
  p: ParametrosBloco,
  a: number,
  c: number,
  nColunas: number
): PlanoFurosEsfera | null {
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

  // Latitude: furos CENTRADOS no equador; se a meia-banda paramétrica
  // (bandaFuroEsferaRad em arco meridional — a MESMA fórmula que
  // furoMaximoMm usa em limites.ts: o furo prometido é o entregue) não
  // hospeda o furo com moldura + tira, o polígono encolhe na vertical
  // até caber.
  const alcance = c * bandaFuroEsferaRad(p) - MOLDURA_FURO_MM - TIRA_BANDA_MM;
  if (alcance < 1) return null;
  const escalaB = Math.min(1, alcance / meiaB);

  // Arco equatorial: bloco inteiro de células ao redor do centro (furo +
  // 1 célula de moldura), sem nunca engolir a parede entre furos vizinhos.
  const arcoCelula = (DOIS_PI / nColunas) * a;
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
  const blocos: PlanoFurosEsfera["blocos"] = [];
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
    vBlocoBaixo: -(meiaBFinal + MOLDURA_FURO_MM),
    vBlocoAlto: meiaBFinal + MOLDURA_FURO_MM,
    blocos,
  };
}

/**
 * Casca oca (com ou sem furos): grade paramétrica (θ × latitude) própria.
 * Casca externa aberta no respiro polar + casca interna idêntica em
 * topologia (offset para DENTRO pela normal externa) com orientação
 * invertida por inteiro no fim; a borda do respiro das duas é ligada por
 * um túnel de parede (anel de quads). O polo INFERIOR das duas fecha em
 * leque no eixo. As duas grades COMPARTILHAM as mesmas linhas de latitude
 * na banda — os furos recortam células idênticas nas duas e o túnel
 * radial (na normal) liga os polígonos.
 */
function malhaEsferaOca(
  p: ParametrosBloco,
  a: number,
  c: number,
  segmentos: number
): MalhaBloco {
  // Parede (com o freio defensivo de curvatura) e respiro vêm da fonte
  // única respiroEsferaMm — a MESMA que o apoio A1 consome: o topo que a
  // malha constrói é exatamente o topo que a tangência enxerga.
  const { paredeMm: parede, phi: phiRespiro } = respiroEsferaMm(p);

  // Anel externo (r, z) numa latitude e o seu deslocado −parede·n̂: a
  // normal do esferoide só depende da latitude, então cada linha da casca
  // interna continua um círculo — a grade interna é a externa deslizada.
  const paraDentro = (phi: number) => {
    const rExt = a * Math.cos(phi);
    const zExt = c * (1 + Math.sin(phi));
    const nr = Math.cos(phi) / a;
    const nz = Math.sin(phi) / c;
    const norma = Math.hypot(nr, nz);
    return {
      rExt,
      zExt,
      rInt: rExt - (parede * nr) / norma,
      zInt: zExt - (parede * nz) / norma,
    };
  };

  const nColunas = segmentosGrade(segmentos, p.furos?.quantidade ?? 0);
  const plano = planejarFurosEsfera(p, a, c, nColunas);

  // Linhas de latitude compartilhadas pelas DUAS cascas. O equador é
  // linha EXATA (caixa envolvente bate com 2a) e as bordas do bloco do
  // furo são linhas exatas da grade (célula inteira, sem meia-célula).
  // v ↔ φ pelo mapeamento LINEAR v = c·φ (o arco meridional exato do
  // esferoide pede integral elíptica; a consistência polígono↔grade é o
  // que importa para a malha — o desvio é só visual e pequeno ⚑).
  const passoPhi = Math.PI / Math.max(24, Math.round(nColunas / 2));
  const linhasPhi: number[] = [-Math.PI / 2 + passoPhi];
  const preencherAte = (ate: number): number => {
    const de = linhasPhi[linhasPhi.length - 1];
    const passos = Math.max(1, Math.ceil((ate - de) / passoPhi));
    for (let t = 1; t < passos; t++) {
      linhasPhi.push(de + (t * (ate - de)) / passos);
    }
    linhasPhi.push(ate);
    return linhasPhi.length - 1;
  };
  let linhaBlocoBaixo = -1;
  let linhaBlocoAlto = -1;
  if (plano) {
    linhaBlocoBaixo = preencherAte(plano.vBlocoBaixo / c);
    preencherAte(0); // equador
    linhaBlocoAlto = preencherAte(plano.vBlocoAlto / c);
  } else {
    preencherAte(0); // equador
  }
  // A banda fica sempre abaixo da borda do respiro: as duas latitudes vêm
  // de atan((c/a)·tan(alvo)) com alvos F4 = 45° (banda) < 69,5° (respiro)
  // — atan e tan crescem juntas, então banda < respiro para qualquer
  // esferoide. A linha do respiro é a última, com células inteiras antes.
  const linhaRespiro = preencherAte(phiRespiro);

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
  // Nota: anel() cria a linha INTEIRA (nColunas vértices); as colunas
  // interiores aos blocos removidos dos furos ficam ÓRFÃS (nenhum
  // triângulo as referencia). Inofensivas hoje — estão SOBRE a superfície
  // do esferoide, não inflam a caixa nem o volume; a consolidação
  // casca.ts pode podá-las.
  const anel = (r: number, z: number): number[] => {
    const ids: number[] = [];
    for (let i = 0; i < nColunas; i++) {
      ids.push(vertice(r * cossenos[i], r * senos[i], z));
    }
    return ids;
  };
  const gradeExterna: number[][] = [];
  const gradeInterna: number[][] = [];
  for (const phi of linhasPhi) {
    const o = paraDentro(phi);
    gradeExterna.push(anel(o.rExt, o.zExt));
    gradeInterna.push(anel(o.rInt, o.zInt));
  }
  // Polos inferiores: o externo tangencia a mesa (z = 0 EXATO — nada
  // abaixo); o interno é o offset dele pela normal (0, 0, −1).
  const apiceExterno = vertice(0, 0, 0);
  const apiceInterno = vertice(0, 0, parede);

  // ---- triângulos ----
  const externos: number[] = [];
  // A cavidade é construída com o enrolamento de um SÓLIDO (normais para
  // fora dela) e invertida por inteiro no fim — troca b ↔ c dos trios.
  const internos: number[] = [];
  const quad = (
    destino: number[],
    q1: number,
    q2: number,
    q3: number,
    q4: number
  ) => {
    destino.push(q1, q2, q3, q1, q3, q4);
  };
  const celulaRemovida = (i: number, j: number): boolean => {
    if (!plano || j < linhaBlocoBaixo || j >= linhaBlocoAlto) return false;
    for (const b of plano.blocos) {
      if (i >= b.colEsq && i < b.colDir) return true;
    }
    return false;
  };

  // Uma casca aberta no respiro (a mesma topologia para as duas): leque
  // do polo inferior + parede latitude × θ, células dos blocos de fora.
  const casca = (grade: number[][], apice: number, destino: number[]) => {
    for (let i = 0; i < nColunas; i++) {
      const i2 = (i + 1) % nColunas;
      destino.push(apice, grade[0][i2], grade[0][i]);
    }
    for (let j = 0; j < linhaRespiro; j++) {
      for (let i = 0; i < nColunas; i++) {
        if (celulaRemovida(i, j)) continue;
        const i2 = (i + 1) % nColunas;
        quad(
          destino,
          grade[j][i],
          grade[j][i2],
          grade[j + 1][i2],
          grade[j + 1][i]
        );
      }
    }
  };
  casca(gradeExterna, apiceExterno, externos);
  casca(gradeInterna, apiceInterno, internos);

  // Túnel do respiro: anel de quads ligando a borda externa à interna —
  // a parede da abertura polar (mesma família do túnel do furo; não é
  // invertido: nasce já com as normais para dentro da abertura).
  const bordaExterna = gradeExterna[linhaRespiro];
  const bordaInterna = gradeInterna[linhaRespiro];
  for (let i = 0; i < nColunas; i++) {
    const i2 = (i + 1) % nColunas;
    externos.push(bordaExterna[i], bordaExterna[i2], bordaInterna[i2]);
    externos.push(bordaExterna[i], bordaInterna[i2], bordaInterna[i]);
  }

  // ---- furos: recorte + costura + túnel na normal ----
  if (plano) {
    const vDaLinha = (j: number) => c * linhasPhi[j];
    const contornoBloco = (
      grade: number[][],
      bloco: PlanoFurosEsfera["blocos"][number]
    ): ContornoAnel => {
      const itens: { indice: number; a: number; b: number }[] = [];
      const arco = (i: number) =>
        ((i / nColunas) * DOIS_PI - bloco.thetaCentro) * a;
      for (let i = bloco.colEsq; i <= bloco.colDir; i++) {
        itens.push({
          indice: grade[linhaBlocoBaixo][i],
          a: arco(i),
          b: vDaLinha(linhaBlocoBaixo),
        });
        itens.push({
          indice: grade[linhaBlocoAlto][i],
          a: arco(i),
          b: vDaLinha(linhaBlocoAlto),
        });
      }
      for (let j = linhaBlocoBaixo + 1; j < linhaBlocoAlto; j++) {
        itens.push({
          indice: grade[j][bloco.colEsq],
          a: arco(bloco.colEsq),
          b: vDaLinha(j),
        });
        itens.push({
          indice: grade[j][bloco.colDir],
          a: arco(bloco.colDir),
          b: vDaLinha(j),
        });
      }
      return ordenarPorAngulo(itens);
    };

    for (const bloco of plano.blocos) {
      // O MESMO polígono nas duas cascas (mesmo θ e latitude; a interna é
      // o offset pela normal): o anel de M×2 triângulos entre eles é a
      // parede do furo, um prisma na direção da normal externa.
      const doLadoExterno: { indice: number; a: number; b: number }[] = [];
      const doLadoInterno: { indice: number; a: number; b: number }[] = [];
      for (const q of plano.pontos) {
        const th = bloco.thetaCentro + q.a / a;
        const o = paraDentro(q.b / c);
        const co = Math.cos(th);
        const se = Math.sin(th);
        doLadoExterno.push({
          indice: vertice(o.rExt * co, o.rExt * se, o.zExt),
          a: q.a,
          b: q.b,
        });
        doLadoInterno.push({
          indice: vertice(o.rInt * co, o.rInt * se, o.zInt),
          a: q.a,
          b: q.b,
        });
      }
      const furoExterno = ordenarPorAngulo(doLadoExterno);
      const furoInterno = ordenarPorAngulo(doLadoInterno);
      costurarAnel(externos, contornoBloco(gradeExterna, bloco), furoExterno);
      costurarAnel(internos, contornoBloco(gradeInterna, bloco), furoInterno);
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

export function gerarMalhaEsfera(
  p: ParametrosBloco,
  segmentos = 48
): MalhaBloco {
  // Semi-eixos do esferoide: a em planta, c na vertical; centro em z = c
  // (a base tangencia z = 0, o topo fica em z = 2c). Pisos defensivos —
  // o grampeador nunca entrega menos que Ø 20 mm.
  const a = Math.max(RAIO_POLO_MM * 4, larguraBrutaMm(p) / 2);
  const c = Math.max(RAIO_POLO_MM * 4, alturaBrutaMm(p) / 2);
  if (!p.oca) {
    // PURA: o caminho de todo o núcleo — semicírculo revolucionado (o
    // grampeador nunca entrega furos com oca = false).
    const nColunas = segmentosGrade(segmentos, 0);
    return malhaRevolucao(perfilEsferoide(a, c, nColunas), nColunas);
  }
  return malhaEsferaOca(p, a, c, segmentos);
}

export const primitivoEsfera: PrimitivoBloco = {
  forma: "esfera",
  gerarMalha: gerarMalhaEsfera,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "esfera" }),
  apoio: apoioEsfera,
};
