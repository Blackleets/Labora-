-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Links imported incomes to preserved source documents while enforcing same-user ownership.

alter table public.incomes
  add column if not exists source_document_id text,
  add column if not exists source_hash text;

alter table public.incomes
  drop constraint if exists incomes_source_document_id_fkey;

alter table public.incomes
  add constraint incomes_source_document_id_fkey
  foreign key (source_document_id)
  references public.documents(id)
  on delete set null;

create index if not exists incomes_source_document_idx
  on public.incomes(source_document_id)
  where source_document_id is not null;

create unique index if not exists documents_user_content_hash_unique
  on public.documents(user_id, content_hash)
  where content_hash is not null;

create or replace function private.enforce_income_document_owner()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.source_document_id is not null then
    if not exists (
      select 1
      from public.documents d
      where d.id = new.source_document_id
        and d.user_id = new.user_id
    ) then
      raise exception 'Income source document must belong to the same user';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_income_document_owner() from public;
grant execute on function private.enforce_income_document_owner() to authenticated;

drop trigger if exists incomes_enforce_source_document_owner on public.incomes;
create trigger incomes_enforce_source_document_owner
before insert or update of source_document_id, user_id
on public.incomes
for each row
execute function private.enforce_income_document_owner();
