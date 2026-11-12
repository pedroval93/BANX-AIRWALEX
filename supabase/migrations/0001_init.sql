-- Esquema inicial. Pegar completo en Supabase → SQL Editor → Run.
-- Se puede correr más de una vez sin romper nada.

-- Un perfil por cada usuario de Supabase Auth (cliente o admin).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  -- El admin decide por cliente si ve gasto y movimientos.
  show_transactions boolean not null default true,
  created_at timestamptz not null default now()
);

-- Qué tarjeta de Airwallex tiene asignada cada cliente.
-- Una tarjeta pertenece a un solo cliente.
create table if not exists public.card_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  airwallex_card_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists card_assignments_user_id_idx
  on public.card_assignments (user_id);

-- Crear el perfil automáticamente cuando se invita/crea un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seguridad: cada cliente solo puede leer lo suyo.
-- Las escrituras las hace únicamente el servidor con la clave secreta.
alter table public.profiles enable row level security;
alter table public.card_assignments enable row level security;

drop policy if exists "profiles: leer el propio" on public.profiles;
create policy "profiles: leer el propio"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "card_assignments: leer las propias" on public.card_assignments;
create policy "card_assignments: leer las propias"
  on public.card_assignments for select
  to authenticated
  using ((select auth.uid()) = user_id);
