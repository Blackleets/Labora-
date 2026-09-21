-- PostgreSQL executes same-event triggers alphabetically. Ensure tombstone
-- rejection happens before the legacy income-document owner validator.

drop trigger if exists expenses_lock_write_tombstone on public.expenses;
drop trigger if exists expenses_reject_tombstoned_write on public.expenses;
drop trigger if exists aa_expenses_lock_write_tombstone on public.expenses;
drop trigger if exists ab_expenses_reject_tombstoned_write on public.expenses;
create trigger aa_expenses_lock_write_tombstone before insert or update of id, user_id on public.expenses
for each row execute function private.lock_operational_entity('expenses');
create trigger ab_expenses_reject_tombstoned_write before insert or update of id, user_id on public.expenses
for each row execute function private.reject_tombstoned_operational_write('expenses');

drop trigger if exists incomes_lock_write_tombstone on public.incomes;
drop trigger if exists incomes_reject_tombstoned_write on public.incomes;
drop trigger if exists aa_incomes_lock_write_tombstone on public.incomes;
drop trigger if exists ab_incomes_reject_tombstoned_write on public.incomes;
create trigger aa_incomes_lock_write_tombstone before insert or update of id, user_id on public.incomes
for each row execute function private.lock_operational_entity('incomes');
create trigger ab_incomes_reject_tombstoned_write before insert or update of id, user_id on public.incomes
for each row execute function private.reject_tombstoned_operational_write('incomes');

drop trigger if exists documents_lock_write_tombstone on public.documents;
drop trigger if exists documents_reject_tombstoned_write on public.documents;
drop trigger if exists aa_documents_lock_write_tombstone on public.documents;
drop trigger if exists ab_documents_reject_tombstoned_write on public.documents;
create trigger aa_documents_lock_write_tombstone before insert or update of id, user_id on public.documents
for each row execute function private.lock_operational_entity('documents');
create trigger ab_documents_reject_tombstoned_write before insert or update of id, user_id on public.documents
for each row execute function private.reject_tombstoned_operational_write('documents');
