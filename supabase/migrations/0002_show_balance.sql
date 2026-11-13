-- Permiso aparte para que el cliente vea su saldo (gasto del mes y disponible).
-- show_transactions sigue siendo el permiso de ver la lista de movimientos.
-- Pégalo y córrelo en Supabase → SQL Editor.

alter table public.profiles
  add column if not exists show_balance boolean;

-- Quien ya veía sus movimientos sigue viendo su saldo.
update public.profiles set show_balance = show_transactions where show_balance is null;

alter table public.profiles
  alter column show_balance set default true,
  alter column show_balance set not null;
