/**
 * Apoio dos testes: verificações geométricas reutilizáveis.
 *
 * "Estanque" aqui é o invariante de produção: todo STL que sai do núcleo
 * precisa ser um sólido fechado e orientado — cada aresta compartilhada por
 * exatamente dois triângulos, um em cada sentido (malha manifold), e volume
 * assinado positivo (normais para fora).
 */

import type { Malha } from "../src/malha";

export interface RelatorioEstanque {
  ok: boolean;
  problema?: string;
}

export function verificarEstanque(m: Malha): RelatorioEstanque {
  const ix = m.indices;
  if (ix.length % 3 !== 0) {
    return { ok: false, problema: "índices não formam triângulos inteiros" };
  }
  const direcionadas = new Map<string, number>();
  for (let t = 0; t < ix.length; t += 3) {
    const abc = [ix[t], ix[t + 1], ix[t + 2]];
    if (abc[0] === abc[1] || abc[1] === abc[2] || abc[2] === abc[0]) {
      return { ok: false, problema: `triângulo degenerado #${t / 3}` };
    }
    for (let k = 0; k < 3; k++) {
      const chave = `${abc[k]}>${abc[(k + 1) % 3]}`;
      direcionadas.set(chave, (direcionadas.get(chave) ?? 0) + 1);
    }
  }
  for (const [chave, vezes] of direcionadas) {
    if (vezes !== 1) {
      return { ok: false, problema: `aresta direcionada repetida ${chave}` };
    }
    const [a, b] = chave.split(">");
    if (direcionadas.get(`${b}>${a}`) !== 1) {
      return { ok: false, problema: `aresta sem par oposto ${chave}` };
    }
  }
  return { ok: true };
}

/** Volume assinado pelo teorema da divergência; positivo = normais para fora. */
export function volumeAssinadoMm3(m: Malha): number {
  const p = m.posicoes;
  const ix = m.indices;
  let v = 0;
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t] * 3;
    const b = ix[t + 1] * 3;
    const c = ix[t + 2] * 3;
    v +=
      (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) -
        p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) +
        p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) /
      6;
  }
  return v;
}

/** Maior inclinação |Δr|/Δy entre pontos consecutivos de um trecho de perfil. */
export function inclinacaoMaxima(
  trecho: { x: number; y: number }[]
): number {
  let pior = 0;
  for (let i = 1; i < trecho.length; i++) {
    const dy = trecho[i].y - trecho[i - 1].y;
    if (dy <= 1e-9) continue;
    pior = Math.max(pior, Math.abs(trecho[i].x - trecho[i - 1].x) / dy);
  }
  return pior;
}
