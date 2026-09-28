import { supabase } from './supabaseClient';

export interface AdminOverviewSnapshot {
  generatedAt: string;
  users: {
    total: number;
    workers: number;
    managers: number;
    admins: number;
  };
  records: {
    documents: number;
    incomes: number;
    expenses: number;
    pendingRequirements: number;
    pendingDeclarations: number;
  };
  countries: Record<string, number>;
  directory: Array<{
    id: string;
    name: string;
    email: string;
    role: 'rider' | 'manager' | 'admin';
    countryCode: string;
    managerId: string | null;
    createdAt: string | null;
    lastSignInAt: string | null;
    emailConfirmed: boolean;
  }>;
  directoryTruncated: boolean;
}

export const loadAdminOverview = async (): Promise<AdminOverviewSnapshot> => {
  const { data, error } = await supabase.functions.invoke('admin-overview', { body: {} });
  if (error) throw new Error(error.message || 'No se pudo cargar el resumen administrativo.');
  if (!data || typeof data !== 'object' || !data.users || !data.records || !Array.isArray(data.directory)) {
    throw new Error('El servidor devolvió un resumen administrativo inválido.');
  }
  return data as AdminOverviewSnapshot;
};
