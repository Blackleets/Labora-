-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Priority 2: explicit, auditable tax declaration state machine.

alter table public.tax_declarations
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists filed_by uuid references public.profiles(id) on delete set null,
  add column if not exists filing_document_id text references public.documents(id) on delete set null,
  add column if not exists filing_recorded_at timestamptz;

create index if not exists tax_declarations_reviewed_by_idx
  on public.tax_declarations(reviewed_by) where reviewed_by is not null;
create index if not exists tax_declarations_filed_by_idx
  on public.tax_declarations(filed_by) where filed_by is not null;
create index if not exists tax_declarations_filing_document_idx
  on public.tax_declarations(filing_document_id) where filing_document_id is not null;

drop policy if exists tax_declarations_insert_owner_or_manager on public.tax_declarations;
drop policy if exists tax_declarations_update_owner_or_manager on public.tax_declarations;

revoke insert, update, delete, truncate on table public.tax_declarations from anon, authenticated;
revoke select on table public.tax_declarations from anon;
grant select on table public.tax_declarations to authenticated;

create or replace function private.enforce_tax_declaration_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Tax declaration must start as draft';
    end if;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    new.filing_reference := null;
    new.filed_at := null;
    new.filed_by := null;
    new.filing_document_id := null;
    new.filing_recorded_at := null;
    new.gestor_id := null;
    return new;
  end if;

  if old.id is distinct from new.id or old.user_id is distinct from new.user_id then
    raise exception 'Tax declaration identity is immutable';
  end if;

  if old.status = 'filed_with_tax_agency' then
    if to_jsonb(old) is distinct from to_jsonb(new) then
      raise exception 'Filed tax declarations are immutable';
    end if;
    return new;
  end if;

  if old.status = new.status then
    if old.status <> 'draft' then
      if to_jsonb(old) is distinct from to_jsonb(new) then
        raise exception 'Reviewed tax declarations require an explicit transition';
      end if;
      return new;
    end if;

    if not (auth.uid() = old.user_id or private.is_manager_of(old.user_id)) then
      raise exception 'Not authorized to edit this draft';
    end if;

    if old.reviewed_by is distinct from new.reviewed_by
       or old.reviewed_at is distinct from new.reviewed_at
       or old.review_note is distinct from new.review_note
       or old.filing_reference is distinct from new.filing_reference
       or old.filed_at is distinct from new.filed_at
       or old.filed_by is distinct from new.filed_by
       or old.filing_document_id is distinct from new.filing_document_id
       or old.filing_recorded_at is distinct from new.filing_recorded_at
       or old.gestor_id is distinct from new.gestor_id then
      raise exception 'Draft cannot set review or filing metadata';
    end if;
    return new;
  end if;

  if old.status = 'draft' and new.status = 'reviewed_by_gestor' then
    if not private.is_manager_of(old.user_id) then
      raise exception 'Only the linked manager can review this declaration';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
    new.gestor_id := auth.uid();
    new.filing_reference := null;
    new.filed_at := null;
    new.filed_by := null;
    new.filing_document_id := null;
    new.filing_recorded_at := null;
    return new;
  end if;

  if old.status = 'reviewed_by_gestor' and new.status = 'filed_with_tax_agency' then
    if not private.is_manager_of(old.user_id) then
      raise exception 'Only the linked manager can record filing';
    end if;
    if nullif(btrim(coalesce(new.filing_reference, '')), '') is null
       and new.filing_document_id is null then
      raise exception 'Filing reference or evidence document is required';
    end if;
    if new.filing_document_id is not null and not exists (
      select 1 from public.documents d
      where d.id = new.filing_document_id and d.user_id = old.user_id
    ) then
      raise exception 'Filing evidence must belong to the declaration owner';
    end if;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;
    new.filed_by := auth.uid();
    new.filing_recorded_at := now();
    new.gestor_id := auth.uid();
    if new.filed_at is null then new.filed_at := current_date; end if;
    return new;
  end if;

  raise exception 'Unsupported tax declaration state transition';
end;
$$;

drop trigger if exists tax_declarations_integrity on public.tax_declarations;
create trigger tax_declarations_integrity
before insert or update on public.tax_declarations
for each row execute function private.enforce_tax_declaration_integrity();

create or replace function private.save_tax_declaration_draft_internal(
  p_id text,
  p_user_id uuid,
  p_quarter text,
  p_year integer,
  p_model_type text,
  p_title text,
  p_gross_income numeric default 0,
  p_deductible_expenses numeric default 0,
  p_net_yield numeric default 0,
  p_tax_amount numeric default 0
)
returns public.tax_declarations
language plpgsql
security definer
set search_path = public, private
as $$
declare target public.tax_declarations;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not (auth.uid() = p_user_id or private.is_manager_of(p_user_id)) then
    raise exception 'Not authorized for this declaration owner';
  end if;
  if p_model_type not in ('130','303','390','100','036_037') then
    raise exception 'Unsupported tax model';
  end if;
  if p_year < 2000 or p_year > 2100 then raise exception 'Invalid tax year'; end if;
  if nullif(btrim(coalesce(p_quarter,'')), '') is null then raise exception 'Quarter is required'; end if;
  if nullif(btrim(coalesce(p_title,'')), '') is null then raise exception 'Title is required'; end if;

  select * into target
  from public.tax_declarations
  where id = p_id
  for update;

  if found then
    if target.user_id <> p_user_id then raise exception 'Declaration owner mismatch'; end if;
    if target.status <> 'draft' then raise exception 'Only draft declarations can be edited'; end if;

    update public.tax_declarations
    set quarter = p_quarter,
        year = p_year,
        model_type = p_model_type,
        title = btrim(p_title),
        gross_income = coalesce(p_gross_income,0),
        deductible_expenses = coalesce(p_deductible_expenses,0),
        net_yield = coalesce(p_net_yield,0),
        tax_amount = coalesce(p_tax_amount,0),
        updated_at = now()
    where id = p_id
    returning * into target;
    return target;
  end if;

  insert into public.tax_declarations (
    id,user_id,quarter,year,model_type,title,gross_income,deductible_expenses,
    net_yield,tax_amount,status,updated_at
  ) values (
    p_id,p_user_id,p_quarter,p_year,p_model_type,btrim(p_title),
    coalesce(p_gross_income,0),coalesce(p_deductible_expenses,0),
    coalesce(p_net_yield,0),coalesce(p_tax_amount,0),'draft',now()
  ) returning * into target;
  return target;
