/**
 * Montagem v2 · F1 — barrel do módulo de blocos (F1 completa).
 *
 * Tipos, limites, variações, tangência A1, ponto de luz e os quatro
 * primitivos (esfera, cubo, cilindro, pirâmide) com malha estanque.
 * Estado da frente: docs/montagem-v2-handoff.md.
 */

export * from "./tipos";
export * from "./limites";
export * from "./variacoes";
export * from "./tangencia";
export * from "./ponto-de-luz";
export * from "./esfera";
export * from "./cubo";
export * from "./cilindro";
export * from "./piramide";

import type { ApoioBloco, FormaBloco, PrimitivoBloco } from "./tipos";
import { primitivoEsfera } from "./esfera";
import { primitivoCubo } from "./cubo";
import { primitivoCilindro } from "./cilindro";
import { primitivoPiramide } from "./piramide";

/** Registro das quatro formas-base — a porta de entrada da F2/F3. */
export const PRIMITIVOS_BLOCO: Record<FormaBloco, PrimitivoBloco> = {
  esfera: primitivoEsfera,
  cubo: primitivoCubo,
  cilindro: primitivoCilindro,
  piramide: primitivoPiramide,
};

/** Resolve o apoio de uma forma (injete em tangencia.ts — tipo ApoioDe). */
export function apoioDaForma(forma: FormaBloco): ApoioBloco {
  return PRIMITIVOS_BLOCO[forma].apoio;
}
