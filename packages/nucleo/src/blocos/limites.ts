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
import { anguloBordaRad, arcoBorda } from "./borda";
import {
  EIXOS_FATIA,
  FORMAS_BLOCO,
  FORMAS_FURO,
  SENTIDOS_BORDA,
  type BordaBloco,
  type EixoFatia,
  type FatiaBloco,
  type FormaBloco,
  type FormaFuro,
  type FurosBloco,
  type ParametrosBloco,
  type SentidoBorda,
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

/**
 * Moldura entre o polígono do furo e a borda do bloco recortado (⚑) e
 * tira mínima entre o bloco e as bordas da banda hospedeira (⚑) — donos
 * únicos AQUI: os primitivos e as heurísticas de furoMaximoMm precisam
 * das MESMAS constantes para o teto do slider coincidir com o que a
 * malha entrega (achado da revisão de 06/08).
 */
export const MOLDURA_FURO_MM = 2;
export const TIRA_BANDA_MM = 1;

/**
 * Meia-abertura EFETIVA (rad de latitude paramétrica) da banda equatorial
 * que hospeda furos na esfera. Os ±30° nominais valem para a esfera
 * redonda; num esferoide ACHATADO a inclinação real da superfície numa
 * latitude φ é atan((a/c)·tanφ) — os mesmos ±30° paramétricos deitariam
 * o teto do furo além de F4 (achado da revisão de 06/08). Derivação:
 * teto do furo ≤ F4 ⇔ φ ≤ atan((c/a)·tan(F4)).
 */
export function bandaFuroEsferaRad(p: {
  escalaAltura: number;
  escalaLargura: number;
}): number {
  const tanF4 = Math.tan((BALANCO_MAXIMO_BLOCO_GRAUS * Math.PI) / 180);
  const razao = p.escalaAltura / p.escalaLargura; // c/a (tamanho cancela)
  return Math.min(Math.PI / 6, Math.atan(razao * tanF4));
}

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
  /** Raio do arco da borda; o teto REAL é derivado — bordaTamanhoMaxMm(p). */
  bordaTamanhoMm: { min: 3, max: 40, passo: 1 },
} as const;

/**
 * Material que a fatia sempre deixa de cada lado do corte, em mm — o
 * corte nunca some com a peça nem raspa uma casquinha inútil. ⚑ proposto.
 */
export const FATIA_MARGEM_MM = 5;

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
 * Teto do raio do arco da borda, em mm. A borda é limite-como-controle:
 * — a faixa do arco nunca come mais que 1/3 da altura (sobra corpo);
 * — para FORA, o alargamento respeita o prato (F1) e não passa de 1/4 da
 *   largura (aba de abajur, não guarda-sol);
 * — para DENTRO, o encolhimento nunca fecha a boca nem engole a parede.
 * Devolve 0 quando nem o arco mínimo cabe (o grampeador zera a borda).
 */
export function bordaTamanhoMaxMm(p: {
  tamanhoMm: number;
  escalaAltura: number;
  escalaLargura: number;
  oca: boolean;
  espessuraParedeMm: number;
  sentido: SentidoBorda;
}): number {
  const H = alturaBrutaMm(p);
  const W = larguraBrutaMm(p);
  const theta = anguloBordaRad(p.sentido, p.oca);
  const sen = Math.sin(theta);
  const versseno = 1 - Math.cos(theta); // offset = raio × versseno
  // Altura: a faixa do arco (raio × sen θ) ≤ 1/3 da altura.
  let teto = H / (3 * sen);
  if (p.sentido === "fora") {
    // Alargamento: cabe no prato (F1) e ≤ 1/4 da largura.
    const folgaPrato = Math.min(F1.largura, F1.profundidade) / 2 - W / 2;
    teto = Math.min(teto, Math.max(0, folgaPrato) / versseno, W / 4 / versseno);
  } else {
    // Encolhimento: sobra boca (ou miolo) de pelo menos F2 depois da parede.
    const sobra = p.oca ? p.espessuraParedeMm + PAREDE_MINIMA_BLOCO_MM : 1;
    teto = Math.min(teto, Math.max(0, W / 2 - sobra) / versseno);
  }
  teto = Math.min(teto, LIMITES_BLOCO.bordaTamanhoMm.max);
  return teto >= LIMITES_BLOCO.bordaTamanhoMm.min ? teto : 0;
}

/**
 * Faixa válida da posição do corte da fatia num eixo, em mm (coordenadas
 * locais). Fora dela o corte não deixaria material dos dois lados —
 * `min > max` significa "esta peça é pequena demais para fatiar neste
 * eixo" e o grampeador zera a fatia (clamp, nunca erro).
 */
export function limitesFatiaMm(
  p: { tamanhoMm: number; escalaAltura: number; escalaLargura: number },
  eixo: EixoFatia
): { min: number; max: number } {
  const margem = FATIA_MARGEM_MM;
  if (eixo === "z") {
    const H = alturaBrutaMm(p);
    return { min: margem, max: H - margem };
  }
  // x e y são centrados no eixo do bloco: a planta vai de −W/2 a +W/2.
  const meia = larguraBrutaMm(p) / 2;
  return { min: -meia + margem, max: meia - margem };
}

/**
 * Tamanho máximo do furo para os params atuais, em mm — o clamp que
 * garante parede remanescente ≥ F2 entre furos vizinhos e nas bordas,
 * teto de ponte do FDM, e banda hospedeira com folga. Fórmulas
 * conservadoras por forma (⚑ heurísticas — validar impresso):
 * — cubo/pirâmide: furos distribuídos nas 4 faces laterais (nunca no
 *   topo/fundo — são as regiões de apoio A1);
 * — cilindro/esfera: furos na banda lateral/equatorial.
 * As larguras medem a superfície INTERNA da casca (a mais apertada) —
 * furo é passante de parede, e a parede remanescente que importa é a
 * pior das duas (achado da revisão de 06/08: medir só a externa fazia
 * o grampeador prometer furos que o gerador descartava ou encolhia).
 */
