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
  const [glovoOpen, setGlovoOpen] = useState(false);
  const [overlayInfoOpen, setOverlayInfoOpen] = useState(false);

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
      La burbuja solo dibuja su propio botón y panel. Labora+ no lee la pantalla, no usa Accesibilidad, no hace capturas y no pulsa nada en las apps de reparto. Tú apuntas cada pedido.
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

  const assistSupported = Boolean(status?.notificationAssistSupported);
  const assistOn = Boolean(status?.notificationAssistEnabled);
  const glovoOn = Boolean(status?.glovoAssistEnabled);
  const consentAt = getNotificationConsent(userId);

  return (
    <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-bubble-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="labora-bubble-title" className="text-sm font-extrabold text-[var(--labora-ink)]">Burbuja flotante (Android)</h3>
        {status && <StatusPill ok={status.running} yes="Activa" no="Parada" />}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
        Un botón redondo que flota encima de tu app de reparto o del mapa mientras tu jornada está activa. Tócalo para apuntar un pedido sin salir; muestra tus pedidos y € de hoy. La notificación fija trae «+ Aceptado» (escribes el importe ahí mismo), «+ Rechazado» y «Parar»: funcionan aunque la burbuja quede oculta. Se para sola al terminar la jornada o tras {status?.inactivityMinutes ?? 30} min sin uso.
      </p>
      {notReading}

      <ol className="mt-3 space-y-3 text-xs">
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-[var(--labora-ink-soft)]">1. Permiso «Mostrar sobre otras apps»</span>
          <span className="flex items-center gap-2">
            {status && <StatusPill ok={status.overlayGranted} yes="Concedido" no="Falta" />}
            <button type="button" className={btnGhost} onClick={() => setOverlayInfoOpen(true)}>Abrir ajustes</button>
          </span>
        </li>
        {overlayInfoOpen && (
          <li className="rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-3" role="dialog" aria-label="Burbuja flotante">
            <p className="text-[11px] leading-relaxed text-[var(--labora-ink-soft)]">
              <strong>Burbuja flotante.</strong> Para apuntar pedidos sin salir de la app de reparto, Labora+ muestra una pequeña burbuja encima de otras apps mientras tu jornada está activa. No lee tu pantalla ni pulsa nada por ti. Se para al terminar la jornada o al pulsar «Parar».
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={btnPrimary} onClick={() => { setOverlayInfoOpen(false); void LaboraBubble.openOverlaySettings(); }}>Continuar a Ajustes</button>
              <button type="button" className={btnGhost} onClick={() => setOverlayInfoOpen(false)}>Ahora no</button>
            </div>
          </li>
        )}
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
            Abrir la burbuja al «Iniciar jornada» («Terminar jornada» siempre la cierra)
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

      {assistSupported && (
      <div className="mt-4 border-t border-[var(--labora-border)] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-ink)]"><BellRing size={14} aria-hidden /> Asistente de notificaciones (opcional · Labs)</h4>
          <StatusPill ok={assistOn} yes="Activado" no="Desactivado" />
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">
          Solo en Labora+ Labs. Rellena importe y km en la burbuja a partir de las notificaciones de la app de repartidor de Uber. Tú sigues eligiendo Aceptado o Rechazado y pulsando Guardar. Desactivado por defecto.
        </p>
        {assistOn ? (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-[var(--labora-ink-soft)]">
              Acceso a notificaciones en Android: <StatusPill ok={Boolean(status?.notificationAccessGranted)} yes="Concedido" no="Pendiente" />
              {consentAt && <span className="ml-1 text-[var(--labora-muted)]">· consentimiento {new Date(consentAt).toLocaleString('es-ES')}</span>}
            </p>
            <label className="flex min-h-11 items-center gap-2 text-[11px] font-bold text-[var(--labora-ink-soft)]">
              <input type="checkbox" className="h-5 w-5 accent-[var(--labora-primary)]" checked={glovoOn} onChange={(event) => {
                if (event.target.checked) setGlovoOpen(true);
                else void run(() => LaboraBubble.setGlovoAssist({ enabled: false }), 'Glovo desactivado en el asistente.');
              }} />
              Incluir también notificaciones de Glovo (desactivado por defecto)
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhost} onClick={() => void LaboraBubble.openNotificationAccessSettings()}>Abrir acceso a notificaciones</button>
              <button type="button" disabled={busy} className={btnGhost} onClick={() => void run(async () => {
                await LaboraBubble.setNotificationAssist({ enabled: false });
                recordNotificationConsent(userId, null);
              }, 'Asistente desactivado y borradores borrados. Puedes quitar también el acceso en Ajustes de Android.')}>Desactivar</button>
            </div>
          </div>
        ) : (
          <button type="button" className={`${btnGhost} mt-2`} onClick={() => setConsentOpen(true)}>Activar…</button>
        )}
      </div>
      )}

      {glovoOpen && (
        <GlovoWarningDialog
          busy={busy}
          onCancel={() => setGlovoOpen(false)}
          onAccept={() => void run(async () => {
            await LaboraBubble.setGlovoAssist({ enabled: true });
            setGlovoOpen(false);
          }, 'Glovo incluido en el asistente.')}
        />
      )}

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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  // Divulgación destacada (docs/LEGAL_PLAY_ORDER_BUBBLE.md §5.1). Atrás / fuera / Escape = «No, gracias».
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--labora-ink-soft)]/40 p-0 sm:items-center sm:p-4" role="presentation" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="labora-consent-title" onClick={(event) => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-[var(--labora-ivory)] p-5 shadow-xl sm:rounded-[26px]">
        <h3 id="labora-consent-title" className="text-base font-extrabold text-[var(--labora-ink)]">Asistente de notificaciones (opcional)</h3>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-[var(--labora-ink-soft)]">
          <p>Labora+ <strong>lee el título y el texto de las notificaciones de la app de repartidor de Uber</strong> ({NOTIFICATION_ALLOWLIST.filter((item) => item.group === 'uber').map((item) => item.packageName).join(', ')}) y de ninguna otra app, para <strong>rellenar el importe y los km</strong> del pedido en tu registro, <strong>también cuando Labora+ está cerrada o en segundo plano</strong>.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>El texto se analiza <strong>solo en tu móvil</strong> y se <strong>descarta al momento</strong>. No guardamos ni enviamos el texto de la notificación.</li>
            <li>Solo se guarda en tu cuenta de Labora+ lo que <strong>tú confirmas</strong>: plataforma, importe, km, hora y tu decisión.</li>
            <li>Nunca aceptamos ni rechazamos pedidos por ti ni tocamos la app de la plataforma.</li>
            <li>Android avisará de que el acceso a notificaciones permite leerlas todas: es el permiso del sistema. Nuestro código ignora cualquier otra app.</li>
          </ul>
          <p className="flex items-start gap-2 rounded-[13px] bg-[var(--labora-soft-clay)] p-3 text-[var(--labora-clay-deep)]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span><strong>Aviso:</strong> Uber podría considerar que el uso de herramientas de terceros incumple sus condiciones y hay riders a los que se ha amenazado con desactivar la cuenta por usar apps de este tipo. Úsalo bajo tu criterio. Siempre puedes apuntar los pedidos a mano.</span>
          </p>
          <p className="flex items-start gap-2 text-[var(--labora-muted)]"><MessageCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> Puedes desactivarlo cuando quieras aquí (Pedidos → Burbuja flotante) o en Ajustes de Android → Acceso a notificaciones.</p>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" className={`${btnGhost} flex-1`} onClick={onCancel}>No, gracias</button>
          <button type="button" disabled={busy} className={`${btnPrimary} flex-[2]`} onClick={onAccept}>
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden />} Acepto, abrir ajustes
          </button>
        </div>
      </div>
    </div>
  );
};

