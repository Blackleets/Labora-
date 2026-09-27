/**
 * Historial de jornadas y registro mensual de km — cálculos puros.
 * Los km salen del cuentakilómetros que apunta el rider (inicio/fin de jornada) o,
 * si no lo apunta, de los km que puso en sus pedidos. El coste por km es una
 * estimación propia del rider: Labora+ no propone ninguna tarifa oficial.
 */
import type { WorkSession } from '../types';
import { localDayKey, localMonthKey, type OrderLogEntry } from './orderLog';
import { money, type CsvRow } from './quarterExport';

const round2 = (value: number) => Math.round(value * 100) / 100;
const round1 = (value: number) => Math.round(value * 10) / 10;

export interface ShiftRow {
  id: string;
  startedAt: string;
  endedAt?: string;
  ongoing: boolean;
  durationMs: number;
  accepted: number;
  rejected: number;
  earnings: number;
  /** Null si la jornada dura menos de 15 min (evita €/h absurdos). */
  eurPerHour: number | null;
  /** Km del cuentakilómetros (fin − inicio) si están los dos. */
  odometerKm: number | null;
  /** Km apuntados en los pedidos aceptados de la jornada. */
  orderKm: number;
  startOdometerKm?: number;
  endOdometerKm?: number;
}

export const odometerDistance = (session: WorkSession) =>
  session.startOdometerKm !== undefined && session.endOdometerKm !== undefined && session.endOdometerKm >= session.startOdometerKm
    ? round1(session.endOdometerKm - session.startOdometerKm)
    : null;

/** Una fila por jornada, más reciente primero. Los pedidos cuentan si se apuntaron durante la jornada. */
export const shiftRows = (sessions: WorkSession[], orders: OrderLogEntry[], nowMs: number): ShiftRow[] =>
  [...sessions]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((session) => {
      const start = new Date(session.startedAt).getTime();
      const end = session.endedAt ? new Date(session.endedAt).getTime() : nowMs;
      let accepted = 0;
      let rejected = 0;
      let earnings = 0;
      let orderKm = 0;
      for (const order of orders) {
        const time = new Date(order.occurredAt).getTime();
        if (time < start || time > end) continue;
        if (order.status !== 'accepted') { rejected += 1; continue; }
        accepted += 1;
        earnings += order.amount || 0;
        orderKm += order.km || 0;
      }
      const durationMs = Math.max(0, end - start);
      return {
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        ongoing: !session.endedAt,
        durationMs,
        accepted,
        rejected,
        earnings: round2(earnings),
        eurPerHour: durationMs >= 15 * 60_000 ? round2(earnings / (durationMs / 3_600_000)) : null,
        odometerKm: odometerDistance(session),
        orderKm: round1(orderKm),
        startOdometerKm: session.startOdometerKm,
        endOdometerKm: session.endOdometerKm
      };
    });

export const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60_000);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
};

export type KmBasis = 'odometer' | 'orders' | null;

export interface MileageMonth {
  month: string;
  shifts: number;
  shiftsWithOdometer: number;
  odometerKm: number;
  orderKm: number;
  /** Km usados para la estimación: cuentakilómetros si hay alguno, si no los de pedidos. */
  km: number;
  basis: KmBasis;
  /** km × coste propio. Null si no hay coste o no hay km. */
  estimatedCost: number | null;
}

/** Registro de km por mes del año `year` (12 filas, enero → diciembre). */
export const monthlyMileage = (sessions: WorkSession[], orders: OrderLogEntry[], year: number, costPerKm: number | null): MileageMonth[] =>
  Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const monthSessions = sessions.filter((session) => localMonthKey(session.startedAt) === month);
    const distances = monthSessions.map(odometerDistance).filter((value): value is number => value !== null);
    const odometerKm = round1(distances.reduce((sum, value) => sum + value, 0));
    const orderKm = round1(orders
      .filter((order) => order.status === 'accepted' && localMonthKey(order.occurredAt) === month)
      .reduce((sum, order) => sum + (order.km || 0), 0));
    const basis: KmBasis = distances.length ? 'odometer' : orderKm > 0 ? 'orders' : null;
    const km = basis === 'odometer' ? odometerKm : basis === 'orders' ? orderKm : 0;
    return {
      month,
      shifts: monthSessions.length,
      shiftsWithOdometer: distances.length,
      odometerKm,
      orderKm,
      km,
      basis,
      estimatedCost: costPerKm && costPerKm > 0 && km > 0 ? round2(km * costPerKm) : null
    };
  });

