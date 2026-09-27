import React from 'react';
import type { SeriesPoint } from '../../services/orderLog';

interface OrderBarsProps {
  points: SeriesPoint[];
  formatMoney: (value: number) => string;
  caption: string;
}

/** Barras simples (CSS) de € ganado. Accesible como tabla para lectores de pantalla. */
export const OrderBars: React.FC<OrderBarsProps> = ({ points, formatMoney, caption }) => {
  const max = Math.max(0, ...points.map((point) => point.earnings));
  return (
    <figure className="min-w-0">
      <div className="flex h-36 items-end gap-1.5" aria-hidden>
        {points.map((point) => {
          const height = max > 0 ? Math.max(4, Math.round((point.earnings / max) * 100)) : 4;
          return (
            <div key={point.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="truncate text-[9px] font-bold text-[var(--labora-muted)]">{point.earnings > 0 ? formatMoney(point.earnings) : ''}</span>
              <div
                className={`w-full rounded-t-[8px] ${point.earnings > 0 ? 'bg-[var(--labora-primary)]' : 'bg-[var(--labora-surface-2)]'}`}
                style={{ height: `${height}%` }}
                title={`${point.label}: ${formatMoney(point.earnings)} · ${point.accepted} aceptados · ${point.rejected} rechazados`}
              />
              <span className="w-full truncate text-center text-[9px] font-semibold text-[var(--labora-muted)]">{point.label}</span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>Periodo</th><th>Ganado</th><th>Aceptados</th><th>Rechazados</th></tr></thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}><td>{point.label}</td><td>{formatMoney(point.earnings)}</td><td>{point.accepted}</td><td>{point.rejected}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
