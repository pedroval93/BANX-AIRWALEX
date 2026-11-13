-- 1. Una misma tarjeta la pueden ver varios clientes.
-- 2. Permiso para ver los datos completos de la tarjeta.
-- Pegar completo en Supabase → SQL Editor → Run. Se puede correr más de una vez.

-- Antes: una tarjeta tenía un solo cliente.
alter table public.card_assignments
  drop constraint if exists card_assignments_airwallex_card_id_key;

-- Ahora: cada cliente aparece una sola vez por tarjeta.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'card_assignments_user_card_key'
  ) then
    alter table public.card_assignments
      add constraint card_assignments_user_card_key unique (user_id, airwallex_card_id);
  end if;
end;
$$;

create index if not exists card_assignments_card_id_idx
  on public.card_assignments (airwallex_card_id);

-- Permiso nuevo por cliente: ver número completo, vencimiento y CVV.
-- Apagado, el cliente solo ve la terminación (aunque vea saldo y movimientos).
-- Los clientes que ya existen lo conservan prendido, como hasta ahora.
alter table public.profiles
  add column if not exists show_card_details boolean not null default true;
