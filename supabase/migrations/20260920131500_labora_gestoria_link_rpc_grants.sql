-- Defense in depth: private SECURITY DEFINER helpers must not be callable via PUBLIC.
revoke all on function private.link_manager_by_email_internal(text) from public, anon, authenticated;
revoke all on function private.unlink_own_manager_internal() from public, anon, authenticated;
