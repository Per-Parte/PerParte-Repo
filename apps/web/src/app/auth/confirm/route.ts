/**
 * Destino do link de confirmação de e-mail do Supabase.
 * Troca o token do link por uma sessão e segue para ?next= (interno).
 */

import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const bruto = searchParams.get("next");
  const destino = bruto && bruto.startsWith("/") ? bruto : "/minhas-criacoes";

  if (tokenHash && tipo) {
    const supabase = await criarClienteServidor();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type: tipo,
        token_hash: tokenHash,
      });
      if (!error) redirect(destino);
    }
  }

  redirect("/entrar?erro=confirmacao");
}
