import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, CalendarDays, Clock3, Download, Loader2, Lock, Pencil, Play, Plus, Square, Target, Trash2, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useCountry } from '../../contexts/CountryContext';
import { GLOBAL_INTEGRATION_CATALOG } from '../../modules/integrations/data/catalog';
import { finishWorkSession, getActiveWorkSession, listRecentWorkSessions, startWorkSession } from '../../services/workSessionService';
import { downloadCsv } from '../../services/quarterExport';
import {
  ConversionGroup,
  DEFAULT_ORDER_PLATFORMS,
  OrderInput,
  OrderLogEntry,
  REJECT_REASON_LABELS,
  breakdownByDay,
  breakdownByPlatform,
  compareWithSettlements,
  dailySeries,
  goalProgress,
  isConverted,
  localDayKey,
  localMonthKey,
  netEstimate,
  normalizePlatformKey,
  orderCsvRows,
  ordersInMonth,
  ordersOnDay,
  parseDecimalInput,
  planIncomeConversion,
  rejectReasonCounts,
  settlementOverlaps,
  summarizeOrders,
  weeklySeries,
  workedMsOnDay
} from '../../services/orderLog';
import { deleteOrder, insertOrder, listOrders, markOrdersConverted, updateOrder } from '../../services/orderLogRepository';
import type { WorkSession } from '../../types';
import { FieldLabel, formControlFocusClass } from '../formA11y';
import { OrderBars } from './OrderBars';
import { OrderForm } from './OrderForm';
import { useOrderModule } from './useOrderModule';

const LAST_PLATFORM_KEY = (userId: string) => `labora_orders_last_platform_${userId}`;

const monthStartIso = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toISOString();
};

const pctLabel = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);

