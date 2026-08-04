/**
 * Vazados — padrões de furo do difusor, portados do protótipo do Caio (03/08).
 *
 * O vazado é o que desenha a sombra na parede. Aqui vive só a MÁSCARA
 * (função pura e determinística: dado (u, v), há furo ou não) — usada pelo
 * preview. A produção de peça vazada exige operações booleanas na malha
 * (lacuna mapeada: manifold-3d); até lá o STL de difusor vazado fica
 * bloqueado na interface — o preview mostra, a encomenda espera. ⚑
 *
 * Garantias:
 * — margem sólida em cima e embaixo: os furos nunca chegam perto dos
 *   encaixes (F5) nem das bordas;
 * — u é periódico: o padrão fecha em 360°.
 */

export type PadraoVazado = "pontos" | "hexagono" | "trelica" | "fenda";

export const PADROES_VAZADO: { id: PadraoVazado; nome: string }[] = [
  { id: "pontos", nome: "Pontos" },
  { id: "hexagono", nome: "Hexágonos" },
  { id: "trelica", nome: "Treliça" },
  { id: "fenda", nome: "Fendas" },
];

export interface ParametrosVazado {
  padrao: PadraoVazado;
  /** Tamanho/densidade dos furos, 0,15–0,85. */
  densidade: number;
  /** Distribuição vertical: -1 mais aberto embaixo, +1 mais aberto em cima. */
  gradiente: number;
}

export const LIMITES_VAZADO = {
  densidade: { min: 0.15, max: 0.85, passo: 0.05 },
  gradiente: { min: -1, max: 1, passo: 0.1 },
} as const;

/** Margem sólida nas pontas, em mm — furo nunca encosta em encaixe/borda. */
const MARGEM_MM = 9;

const frac = (x: number) => x - Math.floor(x);
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

/**
 * Células do padrão: quantas colunas (em volta) e linhas (na altura) cabem,
 * derivadas do tamanho real da peça — furos de ~1–2 cm, não proporcionais.
 */
export function celulasVazado(
  raioMedioMm: number,
  alturaMm: number,
  densidade: number
): { colunas: number; linhas: number } {
  const alvoMm = 20 - 13 * clamp(densidade, 0, 1);
  return {
    colunas: clamp(
      Math.round((2 * Math.PI * raioMedioMm) / alvoMm),
      6,
      64
    ),
    linhas: clamp(Math.round(alturaMm / alvoMm), 3, 64),
  };
}

/**
 * A máscara: true = furo em (u, v). u ∈ [0,1) dá a volta; v ∈ [0,1] sobe a
 * peça. Determinística e periódica em u.
 */
export function mascaraVazado(
  p: ParametrosVazado,
  u: number,
  v: number,
  raioMedioMm: number,
  alturaMm: number
): boolean {
  const margem = clamp(MARGEM_MM / Math.max(1, alturaMm), 0.04, 0.3);
  if (v < margem || v > 1 - margem) return false;

  const g = clamp(1 + p.gradiente * (v * 2 - 1), 0, 2);
  const sz = clamp(p.densidade * g, 0, 1.15);
  if (sz <= 0.02) return false;

  const { colunas, linhas } = celulasVazado(
    raioMedioMm,
    alturaMm,
    p.densidade
  );
  const uu = frac(u);

  switch (p.padrao) {
    case "pontos": {
      const r = Math.floor(v * linhas);
      const off = r & 1 ? 0.5 : 0;
      const du = frac(uu * colunas + off) - 0.5;
      const dv = frac(v * linhas) - 0.5;
      return Math.sqrt(du * du + dv * dv) * 2 < sz * 0.86;
    }
    case "hexagono": {
      const r = Math.floor(v * linhas);
      const off = r & 1 ? 0.5 : 0;
      const du = (frac(uu * colunas + off) - 0.5) * 2;
      const dv = (frac(v * linhas) - 0.5) * 2;
      const hd = Math.max(
        Math.abs(dv),
        Math.abs(dv * 0.5 + du * 0.866),
        Math.abs(dv * 0.5 - du * 0.866)
      );
      return hd < sz * 0.9;
    }
    case "trelica": {
      const s1 = frac(uu * colunas * 0.5 + v * linhas * 0.5);
      const s2 = frac(uu * colunas * 0.5 - v * linhas * 0.5);
      const w = (1 - clamp(sz, 0, 0.95)) * 0.5;
      const d1 = Math.abs(s1 - 0.5) * 2;
      const d2 = Math.abs(s2 - 0.5) * 2;
      return d1 > w && d2 > w;
    }
    case "fenda": {
      const s = Math.abs(frac(uu * colunas * 0.6) - 0.5) * 2;
      return s < sz * 0.8;
    }
  }
}

export function grampearVazado(v: unknown): ParametrosVazado | undefined {
  if (!v || typeof v !== "object") return undefined;
  const bruto = v as Partial<ParametrosVazado>;
  const padrao = PADROES_VAZADO.find((p) => p.id === bruto.padrao)?.id;
  if (!padrao) return undefined;
  const num = (x: unknown, padraoNum: number) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : padraoNum;
  };
  return {
    padrao,
    densidade: clamp(
      num(bruto.densidade, 0.45),
      LIMITES_VAZADO.densidade.min,
      LIMITES_VAZADO.densidade.max
    ),
    gradiente: clamp(
      num(bruto.gradiente, 0),
      LIMITES_VAZADO.gradiente.min,
      LIMITES_VAZADO.gradiente.max
    ),
  };
}
