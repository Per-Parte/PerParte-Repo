import type { ReactNode } from "react";

/** Ícones geométricos ○△□ — discretos, um por passo. */
const ICONE = "h-8 w-8";
const TRACO = { fill: "none", stroke: "var(--dominante)", strokeWidth: 1.5 };

const PASSOS: { titulo: string; texto: string; icone: ReactNode }[] = [
  {
    titulo: "1. Monte ou invente.",
    texto: "Encaixe partes prontas do catálogo — ou esculpa as suas do zero.",
    icone: (
      <svg viewBox="0 0 32 32" className={ICONE} aria-hidden="true" {...TRACO}>
        <circle cx="16" cy="16" r="10.5" />
      </svg>
    ),
  },
  {
    titulo: "2. Veja nascer.",
    texto:
      "O que está na tela é o que sai da impressora, camada por camada.",
    icone: (
      <svg viewBox="0 0 32 32" className={ICONE} aria-hidden="true" {...TRACO}>
        <path d="M16 6.5 26.5 25.5h-21z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titulo: "3. Receba sua obra.",
    texto:
      "Com certificado de autoria e o nome de quem criou cada parte.",
    icone: (
      <svg viewBox="0 0 32 32" className={ICONE} aria-hidden="true" {...TRACO}>
        <rect x="6.5" y="6.5" width="19" height="19" rx="2" />
      </svg>
    ),
  },
];

/** Como funciona (§3.4-2) — 3 passos em cards foscos claros. */
export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-palco-claro">
      <div className="mx-auto max-w-[1100px] px-6 py-20 md:px-10 md:py-28">
        <h2 className="font-display text-[32px] leading-tight text-palco-escuro md:text-[40px]">
          Como funciona
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PASSOS.map((passo) => (
            <div
              key={passo.titulo}
              className="rounded-[var(--raio-painel)] bg-white p-8 shadow-[0_2px_16px_rgba(30,30,30,0.06)]"
            >
              {passo.icone}
              <h3 className="mt-5 text-[17px] font-semibold text-palco-escuro">
                {passo.titulo}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-palco-escuro/75">
                {passo.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
