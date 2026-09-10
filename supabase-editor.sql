-- Execute este ficheiro uma vez no SQL Editor do projeto Supabase.
-- A tabela guarda o conteúdo textual do editor visual como um único documento.

create table if not exists public.conteudo_site (
  id text primary key default 'principal',
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.conteudo_site enable row level security;

create policy "Conteúdo público pode ser lido"
on public.conteudo_site for select
to anon, authenticated
using (true);

create policy "Utilizador autenticado pode gerir o conteúdo"
on public.conteudo_site for all
to authenticated
using (true)
with check (true);
