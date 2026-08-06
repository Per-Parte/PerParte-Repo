"use client";

/**
 * Montagem v2 · F3 — barra de ferramentas (esquerda do wireframe):
 * ícones universais + rótulo em texto embaixo (nunca ícone sozinho),
 * área de toque generosa (≥ 44 px). Público leigo, de idades variadas.
 */

export type Ferramenta =
  | "selecionar"
  | "tamanho"
  | "mover"
  | "rotacionar"
  | "fatiar"
  | "pintar";

/** Ordem da barra: as 4 da espec, depois as duas do pedido de 06/08. */
export const FERRAMENTAS: readonly Ferramenta[] = [
  "selecionar",
  "tamanho",
  "mover",
  "rotacionar",
  "fatiar",
  "pintar",
] as const;

const ICONES: Record<Ferramenta, React.ReactNode> = {
  selecionar: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3l12 9-5.5 1L15 19l-2.5 1L10 14l-4 3z" strokeLinejoin="round" />
    </svg>
  ),
  tamanho: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" strokeLinecap="round" />
    </svg>
  ),
  mover: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rotacionar: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" />
      <path d="M20 3v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // Fatiar: a forma com o plano de corte atravessando (linha tracejada).
  fatiar: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4h10v16H7z" strokeLinejoin="round" opacity="0.75" />
      <path d="M3 12h18" strokeLinecap="round" strokeDasharray="3 2.5" />
    </svg>
  ),
  // Balde de tinta despejando.
  pintar: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 9l6-6 7 7-6 6z" strokeLinejoin="round" />
      <path d="M6.5 10.5L4 13a2.5 2.5 0 0 0 3.5 3.5" strokeLinecap="round" />
      <path d="M18.5 14c1 1.6 1.5 2.7 1.5 3.4a1.5 1.5 0 0 1-3 0c0-.7.5-1.8 1.5-3.4z" strokeLinejoin="round" />
    </svg>
  ),
};

const ROTULOS: Record<Ferramenta, string> = {
  selecionar: "Selecionar",
  tamanho: "Tamanho",
  mover: "Mover",
  rotacionar: "Rotacionar",
  fatiar: "Fatiar",
  pintar: "Pintar",
};

const DICAS: Record<Ferramenta, string> = {
  selecionar: "Toque numa forma da cena para selecioná-la",
  tamanho: "Arraste para cima ou para baixo para mudar o tamanho",
  mover: "Arraste a forma — ela desliza encostada nas outras",
  rotacionar: "Arraste para o lado para girar a forma no próprio eixo",
  fatiar: "Corte a forma selecionada no eixo que quiser",
  pintar: "Escolha uma cor no painel e toque nas formas para pintar",
};

export function BarraFerramentas({
  ativa,
  aoEscolher,
  temSelecao,
  aoApagar,
  podeDesfazer,
  podeRefazer,
  aoDesfazer,
  aoRefazer,
}: {
  ativa: Ferramenta;
  aoEscolher(f: Ferramenta): void;
  temSelecao: boolean;
  aoApagar(): void;
  podeDesfazer: boolean;
  podeRefazer: boolean;
  aoDesfazer(): void;
  aoRefazer(): void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/90 p-2 shadow-lg backdrop-blur">
      {FERRAMENTAS.map((f) => (
        <button
          key={f}
          type="button"
          title={DICAS[f]}
          onClick={() => aoEscolher(f)}
          className={`flex min-h-[52px] w-[64px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition ${
            ativa === f
              ? "bg-neutral-900 text-white"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {ICONES[f]}
          {ROTULOS[f]}
        </button>
      ))}

      <div className="my-1 h-px w-10 bg-neutral-200" />

      <button
        type="button"
        title="Apagar a forma selecionada (quem estava em cima re-ancora)"
        onClick={aoApagar}
        disabled={!temSelecao}
        className="flex min-h-[52px] w-[64px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium text-red-700 transition enabled:hover:bg-red-50 disabled:opacity-30"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Apagar
      </button>

      <div className="my-1 h-px w-10 bg-neutral-200" />

      <div className="flex gap-1">
        <button
          type="button"
          title="Desfazer (Ctrl/Cmd+Z)"
          onClick={aoDesfazer}
          disabled={!podeDesfazer}
          className="flex h-11 w-[30px] items-center justify-center rounded-lg text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 5L3 10l5 5M3 10h11a6 6 0 0 1 0 12h-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          title="Refazer (Ctrl/Cmd+Shift+Z)"
          onClick={aoRefazer}
          disabled={!podeRefazer}
          className="flex h-11 w-[30px] items-center justify-center rounded-lg text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 5l5 5-5 5M21 10H10a6 6 0 0 0 0 12h2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
