-- Preserve the user's explicitly selected market before any authenticated
-- session exists. This prevents email-confirmation flows from silently creating
-- a Spanish profile/workspace for users in another country.

create or replace function private.labora_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_country text;
begin
  signup_country := upper(trim(coalesce(new.raw_user_meta_data ->> 'country_code', '')));
  if signup_country !~ '^[A-Z]{2}$' then
    signup_country := 'ZZ';
  end if;

  insert into public.profiles (user_id, full_name, country_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    signup_country
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.labora_bootstrap_account(account_name text, account_kind text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org uuid;
  clean_name text;
  org_kind public.labora_organization_kind;
  member_role public.labora_membership_role;
  profile_country text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if account_kind not in ('rider','manager') then raise exception 'invalid account kind'; end if;

  if exists (
    select 1 from public.organization_memberships
    where user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'account already bootstrapped';
  end if;

  select upper(trim(coalesce(p.country_code, '')))
    into profile_country
    from public.profiles p
   where p.user_id = auth.uid();

  if profile_country is null or profile_country !~ '^[A-Z]{2}$' then
    profile_country := 'ZZ';
  end if;

  clean_name := nullif(trim(coalesce(account_name, '')), '');
  if clean_name is null then clean_name := 'Mi espacio Labora+'; end if;
  org_kind := account_kind::public.labora_organization_kind;
  member_role := case
    when account_kind = 'manager' then 'owner'::public.labora_membership_role
    else 'rider'::public.labora_membership_role
  end;

  insert into public.organizations (name, kind, country_code, created_by)
  values (clean_name, org_kind, profile_country, auth.uid())
  returning id into new_org;

  insert into public.organization_memberships (organization_id, user_id, role, status, created_by)
  values (new_org, auth.uid(), member_role, 'active', auth.uid());

  return new_org;
end;
$$;

comment on function private.labora_handle_new_user() is
  'Creates a profile using the country explicitly selected during sign-up; invalid/missing country fails closed to ZZ.';
comment on function public.labora_bootstrap_account(text, text) is
  'Creates the authenticated user workspace using the already persisted profile country.';
