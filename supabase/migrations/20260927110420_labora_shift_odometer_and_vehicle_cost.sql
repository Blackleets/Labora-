-- Coste por km del vehículo: estimación que introduce el propio rider (no es una tarifa oficial).
alter table public.user_module_settings
  add column if not exists vehicle_cost_per_km numeric(6,3);
alter table public.user_module_settings
  drop constraint if exists user_module_settings_vehicle_cost_range;
alter table public.user_module_settings
  add constraint user_module_settings_vehicle_cost_range
    check (vehicle_cost_per_km is null or (vehicle_cost_per_km > 0 and vehicle_cost_per_km <= 10));

-- Corregir lecturas del cuentakilómetros de una jornada propia terminada o en curso.
create or replace function private.set_work_session_odometer_internal(p_session_id uuid, p_start_odometer_km numeric, p_end_odometer_km numeric)
returns public.work_sessions
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  target_session public.work_sessions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if (p_start_odometer_km is not null and (p_start_odometer_km < 0 or p_start_odometer_km > 10000000))
     or (p_end_odometer_km is not null and (p_end_odometer_km < 0 or p_end_odometer_km > 10000000)) then
    raise exception 'Invalid odometer';
  end if;
  if p_start_odometer_km is not null and p_end_odometer_km is not null and p_end_odometer_km < p_start_odometer_km then
    raise exception 'End odometer cannot be lower than start odometer';
  end if;

  select * into target_session
  from public.work_sessions
  where id = p_session_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Work session not found';
  end if;
  if target_session.ended_at is null and p_end_odometer_km is not null then
    raise exception 'Finish the work session to set the end odometer';
  end if;

  update public.work_sessions
  set start_odometer_km = p_start_odometer_km,
      end_odometer_km = p_end_odometer_km
  where id = p_session_id
  returning * into target_session;
  return target_session;
end;
$$;

create or replace function public.set_work_session_odometer(p_session_id uuid, p_start_odometer_km numeric default null, p_end_odometer_km numeric default null)
returns public.work_sessions
language sql
set search_path to 'public', 'private'
as $$
  select private.set_work_session_odometer_internal(p_session_id, p_start_odometer_km, p_end_odometer_km);
$$;

revoke all on function private.set_work_session_odometer_internal(uuid, numeric, numeric) from public, anon;
revoke all on function public.set_work_session_odometer(uuid, numeric, numeric) from public, anon;
grant execute on function private.set_work_session_odometer_internal(uuid, numeric, numeric) to authenticated;
grant execute on function public.set_work_session_odometer(uuid, numeric, numeric) to authenticated, service_role;
