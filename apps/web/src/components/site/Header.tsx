import Link from "next/link";

const ANCORAS = [
  { rotulo: "Como funciona", href: "#como-funciona" },
  { rotulo: "Obras", href: "#obras" },
  { rotulo: "Criadores", href: "#criadores" },
] as const;

// Hover: o fundo vira acento e o TEXTO escurece — luz-acesa sobre acento
// reprova AA (1,8:1); palco-escuro sobre acento passa (7,4:1) (§6).
const PILL =
  "rounded-full bg-palco-escuro px-5 py-2.5 text-[13px] font-medium text-luz-acesa transition-colors duration-300 ease-padrao hover:bg-acento hover:text-palco-escuro";

/** Barra transparente sobre o herói (§3.1) — fica acima do Anel de Obras. */
export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="font-display text-[22px] leading-none text-luz-acesa">
        Per Parte
      </Link>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-2 md:flex">
        {ANCORAS.map((a) => (
          <a key={a.href} href={a.href} className={PILL}>
            {a.rotulo}
          </a>
        ))}
      </nav>

      <Link href="/configurador" className={PILL}>
        Criar minha obra
      </Link>
    </header>
  );
}
