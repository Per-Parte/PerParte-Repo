"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

type Modo = "entrar" | "cadastrar";

/** Destino pós-login: ?voltar=... da URL, sempre caminho interno. */
function destinoVoltar(): string {
  const bruto = new URLSearchParams(window.location.search).get("voltar");
  return bruto && bruto.startsWith("/") ? bruto : "/minhas-criacoes";
}

export default function PaginaEntrar() {
  const supabase = useMemo(() => criarClienteNavegador(), []);
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setErro(
        "Ambiente sem Supabase configurado — copie .env.example para .env.local e preencha."
      );
      return;
    }
    setErro(null);
    setAviso(null);
    setOcupado(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) {
          setErro(
            error.message === "Invalid login credentials"
              ? "E-mail ou senha incorretos."
              : "Não foi possível entrar agora. Tente de novo."
          );
          return;
        }
        window.location.assign(destinoVoltar());
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(destinoVoltar())}`,
          },
        });
        if (error) {
          setErro(
            error.message.includes("at least")
              ? "A senha precisa de pelo menos 6 caracteres."
              : "Não foi possível criar a conta agora. Tente de novo."
          );
          return;
        }
        if (data.session) {
          // Projeto sem confirmação de e-mail: já entra direto.
          window.location.assign(destinoVoltar());
        } else {
          setAviso(
            "Conta criada! Confira seu e-mail e clique no link de confirmação para entrar."
          );
        }
      }
    } finally {
      setOcupado(false);
    }
  }

  const podeEnviar = email.includes("@") && senha.length >= 6 && !ocupado;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#121110] p-6 text-[#F2EDE4]">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="block text-center">
          <div className="text-[21px] font-extrabold tracking-[0.16em]">
            PER P
            <span
              style={{ color: "transparent", WebkitTextStroke: "1.1px #F2EDE4" }}
            >
              A
            </span>
            RTE
          </div>
          <div className="mt-1 text-[11px] text-[#A69D8D]">
            monte por partes. crie cada parte.
          </div>
        </Link>

        <div className="vidro mt-8 rounded-3xl p-6 shadow-2xl shadow-black/50">
          <div className="mx-auto flex w-full rounded-full bg-white/[0.06] p-1">
            {(
              [
                ["entrar", "Entrar"],
                ["cadastrar", "Criar conta"],
              ] as const
            ).map(([id, titulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setModo(id);
                  setErro(null);
                  setAviso(null);
                }}
                className={`flex-1 rounded-full py-2 text-[13px] transition-all ${
                  modo === id
                    ? "bg-[#F2EDE4] font-semibold text-[#161412]"
                    : "text-[#A69D8D] hover:text-[#E7E0D2]"
                }`}
              >
                {titulo}
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#A69D8D]">E-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[14px] outline-none transition-colors placeholder:text-[#7d766a] focus:border-white/30"
                placeholder="voce@exemplo.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#A69D8D]">
                Senha {modo === "cadastrar" && "(mínimo 6 caracteres)"}
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-white/30"
                placeholder="••••••••"
              />
            </label>

            {erro && (
              <p className="rounded-xl border border-[#E06A55]/30 bg-[#E06A55]/10 px-3.5 py-2.5 text-[12px] text-[#E8A093]">
                {erro}
              </p>
            )}
            {aviso && (
              <p className="rounded-xl border border-[#8FB07E]/30 bg-[#8FB07E]/10 px-3.5 py-2.5 text-[12px] text-[#B5CBA8]">
                {aviso}
              </p>
            )}

            <button
              type="submit"
              disabled={!podeEnviar}
              className="mt-1 rounded-full bg-[#F2EDE4] px-5 py-2.5 text-[13px] font-semibold text-[#161412] transition-colors hover:bg-white disabled:opacity-40"
            >
              {ocupado
                ? "aguarde…"
                : modo === "entrar"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#7d766a]">
          Sua conta guarda as criações que você salvar no configurador.{" "}
          <Link
            href="/configurador"
            className="text-[#A69D8D] underline-offset-2 hover:text-[#E7E0D2] hover:underline"
          >
            Voltar ao configurador
          </Link>
        </p>
      </div>
    </div>
  );
}
