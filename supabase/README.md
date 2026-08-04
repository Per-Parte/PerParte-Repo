# Supabase — banco e autenticação da Per Parte

Projeto: **Per-Parte** (organização Per Parte, plano Free), região Americas.
URL: `https://amaweqsntusydbzfmtyd.supabase.co`

## O que o site usa

- **Auth** (e-mail + senha) — login em `/entrar`, confirmação de e-mail em `/auth/confirm`.
- **Tabela `criacoes`** — criações salvas do configurador (galeria em `/minhas-criacoes`).
- Chaves: apenas a **publishable** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), que é
  pública por design. A segurança real é o **RLS** das tabelas. Chaves secretas
  (`sb_secret_*` / `service_role`) não são usadas pelo site e **nunca** entram no
  repositório nem em chat.

## Como aplicar uma migração

As migrações vivem em `supabase/migrations/`, numeradas. Para aplicar:

1. Painel do Supabase → **SQL Editor** → New query
2. Colar o conteúdo do arquivo `.sql` e **Run**
3. Conferir em **Table Editor** que a tabela apareceu com RLS ativo (cadeado)

Aplicadas até agora:

- [x] `0001_criacoes.sql` — tabela de criações salvas + políticas RLS de dono ✓ 03/08/2026

## Configuração do painel (uma vez)

- [x] **Authentication → URL Configuration**: Site URL = `https://per-parte-web.vercel.app`;
      `http://localhost:3000/**` em Redirect URLs ✓ 03/08/2026
- [x] **Vercel → Settings → Environment Variables** (Production/Preview/Development):
      `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ✓ 03/08/2026
      — atenção: mudou variável → **Redeploy sem "Use existing Build Cache"**,
      senão o valor não entra no build
- Local: copiar `apps/web/.env.example` para `apps/web/.env.local` e preencher

## Higiene de chaves

Em 03/08/2026 as chaves secretas (`service_role` JWT e `sb_secret`) foram expostas
fora do painel e devem ser **rotacionadas** (Settings → API Keys). O site não as
usa em lugar nenhum, então a rotação não quebra nada.
