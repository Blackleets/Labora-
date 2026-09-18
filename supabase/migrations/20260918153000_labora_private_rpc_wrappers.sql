-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Moves privileged RPC logic to private schema and exposes security-invoker wrappers only.

create or replace function private.start_work_session_internal(p_start_odometer_km numeric default null)
returns public.work_sessions
language plpgsql
security definer
set search_path = public, private
as $$
declare
  existing_session public.work_sessions;
  created_session public.work_sessions;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_start_odometer_km is not null and p_start_odometer_km < 0 then raise exception 'Invalid odometer'; end if;

  select * into existing_session
  from public.work_sessions
  where user_id = auth.uid() and ended_at is null
  limit 1;

  if found then return existing_session; end if;

  insert into public.work_sessions (user_id, started_at, start_odometer_km)
  values (auth.uid(), now(), p_start_odometer_km)
  returning * into created_session;

  return created_session;
end;
$$;

create or replace function private.finish_work_session_internal(
  p_session_id uuid,
  p_end_odometer_km numeric default null
)
returns public.work_sessions
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_session public.work_sessions;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into target_session
  from public.work_sessions
  where id = p_session_id and user_id = auth.uid() and ended_at is null
  for update;

  if not found then raise exception 'Active work session not found'; end if;
  if p_end_odometer_km is not null and p_end_odometer_km < 0 then raise exception 'Invalid odometer'; end if;

  if target_session.start_odometer_km is not null
     and p_end_odometer_km is not null
     and p_end_odometer_km < target_session.start_odometer_km then
    raise exception 'End odometer cannot be lower than start odometer';
  end if;

  update public.work_sessions
  set ended_at = now(), end_odometer_km = p_end_odometer_km
  where id = p_session_id
  returning * into target_session;

  return target_session;
end;
$$;

create or replace function private.review_income_internal(
  p_income_id text,
  p_action text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_user uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_action not in ('reviewed', 'needs_fix') then raise exception 'Unsupported review action'; end if;

  select i.user_id into target_user
  from public.incomes i
  where i.id = p_income_id;

  if target_user is null then raise exception 'Income not found'; end if;
  if not private.is_manager_of(target_user) then raise exception 'Not authorized to review this income'; end if;

  update public.incomes
  set
    needs_review = (p_action = 'needs_fix'),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_income_id;
end;
$$;

grant usage on schema private to authenticated;
revoke all on function private.start_work_session_internal(numeric) from public, anon;
revoke all on function private.finish_work_session_internal(uuid, numeric) from public, anon;
revoke all on function private.review_income_internal(text, text, text) from public, anon;
grant execute on function private.start_work_session_internal(numeric) to authenticated;
grant execute on function private.finish_work_session_internal(uuid, numeric) to authenticated;
grant execute on function private.review_income_internal(text, text, text) to authenticated;

create or replace function public.start_work_session(p_start_odometer_km numeric default null)
returns public.work_sessions
language sql
security invoker
set search_path = public, private
as $$ select private.start_work_session_internal(p_start_odometer_km); $$;

create or replace function public.finish_work_session(
  p_session_id uuid,
  p_end_odometer_km numeric default null
)
returns public.work_sessions
language sql
security invoker
set search_path = public, private
as $$ select private.finish_work_session_internal(p_session_id, p_end_odometer_km); $$;

create or replace function public.review_income(
  p_income_id text,
  p_action text,
  p_note text default null
)
returns void
language sql
security invoker
set search_path = public, private
as $$ select private.review_income_internal(p_income_id, p_action, p_note); $$;

revoke all on function public.start_work_session(numeric) from public, anon;
revoke all on function public.finish_work_session(uuid, numeric) from public, anon;
revoke all on function public.review_income(text, text, text) from public, anon;
grant execute on function public.start_work_session(numeric) to authenticated;
grant execute on function public.finish_work_session(uuid, numeric) to authenticated;
grant execute on function public.review_income(text, text, text) to authenticated;

drop index if exists public.documents_user_content_hash_unique;
