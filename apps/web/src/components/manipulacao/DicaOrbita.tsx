"use client";

/**
 * QW9 — dica de primeira visita do palco (§8 da spec de manipulação):
 * pill branca centrada no palco visível ensinando a órbita. Aparece uma
 * única vez (localStorage["pp.dicaOrbita"]="vista"), só com a cena montada,
 * e some no primeiro arrasto sobre o canvas, no "Entendi" ou após 10 s.
 * Sem pulso com prefers-reduced-motion (motion-safe no pontinho).
 */

import { useCallback, useEffect, useState } from "react";
import { lerPonte } from "./estado";

const CHAVE = "pp.dicaOrbita";

/** Mesma sombra fosca dos cards que flutuam sobre o palco (§2 do redesign). */
const SOMBRA_CARD = "shadow-[0_16px_44px_-20px_rgba(30,30,30,0.45)]";

export default function DicaOrbita() {
  const [visivel, setVisivel] = useState(false);

  const fechar = useCallback(() => {
    setVisivel(false);
    try {
      window.localStorage.setItem(CHAVE, "vista");
    } catch {
      // Sem storage (modo privado etc.): a dica só não persiste.
    }
  }, []);

  // Espera a cena montar (o Canvas chega por import dinâmico) antes de aparecer.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE) === "vista") return;
    } catch {
      // Sem storage: mostra mesmo assim.
    }
    let cancelada = false;
    const sonda = window.setInterval(() => {
      if (!document.querySelector(".palco-3d canvas")) return;
      window.clearInterval(sonda);
      if (!cancelada) setVisivel(true);
    }, 250);
    return () => {
      cancelada = true;
      window.clearInterval(sonda);
    };
  }, []);

  // Enquanto visível: some sozinha em 10 s ou no primeiro pointerdown+move
  // sobre o canvas (a pessoa já está orbitando — a dica cumpriu o papel).
  useEffect(() => {
    if (!visivel) return;
    const canvas = document.querySelector<HTMLCanvasElement>(".palco-3d canvas");
    const timer = window.setTimeout(fechar, 10000);
    let desceu = false;
    const aoDescer = () => {
      desceu = true;
    };
    const aoMover = () => {
      if (desceu) fechar();
    };
    canvas?.addEventListener("pointerdown", aoDescer);
    canvas?.addEventListener("pointermove", aoMover);
    return () => {
      window.clearTimeout(timer);
      canvas?.removeEventListener("pointerdown", aoDescer);
      canvas?.removeEventListener("pointermove", aoMover);
    };
  }, [visivel, fechar]);

  if (!visivel || typeof window === "undefined") return null;

  // No <md a pill fica acima da barra compacta + toolbar (que acompanham o
  // sheet); em md+ o bottom-24 e o centro do palco visível vêm das classes.
  const md = window.innerWidth >= 768;
  const estilo = md
    ? undefined
    : { bottom: `calc(${lerPonte()?.alturaSheet ?? 45}dvh + 124px)` };

  return (
    <div
      role="status"
      style={estilo}
      className={`pointer-events-auto absolute left-1/2 z-10 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-[12px] text-palco-escuro md:bottom-24 md:left-[calc((100%-416px)/2)] ${SOMBRA_CARD}`}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-acento motion-safe:animate-pulse"
      />
      <span className="hidden whitespace-nowrap md:inline">
        Arraste para girar a obra · role para chegar perto
      </span>
      <span className="whitespace-nowrap md:hidden">
        Arraste para girar · belisque para chegar perto
      </span>
      <button
        type="button"
        onClick={fechar}
        aria-label="Entendi — esconder a dica"
        title="Entendi"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6D675C] transition-colors duration-300 ease-padrao hover:text-palco-escuro"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
