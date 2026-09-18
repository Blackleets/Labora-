-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Keeps new expenses fiscally neutral and fixes connected Storage reads.

alter table public.expenses
  alter column vat_rate set default 0,
  alter column vat_amount set default 0,
  alter column deductible_percentage set default 0;

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists labora_identity_select_connected on storage.objects;
create policy labora_identity_select_connected
on storage.objects
for select
to authenticated
using (
  bucket_id = 'labora-identity'
  and exists (
    select 1
    from public.profiles p
    where p.id::text = (storage.foldername(storage.objects.name))[1]
      and private.can_access_profile(p.id)
  )
);

drop policy if exists labora_documents_connected_read on storage.objects;
create policy labora_documents_connected_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'labora-documents'
  and (
    (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.profiles target
      where target.id::text = (storage.foldername(storage.objects.name))[1]
        and target.manager_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.profiles me
      where me.id = (select auth.uid())
        and me.manager_id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);
