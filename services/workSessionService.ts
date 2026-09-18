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

export const startWorkSession = async (): Promise<WorkSession> => {
  const user = await requireUser();

  const existing = await getActiveWorkSession();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      user_id: user.id,
      started_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToWorkSession(data);
};

export const finishWorkSession = async (sessionId: string): Promise<WorkSession> => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('work_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .is('ended_at', null)
    .select('*')
    .single();

  if (error) throw error;
  return rowToWorkSession(data);
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
