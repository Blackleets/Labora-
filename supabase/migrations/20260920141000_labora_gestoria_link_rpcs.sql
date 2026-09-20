-- Autónomo ↔ gestoría linking.
-- profiles.manager_id is intentionally NOT in the authenticated column UPDATE grant
-- (see 20260918160500_labora_profile_column_security.sql). Linking must go through
-- SECURITY DEFINER RPCs so riders cannot set arbitrary manager_id / escalate.

create or replace function private.link_manager_by_email_internal(manager_email text)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor uuid := auth.uid();
  actor_role text;
  normalized_email text;
  target_id uuid;
  target_role text;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  select role into actor_role from public.profiles where id = actor;
  if actor_role is distinct from 'rider' then
    raise exception 'Only riders may link a gestoría';
  end if;

  normalized_email := lower(trim(coalesce(manager_email, '')));
  if normalized_email = '' then
    raise exception 'Manager email required';
  end if;

  select id, role
    into target_id, target_role
  from public.profiles
  where lower(trim(email)) = normalized_email
  limit 1;

  if target_id is null then
    raise exception 'Manager not found';
  end if;

  if target_id = actor then
    raise exception 'Cannot link to yourself';
  end if;

  if target_role not in ('manager', 'admin') then
    raise exception 'Not a manager role';
  end if;

  update public.profiles
  set manager_id = target_id
  where id = actor;
end;
$$;

create or replace function private.unlink_own_manager_internal()
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor uuid := auth.uid();
  actor_role text;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  select role into actor_role from public.profiles where id = actor;
  if actor_role is distinct from 'rider' then
    raise exception 'Only riders may unlink a gestoría';
  end if;

  update public.profiles
  set manager_id = null
  where id = actor;
end;
$$;

create or replace function public.link_manager_by_email(manager_email text)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.link_manager_by_email_internal(manager_email);
end;
$$;

create or replace function public.unlink_own_manager()
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.unlink_own_manager_internal();
end;
$$;

revoke all on function public.link_manager_by_email(text) from public, anon;
revoke all on function public.unlink_own_manager() from public, anon;
grant execute on function public.link_manager_by_email(text) to authenticated;
grant execute on function public.unlink_own_manager() to authenticated;
