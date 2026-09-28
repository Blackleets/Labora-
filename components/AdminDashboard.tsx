import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { loadAdminOverview, type AdminOverviewSnapshot } from '../services/adminOverview';
import { UserRole } from '../types';

const StatCard = ({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ size?: number }>;
}) => (
  <article className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="labora-label text-[var(--labora-muted)]">{label}</p>
        <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--labora-ink)]">{value}</p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--labora-muted)]">{detail}</p>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
        <Icon size={20} />
      </span>
    </div>
  </article>
);

const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    incomes,
    expenses,
    documents,
    requirements,
    declarations
  } = useData();
  const [remote, setRemote] = useState<AdminOverviewSnapshot | null>(null);
  const [remoteError, setRemoteError] = useState('');
  const [loadingRemote, setLoadingRemote] = useState(true);

  const refreshRemote = async () => {
    setLoadingRemote(true);
    setRemoteError('');
    try {
      setRemote(await loadAdminOverview());
    } catch (error) {
      setRemote(null);
      setRemoteError(error instanceof Error ? error.message : 'No se pudo cargar el resumen global.');
    } finally {
      setLoadingRemote(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) void refreshRemote();
  }, [currentUser?.id, currentUser?.role]);

  const summary = useMemo(() => ({
    workers: users.filter((user) => user.role === UserRole.RIDER).length,
    managers: users.filter((user) => user.role === UserRole.MANAGER).length,
    admins: users.filter((user) => user.role === UserRole.ADMIN).length,
    linkedWorkers: users.filter((user) => user.role === UserRole.RIDER && Boolean(user.managerId)).length,
    pendingRequirements: requirements.filter((item) => item.status === 'pending').length,
    pendingDeclarations: declarations.filter((item) => item.status !== 'filed').length
  }), [declarations, requirements, users]);

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-8 text-center">
        <ShieldCheck className="mx-auto text-[var(--labora-primary)]" size={32} />
        <h2 className="mt-4 text-xl font-extrabold text-[var(--labora-ink)]">Área restringida</h2>
        <p className="mt-2 text-sm text-[var(--labora-muted)]">Este panel solo está disponible para cuentas administradoras.</p>
      </div>
    );
  }

  const coverage = summary.workers > 0
    ? Math.round((summary.linkedWorkers / summary.workers) * 100)
    : 0;
  const visibleUsers = remote?.users.total ?? users.length;
  const visibleWorkers = remote?.users.workers ?? summary.workers;
  const visibleManagers = remote?.users.managers ?? summary.managers;
  const visibleAdmins = remote?.users.admins ?? summary.admins;
  const visibleDocuments = remote?.records.documents ?? documents.length;
  const visibleIncomes = remote?.records.incomes ?? incomes.length;
  const visibleExpenses = remote?.records.expenses ?? expenses.length;
  const visiblePendingRequirements = remote?.records.pendingRequirements ?? summary.pendingRequirements;
  const visiblePendingDeclarations = remote?.records.pendingDeclarations ?? summary.pendingDeclarations;

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[28px] border border-[var(--labora-border)] bg-[var(--labora-primary)] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              <ShieldCheck size={15} /> Control de plataforma
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Administración Labora+</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
              Vista operativa de usuarios y registros accesibles para esta sesión. Las cifras proceden de datos reales cargados; no incluyen estimaciones.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Sesión</p>
              <p className="mt-1 text-sm font-bold">{currentUser.email}</p>
            </div>
            <button type="button" onClick={() => void refreshRemote()} disabled={loadingRemote} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50" aria-label="Actualizar resumen global">
              <RefreshCw size={16} className={loadingRemote ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios" value={visibleUsers} detail={`${visibleWorkers} trabajadores · ${visibleManagers} gestorías · ${visibleAdmins} admin`} icon={Users} />
        <StatCard label="Documentos" value={visibleDocuments} detail={remote ? 'Conteo global protegido por servidor' : 'Archivos visibles para la sesión'} icon={FileText} />
        <StatCard label="Movimientos" value={visibleIncomes + visibleExpenses} detail={`${visibleIncomes} ingresos · ${visibleExpenses} gastos`} icon={ReceiptText} />
        <StatCard label="Pendientes" value={visiblePendingRequirements + visiblePendingDeclarations} detail={`${visiblePendingRequirements} solicitudes · ${visiblePendingDeclarations} declaraciones`} icon={AlertTriangle} />
      </section>

      {remoteError && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-4 py-3 text-xs leading-relaxed text-[var(--labora-clay)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>Resumen global no disponible: {remoteError} Se muestran únicamente los datos autorizados cargados en esta sesión.</span>
        </div>
      )}

      {remote && (
        <section className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-[var(--labora-ink)]">Distribución por país</h2>
              <p className="mt-1 text-xs text-[var(--labora-muted)]">Perfiles globales agregados, sin exponer identidad personal</p>
            </div>
            <p className="text-[10px] font-semibold text-[var(--labora-muted)]">Actualizado {new Date(remote.generatedAt).toLocaleString()}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.entries(remote.countries) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
              <span key={country} className="rounded-full bg-[var(--labora-surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--labora-ink-soft)]">{country} · {count}</span>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><Building2 size={19} /></span>
            <div>
              <h2 className="font-extrabold text-[var(--labora-ink)]">Cobertura de gestoría</h2>
              <p className="text-xs text-[var(--labora-muted)]">Trabajadores visibles vinculados a una cuenta profesional</p>
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="text-4xl font-extrabold text-[var(--labora-ink)]">{coverage}%</p>
            <p className="text-right text-xs font-semibold text-[var(--labora-muted)]">{summary.linkedWorkers} de {summary.workers}</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--labora-surface-2)]">
            <div className="h-full rounded-full bg-[var(--labora-primary)]" style={{ width: `${coverage}%` }} />
          </div>
        </article>

        <article className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><Activity size={19} /></span>
            <div>
              <h2 className="font-extrabold text-[var(--labora-ink)]">Estado funcional</h2>
              <p className="text-xs text-[var(--labora-muted)]">Módulos conectados al espacio operativo</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-semibold text-[var(--labora-ink-soft)]">
            {['Autenticación', 'Usuarios y roles', 'Documentos', 'Ingresos y gastos', 'Solicitudes', 'Declaraciones'].map((label) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-[var(--labora-surface-2)] px-3 py-2.5">
                <CheckCircle2 size={14} className="shrink-0 text-[var(--labora-primary)]" /> {label}
              </div>
            ))}
          </div>
        </article>
      </section>

      <p className="rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-4 py-3 text-xs leading-relaxed text-[var(--labora-muted)]">
        Seguridad: este primer panel es de observación. Cambiar roles, suspender usuarios o acceder globalmente a información privada requerirá operaciones administrativas protegidas en Supabase; no se habilitan desde el navegador sin ese control.
      </p>
    </div>
  );
};

export default AdminDashboard;
