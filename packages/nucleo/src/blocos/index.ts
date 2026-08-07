/**
 * Montagem v2 — barrel do módulo de blocos.
 *
 * Tipos, limites, variações, tangência A1, ponto de luz, os quatro
 * primitivos (esfera, cubo, cilindro, pirâmide) com borda encurvada, e a
 * ferramenta Fatiar. Estado da frente: docs/montagem-v2-handoff.md.
 *
 * A FATIA é composta AQUI, e é de propósito: os primitivos ignoram
 * `p.fatia` (cada um sabe fazer o bloco inteiro), e o corte é um
 * pós-processo uniforme para as quatro formas. Quem consome blocos usa
 * `gerarMalhaBloco` e `apoioDaForma` — as duas já entregam a peça
 * cortada e um apoio que conta a verdade sobre ela.
 */

export * from "./tipos";
export * from "./borda";
export * from "./limites";
export * from "./base-estavel";
export * from "./variacoes";
export * from "./tangencia";
export * from "./ponto-de-luz";
export * from "./esfera";
export * from "./cubo";
export * from "./cilindro";
export * from "./piramide";
export * from "./espelhar";
export * from "./fatiar";

import type {
  ApoioBloco,
  FormaBloco,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import { primitivoEsfera } from "./esfera";
import { primitivoCubo } from "./cubo";
import { primitivoCilindro } from "./cilindro";
import { primitivoPiramide } from "./piramide";
import { apoioEspelhado, espelharMalhaBloco } from "./espelhar";
import { apoioComFatia, fatiarMalhaBloco } from "./fatiar";

/** Registro das quatro formas-base — a porta de entrada da F2/F3. */
export const PRIMITIVOS_BLOCO: Record<FormaBloco, PrimitivoBloco> = {
  esfera: primitivoEsfera,
  cubo: primitivoCubo,
  cilindro: primitivoCilindro,
  piramide: primitivoPiramide,
};

/**
 * A malha do bloco — a porta de entrada de preview e STL. O pipeline é
 * primitivo (com as bordas encurvadas) → ESPELHAR → FATIAR, nesta ordem
 * de propósito: a fatia corta a peça JÁ invertida, então o pé que a
 * regra de base estável dá a uma pirâmide de ponta-cabeça funciona sem
 * caso especial. Espera params grampeados: chame `grampearBloco` antes.
 */
export function gerarMalhaBloco(
  p: ParametrosBloco,
  segmentos?: number
): MalhaBloco {
  const inteira = PRIMITIVOS_BLOCO[p.forma].gerarMalha(p, segmentos);
  return fatiarMalhaBloco(espelharMalhaBloco(inteira, p), p);
}

/**
 * Resolve o apoio de uma forma (injete em tangencia.ts — tipo ApoioDe).
 * Embrulhado na MESMA ordem do pipeline da malha (espelho por dentro,
 * fatia por fora): quando o bloco está invertido e/ou cortado, as cotas
 * e os platôs são os da peça real (A1 — nada flutua, nada atravessa).
 */
export function apoioDaForma(forma: FormaBloco): ApoioBloco {
  return apoioComFatia(apoioEspelhado(PRIMITIVOS_BLOCO[forma].apoio));
}
