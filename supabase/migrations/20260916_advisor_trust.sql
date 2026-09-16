-- Labora+ advisor trust model
-- Registration never implies verification.
-- Verification status may only be promoted by a trusted server/admin workflow.

DO $$ BEGIN
  CREATE TYPE public.labora_advisor_verification_kind AS ENUM ('identity', 'business', 'professional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.labora_verification_state AS ENUM ('pending', 'verified', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.labora_advisor_trust_level AS ENUM ('registered', 'identity_verified', 'business_verified', 'professional_verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists public.advisor_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null,
  verification_kind public.labora_advisor_verification_kind not null,
  state public.labora_verification_state not null default 'pending',
  declared_issuer text,
  declared_identifier text,
  evidence_document_id uuid references public.documents(id) on delete restrict,
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advisor_verification_verified_requires_review check (
    state <> 'verified' or (reviewed_at is not null and reviewed_by is not null)
  )
);

create index if not exists advisor_verification_requests_user_idx
  on public.advisor_verification_requests(user_id, created_at desc);

create table if not exists public.advisor_trust_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  country_code text not null,
  level public.labora_advisor_trust_level not null default 'registered',
  identity_verified_at timestamptz,
  business_verified_at timestamptz,
  professional_verified_at timestamptz,
  professional_issuer text,
  professional_identifier text,
  verified_client_relationships integer not null default 0 check (verified_client_relationships >= 0),
  updated_at timestamptz not null default now(),
  constraint advisor_trust_level_evidence check (
    (level = 'registered')
    or (level = 'identity_verified' and identity_verified_at is not null)
    or (level = 'business_verified' and identity_verified_at is not null and business_verified_at is not null)
    or (level = 'professional_verified' and identity_verified_at is not null and professional_verified_at is not null)
  )
);

alter table public.advisor_verification_requests enable row level security;
alter table public.advisor_trust_profiles enable row level security;

create policy "advisor verification select own"
  on public.advisor_verification_requests
  for select
  using (auth.uid() = user_id);

create policy "advisor verification submit own"
  on public.advisor_verification_requests
  for insert
  with check (
    auth.uid() = user_id
    and state = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.role in ('owner', 'manager')
    )
  );

-- No client-side UPDATE/DELETE policies are created intentionally.
-- Promotion/rejection must be performed by a trusted server/admin workflow.

create policy "advisor trust select self"
  on public.advisor_trust_profiles
  for select
  using (auth.uid() = user_id);

create policy "advisor trust select linked client"
  on public.advisor_trust_profiles
  for select
  using (
    exists (
      select 1
      from public.manager_client_links link
      where link.manager_user_id = advisor_trust_profiles.user_id
        and link.client_user_id = auth.uid()
        and link.status = 'active'
    )
  );

-- There are intentionally no INSERT/UPDATE/DELETE policies for advisor_trust_profiles.
-- A trusted backend process derives this table from verified evidence.

comment on table public.advisor_verification_requests is
  'Private evidence-backed verification cases. Advisors can submit but cannot self-verify.';

comment on table public.advisor_trust_profiles is
  'Public-safe advisor trust snapshot visible only to the advisor and actively linked clients.';
