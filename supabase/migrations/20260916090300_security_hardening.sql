-- Labora+ security hardening.
-- Apply after the base schema and the 20260916 feature migrations.
-- Goals:
-- 1) internal SECURITY DEFINER helpers live outside the exposed API schema;
-- 2) PUBLIC/anon/authenticated do not inherit blanket EXECUTE on functions;
-- 3) only the intentional authenticated RPC surface is re-granted;
-- 4) requirement status transitions remain safe even if a client performs a
--    direct UPDATE instead of calling the dedicated RPC.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Prevent future objects in public from becoming reachable just because they
-- were created by postgres. Explicit grants below remain authoritative.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- Move authorization helpers and trigger-only helpers out of the Data API
-- schema. Existing policies/triggers keep their dependency on the same object
-- OID when a function changes schema.
alter function public.labora_is_org_member(uuid) set schema private;
alter function public.labora_is_org_manager(uuid) set schema private;
alter function public.labora_can_access_client(uuid, uuid) set schema private;
alter function public.labora_are_linked(uuid, uuid, uuid) set schema private;
alter function public.labora_storage_path_authorized(text) set schema private;
alter function public.labora_set_updated_at() set schema private;
alter function public.labora_handle_new_user() set schema private;
alter function public.labora_audit_row() set schema private;
alter function public.labora_apply_profile_currency() set schema private;

-- The moved storage helper called another helper by its old qualified name.
create or replace function private.labora_storage_path_authorized(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  org_text text;
  user_text text;
begin
  org_text := split_part(object_name, '/', 1);
  user_text := split_part(object_name, '/', 2);
  if org_text !~ '^[0-9a-fA-F-]{36}$' or user_text !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;
  return private.labora_can_access_client(org_text::uuid, user_text::uuid);
exception when others then
  return false;
end;
$$;

-- These two intentional public RPCs call moved authorization helpers.
create or replace function public.labora_review_requirement(requirement_id uuid, resolution text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.manager_requirements%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if resolution not in ('approved','cancelled','pending') then raise exception 'invalid resolution'; end if;

  select * into req
  from public.manager_requirements
  where id = requirement_id
  for update;

  if not found then raise exception 'requirement not found'; end if;
  if req.manager_user_id <> auth.uid() or not private.labora_is_org_manager(req.organization_id) then
    raise exception 'not allowed';
  end if;

  update public.manager_requirements
  set status = resolution::public.labora_requirement_status,
      resolved_at = case when resolution in ('approved','cancelled') then now() else null end
  where id = requirement_id;
end;
$$;

create or replace function public.labora_verify_filing_evidence(evidence_id uuid, decision text, notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  evidence public.filing_evidence%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if decision not in ('verified','rejected') then raise exception 'invalid decision'; end if;

  select * into evidence
  from public.filing_evidence
  where id = evidence_id
  for update;

  if not found then raise exception 'evidence not found'; end if;
  if not private.labora_is_org_manager(evidence.organization_id) then raise exception 'not allowed'; end if;
  if not private.labora_can_access_client(evidence.organization_id, evidence.user_id) then raise exception 'not linked to client'; end if;

  update public.filing_evidence
  set verification_status = decision::public.labora_filing_verification_status,
      verified_by = auth.uid(),
      verified_at = now(),
      verification_notes = nullif(trim(coalesce(notes, '')), '')
  where id = evidence_id;
end;
$$;

-- Requirement updates are guarded server-side. This protects the workflow even
-- if an older client performs a direct table UPDATE instead of the RPC.
create or replace function private.labora_guard_requirement_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  if new.organization_id is distinct from old.organization_id
     or new.manager_user_id is distinct from old.manager_user_id
     or new.client_user_id is distinct from old.client_user_id
     or new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.category is distinct from old.category
     or new.deadline is distinct from old.deadline
     or new.tax_period_label is distinct from old.tax_period_label
     or new.created_at is distinct from old.created_at then
    raise exception 'requirement source fields are immutable';
  end if;

  if auth.uid() = old.client_user_id then
    if old.status <> 'pending' or new.status <> 'submitted' then
      raise exception 'client may only submit a pending requirement';
    end if;
    if new.submitted_document_id is null then
      raise exception 'submitted requirement requires evidence';
    end if;
    if not exists (
      select 1
      from public.documents d
      where d.id = new.submitted_document_id
        and d.organization_id = old.organization_id
        and d.user_id = old.client_user_id
        and d.uploaded_by = old.client_user_id
    ) then
      raise exception 'submission evidence does not belong to client workspace';
    end if;
    new.submitted_at := now();
    new.resolved_at := null;
    return new;
  end if;

  if auth.uid() = old.manager_user_id then
    if old.status <> 'submitted' or new.status <> 'approved' then
      raise exception 'manager may only approve a submitted requirement';
    end if;
    -- Preserve the client's submission details. An older UI may include a
    -- manager note in submission_notes; it must never overwrite client evidence.
    new.submitted_document_id := old.submitted_document_id;
    new.submission_notes := old.submission_notes;
    new.submitted_at := old.submitted_at;
    new.resolved_at := now();
    return new;
  end if;

  raise exception 'not allowed';
end;
$$;

drop trigger if exists manager_requirements_transition_guard on public.manager_requirements;
create trigger manager_requirements_transition_guard
before update on public.manager_requirements
for each row execute function private.labora_guard_requirement_update();

create policy requirements_update_participant
  on public.manager_requirements
  for update
  to authenticated
  using (manager_user_id = auth.uid() or client_user_id = auth.uid())
  with check (manager_user_id = auth.uid() or client_user_id = auth.uid());

grant update (status, submitted_document_id, submission_notes, submitted_at, resolved_at)
  on public.manager_requirements to authenticated;

-- Strip implicit function execution. Internal helpers are callable only while
-- evaluating authenticated RLS/storage policies; trigger-only helpers receive no
-- authenticated grant at all.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function private.labora_is_org_member(uuid) to authenticated;
grant execute on function private.labora_is_org_manager(uuid) to authenticated;
grant execute on function private.labora_can_access_client(uuid, uuid) to authenticated;
grant execute on function private.labora_are_linked(uuid, uuid, uuid) to authenticated;
grant execute on function private.labora_storage_path_authorized(text) to authenticated;

-- Intentional authenticated RPC surface. Each function validates auth.uid() and
-- constrains the operation to the caller's own workspace/link.
grant execute on function public.labora_bootstrap_account(text, text) to authenticated;
grant execute on function public.labora_create_manager_invite() to authenticated;
grant execute on function public.labora_accept_manager_invite(text) to authenticated;
grant execute on function public.labora_revoke_manager_link(uuid) to authenticated;
grant execute on function public.labora_submit_requirement(uuid, uuid, text) to authenticated;
grant execute on function public.labora_review_requirement(uuid, text) to authenticated;
grant execute on function public.labora_mark_message_read(uuid) to authenticated;
grant execute on function public.labora_verify_filing_evidence(uuid, text, text) to authenticated;

comment on schema private is
  'Labora+ internal authorization and trigger helpers. Not exposed through the Data API.';
