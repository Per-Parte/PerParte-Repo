"use client";

/**
 * Toast didático de limite no canvas (§6): a MESMA linguagem visual do
 * motivo do SliderCtl, flutuando junto ao cursor (desktop) ou acima da
 * toolbar/barra compacta (mobile — o dedo cobre o ponto de toque). Vive no
 * DOM do Configurador; quem o alimenta é mostrarToast() (fase de gestos).
 */

import type { CSSProperties } from "react";
import { lerPonte, useManipulacao } from "./estado";

const SOMBRA_CARD = "shadow-[0_16px_44px_-20px_rgba(30,30,30,0.45)]";

/** Largura máxima — entra no clamp que o mantém fora da faixa do painel. */
const LARGURA_MAX = 280;

export default function ToastLimite() {
  const { toast } = useManipulacao();
  if (!toast || typeof window === "undefined") return null;

  const md = window.innerWidth >= 768;
  const estilo: CSSProperties = md
    ? {
        // Ancorado ao cursor, clampado ao viewport e nunca sob a faixa do
        // painel (416 px + right-4).
        left: Math.max(
          8,
          Math.min(toast.x + 14, window.innerWidth - 432 - LARGURA_MAX)
        ),
        top: Math.max(8, toast.y - 40),
        maxWidth: LARGURA_MAX,
      }
    : {
        // 124px limpam a barra compacta (~52px) + a toolbar horizontal
        // (~52px + respiros) ancoradas ao topo do sheet — o mesmo respiro
        // da DicaOrbita.
        bottom: `calc(${lerPonte()?.alturaSheet ?? 45}dvh + 124px)`,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "calc(100vw - 24px)",
      };

  return (
    <div
      role="status"
      style={estilo}
      className={`pointer-events-none fixed z-30 flex items-start gap-1.5 rounded-lg border border-acento/40 bg-acento/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[#6B4E12] ${SOMBRA_CARD}`}
    >
      <span className="font-bold text-[#8A5F10]">!</span>
      <span>{toast.texto}</span>
    </div>
  );
}
