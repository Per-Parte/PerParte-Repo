"use client";

import { useMemo, useRef, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

type Fase = "fechado" | "nomeando" | "salvando" | "salvo" | "erro";

/**
 * Salva a criação atual na conta do usuário. O estado do configurador já
 * vive na URL (?c=..., espelhado com debounce) — o botão lê dali, então não
 * precisa de nenhum fio com o estado interno do Configurador.
 */
export default function BotaoSalvar() {
  const supabase = useMemo(() => criarClienteNavegador(), []);
  const [fase, setFase] = useState<Fase>("fechado");
  const [nome, setNome] = useState("Minha luminária");
  const inputRef = useRef<HTMLInputElement>(null);

  async function abrir() {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const voltar = window.location.pathname + window.location.search;
      window.location.assign(`/entrar?voltar=${encodeURIComponent(voltar)}`);
      return;
    }
    setFase("nomeando");
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function salvar() {
    const codigo = new URLSearchParams(window.location.search).get("c");
    if (!codigo || !supabase) {
      setFase("erro");
      return;
    }
    setFase("salvando");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFase("erro");
      return;
    }
    const { error } = await supabase.from("criacoes").insert({
      dono: user.id,
      nome: nome.trim() || "Minha luminária",
      codigo,
    });
    setFase(error ? "erro" : "salvo");
    if (!error) setTimeout(() => setFase("fechado"), 5000);
  }

  // Ambiente sem Supabase (clone sem .env.local): o recurso some, sem quebrar.
  if (!supabase) return null;

  if (fase === "nomeando" || fase === "salvando") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={nome}
          maxLength={80}
          disabled={fase === "salvando"}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") salvar();
            if (e.key === "Escape") setFase("fechado");
          }}
          className="w-[130px] rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[#E7E0D2] outline-none placeholder:text-[#7d766a] focus:border-white/40"
          placeholder="nome da criação"
        />
        <button
          onClick={salvar}
          disabled={fase === "salvando"}
          className="rounded-full bg-[#F2EDE4] px-2.5 py-1 font-semibold text-[#161412] transition-colors hover:bg-white disabled:opacity-40"
        >
          {fase === "salvando" ? "salvando…" : "ok"}
        </button>
        <button
          onClick={() => setFase("fechado")}
          disabled={fase === "salvando"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[#A69D8D] transition-colors hover:border-white/25 hover:text-[#E7E0D2] disabled:opacity-40"
        >
          ✕
        </button>
      </span>
    );
  }

  if (fase === "salvo") {
    return (
      <a
        href="/minhas-criacoes"
        className="rounded-full border border-[#8FB07E]/40 bg-white/[0.04] px-2.5 py-1 text-[#8FB07E] transition-colors hover:border-[#8FB07E]/70"
      >
        salva ✓ · minhas criações
      </a>
    );
  }

  return (
    <button
      onClick={abrir}
      className={`rounded-full border px-2.5 py-1 transition-colors ${
        fase === "erro"
          ? "border-[#E06A55]/40 text-[#E8A093] hover:border-[#E06A55]/70"
          : "border-white/10 bg-white/[0.04] text-[#A69D8D] hover:border-white/25 hover:text-[#E7E0D2]"
      }`}
    >
      {fase === "erro" ? "erro — tentar de novo" : "salvar"}
    </button>
  );
}
