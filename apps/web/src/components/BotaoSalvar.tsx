"use client";

import { useMemo, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

type Fase = "repouso" | "salvando" | "salvo" | "erro";

/**
 * Guarda a criação atual na conta do usuário. O estado do configurador já
 * vive na URL (?c=..., espelhado com debounce) — o botão lê dali; o nome da
 * obra vem do input do painel, então não há mais input próprio aqui.
 */
export default function BotaoSalvar({ nome }: { nome?: string }) {
  const supabase = useMemo(() => criarClienteNavegador(), []);
  const [fase, setFase] = useState<Fase>("repouso");

  async function guardar() {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const voltar = window.location.pathname + window.location.search;
      window.location.assign(`/entrar?voltar=${encodeURIComponent(voltar)}`);
      return;
    }
    const codigo = new URLSearchParams(window.location.search).get("c");
    if (!codigo) {
      setFase("erro");
      return;
    }
    setFase("salvando");
    const { error } = await supabase.from("criacoes").insert({
      dono: user.id,
      nome: nome?.trim() || "Minha obra",
      codigo,
    });
    setFase(error ? "erro" : "salvo");
    if (!error) setTimeout(() => setFase("repouso"), 5000);
  }

  // Ambiente sem Supabase (clone sem .env.local): o recurso some, sem quebrar.
  if (!supabase) return null;

  if (fase === "salvo") {
    return (
      <a
        href="/minhas-criacoes"
        className="rounded-full bg-white px-4 py-2 text-[12.5px] font-medium text-[#4F7A44] shadow-[0_8px_24px_-12px_rgba(30,30,30,0.35)] transition-colors hover:text-[#3C6133]"
      >
        salva ✓ · minhas criações
      </a>
    );
  }

  return (
    <button
      onClick={guardar}
      disabled={fase === "salvando"}
      className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ease-padrao disabled:opacity-60 ${
        fase === "erro"
          ? "bg-[#B23B28] text-white hover:bg-[#9C3121]"
          : "bg-palco-escuro text-luz-acesa hover:bg-acento"
      }`}
    >
      {fase === "salvando"
        ? "guardando…"
        : fase === "erro"
          ? "erro — tentar de novo"
          : "Guardar minha obra"}
    </button>
  );
}
