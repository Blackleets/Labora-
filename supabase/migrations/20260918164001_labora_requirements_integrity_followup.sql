-- Applied to Supabase project gggtriyvbusbpqohoukv as live migration
-- 20260918134147_labora_requirements_integrity_followup on 2026-09-18.
-- Repo ordering follows the preceding 20260918164000 requirements migration.
-- Tightens Priority 1 state transitions and adds defense-in-depth integrity checks.

alter table public.requirements
  add column if not exists review_note text;

drop policy if exists requirements_select_participants on public.requirements;
create policy requirements_select_participants
on public.requirements
for select
to authenticated
using (
  manager_id = (select auth.uid())
  or rider_id = (select auth.uid())
);

revoke all privileges on table public.requirements from anon;
revoke insert, update, delete, truncate, references, trigger on table public.requirements from authenticated;
grant select on table public.requirements to authenticated;

create or replace function private.enforce_requirement_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.manager_id is distinct from actor then
      raise exception 'Only the authenticated manager can create a requirement';
    end if;
    if not private.is_manager_of(new.rider_id) then
      raise exception 'Rider is not linked to this manager';
    end if;

    new.status := 'pending';
    new.submission_notes := null;
    new.submission_url := null;
    new.submitted_by := null;
    new.submitted_at := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.manager_id is distinct from old.manager_id
     or new.rider_id is distinct from old.rider_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Requirement identity fields are immutable';
  end if;

  if actor = old.rider_id then
    if old.status <> 'pending' or new.status <> 'submitted' then
      raise exception 'Rider may only submit a pending requirement';
    end if;

    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.category is distinct from old.category
       or new.deadline is distinct from old.deadline
       or new.quarter is distinct from old.quarter then
      raise exception 'Rider cannot change requirement definition';
    end if;

    if new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.review_note is distinct from old.review_note then
      raise exception 'Rider cannot change requirement review metadata';
    end if;

    new.submitted_by := actor;
    new.submitted_at := now();
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    return new;
  end if;

  if actor = old.manager_id and private.is_manager_of(old.rider_id) then
    if old.status = 'pending' and new.status = 'pending' then
      if new.submission_notes is distinct from old.submission_notes
         or new.submission_url is distinct from old.submission_url
         or new.submitted_by is distinct from old.submitted_by
         or new.submitted_at is distinct from old.submitted_at
         or new.reviewed_by is distinct from old.reviewed_by
         or new.reviewed_at is distinct from old.reviewed_at
         or new.review_note is distinct from old.review_note then
        raise exception 'Manager cannot author rider response or review metadata while pending';
      end if;
      return new;
    end if;

    if old.status = 'submitted' and new.status = 'approved' then
      if new.title is distinct from old.title
         or new.description is distinct from old.description
         or new.category is distinct from old.category
         or new.deadline is distinct from old.deadline
         or new.quarter is distinct from old.quarter
         or new.submission_notes is distinct from old.submission_notes
         or new.submission_url is distinct from old.submission_url
         or new.submitted_by is distinct from old.submitted_by
         or new.submitted_at is distinct from old.submitted_at then
        raise exception 'Manager review cannot rewrite definition or rider response';
      end if;

      new.reviewed_by := actor;
      new.reviewed_at := now();
      return new;
    end if;

    raise exception 'Unsupported manager requirement transition';
  end if;

  raise exception 'Not authorized to mutate this requirement';
end;
$$;

drop trigger if exists requirements_integrity_guard on public.requirements;
create trigger requirements_integrity_guard
before insert or update on public.requirements
for each row
execute function private.enforce_requirement_integrity();

create or replace function private.create_requirement_internal(
  p_id text,
  p_rider_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_deadline date,
  p_quarter text default null
)
returns public.requirements
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_requirement public.requirements;
  created_requirement public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_id is null or btrim(p_id) = '' then raise exception 'Requirement id is required'; end if;
  if p_title is null or btrim(p_title) = '' then raise exception 'Requirement title is required'; end if;
  if p_deadline is null then raise exception 'Requirement deadline is required'; end if;
  if p_category not in ('fuel_receipt','platform_invoice','social_security','vat_correction','other') then
    raise exception 'Unsupported requirement category';
  end if;
  if not private.is_manager_of(p_rider_id) then raise exception 'Not authorized for this rider'; end if;

  select * into existing_requirement
  from public.requirements
  where id = p_id;

  if found then
    if existing_requirement.manager_id <> auth.uid()
       or existing_requirement.rider_id <> p_rider_id then
      raise exception 'Requirement id already exists';
    end if;
    return existing_requirement;
  end if;

  insert into public.requirements (
    id, manager_id, rider_id, title, description, category, deadline,
    status, submission_notes, submission_url, quarter,
    submitted_by, submitted_at, reviewed_by, reviewed_at, review_note, updated_at
  ) values (
    p_id, auth.uid(), p_rider_id, btrim(p_title), coalesce(p_description, ''),
    p_category, p_deadline,
    'pending', null, null, nullif(btrim(coalesce(p_quarter, '')), ''),
    null, null, null, null, null, now()
  )
  returning * into created_requirement;

  return created_requirement;
end;
$$;

