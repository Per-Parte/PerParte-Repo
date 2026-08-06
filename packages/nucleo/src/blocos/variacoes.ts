/**
 * Montagem v2 · F1 — as 8 variações seguras de cada forma.
 *
 * São DADOS, não código: o Montar da v2 oferece cada forma-base nestas
 * variações prontas, e os testes de estanqueidade varrem TODAS as
 * variações × as 4 formas (32 malhas). Toda variação passa por
 * grampearBloco ao virar bloco — se uma combinação não cabe numa forma
 * (ex.: 8 furos ○ de 8 mm numa pirâmide achatada), o clamp ajusta e o
 * teste cobre o resultado grampeado, nunca o pedido cru.
 */

import type { FormaBloco, ParametrosBloco } from "./tipos";
import { BLOCO_PADRAO, grampearBloco } from "./limites";

export interface VariacaoBloco {
  /** id estável (nome de teste, serialização futura). */
  id: string;
  /** Rótulo pt-BR para a UI da v2. */
  nome: string;
  /** Sobrepõe o BLOCO_PADRAO; forma e cor entram por fora. */
  params: Partial<Omit<ParametrosBloco, "forma" | "corIdx">>;
}

export const VARIACOES_BLOCO: readonly VariacaoBloco[] = [
  {
    id: "pura",
    nome: "Pura",
    params: { oca: false, furos: null, escalaAltura: 1, escalaLargura: 1 },
  },
  {
    id: "oca",
    nome: "Oca",
    params: { oca: true, espessuraParedeMm: 2, furos: null },
  },
  {
    id: "furos-circulo-poucos",
    nome: "Furos redondos",
    params: {
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 4, tamanhoMm: 14 },
    },
  },
  {
    id: "furos-circulo-grade",
    nome: "Grade de furos",
    params: {
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "circulo", quantidade: 8, tamanhoMm: 8 },
    },
  },
  {
    id: "furos-quadrado",
    nome: "Furos quadrados",
    params: {
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "quadrado", quantidade: 4, tamanhoMm: 12 },
    },
  },
  {
    id: "furos-triangulo",
    nome: "Furos triangulares",
    params: {
      oca: true,
      espessuraParedeMm: 2,
      furos: { forma: "triangulo", quantidade: 4, tamanhoMm: 12 },
    },
  },
  {
    id: "achatada",
    nome: "Achatada",
    params: { oca: false, furos: null, escalaAltura: 0.5 },
  },
  {
    id: "esticada",
    nome: "Esticada",
    params: { oca: false, furos: null, escalaAltura: 1.5 },
  },
] as const;

/** Materializa uma variação numa forma — já grampeada (fonte única). */
export function blocoDaVariacao(
  variacao: VariacaoBloco,
  forma: FormaBloco,
  corIdx = 0
): ParametrosBloco {
  return grampearBloco({
    ...BLOCO_PADRAO,
    ...variacao.params,
    forma,
    corIdx,
  });
}
