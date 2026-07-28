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
    <div className="min-h-dvh bg-[#F2EFE9] text-[#26241F]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-[20px] font-extrabold tracking-[0.14em]">
          PER P
          <span
            style={{ color: "transparent", WebkitTextStroke: "1.2px #26241F" }}
          >
            A
          </span>
          RTE
        </div>
        <Link
          href="/configurador"
          className="rounded-full bg-[#26241F] px-5 py-2 text-[13px] font-semibold text-white hover:bg-black"
        >
          Abrir o configurador
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        {/* Herói */}
        <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Monte por partes.
              <br />
              Crie cada parte.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#6E695E]">
              Luminárias de mesa impressas em 3D, fabricadas sob demanda no
              Brasil. Você combina base, corpo e difusor — ou esculpe os seus —
              e a gente imprime exatamente o que você viu na tela.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/configurador"
                className="rounded-xl bg-[#D9772F] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#c4661f]"
              >
                Criar minha luminária
              </Link>
              <a
                href="#como-funciona"
                className="rounded-xl border border-[#DDD8CC] bg-white px-6 py-3 text-[14px] font-semibold hover:border-[#6E695E]"
              >
                Como funciona
              </a>
            </div>
            <p className="mt-4 text-[11.5px] text-[#6E695E]">
              A peça girando ao lado é 3D de verdade — arraste para ver.
            </p>
          </div>
          <LuminariaHero />
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="border-t border-[#DDD8CC] py-14">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E695E]">
            Como funciona
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
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
                className="rounded-2xl border border-[#DDD8CC] bg-[#FBFAF7] p-6"
              >
                <h3 className="text-[15px] font-semibold">{titulo}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#6E695E]">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* O princípio */}
        <section className="border-t border-[#DDD8CC] py-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-semibold">
                Interfaces fixas, partes livres.
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#6E695E]">
                Todo o sistema se apoia em dois encaixes padronizados que nunca
                mudam. A forma de cada parte é livre dentro das regras de
                fabricação — as bordas são sempre iguais. Consequência:
                qualquer parte já criada encaixa em qualquer outra, hoje e
                daqui a dez anos.
              </p>
            </div>
            <div className="rounded-2xl border border-[#DDD8CC] bg-white px-6 py-4 text-center">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#6E695E]">
                encaixes fixos
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums">
                Ø {oCm(ENCAIXES.baseCorpo.raioMm)} · Ø{" "}
                {oCm(ENCAIXES.corpoDifusor.raioMm)} cm
              </div>
            </div>
          </div>
        </section>

        {/* Criadores */}
        <section className="border-t border-[#DDD8CC] py-14">
          <div className="rounded-3xl bg-[#26241F] px-8 py-10 text-[#F2EFE9] md:px-12">
            <h2 className="text-2xl font-semibold">
              Para quem cria: royalty por parte.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#BDB7A8]">
              Publique uma base, um corpo ou um difusor no catálogo. Cada vez
              que uma luminária vendida usar a sua parte — em qualquer
              combinação — você recebe. Suas peças, seu nome, sua vitrine.
            </p>
            <div className="mt-5 inline-block rounded-full border border-[#6E695E] px-4 py-1.5 text-[12px] text-[#BDB7A8]">
              marketplace em construção — em breve
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 text-center">
          <h2 className="text-3xl font-semibold">
            Sua luminária começa agora.
          </h2>
          <Link
            href="/configurador"
            className="mt-6 inline-block rounded-xl bg-[#D9772F] px-8 py-3.5 text-[15px] font-semibold text-white hover:bg-[#c4661f]"
          >
            Abrir o configurador
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#DDD8CC]">
        <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between px-6 py-6 text-[11.5px] text-[#6E695E]">
          <span>Per Parte © 2026</span>
          <span>protótipo — em desenvolvimento aberto</span>
        </div>
      </footer>
    </div>
  );
}
