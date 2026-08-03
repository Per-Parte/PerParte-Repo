-- 0001 · Criações salvas — embrião do marketplace (Frente B, 03/08/2026).
--
-- Uma criação é o estado inteiro do configurador, no MESMO formato do link
-- compartilhável (?c=...): o campo `codigo` guarda essa string. Abrir uma
-- criação salva = /configurador?c=<codigo>. Quando o marketplace chegar,
-- campos estruturados (params jsonb, publicada, thumbnail) entram em
-- migrações seguintes — o codigo continua sendo a fonte da verdade.

create table if not exists public.criacoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  codigo text not null check (char_length(codigo) <= 4000),
  criado_em timestamptz not null default now()
);

comment on table public.criacoes is
  'Criações salvas do configurador; codigo = estado no formato do link (?c=).';

-- Segurança: RLS ligado, dono só enxerga e mexe no que é dele.
alter table public.criacoes enable row level security;

create policy "dono le as proprias criacoes"
  on public.criacoes for select
  using ((select auth.uid()) = dono);

create policy "dono insere criacoes para si"
  on public.criacoes for insert
  with check ((select auth.uid()) = dono);

create policy "dono atualiza as proprias criacoes"
  on public.criacoes for update
  using ((select auth.uid()) = dono)
  with check ((select auth.uid()) = dono);

create policy "dono exclui as proprias criacoes"
  on public.criacoes for delete
  using ((select auth.uid()) = dono);

create index if not exists criacoes_dono_idx
  on public.criacoes (dono, criado_em desc);
