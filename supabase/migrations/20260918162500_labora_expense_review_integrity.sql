-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Separates rider-owned expense facts from gestor-controlled review fields.

drop policy if exists expenses_update_owner_or_manager on public.expenses;
drop policy if exists expenses_update_self on public.expenses;

create policy expenses_update_self
on public.expenses
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function private.enforce_expense_review_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending_review';
    new.gestor_notes := null;
    new.deductible_percentage := 0;
    return new;
  end if;

  if auth.uid() = new.user_id and (
    old.category is distinct from new.category
    or old.merchant is distinct from new.merchant
    or old.date is distinct from new.date
    or old.amount is distinct from new.amount
    or old.receipt_url is distinct from new.receipt_url
    or old.receipt_hash is distinct from new.receipt_hash
    or old.receipt_mime_type is distinct from new.receipt_mime_type
    or old.notes is distinct from new.notes
    or old.is_recurring is distinct from new.is_recurring
    or old.vat_rate is distinct from new.vat_rate
    or old.vat_amount is distinct from new.vat_amount
    or old.fuel_litres is distinct from new.fuel_litres
    or old.fuel_type is distinct from new.fuel_type
    or old.invoice_number is distinct from new.invoice_number
    or old.ocr_confidence is distinct from new.ocr_confidence
    or old.ocr_needs_review is distinct from new.ocr_needs_review
    or old.ocr_uncertain_fields is distinct from new.ocr_uncertain_fields
  ) then
    new.status := 'pending_review';
    new.gestor_notes := null;
    new.deductible_percentage := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists expenses_review_integrity on public.expenses;
create trigger expenses_review_integrity
before insert or update on public.expenses
for each row
execute function private.enforce_expense_review_integrity();

create or replace function private.review_expense_internal(
  p_expense_id text,
  p_status text,
  p_note text default null,
  p_deductible_percentage numeric default 0
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_user uuid;
  safe_percentage numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_status not in ('pending_review','approved','rejected','needs_fix') then
    raise exception 'Unsupported expense status';
  end if;

  safe_percentage := coalesce(p_deductible_percentage, 0);
  if safe_percentage < 0 or safe_percentage > 100 then
    raise exception 'Invalid deductible percentage';
  end if;

  select e.user_id into target_user
  from public.expenses e
  where e.id = p_expense_id;

  if target_user is null then raise exception 'Expense not found'; end if;
  if not private.is_manager_of(target_user) then
    raise exception 'Not authorized to review this expense';
  end if;

  update public.expenses
  set
    status = p_status,
    gestor_notes = nullif(trim(coalesce(p_note, '')), ''),
    deductible_percentage = case when p_status = 'rejected' then 0 else safe_percentage end
  where id = p_expense_id;
end;
$$;

revoke all on function private.review_expense_internal(text,text,text,numeric) from public, anon;
grant execute on function private.review_expense_internal(text,text,text,numeric) to authenticated;

create or replace function public.review_expense(
  p_expense_id text,
  p_status text,
  p_note text default null,
  p_deductible_percentage numeric default 0
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.review_expense_internal(
    p_expense_id,
    p_status,
    p_note,
    p_deductible_percentage
  );
$$;

revoke all on function public.review_expense(text,text,text,numeric) from public, anon;
grant execute on function public.review_expense(text,text,text,numeric) to authenticated;

revoke update on table public.expenses from anon, authenticated;
grant update (
  category,
  merchant,
  date,
  amount,
  receipt_url,
  notes,
  is_recurring,
  vat_rate,
  vat_amount,
  fuel_litres,
  fuel_type,
  invoice_number,
  receipt_hash,
  receipt_mime_type,
  ocr_confidence,
  ocr_needs_review,
  ocr_uncertain_fields
) on table public.expenses to authenticated;
