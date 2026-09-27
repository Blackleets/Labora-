import React, { useEffect, useMemo, useState } from 'react';
import { Car, Download, History, Loader2, Pencil } from 'lucide-react';
import type { WorkSession } from '../../types';
import { localDayKey, parseDecimalInput, type OrderLogEntry } from '../../services/orderLog';
import { listOrdersBetween } from '../../services/orderLogRepository';
import { listWorkSessionsSince, setWorkSessionOdometer } from '../../services/workSessionService';
import { downloadCsv } from '../../services/quarterExport';
import {
  type ShiftRow,
  formatDuration,
  mileageCsvRows,
  mileageTotals,
  monthlyMileage,
  shiftCsvRows,
  shiftRows,
  validateCostPerKm,
  validateOdometer
} from '../../services/shiftLog';
import { FieldLabel, formControlFocusClass } from '../formA11y';
import { Dialog } from './OrderDialog';

interface ShiftsMileagePanelProps {
  sessions: WorkSession[];
  orders: OrderLogEntry[];
  nowMs: number;
  formatMoney: (value: number) => string;
  currencySymbol: string;
  vehicleCostPerKm: number | null;
  onSaveCost: (value: number | null) => Promise<void>;
  onSessionUpdated: (session: WorkSession) => void;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const FIRST_YEAR = 2024;
const inputClass = `min-h-11 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-sm font-bold text-[var(--labora-ink)] ${formControlFocusClass}`;
const km = (value: number) => `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`;
const toDraft = (value?: number) => (value === undefined ? '' : String(value).replace('.', ','));

export const ShiftsMileagePanel: React.FC<ShiftsMileagePanelProps> = ({ sessions, orders, nowMs, formatMoney, currencySymbol, vehicleCostPerKm, onSaveCost, onSessionUpdated, notify }) => {
  const currentYear = new Date(nowMs).getFullYear();
  const [visible, setVisible] = useState(15);
  const [editing, setEditing] = useState<ShiftRow | null>(null);
  const [startDraft, setStartDraft] = useState('');
  const [endDraft, setEndDraft] = useState('');
  const [editError, setEditError] = useState('');
  const [savingOdo, setSavingOdo] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [yearData, setYearData] = useState<{ year: number; sessions: WorkSession[]; orders: OrderLogEntry[] } | null>(null);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearError, setYearError] = useState('');
  const [costDraft, setCostDraft] = useState(toDraft(vehicleCostPerKm ?? undefined));
  const [costError, setCostError] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { setCostDraft(toDraft(vehicleCostPerKm ?? undefined)); }, [vehicleCostPerKm]);

  useEffect(() => {
    let active = true;
    const from = new Date(year, 0, 1).toISOString();
    const to = new Date(year + 1, 0, 1).toISOString();
    setYearLoading(true);
    setYearError('');
    Promise.all([listWorkSessionsSince(from), listOrdersBetween(from, to)])
      .then(([yearSessions, yearOrders]) => {
        if (!active) return;
        setYearData({ year, sessions: yearSessions.filter((session) => session.startedAt < to), orders: yearOrders });
      })
      .catch((error) => { if (active) setYearError(error instanceof Error ? error.message : 'No se pudo cargar el año.'); })
      .finally(() => { if (active) setYearLoading(false); });
    return () => { active = false; };
  }, [year, reloadKey]);

  const rows = useMemo(() => shiftRows(sessions, orders, nowMs), [sessions, orders, nowMs]);
  const months = useMemo(() => (yearData && yearData.year === year ? monthlyMileage(yearData.sessions, yearData.orders, year, vehicleCostPerKm) : []), [yearData, year, vehicleCostPerKm]);
  const totals = mileageTotals(months);
  const anyOrderBasis = months.some((row) => row.basis === 'orders');

  const openEdit = (row: ShiftRow) => {
    setEditing(row);
    setStartDraft(toDraft(row.startOdometerKm));
    setEndDraft(toDraft(row.endOdometerKm));
    setEditError('');
  };

  const saveOdometer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const start = parseDecimalInput(startDraft);
    const end = parseDecimalInput(endDraft);
    const error = validateOdometer(start, end, editing.ongoing);
    if (error) { setEditError(error); return; }
    setSavingOdo(true);
    try {
      const updated = await setWorkSessionOdometer(editing.id, start ?? null, end ?? null);
      onSessionUpdated(updated);
      setReloadKey((value) => value + 1);
      setEditing(null);
      notify('success', 'Cuentakilómetros guardado.');
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.');
    } finally {
      setSavingOdo(false);
    }
  };

  const saveCost = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseDecimalInput(costDraft);
    const error = validateCostPerKm(parsed);
    if (error) { setCostError(error); return; }
    setSavingCost(true);
    setCostError('');
    try {
      await onSaveCost(parsed ?? null);
      notify('success', parsed ? 'Coste por km guardado.' : 'Coste por km quitado.');
    } catch (saveError) {
      setCostError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.');
    } finally {
      setSavingCost(false);
    }
  };

  const exportYear = () => {
    downloadCsv(`labora_km_${year}.csv`, mileageCsvRows(months, vehicleCostPerKm));
    notify('success', `Registro de km de ${year} descargado.`);
  };
  const exportShifts = () => {
    if (!yearData) return;
    downloadCsv(`labora_jornadas_${year}.csv`, shiftCsvRows(shiftRows(yearData.sessions, yearData.orders, nowMs)));
    notify('success', `Jornadas de ${year} descargadas.`);
  };

  return (
    <div className="space-y-5">
      <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-shifts-history">
        <h2 id="labora-shifts-history" className="inline-flex items-center gap-2 text-base font-extrabold text-[var(--labora-ink)]"><History size={16} aria-hidden /> Historial de jornadas</h2>
        <p className="mt-1 text-[11px] text-[var(--labora-muted)]">Últimas 12 semanas. Los pedidos cuentan en la jornada si los apuntaste entre el inicio y el fin.</p>
        {rows.length === 0 ? (
          <p className="mt-4 rounded-[14px] bg-[var(--labora-surface-2)] p-4 text-center text-xs text-[var(--labora-muted)]" role="status">Aún no hay jornadas. Usa «Iniciar jornada» en la pestaña Hoy.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--labora-border)]">
            {rows.slice(0, visible).map((row) => {
              const start = new Date(row.startedAt);
              const end = row.endedAt ? new Date(row.endedAt) : null;
              const time = (date: Date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              return (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--labora-ink)]">
                      {start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · {time(start)}–{end ? (localDayKey(end) === localDayKey(start) ? time(end) : `${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${time(end)}`) : 'en curso'}
                    </p>
                    <p className="truncate text-[11px] text-[var(--labora-muted)]">
                      {formatDuration(row.durationMs)} · {row.accepted} {row.accepted === 1 ? 'pedido' : 'pedidos'} · {formatMoney(row.earnings)}{row.eurPerHour !== null ? ` · ${formatMoney(row.eurPerHour)}/h` : ''}
                      {row.odometerKm !== null ? ` · ${km(row.odometerKm)} (cuentakm)` : row.orderKm > 0 ? ` · ${km(row.orderKm)} en pedidos` : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => openEdit(row)} className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-[12px] px-3 text-[11px] font-extrabold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] ${formControlFocusClass}`} aria-label={`Cuentakilómetros de la jornada del ${start.toLocaleDateString('es-ES')}`}>
                    <Pencil size={13} aria-hidden /> Km
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {rows.length > visible && (
          <button type="button" onClick={() => setVisible((value) => value + 15)} className={`mt-2 min-h-11 w-full rounded-[13px] border border-[var(--labora-border)] text-xs font-extrabold text-[var(--labora-primary)] ${formControlFocusClass}`}>Ver más jornadas</button>
        )}
      </section>

      <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-mileage">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="labora-mileage" className="inline-flex items-center gap-2 text-base font-extrabold text-[var(--labora-ink)]"><Car size={16} aria-hidden /> Registro de km por mes</h2>
            <div className="mt-2">
              <FieldLabel htmlFor="labora-mileage-year">Año</FieldLabel>
              <select id="labora-mileage-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className={inputClass}>
                {Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, index) => currentYear - index).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportYear} disabled={!months.length || totals.km === 0} className={`inline-flex min-h-11 items-center gap-1.5 rounded-[13px] bg-[var(--labora-primary)] px-3.5 text-xs font-extrabold text-white disabled:opacity-40 ${formControlFocusClass}`}><Download size={14} aria-hidden /> Km del año (CSV)</button>
            <button type="button" onClick={exportShifts} disabled={!yearData?.sessions.length} className={`inline-flex min-h-11 items-center gap-1.5 rounded-[13px] border border-[var(--labora-border)] px-3.5 text-xs font-extrabold text-[var(--labora-primary)] disabled:opacity-40 ${formControlFocusClass}`}><Download size={14} aria-hidden /> Jornadas (CSV)</button>
          </div>
        </div>

        <form onSubmit={saveCost} className="mt-4 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface-2)] p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FieldLabel htmlFor="labora-vehicle-cost">Tu coste por km ({currencySymbol}/km) · vacío para quitar</FieldLabel>
              <input id="labora-vehicle-cost" inputMode="decimal" placeholder="Ej.: lo que calcules tú" value={costDraft} onChange={(event) => setCostDraft(event.target.value)} aria-invalid={Boolean(costError)} aria-describedby="labora-vehicle-cost-help" className={inputClass} />
            </div>
            <button type="submit" disabled={savingCost} className={`min-h-11 rounded-[13px] bg-[var(--labora-primary)] px-4 text-xs font-extrabold text-white disabled:opacity-50 ${formControlFocusClass}`}>Guardar</button>
          </div>
          {costError && <p role="alert" className="mt-1 text-[11px] font-bold text-[var(--labora-clay-deep)]">{costError}</p>}
          <p id="labora-vehicle-cost-help" className="mt-2 text-[10px] leading-relaxed text-[var(--labora-muted)]">
            <strong>Es tu estimación, no una tarifa oficial.</strong> Calcúlala con tus propios costes (combustible o carga, mantenimiento, seguro, amortización…). Labora+ no propone ninguna cifra ni indica si es deducible: consúltalo con tu gestoría.
          </p>
        </form>

        {yearError && <p role="alert" className="mt-3 text-xs font-bold text-[var(--labora-clay-deep)]">{yearError}</p>}
        {yearLoading && !months.length ? (
          <p className="mt-4 text-xs text-[var(--labora-muted)]" role="status">Cargando {year}…</p>
        ) : months.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <caption className="sr-only">Registro de km por mes de {year}</caption>
              <thead className="text-[10px] uppercase tracking-[0.08em] text-[var(--labora-muted)]">
                <tr><th className="py-2">Mes</th><th>Jornadas</th><th>Cuentakm</th><th>En pedidos</th><th>Km usados</th><th className="text-right">Coste estimado</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--labora-border)]">
                {months.map((row, index) => (
                  <tr key={row.month} className={row.shifts === 0 && row.km === 0 ? 'text-[var(--labora-muted)]' : ''}>
                    <td className="py-2 font-extrabold text-[var(--labora-ink)]">{MONTHS_ES[index]}</td>
                    <td>{row.shifts}{row.shifts > 0 ? <span className="text-[var(--labora-muted)]"> ({row.shiftsWithOdometer} con cuentakm)</span> : null}</td>
                    <td>{row.odometerKm > 0 ? km(row.odometerKm) : '—'}</td>
                    <td>{row.orderKm > 0 ? km(row.orderKm) : '—'}</td>
                    <td>{row.km > 0 ? <>{km(row.km)}{row.basis === 'orders' ? ' *' : ''}</> : '—'}</td>
                    <td className="text-right font-extrabold text-[var(--labora-ink)]">{row.estimatedCost === null ? '—' : formatMoney(row.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[var(--labora-border)] font-extrabold text-[var(--labora-ink)]">
                <tr><td className="py-2">Total</td><td>{totals.shifts}</td><td>{totals.odometerKm > 0 ? km(totals.odometerKm) : '—'}</td><td>{totals.orderKm > 0 ? km(totals.orderKm) : '—'}</td><td>{totals.km > 0 ? km(totals.km) : '—'}</td><td className="text-right">{totals.estimatedCost === null ? '—' : formatMoney(totals.estimatedCost)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="mt-3 text-[10px] leading-relaxed text-[var(--labora-muted)]">
          «Km usados» = km del cuentakilómetros de tus jornadas si apuntaste alguno ese mes; si no, los km que pusiste en tus pedidos{anyOrderBasis ? ' (marcados con *)' : ''}. Los km de pedidos no incluyen desplazamientos sin pedido. Apunta el cuentakilómetros al iniciar y terminar la jornada para un registro más completo.
        </p>
      </section>

      {editing && (
        <Dialog title="Cuentakilómetros de la jornada" onClose={() => setEditing(null)}>
          <form onSubmit={saveOdometer} className="space-y-3">
            <p className="text-xs text-[var(--labora-muted)]">{new Date(editing.startedAt).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}{editing.ongoing ? ' · en curso' : ''}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel htmlFor="labora-odo-start">Al empezar (km)</FieldLabel>
                <input id="labora-odo-start" inputMode="decimal" value={startDraft} onChange={(event) => setStartDraft(event.target.value)} className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="labora-odo-end">Al terminar (km)</FieldLabel>
                <input id="labora-odo-end" inputMode="decimal" value={endDraft} disabled={editing.ongoing} onChange={(event) => setEndDraft(event.target.value)} className={`${inputClass} disabled:opacity-50`} />
              </div>
            </div>
            {editError && <p role="alert" className="text-[11px] font-bold text-[var(--labora-clay-deep)]">{editError}</p>}
            <p className="text-[10px] text-[var(--labora-muted)]">Deja un campo vacío si no lo sabes. Solo se guarda en tu cuenta.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className={`min-h-12 flex-1 rounded-[14px] border border-[var(--labora-border)] text-sm font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}>Cancelar</button>
              <button type="submit" disabled={savingOdo} className={`inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] text-sm font-extrabold text-white disabled:opacity-50 ${formControlFocusClass}`}>
                {savingOdo && <Loader2 size={16} className="animate-spin" aria-hidden />} Guardar
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
