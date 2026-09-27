/**
 * Acceso a Supabase para el registro de pedidos. Tablas owner-only (RLS):
 * `delivery_orders` y `user_module_settings`. La gestoría no tiene acceso.
 */
import { supabase } from './supabaseClient';
import type { OrderInput, OrderLogEntry, RejectReason } from './orderLog';

export interface OrderModuleSettings {
  ordersEnabled: boolean;
  dailyGoal: number | null;
}

const num = (value: unknown) => (value === null || value === undefined ? undefined : Number(value));

export const rowToOrder = (row: any): OrderLogEntry => ({
  id: row.id,
  userId: row.user_id,
  platform: row.platform,
  occurredAt: row.occurred_at,
  status: row.status === 'rejected' ? 'rejected' : 'accepted',
  amount: num(row.amount),
  km: num(row.km),
  rejectReason: (row.reject_reason || undefined) as RejectReason | undefined,
  note: row.note || undefined,
  convertedIncomeId: row.converted_income_id || undefined,
  convertedAt: row.converted_at || undefined
});

const inputToRow = (input: OrderInput) => ({
  platform: input.platform.trim(),
  occurred_at: new Date(input.occurredAt).toISOString(),
  status: input.status,
  amount: input.amount ?? null,
  km: input.km ?? null,
  reject_reason: input.status === 'rejected' ? input.rejectReason ?? null : null,
  note: input.note?.trim() ? input.note.trim() : null
});

const requireUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.');
  return data.user.id;
};

export const getOrderModuleSettings = async (): Promise<OrderModuleSettings> => {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('user_module_settings')
    .select('orders_enabled, orders_daily_goal')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return {
    ordersEnabled: Boolean(data?.orders_enabled),
    dailyGoal: data?.orders_daily_goal == null ? null : Number(data.orders_daily_goal)
  };
};

export const saveOrderModuleSettings = async (settings: OrderModuleSettings): Promise<OrderModuleSettings> => {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('user_module_settings')
    .upsert({ user_id: userId, orders_enabled: settings.ordersEnabled, orders_daily_goal: settings.dailyGoal }, { onConflict: 'user_id' })
    .select('orders_enabled, orders_daily_goal')
    .single();
  if (error) throw error;
  return { ordersEnabled: Boolean(data.orders_enabled), dailyGoal: data.orders_daily_goal == null ? null : Number(data.orders_daily_goal) };
};

/** Pedidos desde `sinceIso` (incluido), más recientes primero. */
export const listOrders = async (sinceIso: string): Promise<OrderLogEntry[]> => {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('delivery_orders')
    .select('*')
    .eq('user_id', userId)
    .gte('occurred_at', sinceIso)
    .order('occurred_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map(rowToOrder);
};

export const insertOrder = async (input: OrderInput): Promise<OrderLogEntry> => {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('delivery_orders')
    .insert({ ...inputToRow(input), user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return rowToOrder(data);
};

export const updateOrder = async (id: string, input: OrderInput): Promise<OrderLogEntry> => {
  const userId = await requireUserId();
  const patch: Record<string, unknown> = inputToRow(input);
  if (input.status === 'rejected') {
    patch.converted_income_id = null;
    patch.converted_at = null;
  }
  const { data, error } = await supabase
    .from('delivery_orders')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return rowToOrder(data);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const userId = await requireUserId();
  const { error } = await supabase.from('delivery_orders').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
};

export const markOrdersConverted = async (ids: string[], incomeId: string): Promise<void> => {
  if (!ids.length) return;
  const userId = await requireUserId();
  const { error } = await supabase
    .from('delivery_orders')
    .update({ converted_income_id: incomeId, converted_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', userId)
    .eq('status', 'accepted');
  if (error) throw error;
};
