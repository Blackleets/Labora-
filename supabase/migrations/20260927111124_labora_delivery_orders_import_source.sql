-- Pedidos importados desde un CSV del propio rider: origen + huella para no importar dos veces la misma fila.
alter table public.delivery_orders
  add column if not exists source text not null default 'manual',
  add column if not exists import_ref text;
alter table public.delivery_orders drop constraint if exists delivery_orders_source;
alter table public.delivery_orders add constraint delivery_orders_source check (source in ('manual', 'import'));
alter table public.delivery_orders drop constraint if exists delivery_orders_import_ref_shape;
alter table public.delivery_orders add constraint delivery_orders_import_ref_shape
  check ((source = 'import' and import_ref ~ '^[0-9a-f]{64}$') or (source = 'manual' and import_ref is null));
create unique index if not exists delivery_orders_user_import_ref_key on public.delivery_orders (user_id, import_ref);