end;
$$;

create or replace function private.review_tax_declaration_internal(
  p_declaration_id text,
  p_note text default null
)
returns public.tax_declarations
language plpgsql
security definer
set search_path = public, private
as $$
declare target public.tax_declarations;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target from public.tax_declarations
  where id = p_declaration_id for update;
  if not found then raise exception 'Tax declaration not found'; end if;
  if not private.is_manager_of(target.user_id) then raise exception 'Not authorized to review this declaration'; end if;
  if target.status = 'reviewed_by_gestor' then return target; end if;
  if target.status <> 'draft' then raise exception 'Only draft declarations can be reviewed'; end if;

  update public.tax_declarations
  set status = 'reviewed_by_gestor',
      review_note = nullif(btrim(coalesce(p_note,'')), ''),
      updated_at = now()
  where id = p_declaration_id
  returning * into target;
  return target;
end;
$$;

create or replace function private.file_tax_declaration_internal(
  p_declaration_id text,
  p_filing_reference text default null,
  p_filed_at date default null,
  p_filing_document_id text default null
)
returns public.tax_declarations
language plpgsql
security definer
set search_path = public, private
as $$
declare target public.tax_declarations;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target from public.tax_declarations
  where id = p_declaration_id for update;
  if not found then raise exception 'Tax declaration not found'; end if;
  if not private.is_manager_of(target.user_id) then raise exception 'Not authorized to file this declaration'; end if;
  if target.status = 'filed_with_tax_agency' then return target; end if;
  if target.status <> 'reviewed_by_gestor' then raise exception 'Declaration must be reviewed before filing'; end if;
  if nullif(btrim(coalesce(p_filing_reference,'')), '') is null and p_filing_document_id is null then
    raise exception 'Filing reference or evidence document is required';
  end if;

  update public.tax_declarations
  set status = 'filed_with_tax_agency',
      filing_reference = nullif(btrim(coalesce(p_filing_reference,'')), ''),
      filed_at = coalesce(p_filed_at,current_date),
      filing_document_id = p_filing_document_id,
      updated_at = now()
  where id = p_declaration_id
  returning * into target;
  return target;
end;
$$;

grant usage on schema private to authenticated;
revoke all on function private.enforce_tax_declaration_integrity() from public, anon;
revoke all on function private.save_tax_declaration_draft_internal(text,uuid,text,integer,text,text,numeric,numeric,numeric,numeric) from public, anon;
revoke all on function private.review_tax_declaration_internal(text,text) from public, anon;
revoke all on function private.file_tax_declaration_internal(text,text,date,text) from public, anon;
grant execute on function private.save_tax_declaration_draft_internal(text,uuid,text,integer,text,text,numeric,numeric,numeric,numeric) to authenticated;
grant execute on function private.review_tax_declaration_internal(text,text) to authenticated;
grant execute on function private.file_tax_declaration_internal(text,text,date,text) to authenticated;

create or replace function public.save_tax_declaration_draft(
  p_id text,
  p_user_id uuid,
  p_quarter text,
  p_year integer,
  p_model_type text,
  p_title text,
  p_gross_income numeric default 0,
  p_deductible_expenses numeric default 0,
  p_net_yield numeric default 0,
  p_tax_amount numeric default 0
)
returns public.tax_declarations
language sql security invoker
set search_path = public, private
as $$ select private.save_tax_declaration_draft_internal(p_id,p_user_id,p_quarter,p_year,p_model_type,p_title,p_gross_income,p_deductible_expenses,p_net_yield,p_tax_amount); $$;

create or replace function public.review_tax_declaration(
  p_declaration_id text,
  p_note text default null
)
returns public.tax_declarations
language sql security invoker
set search_path = public, private
as $$ select private.review_tax_declaration_internal(p_declaration_id,p_note); $$;

create or replace function public.file_tax_declaration(
  p_declaration_id text,
  p_filing_reference text default null,
  p_filed_at date default null,
  p_filing_document_id text default null
)
returns public.tax_declarations
language sql security invoker
set search_path = public, private
as $$ select private.file_tax_declaration_internal(p_declaration_id,p_filing_reference,p_filed_at,p_filing_document_id); $$;

revoke all on function public.save_tax_declaration_draft(text,uuid,text,integer,text,text,numeric,numeric,numeric,numeric) from public, anon;
revoke all on function public.review_tax_declaration(text,text) from public, anon;
revoke all on function public.file_tax_declaration(text,text,date,text) from public, anon;
grant execute on function public.save_tax_declaration_draft(text,uuid,text,integer,text,text,numeric,numeric,numeric,numeric) to authenticated;
grant execute on function public.review_tax_declaration(text,text) to authenticated;
grant execute on function public.file_tax_declaration(text,text,date,text) to authenticated;
