"use client";

import { useRef, type KeyboardEvent } from "react";
import type { CenaId } from "./tipos";

/**
 * Par de pills Estúdio · Cenário flutuando no alto do viewport: troca o
 * ambiente ao redor da obra (§4.4 — slot de cenários). Módulo leve: nada de
 * three aqui — o Configurador importa este arquivo fora do chunk da cena.
 */

const OPCOES: [CenaId, string][] = [
  ["estudio", "Estúdio"],
  ["quarto", "Cenário"],
];

/** Sombra suave e fosca dos elementos que flutuam sobre o palco (§2). */
const SOMBRA_CARD = "shadow-[0_16px_44px_-20px_rgba(30,30,30,0.45)]";

export default function ToggleCena({
  cena,
  aoTrocar,
  preparando,
}: {
  cena: CenaId;
  aoTrocar: (c: CenaId) => void;
  /** Cenário pedido ainda carregando — mostra o "Dando forma…" (§4.5). */
  preparando: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  /** Radios de verdade: setas movem E selecionam, com foco junto (§6). */
  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    const passo =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (passo === 0) return;
    e.preventDefault();
    const i = OPCOES.findIndex(([id]) => id === cena);
    const proxima = (i + passo + OPCOES.length) % OPCOES.length;
    aoTrocar(OPCOES[proxima][0]);
    refs.current[proxima]?.focus();
  }

  return (
    // No mobile fica abaixo do bloco guardar/copiar (nada colide); em md+
    // centraliza no PALCO visível (viewport menos os 416px do painel §4.1).
    <div className="pointer-events-none absolute left-1/2 top-28 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:left-[calc((100%-416px)/2)] md:top-[4.25rem]">
      <div
        role="radiogroup"
        aria-label="Cena ao redor da obra"
        onKeyDown={teclado}
        className={`pointer-events-auto flex rounded-full bg-white p-1 ${SOMBRA_CARD}`}
      >
        {OPCOES.map(([id, rotulo], i) => (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={cena === id}
            tabIndex={cena === id ? 0 : -1}
            onClick={() => aoTrocar(id)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] transition-all duration-300 ease-padrao ${
              cena === id
                ? "bg-palco-escuro font-semibold text-luz-acesa"
                : "text-[#6D675C] hover:text-palco-escuro"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {/* O estúdio segura o palco enquanto o cenário carrega (§4.5). */}
      {preparando && (
        <span
          role="status"
          className={`rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6D675C] motion-safe:animate-pulse ${SOMBRA_CARD}`}
        >
          Dando forma…
        </span>
      )}
    </div>
  );
}
