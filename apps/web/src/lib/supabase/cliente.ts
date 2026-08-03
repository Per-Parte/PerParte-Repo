/**
 * Cliente Supabase do NAVEGADOR — componentes "use client".
 * A chave publishable é pública por design; a segurança real é o RLS
 * (Row Level Security) das tabelas, nunca a chave.
 *
 * Devolve null quando o ambiente não tem Supabase configurado (clone sem
 * .env.local, deploy sem variáveis) — quem chama esconde ou desabilita o
 * recurso em vez de derrubar a página.
 */

import { createBrowserClient } from "@supabase/ssr";

export function criarClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return null;
  return createBrowserClient(url, chave);
}
