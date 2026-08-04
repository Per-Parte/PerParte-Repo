import Link from "next/link";
import AnelDeObras from "./AnelDeObras";

/** Herói "Infinitas possibilidades" (§3.2). Z: fundo → anel → glow → texto. */
export default function Heroi() {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden [background:var(--grad-hero)]">
      <AnelDeObras className="z-0" />

      {/* pointer-events: o wrapper deixa passar os cliques para os cards do anel. */}
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-[14vh] text-center">
        <div className="pointer-events-auto relative flex flex-col items-center">
          {/* Glow — a luz acesa por trás das palavras. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 blur-2xl [background:var(--glow)]"
          />

          <h1 className="relative font-display text-[clamp(56px,9vw,128px)] leading-[0.95] text-palco-escuro">
            Infinitas
            <br />
            possibilidades
          </h1>
          <p className="relative mt-6 max-w-[52ch] text-[17px] leading-relaxed text-palco-escuro">
            Escolha cada parte — ou invente as suas. A gente imprime em 3D, sob
            demanda, e entrega uma obra que é só sua.
          </p>
          <div className="relative mt-10 flex flex-col items-center gap-5">
            <Link
              href="/configurador"
              className="rounded-full bg-palco-escuro px-10 py-4 text-[16px] font-semibold text-luz-acesa transition-colors duration-300 ease-padrao hover:bg-acento"
            >
              Criar minha obra
            </Link>
            <a
              href="#obras"
              className="text-[14px] font-medium text-palco-escuro/70 transition-colors duration-200 ease-padrao hover:text-palco-escuro"
            >
              Ver obras de outros criadores ↓
            </a>
          </div>
        </div>
      </div>

      {/* Grão só no herói (§2). */}
      <div aria-hidden className="grao z-20" />
    </section>
  );
}
