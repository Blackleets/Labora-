-- Labora+ production schema
-- Truth rules:
-- 1) No evidence -> no fiscal fact is treated as verified.
-- 2) No verified filing evidence -> no declaration is shown as filed.
-- 3) A gestor may review a client's facts but may not rewrite the client's source facts.
-- 4) Client access is granted only through an invite explicitly accepted by the client.
--
-- This file is intentionally not auto-applied. It targets a dedicated Labora+
-- Supabase project and must never be executed in the Genesis HQ database.

create extension if not exists pgcrypto;

create type public.labora_organization_kind as enum ('rider', 'manager');
create type public.labora_membership_role as enum ('owner', 'manager', 'rider');
create type public.labora_membership_status as enum ('active', 'disabled');
create type public.labora_link_status as enum ('active', 'revoked');
create type public.labora_evidence_status as enum ('unverified', 'verified', 'rejected');
create type public.labora_expense_review_status as enum ('approved', 'rejected', 'needs_fix');
create type public.labora_requirement_status as enum ('pending', 'submitted', 'approved', 'cancelled');
create type public.labora_tax_period_status as enum ('open', 'reviewing', 'reviewed');
create type public.labora_filing_verification_status as enum ('pending', 'verified', 'rejected');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  country_code text not null default 'ES',
  nif text,
  fiscal_regime text,
  iae_code text,
  social_security_type text,
  professional_id text,
  platforms text[] not null default '{}',
  preferred_banks text[] not null default '{}',
  vehicle_type text,
  vehicle_plate text,
  vehicle_fuel text,
  vehicle_model text,
  last_maintenance_date date,
  last_maintenance_km integer check (last_maintenance_km is null or last_maintenance_km >= 0),
  current_km integer check (current_km is null or current_km >= 0),
  next_maintenance_km integer check (next_maintenance_km is null or next_maintenance_km >= 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  kind public.labora_organization_kind not null,
  country_code text not null default 'ES',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.labora_membership_role not null,
  status public.labora_membership_status not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.manager_client_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  manager_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  status public.labora_link_status not null default 'active',
  created_at timestamptz not null default now(),
  activated_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (organization_id, manager_user_id, client_user_id),
  check (manager_user_id <> client_user_id)
);

-- Invites are intentionally inaccessible through the Data API. Only the RPCs
-- below can create/consume them. The raw invite code is never stored.
create table public.manager_client_invites (
  id uuid primary key default gen_random_uuid(),
  manager_organization_id uuid not null references public.organizations(id) on delete cascade,
  manager_user_id uuid not null references auth.users(id) on delete cascade,
  code_hash bytea not null unique,
  expires_at timestamptz not null,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  kind text not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text,
  document_date date,
  extraction_status text not null default 'pending' check (extraction_status in ('pending','processing','succeeded','failed','manual_review')),
  extraction jsonb,
  created_at timestamptz not null default now()
);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (char_length(trim(platform)) between 1 and 120),
  occurred_on date not null,
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  retention_amount numeric(12,2) not null default 0 check (retention_amount >= 0),
  currency text not null default 'EUR',
  source_type text not null check (source_type in ('manual','platform_import','bank_reconciliation','document_ocr')),
  source_document_id uuid references public.documents(id) on delete set null,
  external_id text,
  evidence_status public.labora_evidence_status not null default 'unverified',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index incomes_external_id_unique
  on public.incomes (organization_id, platform, external_id)
  where external_id is not null;

