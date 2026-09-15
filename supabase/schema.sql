-- Labora+ production schema draft
-- Truth rule: no evidence -> no fiscal fact; no verified evidence -> no filed status.
-- This file is intentionally not auto-applied. It will be executed against the
-- dedicated Labora+ Supabase project after project creation is explicitly approved.

create extension if not exists pgcrypto;

create type public.labora_membership_role as enum ('owner', 'manager', 'rider');
create type public.labora_membership_status as enum ('active', 'disabled');
create type public.labora_link_status as enum ('pending', 'active', 'revoked');
create type public.labora_evidence_status as enum ('unverified', 'verified', 'rejected');
create type public.labora_expense_review_status as enum ('approved', 'rejected', 'needs_fix');
create type public.labora_requirement_status as enum ('pending', 'submitted', 'approved', 'cancelled');
create type public.labora_tax_period_status as enum ('open', 'reviewing', 'reviewed', 'filed_verified');
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
  vehicle_type text,
  vehicle_plate text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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
  status public.labora_link_status not null default 'pending',
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  unique (organization_id, manager_user_id, client_user_id),
  check (manager_user_id <> client_user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  kind text not null,
  storage_path text not null,
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
  platform text not null,
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
  platform text not null,
  period_start date,
  period_end date,
  paid_on date,
  gross_amount numeric(12,2),
  fees_amount numeric(12,2),
  retention_amount numeric(12,2),
  net_amount numeric(12,2) not null,
  currency text not null default 'EUR',
  status text not null check (status in ('expected','paid','partial','disputed')),
  external_id text,
  evidence_document_id uuid references public.documents(id) on delete set null,
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
  merchant text not null,
  category text not null,
  total_amount numeric(12,2) not null check (total_amount > 0),
  currency text not null default 'EUR',
  vat_rate numeric(6,3),
  vat_amount numeric(12,2),
  source_document_id uuid references public.documents(id) on delete set null,
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
  title text not null,
  description text not null,
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
  body text not null check (char_length(body) between 1 and 10000),
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
  reference text not null,
  filed_at timestamptz not null,
  document_id uuid not null references public.documents(id),
  source text not null check (source in ('user_upload','manager_upload','aeat_import')),
  verification_status public.labora_filing_verification_status not null default 'pending',
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
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

-- Updated-at trigger
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

-- Authorization helpers. Policies never trust auth.users user_metadata.
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
    target_user = auth.uid()
    or exists (
      select 1
      from public.manager_client_links l
      where l.organization_id = target_org
        and l.manager_user_id = auth.uid()
        and l.client_user_id = target_user
        and l.status = 'active'
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

-- Account bootstrap: creates a clean personal organization. Manager/rider is
-- an application role only; authorization still comes from memberships/links.
create or replace function public.labora_bootstrap_account(account_name text, account_kind text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org uuid;
  membership_role public.labora_membership_role;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if account_kind not in ('rider','manager') then
    raise exception 'invalid account kind';
  end if;
  if exists (select 1 from public.organization_memberships where user_id = auth.uid() and status = 'active') then
    raise exception 'account already bootstrapped';
  end if;

  membership_role := case when account_kind = 'manager' then 'owner'::public.labora_membership_role else 'rider'::public.labora_membership_role end;
  insert into public.organizations (name, created_by)
  values (nullif(trim(account_name), ''), auth.uid())
  returning id into new_org;

  insert into public.organization_memberships (organization_id, user_id, role, status, created_by)
  values (new_org, auth.uid(), membership_role, 'active', auth.uid());

  return new_org;
end;
$$;

-- New auth users receive only a private profile shell; no authorization role is
-- copied from user-editable metadata.
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

-- Immutable audit helper.
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
  org_id := coalesce(new.organization_id, old.organization_id);
  row_id := coalesce(new.id, old.id);
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id)
  values (org_id, auth.uid(), tg_op, tg_table_name, row_id);
  return coalesce(new, old);
end;
$$;

create trigger audit_documents after insert or update or delete on public.documents for each row execute function public.labora_audit_row();
create trigger audit_incomes after insert or update or delete on public.incomes for each row execute function public.labora_audit_row();
create trigger audit_platform_payouts after insert or update or delete on public.platform_payouts for each row execute function public.labora_audit_row();
create trigger audit_expenses after insert or update or delete on public.expenses for each row execute function public.labora_audit_row();
create trigger audit_expense_reviews after insert or update or delete on public.expense_reviews for each row execute function public.labora_audit_row();
create trigger audit_requirements after insert or update or delete on public.manager_requirements for each row execute function public.labora_audit_row();
create trigger audit_filing_evidence after insert or update or delete on public.filing_evidence for each row execute function public.labora_audit_row();

-- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.manager_client_links enable row level security;
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
);
create policy profiles_update_self on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy organizations_select_member on public.organizations for select to authenticated using (public.labora_is_org_member(id));
create policy memberships_select_same_org on public.organization_memberships for select to authenticated using (public.labora_is_org_member(organization_id));

create policy links_select_participant on public.manager_client_links for select to authenticated
using (manager_user_id = auth.uid() or client_user_id = auth.uid());

create policy documents_select_authorized on public.documents for select to authenticated using (public.labora_can_access_client(organization_id, user_id));
create policy documents_insert_authorized on public.documents for insert to authenticated with check (uploaded_by = auth.uid() and public.labora_can_access_client(organization_id, user_id));
create policy documents_delete_owner on public.documents for delete to authenticated using (user_id = auth.uid());

create policy incomes_select_authorized on public.incomes for select to authenticated using (public.labora_can_access_client(organization_id, user_id));
create policy incomes_insert_owner on public.incomes for insert to authenticated with check (user_id = auth.uid() and created_by = auth.uid() and public.labora_is_org_member(organization_id));
create policy incomes_update_owner on public.incomes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy incomes_delete_owner on public.incomes for delete to authenticated using (user_id = auth.uid());

create policy payouts_select_authorized on public.platform_payouts for select to authenticated using (public.labora_can_access_client(organization_id, user_id));
create policy payouts_insert_owner on public.platform_payouts for insert to authenticated with check (user_id = auth.uid() and public.labora_is_org_member(organization_id));
create policy payouts_update_owner on public.platform_payouts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy payouts_delete_owner on public.platform_payouts for delete to authenticated using (user_id = auth.uid());

create policy expenses_select_authorized on public.expenses for select to authenticated using (public.labora_can_access_client(organization_id, user_id));
create policy expenses_insert_owner on public.expenses for insert to authenticated with check (user_id = auth.uid() and created_by = auth.uid() and public.labora_is_org_member(organization_id));
create policy expenses_update_owner on public.expenses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy expenses_delete_owner on public.expenses for delete to authenticated using (user_id = auth.uid());

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
create policy expense_reviews_update_manager on public.expense_reviews for update to authenticated using (manager_user_id = auth.uid()) with check (manager_user_id = auth.uid());

create policy requirements_select_participant on public.manager_requirements for select to authenticated
using (manager_user_id = auth.uid() or client_user_id = auth.uid());
create policy requirements_insert_manager on public.manager_requirements for insert to authenticated
with check (
  manager_user_id = auth.uid()
  and public.labora_is_org_manager(organization_id)
  and public.labora_can_access_client(organization_id, client_user_id)
);
create policy requirements_update_participant on public.manager_requirements for update to authenticated
using (manager_user_id = auth.uid() or client_user_id = auth.uid())
with check (manager_user_id = manager_user_id and (manager_user_id = auth.uid() or client_user_id = auth.uid()));

create policy messages_select_participant on public.messages for select to authenticated using (sender_user_id = auth.uid() or recipient_user_id = auth.uid());
create policy messages_insert_sender on public.messages for insert to authenticated
with check (
  sender_user_id = auth.uid()
  and public.labora_can_access_client(organization_id, recipient_user_id)
  and public.labora_is_org_member(organization_id)
);
create policy messages_update_recipient on public.messages for update to authenticated using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

create policy tax_periods_select_authorized on public.tax_periods for select to authenticated using (public.labora_can_access_client(organization_id, user_id));
create policy tax_periods_insert_owner on public.tax_periods for insert to authenticated with check (user_id = auth.uid() and public.labora_is_org_member(organization_id));
create policy tax_periods_update_owner on public.tax_periods for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy filing_evidence_select_authorized on public.filing_evidence for select to authenticated using (public.labora_can_access_client(organization_id, user_id));
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
);
create policy filing_evidence_verify_manager on public.filing_evidence for update to authenticated
using (public.labora_is_org_manager(organization_id) and public.labora_can_access_client(organization_id, user_id))
with check (public.labora_is_org_manager(organization_id) and public.labora_can_access_client(organization_id, user_id));

