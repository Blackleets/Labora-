import { supabase, SUPABASE_URL } from './supabaseClient';

export type UserDetailSection = 'profile' | 'incomes' | 'expenses' | 'documents' | 'requirements' | 'declarations' | 'messages' | 'clients';
export interface AdminUserDetail {
  generatedAt: string;
  user: {
    id: string; name: string; email: string; role: 'rider' | 'manager' | 'admin';
    country_code: string | null; manager_id: string | null; phone: string | null; nif: string | null;
    company_name: string | null; collegiate_number: string | null; fiscal_regime: string | null;
    iae_code: string | null; social_security_type: string | null; platforms: string[] | null;
    work_modes: string[] | null; workplaces: string[] | null; created_at: string | null;
    updated_at: string | null; last_sign_in_at: string | null; email_confirmed: boolean;
  };
  manager: { id: string; name: string; email: string; role: string } | null;
  section: UserDetailSection; page: number; pageSize: number; total: number;
  rows: Array<Record<string, string | number | boolean | null>>;
}

export const loadAdminUserDetail = async (userId: string, section: UserDetailSection, page: number): Promise<AdminUserDetail> => {
  const { data, error } = await supabase.functions.invoke('admin-overview', { body: { action: 'user-detail', userId, section, page } });
  if (error || data?.error) throw new Error('No se pudo consultar la ficha. Comprueba tu sesión y vuelve a intentarlo.');
  if (!data?.user || data.user.id !== userId || data.section !== section || data.page !== page || !Array.isArray(data.rows) || !Number.isInteger(data.total) || data.total < 0) {
    throw new Error('La respuesta no corresponde a la ficha solicitada.');
  }
  return data;
};

export const loadAdminDocumentUrl = async (userId: string, documentId: string): Promise<string> => {
  // File access uses the logged-in client and the existing document + Storage RLS.
  const { data, error } = await supabase.from('documents').select('content').eq('id', documentId).eq('user_id', userId).maybeSingle();
  if (error || !data?.content) throw new Error('Tu cuenta no tiene acceso a este archivo o ya no está disponible.');
  const path = String(data.content);
  if (!path.startsWith(`${userId}/`) || path.includes('..')) throw new Error('Este archivo necesita una revisión de acceso.');
  const signed = await supabase.storage.from('labora-documents').createSignedUrl(path, 60);
  if (signed.error || !signed.data?.signedUrl || !signed.data.signedUrl.startsWith(`${SUPABASE_URL}/storage/v1/`)) throw new Error('Tu cuenta no tiene permiso para abrir este archivo.');
  return signed.data.signedUrl;
};
