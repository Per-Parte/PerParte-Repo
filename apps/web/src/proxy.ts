/**
 * Proxy (o antigo middleware, renomeado no Next 16): roda antes de cada
 * rota. Dois papéis: renovar a sessão do Supabase (token expirado é
 * renovado e regravado nos cookies) e proteger /minhas-criacoes.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Ambiente sem Supabase configurado: site segue funcionando sem contas.
  if (!url || !chave) return NextResponse.next({ request });

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(url, chave, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGravar) {
          cookiesParaGravar.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          resposta = NextResponse.next({ request });
          cookiesParaGravar.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante: getUser() valida no servidor do Supabase e renova a sessão.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/minhas-criacoes")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("voltar", request.nextUrl.pathname);
    const redirecionamento = NextResponse.redirect(url);
    // Preserva cookies de sessão eventualmente renovados acima.
    resposta.cookies
      .getAll()
      .forEach((c) => redirecionamento.cookies.set(c.name, c.value));
    return redirecionamento;
  }

  return resposta;
}

export const config = {
  // Tudo, menos estáticos e otimização de imagem — as APIs próprias
  // (/api/stl, /api/calibracao) também ficam de fora por ora.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
