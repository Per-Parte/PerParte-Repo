/**
 * Montagem v2 · F1 — limites e clamps dos blocos.
 *
 * Tudo DERIVADO das regras existentes (importa, não copia): F1 = volume
 * máximo por parte, F2 = parede mínima estrutural, F4 = balanço máximo.
 * Limites de fabricação viram clamps de controle, nunca erro — a cascata
 * de grampearBloco "encosta" no limite, exatamente como o resto do núcleo.
 * Os nomes exportados aqui são os que os sliders da F3 vão consumir.
 */

import { REGRAS } from "../regras";
import { PALETA } from "../catalogo";
import {
  FORMAS_BLOCO,
  FORMAS_FURO,
  type FormaBloco,
  type FormaFuro,
  type FurosBloco,
  type ParametrosBloco,
} from "./tipos";

/** Parede mínima do bloco = F2 (a MESMA constante do núcleo). */
export const PAREDE_MINIMA_BLOCO_MM = REGRAS.F.paredeEstruturalMm.min;

/** Balanço máximo dos blocos = F4 (graus da vertical). */
export const BALANCO_MAXIMO_BLOCO_GRAUS = REGRAS.F.balancoMaximoGraus;

/**
 * Maior vão que o teto de um furo pode pedir do FDM em ponte, em mm.
 * ⚑ proposto — validar impresso (□ tem teto reto = ponte pura; ○ fecha
 * em arco e perdoa mais; △ aponta para cima e nem precisa).
 */
export const FURO_PONTE_MAX_MM = 20;

/** Faixas dos sliders da F3 (mm e escalas adimensionais). */
export const LIMITES_BLOCO = {
  /** ⚑ proposto: 40 mm ainda pega na mão; 200 deixa margem p/ escalas no F1. */
  tamanhoMm: { min: 40, max: 200, passo: 5 },
  /** Achatada 50% ↔ esticada 150% (o teto real depende do tamanho — F1). */
  escalaAltura: { min: 0.5, max: 1.5, passo: 0.05 },
  escalaLargura: { min: 0.5, max: 1.5, passo: 0.05 },
  /** Piso = F2; teto ⚑ proposto (mais que isso é peso sem função). */
  espessuraParedeMm: { min: PAREDE_MINIMA_BLOCO_MM, max: 8, passo: 0.2 },
  /** ⚑ proposto: teto de furos; o teto REAL cai com o tamanho do furo. */
  furosQuantidade: { min: 0, max: 12, passo: 1 },
  /** Piso do furo; o teto é derivado — furoMaximoMm(p). */
  furoTamanhoMm: { min: 4, passo: 1 },
} as const;

const F1 = REGRAS.F.volumeMaximoParteMm;

const clamp = (x: number, a: number, b: number) =>
  x < a ? a : x > b ? b : x;

const num = (x: unknown, padrao: number) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : padrao;
};

/** Largura em planta do bloco (X = Y, escala única), em mm. */
export function larguraBrutaMm(p: {
  tamanhoMm: number;
  escalaLargura: number;
}): number {
  return p.tamanhoMm * p.escalaLargura;
}

/** Altura do bloco, em mm. */
export function alturaBrutaMm(p: {
  tamanhoMm: number;
  escalaAltura: number;
}): number {
  return p.tamanhoMm * p.escalaAltura;
}

/** Teto da escala de largura: o bloco precisa caber no prato (F1). */
export function escalaLarguraMaxima(tamanhoMm: number): number {
  return Math.min(
    LIMITES_BLOCO.escalaLargura.max,
    Math.min(F1.largura, F1.profundidade) / tamanhoMm
  );
}

/** Teto da escala de altura: o bloco precisa caber em pé (F1). */
export function escalaAlturaMaxima(tamanhoMm: number): number {
  return Math.min(LIMITES_BLOCO.escalaAltura.max, F1.altura / tamanhoMm);
}

