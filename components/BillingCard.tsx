import React, { useEffect, useState } from 'react';
import { Check, Crown, ExternalLink, Loader2 } from 'lucide-react';
import {
  BillingEntitlement,
  BillingInterval,
  PRO_CAPABILITIES,
  billingEnabled,
  getBillingEntitlement,
  openBillingPortal,
  startProCheckout
} from '../services/billingService';

const BillingCard: React.FC = () => {
  const [entitlement, setEntitlement] = useState<BillingEntitlement | null>(null);
  const [busy, setBusy] = useState<BillingInterval | 'portal' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!billingEnabled) return;
    void getBillingEntitlement()
      .then(setEntitlement)
      .catch((cause) => {
        console.error('Labora billing entitlement failed', cause);
        setError('No se pudo comprobar el estado de la suscripción.');
      });
  }, []);

  if (!billingEnabled) return null;

  const monthlyLabel = import.meta.env.VITE_LABORA_PRO_MONTHLY_LABEL || '9,99 €/mes';
  const annualLabel = import.meta.env.VITE_LABORA_PRO_ANNUAL_LABEL || '89,90 €/año';
  const isPro = Boolean(entitlement?.proActive);

  const redirect = async (kind: BillingInterval | 'portal') => {
    setError('');
    setBusy(kind);
    try {
      const url = kind === 'portal'
        ? await openBillingPortal()
        : await startProCheckout(kind);
      window.location.assign(url);
    } catch (cause: any) {
      console.error('Labora billing redirect failed', cause);
      setError('No se pudo abrir el pago. Comprueba la configuración de Stripe e inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="labora-card overflow-hidden">
      <div className="bg-[#214E3A] p-5 text-white sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white/12">
            <Crown size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#BFD8C8]">Labora+ Pro</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold">{isPro ? 'Tu plan Pro está activo' : 'Automatiza más trabajo'}</h2>
              <span className="rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-extrabold">
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/70">
              Stripe gestiona el cobro y los métodos de pago. Labora+ no almacena los datos de tu tarjeta.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {PRO_CAPABILITIES.map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-[13px] bg-[#F8F5F0] px-3 py-2.5">
              <Check size={14} className="mt-0.5 shrink-0 text-[#2F6B50]" />
              <p className="text-[11px] font-semibold leading-relaxed text-stone-600">{item}</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-[12px] border border-[#F0D8D3] bg-[#FFF7F5] px-3 py-2.5 text-[11px] font-semibold text-[#A34F42]">
            {error}
          </p>
        )}

        {isPro ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-stone-500">
              {entitlement?.cancelAtPeriodEnd ? 'La suscripción terminará al final del periodo actual.' : 'Suscripción gestionada por Stripe.'}
            </p>
            <button
              type="button"
              onClick={() => void redirect('portal')}
              disabled={busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-[#D7DED8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#214E3A] disabled:opacity-50"
            >
              {busy === 'portal' ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
              Gestionar suscripción
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void redirect('month')}
              disabled={busy !== null}
              className="rounded-[13px] bg-[#214E3A] px-4 py-3 text-left text-white disabled:opacity-50"
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Mensual</span>
              <span className="mt-1 flex items-center gap-2 text-sm font-extrabold">
                {busy === 'month' && <Loader2 size={14} className="animate-spin" />}
                {monthlyLabel}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void redirect('year')}
              disabled={busy !== null}
              className="rounded-[13px] border border-[#D7DED8] bg-[#F8F5F0] px-4 py-3 text-left text-[#214E3A] disabled:opacity-50"
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Anual</span>
              <span className="mt-1 flex items-center gap-2 text-sm font-extrabold">
                {busy === 'year' && <Loader2 size={14} className="animate-spin" />}
                {annualLabel}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BillingCard;