create table public.platform_payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (char_length(trim(platform)) between 1 and 120),
  period_start date,
  period_end date,
  paid_on date,
  gross_amount numeric(12,2),
  fees_amount numeric(12,2),
  retention_amount numeric(12,2),
  net_amount numeric(12,2) not null check (net_amount >= 0),
  currency text not null default 'EUR',
  status text not null check (status in ('expected','paid','partial','disputed')),
  external_id text,
  evidence_document_id uuid references public.documents(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index platform_payouts_external_id_unique
  on public.platform_payouts (organization_id, platform, external_id)
  where external_id is not null;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  merchant text not null check (char_length(trim(merchant)) between 1 and 200),
  category text not null,
  total_amount numeric(12,2) not null check (total_amount > 0),
  currency text not null default 'EUR',
  vat_rate numeric(6,3),
  vat_amount numeric(12,2),
  source_document_id uuid not null references public.documents(id) on delete restrict,
  evidence_status public.labora_evidence_status not null default 'unverified',
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expense_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  expense_id uuid not null references public.expenses(id) on delete cascade,
  manager_user_id uuid not null references auth.users(id) on delete cascade,
  status public.labora_expense_review_status not null,
  deductible_percent numeric(5,2) not null default 0 check (deductible_percent between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expense_id, manager_user_id)
);

create table public.manager_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  manager_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text not null default '',
  category text not null,
  deadline date,
  tax_period_label text,
  status public.labora_requirement_status not null default 'pending',
  submitted_document_id uuid references public.documents(id) on delete set null,
  submission_notes text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  resolved_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  requirement_id uuid references public.manager_requirements(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_user_id <> recipient_user_id)
);

create table public.tax_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null default 'ES',
  tax_year integer not null check (tax_year between 2000 and 2200),
  quarter smallint not null check (quarter between 1 and 4),
  status public.labora_tax_period_status not null default 'open',
  snapshot jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, tax_year, quarter)
);

create table public.filing_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tax_period_id uuid not null references public.tax_periods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  model_type text not null check (model_type in ('130','303','390','100','036','037')),
  reference text not null check (char_length(trim(reference)) between 1 and 240),
  filed_at timestamptz not null,
  document_id uuid not null references public.documents(id) on delete restrict,
  source text not null check (source in ('user_upload','manager_upload','official_import')),
  verification_status public.labora_filing_verification_status not null default 'pending',
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Common triggers and authorization helpers
-- ---------------------------------------------------------------------------

create or replace function public.labora_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.labora_set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function public.labora_set_updated_at();
create trigger incomes_updated_at before update on public.incomes for each row execute function public.labora_set_updated_at();
create trigger platform_payouts_updated_at before update on public.platform_payouts for each row execute function public.labora_set_updated_at();
create trigger expenses_updated_at before update on public.expenses for each row execute function public.labora_set_updated_at();
create trigger expense_reviews_updated_at before update on public.expense_reviews for each row execute function public.labora_set_updated_at();
create trigger tax_periods_updated_at before update on public.tax_periods for each row execute function public.labora_set_updated_at();

create or replace function public.labora_is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.labora_is_org_manager(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner','manager')
  );
$$;

