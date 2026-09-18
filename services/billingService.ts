import { supabase } from './supabaseClient';

export type BillingPlan = 'free' | 'pro';
export type BillingStatus =
  | 'inactive'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export type BillingInterval = 'month' | 'year';

export interface BillingEntitlement {
  plan: BillingPlan;
  status: BillingStatus;
  proActive: boolean;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === 'true';

const freeEntitlement: BillingEntitlement = {
  plan: 'free',
  status: 'inactive',
  proActive: false,
  cancelAtPeriodEnd: false
};

export const getBillingEntitlement = async (): Promise<BillingEntitlement> => {
  if (!billingEnabled) return freeEntitlement;

  const { data, error } = await supabase.rpc('my_billing_entitlement');
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return freeEntitlement;

  return {
    plan: row.plan === 'pro' ? 'pro' : 'free',
    status: (row.status || 'inactive') as BillingStatus,
    proActive: Boolean(row.pro_active),
    currentPeriodEnd: row.current_period_end || undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end)
  };
};

const invokeBillingFunction = async (
  name: 'create-checkout-session' | 'create-billing-portal-session',
  body?: Record<string, unknown>
) => {
  const { data, error } = await supabase.functions.invoke(name, { body: body || {} });
  if (error) throw error;

  const url = data?.url;
  if (!url || typeof url !== 'string') {
    throw new Error(data?.error || 'No se pudo abrir Stripe.');
  }
  return url;
};

export const startProCheckout = async (interval: BillingInterval) =>
  invokeBillingFunction('create-checkout-session', { interval });

export const openBillingPortal = async () =>
  invokeBillingFunction('create-billing-portal-session');

export const PRO_CAPABILITIES = [
  'Importación asistida por IA y automatizaciones premium',
  'Herramientas fiscales y exportaciones avanzadas',
  'Analítica de rentabilidad ampliada',
  'Gestión segura de la suscripción desde Stripe'
] as const;
