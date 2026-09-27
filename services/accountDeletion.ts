import { supabase } from './supabaseClient';

export const deleteCurrentAccount = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.');

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation: 'DELETE_MY_ACCOUNT' }
  });

  if (error) throw error;
  if (!data?.ok) {
    throw new Error('No se pudo eliminar la cuenta de forma completa.');
  }

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // The auth user may already be gone. Local application cleanup still follows.
  }

  return true;
};
