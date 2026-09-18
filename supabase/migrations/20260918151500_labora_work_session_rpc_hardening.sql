-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Replaces direct work-session mutation with controlled RPCs.

drop policy if exists work_sessions_insert_self on public.work_sessions;
drop policy if exists work_sessions_update_self on public.work_sessions;
drop policy if exists work_sessions_delete_self on public.work_sessions;

create or replace function public.start_work_session(p_start_odometer_km numeric default null)
returns public.work_sessions
language plpgsql
security definer
set search_path = public, private
as $$
declare
  existing_session public.work_sessions;
  created_session public.work_sessions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_start_odometer_km is not null and p_start_odometer_km < 0 then
    raise exception 'Invalid odometer';
  end if;

  select *
  into existing_session
  from public.work_sessions
  where user_id = auth.uid()
    and ended_at is null
  limit 1;

  if found then
    return existing_session;
  end if;

  insert into public.work_sessions (user_id, started_at, start_odometer_km)
  values (auth.uid(), now(), p_start_odometer_km)
  returning * into created_session;

  return created_session;
end;
$$;

create or replace function public.finish_work_session(
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
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_session
  from public.work_sessions
  where id = p_session_id
    and user_id = auth.uid()
    and ended_at is null
  for update;

  if not found then
    raise exception 'Active work session not found';
  end if;

  if p_end_odometer_km is not null and p_end_odometer_km < 0 then
    raise exception 'Invalid odometer';
  end if;

  if target_session.start_odometer_km is not null
     and p_end_odometer_km is not null
     and p_end_odometer_km < target_session.start_odometer_km then
    raise exception 'End odometer cannot be lower than start odometer';
  end if;

  update public.work_sessions
  set ended_at = now(),
      end_odometer_km = p_end_odometer_km
  where id = p_session_id
  returning * into target_session;

  return target_session;
end;
$$;

revoke all on function public.start_work_session(numeric) from public;
revoke all on function public.finish_work_session(uuid, numeric) from public;
grant execute on function public.start_work_session(numeric) to authenticated;
grant execute on function public.finish_work_session(uuid, numeric) to authenticated;
