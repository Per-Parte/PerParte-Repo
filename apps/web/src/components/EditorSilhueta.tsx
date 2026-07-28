"use client";

import { useRef, useState } from "react";
import {
  LIMITES_CRIAR,
  perfilCorpo,
  TS_PERFIL_LIVRE,
  type ParametrosCorpo,
} from "@per-parte/nucleo";

/**
 * Modo hard: a silhueta do corpo com 5 pontos arrastáveis.
 * O desenho mostra o perfil REAL (já passado pela cascata de clamps do
 * núcleo) — arrastar além do permitido só encosta no limite, nunca dá erro.
 */

const LARGURA = 150;
const ALTURA = 230;
const MARGEM = 12;
const ESCALA_X = 2; // px por mm de raio

const xPx = (raioMm: number) => MARGEM + raioMm * ESCALA_X;
const yPx = (t: number) => MARGEM + (1 - t) * (ALTURA - 2 * MARGEM);

interface Props {
  corpo: ParametrosCorpo;
  aoMudar: (raios: number[]) => void;
}

export default function EditorSilhueta({ corpo, aoMudar }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const raios = corpo.perfilLivre ?? [];
  const L = LIMITES_CRIAR.corpo.perfilLivreRaioMm;

  // Silhueta real (com clamps do núcleo), só a região lateral.
  const perfil = perfilCorpo(corpo).filter(
    (p) => p.y >= 0 && p.y <= corpo.alturaMm
  );
  const caminho = perfil
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xPx(p.x).toFixed(1)},${yPx(p.y / corpo.alturaMm).toFixed(1)}`
    )
    .join(" ");

  function raioDoEvento(e: React.PointerEvent): number {
    const rect = svgRef.current!.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * LARGURA;
    const r = (xSvg - MARGEM) / ESCALA_X;
    return Math.min(L.max, Math.max(L.min, Math.round(r * 2) / 2));
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="w-full touch-none select-none"
        style={{ maxHeight: 260 }}
        onPointerMove={(e) => {
          if (arrastando === null) return;
          const novo = [...raios];
          novo[arrastando] = raioDoEvento(e);
          aoMudar(novo);
        }}
        onPointerUp={() => setArrastando(null)}
        onPointerLeave={() => setArrastando(null)}
      >
        {/* eixo (miolo elétrico) */}
        <line
          x1={MARGEM}
          y1={MARGEM}
          x2={MARGEM}
          y2={ALTURA - MARGEM}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="3 3"
        />
        {/* silhueta real */}
        <path d={caminho} fill="none" stroke="#F2EDE4" strokeWidth={1.6} />
        {/* pontos de controle */}
        {TS_PERFIL_LIVRE.map((t, i) => (
          <circle
            key={t}
            cx={xPx(raios[i] ?? L.min)}
            cy={yPx(t)}
            r={6}
            fill={arrastando === i ? "#D9772F" : "#1E1B18"}
            stroke="#F3B65B"
            strokeWidth={1.5}
            style={{ cursor: "ew-resize" }}
            onPointerDown={(e) => {
              (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
              setArrastando(i);
            }}
          />
        ))}
      </svg>
      <div className="px-1 pb-1 text-[10px] text-[#7d766a]">
        Arraste os pontos para os lados. O traço é a peça real — os limites de
        fabricação seguram o arrasto sozinhos.
      </div>
    </div>
  );
}
