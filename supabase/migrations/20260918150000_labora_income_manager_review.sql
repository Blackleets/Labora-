-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Adds an audited, narrow gestor review path for imported incomes.

alter table public.incomes
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

create index if not exists incomes_reviewed_by_idx
  on public.incomes(reviewed_by)
  where reviewed_by is not null;

create or replace function public.review_income(
  p_income_id text,
  p_action text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_user uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_action not in ('reviewed', 'needs_fix') then
    raise exception 'Unsupported review action';
  end if;

  select i.user_id
    into target_user
  from public.incomes i
  where i.id = p_income_id;

  if target_user is null then
    raise exception 'Income not found';
  end if;

  if not private.is_manager_of(target_user) then
    raise exception 'Not authorized to review this income';
  end if;

  update public.incomes
  set
    needs_review = (p_action = 'needs_fix'),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_income_id;
end;
$$;

revoke all on function public.review_income(text, text, text) from public;
grant execute on function public.review_income(text, text, text) to authenticated;
