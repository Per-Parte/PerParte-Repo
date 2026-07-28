/**
 * Malha 3D a partir do perfil de revolução — o caminho da produção.
 *
 * Gera um sólido fechado (estanque): superfície lateral revolucionada +
 * tampas superior e inferior fechadas no eixo. É a MESMA fonte de geometria
 * do preview; aqui em resolução de produção e com eixo de revolução no Z,
 * que é a vertical de impressão (regra F8).
 */

import type { Ponto2D } from "./geometria";

export interface Malha {
  /** x, y, z por vértice, em mm. Z é a vertical de impressão. */
  posicoes: Float32Array;
  /** Trios de índices; enrolamento anti-horário visto de fora. */
  indices: Uint32Array;
}

export function malhaRevolucao(perfil: Ponto2D[], segmentos: number): Malha {
  const nAneis = perfil.length;
  const nVertices = nAneis * segmentos + 2;
  const posicoes = new Float32Array(nVertices * 3);

  for (let j = 0; j < nAneis; j++) {
    for (let i = 0; i < segmentos; i++) {
      const th = (i / segmentos) * Math.PI * 2;
      const o = (j * segmentos + i) * 3;
      posicoes[o] = perfil[j].x * Math.cos(th);
      posicoes[o + 1] = perfil[j].x * Math.sin(th);
      posicoes[o + 2] = perfil[j].y;
    }
  }

  // Ápices que fecham o sólido no eixo (fundo e topo).
  const apiceInferior = nAneis * segmentos;
  const apiceSuperior = apiceInferior + 1;
  posicoes[apiceInferior * 3 + 2] = perfil[0].y;
  posicoes[apiceSuperior * 3 + 2] = perfil[nAneis - 1].y;

  const indices: number[] = [];

  for (let j = 0; j < nAneis - 1; j++) {
    for (let i = 0; i < segmentos; i++) {
      const i2 = (i + 1) % segmentos;
      const a = j * segmentos + i;
      const b = j * segmentos + i2;
      const c = (j + 1) * segmentos + i2;
      const d = (j + 1) * segmentos + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  const ultimoAnel = (nAneis - 1) * segmentos;
  for (let i = 0; i < segmentos; i++) {
    const i2 = (i + 1) % segmentos;
    indices.push(apiceInferior, i2, i); // fundo, normal para -Z
    indices.push(apiceSuperior, ultimoAnel + i, ultimoAnel + i2); // topo, +Z
  }

  return { posicoes, indices: Uint32Array.from(indices) };
}

/** Desloca a malha no plano da mesa de impressão (X/Y), em mm. */
export function transladarMalha(m: Malha, dxMm: number, dyMm: number): Malha {
  const posicoes = new Float32Array(m.posicoes);
  for (let i = 0; i < posicoes.length; i += 3) {
    posicoes[i] += dxMm;
    posicoes[i + 1] += dyMm;
  }
  return { posicoes, indices: m.indices };
}

/** Une malhas independentes num único arquivo (sólidos separados na mesa). */
export function unirMalhas(...malhas: Malha[]): Malha {
  let nV = 0;
  let nI = 0;
  for (const m of malhas) {
    nV += m.posicoes.length;
    nI += m.indices.length;
  }
  const posicoes = new Float32Array(nV);
  const indices = new Uint32Array(nI);
  let oV = 0;
  let oI = 0;
  for (const m of malhas) {
    posicoes.set(m.posicoes, oV);
    for (let i = 0; i < m.indices.length; i++) {
      indices[oI + i] = m.indices[i] + oV / 3;
    }
    oV += m.posicoes.length;
    oI += m.indices.length;
  }
  return { posicoes, indices };
}
