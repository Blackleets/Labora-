import React from 'react';
import { Building2, ClipboardPaste, LockKeyhole, ShieldCheck } from 'lucide-react';

export const BankingConnect: React.FC = () => {
  return (
    <section className="labora-card overflow-hidden">
      <div className="relative overflow-hidden bg-[var(--labora-primary)] p-5 text-white sm:p-6">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[var(--labora-gold-soft)]/15" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-[var(--labora-surface)]/10 text-[var(--labora-gold-soft)]">
            <Building2 size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="labora-kicker text-white/55">Banca</p>
              <span className="rounded-full border border-white/15 bg-[var(--labora-surface)]/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/75">
                Open Banking próximamente
              </span>
            </div>
            <h2 className="labora-display mt-1 text-xl font-semibold text-white">Sin conexión bancaria falsa.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Labora+ no solicita ni almacena contraseñas bancarias y no marca ninguna cuenta como «conectada»
              hasta que exista un proveedor regulado bajo PSD2, con consentimiento explícito y OAuth real.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <div className="rounded-[16px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
            <LockKeyhole size={16} />
          </div>
          <p className="mt-3 text-xs font-extrabold text-[var(--labora-ink)]">Sin credenciales en Labora+</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            El acceso se autorizará con el banco o proveedor regulado, no escribiendo tu clave bancaria dentro de la app.
          </p>
        </div>

        <div className="rounded-[16px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]">
            <ShieldCheck size={16} />
          </div>
          <p className="mt-3 text-xs font-extrabold text-[var(--labora-ink)]">Primera fase: solo lectura</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            Cuando llegue Open Banking: saldos y movimientos para conciliación. La iniciación de pagos permanece fuera de alcance.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--labora-surface)] text-[var(--labora-primary)] border border-[var(--labora-border)]">
            <ClipboardPaste size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[var(--labora-ink)]">Alternativa honesta ahora</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">
              No hay API de Glovo/Uber ni banco en vivo. Ve a <span className="font-semibold text-[var(--labora-muted)]">Movimientos → Ingresos</span> y
              pega liquidaciones (CSV o líneas «Glovo 10/09/2026 89,90») o súbelas como PDF/captura si hay OCR. Nada se marca como «conectado».
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--labora-border)] bg-[var(--labora-parchment)] px-4 py-3 text-[10px] font-medium leading-relaxed text-[var(--labora-gold)] sm:px-5">
        No conectes una cuenta bancaria ni compartas credenciales. No hay botón «Conectar» operativo: el adaptador falla cerrado a propósito.
      </div>
    </section>
  );
};
