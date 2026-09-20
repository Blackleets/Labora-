import React from 'react';
import { LockKeyhole, MessageSquare, ShieldCheck } from 'lucide-react';
import FiscalChat from '../../../components/FiscalChat';

/**
 * Policy Manager / Approval Inbox previously used localStorage demo data.
 * Until those workflows are server-backed, this hub only exposes Fiscal AI
 * (authenticated edge function) and states the rest as unavailable.
 */
export const AutomationHub: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="labora-card overflow-hidden">
        <div className="bg-[var(--labora-primary)] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="labora-kicker text-white/55">Asistente</p>
            <span className="rounded-full border border-[var(--labora-surface)]/15 bg-[var(--labora-surface)]/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/75">
              Solo IA fiscal autenticada
            </span>
          </div>
          <h2 className="labora-display mt-1 text-xl font-semibold">Asistencia fiscal con evidencia</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            El chat usa la edge function <code className="text-white/90">labora-ai</code> con sesión Supabase.
            Policy Engine y bandeja de aprobaciones locales quedan fuera: no son flujos de producción.
          </p>
        </div>
        <div className="grid gap-3 border-b border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4 text-[11px] leading-relaxed text-[var(--labora-gold)] sm:grid-cols-2 sm:p-5">
          <div className="flex gap-2">
            <LockKeyhole size={14} className="mt-0.5 shrink-0" />
            <p>Sin políticas ni aprobaciones simuladas en localStorage.</p>
          </div>
          <div className="flex gap-2">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <p>Si falta la clave Gemini en servidor, la IA falla cerrado y puedes seguir a mano.</p>
          </div>
        </div>
      </section>

      <section className="labora-card overflow-hidden p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-[var(--labora-primary)]">
          <MessageSquare size={15} /> Chat fiscal
        </div>
        <FiscalChat />
      </section>
    </div>
  );
};
