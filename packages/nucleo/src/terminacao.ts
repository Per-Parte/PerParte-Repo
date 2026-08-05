/**
 * Corte de terminação — a máquina z(θ), irmã da modulação r(θ) das facetas.
 *
 * Enquanto facetas/superelipse modulam o RAIO pelo ângulo, o corte modula a
 * ALTURA da borda livre: cada vértice desce para z' = min(z, topo − δ(θ)).
 * Duas funções no mesmo slot:
 *   — "obliquo": δ = meio-cosseno → a boca vira um plano inclinado
 *     (o gesto do topo cortado em diagonal);
 *   — "dentes": δ = zigue-zague triangular → coroa de dentes na borda
 *     (o gesto do Ursa Minor).
 *
 * Garantias por construção:
 * — só remove material DE CIMA: nenhum balanço novo (F4 intacto — min é
 *   monótono, anéis nunca se invertem, o sólido continua estanque);
 * — só em TERMINAÇÃO LIVRE (topo do difusor): o corpo carrega o macho F5
 *   no topo e não é elegível — a UI nem oferece;
 * — a silhueta lateral não muda: o corte mexe em z, nunca em r;
 * — a fêmea fica longe por profundidade máxima limitada pela altura.
 */

export type TipoCorteBorda = "obliquo" | "dentes";

export interface CorteBorda {
  tipo: TipoCorteBorda;
  /** Quanto a borda desce no ponto mais fundo do corte, em mm. */
  profundidadeMm: number;
  /** Dentes: quantos ao redor (ignorado no oblíquo). */
  repeticao?: number;
}

export const TIPOS_CORTE_BORDA: { id: TipoCorteBorda; nome: string }[] = [
  { id: "obliquo", nome: "Oblíqua" },
  { id: "dentes", nome: "Dentes" },
];

export const LIMITES_CORTE_BORDA = {
  /**
   * Raio-X 05/08: 25 → 60 mm. Os 25 eram conservadorismo do primeiro dia —
   * o clamp `min` é monótono (anéis nunca se invertem, sólido estanque) e
   * só remove material de cima, em qualquer profundidade. O gesto da boca
   * diagonal funda (~50–60 mm) pedia o teto real. ⚑ validar impresso.
   */
  profundidadeMm: { min: 4, max: 60, passo: 1 },
  repeticao: { min: 4, max: 20, passo: 1 },
} as const;

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const frac = (x: number) => x - Math.floor(x);

/**
 * Teto da profundidade para uma dada altura de parte: o corte nunca chega
 * perto da fêmea (mesmo espírito da margem sólida dos vazados).
 */
export function profundidadeMaximaCorteMm(alturaMm: number): number {
  return Math.min(
    LIMITES_CORTE_BORDA.profundidadeMm.max,
    Math.round(0.35 * alturaMm)
  );
}

/**
 * δ(θ) — quanto a borda desce nesta volta. u ∈ [0,1) dá a volta; periódico
 * e determinístico, como tudo que vira malha.
 */
export function deltaCorteMm(corte: CorteBorda, u: number): number {
  const uu = frac(u);
  if (corte.tipo === "obliquo") {
    // Plano inclinado: fundo do corte em u = 0, borda intacta em u = 0,5.
    return corte.profundidadeMm * (0.5 + 0.5 * Math.cos(uu * Math.PI * 2));
  }
  // Dentes triangulares (zigue-zague), fechando em 360°.
  const rep = Math.max(1, Math.round(corte.repeticao ?? 8));
  return corte.profundidadeMm * (2 * Math.abs(frac(uu * rep) - 0.5));
}

/** Corte vindo de fora (link, request): ou é válido e grampeado, ou não é. */
export function grampearCorteBorda(
  v: unknown,
  alturaMm: number
): CorteBorda | undefined {
  if (!v || typeof v !== "object") return undefined;
  const bruto = v as Partial<CorteBorda>;
  const tipo = TIPOS_CORTE_BORDA.find((t) => t.id === bruto.tipo)?.id;
  if (!tipo) return undefined;
  const profundidadeMm = clamp(
    Number(bruto.profundidadeMm) || 0,
    LIMITES_CORTE_BORDA.profundidadeMm.min,
    profundidadeMaximaCorteMm(alturaMm)
  );
  if (profundidadeMm <= 0) return undefined;
  return {
    tipo,
    profundidadeMm,
    ...(tipo === "dentes"
      ? {
          repeticao: Math.round(
            clamp(
              Number(bruto.repeticao) || 8,
              LIMITES_CORTE_BORDA.repeticao.min,
              LIMITES_CORTE_BORDA.repeticao.max
            )
          ),
        }
      : {}),
  };
}
