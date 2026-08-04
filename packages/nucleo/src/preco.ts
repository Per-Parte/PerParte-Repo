/**
 * Estimativa de peso e preço — portada do protótipo.
 *
 * Peso: área lateral × espessura típica de cada parte (casca), com fator de
 * perímetros/preenchimento, + módulo elétrico. Preço: base + R$/g, arredondado
 * para terminar em 9. Tudo provisório (⚑) até o custo real de material e
 * hora de máquina do sócio — quando houver slicer no backend, esta estimativa
 * é substituída pelo cálculo real e os números convergem.
 */

import { areaLateralMm2, type Ponto2D } from "./geometria";

export interface Estimativa {
  gramas: number;
  precoBRL: number;
}

export function estimarPreco(
  perfilBase: Ponto2D[],
  perfilCorpo: Ponto2D[],
  perfilDifusor: Ponto2D[],
  pontosDeLuz = 1,
  perfisEstruturais: Ponto2D[][] = []
): Estimativa {
  const aBase = areaLateralMm2(perfilBase) / 100;
  const aCorpo = areaLateralMm2(perfilCorpo) / 100;
  const aDifusor = areaLateralMm2(perfilDifusor) / 100;
  // Estruturais têm casca de corpo; sobem junto com a coluna no duo.
  const aEstruturais = perfisEstruturais.reduce(
    (s, p) => s + areaLateralMm2(p) / 100,
    0
  );

  // Dois pontos de luz: corpo, difusor e módulo elétrico em dobro.
  const n = pontosDeLuz === 2 ? 2 : 1;
  const gramas =
    (aBase * 0.24 + (aCorpo * 0.2 + aDifusor * 0.12 + aEstruturais * 0.2) * n) *
      1.24 +
    70 * n;
  const precoBRL = Math.round((189 + gramas * 0.62) / 10) * 10 - 1;

  return { gramas, precoBRL };
}
