/**
 * Cliente Supabase do SERVIDOR — route handlers e componentes de servidor.
 * A sessão vive em cookies; o proxy (src/proxy.ts) a mantém renovada.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return null;

  const armazemCookies = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return armazemCookies.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            armazemCookies.set(name, value, options)
          );
        } catch {
          // Chamado de um Server Component: o proxy cuida da renovação.
        }
      },
    },
  });
}
