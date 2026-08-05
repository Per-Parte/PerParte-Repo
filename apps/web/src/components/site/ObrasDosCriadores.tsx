import Image from "next/image";

const OBRAS = [
  {
    arquivo: "mood-pp-01-manifesto-vermelho.jpg",
    legenda: "Família Brasa, acesa",
    alt: "Luminária vermelha da família Brasa, acesa",
  },
  {
    arquivo: "mood-pp-02-manifesto-bege.jpg",
    legenda: "Areia, de todo dia",
    alt: "Luminária bege em ambiente tom sobre tom",
  },
  {
    arquivo: "mood-pp-03-manifesto-verde.jpg",
    legenda: "Verde Marco sobre a mesa",
    alt: "Luminária verde da família Marco",
  },
  {
    arquivo: "mood-pp-04-close-juncao.jpg",
    legenda: "A junção, celebrada",
    alt: "Detalhe da junção entre duas partes de uma luminária",
  },
  {
    arquivo: "mood-pp-05-obra-minima-quarto.jpg",
    legenda: "Simples assim. E só sua.",
    alt: "Luminária mínima acesa num quarto",
  },
] as const;

/** Obras dos criadores (§3.4-3) — grade placeholder até o marketplace. */
export default function ObrasDosCriadores() {
  return (
    <section id="obras" className="bg-areia">
      <div className="mx-auto max-w-[1100px] px-6 py-20 md:px-10 md:py-28">
        <h2 className="font-display text-[32px] leading-tight text-palco-escuro md:text-[40px]">
          Obras dos criadores
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3">
          {OBRAS.map((obra) => (
            <figure key={obra.arquivo}>
              <Image
                src={`/obras/${obra.arquivo}`}
                alt={obra.alt}
                width={800}
                height={800}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="aspect-square w-full rounded-[var(--raio-card)] border border-palco-escuro/10 object-cover"
              />
              <figcaption className="mt-2.5 text-[13px] text-palco-escuro/70">
                {obra.legenda}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full border border-palco-escuro/25 px-8 py-3 text-[14px] font-medium text-palco-escuro/50"
          >
            Ver todas
          </button>
          {/* /70 e não /60: 60% sobre areia dá 3,96:1 — reprova AA (§6). */}
          <p className="text-[12.5px] text-palco-escuro/70">
            marketplace em construção — em breve
          </p>
        </div>
      </div>
    </section>
  );
}
