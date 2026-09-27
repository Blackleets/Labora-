import React from 'react';
import { CalendarRange } from 'lucide-react';
import { relativeChange, type WeekSummary } from '../../services/orderAnalytics';
import { GoalEditor } from './GoalEditor';

interface WeeklySummaryCardProps {
  summary: WeekSummary;
  weeklyGoal: number | null;
  formatMoney: (value: number) => string;
  currencySymbol: string;
  onSaveGoal: (goal: number | null) => Promise<void>;
}

const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);

const Change: React.FC<{ current: number | null; previous: number | null }> = ({ current, previous }) => {
  const change = relativeChange(current, previous);
  if (change === null) return <span className="text-[10px] text-[var(--labora-muted)]">sin comparación</span>;
  const rounded = Math.round(change * 100);
  const tone = rounded > 0 ? 'text-[var(--labora-primary)]' : rounded < 0 ? 'text-[var(--labora-clay-deep)]' : 'text-[var(--labora-muted)]';
  return <span className={`text-[10px] font-extrabold ${tone}`}>{rounded > 0 ? '+' : ''}{rounded}% vs. sem. pasada</span>;
};

/** Resumen de la semana en curso (lunes → hoy) frente a la semana pasada hasta el mismo momento. */
export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ summary, weeklyGoal, formatMoney, currencySymbol, onSaveGoal }) => {
  const { thisWeek, lastWeekSoFar, lastWeekFull } = summary;
  const fmtDay = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const cells: Array<{ label: string; value: string; current: number | null; previous: number | null }> = [
    { label: 'Ganado', value: formatMoney(thisWeek.earnings), current: thisWeek.earnings, previous: lastWeekSoFar.earnings },
    { label: 'Pedidos aceptados', value: String(thisWeek.accepted), current: thisWeek.accepted, previous: lastWeekSoFar.accepted },
    { label: 'Horas de jornada', value: thisWeek.workedHours > 0 ? `${thisWeek.workedHours.toLocaleString('es-ES')} h` : '—', current: thisWeek.workedHours, previous: lastWeekSoFar.workedHours },
    { label: `${currencySymbol}/hora`, value: thisWeek.eurPerHour === null ? '—' : formatMoney(thisWeek.eurPerHour), current: thisWeek.eurPerHour, previous: lastWeekSoFar.eurPerHour },
    { label: `${currencySymbol}/km`, value: thisWeek.eurPerKm === null ? '—' : formatMoney(thisWeek.eurPerKm), current: thisWeek.eurPerKm, previous: lastWeekSoFar.eurPerKm },
    { label: '% aceptación', value: pct(thisWeek.acceptanceRate), current: thisWeek.acceptanceRate, previous: lastWeekSoFar.acceptanceRate }
  ];
  const empty = thisWeek.accepted + thisWeek.rejected === 0 && thisWeek.workedHours === 0;

  return (
    <section className="labora-card p-4 sm:p-5" aria-labelledby="labora-orders-week">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="labora-orders-week" className="inline-flex items-center gap-2 text-base font-extrabold text-[var(--labora-ink)]"><CalendarRange size={16} aria-hidden /> Esta semana</h2>
        <p className="text-[11px] text-[var(--labora-muted)]">{fmtDay(thisWeek.from)} – {fmtDay(thisWeek.to)}</p>
      </div>
      {empty ? (
        <p className="mt-3 text-xs text-[var(--labora-muted)]" role="status">Aún no has apuntado pedidos ni jornadas esta semana.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cells.map((cell) => (
            <div key={cell.label} className="min-w-0 rounded-[13px] bg-[var(--labora-surface-2)] px-3 py-2.5">
              <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.09em] text-[var(--labora-muted)]">{cell.label}</p>
              <p className="mt-1 truncate text-sm font-extrabold text-[var(--labora-ink)]">{cell.value}</p>
              <Change current={cell.current} previous={cell.previous} />
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--labora-muted)]">
        Comparado con la semana pasada hasta el mismo día y hora. Semana pasada completa: {formatMoney(lastWeekFull.earnings)} en {lastWeekFull.accepted} pedidos. Solo cuenta lo que tú has apuntado.
      </p>
      <div className="mt-3">
        <GoalEditor
          id="labora-orders-weekly-goal"
          title="Objetivo semanal"
          unitLabel={`${currencySymbol}/semana`}
          goal={weeklyGoal}
          earnings={thisWeek.earnings}
          formatMoney={formatMoney}
          onSave={onSaveGoal}
          hint={summary.daysLeft === 1 ? 'último día de la semana' : `quedan ${summary.daysLeft} días contando hoy`}
        />
      </div>
    </section>
  );
};
