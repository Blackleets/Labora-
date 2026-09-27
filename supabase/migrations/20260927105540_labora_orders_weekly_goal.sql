-- Objetivo semanal del módulo «Registro de pedidos» (owner-only por la RLS existente de user_module_settings).
alter table public.user_module_settings
  add column if not exists orders_weekly_goal numeric(10,2);
alter table public.user_module_settings
  drop constraint if exists user_module_settings_weekly_goal_range;
alter table public.user_module_settings
  add constraint user_module_settings_weekly_goal_range
    check (orders_weekly_goal is null or (orders_weekly_goal > 0 and orders_weekly_goal <= 1000000));
