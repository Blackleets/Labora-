import React, { useCallback, useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { AlertTriangle, BellRing, Loader2, MessageCircle, Play, ShieldCheck, Square } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formControlFocusClass } from '../formA11y';
import {
  LaboraBubble,
  NOTIFICATION_ALLOWLIST,
  type BubbleStatus,
  getBubbleAutoStart,
  getNotificationConsent,
  isBubbleSupported,
  recordNotificationConsent,
  setBubbleAutoStart
} from '../../services/laboraBubble';

const btn = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[13px] px-3.5 text-xs font-extrabold ${formControlFocusClass}`;
const btnPrimary = `${btn} bg-[var(--labora-primary)] text-white disabled:opacity-50`;
const btnGhost = `${btn} border border-[var(--labora-border)] text-[var(--labora-ink-soft)]`;

const StatusPill: React.FC<{ ok: boolean; yes: string; no: string }> = ({ ok, yes, no }) => (
  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${ok ? 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]'}`}>{ok ? yes : no}</span>
);

/** Pedidos → «Burbuja flotante (Android)» y el borrador opcional desde notificaciones. */
export const BubbleControlCard: React.FC<{ platforms: string[] }> = ({ platforms }) => {
  const { currentUser, showNotification } = useData();
  const userId = currentUser?.id || '';
  const supported = isBubbleSupported();
  const [status, setStatus] = useState<BubbleStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoStart, setAutoStart] = useState(() => getBubbleAutoStart(userId));
  const [consentOpen, setConsentOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!supported) return;
    try { setStatus(await LaboraBubble.getStatus()); } catch { setStatus(null); }
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    void refresh();
    // Al volver de los ajustes del sistema, refrescar permisos.
    const handle = CapApp.addListener('resume', () => { void refresh(); });
    return () => { void handle.then((h) => h.remove()); };
  }, [supported, refresh]);

  const run = async (action: () => Promise<void>, ok?: string) => {
    setBusy(true);
    try {
      await action();
      if (ok) showNotification('success', ok);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showNotification('error', message === 'overlay_permission_missing' ? 'Primero activa «Mostrar sobre otras apps» para Labora+.' : `No se pudo completar: ${message}`);
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  const notReading = (
    <p className="mt-2 inline-flex items-start gap-1.5 rounded-[13px] bg-[var(--labora-surface-2)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--labora-muted)]">
      <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
      La burbuja solo dibuja su propio botón y panel. Labora+ no lee la pantalla, no usa Accesibilidad, no hace capturas y no pulsa nada en Uber, Glovo ni otras apps. Tú apuntas cada pedido.
    </p>
  );

  if (!supported) {
    return (
      <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-bubble-title">
        <h3 id="labora-bubble-title" className="text-sm font-extrabold text-[var(--labora-ink)]">Burbuja flotante (Android)</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
          Solo disponible en la app de Android de Labora+. Una web no puede mostrarse encima de otras apps; aquí puedes seguir apuntando pedidos con el formulario.
        </p>
        {notReading}
      </section>
    );
  }

  const assistOn = Boolean(status?.notificationAssistEnabled);
  const consentAt = getNotificationConsent(userId);

  return (
    <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-bubble-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="labora-bubble-title" className="text-sm font-extrabold text-[var(--labora-ink)]">Burbuja flotante (Android)</h3>
        {status && <StatusPill ok={status.running} yes="Activa" no="Parada" />}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
        Un botón redondo que flota encima de Uber, Glovo o el mapa. Tócalo para apuntar un pedido sin salir de la app de reparto; muestra tus pedidos y € de hoy. La notificación fija trae «+ Aceptado» y «+ Rechazado».
      </p>
      {notReading}

      <ol className="mt-3 space-y-3 text-xs">
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-[var(--labora-ink-soft)]">1. Permiso «Mostrar sobre otras apps»</span>
          <span className="flex items-center gap-2">
            {status && <StatusPill ok={status.overlayGranted} yes="Concedido" no="Falta" />}
            <button type="button" className={btnGhost} onClick={() => void LaboraBubble.openOverlaySettings()}>Abrir ajustes</button>
          </span>
        </li>
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-[var(--labora-ink-soft)]">2. Burbuja</span>
          {status?.running ? (
            <button type="button" disabled={busy} className={btnGhost} onClick={() => void run(() => LaboraBubble.stop(), 'Burbuja detenida.')}>
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Square size={13} aria-hidden />} Detener
            </button>
          ) : (
            <button type="button" disabled={busy || !status?.overlayGranted} className={btnPrimary} onClick={() => void run(() => LaboraBubble.start({ platforms }), 'Burbuja activa. Ya puedes ir a tu app de reparto.')}>
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Play size={13} aria-hidden />} Iniciar burbuja
            </button>
          )}
        </li>
        <li>
          <label className="flex min-h-11 items-center gap-2 font-bold text-[var(--labora-ink-soft)]">
            <input type="checkbox" className="h-5 w-5 accent-[var(--labora-primary)]" checked={autoStart} onChange={(event) => { setAutoStart(event.target.checked); setBubbleAutoStart(userId, event.target.checked); }} />
            Abrir la burbuja al «Iniciar jornada» (y cerrarla al terminar)
          </label>
        </li>
      </ol>
      {status && status.queued > 0 && (
        <p className="mt-2 text-[11px] font-bold text-[var(--labora-gold)]">
          {status.queued} {status.queued === 1 ? 'pedido guardado' : 'pedidos guardados'} en el móvil pendientes de subir.{' '}
          <button type="button" className="underline" onClick={() => void run(async () => { await LaboraBubble.flushQueue(); })}>Subir ahora</button>
        </p>
      )}
      {status && !status.notificationsGranted && (
        <p className="mt-2 text-[11px] text-[var(--labora-muted)]">Las notificaciones de Labora+ están desactivadas: la burbuja funciona, pero no verás los botones «+ Aceptado / + Rechazado».</p>
      )}

      <div className="mt-4 border-t border-[var(--labora-border)] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-ink)]"><BellRing size={14} aria-hidden /> Borrador desde notificaciones (opcional)</h4>
          <StatusPill ok={assistOn} yes="Activado" no="Desactivado" />
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">
          Si lo activas, Labora+ lee el título y el texto de las notificaciones de Uber Driver y Glovo Rider para rellenar importe y km en la burbuja. Tú sigues eligiendo Aceptado o Rechazado y pulsando Guardar. Desactivado por defecto.
        </p>
        {assistOn ? (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-[var(--labora-ink-soft)]">
              Acceso a notificaciones en Android: <StatusPill ok={Boolean(status?.notificationAccessGranted)} yes="Concedido" no="Pendiente" />
              {consentAt && <span className="ml-1 text-[var(--labora-muted)]">· consentimiento {new Date(consentAt).toLocaleString('es-ES')}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhost} onClick={() => void LaboraBubble.openNotificationAccessSettings()}>Abrir acceso a notificaciones</button>
              <button type="button" disabled={busy} className={btnGhost} onClick={() => void run(async () => {
                await LaboraBubble.setNotificationAssist({ enabled: false });
                recordNotificationConsent(userId, null);
              }, 'Lectura de notificaciones desactivada. Puedes quitar también el acceso en Ajustes de Android.')}>Desactivar</button>
            </div>
          </div>
        ) : (
          <button type="button" className={`${btnGhost} mt-2`} onClick={() => setConsentOpen(true)}>Activar…</button>
        )}
      </div>

      {consentOpen && (
        <NotificationConsentDialog
          busy={busy}
          onCancel={() => setConsentOpen(false)}
          onAccept={() => void run(async () => {
            await LaboraBubble.setNotificationAssist({ enabled: true });
            recordNotificationConsent(userId, new Date());
            setConsentOpen(false);
            await LaboraBubble.openNotificationAccessSettings();
          }, 'Activado. En Android, permite «Labora+ · borrador de pedidos».')}
        />
      )}
    </section>
  );
};

