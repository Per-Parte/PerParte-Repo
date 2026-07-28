/**
 * Uma criação inteira cabe num link: o estado do configurador serializado
 * em base64-url no parâmetro `?c=`. Ao carregar, tudo passa de novo pelo
 * grampeamento do núcleo — link adulterado vira criação válida, nunca erro.
 * É o embrião do "salvar criações": quando houver banco, o mesmo objeto
 * ganha um id curto e uma página própria.
 */

import {
  BASES,
  CORPOS,
  DIFUSORES,
  FACETAS,
  PALETA,
  grampearBase,
  grampearCorpo,
  grampearDifusor,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "@per-parte/nucleo";

export interface CriacaoV1 {
  v: 1;
  modo: "montar" | "criar";
  iBase: number;
  iCorpo: number;
  iDifusor: number;
  cores: { base: number; corpo: number; difusor: number };
  iFaceta: number;
  luzAcesa: boolean;
  criar: {
    base: ParametrosBase;
    corpo: ParametrosCorpo;
    difusor: ParametrosDifusor;
  };
  remixDe: string;
}

export function codificarCriacao(c: CriacaoV1): string {
  return btoa(JSON.stringify(c))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function indice(v: unknown, tamanho: number): number {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= 0 && n < tamanho ? n : 0;
}

export function decodificarCriacao(param: string): CriacaoV1 | null {
  try {
    const b64 = param.replaceAll("-", "+").replaceAll("_", "/");
    const bruto = JSON.parse(atob(b64));
    return {
      v: 1,
      modo: bruto.modo === "criar" ? "criar" : "montar",
      iBase: indice(bruto.iBase, BASES.length),
      iCorpo: indice(bruto.iCorpo, CORPOS.length),
      iDifusor: indice(bruto.iDifusor, DIFUSORES.length),
      cores: {
        base: indice(bruto.cores?.base, PALETA.length),
        corpo: indice(bruto.cores?.corpo, PALETA.length),
        difusor: indice(bruto.cores?.difusor, PALETA.length),
      },
      iFaceta: indice(bruto.iFaceta, FACETAS.length),
      luzAcesa: bruto.luzAcesa !== false,
      criar: {
        base: grampearBase(bruto.criar?.base ?? {}),
        corpo: grampearCorpo(bruto.criar?.corpo ?? {}),
        difusor: grampearDifusor(bruto.criar?.difusor ?? {}),
      },
      remixDe:
        typeof bruto.remixDe === "string" ? bruto.remixDe.slice(0, 60) : "",
    };
  } catch {
    return null;
  }
}
