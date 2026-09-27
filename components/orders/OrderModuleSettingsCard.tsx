import React, { useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formControlFocusClass } from '../formA11y';
import { useOrderModule } from './useOrderModule';
import { LaboraBubble, isBubbleSupported } from '../../services/laboraBubble';

/** Ajustes → Módulos. Activa/desactiva el registro de pedidos (preferencia owner-only en Supabase). */
export const OrderModuleSettingsCard: React.FC = () => {
  const { showNotification } = useData();
  const { isRider, ready, enabled, dailyGoal, error, save } = useOrderModule();
  const [busy, setBusy] = useState(false);

  if (!isRider) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      await save({ ordersEnabled: !enabled, dailyGoal });
      // Módulo apagado = oculto en todas partes, también la burbuja de Android.
      if (enabled && isBubbleSupported()) await LaboraBubble.stop().catch(() => undefined);
      showNotification('success', enabled ? 'Registro de pedidos desactivado. Tus datos se conservan.' : 'Registro de pedidos activado.');
    } catch (saveError) {
      showNotification('error', saveError instanceof Error ? saveError.message : 'No se pudo guardar el ajuste.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="labora-card p-4 sm:p-5">
      <p className="labora-kicker text-[var(--labora-muted)]">Módulos</p>
      <h2 className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">Módulos opcionales</h2>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Registro de pedidos"
        disabled={!ready || busy}
        onClick={() => void toggle()}
        className={`mt-2 flex min-h-14 w-full items-center gap-3 rounded-[14px] px-1 py-3 text-left disabled:opacity-60 ${formControlFocusClass}`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]" aria-hidden>
          {busy ? <Loader2 size={17} className="animate-spin" /> : <ClipboardList size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[var(--labora-ink)]">Registro de pedidos</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            Apunta a mano pedidos aceptados y rechazados, tu jornada y un objetivo diario. Sin conexión con Uber, Glovo ni otras plataformas. Solo tú lo ves: tu gestoría no tiene acceso.
          </p>
        </div>
        <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? 'bg-[var(--labora-primary)]' : 'bg-[var(--labora-surface-2)]'}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--labora-surface)] shadow-sm transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>
      {error && <p role="alert" className="mt-2 text-[11px] font-bold text-[var(--labora-clay-deep)]">No se pudo leer el ajuste ({error}). El módulo queda oculto.</p>}
      <p className="mt-2 rounded-[13px] bg-[var(--labora-surface-2)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--labora-muted)]">
        Al desactivarlo se oculta en toda la app; tus pedidos no se borran. Labora+ no comparte ni analiza estos datos con terceros.
      </p>
    </section>
  );
};

/** Acceso rápido en Inicio (solo si el módulo está activo). */
export const OrderModuleShortcut: React.FC<{ setView?: (view: string) => void }> = ({ setView }) => {
  const { enabled } = useOrderModule();
  if (!enabled) return null;
  return (
    <button
      type="button"
      onClick={() => setView?.('orders')}
      className={`labora-card labora-card-interactive flex min-h-16 w-full items-center gap-3 p-4 text-left ${formControlFocusClass}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]" aria-hidden><ClipboardList size={19} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[var(--labora-ink)]">Nuevo pedido</p>
        <p className="truncate text-xs text-[var(--labora-muted)]">Registro de pedidos · resumen de hoy y del mes</p>
      </div>
    </button>
  );
};
