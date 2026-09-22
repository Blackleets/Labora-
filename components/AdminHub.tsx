import React, { useMemo } from 'react';
import { Activity, BellRing, Building2, FileText, ShieldCheck, UserRound, Users, WalletCards } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';

export const AdminHub: React.FC = () => {
  const { currentUser, users, incomes, expenses, documents, requirements } = useData();
  const metrics = useMemo(() => ({
    users: users.length,
    riders: users.filter((user) => user.role === UserRole.RIDER).length,
    managers: users.filter((user) => user.role === UserRole.MANAGER).length,
    pending: requirements.filter((item) => item.status === 'pending' || item.status === 'submitted').length,
    documents: documents.length,
    movements: incomes.length + expenses.length
  }), [users, incomes, expenses, documents, requirements]);

  if (currentUser?.role !== UserRole.ADMIN) return null;

  const cards = [
    ['Usuarios', metrics.users, Users],
    ['Trabajadores', metrics.riders, UserRound],
    ['Gestorías', metrics.managers, Building2],
    ['Peticiones abiertas', metrics.pending, BellRing],
    ['Documentos', metrics.documents, FileText],
    ['Movimientos', metrics.movements, WalletCards]
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="labora-kicker text-[var(--labora-primary-2)]">Administración</p><h1 className="labora-display mt-1 text-3xl font-semibold text-[var(--labora-ink)]">Centro de control</h1><p className="mt-2 max-w-2xl text-sm text-[var(--labora-muted)]">Visión global de la plataforma, separada de la experiencia de trabajadores y gestorías.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-3 py-2 text-xs font-bold text-[var(--labora-primary)]"><ShieldCheck size={15} aria-hidden /> Acceso administrador</span>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon]) => <article key={label} className="labora-card p-5"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><Icon size={18} aria-hidden /></div><span className="text-2xl font-extrabold text-[var(--labora-ink)]">{value}</span></div><p className="mt-4 text-xs font-bold text-[var(--labora-muted)]">{label}</p></article>)}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="labora-card p-5"><div className="flex items-center gap-3"><Activity size={18} className="text-[var(--labora-primary)]" /><h2 className="text-sm font-extrabold text-[var(--labora-ink)]">Operación</h2></div><div className="mt-4 space-y-3"><Status label="Identidad y roles" value="Protegido" /><Status label="Datos operativos" value="Activo" /><Status label="Banca abierta" value="Pendiente" muted /><Status label="Facturación" value="Configuración pendiente" muted /></div></article>
        <article className="labora-card p-5"><div className="flex items-center gap-3"><ShieldCheck size={18} className="text-[var(--labora-primary)]" /><h2 className="text-sm font-extrabold text-[var(--labora-ink)]">Gobierno y seguridad</h2></div><p className="mt-4 text-xs leading-relaxed text-[var(--labora-muted)]">Este espacio concentra el estado técnico y operativo. Los usuarios finales solo ven funciones claras y disponibles.</p><div className="mt-4 rounded-[16px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4 text-xs leading-relaxed text-[var(--labora-muted)]">Las acciones sensibles de edición, suspensión y soporte se incorporarán con registro de auditoría y confirmación explícita antes de habilitarse.</div></article>
      </section>
    </div>
  );
};

const Status = ({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) => <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[var(--labora-surface-2)] px-4 py-3 text-xs"><span className="font-semibold text-[var(--labora-ink-soft)]">{label}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${muted ? 'bg-[var(--labora-parchment)] text-[var(--labora-gold)]' : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}>{value}</span></div>;
