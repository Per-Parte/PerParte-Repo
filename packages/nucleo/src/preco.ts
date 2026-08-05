/**
 * Estimativa de peso e preço — portada do protótipo.
 *
 * Peso: área lateral × espessura típica de cada parte (casca), com fator de
 * perímetros/preenchimento, + módulo elétrico. Preço: base + R$/g, arredondado
 * para terminar em 9. Tudo provisório (⚑) até o custo real de material e
 * hora de máquina do sócio — quando houver slicer no backend, esta estimativa
 * é substituída pelo cálculo real e os números convergem.
 *
 * O FATOR DE PERÍMETRO (auditoria 05/08, B7): a área lateral vem do perfil
 * de REVOLUÇÃO, mas aletas fundas aumentam a parede em até ~+73 % e o
 * esticar/facetas encolhem em até ~−18 % — e as gramas alimentam o
 * CONTRAPESO, que é item de produção. `fatorPerimetroSecao` percorre o
 * perfil e mede o perímetro real da seção r(θ) com a MESMA matemática da
 * malha (carve + polígono/squircle/esticar, mesmas janelas), por segmento.
 */

import { areaLateralMm2, modulaPorTheta, type FacetasRevolucao, type Ponto2D } from "./geometria";
import {
  janelaTextura,
  pesoFacetas,
  type TexturaRevolucao,
} from "./malha";
import { profundidadeEfetivaTexturaMm, valorTextura, type FamiliaTextura } from "./texturas";

export interface Estimativa {
  gramas: number;
  precoBRL: number;
}

/** Amostras de ângulo por anel na medição do perímetro. */
const N_THETA = 96;

/**
 * Razão entre o perímetro real da seção (com textura e modulação por θ) e o
 * do círculo de revolução, média ponderada pela área lateral de cada trecho
 * do perfil. 1 = liso/redondo. ⚑ aproximação de casca — o slicer substitui.
 */
export function fatorPerimetroSecao(
  perfil: Ponto2D[],
  textura?: TexturaRevolucao,
  facetas?: FacetasRevolucao
): number {
  const familia: FamiliaTextura = textura?.familia ?? "gomos";
  const repeticao =
    familia === "gomos" ? (textura?.gomos ?? 0) : (textura?.repeticao ?? 0);
  const comTextura =
    !!textura &&
    repeticao > 0 &&
    textura.profundidadeMm > 0 &&
    textura.alturaMm > 0;
  const profundidadeMm = comTextura
    ? profundidadeEfetivaTexturaMm(textura)
    : 0;
  const comTheta = modulaPorTheta(facetas);
  if (!comTextura && !comTheta) return 1;

  const raioDe = (rBase: number, y: number, th: number): number => {
    let r = rBase;
    if (comTextura && textura) {
      const t = y / textura.alturaMm;
      const w = janelaTextura(t);
      if (w > 0) {
        const u = th / (Math.PI * 2); // torção só gira a fase — perímetro igual
        r += profundidadeMm * w * 0.5 * (valorTextura(familia, u, t, repeticao) - 1);
        if (textura.pisoMm != null && r < textura.pisoMm) {
          r = Math.min(rBase, textura.pisoMm);
        }
      }
    }
    if (comTheta && facetas) {
      const wf = pesoFacetas(y, facetas);
      if (wf > 0) {
        let rMod: number;
        if (facetas.expoente && facetas.expoente > 2) {
          const nExp = facetas.expoente;
          const co = Math.abs(Math.cos(th));
          const se = Math.abs(Math.sin(th));
          const bruto = Math.pow(
            Math.pow(co, nExp) + Math.pow(se, nExp),
            -1 / nExp
          );
          rMod = (r * bruto) / Math.pow(2, (nExp - 2) / (2 * nExp));
        } else if (facetas.lados >= 3) {
          const setor = Math.PI / facetas.lados;
          const dth = ((th % (2 * setor)) + 2 * setor) % (2 * setor) - setor;
          rMod = (r * Math.cos(setor)) / Math.cos(dth);
        } else {
          rMod = r;
        }
        const prop = facetas.proporcao ?? 1;
        if (prop < 0.999) {
          rMod *= prop / Math.hypot(prop * Math.cos(th), Math.sin(th));
        }
        let rf = r + (rMod - r) * wf;
        if (facetas.pisoMm != null) rf = Math.max(rf, Math.min(r, facetas.pisoMm));
        r = rf;
      }
    }
    return r;
  };

  let somaArea = 0;
  let somaAreaComFator = 0;
  for (let j = 0; j + 1 < perfil.length; j++) {
    const a = perfil[j];
    const b = perfil[j + 1];
    const rMid = (a.x + b.x) / 2;
    if (rMid <= 0.5) continue;
    const areaTrecho = Math.hypot(b.x - a.x, b.y - a.y) * rMid;
    if (areaTrecho <= 0) continue;
    const yMid = (a.y + b.y) / 2;
    // Perímetro da seção neste y ÷ perímetro do círculo.
    let perimetro = 0;
    let x0 = 0;
    let y0 = 0;
    for (let i = 0; i <= N_THETA; i++) {
      const th = (i / N_THETA) * Math.PI * 2;
      const r = raioDe(rMid, yMid, th);
      const x1 = r * Math.cos(th);
      const y1 = r * Math.sin(th);
      if (i > 0) perimetro += Math.hypot(x1 - x0, y1 - y0);
      x0 = x1;
      y0 = y1;
    }
    const fator = perimetro / (2 * Math.PI * rMid);
    somaArea += areaTrecho;
    somaAreaComFator += areaTrecho * fator;
  }
  return somaArea > 0 ? somaAreaComFator / somaArea : 1;
}

/** Fatores de perímetro por parte (1 = revolução lisa). */
export interface FatoresPerimetro {
  base?: number;
  corpo?: number;
  difusor?: number;
  estruturais?: number;
}

export function estimarPreco(
  perfilBase: Ponto2D[],
  perfilCorpo: Ponto2D[],
  perfilDifusor: Ponto2D[],
  pontosDeLuz = 1,
  perfisEstruturais: Ponto2D[][] = [],
  perfisPlaca: Ponto2D[][] = [],
  fatores: FatoresPerimetro = {}
): Estimativa {
  const aBase = (areaLateralMm2(perfilBase) / 100) * (fatores.base ?? 1);
  const aCorpo = (areaLateralMm2(perfilCorpo) / 100) * (fatores.corpo ?? 1);
  const aDifusor =
    (areaLateralMm2(perfilDifusor) / 100) * (fatores.difusor ?? 1);
  // Estruturais têm casca de corpo; sobem junto com a coluna no duo.
  const aEstruturais =
    perfisEstruturais.reduce((s, p) => s + areaLateralMm2(p) / 100, 0) *
    (fatores.estruturais ?? 1);
  // A placa (disco + pescoço) pesa como casca de base (imprime com infill).
  const aPlaca = perfisPlaca.reduce((s, p) => s + areaLateralMm2(p) / 100, 0);

  // Dois pontos de luz: corpo, difusor e módulo elétrico em dobro.
  const n = pontosDeLuz === 2 ? 2 : 1;
  const gramas =
    (aBase * 0.24 +
      aPlaca * 0.24 +
      (aCorpo * 0.2 + aDifusor * 0.12 + aEstruturais * 0.2) * n) *
      1.24 +
    70 * n;
  const precoBRL = Math.round((189 + gramas * 0.62) / 10) * 10 - 1;

  return { gramas, precoBRL };
}
