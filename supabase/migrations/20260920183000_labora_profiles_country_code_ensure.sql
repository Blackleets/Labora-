-- Ensure profiles.country_code exists (idempotent). Already present on live project
-- gggtriyvbusbpqohoukv since earlier profile migrations; this keeps fresh clones aligned.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'ES';

COMMENT ON COLUMN public.profiles.country_code IS
  'ISO-3166-1 alpha-2 operating country for the profile (e.g. ES, MX). Not a tax-rate table.';