export function furoMaximoMm(p: ParametrosBloco): number {
  const n = Math.max(1, p.furos?.quantidade ?? 1);
  const F2 = PAREDE_MINIMA_BLOCO_MM;
  const W = larguraBrutaMm(p);
  const H = alturaBrutaMm(p);
  const wInterna = Math.max(0, W - 2 * p.espessuraParedeMm);
  // A faixa da borda encurvada não hospeda furo: ela é o arco do topo.
  const alturaBorda = arcoBorda(p, H).alturaMm;
  /**
   * Banda hospedeira REAL de cubo e cilindro (as duas cascas de parede
   * reta): vai do piso da cavidade ao pé da borda, menos a moldura do
   * bloco recortado e a tira de folga de cada lado. É a MESMA conta do
   * gerador — medir só F2, como antes, prometia furo que o gerador
   * encolhia num cilindro curto com borda (classe de mentira que a
   * revisão de 06/08 pegou: o clamp promete, a malha entrega menos).
   */
  const bandaDeParedeReta = () => {
    const zPiso = Math.min(p.espessuraParedeMm, H / 3);
    const zTeto = H - Math.max(zPiso, alturaBorda);
    return zTeto - zPiso - 2 * (MOLDURA_FURO_MM + TIRA_BANDA_MM);
  };
  let porBanda: number;
  let alturaBanda: number;
  if (p.forma === "cubo") {
    const porFace = Math.ceil(n / 4);
    porBanda = (wInterna - (porFace + 1) * F2) / porFace;
    alturaBanda = bandaDeParedeReta();
  } else if (p.forma === "piramide") {
    // Largura útil da face a meia altura ≈ metade do lado da base (a
    // interna fica com o clamp geométrico do primitivo — o k encolhe).
    const porFace = Math.ceil(n / 4);
    porBanda = (W / 2 - (porFace + 1) * F2) / porFace;
    alturaBanda = H - 2 * F2 - 2 - alturaBorda;
  } else if (p.forma === "esfera") {
    porBanda = (Math.PI * wInterna) / n - F2;
    // Banda equatorial efetiva (≤ ±30°, apertando com o achatamento
    // para o teto do furo nunca deitar além de F4), descontadas moldura
    // e tira — as MESMAS constantes que o gerador usa. (A esfera nunca
    // tem borda: o grampeador a zera.)
    alturaBanda =
      2 * ((H / 2) * bandaFuroEsferaRad(p) - MOLDURA_FURO_MM - TIRA_BANDA_MM);
  } else {
    porBanda = (Math.PI * wInterna) / n - F2;
    alturaBanda = bandaDeParedeReta();
  }
  return Math.min(FURO_PONTE_MAX_MM, porBanda, Math.max(0, alturaBanda));
}

export const BLOCO_PADRAO: ParametrosBloco = {
  forma: "cubo",
  tamanhoMm: 100,
  escalaAltura: 1,
  escalaLargura: 1,
  oca: false,
  espessuraParedeMm: 2,
  furos: null,
  borda: null,
  fatia: null,
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

  // BORDA antes dos furos: a faixa do arco não hospeda furo, então o teto
  // de furoMaximoMm depende dela (e ela não depende dos furos — só de oca,
  // que já está decidido acima). A esfera nunca tem borda: é curva inteira.
  let borda: BordaBloco | null = null;
  const bordaBruta =
    bruto.borda && typeof bruto.borda === "object" ? bruto.borda : null;
  if (bordaBruta && forma !== "esfera") {
    const sentido: SentidoBorda = SENTIDOS_BORDA.includes(
      bordaBruta.sentido as SentidoBorda
    )
      ? (bordaBruta.sentido as SentidoBorda)
      : "fora";
    const teto = bordaTamanhoMaxMm({
      ...base,
      oca,
      espessuraParedeMm,
      sentido,
    });
    const pedido = num(bordaBruta.tamanhoMm, 0);
    // teto 0 = nem o arco mínimo cabe nesta peça → borda some (nunca erro).
    if (teto > 0 && pedido > 0) {
      borda = {
        sentido,
        tamanhoMm: clamp(pedido, L.bordaTamanhoMm.min, teto),
      };
    }
  }

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
        borda,
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
        borda,
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

  // FATIA por último: o corte é posicionado nas dimensões JÁ grampeadas.
  let fatia: FatiaBloco | null = null;
  const fatiaBruta =
    bruto.fatia && typeof bruto.fatia === "object" ? bruto.fatia : null;
  if (fatiaBruta) {
    const eixo: EixoFatia = EIXOS_FATIA.includes(fatiaBruta.eixo as EixoFatia)
      ? (fatiaBruta.eixo as EixoFatia)
      : "z";
    const faixa = limitesFatiaMm(base, eixo);
    // faixa vazia = peça pequena demais para cortar neste eixo: sem fatia.
    if (faixa.min <= faixa.max) {
      fatia = {
        eixo,
        posicaoMm: clamp(
          num(fatiaBruta.posicaoMm, (faixa.min + faixa.max) / 2),
          faixa.min,
          faixa.max
        ),
        lado: fatiaBruta.lado === "maior" ? "maior" : "menor",
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
    borda,
    fatia,
    corIdx,
  };
}
