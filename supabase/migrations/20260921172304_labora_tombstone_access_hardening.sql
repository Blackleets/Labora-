-- Tombstones are internal trigger state. Browser roles must not read or mutate them.
revoke all on table public.operational_deletion_tombstones from anon, authenticated;

drop policy if exists operational_tombstones_client_deny on public.operational_deletion_tombstones;
create policy operational_tombstones_client_deny
on public.operational_deletion_tombstones
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists operational_deletion_tombstones_user_id_idx
on public.operational_deletion_tombstones (user_id);
