-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-27 (version 20260927095323).
-- Labora+ · Registro de pedidos (módulo opcional, solo propietario).
-- Datos introducidos a mano por el autónomo. Sin API de plataformas, sin lectura
-- de notificaciones, sin automatizar cuentas de Uber/Glovo/Just Eat.
-- Privacidad: owner-only RLS. La gestoría NO tiene acceso (ni select).
-- La preferencia del módulo vive en una tabla propia owner-only (no en profiles,
-- porque profiles es legible por la gestoría vinculada).

create table if not exists public.user_module_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  orders_enabled boolean not null default false,
  orders_daily_goal numeric(10,2),
  updated_at timestamptz not null default now(),
  constraint user_module_settings_goal_range
    check (orders_daily_goal is null or (orders_daily_goal > 0 and orders_daily_goal <= 100000))
);

create table if not exists public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  platform text not null,
  occurred_at timestamptz not null default now(),
  status text not null,
  amount numeric(10,2),
  km numeric(8,2),
  reject_reason text,
  note text,
  converted_income_id text,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_orders_platform_len check (char_length(btrim(platform)) between 1 and 60),
  constraint delivery_orders_status check (status in ('accepted', 'rejected')),
  constraint delivery_orders_amount_range check (amount is null or (amount >= 0 and amount <= 10000)),
  constraint delivery_orders_km_range check (km is null or (km >= 0 and km <= 1000)),
  constraint delivery_orders_reason check (reject_reason is null or reject_reason in ('too_far', 'low_pay', 'zone', 'other')),
  constraint delivery_orders_note_len check (note is null or char_length(note) <= 500),
  constraint delivery_orders_accepted_amount check (status <> 'accepted' or amount is not null),
  constraint delivery_orders_reason_only_rejected check (status = 'rejected' or reject_reason is null),
  constraint delivery_orders_conversion_only_accepted check (status = 'accepted' or (converted_income_id is null and converted_at is null)),
  constraint delivery_orders_converted_ref_len check (converted_income_id is null or char_length(converted_income_id) <= 120)
);

create index if not exists delivery_orders_user_occurred_idx
  on public.delivery_orders (user_id, occurred_at desc);

create or replace function private.labora_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists delivery_orders_touch_updated_at on public.delivery_orders;
create trigger delivery_orders_touch_updated_at
before update on public.delivery_orders
for each row execute function private.labora_touch_updated_at();

drop trigger if exists user_module_settings_touch_updated_at on public.user_module_settings;
create trigger user_module_settings_touch_updated_at
before update on public.user_module_settings
for each row execute function private.labora_touch_updated_at();

alter table public.delivery_orders enable row level security;
alter table public.user_module_settings enable row level security;

-- Owner-only policies (select / insert / update / delete). No manager policy by design.
drop policy if exists delivery_orders_select_self on public.delivery_orders;
create policy delivery_orders_select_self on public.delivery_orders
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists delivery_orders_insert_self on public.delivery_orders;
create policy delivery_orders_insert_self on public.delivery_orders
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists delivery_orders_update_self on public.delivery_orders;
create policy delivery_orders_update_self on public.delivery_orders
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists delivery_orders_delete_self on public.delivery_orders;
create policy delivery_orders_delete_self on public.delivery_orders
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists user_module_settings_select_self on public.user_module_settings;
create policy user_module_settings_select_self on public.user_module_settings
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists user_module_settings_insert_self on public.user_module_settings;
create policy user_module_settings_insert_self on public.user_module_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists user_module_settings_update_self on public.user_module_settings;
create policy user_module_settings_update_self on public.user_module_settings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists user_module_settings_delete_self on public.user_module_settings;
create policy user_module_settings_delete_self on public.user_module_settings
  for delete to authenticated using (user_id = (select auth.uid()));

-- Grants: no anon; authenticated gets only DML (RLS still applies).
revoke all privileges on table public.delivery_orders from anon, authenticated;
revoke all privileges on table public.user_module_settings from anon, authenticated;
grant select, insert, update, delete on table public.delivery_orders to authenticated;
grant select, insert, update, delete on table public.user_module_settings to authenticated;
