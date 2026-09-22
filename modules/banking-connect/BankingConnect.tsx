import React from 'react';
import { Building2, FileUp, ShieldCheck, Sparkles } from 'lucide-react';

export const BankingConnect: React.FC = () => (
  <section className="labora-card overflow-hidden">
    <div className="relative overflow-hidden bg-[var(--labora-primary)] p-6 text-white sm:p-8">
      <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[var(--labora-gold-soft)]/15" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-white/15 bg-white/10 text-[var(--labora-gold-soft)]">
          <Building2 size={24} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="labora-kicker text-white/60">Banca</p>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/80">Próximamente</span>
          </div>
          <h2 className="labora-display mt-1 text-2xl font-semibold text-white">Tus movimientos, en un solo lugar.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">Estamos preparando una conexión bancaria segura para organizar ingresos, gastos y conciliaciones desde Labora+.</p>
        </div>
      </div>
    </div>
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <Info icon={ShieldCheck} title="Conexión protegida">El acceso se autorizará directamente con tu entidad bancaria, siempre con tu consentimiento.</Info>
      <Info icon={Sparkles} title="Conciliación sencilla" warm>Podrás revisar movimientos y relacionarlos con tu actividad sin perder tiempo.</Info>
    </div>
    <div className="border-t border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-primary)]"><FileUp size={18} aria-hidden /></div>
        <div>
          <p className="text-sm font-extrabold text-[var(--labora-ink)]">Mientras tanto, sigue llevando todo al día</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">Añade tus movimientos desde <span className="font-semibold text-[var(--labora-ink-soft)]">Ingresos y gastos</span> o sube tus documentos para compartirlos con tu gestoría.</p>
        </div>
      </div>
    </div>
  </section>
);

const Info = ({ icon: Icon, title, children, warm = false }: { icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>; title: string; children: React.ReactNode; warm?: boolean }) => (
  <div className="rounded-[18px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4">
    <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${warm ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]' : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}><Icon size={18} aria-hidden /></div>
    <p className="mt-3 text-sm font-extrabold text-[var(--labora-ink)]">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">{children}</p>
  </div>
);
