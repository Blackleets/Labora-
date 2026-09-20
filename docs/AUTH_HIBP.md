# HaveIBeenPwned (Auth) — activar más tarde

Estado: **deferred** (2026-09-20). El login al dashboard desde el agente falla (hCaptcha + GitHub SSO 500). El MCP de Supabase **no** puede escribir esta opción de Auth.

## Cómo activarlo (tú, desde el móvil o un navegador normal)

1. Abre https://supabase.com/dashboard/project/gggtriyvbusbpqohoukv/auth/providers (o Auth → Providers / Security / Password).
2. Busca **Leaked password protection** / HaveIBeenPwned / “Prevent use of compromised passwords”.
3. Actívalo y guarda.

Comprobar: en el SQL advisor de seguridad debería desaparecer el WARN `auth_leaked_password_protection`.
