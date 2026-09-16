-- Separate documentary review from fiscal deductibility assessment.
-- A reviewed receipt is not automatically a deductible expense.
-- Labora+ never supplies a legal percentage; an advisor must explicitly assess it.

alter table public.expense_reviews
  add column if not exists deductibility_assessed boolean not null default false,
  add column if not exists deductibility_basis text;

create or replace function private.labora_guard_expense_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_country text;
  expense_owner uuid;
  expense_org uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if new.manager_user_id <> auth.uid() then raise exception 'review actor mismatch'; end if;

  select e.user_id, e.organization_id, upper(trim(coalesce(p.country_code, 'ZZ')))
    into expense_owner, expense_org, owner_country
    from public.expenses e
    join public.profiles p on p.user_id = e.user_id
   where e.id = new.expense_id;

  if expense_owner is null then raise exception 'expense not found'; end if;
  if expense_org <> new.organization_id then raise exception 'expense workspace mismatch'; end if;
  if not private.labora_can_access_client(expense_org, expense_owner) then raise exception 'not linked to client'; end if;

  if new.status <> 'approved' then
    new.deductibility_assessed := false;
    new.deductible_percent := 0;
    new.deductibility_basis := null;
    return new;
  end if;

  if not new.deductibility_assessed then
    new.deductible_percent := 0;
    new.deductibility_basis := null;
    return new;
  end if;

  if owner_country <> 'ES' then
    raise exception 'fiscal deductibility assessment is not enabled for this market';
  end if;

  if new.deductible_percent < 0 or new.deductible_percent > 100 then
    raise exception 'deductible percent must be between 0 and 100';
  end if;

  if nullif(trim(coalesce(new.deductibility_basis, '')), '') is null then
    raise exception 'deductibility basis is required for an assessed percentage';
  end if;

  new.deductibility_basis := trim(new.deductibility_basis);
  return new;
end;
$$;

drop trigger if exists expense_reviews_fiscal_guard on public.expense_reviews;
create trigger expense_reviews_fiscal_guard
before insert or update on public.expense_reviews
for each row execute function private.labora_guard_expense_review();

revoke execute on function private.labora_guard_expense_review() from public, anon, authenticated;

comment on column public.expense_reviews.deductibility_assessed is
  'True only when the linked advisor explicitly assessed fiscal deductibility; evidence approval alone leaves this false.';
comment on column public.expense_reviews.deductibility_basis is
  'Advisor-provided basis for an explicit deductibility percentage. Labora+ does not auto-generate this conclusion.';
