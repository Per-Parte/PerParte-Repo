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
import { apoioComFatia, fatiarMalhaBloco } from "./fatiar";

/** Registro das quatro formas-base — a porta de entrada da F2/F3. */
export const PRIMITIVOS_BLOCO: Record<FormaBloco, PrimitivoBloco> = {
  esfera: primitivoEsfera,
  cubo: primitivoCubo,
  cilindro: primitivoCilindro,
  piramide: primitivoPiramide,
};

/**
 * A malha do bloco — a porta de entrada de preview e STL. Gera a forma
 * (já com a borda encurvada, que é do primitivo) e aplica a fatia.
 * Espera params grampeados: chame `grampearBloco` antes.
 */
export function gerarMalhaBloco(
  p: ParametrosBloco,
  segmentos?: number
): MalhaBloco {
  const inteira = PRIMITIVOS_BLOCO[p.forma].gerarMalha(p, segmentos);
  return fatiarMalhaBloco(inteira, p);
}

/**
 * Resolve o apoio de uma forma (injete em tangencia.ts — tipo ApoioDe).
 * Já vem embrulhado na fatia: quando o bloco está cortado, as cotas e os
 * platôs são os da peça cortada (A1 — nada flutua, nada atravessa).
 */
export function apoioDaForma(forma: FormaBloco): ApoioBloco {
  return apoioComFatia(PRIMITIVOS_BLOCO[forma].apoio);
}
