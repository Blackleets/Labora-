-- Forward migration: persist the universal worker fields that already exist on
-- public.profiles when a new Supabase Auth user is created.

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requested_role text;
  requested_work_modes text[];
  requested_workplaces text[];
  requested_wants_manager boolean;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'rider');

  -- Public signup may create only normal product roles. Admin assignment remains
  -- a privileged server-side operation.
  if requested_role not in ('rider', 'manager') then
    requested_role := 'rider';
  end if;

  select coalesce(array_agg(distinct value), '{}'::text[])
    into requested_work_modes
  from jsonb_array_elements_text(
    case
      when jsonb_typeof(new.raw_user_meta_data->'work_modes') = 'array'
        then new.raw_user_meta_data->'work_modes'
      else '[]'::jsonb
    end
  ) as t(value)
  where value in ('employee', 'rider', 'self_employed', 'freelancer');

  select coalesce(array_agg(value), '{}'::text[])
    into requested_workplaces
  from (
    select distinct left(trim(value), 120) as value
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(new.raw_user_meta_data->'workplaces') = 'array'
          then new.raw_user_meta_data->'workplaces'
        else '[]'::jsonb
      end
    ) as t(value)
    where trim(value) <> ''
    limit 30
  ) cleaned;

  requested_wants_manager := lower(coalesce(new.raw_user_meta_data->>'wants_manager', 'false'))
    in ('true', '1', 'yes', 'on');

  insert into public.profiles (
    id, role, name, email, phone, nif, company_name, collegiate_number,
    fiscal_regime, iae_code, social_security_type, vehicle_type,
    vehicle_plate, vehicle_fuel, country_code,
    work_modes, workplaces, wants_manager
  ) values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    coalesce(new.email,''),
    nullif(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'nif',''),
    nullif(new.raw_user_meta_data->>'company_name',''),
    nullif(new.raw_user_meta_data->>'collegiate_number',''),
    nullif(new.raw_user_meta_data->>'fiscal_regime',''),
    nullif(new.raw_user_meta_data->>'iae_code',''),
    nullif(new.raw_user_meta_data->>'social_security_type',''),
    nullif(new.raw_user_meta_data->>'vehicle_type',''),
    nullif(new.raw_user_meta_data->>'vehicle_plate',''),
    nullif(new.raw_user_meta_data->>'vehicle_fuel',''),
    coalesce(nullif(new.raw_user_meta_data->>'country_code',''), 'ES'),
    requested_work_modes,
    requested_workplaces,
    requested_wants_manager
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
