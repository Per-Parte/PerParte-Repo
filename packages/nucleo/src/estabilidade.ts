/**
 * E1/E2/E3 · Estabilidade — a regra é a ferramenta, até onde a física deixa.
 *
 * Além da heurística vertical do protótipo (base alarga sozinha quando a
 * criação pesa no topo), calcula o DESVIO LATERAL do centro de gravidade
 * quando a espinha do corpo é curvada: a projeção do CG precisa cair no
 * terço central da base (E1). A escada de compensação tem três degraus:
 * a base alarga (E2); se não basta, um CONTRAPESO na base puxa o CG de
 * volta (E3 — inserto de peso, item de produção); se nem o contrapeso
 * máximo segura, a luminária está tombando — e aí o aviso é honesto,
 * com direção e tudo.
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
  pontosDeLuz = 1,
  /** Desvio lateral extra da CABEÇA (junta inclinada), em mm. */
  desvioCabecaMm = 0
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
  // A cabeça inclinada (junta) soma o próprio desvio ao termo do topo:
  // a escada E2→E3→aviso passa a cobri-la sem código novo.
  const dEfetivo =
    pontosDeLuz === 2
      ? 0
      : Math.sign(corpo.deslocamentoMm || 0) *
        Math.min(
          Math.abs(corpo.deslocamentoMm || 0),
          deslocamentoMaximoMm(corpo.alturaMm)
        );
  const dCabeca = pontosDeLuz === 2 ? 0 : desvioCabecaMm;
  const xCgMm =
    (0.45 * dEfetivo * 1 + (dEfetivo + dCabeca) * cargaTopo) /
    (1.4 + cargaTopo);

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

/**
 * E3 · Contrapeso necessário, em gramas — o degrau depois do alargamento.
 *
 * O inserto entra CENTRADO na cavidade da base (onde já mora o miolo), a
 * massa impressa `m` está com o CG desviado `xCg` do eixo, e o conjunto só
 * é estável se a projeção combinada cair no terço central (E1):
 *
 *     |x'| = m·|xCg| / (m + mᵢ) ≤ L   →   mᵢ ≥ m·(|xCg|/L − 1)
 *
 * onde L = raio da base (já alargada) × fração central. Aproximação
 * conservadora: ignora que o inserto também ABAIXA o CG, o que só ajuda.
 * `gramasImpressos` vem da estimativa de peso (⚑ até o slicer real).
 * Retorna 0 quando a luminária fica de pé sem inserto; o teto do que a
 * produção aceita é REGRAS.E.contrapesoMaximoG — acima dele, tombando de
 * verdade. Arredonda para cima em passos de 10 g (granularidade de BOM).
 */
export function contrapesoNecessarioG(
  est: ResultadoEstabilidade,
  raioBaseMm: number,
  gramasImpressos: number
): number {
  const limiteMm =
    raioBaseMm * est.escala * REGRAS.E.fracaoCentralDaBaseParaCG;
  const desvio = Math.abs(est.xCgMm);
  if (desvio <= limiteMm + 0.5 || limiteMm <= 0) return 0;
  const g = Math.max(0, gramasImpressos) * (desvio / limiteMm - 1);
  return Math.ceil(g / 10) * 10;
}
