/**
 * Validação de parâmetros vindos de fora (Backend).
 *
 * A Ferramenta já impede valores fora das regras; o Backend não confia e
 * grampeia de novo antes de qualquer geração de produção — mesma filosofia
 * da regra mestra: nunca erro, sempre limite.
 */

import { LIMITES_CRIAR, MAX_ESTRUTURAIS } from "./catalogo";
import { NOMES_FAMILIAS, type FamiliaTextura } from "./texturas";
import { grampearVazado } from "./vazados";
import {
  deslocamentoMaximoMm,
  TS_PERFIL_LIVRE,
  type CurvaBase,
  type FormaDifusor,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
  type ParametrosEstrutural,
  type TipoEstrutural,
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

const CURVAS: CurvaBase[] = ["reta", "cone", "concava", "degrau"];

export function grampearBase(p: Partial<ParametrosBase>): ParametrosBase {
  const L = LIMITES_CRIAR.base;
  return {
    alturaMm: grampear(p.alturaMm, L.alturaMm, 26),
    raioMm: grampear(p.raioMm, L.raioMm, 82),
    curva: CURVAS.includes(p.curva as CurvaBase)
      ? (p.curva as CurvaBase)
      : "reta",
  };
}

export function grampearCorpo(p: Partial<ParametrosCorpo>): ParametrosCorpo {
  const L = LIMITES_CRIAR.corpo;
  const alturaMm = grampear(p.alturaMm, L.alturaMm, 160);
  const dMax = deslocamentoMaximoMm(alturaMm);
  const perfilLivre =
    Array.isArray(p.perfilLivre) &&
    p.perfilLivre.length === TS_PERFIL_LIVRE.length
      ? p.perfilLivre.map((r) =>
          grampear(r, L.perfilLivreRaioMm, L.perfilLivreRaioMm.min)
        )
      : undefined;
  // Família de textura só entra se for conhecida; "gomos" é o padrão e
  // dispensa os campos extras.
  const familiaTextura =
    NOMES_FAMILIAS.includes(p.familiaTextura as FamiliaTextura) &&
    p.familiaTextura !== "gomos"
      ? (p.familiaTextura as FamiliaTextura)
      : undefined;
  return {
    alturaMm,
    volumeBojoMm: grampear(p.volumeBojoMm, L.volumeBojoMm, 0),
    posicaoBojo: grampear(p.posicaoBojo, L.posicaoBojo, 0),
    ondulacao: Math.round(grampear(p.ondulacao, L.ondulacao, 0)),
    amplitudeOndaMm: grampear(p.amplitudeOndaMm, L.amplitudeOndaMm, 0),
    gomos: Math.round(grampear(p.gomos, L.gomos, 0)),
    profundidadeGomosMm: grampear(
      p.profundidadeGomosMm,
      L.profundidadeGomosMm,
      0
    ),
    torcaoGraus: grampear(p.torcaoGraus, L.torcaoGraus, 0),
    deslocamentoMm: grampear(
      p.deslocamentoMm,
      { min: -dMax, max: dMax },
      0
    ),
    posicaoDobra: grampear(p.posicaoDobra, L.posicaoDobra, 0),
    ...(perfilLivre ? { perfilLivre } : {}),
    ...(familiaTextura
      ? {
          familiaTextura,
          repeticaoTextura: Math.round(
            grampear(p.repeticaoTextura, L.repeticaoTextura, 12)
          ),
        }
      : {}),
  };
}

export interface ConfiguracaoLuminaria {
  pontosDeLuz: 1 | 2;
  separacaoMm: number;
}

export function grampearLuminaria(p: {
  pontosDeLuz?: unknown;
  separacaoMm?: unknown;
}): ConfiguracaoLuminaria {
  const L = LIMITES_CRIAR.luminaria;
  return {
    pontosDeLuz: Number(p.pontosDeLuz) === 2 ? 2 : 1,
    separacaoMm: grampear(p.separacaoMm, L.separacaoMm, 100),
  };
}

const FORMAS: FormaDifusor[] = ["globo", "sino", "cone", "lanterna"];

export function grampearDifusor(
  p: Partial<ParametrosDifusor>
): ParametrosDifusor {
  const L = LIMITES_CRIAR.difusor;
  const vazado = grampearVazado(p.vazado);
  return {
    forma: FORMAS.includes(p.forma as FormaDifusor)
      ? (p.forma as FormaDifusor)
      : "globo",
    alturaMm: grampear(p.alturaMm, L.alturaMm, 100),
    raioMm: grampear(p.raioMm, L.raioMm, 65),
    gomos: Math.round(grampear(p.gomos, L.gomos, 0)),
    profundidadeGomosMm: grampear(
      p.profundidadeGomosMm,
      L.profundidadeGomosMm,
      0
    ),
    ...(vazado ? { vazado } : {}),
  };
}

const TIPOS_ESTRUTURAIS: TipoEstrutural[] = ["haste", "anel"];

export function grampearEstrutural(
  p: Partial<ParametrosEstrutural>
): ParametrosEstrutural {
  const L = LIMITES_CRIAR.estrutural;
  return {
    tipo: TIPOS_ESTRUTURAIS.includes(p.tipo as TipoEstrutural)
      ? (p.tipo as TipoEstrutural)
      : "haste",
    alturaMm: grampear(p.alturaMm, L.alturaMm, 100),
    barrigaMm: grampear(p.barrigaMm, L.barrigaMm, 0),
  };
}

/** A pilha vinda de fora: no máximo MAX_ESTRUTURAIS peças, cada uma grampeada. */
export function grampearEstruturais(v: unknown): ParametrosEstrutural[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, MAX_ESTRUTURAIS)
    .map((e) => grampearEstrutural((e ?? {}) as Partial<ParametrosEstrutural>));
}

const SEGMENTOS_VALIDOS = [4, 6, 8, 12, 16, 40];

export function grampearSegmentos(s: unknown): number {
  const n = Math.round(numero(s, 40));
  return SEGMENTOS_VALIDOS.includes(n) ? n : 40;
}

/**
 * Expoente da superelipse vindo de fora: ausente/inválido = sem squircle;
 * presente, fica na faixa em que a curva é squircle de verdade (n > 2 é
 * onde ela deixa de ser círculo; acima de 8 é visualmente um quadrado).
 */
export function grampearExpoente(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 2) return undefined;
  return Math.min(8, Math.max(3, n));
}
