"use client";

/**
 * Barra de ferramentas do palco (§3): Selecionar · Arrastar · Mover · Girar.
 *
 * Duas encarnações da MESMA barra (mesmo store): rail vertical na borda
 * esquerda em md+ (§3.1) e linha horizontal ancorada ao topo do sheet em
 * <md (§3.2). Atalhos V/G/M/R e Esc valem globalmente — um listener só,
 * compartilhado por refcount entre as instâncias.
 */

import { useEffect } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  deselecionar,
  lerEstado,
  setFerramenta,
  useManipulacao,
  type Ferramenta,
} from "./estado";

/** Mesma sombra fosca dos cards que flutuam sobre o palco (§2 do redesign). */
const SOMBRA_CARD = "shadow-[0_16px_44px_-20px_rgba(30,30,30,0.45)]";

/** Moldura comum dos ícones geométricos (§3.3). */
function Icone({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONES: Record<Ferramenta, ReactElement> = {
  // Seta de cursor.
  selecionar: (
    <Icone>
      <path d="M6.5 4l11 7.5-5.2 1.2L9.6 19.5 6.5 4z" />
    </Icone>
  ),
  // Ponto central + 4 setas diagonais: pega solta em qualquer direção.
  arrastar: (
    <Icone>
      <circle cx="12" cy="12" r="2" />
      <path d="M15 9l3.4-3.4M15.2 5.4h3.4v3.4" />
      <path d="M9 9L5.6 5.6M5.4 8.8V5.4h3.4" />
      <path d="M9 15l-3.4 3.4M8.8 18.6H5.4v-3.4" />
      <path d="M15 15l3.4 3.4M18.6 15.2v3.4h-3.4" />
    </Icone>
  ),
  // Cruz ortogonal de setas: eixos fixos.
  mover: (
    <Icone>
      <path d="M12 5v14M5 12h14" />
      <path d="M9.8 7.2 12 5l2.2 2.2M9.8 16.8 12 19l2.2-2.2M7.2 9.8 5 12l2.2 2.2M16.8 9.8 19 12l-2.2 2.2" />
    </Icone>
  ),
  // Arco ~270° com ponta de seta no fim.
  girar: (
    <Icone>
      <path d="M12 5a7 7 0 1 1-7 7" />
      <path d="M2.9 13.9 5 12l2.1 1.9" />
    </Icone>
  ),
};

const FERRAMENTAS: {
  id: Ferramenta;
  rotulo: string;
  atalho: string;
  aria: string;
}[] = [
  {
    id: "selecionar",
    rotulo: "Selecionar",
    atalho: "V",
    aria: "Selecionar — clique numa parte para editar",
  },
  {
    id: "arrastar",
    rotulo: "Arrastar",
    atalho: "G",
    aria: "Arrastar — pegue uma parte e puxe em qualquer direção",
  },
  {
    id: "mover",
    rotulo: "Mover",
    atalho: "M",
    aria: "Mover — desloque uma parte nos eixos",
  },
  {
    id: "girar",
    rotulo: "Girar",
    atalho: "R",
    aria: "Girar — gire ou incline uma parte",
  },
];

const ATALHOS: Record<string, Ferramenta> = {
  v: "selecionar",
  g: "arrastar",
  m: "mover",
  r: "girar",
};

/**
 * Atalhos globais (§3.4). Ignora eventos vindos de campos de texto — o
 * campo "nome da obra" digita V/G/M/R em paz. Esc deseleciona; segundo
 * Esc volta a Selecionar.
 */
function aoTeclarGlobal(e: KeyboardEvent) {
  const alvo = e.target as HTMLElement | null;
  if (
    alvo &&
    (alvo.tagName === "INPUT" ||
      alvo.tagName === "TEXTAREA" ||
      alvo.tagName === "SELECT" ||
      alvo.isContentEditable)
  ) {
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "Escape") {
    const est = lerEstado();
    if (est.selecao) deselecionar();
    else if (est.ferramenta !== "selecionar") setFerramenta("selecionar");
    return;
  }
  const ferramenta = ATALHOS[e.key.toLowerCase()];
  if (ferramenta) setFerramenta(ferramenta);
}

/** As duas instâncias (rail + linha) dividem UM listener de teclado. */
let instanciasOuvindo = 0;

function useAtalhosDeFerramenta() {
  useEffect(() => {
    instanciasOuvindo += 1;
    if (instanciasOuvindo === 1) {
      window.addEventListener("keydown", aoTeclarGlobal);
    }
    return () => {
      instanciasOuvindo -= 1;
      if (instanciasOuvindo === 0) {
        window.removeEventListener("keydown", aoTeclarGlobal);
      }
    };
  }, []);
}

export default function BarraFerramentas({
  orientacao = "vertical",
}: {
  /** vertical = rail em md+ na borda esquerda; horizontal = linha no topo do sheet (<md). */
  orientacao?: "vertical" | "horizontal";
}) {
  const { ferramenta } = useManipulacao();
  useAtalhosDeFerramenta();
  const vertical = orientacao === "vertical";

  return (
    <div
      role="toolbar"
      aria-label="Ferramentas do palco"
      aria-orientation={orientacao}
      className={
        vertical
          ? `absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-1 rounded-full bg-white p-1 md:flex ${SOMBRA_CARD}`
          : `pointer-events-auto mb-2 flex gap-1 self-center rounded-full bg-white p-1 md:hidden ${SOMBRA_CARD}`
      }
    >
      {FERRAMENTAS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setFerramenta(f.id)}
          aria-pressed={ferramenta === f.id}
          aria-label={f.aria}
          aria-keyshortcuts={f.atalho.toLowerCase()}
          className={`group relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ease-padrao ${
            ferramenta === f.id
              ? "bg-palco-escuro text-luz-acesa"
              : "text-palco-escuro hover:text-[#8A5F10]"
          }`}
        >
          {ICONES[f.id]}
          {/* Rótulo no hover/focus-visible — só no rail (não há hover no toque). */}
          {vertical && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-palco-escuro px-2.5 py-1 text-[11px] text-luz-acesa group-hover:block group-focus-visible:block"
            >
              {f.rotulo} ({f.atalho})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
