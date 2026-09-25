-- Persist owner deletion intent so stale tabs/devices cannot resurrect a row
-- with an old upsert after the source row has been removed.

create table if not exists public.operational_deletion_tombstones (
  entity_type text not null check (entity_type in ('expenses', 'incomes', 'documents')),
  entity_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  deleted_at timestamptz not null default now(),
  primary key (entity_type, entity_id, user_id)
);

alter table public.operational_deletion_tombstones enable row level security;

create or replace function private.record_operational_deletion_tombstone()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.operational_deletion_tombstones (entity_type, entity_id, user_id)
  values (tg_argv[0], old.id, old.user_id)
  on conflict (entity_type, entity_id, user_id)
  do update set deleted_at = excluded.deleted_at;
  return old;
end;
$$;

create or replace function private.reject_tombstoned_operational_write()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if exists (
    select 1
    from public.operational_deletion_tombstones t
    where t.entity_type = tg_argv[0]
      and t.entity_id = new.id
      and t.user_id = new.user_id
  ) then
    raise exception 'Deleted operational records cannot be recreated';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_record_delete_tombstone on public.expenses;
create trigger expenses_record_delete_tombstone
after delete on public.expenses
for each row execute function private.record_operational_deletion_tombstone('expenses');

drop trigger if exists incomes_record_delete_tombstone on public.incomes;
create trigger incomes_record_delete_tombstone
after delete on public.incomes
for each row execute function private.record_operational_deletion_tombstone('incomes');

drop trigger if exists documents_record_delete_tombstone on public.documents;
create trigger documents_record_delete_tombstone
after delete on public.documents
for each row execute function private.record_operational_deletion_tombstone('documents');

drop trigger if exists expenses_reject_tombstoned_write on public.expenses;
create trigger expenses_reject_tombstoned_write
before insert or update of id, user_id on public.expenses
for each row execute function private.reject_tombstoned_operational_write('expenses');

drop trigger if exists incomes_reject_tombstoned_write on public.incomes;
create trigger incomes_reject_tombstoned_write
before insert or update of id, user_id on public.incomes
for each row execute function private.reject_tombstoned_operational_write('incomes');

drop trigger if exists documents_reject_tombstoned_write on public.documents;
create trigger documents_reject_tombstoned_write
before insert or update of id, user_id on public.documents
for each row execute function private.reject_tombstoned_operational_write('documents');

revoke all on function private.record_operational_deletion_tombstone() from public, anon;
revoke all on function private.reject_tombstoned_operational_write() from public, anon;
