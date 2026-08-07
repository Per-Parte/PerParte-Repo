/**
 * Montagem v2 — BORDA ENCURVADA do topo (pedido do Davi, 06/08/2026).
 *
 * A faixa de cima da silhueta deixa de ser reta e vira um ARCO de raio
 * `borda.tamanhoMm`: para FORA abre como aba de abajur, para DENTRO
 * fecha como lábio. Quem consome é a máquina de raio das três formas de
 * lado reto (cilindro, cubo, pirâmide) — todas elas descrevem a planta
 * como "meia-largura em função de z", então o arco entra como um OFFSET
 * radial assinado somado a essa função. A esfera não tem borda reta para
 * encurvar (o grampeador zera `borda` nela).
 *
 * Por que o ângulo do arco depende de `oca` (F4, não gosto):
 * — para FORA a superfície externa DIVERGE, e cada camada avança sobre o
 *   vazio: o balanço é o próprio ângulo do arco → teto em F4;
 * — para DENTRO num bloco SÓLIDO cada camada assenta inteira na de baixo
 *   (é uma cúpula convergente, como o polo de uma esfera): sem teto de
 *   balanço, o arco pode fechar até 90°;
 * — para DENTRO num bloco OCO a parede desliza para dentro e o material
 *   passa a pairar sobre a CAVIDADE no mesmo ângulo → volta a pagar F4.
 *
 * Este módulo é matemática pura: só depende das REGRAS (F4) e recebe a
 * altura do bloco por parâmetro, para não amarrar limites.ts ↔ borda.ts.
 */

import { REGRAS } from "../regras";
import type { ParametrosBloco, PosicaoBorda, SentidoBorda } from "./tipos";

/**
 * Ângulo de varredura do arco da borda, em rad — o quanto a superfície
 * chega a se afastar da vertical na extremidade. Derivado de F4
 * (importado, não copiado). A regra INVERTE entre topo e fundo, porque a
 * impressão só conhece uma direção (de baixo para cima):
 * — OCA sempre paga F4: as duas paredes deslocam juntas, e uma delas
 *   sempre fica pairando (sobre o vazio no topo, sobre a cavidade no
 *   fundo);
 * — sólida é LIVRE (90°) quando a peça CONVERGE subindo (topo pra
 *   dentro = cúpula; fundo pra fora = pé de cálice: cada camada assenta
 *   inteira na de baixo) e paga F4 quando DIVERGE subindo (topo pra
 *   fora = aba; fundo pra dentro = barriga em balanço).
 */
export function anguloBordaRad(
  posicao: PosicaoBorda,
  sentido: SentidoBorda,
  oca: boolean
): number {
  const convergeSubindo =
    (posicao === "topo" && sentido === "dentro") ||
    (posicao === "fundo" && sentido === "fora");
  if (oca || !convergeSubindo) {
    return (REGRAS.F.balancoMaximoGraus * Math.PI) / 180;
  }
  return Math.PI / 2;
}

export interface ArcoBorda {
  /** Altura da faixa que o arco ocupa, medida da extremidade (mm). */
  alturaMm: number;
  /** Offset radial NA EXTREMIDADE, assinado (+ fora, − dentro), em mm. */
  offsetTopoMm: number;
  /** Offset radial assinado numa cota z do bloco (0 fora da faixa). */
  offsetEmMm(zMm: number): number;
  /**
   * Inverso: a cota z da superfície da borda que tem o offset dado
   * (assinado, na mesma convenção). null = fora do alcance do arco —
   * é o que o apoio usa para responder "a que altura está a superfície
   * a tal distância do eixo" na região da borda.
   */
  zDoOffsetMm(offsetMm: number): number | null;
}

const SEM_BORDA: ArcoBorda = {
  alturaMm: 0,
  offsetTopoMm: 0,
  offsetEmMm: () => 0,
  zDoOffsetMm: () => null,
};

/**
 * O arco da borda de um bloco, numa das extremidades. Geometria: círculo
 * de raio R tangente à lateral vertical onde a faixa começa, varrido até
 * o ângulo θ. Numa cota da faixa a uma distância h da extremidade
 * oposta ao início, o ângulo φ sai de `R·sen φ = h`, e o offset é
 * `R·(1 − cos φ)` — logo `dr/dh = tan φ ≤ tan θ`: o balanço da borda é
 * o ângulo do arco, por construção (é o que torna o teto F4 exato).
 * No FUNDO o arco é o espelho do topo: a faixa vive em z ∈ [0, altura
 * da faixa] e o offset máximo fica em z = 0.
 */
export function arcoBorda(
  p: ParametrosBloco,
  alturaTotalMm: number,
  posicao: PosicaoBorda = "topo"
): ArcoBorda {
  const borda = posicao === "topo" ? p.bordaTopo : p.bordaFundo;
  if (!borda || borda.tamanhoMm <= 0 || alturaTotalMm <= 0) return SEM_BORDA;

  const raio = borda.tamanhoMm;
  const theta = anguloBordaRad(posicao, borda.sentido, p.oca);
  const sinal = borda.sentido === "fora" ? 1 : -1;
  const senTheta = Math.sin(theta);
  // Defensivo: a faixa nunca engole o bloco inteiro (os clamps de
  // limites.ts já a mantêm em ≤ 1/3 da altura, e as DUAS faixas juntas
  // em ≤ 2/3 — sobra sempre um terço de lateral reta no meio).
  const alturaMm = Math.min(raio * senTheta, alturaTotalMm);
  // Distância da cota z à extremidade onde o arco NASCE (o pé da faixa).
  const dentroDaFaixaMm = (zMm: number) =>
    posicao === "topo" ? zMm - (alturaTotalMm - alturaMm) : alturaMm - zMm;
  const offsetTopoMm = sinal * raio * (1 - Math.cos(theta));

  return {
    alturaMm,
    offsetTopoMm,
    offsetEmMm(zMm) {
      const h = dentroDaFaixaMm(zMm);
      if (alturaMm <= 0 || h <= 0) return 0;
      const u = Math.min(1, h / alturaMm);
      const phi = Math.asin(Math.min(1, u * senTheta));
      return sinal * raio * (1 - Math.cos(phi));
    },
    zDoOffsetMm(offsetMm) {
      if (alturaMm <= 0) return null;
      const magnitude = sinal * offsetMm;
      if (magnitude < -1e-9 || magnitude > Math.abs(offsetTopoMm) + 1e-9) {
        return null;
      }
      const cosPhi = Math.min(1, Math.max(-1, 1 - magnitude / raio));
      const senPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
      const h = (senPhi / senTheta) * alturaMm;
      return posicao === "topo" ? alturaTotalMm - alturaMm + h : alturaMm - h;
    },
  };
}