/**
 * Piso da escala de altura da PIRÂMIDE OCA: o teto da cavidade é um
 * plano paralelo à face, com ângulo da vertical atan((lado/2)/altura) —
 * imprimível sem suporte enquanto ≤ F4. Derivação:
 *     tan(β) = (tamanho·eL/2)/(tamanho·eA) ≤ tan(F4)
 *     → eA ≥ eL / (2·tan(F4))
 * A pirâmide maciça não precisa (as faces sobem para DENTRO — cada
 * camada assenta na de baixo).
 */
export function escalaAlturaMinimaPiramideOca(escalaLargura: number): number {
  const tanF4 = Math.tan((BALANCO_MAXIMO_BLOCO_GRAUS * Math.PI) / 180);
  return Math.max(
    LIMITES_BLOCO.escalaAltura.min,
    escalaLargura / (2 * tanF4)
  );
}

/**
 * Teto da parede: além do teto do slider, a casca nunca engole mais que
 * 1/4 da menor dimensão (sobra cavidade de verdade dos dois lados).
 */
export function espessuraParedeMaxMm(p: {
  tamanhoMm: number;
  escalaAltura: number;
  escalaLargura: number;
}): number {
  const menor = Math.min(larguraBrutaMm(p), alturaBrutaMm(p));
  return Math.min(LIMITES_BLOCO.espessuraParedeMm.max, menor / 4);
}

/**
 * Tamanho máximo do furo para os params atuais, em mm — o clamp que
 * garante parede remanescente ≥ F2 entre furos vizinhos e nas bordas,
 * teto de ponte do FDM, e banda hospedeira com folga. Fórmulas
 * conservadoras por forma (⚑ heurísticas — validar impresso):
 * — cubo/pirâmide: furos distribuídos nas 4 faces laterais (nunca no
 *   topo/fundo — são as regiões de apoio A1);
 * — cilindro/esfera: furos na banda lateral/equatorial (perímetro π·d).
 */
export function furoMaximoMm(p: ParametrosBloco): number {
  const n = Math.max(1, p.furos?.quantidade ?? 1);
  const F2 = PAREDE_MINIMA_BLOCO_MM;
  const W = larguraBrutaMm(p);
  const H = alturaBrutaMm(p);
  let porBanda: number;
  if (p.forma === "cubo") {
    const porFace = Math.ceil(n / 4);
    porBanda = (W - (porFace + 1) * F2) / porFace;
  } else if (p.forma === "piramide") {
    // Largura útil da face a meia altura ≈ metade do lado da base.
    const porFace = Math.ceil(n / 4);
    porBanda = (W / 2 - (porFace + 1) * F2) / porFace;
  } else {
    // Cilindro e esfera: perímetro da banda (equador, na esfera).
    porBanda = (Math.PI * W) / n - F2;
  }
  // Altura útil da banda hospedeira (esfera fura só entre ±~30° de
  // latitude — acima disso o teto do furo deita e viola F4).
  const alturaBanda = p.forma === "esfera" ? H / 3 : H - 2 * F2 - 2;
  return Math.min(FURO_PONTE_MAX_MM, porBanda, alturaBanda);
}

export const BLOCO_PADRAO: ParametrosBloco = {
  forma: "cubo",
  tamanhoMm: 100,
  escalaAltura: 1,
  escalaLargura: 1,
  oca: false,
  espessuraParedeMm: 2,
  furos: null,
  corIdx: 0,
};

/**
 * A cascata de clamps do bloco — fonte única para sliders (F3) e gestos.
 * Idempotente por construção: cada clamp só depende de valores já
 * grampeados acima dele (grampearBloco(grampearBloco(x)) === grampearBloco(x)).
 * Coerências que também são clamps, nunca erro:
 * — furos > 0 força oca = true;
 * — se nem o furo mínimo cabe, a QUANTIDADE cai até caber (0 → sem furos);
 * — pirâmide oca alonga até o teto da cavidade respeitar F4.
 */
