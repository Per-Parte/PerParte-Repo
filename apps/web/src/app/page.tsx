import Link from "next/link";
import { redirect } from "next/navigation";
import { ENCAIXES } from "@per-parte/nucleo";
import LuminariaHero from "@/components/LuminariaHero";

const oCm = (raioMm: number) => ((raioMm * 2) / 10).toFixed(1).replace(".", ",");

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  // Links de criação antigos apontavam para a raiz — seguem funcionando.
  const { c } = await searchParams;
  if (c) redirect(`/configurador?c=${encodeURIComponent(c)}`);

  return (
    <div className="min-h-dvh bg-[#121110] text-[#F2EDE4]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-[19px] font-extrabold tracking-[0.16em]">
          PER P
          <span
            style={{ color: "transparent", WebkitTextStroke: "1.1px #F2EDE4" }}
          >
            A
          </span>
          RTE
        </div>
        <Link
          href="/configurador"
          className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2 text-[13px] font-semibold text-[#F2EDE4] transition-colors hover:border-white/30 hover:bg-white/[0.1]"
        >
          Abrir o configurador
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        {/* Herói */}
        <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="font-serif text-5xl font-medium leading-[1.08] tracking-tight md:text-6xl">
              Monte por partes.
              <br />
              <em className="text-[#D3AC6C]">Crie</em> cada parte.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#A69D8D]">
              Luminárias de mesa impressas em 3D, fabricadas sob demanda no
              Brasil. Você combina base, corpo e difusor — ou esculpe os seus —
              e a gente imprime exatamente o que você viu na tela.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/configurador"
                className="rounded-full bg-[#F2EDE4] px-7 py-3 text-[14px] font-semibold text-[#161412] transition-colors hover:bg-white"
              >
                Criar minha luminária
              </Link>
              <a
                href="#como-funciona"
                className="rounded-full border border-white/20 px-7 py-3 text-[14px] text-[#E7E0D2] transition-colors hover:border-white/40"
              >
                Como funciona
              </a>
            </div>
            <p className="mt-4 text-[11.5px] text-[#7d766a]">
              A peça girando ao lado é 3D de verdade — arraste para ver.
            </p>
          </div>
          <LuminariaHero />
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="border-t border-white/[0.08] py-14">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A69D8D]">
            Como funciona
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                "1 · Monte ou crie",
                "Combine partes prontas do catálogo — ou entre no modo Criar e esculpa as suas com controles simples. Sem CAD, sem erro: os controles só vão até onde a fábrica vai.",
              ],
              [
                "2 · A gente fabrica",
                "Cada peça é impressa em 3D sob demanda, com módulo elétrico certificado montado de fábrica. O que você viu na tela é o que sai da impressora.",
              ],
              [
                "3 · Chega pronta para montar",
                "As partes se encaixam com um clique — e continuam compatíveis para sempre. Enjoou do difusor? Troque só ele, não a luminária inteira.",
              ],
            ].map(([titulo, texto]) => (
              <div
                key={titulo}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <h3 className="text-[15px] font-semibold">{titulo}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#A69D8D]">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* O princípio */}
        <section className="border-t border-white/[0.08] py-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif text-3xl font-medium">
                Interfaces fixas, partes livres.
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#A69D8D]">
                Todo o sistema se apoia em dois encaixes padronizados que nunca
                mudam. A forma de cada parte é livre dentro das regras de
                fabricação — as bordas são sempre iguais. Consequência:
                qualquer parte já criada encaixa em qualquer outra, hoje e
                daqui a dez anos.
              </p>
            </div>
            <div className="rounded-3xl border border-[#D3AC6C]/25 bg-[#D3AC6C]/[0.05] px-7 py-5 text-center">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#A69D8D]">
                encaixes fixos
              </div>
              <div className="mt-1 font-serif text-3xl font-medium tabular-nums text-[#D3AC6C]">
                Ø {oCm(ENCAIXES.baseCorpo.raioMm)} · Ø{" "}
                {oCm(ENCAIXES.corpoDifusor.raioMm)} cm
              </div>
            </div>
          </div>
        </section>

        {/* Criadores */}
        <section className="border-t border-white/[0.08] py-14">
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#C08552]/[0.12] to-transparent px-8 py-10 md:px-12">
            <h2 className="font-serif text-3xl font-medium">
              Para quem cria: royalty por parte.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#A69D8D]">
              Publique uma base, um corpo ou um difusor no catálogo. Cada vez
              que uma luminária vendida usar a sua parte — em qualquer
              combinação — você recebe. Suas peças, seu nome, sua vitrine.
            </p>
            <div className="mt-5 inline-block rounded-full border border-white/15 px-4 py-1.5 text-[12px] text-[#A69D8D]">
              marketplace em construção — em breve
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 text-center">
          <h2 className="font-serif text-4xl font-medium">
            Sua luminária começa agora.
          </h2>
          <Link
            href="/configurador"
            className="mt-7 inline-block rounded-full bg-[#F2EDE4] px-9 py-3.5 text-[15px] font-semibold text-[#161412] transition-colors hover:bg-white"
          >
            Abrir o configurador
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between px-6 py-6 text-[11.5px] text-[#7d766a]">
          <span>Per Parte © 2026</span>
          <span>protótipo — em desenvolvimento aberto</span>
        </div>
      </footer>
    </div>
  );
}
