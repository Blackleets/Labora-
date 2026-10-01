import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabaseClient';
import { signOutRemote } from './authWorkspace';
import { clearRecoveryEntry, consumeRecoveryEntry, RECOVERY_RETURN_URL } from './passwordRecoveryRoute';

const INVALID_LINK = 'El enlace no es válido o ha caducado. Solicita uno nuevo.';
type RecoveryContext = { client: SupabaseClient; userId: string };
let contextPromise: Promise<RecoveryContext> | undefined;

export const recoveryErrorMessage = (error: unknown) => {
  const code = String((error as { code?: string })?.code || '');
  if (code.includes('rate_limit') || (error as { status?: number })?.status === 429) return 'Se han realizado demasiados intentos. Espera unos minutos y vuelve a probar.';
  if (code === 'weak_password') return 'La contraseña no cumple los requisitos de seguridad. Elige una más larga y difícil de adivinar.';
  if (code === 'same_password') return 'Elige una contraseña distinta de la anterior.';
  if (['session_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'bad_jwt', 'otp_expired'].includes(code)) return INVALID_LINK;
  return 'No se pudo completar la operación. Comprueba tu conexión y vuelve a intentarlo.';
};

export const requestPasswordRecovery = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Escribe un correo electrónico válido.');
  const { error } = await supabase.auth.resetPasswordForEmail(normalized, { redirectTo: RECOVERY_RETURN_URL });
  // Do not disclose whether an account exists.
  if (error && error.code !== 'user_not_found') throw new Error(recoveryErrorMessage(error));
};

export const initializePasswordRecovery = (): Promise<RecoveryContext> => {
  if (contextPromise) return contextPromise;
  const entry = consumeRecoveryEntry();
  contextPromise = (async () => {
    if (entry?.kind !== 'link') throw new Error(INVALID_LINK);
    // A different tab/account cannot redirect updateUser to its own session.
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'labora-recovery-isolated' }
    });
    const { data, error } = await client.auth.setSession({ access_token: entry.accessToken, refresh_token: entry.refreshToken });
    if (error || !data.session?.user) throw new Error(INVALID_LINK);
    const { data: verified, error: verifyError } = await client.auth.getUser();
    if (verifyError || verified.user?.id !== data.session.user.id) throw new Error(INVALID_LINK);
    return { client, userId: verified.user.id };
  })();
  return contextPromise;
};

export const updateRecoveredPassword = async (password: string, confirmation: string) => {
  if (password.length < 8 || !password.trim()) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
  const { client, userId } = await initializePasswordRecovery();
  const { data: actor, error: actorError } = await client.auth.getUser();
  if (actorError || actor.user?.id !== userId) throw new Error(INVALID_LINK);
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw new Error(recoveryErrorMessage(error));
  if (data.user?.id !== userId) throw new Error('No se pudo confirmar el cambio de contraseña.');
};

export const exitPasswordRecovery = async () => {
  const context = await contextPromise?.catch(() => null);
  if (context) {
    const { error } = await context.client.auth.signOut({ scope: 'local' });
    if (error) throw new Error(recoveryErrorMessage(error));
  }
  // Return to login, rather than expose a previously cached workspace.
  await signOutRemote('local');
  clearRecoveryEntry();
};
