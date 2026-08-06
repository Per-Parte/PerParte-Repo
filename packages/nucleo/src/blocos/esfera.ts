/**
 * Montagem v2 · F1 — primitivo ESFERA (esferoide: escalas ≠ 1 alongam/achatam).
 *
 * Receita de topologia (espec da F1, seção "esfera" — siga-a, não invente):
 * — pura: malhaRevolucao do semicírculo (perfil x = r(y), y de 0 a altura),
 *   como todo sólido do núcleo;
 * — oca: casca externa + casca interna com orientação invertida, unidas por
 *   RESPIRO polar no topo (abertura circular que resolve o balanço do polo
 *   interno — F4 — e dá saída de luz): grade paramétrica (θ × latitude) com
 *   túnel de parede na borda do respiro;
 * — furos: aberturas na banda equatorial (±30° de latitude), recorte em
 *   espaço de parâmetro com túnel externa↔interna (receita única do furo).
 */

import type {
  ApoioBloco,
  MalhaBloco,
  ParametrosBloco,
  PrimitivoBloco,
} from "./tipos";
import { alturaBrutaMm, grampearBloco, larguraBrutaMm } from "./limites";

/**
 * Fração do raio interno aberta no polo superior quando OCA (respiro).
 * ⚑ proposto — resolve o teto horizontal da cavidade (F4) e vira saída
 * de luz; validar impresso e com o Caio (a "oca" nunca é 100% fechada).
 */
export const RESPIRO_POLAR_FRACAO = 0.35;

export const apoioEsfera: ApoioBloco = {
  alturaTopoMm: (p) => alturaBrutaMm(p),
  // Esfera apoia num PONTO, em cima e embaixo.
  raioApoioSuperiorMm: () => 0,
  raioApoioInferiorMm: () => 0,
  raioEnvelopeMm(p, zMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    const u = (zMm - c) / c;
    if (u < -1 || u > 1) return 0;
    return a * Math.sqrt(Math.max(0, 1 - u * u));
  },
  zSuperficieTopoMm(p, dMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    if (dMm > a) return null;
    return c + c * Math.sqrt(Math.max(0, 1 - (dMm / a) ** 2));
  },
  zSuperficieBaseMm(p, dMm) {
    const a = larguraBrutaMm(p) / 2;
    const c = alturaBrutaMm(p) / 2;
    if (dMm > a) return null;
    return c - c * Math.sqrt(Math.max(0, 1 - (dMm / a) ** 2));
  },
};

export function gerarMalhaEsfera(
  p: ParametrosBloco,
  segmentos = 48
): MalhaBloco {
  // TODO F1: implementar pela receita da espec (pura via malhaRevolucao;
  // oca/furos via grade paramétrica com respiro polar e túneis de furo).
  void p;
  void segmentos;
  throw new Error("TODO F1: gerarMalhaEsfera — ver espec de topologia da F1");
}

export const primitivoEsfera: PrimitivoBloco = {
  forma: "esfera",
  gerarMalha: gerarMalhaEsfera,
  grampear: (p) => grampearBloco({ ...(p as object), forma: "esfera" }),
  apoio: apoioEsfera,
};
