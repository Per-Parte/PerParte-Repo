/**
 * Kit de calibração da folga F5.
 *
 * Duas pastilhas de teste: uma com o anel macho, outra com a canaleta fêmea
 * na folga escolhida. O sócio imprime o par em folgas diferentes e descobre
 * qual dá o encaixe firme-mas-desmontável nas impressoras reais — o número
 * que trava a regra F5 "para nunca mais ser tocada".
 */

import { ENCAIXES } from "./regras";
import {
  pontosFemea,
  pontosMacho,
  type AnelEncaixe,
  type Ponto2D,
} from "./geometria";

const RAIO_EIXO_MM = 0.6;
const BORDA_MM = 6;
const ESPESSURA_PASTILHA_MM = 3;

/** Pastilha com o anel macho para cima. */
export function perfilPastilhaMacho(anel: AnelEncaixe): Ponto2D[] {
  const r = anel.externoMm + BORDA_MM;
  const h = ESPESSURA_PASTILHA_MM;
  return [
    { x: RAIO_EIXO_MM, y: 0 },
    { x: r, y: 0 },
    { x: r, y: h },
    ...pontosMacho(anel, h),
  ];
}

/** Pastilha com a canaleta fêmea para cima (fácil de inspecionar). */
export function perfilPastilhaFemea(
  anel: AnelEncaixe,
  folgaMm: number
): Ponto2D[] {
  const r = anel.externoMm + BORDA_MM;
  const profundidade = anel.alturaMm + ENCAIXES.folgaProfundidadeMm;
  const h = profundidade + ESPESSURA_PASTILHA_MM;
  // A fêmea de referência abre no fundo (y=0); aqui espelhamos para a boca
  // da canaleta ficar na face de cima da pastilha.
  const femea = pontosFemea(anel, folgaMm).map((p) => ({
    x: p.x,
    y: h - p.y,
  }));
  return [
    { x: RAIO_EIXO_MM, y: 0 },
    { x: r, y: 0 },
    { x: r, y: h },
    ...femea.reverse(),
  ];
}