export const OrderLogView: React.FC<{ setView?: (view: string) => void }> = ({ setView }) => {
  const { currentUser, expenses, incomes, addIncomes, privacyMode, showNotification } = useData();
  const { selectedCountry } = useCountry();
  const { enabled, ready, dailyGoal, save } = useOrderModule();
  const [orders, setOrders] = useState<OrderLogEntry[]>([]);
  const [loadedSince, setLoadedSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [chartMode, setChartMode] = useState<'days' | 'weeks'>('days');
  const [month, setMonth] = useState(localMonthKey(new Date()));
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrderLogEntry | null>(null);
  const [conversion, setConversion] = useState<{ scope: string; groups: ConversionGroup[] } | null>(null);
  const [converting, setConverting] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [goalOpen, setGoalOpen] = useState(false);

  const userId = currentUser?.id || '';
  const todayKey = localDayKey(new Date(nowMs));
  const currency = selectedCountry.currency || 'EUR';
  const currencySymbol = selectedCountry.currency_symbol || '€';
  const formatMoney = useCallback((value: number) => (privacyMode
    ? '••••'
    : value.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 2 })), [privacyMode, currency]);

  const [lastPlatform, setLastPlatform] = useState<string | undefined>(() => (userId ? localStorage.getItem(LAST_PLATFORM_KEY(userId)) || undefined : undefined));

  const platformOptions = useMemo(() => {
    const names = new Map<string, string>();
    const add = (name: string) => { if (name && !names.has(normalizePlatformKey(name))) names.set(normalizePlatformKey(name), name); };
    for (const item of currentUser?.platforms || []) {
      const match = GLOBAL_INTEGRATION_CATALOG.find((entry) => entry.id === item || entry.name.toLowerCase() === item.toLowerCase());
      if (!match || match.category === 'delivery' || match.category === 'mobility') add(match?.name || item);
    }
    DEFAULT_ORDER_PLATFORMS.forEach(add);
    return Array.from(names.values());
  }, [currentUser?.platforms]);

  // Carga: desde el inicio del mes elegido o 6 semanas atrás (gráfico semanal), lo que sea antes.
  const neededSince = useMemo(() => {
    const sixWeeks = new Date(nowMs - 42 * 86_400_000);
    const sixWeeksIso = new Date(sixWeeks.getFullYear(), sixWeeks.getMonth(), sixWeeks.getDate()).toISOString();
    const monthIso = monthStartIso(month);
    return monthIso < sixWeeksIso ? monthIso : sixWeeksIso;
  }, [month, nowMs]);

  useEffect(() => {
    if (!enabled) return;
    if (loadedSince && loadedSince <= neededSince) return;
    let active = true;
    setLoading(true);
    listOrders(neededSince)
      .then((rows) => { if (active) { setOrders(rows); setLoadedSince(neededSince); setLoadError(''); } })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los pedidos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled, neededSince, loadedSince]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void Promise.all([getActiveWorkSession(), listRecentWorkSessions(60)])
      .then(([session, recent]) => { if (active) { setActiveSession(session); setSessions(recent); } })
      .catch(() => undefined);
    return () => { active = false; };
  }, [enabled]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const liveIncomeIds = useMemo(() => new Set(incomes.filter((income) => income.userId === userId).map((income) => income.id)), [incomes, userId]);
  const myIncomes = useMemo(() => incomes.filter((income) => income.userId === userId), [incomes, userId]);

  if (!currentUser) return null;

  if (!ready) {
    return <p className="p-6 text-center text-xs text-[var(--labora-muted)]" role="status">Cargando módulo…</p>;
  }

  if (!enabled) {
    return (
      <section className="labora-card mx-auto max-w-xl p-6 text-center" role="status">
        <p className="text-sm font-extrabold text-[var(--labora-ink)]">El registro de pedidos está desactivado.</p>
        <p className="mt-1 text-xs text-[var(--labora-muted)]">Actívalo en Perfil y ajustes → Módulos.</p>
        <button type="button" onClick={() => setView?.('settings')} className={`mt-4 min-h-11 rounded-[13px] bg-[var(--labora-primary)] px-4 text-xs font-extrabold text-white ${formControlFocusClass}`}>Ir a Ajustes</button>
      </section>
    );
  }

  const todayOrders = ordersOnDay(orders, todayKey);
  const workedToday = workedMsOnDay(activeSession && !sessions.some((s) => s.id === activeSession.id) ? [activeSession, ...sessions] : sessions, todayKey, nowMs);
  const today = summarizeOrders(todayOrders, workedToday);
  const todayExpenses = expenses
    .filter((expense) => expense.userId === userId && expense.date === todayKey)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const todayNet = netEstimate(today.earnings, todayExpenses);
  const goal = goalProgress(today.earnings, dailyGoal);

  const monthOrders = ordersInMonth(orders, month);
  const monthSummary = summarizeOrders(monthOrders);
  const byPlatform = breakdownByPlatform(monthOrders);
  const byDay = breakdownByDay(monthOrders);
  const reasons = rejectReasonCounts(monthOrders);
  const settlements = compareWithSettlements(orders, myIncomes, month);
  const series = chartMode === 'days' ? dailySeries(orders, todayKey, 7) : weeklySeries(orders, todayKey, 6);

  const rememberPlatform = (platform: string) => {
    setLastPlatform(platform);
    try { localStorage.setItem(LAST_PLATFORM_KEY(userId), platform); } catch { /* almacenamiento no disponible */ }
  };

  const handleCreate = async (input: OrderInput) => {
    const created = await insertOrder(input);
    setOrders((previous) => [created, ...previous].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
    rememberPlatform(created.platform);
    showNotification('success', created.status === 'accepted' ? `Pedido de ${created.platform} guardado.` : `Rechazo de ${created.platform} guardado.`);
  };

  const handleUpdate = async (input: OrderInput) => {
    if (!editing) return;
    const updated = await updateOrder(editing.id, input);
    setOrders((previous) => previous.map((order) => (order.id === updated.id ? updated : order)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
    setEditing(null);
    showNotification('success', 'Pedido actualizado.');
  };

  const handleDelete = async (order: OrderLogEntry) => {
    const extra = isConverted(order, liveIncomeIds) ? ' Ya se pasó a ingresos: el ingreso no se borra; revísalo en Ingresos.' : '';
    if (!window.confirm(`¿Eliminar este pedido de ${order.platform}?${extra}`)) return;
    try {
      await deleteOrder(order.id);
      setOrders((previous) => previous.filter((item) => item.id !== order.id));
      showNotification('success', 'Pedido eliminado.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo eliminar el pedido.');
    }
  };

  const toggleShift = async () => {
    setShiftBusy(true);
    try {
      if (activeSession) {
        const finished = await finishWorkSession(activeSession.id);
        setActiveSession(null);
        setSessions((previous) => [finished, ...previous.filter((session) => session.id !== finished.id)]);
        showNotification('success', 'Jornada terminada.');
      } else {
        const started = await startWorkSession();
        setActiveSession(started);
        setSessions((previous) => [started, ...previous]);
        showNotification('success', 'Jornada iniciada.');
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo actualizar la jornada.');
    } finally {
      setShiftBusy(false);
    }
  };

  const openConversion = (scope: string, scopeOrders: OrderLogEntry[]) => {
    const groups = planIncomeConversion(scopeOrders, liveIncomeIds);
    if (!groups.length) {
      showNotification('info', 'No hay pedidos aceptados pendientes de pasar a ingresos.');
      return;
    }
    setConversion({ scope, groups });
  };

  const confirmConversion = async () => {
    if (!conversion) return;
    setConverting(true);
    try {
      const created = addIncomes(conversion.groups.map((group) => ({
        platform: group.platform,
        date: group.date,
        amount: group.amount,
        retention: 0,
        sourceType: 'manual',
        sourceReference: `Registro de pedidos · ${group.count} ${group.count === 1 ? 'pedido' : 'pedidos'}`,
        needsReview: true
      })));
      const convertedAt = new Date().toISOString();
      for (let index = 0; index < conversion.groups.length; index += 1) {
        const group = conversion.groups[index];
        const incomeId = created[index]?.id;
        if (!incomeId) continue;
        await markOrdersConverted(group.orderIds, incomeId);
        setOrders((previous) => previous.map((order) => (group.orderIds.includes(order.id) ? { ...order, convertedIncomeId: incomeId, convertedAt } : order)));
      }
      setConversion(null);
    } catch (error) {
      setConversion(null);
      showNotification('error', `Los ingresos se crearon, pero algunos pedidos no se pudieron marcar (${error instanceof Error ? error.message : 'error de red'}). Revisa Ingresos antes de repetir para no duplicar.`);
    } finally {
      setConverting(false);
    }
  };

  const saveGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseDecimalInput(goalDraft);
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000)) {
      showNotification('error', 'El objetivo debe ser un importe positivo.');
      return;
    }
    try {
      await save({ ordersEnabled: true, dailyGoal: parsed ?? null });
      setGoalOpen(false);
      showNotification('success', parsed ? 'Objetivo diario guardado.' : 'Objetivo diario quitado.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar el objetivo.');
    }
  };

  const exportMonth = () => {
    downloadCsv(`labora_pedidos_${month}.csv`, orderCsvRows(monthOrders, liveIncomeIds));
    showNotification('success', `Pedidos de ${month} descargados.`);
  };

  const elapsed = activeSession ? Math.max(0, Math.floor((nowMs - new Date(activeSession.startedAt).getTime()) / 60_000)) : 0;
  const overlaps = conversion ? settlementOverlaps(conversion.groups, myIncomes) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="labora-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="labora-kicker text-[var(--labora-muted)]">Módulo · Registro de pedidos</p>
            <h2 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">Nuevo pedido</h2>
          </div>
          <p className="inline-flex max-w-xs items-start gap-1.5 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            <Lock size={12} className="mt-0.5 shrink-0" aria-hidden /> Solo tú ves estos datos; tu gestoría no. Lo apuntas tú: Labora+ no se conecta a tu cuenta de ninguna plataforma.
          </p>
        </div>
        <div className="mt-4">
          <OrderForm idPrefix="labora-order-new" platforms={platformOptions} lastPlatform={lastPlatform} submitLabel="Guardar pedido" onSubmit={handleCreate} currencySymbol={currencySymbol} />
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-[15px] ${activeSession ? 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'bg-[var(--labora-surface-2)] text-[var(--labora-muted)]'}`}><Clock3 size={19} aria-hidden /></div>
            <div>
              <p className="text-sm font-extrabold text-[var(--labora-ink)]">Jornada</p>
              <p className="text-xs text-[var(--labora-muted)]" aria-live="polite">
                {activeSession ? `En curso · ${Math.floor(elapsed / 60)} h ${elapsed % 60} min` : 'Inicia la jornada para calcular tu €/hora. Sin GPS.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void toggleShift()}
            disabled={shiftBusy}
            className={`inline-flex min-h-12 items-center gap-2 rounded-[14px] px-5 text-sm font-extrabold disabled:opacity-50 ${activeSession ? 'border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]' : 'bg-[var(--labora-primary)] text-white'} ${formControlFocusClass}`}
          >
            {shiftBusy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : activeSession ? <Square size={15} aria-hidden /> : <Play size={16} aria-hidden />}
            {activeSession ? 'Terminar jornada' : 'Iniciar jornada'}
          </button>
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-orders-today">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="labora-orders-today" className="text-base font-extrabold text-[var(--labora-ink)]">Hoy</h2>
          <button type="button" onClick={() => openConversion('hoy', todayOrders)} className={`inline-flex min-h-10 items-center gap-1.5 rounded-[12px] px-3 text-xs font-extrabold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] ${formControlFocusClass}`}>
            <ArrowRightLeft size={14} aria-hidden /> Pasar hoy a ingresos
          </button>
        </div>
        {loadError && <p role="alert" className="mt-2 text-xs font-bold text-[var(--labora-clay-deep)]">{loadError}</p>}
        {loading && !orders.length ? (
          <p className="mt-3 text-xs text-[var(--labora-muted)]" role="status">Cargando pedidos…</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Aceptados" value={String(today.accepted)} />
              <Metric label="Rechazados" value={String(today.rejected)} />
              <Metric label="% aceptación" value={pctLabel(today.acceptanceRate)} />
              <Metric label="Ganado (aceptados)" value={formatMoney(today.earnings)} emphasis />
              <Metric label="Km" value={today.km > 0 ? `${today.km.toLocaleString('es-ES')} km` : '—'} />
              <Metric label={`${currencySymbol}/km`} value={today.eurPerKm === null ? '—' : formatMoney(today.eurPerKm)} />
              <Metric label={`${currencySymbol}/hora`} value={today.eurPerHour === null ? '—' : formatMoney(today.eurPerHour)} />
              <Metric label="Gastos hoy" value={formatMoney(todayExpenses)} />
            </div>
            <div className="mt-3 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface-2)] p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--labora-muted)]">Neto estimado antes de impuestos</p>
              <p className={`mt-1 text-xl font-extrabold ${todayNet < 0 ? 'text-[var(--labora-clay-deep)]' : 'text-[var(--labora-ink)]'}`}>{formatMoney(todayNet)}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--labora-muted)]">Ganado en pedidos aceptados − gastos registrados hoy. No descuenta IRPF, IVA, cuota de autónomo ni costes no registrados.</p>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-ink)]"><Target size={14} aria-hidden /> Objetivo diario</p>
                <button type="button" onClick={() => { setGoalDraft(dailyGoal ? String(dailyGoal).replace('.', ',') : ''); setGoalOpen((value) => !value); }} className={`min-h-10 rounded-[12px] px-3 text-xs font-extrabold text-[var(--labora-primary)] ${formControlFocusClass}`}>
                  {dailyGoal ? 'Cambiar' : 'Fijar objetivo'}
                </button>
              </div>
              {goal ? (
                <div className="mt-1">
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--labora-surface-2)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goal.pct} aria-label="Progreso del objetivo diario">
                    <div className="h-full rounded-full bg-[var(--labora-primary)]" style={{ width: `${goal.pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--labora-muted)]">{goal.reached ? '¡Objetivo cumplido!' : `${goal.pct}% · faltan ${formatMoney(goal.remaining)} de ${formatMoney(dailyGoal || 0)}`}</p>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-[var(--labora-muted)]">Sin objetivo. Es tuyo y solo sirve para seguir tu progreso.</p>
              )}
              {goalOpen && (
                <form onSubmit={saveGoal} className="mt-2 flex items-end gap-2">
                  <div className="flex-1">
                    <FieldLabel htmlFor="labora-orders-goal">Objetivo ({currencySymbol}/día) · vacío para quitar</FieldLabel>
                    <input id="labora-orders-goal" inputMode="decimal" value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} className={`min-h-11 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-sm font-bold text-[var(--labora-ink)] ${formControlFocusClass}`} />
                  </div>
                  <button type="submit" className={`min-h-11 rounded-[13px] bg-[var(--labora-primary)] px-4 text-xs font-extrabold text-white ${formControlFocusClass}`}>Guardar</button>
                </form>
              )}
            </div>
          </>
        )}
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-[var(--labora-ink)]">{chartMode === 'days' ? 'Últimos 7 días' : 'Últimas 6 semanas'}</h2>
          <div className="flex gap-1 rounded-[13px] bg-[var(--labora-surface-2)] p-1" role="group" aria-label="Periodo del gráfico">
            {(['days', 'weeks'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={chartMode === mode} onClick={() => setChartMode(mode)} className={`min-h-9 rounded-[10px] px-3 text-xs font-extrabold ${chartMode === mode ? 'bg-[var(--labora-surface)] text-[var(--labora-primary)] shadow-sm' : 'text-[var(--labora-muted)]'} ${formControlFocusClass}`}>
                {mode === 'days' ? 'Días' : 'Semanas'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <OrderBars points={series} formatMoney={formatMoney} caption={chartMode === 'days' ? 'Ganado por día' : 'Ganado por semana'} />
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-orders-month">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="labora-orders-month" className="inline-flex items-center gap-2 text-base font-extrabold text-[var(--labora-ink)]"><CalendarDays size={16} aria-hidden /> Mes</h2>
            <div className="mt-2">
              <FieldLabel htmlFor="labora-orders-month-input">Mes</FieldLabel>
              <input id="labora-orders-month-input" type="month" value={month} max={localMonthKey(new Date())} onChange={(event) => event.target.value && setMonth(event.target.value)} className={`min-h-11 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-sm font-bold text-[var(--labora-ink)] ${formControlFocusClass}`} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportMonth} disabled={!monthOrders.length} className={`inline-flex min-h-11 items-center gap-1.5 rounded-[13px] border border-[var(--labora-border)] px-3.5 text-xs font-extrabold text-[var(--labora-primary)] disabled:opacity-40 ${formControlFocusClass}`}>
              <Download size={14} aria-hidden /> Exportar mes (CSV)
            </button>
            <button type="button" onClick={() => openConversion(`el mes ${month}`, monthOrders)} disabled={!monthOrders.length} className={`inline-flex min-h-11 items-center gap-1.5 rounded-[13px] bg-[var(--labora-primary)] px-3.5 text-xs font-extrabold text-white disabled:opacity-40 ${formControlFocusClass}`}>
              <ArrowRightLeft size={14} aria-hidden /> Pasar mes a ingresos
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Metric label="Aceptados" value={String(monthSummary.accepted)} />
          <Metric label="Rechazados" value={String(monthSummary.rejected)} />
          <Metric label="% aceptación" value={pctLabel(monthSummary.acceptanceRate)} />
          <Metric label="Ganado" value={formatMoney(monthSummary.earnings)} emphasis />
          <Metric label={`${currencySymbol}/km`} value={monthSummary.eurPerKm === null ? '—' : formatMoney(monthSummary.eurPerKm)} />
        </div>

        {monthSummary.rejected > 0 && (
          <p className="mt-3 text-[11px] text-[var(--labora-muted)]">
            Motivos de rechazo: {(Object.keys(REJECT_REASON_LABELS) as Array<keyof typeof REJECT_REASON_LABELS>).filter((key) => reasons[key] > 0).map((key) => `${REJECT_REASON_LABELS[key]} ${reasons[key]}`).join(' · ') || 'sin motivo'}{reasons.none > 0 ? ` · sin motivo ${reasons.none}` : ''}
          </p>
        )}

        {byPlatform.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-xs">
              <caption className="sr-only">Totales por plataforma</caption>
              <thead className="text-[10px] uppercase tracking-[0.08em] text-[var(--labora-muted)]">
                <tr><th className="py-2">Plataforma</th><th>Aceptados</th><th>Rechazados</th><th>Km</th><th className="text-right">Ganado</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--labora-border)]">
                {byPlatform.map((row) => (
                  <tr key={row.platform}>
                    <td className="py-2 font-extrabold text-[var(--labora-ink)]">{row.platform}</td>
                    <td>{row.accepted}</td>
                    <td>{row.rejected}</td>
                    <td>{row.km > 0 ? row.km.toLocaleString('es-ES') : '—'}</td>
                    <td className="text-right font-extrabold text-[var(--labora-ink)]">{formatMoney(row.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {settlements.length > 0 && (
          <div className="mt-4 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface-2)] p-3">
            <p className="text-xs font-extrabold text-[var(--labora-ink)]">Apuntado vs. liquidación importada ({month})</p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--labora-ink-soft)]">
              {settlements.map((row) => (
                <li key={row.platform}>
                  <strong>{row.platform}</strong>: apuntado {formatMoney(row.logged)} · liquidado {formatMoney(row.settled)} · diferencia{' '}
                  <strong className={row.difference === 0 ? '' : 'text-[var(--labora-clay-deep)]'}>{row.difference > 0 ? '+' : ''}{formatMoney(row.difference)}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--labora-muted)]">La liquidación de la plataforma es la referencia fiscal. Las diferencias pueden venir de propinas, ajustes, comisiones o pedidos sin apuntar.</p>
          </div>
        )}

        <div className="mt-4 divide-y divide-[var(--labora-border)]">
          {byDay.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--labora-muted)]" role="status">No hay pedidos apuntados en {month}.</p>
          ) : byDay.map((day) => {
            const dayOrders = ordersOnDay(monthOrders, day.day);
            const open = expandedDay === day.day;
            return (
              <div key={day.day} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <button type="button" aria-expanded={open} onClick={() => setExpandedDay(open ? null : day.day)} className={`min-h-11 flex-1 rounded-[12px] px-2 text-left ${formControlFocusClass}`}>
                    <span className="text-sm font-extrabold text-[var(--labora-ink)]">{new Date(`${day.day}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="ml-2 text-xs text-[var(--labora-muted)]">{day.accepted} aceptados · {day.rejected} rechazados · {formatMoney(day.earnings)}</span>
                  </button>
                  <button type="button" onClick={() => openConversion(`el día ${day.day}`, dayOrders)} className={`min-h-11 rounded-[12px] px-3 text-[11px] font-extrabold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] ${formControlFocusClass}`} aria-label={`Pasar el ${day.day} a ingresos`}>
                    <ArrowRightLeft size={14} aria-hidden />
                  </button>
                </div>
                {open && (
                  <ul className="mt-1 space-y-1">
                    {dayOrders.map((order) => (
                      <li key={order.id} className="flex items-center justify-between gap-2 rounded-[12px] bg-[var(--labora-surface-2)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-[var(--labora-ink)]">
                            {new Date(order.occurredAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · {order.platform}
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] ${order.status === 'accepted' ? 'labora-status-ok' : 'labora-status-danger'}`}>{order.status === 'accepted' ? 'Aceptado' : 'Rechazado'}</span>
                            {isConverted(order, liveIncomeIds) && <span className="labora-status-pending ml-1 rounded-full px-2 py-0.5 text-[9px]">En ingresos</span>}
                          </p>
                          <p className="truncate text-[11px] text-[var(--labora-muted)]">
                            {order.amount !== undefined ? formatMoney(order.amount) : 'Sin importe'}{order.km !== undefined ? ` · ${order.km.toLocaleString('es-ES')} km` : ''}{order.rejectReason ? ` · ${REJECT_REASON_LABELS[order.rejectReason]}` : ''}{order.note ? ` · ${order.note}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <button type="button" onClick={() => setEditing(order)} className={`flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--labora-muted)] hover:bg-[var(--labora-surface)] ${formControlFocusClass}`} aria-label="Editar pedido"><Pencil size={15} aria-hidden /></button>
                          <button type="button" onClick={() => void handleDelete(order)} className={`flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--labora-muted)] hover:bg-[var(--labora-soft-clay)] hover:text-[var(--labora-clay-deep)] ${formControlFocusClass}`} aria-label="Eliminar pedido"><Trash2 size={15} aria-hidden /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {editing && (
        <Dialog title="Editar pedido" onClose={() => setEditing(null)}>
          <OrderForm idPrefix="labora-order-edit" platforms={platformOptions} initial={editing} submitLabel="Guardar cambios" onSubmit={handleUpdate} onCancel={() => setEditing(null)} currencySymbol={currencySymbol} />
        </Dialog>
      )}

      {conversion && (
        <Dialog title="Pasar a ingresos" onClose={() => setConversion(null)}>
          <p className="text-xs leading-relaxed text-[var(--labora-muted)]">Se creará un ingreso por día y plataforma con los pedidos aceptados de {conversion.scope} que aún no has pasado. Quedarán marcados para no contarlos dos veces y tu gestoría los verá como ingresos pendientes de revisión.</p>
          <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto text-xs">
            {conversion.groups.map((group) => (
              <li key={`${group.date}-${group.platform}`} className="flex justify-between gap-2 rounded-[10px] bg-[var(--labora-surface-2)] px-3 py-2">
                <span>{group.date} · {group.platform} · {group.count} {group.count === 1 ? 'pedido' : 'pedidos'}</span>
                <strong>{formatMoney(group.amount)}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right text-sm font-extrabold text-[var(--labora-ink)]">Total {formatMoney(conversion.groups.reduce((sum, group) => sum + group.amount, 0))}</p>
          <p role="alert" className={`mt-3 rounded-[12px] px-3 py-2 text-[11px] leading-relaxed ${overlaps.length ? 'bg-[var(--labora-soft-clay)] font-bold text-[var(--labora-clay-deep)]' : 'bg-[var(--labora-surface-2)] text-[var(--labora-muted)]'}`}>
            {overlaps.length
              ? `Atención: ya importaste una liquidación de ${overlaps.join(', ')}. Si pasas estos pedidos, esos ingresos pueden contarse dos veces. Normalmente conviene usar solo la liquidación.`
              : 'Si más adelante importas la liquidación real de la plataforma para este periodo, puede solaparse con estos ingresos: revisa y elimina el duplicado.'}
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setConversion(null)} className={`min-h-12 flex-1 rounded-[14px] border border-[var(--labora-border)] text-sm font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}>Cancelar</button>
            <button type="button" onClick={() => void confirmConversion()} disabled={converting} className={`inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] text-sm font-extrabold text-white disabled:opacity-50 ${formControlFocusClass}`}>
              {converting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Plus size={16} aria-hidden />} Crear ingresos
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

const Metric = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
  <div className={`min-w-0 rounded-[13px] px-3 py-2.5 ${emphasis ? 'bg-[var(--labora-moss-soft)]' : 'bg-[var(--labora-surface-2)]'}`}>
    <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.09em] text-[var(--labora-muted)]">{label}</p>
    <p className={`mt-1 truncate text-sm font-extrabold ${emphasis ? 'text-[var(--labora-primary)]' : 'text-[var(--labora-ink)]'}`}>{value}</p>
  </div>
);

const Dialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[22px] bg-[var(--labora-surface)] p-5 shadow-xl sm:rounded-[22px]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[var(--labora-ink)]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={`flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--labora-muted)] ${formControlFocusClass}`}><X size={18} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
};