create or replace function public.labora_can_access_client(target_org uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      target_user = auth.uid()
      and exists (
        select 1 from public.organization_memberships m
        where m.organization_id = target_org
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or exists (
      select 1
      from public.manager_client_links l
      where l.organization_id = target_org
        and l.manager_user_id = auth.uid()
        and l.client_user_id = target_user
        and l.status = 'active'
    );
$$;

create or replace function public.labora_are_linked(target_org uuid, user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.manager_client_links l
    where l.organization_id = target_org
      and l.status = 'active'
      and (
        (l.manager_user_id = user_a and l.client_user_id = user_b)
        or (l.manager_user_id = user_b and l.client_user_id = user_a)
      )
  );
$$;

create or replace function public.labora_storage_path_authorized(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  org_text text;
  user_text text;
begin
  org_text := split_part(object_name, '/', 1);
  user_text := split_part(object_name, '/', 2);
  if org_text !~ '^[0-9a-fA-F-]{36}$' or user_text !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;
  return public.labora_can_access_client(org_text::uuid, user_text::uuid);
exception when others then
  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- Account bootstrap and manager/client linking
-- ---------------------------------------------------------------------------

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
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if account_kind not in ('rider','manager') then raise exception 'invalid account kind'; end if;

  if exists (
    select 1 from public.organization_memberships
    where user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'account already bootstrapped';
  end if;

  clean_name := nullif(trim(coalesce(account_name, '')), '');
  if clean_name is null then clean_name := 'Mi espacio Labora+'; end if;
  org_kind := account_kind::public.labora_organization_kind;
  member_role := case when account_kind = 'manager' then 'owner'::public.labora_membership_role else 'rider'::public.labora_membership_role end;

  insert into public.organizations (name, kind, created_by)
  values (clean_name, org_kind, auth.uid())
  returning id into new_org;

  insert into public.organization_memberships (organization_id, user_id, role, status, created_by)
  values (new_org, auth.uid(), member_role, 'active', auth.uid());

  return new_org;
end;
$$;

create or replace function public.labora_create_manager_invite()
returns table (invite_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  manager_org uuid;
  raw_code text;
  expiry timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  select o.id into manager_org
  from public.organizations o
  join public.organization_memberships m on m.organization_id = o.id
  where m.user_id = auth.uid()
    and m.status = 'active'
    and m.role = 'owner'
    and o.kind = 'manager'
  order by m.created_at asc
  limit 1;

  if manager_org is null then raise exception 'manager workspace required'; end if;

  raw_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12));
  expiry := now() + interval '7 days';

  insert into public.manager_client_invites (manager_organization_id, manager_user_id, code_hash, expires_at)
  values (manager_org, auth.uid(), digest(raw_code, 'sha256'), expiry);

  return query select raw_code, expiry;
end;
$$;

create or replace function public.labora_accept_manager_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.manager_client_invites%rowtype;
  client_org uuid;
  new_link uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if nullif(trim(coalesce(invite_code, '')), '') is null then raise exception 'invite code required'; end if;

  select * into inv
  from public.manager_client_invites i
  where i.code_hash = digest(upper(trim(invite_code)), 'sha256')
    and i.used_at is null
    and i.revoked_at is null
    and i.expires_at > now()
  for update;

  if not found then raise exception 'invite invalid or expired'; end if;
  if inv.manager_user_id = auth.uid() then raise exception 'manager cannot link to self'; end if;

  select o.id into client_org
  from public.organizations o
  join public.organization_memberships m on m.organization_id = o.id
  where m.user_id = auth.uid()
    and m.status = 'active'
    and m.role = 'rider'
    and o.kind = 'rider'
  order by m.created_at asc
  limit 1;

  if client_org is null then raise exception 'rider workspace required'; end if;

  insert into public.manager_client_links (organization_id, manager_user_id, client_user_id, status)
  values (client_org, inv.manager_user_id, auth.uid(), 'active')
  on conflict (organization_id, manager_user_id, client_user_id)
  do update set status = 'active', activated_at = now(), revoked_at = null
  returning id into new_link;

  insert into public.organization_memberships (organization_id, user_id, role, status, created_by)
  values (client_org, inv.manager_user_id, 'manager', 'active', auth.uid())
  on conflict (organization_id, user_id)
  do update set role = 'manager', status = 'active';

  update public.manager_client_invites
  set used_by = auth.uid(), used_at = now()
  where id = inv.id;

  return new_link;
end;
$$;

create or replace function public.labora_revoke_manager_link(link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.manager_client_links%rowtype;
begin
  select * into l from public.manager_client_links where id = link_id for update;
  if not found then raise exception 'link not found'; end if;
  if auth.uid() not in (l.manager_user_id, l.client_user_id) then raise exception 'not allowed'; end if;

  update public.manager_client_links
  set status = 'revoked', revoked_at = now()
  where id = link_id;

  update public.organization_memberships
  set status = 'disabled'
  where organization_id = l.organization_id
    and user_id = l.manager_user_id
    and role = 'manager';
end;
$$;

-- ---------------------------------------------------------------------------
-- Controlled workflow mutations
-- ---------------------------------------------------------------------------

create or replace function public.labora_submit_requirement(requirement_id uuid, document_id uuid, notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.manager_requirements%rowtype;
  doc public.documents%rowtype;
begin
  select * into req from public.manager_requirements where id = requirement_id for update;
  if not found then raise exception 'requirement not found'; end if;
  if req.client_user_id <> auth.uid() then raise exception 'not allowed'; end if;

  select * into doc from public.documents where id = document_id;
  if not found or doc.user_id <> auth.uid() or doc.organization_id <> req.organization_id then
    raise exception 'document does not belong to this client workspace';
  end if;

  update public.manager_requirements
  set status = 'submitted', submitted_document_id = document_id,
      submission_notes = nullif(trim(coalesce(notes, '')), ''), submitted_at = now()
  where id = requirement_id;
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
  if resolution not in ('approved','cancelled','pending') then raise exception 'invalid resolution'; end if;
  select * into req from public.manager_requirements where id = requirement_id for update;
  if not found then raise exception 'requirement not found'; end if;
  if req.manager_user_id <> auth.uid() or not public.labora_is_org_manager(req.organization_id) then raise exception 'not allowed'; end if;

  update public.manager_requirements
  set status = resolution::public.labora_requirement_status,
      resolved_at = case when resolution in ('approved','cancelled') then now() else null end
  where id = requirement_id;
end;
$$;

create or replace function public.labora_mark_message_read(message_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages
  set read_at = coalesce(read_at, now())
  where id = message_id and recipient_user_id = auth.uid();
$$;

create or replace function public.labora_verify_filing_evidence(evidence_id uuid, decision text, notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  evidence public.filing_evidence%rowtype;
begin
  if decision not in ('verified','rejected') then raise exception 'invalid decision'; end if;
  select * into evidence from public.filing_evidence where id = evidence_id for update;
  if not found then raise exception 'evidence not found'; end if;
  if not public.labora_is_org_manager(evidence.organization_id) then raise exception 'not allowed'; end if;
  if not public.labora_can_access_client(evidence.organization_id, evidence.user_id) then raise exception 'not linked to client'; end if;

  update public.filing_evidence
  set verification_status = decision::public.labora_filing_verification_status,
      verified_by = auth.uid(), verified_at = now(), verification_notes = nullif(trim(coalesce(notes, '')), '')
  where id = evidence_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auth profile bootstrap + append-only audit
-- ---------------------------------------------------------------------------

create or replace function public.labora_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_labora_auth_user_created
  after insert on auth.users
  for each row execute function public.labora_handle_new_user();

create or replace function public.labora_audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id uuid;
  row_id uuid;
begin
  if tg_op = 'DELETE' then
    org_id := old.organization_id;
    row_id := old.id;
  else
    org_id := new.organization_id;
    row_id := new.id;
  end if;

  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id)
  values (org_id, auth.uid(), tg_op, tg_table_name, row_id);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger audit_documents after insert or update or delete on public.documents for each row execute function public.labora_audit_row();
create trigger audit_incomes after insert or update or delete on public.incomes for each row execute function public.labora_audit_row();
create trigger audit_platform_payouts after insert or update or delete on public.platform_payouts for each row execute function public.labora_audit_row();
create trigger audit_expenses after insert or update or delete on public.expenses for each row execute function public.labora_audit_row();
create trigger audit_expense_reviews after insert or update or delete on public.expense_reviews for each row execute function public.labora_audit_row();
create trigger audit_requirements after insert or update or delete on public.manager_requirements for each row execute function public.labora_audit_row();
create trigger audit_messages after insert or update or delete on public.messages for each row execute function public.labora_audit_row();
create trigger audit_filing_evidence after insert or update or delete on public.filing_evidence for each row execute function public.labora_audit_row();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.manager_client_links enable row level security;
alter table public.manager_client_invites enable row level security;
alter table public.documents enable row level security;
alter table public.incomes enable row level security;
alter table public.platform_payouts enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_reviews enable row level security;
alter table public.manager_requirements enable row level security;
alter table public.messages enable row level security;
alter table public.tax_periods enable row level security;
alter table public.filing_evidence enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_self_or_linked on public.profiles for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.manager_client_links l
    where l.manager_user_id = auth.uid() and l.client_user_id = profiles.user_id and l.status = 'active'
  )
  or exists (
    select 1 from public.manager_client_links l
    where l.client_user_id = auth.uid() and l.manager_user_id = profiles.user_id and l.status = 'active'
  )
);
create policy profiles_update_self on public.profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy organizations_select_member on public.organizations for select to authenticated
using (public.labora_is_org_member(id));
create policy memberships_select_member on public.organization_memberships for select to authenticated
using (public.labora_is_org_member(organization_id));
create policy links_select_participant on public.manager_client_links for select to authenticated
using (manager_user_id = auth.uid() or client_user_id = auth.uid());

create policy documents_select_authorized on public.documents for select to authenticated
using (public.labora_can_access_client(organization_id, user_id));
create policy documents_insert_authorized on public.documents for insert to authenticated
with check (uploaded_by = auth.uid() and public.labora_can_access_client(organization_id, user_id));
create policy documents_delete_owner on public.documents for delete to authenticated
using (user_id = auth.uid());

create policy incomes_select_authorized on public.incomes for select to authenticated
using (public.labora_can_access_client(organization_id, user_id));
create policy incomes_insert_owner on public.incomes for insert to authenticated
with check (user_id = auth.uid() and created_by = auth.uid() and public.labora_is_org_member(organization_id));
create policy incomes_update_owner on public.incomes for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and created_by = auth.uid());
create policy incomes_delete_owner on public.incomes for delete to authenticated
using (user_id = auth.uid());

create policy payouts_select_authorized on public.platform_payouts for select to authenticated
using (public.labora_can_access_client(organization_id, user_id));
create policy payouts_insert_owner on public.platform_payouts for insert to authenticated
with check (user_id = auth.uid() and created_by = auth.uid() and public.labora_is_org_member(organization_id));
create policy payouts_update_owner on public.platform_payouts for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and created_by = auth.uid());
create policy payouts_delete_owner on public.platform_payouts for delete to authenticated
using (user_id = auth.uid());

create policy expenses_select_authorized on public.expenses for select to authenticated
using (public.labora_can_access_client(organization_id, user_id));
create policy expenses_insert_owner on public.expenses for insert to authenticated
with check (user_id = auth.uid() and created_by = auth.uid() and public.labora_is_org_member(organization_id));
create policy expenses_update_owner on public.expenses for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and created_by = auth.uid());
create policy expenses_delete_owner on public.expenses for delete to authenticated
using (user_id = auth.uid());

create policy expense_reviews_select_authorized on public.expense_reviews for select to authenticated
using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_reviews.expense_id
      and public.labora_can_access_client(e.organization_id, e.user_id)
  )
);
create policy expense_reviews_insert_manager on public.expense_reviews for insert to authenticated
with check (
  manager_user_id = auth.uid()
  and public.labora_is_org_manager(organization_id)
  and exists (
    select 1 from public.expenses e
    where e.id = expense_reviews.expense_id
      and e.organization_id = expense_reviews.organization_id
      and public.labora_can_access_client(e.organization_id, e.user_id)
  )
);
create policy expense_reviews_update_manager on public.expense_reviews for update to authenticated
using (manager_user_id = auth.uid())
with check (
  manager_user_id = auth.uid()
  and public.labora_is_org_manager(organization_id)
  and exists (
    select 1 from public.expenses e
    where e.id = expense_reviews.expense_id
      and e.organization_id = expense_reviews.organization_id
      and public.labora_can_access_client(e.organization_id, e.user_id)
  )
);

