import React from 'react';
import { LockKeyhole, Shield } from 'lucide-react';

/**
 * Policy engine UI previously shipped seeded demo policies. Until real org policies
 * exist in the database, this surface stays explicitly empty.
 */
export const PolicyManager: React.FC = () => (
  <section className="labora-card mx-auto max-w-3xl p-6">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
        <Shield size={20} />
      </div>
      <div>
        <p className="labora-kicker text-[var(--labora-primary-2)]">Políticas</p>
        <h2 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">Sin políticas de demostración.</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--labora-muted)]">
          No hay motor de políticas de empresa en producción. No se muestran reglas inventadas ni
          aprobaciones de nómina ficticias.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--labora-gold)]">
          <LockKeyhole size={13} /> Fail-closed hasta datos reales
        </p>
      </div>
    </div>
  </section>
);
