-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Priority 1: Requirements/Peticiones integrity.
-- Manager owns request definition; rider owns submission; manager owns review.

alter table public.requirements
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

drop policy if exists requirements_update_participants on public.requirements;
drop policy if exists requirements_insert_manager on public.requirements;
drop policy if exists requirements_delete_manager on public.requirements;

revoke insert, update, delete, truncate on table public.requirements from anon, authenticated;
revoke select on table public.requirements from anon;
grant select on table public.requirements to authenticated;

create or replace function private.create_requirement_internal(
  p_id text, p_rider_id uuid, p_title text, p_description text,
  p_category text, p_deadline date, p_quarter text default null
)
returns public.requirements
language plpgsql security definer
set search_path = public, private
as $$
declare existing_requirement public.requirements; created_requirement public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_id is null or btrim(p_id) = '' then raise exception 'Requirement id is required'; end if;
  if p_title is null or btrim(p_title) = '' then raise exception 'Requirement title is required'; end if;
  if p_deadline is null then raise exception 'Requirement deadline is required'; end if;
  if not private.is_manager_of(p_rider_id) then raise exception 'Not authorized for this rider'; end if;

  select * into existing_requirement from public.requirements where id = p_id;
  if found then
    if existing_requirement.manager_id <> auth.uid() then raise exception 'Requirement id already exists'; end if;
    return existing_requirement;
  end if;

  insert into public.requirements (
    id, manager_id, rider_id, title, description, category, deadline,
    status, submission_notes, submission_url, quarter,
    submitted_by, submitted_at, reviewed_by, reviewed_at, updated_at
  ) values (
    p_id, auth.uid(), p_rider_id, btrim(p_title), coalesce(p_description, ''),
    coalesce(nullif(btrim(p_category), ''), 'other'), p_deadline,
    'pending', null, null, nullif(btrim(coalesce(p_quarter, '')), ''),
    null, null, null, null, now()
  ) returning * into created_requirement;
  return created_requirement;
end;
$$;

create or replace function private.submit_requirement_internal(
  p_requirement_id text, p_submission_notes text default null, p_submission_url text default null
)
returns public.requirements
language plpgsql security definer
set search_path = public, private
as $$
declare target public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target from public.requirements
  where id = p_requirement_id and rider_id = auth.uid() for update;
  if not found then raise exception 'Requirement not found'; end if;
  if target.status not in ('pending', 'submitted') then
    raise exception 'Requirement cannot be submitted in its current state';
  end if;

  update public.requirements
  set status = 'submitted',
      submission_notes = nullif(btrim(coalesce(p_submission_notes, '')), ''),
      submission_url = nullif(btrim(coalesce(p_submission_url, '')), ''),
      submitted_by = auth.uid(), submitted_at = now(),
      reviewed_by = null, reviewed_at = null, updated_at = now()
  where id = p_requirement_id returning * into target;
  return target;
end;
$$;

create or replace function private.review_requirement_internal(
  p_requirement_id text, p_action text
)
returns public.requirements
language plpgsql security definer
set search_path = public, private
as $$
declare target public.requirements;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_action <> 'approved' then raise exception 'Unsupported review action'; end if;
  select * into target from public.requirements
  where id = p_requirement_id and manager_id = auth.uid() for update;
  if not found then raise exception 'Requirement not found'; end if;
  if target.status = 'approved' then return target; end if;
  if target.status <> 'submitted' then raise exception 'Only submitted requirements can be approved'; end if;

  update public.requirements
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_requirement_id returning * into target;
  return target;
end;
$$;

grant usage on schema private to authenticated;
revoke all on function private.create_requirement_internal(text,uuid,text,text,text,date,text) from public, anon;
revoke all on function private.submit_requirement_internal(text,text,text) from public, anon;
revoke all on function private.review_requirement_internal(text,text) from public, anon;
grant execute on function private.create_requirement_internal(text,uuid,text,text,text,date,text) to authenticated;
grant execute on function private.submit_requirement_internal(text,text,text) to authenticated;
grant execute on function private.review_requirement_internal(text,text) to authenticated;

create or replace function public.create_requirement(
  p_id text, p_rider_id uuid, p_title text, p_description text,
  p_category text, p_deadline date, p_quarter text default null
)
returns public.requirements language sql security invoker
set search_path = public, private
as $$ select private.create_requirement_internal(p_id,p_rider_id,p_title,p_description,p_category,p_deadline,p_quarter); $$;

create or replace function public.submit_requirement(
  p_requirement_id text, p_submission_notes text default null, p_submission_url text default null
)
returns public.requirements language sql security invoker
set search_path = public, private
as $$ select private.submit_requirement_internal(p_requirement_id,p_submission_notes,p_submission_url); $$;

create or replace function public.review_requirement(p_requirement_id text, p_action text)
returns public.requirements language sql security invoker
set search_path = public, private
as $$ select private.review_requirement_internal(p_requirement_id,p_action); $$;

revoke all on function public.create_requirement(text,uuid,text,text,text,date,text) from public, anon;
revoke all on function public.submit_requirement(text,text,text) from public, anon;
revoke all on function public.review_requirement(text,text) from public, anon;
grant execute on function public.create_requirement(text,uuid,text,text,text,date,text) to authenticated;
grant execute on function public.submit_requirement(text,text,text) to authenticated;
grant execute on function public.review_requirement(text,text) to authenticated;
