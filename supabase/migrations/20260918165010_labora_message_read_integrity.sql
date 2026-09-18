-- Applied to Supabase project gggtriyvbusbpqohoukv on 2026-09-18.
-- Priority 3: recipients may only mark their own received messages as read.

drop policy if exists messages_update_recipient on public.messages;

revoke update, delete, truncate on table public.messages from anon, authenticated;
revoke select, insert on table public.messages from anon;
grant select, insert on table public.messages to authenticated;

create or replace function private.enforce_message_immutability()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.id is distinct from new.id
     or old.sender_id is distinct from new.sender_id
     or old.recipient_id is distinct from new.recipient_id
     or old.message is distinct from new.message
     or old.type is distinct from new.type
     or old.created_at is distinct from new.created_at then
    raise exception 'Message content and identity are immutable';
  end if;

  if auth.uid() <> old.recipient_id then
    raise exception 'Only the recipient may update read state';
  end if;

  if old.status = 'read' and new.status = 'read' then return new; end if;
  if old.status = 'sent' and new.status = 'read' then return new; end if;

  raise exception 'Unsupported message status transition';
end;
$$;

drop trigger if exists messages_immutability on public.messages;
create trigger messages_immutability
before update on public.messages
for each row execute function private.enforce_message_immutability();

create or replace function private.mark_message_read_internal(p_message_id text)
returns public.messages
language plpgsql
security definer
set search_path = public, private
as $$
declare target public.messages;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into target
  from public.messages
  where id = p_message_id
    and recipient_id = auth.uid()
  for update;

  if not found then raise exception 'Message not found'; end if;
  if target.status = 'read' then return target; end if;
  if target.status <> 'sent' then raise exception 'Message cannot be marked read'; end if;

  update public.messages
  set status = 'read'
  where id = p_message_id
  returning * into target;

  return target;
end;
$$;

grant usage on schema private to authenticated;
revoke all on function private.enforce_message_immutability() from public, anon;
revoke all on function private.mark_message_read_internal(text) from public, anon;
grant execute on function private.mark_message_read_internal(text) to authenticated;

create or replace function public.mark_message_read(p_message_id text)
returns public.messages
language sql
security invoker
set search_path = public, private
as $$ select private.mark_message_read_internal(p_message_id); $$;

revoke all on function public.mark_message_read(text) from public, anon;
grant execute on function public.mark_message_read(text) to authenticated;
