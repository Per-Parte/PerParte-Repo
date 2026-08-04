"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

interface Criacao {
  id: string;
  nome: string;
  codigo: string;
  criado_em: string;
}

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PaginaMinhasCriacoes() {
  const supabase = useMemo(() => criarClienteNavegador(), []);
  const [carregando, setCarregando] = useState(true);
  const [emailConta, setEmailConta] = useState<string | null>(null);
  const [criacoes, setCriacoes] = useState<Criacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return; // sem Supabase: a renderização já explica
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // O proxy já redireciona; isto cobre navegação puramente no cliente.
        window.location.assign("/entrar?voltar=/minhas-criacoes");
        return;
      }
      setEmailConta(user.email ?? null);
      const { data, error } = await supabase
        .from("criacoes")
        .select("id, nome, codigo, criado_em")
        .order("criado_em", { ascending: false });
      if (error) setErro("Não deu para carregar suas criações. Recarregue a página.");
      else setCriacoes(data ?? []);
      setCarregando(false);
    })();
  }, [supabase]);

  async function excluir(c: Criacao) {
    if (!supabase) return;
    if (!window.confirm(`Excluir "${c.nome}"? Essa ação não tem volta.`)) return;
    setExcluindo(c.id);
    const { error } = await supabase.from("criacoes").delete().eq("id", c.id);
    if (error) setErro("Não deu para excluir agora. Tente de novo.");
    else setCriacoes((atual) => atual.filter((x) => x.id !== c.id));
    setExcluindo(null);
  }

  async function sair() {
    await supabase?.auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className="min-h-dvh bg-[#121110] text-[#F2EDE4]">
      <header className="mx-auto flex w-full max-w-[860px] items-start justify-between px-6 pt-8">
        <Link href="/" className="block">
          <div className="text-[19px] font-extrabold tracking-[0.16em]">
            PER P
            <span
              style={{ color: "transparent", WebkitTextStroke: "1.1px #F2EDE4" }}
            >
              A
            </span>
            RTE
          </div>
          <div className="text-[11px] text-[#A69D8D]">minhas criações</div>
        </Link>
        <div className="flex items-center gap-2 pt-1 text-[11px]">
          {emailConta && <span className="text-[#7d766a]">{emailConta}</span>}
          <button
            onClick={sair}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2]"
          >
            sair
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[860px] px-6 py-8">
        {!supabase ? (
          <p className="rounded-xl border border-[#E06A55]/30 bg-[#E06A55]/10 px-3.5 py-2.5 text-[12px] text-[#E8A093]">
            Ambiente sem Supabase configurado — copie .env.example para
            .env.local e preencha.
          </p>
        ) : carregando ? (
          <p className="text-[13px] text-[#7d766a]">carregando…</p>
        ) : (
          <>
            {erro && (
              <p className="mb-4 rounded-xl border border-[#E06A55]/30 bg-[#E06A55]/10 px-3.5 py-2.5 text-[12px] text-[#E8A093]">
                {erro}
              </p>
            )}

            {criacoes.length === 0 ? (
              <div className="vidro rounded-3xl p-10 text-center">
                <p className="font-display text-[22px]">Nada por aqui ainda.</p>
                <p className="mx-auto mt-2 max-w-[400px] text-[13px] text-[#A69D8D]">
                  Monte ou crie uma luminária no configurador e use o botão{" "}
                  <b className="text-[#E7E0D2]">salvar</b> — ela aparece aqui,
                  pronta para reabrir e continuar de onde parou.
                </p>
                <Link
                  href="/configurador"
                  className="mt-6 inline-block rounded-full bg-[#F2EDE4] px-5 py-2.5 text-[13px] font-semibold text-[#161412] transition-colors hover:bg-white"
                >
                  Abrir o configurador
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {criacoes.map((c) => (
                  <li
                    key={c.id}
                    className="vidro flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium">
                        {c.nome}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#7d766a]">
                        salva em {dataCurta(c.criado_em)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[12px]">
                      <Link
                        href={`/configurador?c=${encodeURIComponent(c.codigo)}`}
                        className="rounded-full bg-[#F2EDE4] px-4 py-1.5 font-semibold text-[#161412] transition-colors hover:bg-white"
                      >
                        abrir
                      </Link>
                      <button
                        onClick={() => excluir(c)}
                        disabled={excluindo === c.id}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[#A69D8D] transition-colors hover:border-[#E06A55]/40 hover:text-[#E8A093] disabled:opacity-40"
                      >
                        {excluindo === c.id ? "excluindo…" : "excluir"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-8 text-center text-[11px] text-[#7d766a]">
              <Link
                href="/configurador"
                className="text-[#A69D8D] underline-offset-2 hover:text-[#E7E0D2] hover:underline"
              >
                ← voltar ao configurador
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
