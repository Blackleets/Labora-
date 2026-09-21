-- Serialize delete and stale upsert transactions for the same owner record.

create or replace function private.lock_operational_entity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  entity_id text;
  entity_user_id uuid;
begin
  if tg_op = 'DELETE' then
    entity_id := old.id;
    entity_user_id := old.user_id;
  else
    entity_id := new.id;
    entity_user_id := new.user_id;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(tg_argv[0] || ':' || entity_user_id::text || ':' || entity_id, 0)
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists expenses_lock_delete_tombstone on public.expenses;
create trigger expenses_lock_delete_tombstone before delete on public.expenses
for each row execute function private.lock_operational_entity('expenses');
drop trigger if exists incomes_lock_delete_tombstone on public.incomes;
create trigger incomes_lock_delete_tombstone before delete on public.incomes
for each row execute function private.lock_operational_entity('incomes');
drop trigger if exists documents_lock_delete_tombstone on public.documents;
create trigger documents_lock_delete_tombstone before delete on public.documents
for each row execute function private.lock_operational_entity('documents');

drop trigger if exists expenses_lock_write_tombstone on public.expenses;
create trigger expenses_lock_write_tombstone before insert or update of id, user_id on public.expenses
for each row execute function private.lock_operational_entity('expenses');
drop trigger if exists incomes_lock_write_tombstone on public.incomes;
create trigger incomes_lock_write_tombstone before insert or update of id, user_id on public.incomes
for each row execute function private.lock_operational_entity('incomes');
drop trigger if exists documents_lock_write_tombstone on public.documents;
create trigger documents_lock_write_tombstone before insert or update of id, user_id on public.documents
for each row execute function private.lock_operational_entity('documents');

revoke all on function private.lock_operational_entity() from public, anon;
