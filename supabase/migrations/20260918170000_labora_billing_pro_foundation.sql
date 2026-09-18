-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Revenue foundation: Stripe-backed Pro entitlement.
-- Browser clients can read only their own billing row and cannot grant themselves Pro.

create table if not exists public.billing_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'inactive' check (
    status in ('inactive','incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused')
  ),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_stripe_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_accounts enable row level security;

drop policy if exists billing_accounts_select_self on public.billing_accounts;
create policy billing_accounts_select_self
on public.billing_accounts
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all privileges on table public.billing_accounts from anon;
revoke insert, update, delete, truncate, references, trigger on table public.billing_accounts from authenticated;
grant select on table public.billing_accounts to authenticated;

insert into public.billing_accounts(user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function private.initialize_billing_account()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.billing_accounts(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.initialize_billing_account() from public, anon, authenticated;

drop trigger if exists profiles_initialize_billing_account on public.profiles;
create trigger profiles_initialize_billing_account
after insert on public.profiles
for each row execute function private.initialize_billing_account();

create or replace function public.my_billing_entitlement()
returns table (
  plan text,
  status text,
  pro_active boolean,
  current_period_end timestamptz,
  cancel_at_period_end boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    b.plan,
    b.status,
    (
      b.plan = 'pro'
      and b.status in ('active','trialing')
      and (b.current_period_end is null or b.current_period_end > now())
    ) as pro_active,
    b.current_period_end,
    b.cancel_at_period_end
  from public.billing_accounts b
  where b.user_id = auth.uid();
$$;

revoke all on function public.my_billing_entitlement() from public, anon;
grant execute on function public.my_billing_entitlement() to authenticated;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;
revoke all privileges on table public.stripe_webhook_events from anon, authenticated;
