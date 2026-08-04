/** Faixa para criadores (âncora #criadores dos pills do Header). */
export default function FaixaCriadores() {
  return (
    <section id="criadores" className="bg-dominante">
      <div className="mx-auto max-w-[1100px] px-6 py-20 md:px-10">
        <h2 className="font-display text-[32px] leading-tight text-palco-escuro md:text-[40px]">
          Para quem cria: royalty por parte.
        </h2>
        <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-palco-escuro">
          Publique uma base, um corpo ou um difusor no catálogo. Cada vez que
          uma obra vendida usar a sua parte — em qualquer combinação — você
          recebe. Suas partes, seu nome, sua vitrine.
        </p>
      </div>
    </section>
  );
}
