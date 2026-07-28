/**
 * Validação de parâmetros vindos de fora (Backend).
 *
 * A Ferramenta já impede valores fora das regras; o Backend não confia e
 * grampeia de novo antes de qualquer geração de produção — mesma filosofia
 * da regra mestra: nunca erro, sempre limite.
 */

import { LIMITES_CRIAR } from "./catalogo";
import type {
  FormaDifusor,
  ParametrosCorpo,
  ParametrosDifusor,
} from "./geometria";

interface Faixa {
  min: number;
  max: number;
}

function numero(v: unknown, padrao: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
}

function grampear(v: unknown, faixa: Faixa, padrao: number): number {
  return Math.min(faixa.max, Math.max(faixa.min, numero(v, padrao)));
}

export function grampearCorpo(p: Partial<ParametrosCorpo>): ParametrosCorpo {
  const L = LIMITES_CRIAR.corpo;
  return {
    alturaMm: grampear(p.alturaMm, L.alturaMm, 160),
    volumeBojoMm: grampear(p.volumeBojoMm, L.volumeBojoMm, 0),
    posicaoBojo: grampear(p.posicaoBojo, L.posicaoBojo, 0),
    ondulacao: Math.round(grampear(p.ondulacao, L.ondulacao, 0)),
    amplitudeOndaMm: grampear(p.amplitudeOndaMm, L.amplitudeOndaMm, 0),
  };
}

const FORMAS: FormaDifusor[] = ["globo", "sino", "cone", "lanterna"];

export function grampearDifusor(
  p: Partial<ParametrosDifusor>
): ParametrosDifusor {
  const L = LIMITES_CRIAR.difusor;
  return {
    forma: FORMAS.includes(p.forma as FormaDifusor)
      ? (p.forma as FormaDifusor)
      : "globo",
    alturaMm: grampear(p.alturaMm, L.alturaMm, 100),
    raioMm: grampear(p.raioMm, L.raioMm, 65),
  };
}

const SEGMENTOS_VALIDOS = [6, 8, 12, 16, 40];

export function grampearSegmentos(s: unknown): number {
  const n = Math.round(numero(s, 40));
  return SEGMENTOS_VALIDOS.includes(n) ? n : 40;
}
