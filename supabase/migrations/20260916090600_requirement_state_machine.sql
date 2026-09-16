-- Requirement workflow state machine hardening.
-- One authoritative transition model is shared by direct Data API updates and RPCs:
-- client: pending -> submitted (requires own evidence)
-- manager: pending/submitted -> cancelled OR submitted -> approved
-- approved/cancelled are terminal.

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

  if old.status in ('approved', 'cancelled') then
    raise exception 'resolved requirement is immutable';
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
    if new.status = 'approved' then
      if old.status <> 'submitted' then
        raise exception 'manager may approve only a submitted requirement';
      end if;
      new.submitted_document_id := old.submitted_document_id;
      new.submission_notes := old.submission_notes;
      new.submitted_at := old.submitted_at;
      new.resolved_at := now();
      return new;
    end if;

    if new.status = 'cancelled' then
      if old.status not in ('pending', 'submitted') then
        raise exception 'manager may cancel only an open requirement';
      end if;
      new.submitted_document_id := old.submitted_document_id;
      new.submission_notes := old.submission_notes;
      new.submitted_at := old.submitted_at;
      new.resolved_at := now();
      return new;
    end if;

    raise exception 'manager transition not allowed';
  end if;

  raise exception 'not allowed';
end;
$$;

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
  if resolution not in ('approved','cancelled') then raise exception 'invalid resolution'; end if;

  select * into req
  from public.manager_requirements
  where id = requirement_id
  for update;

  if not found then raise exception 'requirement not found'; end if;
  if req.manager_user_id <> auth.uid() or not private.labora_is_org_manager(req.organization_id) then
    raise exception 'not allowed';
  end if;

  update public.manager_requirements
  set status = resolution::public.labora_requirement_status
  where id = requirement_id;
end;
$$;

revoke execute on function public.labora_review_requirement(uuid, text) from public, anon;
grant execute on function public.labora_review_requirement(uuid, text) to authenticated;

comment on function public.labora_review_requirement(uuid, text) is
  'Manager-only requirement resolution: submitted->approved or open->cancelled. Resolved requirements are terminal.';
