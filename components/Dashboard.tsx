import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Fuel,
  Loader2,
  MessageSquare,
  Play,
  ReceiptText,
  ShieldCheck,
  Square,
  Wallet,
  ClipboardPaste,
  Link2
} from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { useData } from '../contexts/DataContext';
import { GasStationCaptureModal } from './GasStationCaptureModal';
import { finishWorkSession, getActiveWorkSession, listRecentWorkSessions, startWorkSession } from '../services/workSessionService';
import { WorkSession } from '../types';


interface DashboardProps { setView?: (view: string) => void; }

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const greetSpanish = (hour: number) => {
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements, incomes, expenses, showNotification } = useData();
  const { selectedCountry } = useCountry();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<WorkSession[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [odometerInput, setOdometerInput] = useState('');
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    void Promise.all([getActiveWorkSession(), listRecentWorkSessions(30)])
      .then(([session, sessions]) => {
        if (!active) return;
        setActiveSession(session);
        setRecentSessions(sessions);
      })
      .catch((error) => console.error('No se pudo cargar el historial de jornadas.', error))
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    setClockNow(Date.now());
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [activeSession?.id]);

  if (!currentUser) return null;

  const summary = useMemo(() => getFiscalSummary(currentUser.id), [currentUser.id, getFiscalSummary]);
  const pendingRequirements = requirements.filter(
    (requirement) => requirement.riderId === currentUser.id && requirement.status === 'pending'
  );
  const period = currentQuarter();
  const firstName = currentUser.name.trim().split(/\s+/)[0] || currentUser.name;
  const formatCurrency = (amount: number) => privacyMode
    ? '••••'
    : amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: selectedCountry.currency || 'EUR',
        maximumFractionDigits: 0
      });
  const formatCurrencyPrecise = (amount: number) => privacyMode
    ? '••••'
    : amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: selectedCountry.currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

  const nowDate = new Date(clockNow);
  const dayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const todayKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;
  const todayWorkedMs = recentSessions.reduce((total, session) => {
    const start = Math.max(new Date(session.startedAt).getTime(), dayStart);
    const rawEnd = session.endedAt ? new Date(session.endedAt).getTime() : clockNow;
    const end = Math.min(rawEnd, dayEnd);
    return total + Math.max(0, end - start);
  }, 0);
  const todayWorkedHours = todayWorkedMs / (60 * 60 * 1000);
  const todayRegisteredIncome = incomes
    .filter((income) => income.userId === currentUser.id && income.date === todayKey)
    .reduce((sum, income) => sum + income.amount, 0);
  const todayGrossPerHour = todayWorkedHours > 0 ? todayRegisteredIncome / todayWorkedHours : 0;
  const todayKm = recentSessions.reduce((total, session) => {
    const startedAt = new Date(session.startedAt).getTime();
    if (startedAt < dayStart || startedAt >= dayEnd) return total;
    if (session.startOdometerKm == null || session.endOdometerKm == null) return total;
    return total + Math.max(0, session.endOdometerKm - session.startOdometerKm);
  }, 0);
  const todayGrossPerKm = todayKm > 0 ? todayRegisteredIncome / todayKm : 0;
  const todayFuelCost = expenses
    .filter((expense) =>
      expense.userId === currentUser.id
      && expense.date === todayKey
      && String(expense.category).toLowerCase().includes('gasolina')
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
  const todayAfterRegisteredFuel = todayRegisteredIncome - todayFuelCost;

  const elapsedMinutes = activeSession
    ? Math.max(0, Math.floor((clockNow - new Date(activeSession.startedAt).getTime()) / 60_000))
    : 0;
  const elapsedLabel = activeSession
    ? `${Math.floor(elapsedMinutes / 60)} h ${elapsedMinutes % 60} min`
    : 'Sin jornada activa';

  const toggleWorkSession = async () => {
    if (sessionBusy) return;

    const parsedOdometer = odometerInput.trim() ? Number(odometerInput) : undefined;
    if (parsedOdometer !== undefined && (!Number.isFinite(parsedOdometer) || parsedOdometer < 0)) {
      showNotification('error', 'El odómetro debe ser un número válido.');
      return;
    }
    if (
      activeSession?.startOdometerKm != null
      && parsedOdometer !== undefined
      && parsedOdometer < activeSession.startOdometerKm
    ) {
      showNotification('error', 'El kilometraje final no puede ser menor que el inicial.');
      return;
    }

    setSessionBusy(true);
    try {
      if (activeSession) {
        await finishWorkSession(activeSession.id, parsedOdometer);
        setActiveSession(null);
        setRecentSessions(await listRecentWorkSessions(30));
        setOdometerInput('');
        setClockNow(Date.now());
        showNotification('success', 'Jornada finalizada.');
      } else {
        const session = await startWorkSession(parsedOdometer);
        setActiveSession(session);
        setRecentSessions(await listRecentWorkSessions(30));
        setOdometerInput('');
        setClockNow(Date.now());
        showNotification('success', 'Jornada iniciada.');
      }
    } catch (error: any) {
      console.error('No se pudo actualizar la jornada.', error);
      showNotification('error', 'No se pudo actualizar la jornada. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setSessionBusy(false);
    }
  };

  const hasGestoria = Boolean(currentUser.managerId);
  const quickActions = [
    {
      label: 'Importar ingresos',
      description: hasGestoria ? 'Liquidación CSV o texto' : 'Glovo/Uber: pega liquidación',
      icon: ClipboardPaste,
      tone: 'green',
      onClick: () => setView?.('money-incomes')
    },
    {
      label: 'Registrar gasto',
      description: 'Foto, ticket o factura',
      icon: Fuel,
      tone: 'clay',
      onClick: () => setIsGasModalOpen(true)
    },
    {
      label: hasGestoria ? 'Avisos gestoría' : 'Vincular gestoría',
      description: hasGestoria
        ? (pendingRequirements.length ? `${pendingRequirements.length} pendientes` : 'Todo revisado')
        : 'Por correo en Perfil',
      icon: hasGestoria ? Bell : Link2,
      tone: 'amber',
      onClick: () => setView?.(hasGestoria ? 'gestor-requirements' : 'settings')
    },
    {
      label: 'Modelos',
      description: `Periodo ${period}`,
      icon: FileText,
      tone: 'green',
      onClick: () => setView?.('tax-declarations')
    }
  ] as const;

  const nextRequirement = pendingRequirements[0];
  const longDate = nowDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div id="rider-dashboard" className="mx-auto max-w-6xl space-y-9 pb-12">
      <section className="labora-editorial-hero overflow-hidden rounded-[30px] border border-[var(--labora-border)]">
        <div className="relative min-h-[510px] p-7 sm:p-10 lg:p-14">
          <img src="/brand/labora-editorial-hero.webp" alt="Mesa de trabajo con olivo, libros y café" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,243,234,0.99)_0%,rgba(247,243,234,0.96)_40%,rgba(247,243,234,0.18)_75%,rgba(247,243,234,0.05)_100%)]" />
          <div className="relative z-10 flex min-h-[398px] max-w-[520px] flex-col justify-between">
            <div>
              <p className="labora-kicker capitalize text-[var(--labora-primary)]">{longDate}</p>
              <p className="mt-5 text-sm font-semibold text-[var(--labora-muted)]">{greetSpanish(nowDate.getHours())}, {firstName}</p>
              <h1 className="mt-2 text-[clamp(3rem,7vw,5.2rem)] font-semibold leading-[0.93] tracking-[-0.065em] text-[var(--labora-primary)]">
                Tu trabajo,<br />en orden.
              </h1>
              <p className="mt-5 text-lg font-medium text-[var(--labora-muted)]">Tu gestor, cerca. Todo lo demás, claro.</p>
            </div>
            <div className="mt-10 max-w-[390px]">
              <button onClick={() => setView?.('docs')} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[var(--labora-primary)] px-6 text-sm font-extrabold text-white shadow-[0_14px_35px_rgba(33,78,58,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--labora-primary-2)]">
                <FileText size={19} /> Enviar documento <ChevronRight size={17} />
              </button>
              <p className="mt-3 text-center text-xs font-medium text-[var(--labora-muted)]">Facturas, justificantes y contratos, en un momento.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div><p className="labora-kicker text-[var(--labora-muted)]">Lo siguiente</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--labora-ink)]">Tu prioridad</h2></div>
          <button onClick={() => setView?.('gestor-requirements')} className="text-xs font-extrabold text-[var(--labora-primary)]">Ver todo →</button>
        </div>
        <button onClick={() => setView?.(nextRequirement ? 'gestor-requirements' : 'docs')} className="group flex w-full items-center gap-4 border-y border-[var(--labora-border)] py-5 text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--labora-soft-clay)] text-[var(--labora-clay)]"><ReceiptText size={21} /></span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-[var(--labora-ink)]">{nextRequirement?.title || 'Tus documentos están al día'}</strong>
            <span className="mt-1 block truncate text-xs text-[var(--labora-muted)]">{nextRequirement ? 'Tu gestoría necesita este documento.' : 'Puedes subir el próximo justificante cuando quieras.'}</span>
          </span>
          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${nextRequirement ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]' : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}>{nextRequirement ? 'Pendiente' : 'En orden'}</span>
          <ChevronRight size={17} className="text-[var(--labora-muted)] transition group-hover:translate-x-0.5" />
        </button>
      </section>

      <section className="grid gap-7 rounded-[28px] bg-[var(--labora-primary)] p-7 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/60">Tu gestoría</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{hasGestoria ? 'Tu gestor está contigo' : 'Conecta con tu gestor'}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">{hasGestoria ? 'Mensajes, peticiones y documentos compartidos en el mismo lugar.' : 'Un equipo para que tú solo te preocupes de lo importante.'}</p></div>
        <button onClick={() => setView?.(hasGestoria ? 'messages' : 'settings')} className="rounded-full border border-white/45 px-5 py-3 text-sm font-extrabold transition hover:bg-white hover:text-[var(--labora-primary)]">{hasGestoria ? 'Abrir mensajes' : 'Vincular gestoría'} →</button>
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border ${activeSession ? 'border-[var(--labora-border)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'border-[var(--labora-border)] bg-[var(--labora-canvas)] text-[var(--labora-muted)]'}`}>
              <Clock3 size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-sm font-extrabold text-[var(--labora-ink)]">Jornada Labora</p>
                {activeSession && <span className="rounded-full bg-[var(--labora-moss-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--labora-primary)]">En curso</span>}
              </div>
              <p className="mt-1 text-xs text-[var(--labora-muted)]">
                {sessionLoading
                  ? 'Comprobando jornada…'
                  : activeSession
                    ? `Llevas ${elapsedLabel}. Iniciada a las ${new Date(activeSession.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                    : 'Registra tus horas reales. Esta versión no usa GPS ni rastrea tu ubicación.'}
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={odometerInput}
              onChange={(event) => setOdometerInput(event.target.value)}
              placeholder={activeSession ? 'Km al terminar' : 'Km actuales'}
              className="min-h-11 min-w-0 flex-1 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-xs font-bold text-[var(--labora-ink-soft)] outline-none focus:border-[var(--labora-primary-2)] sm:w-32"
              aria-label={activeSession ? 'Kilometraje al terminar' : 'Kilometraje al iniciar'}
            />
            <button
              type="button"
              onClick={() => void toggleWorkSession()}
              disabled={sessionLoading || sessionBusy}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[13px] px-4 py-2.5 text-xs font-extrabold transition disabled:opacity-50 ${activeSession ? 'border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)] hover:bg-[var(--labora-soft-clay)]' : 'bg-[var(--labora-primary)] text-white hover:opacity-90'}`}
            >
              {sessionBusy ? <Loader2 size={15} className="animate-spin" /> : activeSession ? <Square size={14} /> : <Play size={15} />}
              {activeSession ? 'Finalizar' : 'Iniciar'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--labora-border)] pt-4 sm:grid-cols-4">
          <MiniMetric label="Horas hoy" value={todayWorkedHours > 0 ? `${todayWorkedHours.toFixed(1)} h` : '0 h'} />
          <MiniMetric label="Km cerrados" value={todayKm > 0 ? `${todayKm.toFixed(1)} km` : '—'} />
          <MiniMetric label="Ingresos hoy" value={formatCurrency(todayRegisteredIncome)} />
          <MiniMetric
            label={`${selectedCountry.currency_symbol || '€'}/h bruto`}
            value={todayWorkedHours > 0 ? formatCurrencyPrecise(todayGrossPerHour) : '—'}
            emphasis
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-medium text-[var(--labora-muted)]">
          <span>Gasolina registrada hoy: <strong className="text-[var(--labora-muted)]">{formatCurrencyPrecise(todayFuelCost)}</strong></span>
          <span>Ingresos − gasolina: <strong className="text-[var(--labora-muted)]">{formatCurrencyPrecise(todayAfterRegisteredFuel)}</strong></span>
          <span>{selectedCountry.currency_symbol || '€'}/km bruto: <strong className="text-[var(--labora-muted)]">{todayKm > 0 ? formatCurrencyPrecise(todayGrossPerKm) : '—'}</strong></span>
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-[var(--labora-muted)]">
          Métricas operativas basadas solo en datos registrados. “Ingresos − gasolina” no es beneficio neto: faltan mantenimiento, seguro, cuota, depreciación, impuestos y otros costes.
        </p>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="labora-kicker text-[var(--labora-muted)]">Ahora</p>
            <h2 className="labora-title mt-1.5 text-[1.35rem] text-[var(--labora-ink)]">Acciones rápidas</h2>
          </div>
          <span className="hidden text-xs font-medium text-[var(--labora-muted)] sm:block">Lo más usado, sin menús extra</span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const tone = action.tone === 'clay'
              ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)] border-[var(--labora-border)]'
              : action.tone === 'amber'
              ? 'bg-[color-mix(in_srgb,var(--labora-gold)_14%,var(--labora-surface))] text-[var(--labora-gold)] border-[var(--labora-border)]'
              : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)] border-[var(--labora-border)]';

            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="labora-card labora-card-interactive group px-4 py-5 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border ${tone}`}>
                      <Icon size={19} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold tracking-[-0.015em] text-[var(--labora-ink)]">{action.label}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-[var(--labora-muted)]">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--labora-muted)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="labora-kicker text-[var(--labora-muted)]">Este periodo</p>
          <h2 className="labora-title mt-1.5 text-[1.35rem] text-[var(--labora-ink)]">Tus números</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <Metric onClick={() => setView?.('money-incomes')} icon={Wallet} label="Ingresos" value={formatCurrency(summary.totalIncome)} />
          <Metric onClick={() => setView?.('money')} icon={ReceiptText} label="Gastos" value={formatCurrency(summary.totalExpenses)} accent />
          <Metric onClick={() => setView?.('money')} icon={ShieldCheck} label="Neto operativo" value={formatCurrency(summary.netProfit)} />
          <Metric onClick={() => setView?.('messages')} icon={MessageSquare} label="Gestoría" value="Abrir chat" compact />
        </div>
      </section>

      {pendingRequirements.length > 0 && (
        <section className="rounded-[22px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[var(--labora-ink)]">
                  {pendingRequirements.length === 1 ? 'Tu gestoría necesita una cosa' : `Tu gestoría necesita ${pendingRequirements.length} cosas`}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">Resuélvelas aquí para mantener el trimestre al día.</p>
              </div>
            </div>
            <button onClick={() => setView?.('gestor-requirements')} className="shrink-0 rounded-xl bg-[var(--labora-primary)] px-3 py-2 text-xs font-extrabold text-white">
              Revisar
            </button>
          </div>
        </section>
      )}

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const MiniMetric = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
  <div className={`min-w-0 rounded-[12px] px-2 py-2.5 ${emphasis ? 'bg-[var(--labora-moss-soft)]' : 'bg-[var(--labora-surface-2)]'}`}>
    <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.09em] text-[var(--labora-muted)]">{label}</p>
    <p className={`mt-1 truncate text-xs font-extrabold ${emphasis ? 'text-[var(--labora-primary)]' : 'text-[var(--labora-ink)]'}`}>{value}</p>
  </div>
);

const Metric = ({ onClick, icon: Icon, label, value, accent = false, compact = false }: any) => (
  <button onClick={onClick} className="labora-card labora-card-interactive p-5 sm:p-6 text-left">
    <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${accent ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay)]' : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}>
      <Icon size={18} strokeWidth={2.2} />
    </div>
    <p className="mt-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--labora-muted)]">{label}</p>
    <p className={`mt-1.5 font-extrabold tracking-[-0.03em] text-[var(--labora-ink)] ${compact ? 'text-sm' : 'text-[1.35rem]'}`}>{value}</p>
  </button>
);

export default Dashboard;
