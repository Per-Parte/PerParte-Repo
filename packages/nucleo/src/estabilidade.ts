/**
 * E1/E2 · Estabilidade — a regra é a ferramenta, até onde a física deixa.
 *
 * Além da heurística vertical do protótipo (base alarga sozinha quando a
 * criação pesa no topo), calcula o DESVIO LATERAL do centro de gravidade
 * quando a espinha do corpo é curvada: a projeção do CG precisa cair no
 * terço central da base (E1). A base alarga para compensar; se nem o
 * alargamento máximo resolve, a luminária está tombando — e aí o aviso é
 * honesto, com direção e tudo.
 */

import { REGRAS } from "./regras";
import {
  deslocamentoMaximoMm,
  type ParametrosBase,
  type ParametrosCorpo,
  type ParametrosDifusor,
} from "./geometria";

export interface ResultadoEstabilidade {
  /** Fator de alargamento aplicado ao raio da base (1 = sem ajuste). */
  escala: number;
  /** A base precisou ser alargada. */
  ajustada: boolean;
  /** O ajuste está perto do teto — composição no limite. */
  pertoDoLimite: boolean;
  /** Nem o alargamento máximo segura: está caindo. */
  tombando: boolean;
  /** Para onde cai (null quando estável). */
  ladoTombando: "esquerda" | "direita" | null;
  /** Desvio lateral estimado do CG, em mm. */
  xCgMm: number;
}

const ESCALA_MAXIMA = 1.45;

export function estabilidade(
  base: ParametrosBase,
  corpo: ParametrosCorpo,
  difusor: ParametrosDifusor,
  pontosDeLuz = 1
): ResultadoEstabilidade {
  const bh = base.alturaMm / 10;
  const br = base.raioMm / 10;
  const ch = corpo.alturaMm / 10;
  const vol = corpo.volumeBojoMm / 10;
  const dh = difusor.alturaMm / 10;
  const dr = difusor.raioMm / 10;

  const cargaTopo =
    (dr / 6.5) * (0.55 + 0.45 * (dh / 10)) * (pontosDeLuz === 2 ? 1.8 : 1);
  const cg =
    (bh * 0.4 + (bh + ch * 0.55) + (bh + ch + dh * 0.45) * cargaTopo) /
    (1.4 + cargaTopo);
  const raioVertical = 0.34 * cg + 0.5 * Math.max(vol, 0);

  // Desvio lateral do CG (só no ponto de luz único — o duo é simétrico).
  const dEfetivo =
    pontosDeLuz === 2
      ? 0
      : Math.sign(corpo.deslocamentoMm || 0) *
        Math.min(
          Math.abs(corpo.deslocamentoMm || 0),
          deslocamentoMaximoMm(corpo.alturaMm)
        );
  const xCgMm =
    (0.45 * dEfetivo * 1 + dEfetivo * cargaTopo) / (1.4 + cargaTopo);

  // E1: a projeção do CG cai no terço central do raio da base.
  const raioLateral =
    Math.abs(xCgMm) / 10 / REGRAS.E.fracaoCentralDaBaseParaCG;

  const escalaBruta = Math.max(1, raioVertical / br, raioLateral / br);
  const escala = Math.min(escalaBruta, ESCALA_MAXIMA);

  const limiteMm = base.raioMm * escala * REGRAS.E.fracaoCentralDaBaseParaCG;
  const tombando = Math.abs(xCgMm) > limiteMm + 0.5;

  return {
    escala,
    ajustada: escalaBruta > 1.02,
    pertoDoLimite: escalaBruta > 1.28,
    tombando,
    ladoTombando: tombando ? (xCgMm > 0 ? "direita" : "esquerda") : null,
    xCgMm,
  };
}