const GlovoWarningDialog: React.FC<{ busy: boolean; onCancel: () => void; onAccept: () => void }> = ({ busy, onCancel, onAccept }) => {
  const [understood, setUnderstood] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--labora-ink-soft)]/40 p-0 sm:items-center sm:p-4" role="presentation" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="labora-glovo-title" onClick={(event) => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-[var(--labora-ivory)] p-5 shadow-xl sm:rounded-[26px]">
        <h3 id="labora-glovo-title" className="text-base font-extrabold text-[var(--labora-ink)]">Incluir notificaciones de Glovo</h3>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-[var(--labora-ink-soft)]">
          <p>Se leerían también el título y el texto de las notificaciones de {NOTIFICATION_ALLOWLIST.filter((item) => item.group === 'glovo').map((item) => `${item.label} (${item.packageName})`).join(' y ')}, con las mismas reglas: solo en tu móvil, se descarta al momento y solo se guarda lo que confirmas.</p>
          <p className="flex items-start gap-2 rounded-[13px] bg-[var(--labora-soft-clay)] p-3 text-[var(--labora-clay-deep)]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span><strong>Riesgo laboral:</strong> en España, desde julio de 2025 los riders de Glovo son <strong>trabajadores por cuenta ajena</strong>. Las normas de uso de Glovo para personas trabajadoras califican como <strong>falta laboral muy grave</strong> usar su información o propiedad intelectual para fines distintos a tu trabajo, lo que puede llevar a sanciones o al <strong>despido disciplinario</strong>. Si trabajas como asalariado de Glovo, no lo actives. Si eres autónomo con otra relación, consulta antes tus condiciones.</span>
          </p>
        </div>
        <label className="mt-4 flex min-h-11 items-start gap-2 text-xs font-bold text-[var(--labora-ink)]">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--labora-primary)]" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />
          He leído el aviso y asumo el riesgo.
        </label>
        <div className="mt-4 flex gap-2">
          <button type="button" className={`${btnGhost} flex-1`} onClick={onCancel}>No, gracias</button>
          <button type="button" disabled={!understood || busy} className={`${btnPrimary} flex-[2]`} onClick={onAccept}>Incluir Glovo</button>
        </div>
      </div>
    </div>
  );
};
