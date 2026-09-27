import React, { useMemo, useState } from 'react';
import { BarChart3, Info, Trophy } from 'lucide-react';
import type { WorkSession } from '../../types';
import type { OrderLogEntry } from '../../services/orderLog';
import {
  MIN_ACCEPTED_FOR_SLOT,
  type SlotPerformance,
  acceptanceTrend,
  addDaysKey,
  bestSlots,
  dayStartMs,
  hourlyPerformance,
  platformComparison,
  rejectionBreakdown,
  weekdayPerformance
} from '../../services/orderAnalytics';
import { weekStartKey } from '../../services/orderLog';
import { formControlFocusClass } from '../formA11y';

export const ANALYTICS_MAX_WEEKS = 12;
const RANGE_OPTIONS = [4, 8, ANALYTICS_MAX_WEEKS] as const;
type SlotMetric = 'eurPerHour' | 'eurPerKm' | 'accepted';

interface BarPoint {
  key: string | number;
  label: string;
  value: number | null;
  display: string;
  muted: boolean;
  title: string;
}

interface OrderAnalyticsPanelProps {
  orders: OrderLogEntry[];
  sessions: WorkSession[];
  todayKey: string;
  nowMs: number;
  formatMoney: (value: number) => string;
  currencySymbol: string;
}

const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);

const Segmented = <T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) => (
  <div className="flex gap-1 rounded-[13px] bg-[var(--labora-surface-2)] p-1" role="group" aria-label={label}>
    {options.map((option) => (
      <button key={String(option.value)} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`min-h-9 rounded-[10px] px-3 text-xs font-extrabold ${value === option.value ? 'bg-[var(--labora-surface)] text-[var(--labora-primary)] shadow-sm' : 'text-[var(--labora-muted)]'} ${formControlFocusClass}`}>
        {option.label}
      </button>
    ))}
  </div>
);

