import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { recoveryEntry } from '../services/passwordRecoveryRoute';
import { exitPasswordRecovery, initializePasswordRecovery } from '../services/passwordRecovery';
import Logo from './Logo';
import PasswordRecoveryForm from './PasswordRecoveryForm';

// Mount the workspace and its bridges only after leaving the recovery route.
export default function PasswordRecoveryGate({ children }: PropsWithChildren) {
  const [isRecovery] = useState(() => Boolean(recoveryEntry));
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [requestNew, setRequestNew] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isRecovery) return;
    let active = true;
    initializePasswordRecovery().then(() => { if (active) setPhase('ready'); }).catch(() => { if (active) setPhase('invalid'); });
    return () => { active = false; };
  }, [isRecovery]);
  if (!isRecovery) return <>{children}</>;

  const leave = async () => {
    if (exiting) return;
    setExiting(true); setError('');
    try { await exitPasswordRecovery(); window.location.reload(); }
    catch { setError('No se pudo cerrar la sesión de recuperación. Comprueba tu conexión y reintenta.'); setExiting(false); }
  };

  return <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--labora-canvas,#F6F3E9)] px-5 py-10 text-[var(--labora-ink,#1E2A24)]">
    <div className="w-full max-w-[420px]">
      <Logo size="lg" className="mb-8" />
      <section className="labora-card-auth p-6 sm:p-9">
        {phase === 'checking' ? <p role="status" className="flex items-center gap-3 text-sm"><Loader2 size={18} className="animate-spin" aria-hidden /> Comprobando el enlace…</p>
          : phase === 'ready' && !requestNew ? <PasswordRecoveryForm mode="update" onBack={() => void leave()} disabled={exiting} />
          : requestNew ? <PasswordRecoveryForm mode="request" onBack={() => void leave()} disabled={exiting} />
          : <>
            <h1 className="labora-title">Necesitas un nuevo enlace</h1>
            <p role="alert" className="labora-body mt-4 text-sm leading-relaxed">El enlace no es válido o ha caducado. Solicita uno nuevo para recuperar tu acceso.</p>
            <button type="button" onClick={() => setRequestNew(true)} disabled={exiting} className="labora-btn-clay mt-6 min-h-[48px] w-full rounded-xl p-3 text-sm font-semibold">Solicitar otro enlace</button>
            <button type="button" onClick={() => void leave()} disabled={exiting} className="mt-4 min-h-[44px] text-sm font-semibold text-[var(--labora-primary,#2F5D4A)]">Volver a entrar</button>
          </>}
        {error && <p role="alert" className="mt-4 text-sm text-[var(--labora-clay,#B45F43)]">{error}</p>}
      </section>
    </div>
  </main>;
}
