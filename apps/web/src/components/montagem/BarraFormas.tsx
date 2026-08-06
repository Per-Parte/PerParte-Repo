"use client";

/**
 * Montagem v2 · F3 — barra de formas (base central do wireframe):
 * Quadrado · Esfera · Cilindro · Pirâmide · 💡 Ponto de luz.
 * Clicar numa forma abre a grade de variações no painel direito;
 * clicar no ponto de luz adiciona direto (tangenciando a mais alta).
 */

import { PONTOS_DE_LUZ_POR_OBRA, type FormaBloco } from "@per-parte/nucleo";

export const FORMAS_BARRA: { forma: FormaBloco; rotulo: string }[] = [
  { forma: "cubo", rotulo: "Quadrado" },
  { forma: "esfera", rotulo: "Esfera" },
  { forma: "cilindro", rotulo: "Cilindro" },
  { forma: "piramide", rotulo: "Pirâmide" },
];

const ICONES: Record<FormaBloco, React.ReactNode> = {
  cubo: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
    </svg>
  ),
  esfera: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="7.5" />
      <ellipse cx="12" cy="12" rx="7.5" ry="2.8" opacity="0.45" />
    </svg>
  ),
  cilindro: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <ellipse cx="12" cy="6" rx="6" ry="2.4" />
      <path d="M6 6v12M18 6v12" />
      <path d="M6 18a6 2.4 0 0 0 12 0" />
    </svg>
  ),
  piramide: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 4l8 15H4z" strokeLinejoin="round" />
    </svg>
  ),
};

export function BarraFormas({
  formaAberta,
  aoAbrirForma,
  quantidadeLuzes,
  aoAdicionarLuz,
}: {
  formaAberta: FormaBloco | null;
  aoAbrirForma(f: FormaBloco): void;
  quantidadeLuzes: number;
  aoAdicionarLuz(): void;
}) {
  const luzNoTeto = quantidadeLuzes >= PONTOS_DE_LUZ_POR_OBRA.max;
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-white/90 p-2 shadow-lg backdrop-blur">
      {FORMAS_BARRA.map(({ forma, rotulo }) => (
        <button
          key={forma}
          type="button"
          title={`Ver variações de ${rotulo.toLowerCase()}`}
          onClick={() => aoAbrirForma(forma)}
          className={`flex min-h-[60px] w-[74px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition ${
            formaAberta === forma
              ? "bg-neutral-900 text-white"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {ICONES[forma]}
          {rotulo}
        </button>
      ))}

      <div className="mx-1 h-12 w-px bg-neutral-200" />

      <button
        type="button"
        title={
          luzNoTeto
            ? `Máximo de ${PONTOS_DE_LUZ_POR_OBRA.max} pontos de luz nesta fase`
            : "Adicionar o ponto de luz (assenta na forma mais alta)"
        }
        onClick={aoAdicionarLuz}
        disabled={luzNoTeto}
        className="flex min-h-[60px] w-[84px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium text-amber-700 transition enabled:hover:bg-amber-50 disabled:opacity-30"
      >
        <span className="text-2xl leading-none">💡</span>
        Ponto de luz
        <span className="text-[10px] text-neutral-400">
          {quantidadeLuzes}/{PONTOS_DE_LUZ_POR_OBRA.max}
        </span>
      </button>
    </div>
  );
}
