-- The initial migration was already applied to the live project before the
-- client release. Keep its RPC idempotent and rider-only for safe retries.

create or replace function private.delete_own_document_with_linked_incomes_internal(
  p_document_id text
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor uuid := auth.uid();
  document_owner uuid;
  actor_role text;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  select role into actor_role from public.profiles where id = actor;
  if actor_role is distinct from 'rider' then
    raise exception 'Only riders may delete operational documents';
  end if;

  select d.user_id
    into document_owner
  from public.documents d
  where d.id = p_document_id
  for update;

  if document_owner is null then return; end if;
  if document_owner <> actor then
    raise exception 'Not authorized to delete this document';
  end if;

  delete from public.incomes
  where user_id = actor
    and source_document_id = p_document_id;

  delete from public.documents
  where id = p_document_id
    and user_id = actor;
end;
$$;
