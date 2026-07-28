/**
 * Escritor de STL binário — formato universal de impressão 3D.
 * 80 bytes de cabeçalho, contagem de triângulos (uint32), e 50 bytes por
 * triângulo (normal + 3 vértices em float32 + atributo). Unidade: mm.
 */

import type { Malha } from "./malha";

export function gerarSTLBinario(malha: Malha, nome = "parte"): Uint8Array {
  const nTris = malha.indices.length / 3;
  const buffer = new ArrayBuffer(84 + nTris * 50);
  const dv = new DataView(buffer);

  const cabecalho = `Per Parte - ${nome} - mm`.slice(0, 79);
  for (let i = 0; i < cabecalho.length; i++) {
    dv.setUint8(i, cabecalho.charCodeAt(i) & 0x7f);
  }
  dv.setUint32(80, nTris, true);

  const p = malha.posicoes;
  const ix = malha.indices;
  let o = 84;
  for (let t = 0; t < nTris; t++) {
    const a = ix[t * 3] * 3;
    const b = ix[t * 3 + 1] * 3;
    const c = ix[t * 3 + 2] * 3;

    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a];
    const vy = p[c + 1] - p[a + 1];
    const vz = p[c + 2] - p[a + 2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const norma = Math.hypot(nx, ny, nz) || 1;
    nx /= norma;
    ny /= norma;
    nz /= norma;

    dv.setFloat32(o, nx, true);
    dv.setFloat32(o + 4, ny, true);
    dv.setFloat32(o + 8, nz, true);
    for (const [k, vi] of [a, b, c].entries()) {
      dv.setFloat32(o + 12 + k * 12, p[vi], true);
      dv.setFloat32(o + 16 + k * 12, p[vi + 1], true);
      dv.setFloat32(o + 20 + k * 12, p[vi + 2], true);
    }
    dv.setUint16(o + 48, 0, true);
    o += 50;
  }

  return new Uint8Array(buffer);
}
