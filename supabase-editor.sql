-- Estrutura multi-cliente do Portfólio UGC.
-- Cada conta autenticada possui um conteúdo e suas próprias mídias.

create table if not exists public.conteudo_site (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.conteudo_site
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.midias
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- Preserva o portfólio existente, atribuindo-o à primeira conta criada.
update public.conteudo_site
set owner_id = (select id from auth.users order by created_at asc limit 1)
where id = 'principal' and owner_id is null;

update public.midias
set owner_id = (select id from auth.users order by created_at asc limit 1)
where owner_id is null;

create unique index if not exists conteudo_site_owner_unico
  on public.conteudo_site(owner_id);

create index if not exists midias_owner_ordem
  on public.midias(owner_id, ordem);

alter table public.conteudo_site enable row level security;
alter table public.midias enable row level security;

do $$
declare politica record;
begin
  for politica in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('conteudo_site', 'midias')
  loop
    execute format('drop policy if exists %I on %I.%I',
      politica.policyname, politica.schemaname, politica.tablename);
  end loop;
end $$;

create policy "Portfólios podem ser vistos publicamente"
on public.conteudo_site for select to anon, authenticated using (true);

create policy "Cliente cria apenas o próprio portfólio"
on public.conteudo_site for insert to authenticated
with check (owner_id = auth.uid());

create policy "Cliente edita apenas o próprio portfólio"
on public.conteudo_site for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Cliente exclui apenas o próprio portfólio"
on public.conteudo_site for delete to authenticated
using (owner_id = auth.uid());

create policy "Mídias podem ser vistas publicamente"
on public.midias for select to anon, authenticated using (true);

create policy "Cliente cria apenas as próprias mídias"
on public.midias for insert to authenticated
with check (owner_id = auth.uid());

create policy "Cliente edita apenas as próprias mídias"
on public.midias for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Cliente exclui apenas as próprias mídias"
on public.midias for delete to authenticated
using (owner_id = auth.uid());
