/** Manifesto (§3.4-1) — copies fundadoras na íntegra, Luz Acesa nos destaques. */
export default function Manifesto() {
  return (
    <section className="bg-palco-escuro text-areia">
      <div className="mx-auto max-w-[720px] px-6 py-24 md:py-32">
        <p className="text-[20px] leading-relaxed md:text-[24px]">
          O padrão está por toda parte. A mesma luminária na sua casa, na do
          vizinho, na vitrine.
        </p>
        <p className="mt-8 text-[20px] leading-relaxed md:text-[24px]">
          A Per Parte existe para o contrário: aqui, cada objeto pode ser
          criado, <em className="not-italic text-luz-acesa">parte por parte</em>,
          por quem vai viver com ele.
        </p>
        <p className="mt-8 text-[20px] leading-relaxed md:text-[24px]">
          Você escolhe a forma, a cor, o acabamento, a luz. A gente só fabrica
          depois que você cria —{" "}
          <em className="not-italic text-luz-acesa">
            sob demanda, sem estoque, sem desperdício
          </em>
          .
        </p>
        <p className="mt-14 font-display text-[34px] leading-tight text-luz-acesa md:text-[46px]">
          Bem-vindo à era do criar.
        </p>
      </div>
    </section>
  );
}
