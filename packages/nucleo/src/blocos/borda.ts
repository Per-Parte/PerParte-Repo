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
import type { ParametrosBloco, SentidoBorda } from "./tipos";

/**
 * Ângulo de varredura do arco da borda, em rad — o quanto a superfície
 * chega a se afastar da vertical no topo. Derivado de F4 (importado, não
 * copiado); 90° só no caso sem balanço (para dentro e sólido).
 */
export function anguloBordaRad(sentido: SentidoBorda, oca: boolean): number {
  if (sentido === "fora" || oca) {
    return (REGRAS.F.balancoMaximoGraus * Math.PI) / 180;
  }
  return Math.PI / 2;
}

export interface ArcoBorda {
  /** Altura da faixa que o arco ocupa, medida do topo para baixo (mm). */
  alturaMm: number;
  /** Offset radial NO TOPO, assinado (+ para fora, − para dentro), em mm. */
  offsetTopoMm: number;
  /** Offset radial assinado numa cota z do bloco (0 abaixo da faixa). */
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
 * O arco da borda de um bloco. Geometria: círculo de raio R tangente à
 * lateral vertical no pé da faixa, varrido até o ângulo θ. Numa cota z
 * da faixa, o ângulo φ sai de `R·sen φ = z − zInicial`, e o offset é
 * `R·(1 − cos φ)` — logo `dr/dz = tan φ ≤ tan θ`: o balanço da borda é
 * o ângulo do arco, por construção (é o que torna o teto F4 exato).
 */
export function arcoBorda(
  p: ParametrosBloco,
  alturaTotalMm: number
): ArcoBorda {
  const borda = p.borda;
  if (!borda || borda.tamanhoMm <= 0 || alturaTotalMm <= 0) return SEM_BORDA;

  const raio = borda.tamanhoMm;
  const theta = anguloBordaRad(borda.sentido, p.oca);
  const sinal = borda.sentido === "fora" ? 1 : -1;
  const senTheta = Math.sin(theta);
  // Defensivo: a faixa nunca engole o bloco inteiro (os clamps de
  // limites.ts já a mantêm em ≤ 1/3 da altura).
  const alturaMm = Math.min(raio * senTheta, alturaTotalMm);
  const zInicial = alturaTotalMm - alturaMm;
  const offsetTopoMm = sinal * raio * (1 - Math.cos(theta));

  return {
    alturaMm,
    offsetTopoMm,
    offsetEmMm(zMm) {
      if (alturaMm <= 0 || zMm <= zInicial) return 0;
      const u = Math.min(1, (zMm - zInicial) / alturaMm);
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
      return zInicial + (senPhi / senTheta) * alturaMm;
    },
  };
}