export const mileageTotals = (months: MileageMonth[]) => ({
  shifts: months.reduce((sum, row) => sum + row.shifts, 0),
  odometerKm: round1(months.reduce((sum, row) => sum + row.odometerKm, 0)),
  orderKm: round1(months.reduce((sum, row) => sum + row.orderKm, 0)),
  km: round1(months.reduce((sum, row) => sum + row.km, 0)),
  estimatedCost: months.some((row) => row.estimatedCost !== null)
    ? round2(months.reduce((sum, row) => sum + (row.estimatedCost || 0), 0))
    : null
});

const BASIS_LABEL: Record<Exclude<KmBasis, null>, string> = { odometer: 'Cuentakilómetros', orders: 'Km de pedidos' };

export const mileageCsvRows = (months: MileageMonth[], costPerKm: number | null): CsvRow[] => {
  const totals = mileageTotals(months);
  return [
    ['Registro de km (Labora+) · datos apuntados por el usuario'],
    ['Coste por km usado', costPerKm ? `${money(costPerKm)} (estimación propia del usuario, no es una tarifa oficial)` : 'Sin coste indicado'],
    [],
    ['Mes', 'Jornadas', 'Jornadas con cuentakilómetros', 'Km cuentakilómetros', 'Km en pedidos', 'Km usados', 'Fuente', 'Coste estimado'],
    ...months.map((row) => [
      row.month,
      row.shifts,
      row.shiftsWithOdometer,
      money(row.odometerKm),
      money(row.orderKm),
      money(row.km),
      row.basis ? BASIS_LABEL[row.basis] : '',
      row.estimatedCost === null ? '' : money(row.estimatedCost)
    ]),
    ['Total', totals.shifts, '', money(totals.odometerKm), money(totals.orderKm), money(totals.km), '', totals.estimatedCost === null ? '' : money(totals.estimatedCost)]
  ];
};

/** Detalle por jornada para el CSV anual (útil como justificante propio). */
export const shiftCsvRows = (rows: ShiftRow[]): CsvRow[] => [
  ['Fecha', 'Inicio', 'Fin', 'Duración (h)', 'Cuentakm inicio', 'Cuentakm fin', 'Km cuentakilómetros', 'Km en pedidos', 'Pedidos aceptados', 'Ganado'],
  ...[...rows].sort((a, b) => a.startedAt.localeCompare(b.startedAt)).map((row) => {
    const start = new Date(row.startedAt);
    const end = row.endedAt ? new Date(row.endedAt) : null;
    const hhmm = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return [
      localDayKey(start),
      hhmm(start),
      end ? hhmm(end) : 'En curso',
      money(row.durationMs / 3_600_000),
      row.startOdometerKm === undefined ? '' : money(row.startOdometerKm),
      row.endOdometerKm === undefined ? '' : money(row.endOdometerKm),
      row.odometerKm === null ? '' : money(row.odometerKm),
      money(row.orderKm),
      row.accepted,
      money(row.earnings)
    ];
  })
];

/** Valida lecturas del cuentakilómetros. Undefined = sin dato. */
export const validateOdometer = (start: number | undefined, end: number | undefined, ongoing: boolean): string | null => {
  for (const value of [start, end]) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 10_000_000)) return 'Lectura del cuentakilómetros no válida.';
  }
  if (ongoing && end !== undefined) return 'Termina la jornada antes de apuntar el cuentakilómetros final.';
  if (start !== undefined && end !== undefined && end < start) return 'El cuentakilómetros final no puede ser menor que el inicial.';
  if (start !== undefined && end !== undefined && end - start > 2000) return 'Más de 2.000 km en una jornada: revisa las lecturas.';
  return null;
};

/** Valida el coste por km propio. */
export const validateCostPerKm = (value: number | undefined): string | null => {
  if (value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0 || value > 10) return 'El coste por km debe estar entre 0,001 y 10.';
  return null;
};