create policy audit_events_select_authorized on public.audit_events for select to authenticated using (public.labora_is_org_member(organization_id));

-- Explicit grants for Data API exposure. RLS remains the authorization boundary.
revoke all on all tables in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select on public.organizations, public.organization_memberships, public.manager_client_links to authenticated;
grant select, insert, delete on public.documents to authenticated;
grant select, insert, update, delete on public.incomes, public.platform_payouts, public.expenses to authenticated;
grant select, insert, update on public.expense_reviews, public.manager_requirements, public.messages, public.tax_periods, public.filing_evidence to authenticated;
grant select on public.audit_events to authenticated;
grant execute on function public.labora_bootstrap_account(text, text) to authenticated;

-- Private fiscal evidence bucket. Object names must follow:
-- <organization_uuid>/<user_uuid>/<opaque-file-name>
insert into storage.buckets (id, name, public)
values ('fiscal-evidence', 'fiscal-evidence', false)
on conflict (id) do update set public = false;

create policy fiscal_evidence_select on storage.objects for select to authenticated
using (bucket_id = 'fiscal-evidence' and public.labora_storage_path_authorized(name));
create policy fiscal_evidence_insert on storage.objects for insert to authenticated
with check (bucket_id = 'fiscal-evidence' and public.labora_storage_path_authorized(name));
create policy fiscal_evidence_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'fiscal-evidence'
  and split_part(name, '/', 2) = auth.uid()::text
);
