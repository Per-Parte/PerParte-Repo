/**
 * O STL binário é o contrato com a fábrica: estrutura de bytes exata,
 * contagem certa, normais unitárias e vértices em mm.
 */

import { describe, expect, it } from "vitest";
import { ENCAIXES, gerarSTLBinario, malhaRevolucao, perfilPastilhaMacho } from "../src";
import type { Malha } from "../src/malha";

const TRIANGULO: Malha = {
  posicoes: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 7]),
  indices: new Uint32Array([0, 1, 2, 0, 3, 1, 1, 3, 2, 0, 2, 3]),
};

describe("gerarSTLBinario", () => {
  it("estrutura: 84 bytes de cabeçalho + 50 por triângulo", () => {
    const stl = gerarSTLBinario(TRIANGULO, "teste");
    const nTris = TRIANGULO.indices.length / 3;
    expect(stl.byteLength).toBe(84 + nTris * 50);
    const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
    expect(dv.getUint32(80, true)).toBe(nTris);
    const cabecalho = new TextDecoder("ascii").decode(stl.slice(0, 24));
    expect(cabecalho).toContain("Per Parte - teste - mm");
  });

  it("normais unitárias e vértices idênticos à malha", () => {
    const stl = gerarSTLBinario(TRIANGULO);
    const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
    // Primeiro triângulo: (0,0,0) (10,0,0) (0,10,0) → normal (0,0,1).
    expect(dv.getFloat32(84, true)).toBeCloseTo(0, 6);
    expect(dv.getFloat32(88, true)).toBeCloseTo(0, 6);
    expect(dv.getFloat32(92, true)).toBeCloseTo(1, 6);
    expect(dv.getFloat32(96, true)).toBe(0); // v1.x
    expect(dv.getFloat32(108, true)).toBe(10); // v2.x
    expect(dv.getFloat32(124, true)).toBe(10); // v3.y
    // Toda normal do arquivo é unitária.
    for (let t = 0; t < TRIANGULO.indices.length / 3; t++) {
      const o = 84 + t * 50;
      const n = Math.hypot(
        dv.getFloat32(o, true),
        dv.getFloat32(o + 4, true),
        dv.getFloat32(o + 8, true)
      );
      expect(n).toBeCloseTo(1, 5);
    }
  });

  it("uma peça real do kit F5 gera arquivo consistente", () => {
    const malha = malhaRevolucao(
      perfilPastilhaMacho(ENCAIXES.baseCorpo.anel),
      64
    );
    const stl = gerarSTLBinario(malha, "calibracao");
    const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
    expect(dv.getUint32(80, true)).toBe(malha.indices.length / 3);
    expect(stl.byteLength).toBe(84 + (malha.indices.length / 3) * 50);
  });
});