create policy requirements_select_participant on public.manager_requirements for select to authenticated
using (manager_user_id = auth.uid() or client_user_id = auth.uid());
create policy requirements_insert_manager on public.manager_requirements for insert to authenticated
with check (
  manager_user_id = auth.uid()
  and public.labora_is_org_manager(organization_id)
  and public.labora_are_linked(organization_id, manager_user_id, client_user_id)
);

create policy messages_select_participant on public.messages for select to authenticated
using (sender_user_id = auth.uid() or recipient_user_id = auth.uid());
create policy messages_insert_sender on public.messages for insert to authenticated
with check (
  sender_user_id = auth.uid()
  and public.labora_are_linked(organization_id, sender_user_id, recipient_user_id)
);

create policy tax_periods_select_authorized on public.tax_periods for select to authenticated
using (public.labora_can_access_client(organization_id, user_id));

create policy filing_evidence_select_authorized on public.filing_evidence for select to authenticated
using (public.labora_can_access_client(organization_id, user_id));
create policy filing_evidence_insert_authorized on public.filing_evidence for insert to authenticated
with check (
  public.labora_can_access_client(organization_id, user_id)
  and (
    (source = 'user_upload' and user_id = auth.uid())
    or (source = 'manager_upload' and public.labora_is_org_manager(organization_id))
  )
  and verification_status = 'pending'
  and verified_by is null
  and verified_at is null
  and exists (
    select 1 from public.documents d
    where d.id = filing_evidence.document_id
      and d.organization_id = filing_evidence.organization_id
      and d.user_id = filing_evidence.user_id
  )
);