create or replace function private.update_requirement_definition_internal(
  p_requirement_id text,
  p_title text,
  p_description text,
  p_category text,
  p_deadline date,
  p_quarter text default null
)
returns public.requirements
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_title is null or btrim(p_title) = '' then raise exception 'Requirement title is required'; end if;
  if p_deadline is null then raise exception 'Requirement deadline is required'; end if;
  if p_category not in ('fuel_receipt','platform_invoice','social_security','vat_correction','other') then
    raise exception 'Unsupported requirement category';
  end if;

  select * into target
  from public.requirements
  where id = p_requirement_id
    and manager_id = auth.uid()
  for update;

  if not found then raise exception 'Requirement not found'; end if;
  if not private.is_manager_of(target.rider_id) then raise exception 'Not authorized for this rider'; end if;
  if target.status <> 'pending' then raise exception 'Only pending requirements can be edited'; end if;

  update public.requirements
  set
    title = btrim(p_title),
    description = coalesce(p_description, ''),
    category = p_category,
    deadline = p_deadline,
    quarter = nullif(btrim(coalesce(p_quarter, '')), '')
  where id = p_requirement_id
  returning * into target;

  return target;
end;
$$;

create or replace function private.submit_requirement_internal(
  p_requirement_id text,
  p_submission_notes text default null,
  p_submission_url text default null
)
returns public.requirements
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into target
  from public.requirements
  where id = p_requirement_id
    and rider_id = auth.uid()
  for update;

  if not found then raise exception 'Requirement not found'; end if;
  if target.status <> 'pending' then
    raise exception 'Only pending requirements can be submitted';
  end if;

  update public.requirements
  set
    status = 'submitted',
    submission_notes = nullif(btrim(coalesce(p_submission_notes, '')), ''),
    submission_url = nullif(btrim(coalesce(p_submission_url, '')), ''),
    submitted_by = auth.uid(),
    submitted_at = now(),
    reviewed_by = null,
    reviewed_at = null,
    review_note = null
  where id = p_requirement_id
  returning * into target;

  return target;
end;
$$;

create or replace function private.review_requirement_internal(
  p_requirement_id text,
  p_action text,
  p_note text
)
returns public.requirements
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_action <> 'approved' then raise exception 'Unsupported review action'; end if;

  select * into target
  from public.requirements
  where id = p_requirement_id
    and manager_id = auth.uid()
  for update;

  if not found then raise exception 'Requirement not found'; end if;
  if not private.is_manager_of(target.rider_id) then raise exception 'Not authorized for this rider'; end if;
  if target.status = 'approved' then return target; end if;
  if target.status <> 'submitted' then raise exception 'Only submitted requirements can be approved'; end if;

  update public.requirements
  set
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_requirement_id
  returning * into target;

  return target;
end;
$$;

create or replace function private.review_requirement_internal(
  p_requirement_id text,
  p_action text
)
returns public.requirements
language sql
security definer
set search_path = ''
as $$
  select private.review_requirement_internal(p_requirement_id, p_action, null);
$$;

revoke all on function private.create_requirement_internal(text,uuid,text,text,text,date,text) from public, anon;
revoke all on function private.update_requirement_definition_internal(text,text,text,text,date,text) from public, anon;
revoke all on function private.submit_requirement_internal(text,text,text) from public, anon;
revoke all on function private.review_requirement_internal(text,text,text) from public, anon;
revoke all on function private.review_requirement_internal(text,text) from public, anon;

grant execute on function private.create_requirement_internal(text,uuid,text,text,text,date,text) to authenticated;
grant execute on function private.update_requirement_definition_internal(text,text,text,text,date,text) to authenticated;
grant execute on function private.submit_requirement_internal(text,text,text) to authenticated;
grant execute on function private.review_requirement_internal(text,text,text) to authenticated;
grant execute on function private.review_requirement_internal(text,text) to authenticated;

create or replace function public.update_requirement_definition(
  p_requirement_id text,
  p_title text,
  p_description text,
  p_category text,
  p_deadline date,
  p_quarter text default null
)
returns public.requirements
language sql
security invoker
set search_path = ''
as $$
  select private.update_requirement_definition_internal(
    p_requirement_id, p_title, p_description, p_category, p_deadline, p_quarter
  );
$$;

create or replace function public.review_requirement(
  p_requirement_id text,
  p_action text,
  p_note text
)
returns public.requirements
language sql
security invoker
set search_path = ''
as $$
  select private.review_requirement_internal(p_requirement_id, p_action, p_note);
$$;

create or replace function public.review_requirement(
  p_requirement_id text,
  p_action text
)
returns public.requirements
language sql
security invoker
set search_path = ''
as $$
  select private.review_requirement_internal(p_requirement_id, p_action, null);
$$;

revoke all on function public.update_requirement_definition(text,text,text,text,date,text) from public, anon;
revoke all on function public.review_requirement(text,text,text) from public, anon;
revoke all on function public.review_requirement(text,text) from public, anon;

grant execute on function public.update_requirement_definition(text,text,text,text,date,text) to authenticated;
grant execute on function public.review_requirement(text,text,text) to authenticated;
grant execute on function public.review_requirement(text,text) to authenticated;
