/**
 * E2 · Base adaptativa — a regra é a ferramenta.
 *
 * Heurística portada do protótipo: estima a altura do centro de gravidade do
 * conjunto e, se a criação fica pesada no topo, devolve um fator de
 * alargamento para a base (em vez de bloquear o cliente com um erro).
 * As constantes foram calibradas no protótipo em cm — a conversão interna
 * preserva a calibração.
 */

import type {
  ParametrosBase,
  ParametrosCorpo,
  ParametrosDifusor,
} from "./geometria";

export interface ResultadoEstabilidade {
  /** Fator de alargamento aplicado ao raio da base (1 = sem ajuste). */
  escala: number;
  /** A base precisou ser alargada. */
  ajustada: boolean;
  /** O ajuste está perto do teto — sinal de composição no limite. */
  pertoDoLimite: boolean;
}

const ESCALA_MAXIMA = 1.45;

export function estabilidade(
  base: ParametrosBase,
  corpo: ParametrosCorpo,
  difusor: ParametrosDifusor
): ResultadoEstabilidade {
  const bh = base.alturaMm / 10;
  const br = base.raioMm / 10;
  const ch = corpo.alturaMm / 10;
  const vol = corpo.volumeBojoMm / 10;
  const dh = difusor.alturaMm / 10;
  const dr = difusor.raioMm / 10;

  const cargaTopo = (dr / 6.5) * (0.55 + 0.45 * (dh / 10));
  const cg =
    (bh * 0.4 + (bh + ch * 0.55) + (bh + ch + dh * 0.45) * cargaTopo) /
    (1.4 + cargaTopo);
  const raioNecessario = 0.34 * cg + 0.5 * Math.max(vol, 0);
  const escala = Math.max(1, raioNecessario / br);

  return {
    escala: Math.min(escala, ESCALA_MAXIMA),
    ajustada: escala > 1.02,
    pertoDoLimite: escala > 1.28,
  };
}