create policy audit_events_select_authorized on public.audit_events for select to authenticated
using (public.labora_is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Explicit Data API grants. RLS remains the row authorization boundary.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_memberships from anon, authenticated;
revoke all on table public.manager_client_links from anon, authenticated;
revoke all on table public.manager_client_invites from anon, authenticated;
revoke all on table public.documents from anon, authenticated;
revoke all on table public.incomes from anon, authenticated;
revoke all on table public.platform_payouts from anon, authenticated;
revoke all on table public.expenses from anon, authenticated;
revoke all on table public.expense_reviews from anon, authenticated;
revoke all on table public.manager_requirements from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.tax_periods from anon, authenticated;
revoke all on table public.filing_evidence from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select on table public.organizations, public.organization_memberships, public.manager_client_links to authenticated;
grant select, insert, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.incomes, public.platform_payouts, public.expenses to authenticated;
grant select, insert, update on table public.expense_reviews to authenticated;
grant select, insert on table public.manager_requirements, public.messages, public.filing_evidence to authenticated;
grant select on table public.tax_periods, public.audit_events to authenticated;

grant execute on function public.labora_bootstrap_account(text, text) to authenticated;
grant execute on function public.labora_create_manager_invite() to authenticated;
grant execute on function public.labora_accept_manager_invite(text) to authenticated;
grant execute on function public.labora_revoke_manager_link(uuid) to authenticated;
grant execute on function public.labora_submit_requirement(uuid, uuid, text) to authenticated;
grant execute on function public.labora_review_requirement(uuid, text) to authenticated;
grant execute on function public.labora_mark_message_read(uuid) to authenticated;
grant execute on function public.labora_verify_filing_evidence(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Private fiscal evidence storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fiscal-evidence', 'fiscal-evidence', false)
on conflict (id) do update set public = false;

create policy fiscal_evidence_select on storage.objects for select to authenticated
using (bucket_id = 'fiscal-evidence' and public.labora_storage_path_authorized(name));
create policy fiscal_evidence_insert on storage.objects for insert to authenticated
with check (bucket_id = 'fiscal-evidence' and public.labora_storage_path_authorized(name));
create policy fiscal_evidence_delete on storage.objects for delete to authenticated
using (bucket_id = 'fiscal-evidence' and split_part(name, '/', 2) = auth.uid()::text);
