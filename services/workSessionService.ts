import { WorkSession } from '../types';
import { supabase } from './supabaseClient';

const rowToWorkSession = (row: any): WorkSession => ({
  id: row.id,
  userId: row.user_id,
  startedAt: row.started_at,
  endedAt: row.ended_at || undefined,
  startOdometerKm: row.start_odometer_km == null ? undefined : Number(row.start_odometer_km),
  endOdometerKm: row.end_odometer_km == null ? undefined : Number(row.end_odometer_km),
  notes: row.notes || undefined
});

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.');
  return data.user;
};

export const getActiveWorkSession = async (): Promise<WorkSession | null> => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToWorkSession(data) : null;
};

export const startWorkSession = async (startOdometerKm?: number): Promise<WorkSession> => {
  await requireUser();

  const { data, error } = await supabase.rpc('start_work_session', {
    p_start_odometer_km: startOdometerKm ?? null
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('No se pudo iniciar la jornada.');
  return rowToWorkSession(row);
};

export const finishWorkSession = async (sessionId: string, endOdometerKm?: number): Promise<WorkSession> => {
  await requireUser();

  const { data, error } = await supabase.rpc('finish_work_session', {
    p_session_id: sessionId,
    p_end_odometer_km: endOdometerKm ?? null
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('No se pudo finalizar la jornada.');
  return rowToWorkSession(row);
};

export const listRecentWorkSessions = async (limit = 14): Promise<WorkSession[]> => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(rowToWorkSession);
};

/** Jornadas que empezaron desde `sinceIso` (incluido), más recientes primero. */
export const listWorkSessionsSince = async (sinceIso: string, limit = 2000): Promise<WorkSession[]> => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', sinceIso)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(rowToWorkSession);
};

/** Corrige el cuentakilómetros (inicio/fin) de una jornada propia. Null = sin dato. */
export const setWorkSessionOdometer = async (sessionId: string, startOdometerKm: number | null, endOdometerKm: number | null): Promise<WorkSession> => {
  await requireUser();
  const { data, error } = await supabase.rpc('set_work_session_odometer', {
    p_session_id: sessionId,
    p_start_odometer_km: startOdometerKm,
    p_end_odometer_km: endOdometerKm
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('No se pudo guardar el cuentakilómetros.');
  return rowToWorkSession(row);
};