export function grampearBloco(v: unknown): ParametrosBloco {
  const bruto = (v && typeof v === "object" ? v : {}) as Partial<
    ParametrosBloco
  > & { furos?: Partial<FurosBloco> | null };
  const L = LIMITES_BLOCO;

  const forma: FormaBloco = FORMAS_BLOCO.includes(bruto.forma as FormaBloco)
    ? (bruto.forma as FormaBloco)
    : BLOCO_PADRAO.forma;

  const tamanhoMm = clamp(
    num(bruto.tamanhoMm, BLOCO_PADRAO.tamanhoMm),
    L.tamanhoMm.min,
    L.tamanhoMm.max
  );

  const escalaLargura = clamp(
    num(bruto.escalaLargura, BLOCO_PADRAO.escalaLargura),
    L.escalaLargura.min,
    escalaLarguraMaxima(tamanhoMm)
  );

  // Furos pedem casca: coerência antes da escala de altura, porque a
  // pirâmide OCA tem piso de altura próprio (F4 no teto da cavidade).
  const furosBruto =
    bruto.furos && typeof bruto.furos === "object" ? bruto.furos : null;
  const quantidadePedida = Math.round(
    num(furosBruto?.quantidade, 0)
  );
  const temFuros = !!furosBruto && quantidadePedida > 0;
  const oca = temFuros || bruto.oca === true;

  const pisoAltura =
    forma === "piramide" && oca
      ? escalaAlturaMinimaPiramideOca(escalaLargura)
      : L.escalaAltura.min;
  const escalaAltura = clamp(
    num(bruto.escalaAltura, BLOCO_PADRAO.escalaAltura),
    pisoAltura,
    escalaAlturaMaxima(tamanhoMm)
  );

  const base = { tamanhoMm, escalaAltura, escalaLargura };
  const espessuraParedeMm = clamp(
    num(bruto.espessuraParedeMm, BLOCO_PADRAO.espessuraParedeMm),
    L.espessuraParedeMm.min,
    espessuraParedeMaxMm(base)
  );

  let furos: FurosBloco | null = null;
  if (temFuros) {
    const formaFuro: FormaFuro = FORMAS_FURO.includes(
      furosBruto!.forma as FormaFuro
    )
      ? (furosBruto!.forma as FormaFuro)
      : "circulo";
    // A quantidade cai até o furo mínimo caber (parede remanescente ≥ F2).
    let quantidade = clamp(
      quantidadePedida,
      1,
      L.furosQuantidade.max
    );
    const cabe = (q: number) =>
      furoMaximoMm({
        ...BLOCO_PADRAO,
        forma,
        ...base,
        oca: true,
        espessuraParedeMm,
        furos: { forma: formaFuro, quantidade: q, tamanhoMm: 0 },
      }) >= L.furoTamanhoMm.min;
    while (quantidade > 0 && !cabe(quantidade)) quantidade--;
    if (quantidade > 0) {
      const teto = furoMaximoMm({
        ...BLOCO_PADRAO,
        forma,
        ...base,
        oca: true,
        espessuraParedeMm,
        furos: { forma: formaFuro, quantidade, tamanhoMm: 0 },
      });
      furos = {
        forma: formaFuro,
        quantidade,
        tamanhoMm: clamp(
          num(furosBruto!.tamanhoMm, L.furoTamanhoMm.min),
          L.furoTamanhoMm.min,
          teto
        ),
      };
    }
  }

  const corIdx = clamp(
    Math.round(num(bruto.corIdx, BLOCO_PADRAO.corIdx)),
    0,
    PALETA.length - 1
  );

  return {
    forma,
    tamanhoMm,
    escalaAltura,
    escalaLargura,
    oca: furos ? true : oca,
    espessuraParedeMm,
    furos,
    corIdx,
  };
}
