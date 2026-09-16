-- Currency integrity guard for Labora+.
-- The browser is not authoritative for the currency of a financial row.
-- Currency is derived from the account owner's profile country on every write.
-- Unknown markets fail closed to ISO 4217 XXX instead of guessing USD/EUR.

create or replace function public.labora_currency_for_country(country_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case upper(coalesce(country_code, ''))
    when 'ES' then 'EUR'
    when 'PT' then 'EUR'
    when 'FR' then 'EUR'
    when 'IT' then 'EUR'
    when 'DE' then 'EUR'
    when 'NL' then 'EUR'
    when 'BE' then 'EUR'
    when 'IE' then 'EUR'
    when 'AT' then 'EUR'
    when 'GR' then 'EUR'
    when 'FI' then 'EUR'
    when 'PL' then 'PLN'
    when 'CZ' then 'CZK'
    when 'RO' then 'RON'
    when 'SE' then 'SEK'
    when 'NO' then 'NOK'
    when 'DK' then 'DKK'
    when 'GB' then 'GBP'
    when 'US' then 'USD'
    when 'CA' then 'CAD'
    when 'MX' then 'MXN'
    when 'CO' then 'COP'
    when 'VE' then 'VES'
    when 'AR' then 'ARS'
    when 'CL' then 'CLP'
    when 'PE' then 'PEN'
    when 'BR' then 'BRL'
    when 'UY' then 'UYU'
    when 'EC' then 'USD'
    when 'CR' then 'CRC'
    when 'PA' then 'USD'
    when 'AU' then 'AUD'
    when 'NZ' then 'NZD'
    when 'AE' then 'AED'
    when 'JP' then 'JPY'
    when 'IN' then 'INR'
    else 'XXX'
  end;
$$;

create or replace function public.labora_apply_profile_currency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_country text;
begin
  select p.country_code
    into profile_country
    from public.profiles p
   where p.user_id = new.user_id;

  if profile_country is null then
    raise exception 'Cannot resolve profile country for financial record';
  end if;

  new.currency := public.labora_currency_for_country(profile_country);
  return new;
end;
$$;

-- Recreate defensively so migration is idempotent during development.
drop trigger if exists incomes_profile_currency on public.incomes;
create trigger incomes_profile_currency
before insert or update of currency, user_id on public.incomes
for each row execute function public.labora_apply_profile_currency();

drop trigger if exists expenses_profile_currency on public.expenses;
create trigger expenses_profile_currency
before insert or update of currency, user_id on public.expenses
for each row execute function public.labora_apply_profile_currency();

drop trigger if exists payouts_profile_currency on public.platform_payouts;
create trigger payouts_profile_currency
before insert or update of currency, user_id on public.platform_payouts
for each row execute function public.labora_apply_profile_currency();

comment on function public.labora_apply_profile_currency() is
  'Overrides client-supplied currency with the currency derived from the financial record owner profile country.';
