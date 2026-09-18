-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Prevents role escalation through profile updates or signup metadata.

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'rider');

  if requested_role not in ('rider', 'manager') then
    requested_role := 'rider';
  end if;

  insert into public.profiles (
    id, role, name, email, phone, nif, company_name, collegiate_number,
    fiscal_regime, iae_code, social_security_type, vehicle_type,
    vehicle_plate, vehicle_fuel, country_code
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
    coalesce(nullif(new.raw_user_meta_data->>'country_code',''), 'ES')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all privileges on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;

grant select on table public.profiles to authenticated;

grant update (
  name,
  phone,
  nif,
  company_name,
  collegiate_number,
  fiscal_regime,
  iae_code,
  social_security_type,
  vehicle_type,
  vehicle_plate,
  vehicle_fuel,
  country_code,
  identity_image_path,
  identity_image_kind,
  platforms,
  banks,
  onboarding_completed
) on table public.profiles to authenticated;
