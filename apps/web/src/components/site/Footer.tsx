import Link from "next/link";

/** Rodapé do site (§3.4-4): assinatura + links mínimos. */
export default function Footer() {
  return (
    <footer className="bg-palco-escuro text-areia">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-6 py-14 md:flex-row md:items-end md:justify-between md:px-10">
        <p className="font-display max-w-[18ch] text-[28px] leading-tight text-luz-acesa">
          Criado por você, feito por partes.
        </p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <Link
            href="/configurador"
            className="transition-colors duration-200 ease-padrao hover:text-luz-acesa"
          >
            Configurador
          </Link>
          <Link
            href="/entrar"
            className="transition-colors duration-200 ease-padrao hover:text-luz-acesa"
          >
            Entrar
          </Link>
          <span className="text-areia/60">© 2026 Per Parte</span>
        </nav>
      </div>
    </footer>
  );
}