/** Barras verticales (CSS) con tabla sr-only. Las franjas con pocos datos se ven atenuadas. */
const ValueBars: React.FC<{ points: BarPoint[]; caption: string; valueHeader: string }> = ({ points, caption, valueHeader }) => {
  const max = Math.max(0, ...points.map((point) => point.value || 0));
  return (
    <figure className="min-w-0 overflow-x-auto">
      <div className="flex h-40 min-w-[280px] items-end gap-1" aria-hidden>
        {points.map((point) => {
          const height = max > 0 && point.value ? Math.max(4, Math.round((point.value / max) * 100)) : 3;
          return (
            <div key={point.key} className="flex h-full min-w-[18px] flex-1 flex-col items-center justify-end gap-1" title={point.title}>
              <span className="w-full truncate text-center text-[8px] font-bold text-[var(--labora-muted)]">{point.value ? point.display : ''}</span>
              <div className={`w-full rounded-t-[6px] ${point.value ? (point.muted ? 'bg-[var(--labora-primary)] opacity-35' : 'bg-[var(--labora-primary)]') : 'bg-[var(--labora-surface-2)]'}`} style={{ height: `${height}%` }} />
              <span className="w-full truncate text-center text-[9px] font-semibold text-[var(--labora-muted)]">{point.label}</span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>Franja</th><th>{valueHeader}</th><th>Detalle</th></tr></thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}><td>{point.label}</td><td>{point.value === null ? 'sin dato' : point.display}</td><td>{point.title}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export const OrderAnalyticsPanel: React.FC<OrderAnalyticsPanelProps> = ({ orders, sessions, todayKey, nowMs, formatMoney, currencySymbol }) => {
  const [weeks, setWeeks] = useState<number>(8);
  const [metric, setMetric] = useState<SlotMetric>('eurPerHour');

  const range = useMemo(() => {
    const fromDay = addDaysKey(weekStartKey(todayKey), -7 * (weeks - 1));
    return { fromDay, fromMs: dayStartMs(fromDay), toMs: dayStartMs(addDaysKey(todayKey, 1)) };
  }, [todayKey, weeks]);

  const data = useMemo(() => {
    const rangeOrders = orders.filter((order) => {
      const time = new Date(order.occurredAt).getTime();
      return time >= range.fromMs && time < range.toMs;
    });
    const hours = hourlyPerformance(rangeOrders, sessions, range.fromMs, range.toMs, nowMs);
    const days = weekdayPerformance(rangeOrders, sessions, range.fromMs, range.toMs, nowMs);
    return {
      rangeOrders,
      hours,
      days,
      trend: acceptanceTrend(rangeOrders, todayKey, weeks),
      reasons: rejectionBreakdown(rangeOrders),
      platforms: platformComparison(rangeOrders),
      bestHours: bestSlots(hours, 'eurPerHour'),
      bestDays: bestSlots(days, 'eurPerHour'),
      bestKmHours: bestSlots(hours, 'eurPerKm', 1),
      bestKmDays: bestSlots(days, 'eurPerKm', 1)
    };
  }, [orders, sessions, range, nowMs, todayKey, weeks]);

  const metricLabel = metric === 'eurPerHour' ? `${currencySymbol}/hora` : metric === 'eurPerKm' ? `${currencySymbol}/km` : 'Pedidos aceptados';
  const toPoints = (slots: SlotPerformance[], shortLabel: (slot: SlotPerformance) => string): BarPoint[] => slots.map((slot) => {
    const value = metric === 'accepted' ? slot.accepted : slot[metric];
    const display = value === null ? '—' : metric === 'accepted' ? String(value) : formatMoney(value);
    const muted = metric !== 'accepted' && !slot.enoughData;
    const detail = `${slot.accepted} aceptados · ${formatMoney(slot.earnings)} · ${slot.workedHours.toLocaleString('es-ES')} h de jornada${slot.km > 0 ? ` · ${slot.km.toLocaleString('es-ES')} km` : ''}${muted ? ' · pocos datos' : ''}`;
    return { key: slot.key, label: shortLabel(slot), value, display, muted, title: `${slot.label}: ${detail}` };
  });

  // Solo las horas con actividad (jornada o pedidos), para no dibujar 24 barras vacías.
  const activeHours = data.hours.filter((slot) => slot.workedHours > 0 || slot.accepted + slot.rejected > 0);
  const hourSpan = activeHours.length ? data.hours.slice(activeHours[0].key, activeHours[activeHours.length - 1].key + 1) : [];
  const totalOrders = data.rangeOrders.length;
  const totalRejected = data.reasons.reduce((sum, row) => sum + row.count, 0);
  const hasSessions = data.hours.some((slot) => slot.workedHours > 0);

  const bestLine = (slots: SlotPerformance[], unit: 'h' | 'km') => slots
    .map((slot) => `${slot.label} (${formatMoney((unit === 'h' ? slot.eurPerHour : slot.eurPerKm) || 0)}/${unit === 'h' ? 'h' : 'km'})`)
    .join(' · ');

  return (
    <div className="space-y-5">
      <section className="labora-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-base font-extrabold text-[var(--labora-ink)]"><BarChart3 size={16} aria-hidden /> Análisis de tus pedidos</h2>
          <Segmented label="Periodo del análisis" value={weeks} onChange={setWeeks} options={RANGE_OPTIONS.map((value) => ({ value, label: `${value} sem.` }))} />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--labora-muted)]">
          Desde el {new Date(`${range.fromDay}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} · {totalOrders} {totalOrders === 1 ? 'pedido apuntado' : 'pedidos apuntados'}. Todo sale de tus registros; no usamos medias de otros riders ni datos de las plataformas.
        </p>

        {totalOrders === 0 ? (
          <p className="mt-4 rounded-[14px] bg-[var(--labora-surface-2)] p-4 text-center text-xs text-[var(--labora-muted)]" role="status">Apunta pedidos (y tu jornada) durante unos días para ver aquí tus mejores horas y días.</p>
        ) : (
          <div className="mt-4 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-ink)]"><Trophy size={14} aria-hidden /> Tus mejores franjas</p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--labora-ink-soft)]">
              <li><strong>Horas por {currencySymbol}/h:</strong> {data.bestHours.length ? bestLine(data.bestHours, 'h') : 'pocos datos todavía'}</li>
              <li><strong>Días por {currencySymbol}/h:</strong> {data.bestDays.length ? bestLine(data.bestDays, 'h') : 'pocos datos todavía'}</li>
              <li><strong>Mejor {currencySymbol}/km:</strong> {[...data.bestKmHours.map((slot) => bestLine([slot], 'km')), ...data.bestKmDays.map((slot) => bestLine([slot], 'km'))].join(' · ') || 'apunta los km de tus pedidos para verlo'}</li>
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--labora-muted)]">Solo entran franjas con al menos {MIN_ACCEPTED_FOR_SLOT} pedidos aceptados y 1 h de jornada.</p>
          </div>
        )}
      </section>

      {totalOrders > 0 && (
        <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-analytics-slots">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="labora-analytics-slots" className="text-base font-extrabold text-[var(--labora-ink)]">Por hora y por día</h2>
            <Segmented label="Métrica" value={metric} onChange={setMetric} options={[{ value: 'eurPerHour', label: `${currencySymbol}/h` }, { value: 'eurPerKm', label: `${currencySymbol}/km` }, { value: 'accepted', label: 'Pedidos' }]} />
          </div>
          {metric === 'eurPerHour' && !hasSessions && (
            <p className="mt-2 text-[11px] font-bold text-[var(--labora-clay-deep)]">Para ver {currencySymbol}/hora, usa «Iniciar jornada» mientras trabajas.</p>
          )}
          <p className="mt-3 text-xs font-extrabold text-[var(--labora-ink)]">Hora del día</p>
          <div className="mt-2">
            {hourSpan.length ? <ValueBars points={toPoints(hourSpan, (slot) => String(slot.key))} caption={`${metricLabel} por hora del día`} valueHeader={metricLabel} /> : <p className="text-xs text-[var(--labora-muted)]">Sin actividad en el periodo.</p>}
          </div>
          <p className="mt-4 text-xs font-extrabold text-[var(--labora-ink)]">Día de la semana</p>
          <div className="mt-2">
            <ValueBars points={toPoints(data.days, (slot) => slot.label.slice(0, 3))} caption={`${metricLabel} por día de la semana`} valueHeader={metricLabel} />
          </div>
          <p className="mt-3 inline-flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--labora-muted)]">
            <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
            Aproximado: cada pedido cuenta en la hora en que lo apuntaste, y las horas salen de tus jornadas. {currencySymbol}/km solo usa pedidos con km apuntados. Las barras claras tienen pocos datos.
          </p>
        </section>
      )}

      {totalOrders > 0 && (
        <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-analytics-acceptance">
          <h2 id="labora-analytics-acceptance" className="text-base font-extrabold text-[var(--labora-ink)]">% de aceptación por semana</h2>
          <div className="mt-3">
            <ValueBars
              caption="Porcentaje de aceptación por semana"
              valueHeader="% aceptación"
              points={data.trend.map((point) => ({
                key: point.key,
                label: point.label,
                value: point.rate === null ? null : Math.round(point.rate * 100),
                display: pct(point.rate),
                muted: point.total < 5,
                title: point.total ? `Semana del ${point.label}: ${point.accepted} de ${point.total} aceptados` : `Semana del ${point.label}: sin pedidos apuntados`
              }))}
            />
          </div>
          <p className="mt-2 text-[10px] text-[var(--labora-muted)]">Semanas de lunes a domingo. Sin barra = sin pedidos apuntados; barra clara = menos de 5 pedidos.</p>
        </section>
      )}

      {totalOrders > 0 && (
        <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-analytics-reasons">
          <h2 id="labora-analytics-reasons" className="text-base font-extrabold text-[var(--labora-ink)]">Motivos de rechazo</h2>
          {totalRejected === 0 ? (
            <p className="mt-2 text-xs text-[var(--labora-muted)]">No has apuntado rechazos en este periodo.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.reasons.map((row) => (
                <li key={row.reason}>
                  <div className="flex justify-between text-xs"><span className="font-extrabold text-[var(--labora-ink)]">{row.label}</span><span className="text-[var(--labora-muted)]">{row.count} · {pct(row.share)}</span></div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--labora-surface-2)]" aria-hidden><div className="h-full rounded-full bg-[var(--labora-clay-deep)] opacity-70" style={{ width: `${Math.max(2, Math.round(row.share * 100))}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {data.platforms.length > 0 && (
        <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-analytics-platforms">
          <h2 id="labora-analytics-platforms" className="text-base font-extrabold text-[var(--labora-ink)]">Comparativa de plataformas</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <caption className="sr-only">Comparativa de plataformas en el periodo</caption>
              <thead className="text-[10px] uppercase tracking-[0.08em] text-[var(--labora-muted)]">
                <tr><th className="py-2">Plataforma</th><th>Aceptados</th><th>% acept.</th><th>{currencySymbol}/pedido</th><th>{currencySymbol}/km</th><th className="text-right">Ganado</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--labora-border)]">
                {data.platforms.map((row) => (
                  <tr key={row.platform}>
                    <td className="py-2 font-extrabold text-[var(--labora-ink)]">{row.platform}</td>
                    <td>{row.accepted}</td>
                    <td>{pct(row.acceptanceRate)}</td>
                    <td>{row.avgPerOrder === null ? '—' : formatMoney(row.avgPerOrder)}</td>
                    <td>{row.eurPerKm === null ? '—' : formatMoney(row.eurPerKm)}</td>
                    <td className="text-right font-extrabold text-[var(--labora-ink)]">{formatMoney(row.earnings)} <span className="font-semibold text-[var(--labora-muted)]">({pct(row.shareOfEarnings)})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--labora-muted)]">Sin {currencySymbol}/hora por plataforma: tu jornada no va ligada a una sola plataforma. {currencySymbol}/km solo con pedidos que tienen km.</p>
        </section>
      )}
    </div>
  );
};