const NotificationConsentDialog: React.FC<{ busy: boolean; onCancel: () => void; onAccept: () => void }> = ({ busy, onCancel, onAccept }) => {
  const [understood, setUnderstood] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--labora-ink-soft)]/40 p-0 sm:items-center sm:p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="labora-consent-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-[var(--labora-ivory)] p-5 shadow-xl sm:rounded-[26px]">
        <h3 id="labora-consent-title" className="text-base font-extrabold text-[var(--labora-ink)]">Leer notificaciones de Uber y Glovo</h3>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-[var(--labora-ink-soft)]">
          <p><strong>Qué lee:</strong> solo el título y el texto de las notificaciones de estas apps:</p>
          <ul className="list-disc pl-5">
            {NOTIFICATION_ALLOWLIST.map((item) => <li key={item.packageName}>{item.label} <span className="text-[var(--labora-muted)]">({item.packageName})</span></li>)}
          </ul>
          <p>Las demás notificaciones (WhatsApp, banco, etc.) se ignoran en el código. Aun así, Android te avisará de que el acceso a notificaciones permite leerlas todas: es el permiso del sistema, no se puede limitar a una app.</p>
          <p><strong>Qué hace:</strong> saca el importe (€) y los km si aparecen claros y los pone como borrador en la burbuja. Si no está claro, deja el campo vacío. Nunca acepta ni rechaza por ti, no toca la app de la plataforma, no usa Accesibilidad ni capturas de pantalla.</p>
          <p><strong>Tus datos:</strong> el texto de la notificación se queda en la memoria del móvil unos minutos y no se guarda ni se sube. Solo se guarda lo que tú confirmas con «Guardar» (plataforma, importe, km, resultado, motivo), en tu cuenta y solo visible para ti.</p>
          <p className="flex items-start gap-2 rounded-[13px] bg-[var(--labora-soft-clay)] p-3 text-[var(--labora-clay-deep)]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span><strong>Riesgo:</strong> los términos de Uber y Glovo pueden prohibir herramientas de terceros que accedan a la información de su app. Uber ha demandado a apps de este tipo (p. ej. GigU en Brasil) y las plataformas pueden desactivar cuentas. Labora+ no puede garantizar que no afecte a tu cuenta. Lo activas bajo tu responsabilidad y puedes desactivarlo cuando quieras.</span>
          </p>
          <p className="flex items-start gap-2 text-[var(--labora-muted)]"><MessageCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> Puedes quitar el permiso en Ajustes de Android → Acceso a notificaciones, o con «Desactivar» en esta pantalla.</p>
        </div>
        <label className="mt-4 flex min-h-11 items-start gap-2 text-xs font-bold text-[var(--labora-ink)]">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--labora-primary)]" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />
          Entiendo el riesgo con los términos de Uber y Glovo y quiero activarlo.
        </label>
        <div className="mt-4 flex gap-2">
          <button type="button" className={`${btnGhost} flex-1`} onClick={onCancel}>Cancelar</button>
          <button type="button" disabled={!understood || busy} className={`${btnPrimary} flex-[2]`} onClick={onAccept}>
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden />} Activar y abrir ajustes
          </button>
        </div>
      </div>
    </div>
  );
};
