import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail } from 'lucide-react';
import { requestPasswordRecovery, updateRecoveredPassword } from '../services/passwordRecovery';

type Props = { mode: 'request' | 'update'; onBack: () => void; disabled?: boolean };
const inputClass = 'w-full rounded-xl border border-[var(--labora-border,#E8DFC8)] bg-[var(--labora-surface,#FFFEFB)] px-4 py-3.5 pl-11 text-base text-[var(--labora-ink,#1E2A24)] outline-none focus:border-[var(--labora-primary,#2F5D4A)] focus:ring-2 focus:ring-[var(--labora-primary,#2F5D4A)]';

export default function PasswordRecoveryForm({ mode, onBack, disabled = false }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const active = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { active.current = true; heading.current?.focus(); return () => { active.current = false; }; }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || disabled || done) return;
    setError(''); setLoading(true);
    try {
      if (mode === 'request') await requestPasswordRecovery(email);
      else await updateRecoveredPassword(password, confirmation);
      if (!active.current) return;
      setPassword(''); setConfirmation(''); setDone(true);
    } catch (failure) {
      if (active.current) setError(failure instanceof Error ? failure.message : 'No se pudo completar la operación. Vuelve a intentarlo.');
    } finally {
      if (active.current) setLoading(false);
    }
  };

  return <>
    <h2 ref={heading} tabIndex={-1} className="labora-title text-[var(--labora-ink,#1E2A24)]">{mode === 'request' ? 'Recupera tu acceso' : 'Nueva contraseña'}</h2>
    <p className="labora-body mt-3 text-[15px] leading-relaxed">{mode === 'request' ? 'Te enviaremos un enlace para elegir una nueva contraseña.' : 'Elige una contraseña de al menos 8 caracteres que no uses en otros servicios.'}</p>
    {done ? <div className="mt-6 rounded-xl border border-[var(--labora-border,#E8DFC8)] bg-[var(--labora-parchment,#F6F3E9)] p-4 text-sm leading-relaxed" role="status">
      {mode === 'request' ? 'Si el correo está registrado, recibirás un enlace. Revisa también la carpeta de spam. Si no llega, espera unos minutos y solicita otro.' : 'Contraseña actualizada. Vuelve a entrar con tu nueva contraseña.'}
    </div> : <form onSubmit={submit} className="mt-7 space-y-5" noValidate aria-busy={loading}>
      {mode === 'request' ? <div>
        <label htmlFor="recovery-email" className="labora-label mb-2.5 block">Correo</label>
        <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted,#78716c)]" aria-hidden />
          <input id="recovery-email" type="email" autoComplete="email" required value={email} disabled={loading || disabled} onChange={event => { setEmail(event.target.value); setError(''); }} className={inputClass} placeholder="tu@correo.com" aria-invalid={!!error} aria-describedby={error ? 'recovery-error' : undefined} />
        </div>
      </div> : <>
        {[{ id: 'recovery-password', label: 'Nueva contraseña', value: password, set: setPassword }, { id: 'recovery-confirmation', label: 'Repite la contraseña', value: confirmation, set: setConfirmation }].map(field => <div key={field.id}>
          <label htmlFor={field.id} className="labora-label mb-2.5 block">{field.label}</label>
          <div className="relative"><KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted,#78716c)]" aria-hidden />
            <input id={field.id} type="password" autoComplete="new-password" minLength={8} required value={field.value} disabled={loading || disabled} onChange={event => { field.set(event.target.value); setError(''); }} className={inputClass} aria-invalid={!!error} aria-describedby={error ? 'recovery-error' : undefined} />
          </div>
        </div>)}
      </>}
      {error && <p id="recovery-error" role="alert" className="rounded-xl border border-[var(--labora-border,#E8DFC8)] bg-[var(--labora-soft-clay,#FEF7EB)] p-3 text-sm text-[var(--labora-clay,#B45F43)]">{error}</p>}
      <button type="submit" disabled={loading || disabled} className="labora-btn-clay flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary,#2F5D4A)] disabled:opacity-60">
        {loading ? <><Loader2 size={17} className="animate-spin" aria-hidden /> {mode === 'request' ? 'Solicitando enlace…' : 'Actualizando…'}</> : mode === 'request' ? 'Enviar enlace' : 'Guardar contraseña'}
      </button>
    </form>}
    {done && mode === 'request' && <button type="button" onClick={() => { setDone(false); setError(''); }} className="mt-4 min-h-[44px] text-sm font-semibold text-[var(--labora-primary,#2F5D4A)]">Solicitar otro enlace</button>}
    <button type="button" onClick={onBack} disabled={loading || disabled} className="mt-5 flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--labora-primary,#2F5D4A)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"><ArrowLeft size={16} aria-hidden /> Volver a entrar</button>
  </>;
}
