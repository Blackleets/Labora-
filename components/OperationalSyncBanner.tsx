import React from 'react';
import { CheckCircle2, CloudUpload, Loader2, TriangleAlert } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function OperationalSyncBanner() {
  const { currentUser, operationalSync, retryOperationalSync } = useData();
  if (!currentUser) return null;
  const phase = operationalSync?.userId === currentUser.id ? operationalSync.phase : 'checking';
  const failed = phase === 'error' || phase === 'blocked';
  const busy = phase === 'checking' || phase === 'syncing';
  const Icon = failed ? TriangleAlert : busy ? Loader2 : phase === 'synced' ? CheckCircle2 : CloudUpload;
  const text = {
    checking: 'Comprobando la sincronización de tu expediente…',
    pending: 'Tu expediente está pendiente de confirmar en la nube.',
    syncing: 'Sincronizando tu expediente…',
    synced: 'Sincronización del expediente confirmada.',
    error: 'No se pudo sincronizar. Conserva esta sesión y reintenta.',
    blocked: 'La confirmación está incompleta. Conserva esta sesión y reintenta.'
  }[phase];
  return (
    <div className={`mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-surface)] px-4 py-2.5 text-xs ${failed ? 'text-[var(--labora-clay)]' : 'text-[var(--labora-muted)]'}`} role="status" aria-live="polite" aria-atomic="true">
      <Icon size={16} className={busy ? 'shrink-0 animate-spin' : 'shrink-0'} aria-hidden />
      <span className="min-w-0 flex-1">{text}</span>
      {failed && <button type="button" onClick={retryOperationalSync} className="min-h-[44px] rounded-xl border border-[var(--labora-border)] px-3 font-bold text-[var(--labora-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]">Reintentar</button>}
    </div>
  );
}
