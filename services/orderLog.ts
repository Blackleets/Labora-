/**
 * Registro de pedidos (módulo opcional) — cálculos puros.
 * Todo parte de lo que el autónomo apunta a mano: sin API de plataformas,
 * sin lectura de notificaciones ni pantallas, sin automatizar cuentas.
 */
import type { Income, WorkSession } from '../types';
import { money, type CsvRow } from './quarterExport';

export type OrderStatus = 'accepted' | 'rejected';
export type RejectReason = 'too_far' | 'low_pay' | 'zone' | 'other';

export interface OrderLogEntry {
  id: string;
  userId: string;
  platform: string;
  /** ISO timestamp. */
  occurredAt: string;
  status: OrderStatus;
  amount?: number;
  km?: number;
  rejectReason?: RejectReason;
  note?: string;
  convertedIncomeId?: string;
  convertedAt?: string;
  /** 'import' si viene de un CSV importado por el rider; por defecto manual. */
  source?: 'manual' | 'import';
  /** Huella SHA-256 de la fila importada. */
  importRef?: string;
}

export interface OrderInput {
  platform: string;
  occurredAt: string;
  status: OrderStatus;
  amount?: number;
  km?: number;
  rejectReason?: RejectReason;
  note?: string;
}

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  too_far: 'Muy lejos',
  low_pay: 'Paga poco',
  zone: 'Zona',
  other: 'Otro'
};

export const DEFAULT_ORDER_PLATFORMS = ['Uber Eats', 'Glovo', 'Just Eat'];

const pad = (value: number) => String(value).padStart(2, '0');

/** YYYY-MM-DD en hora local del dispositivo. */
export const localDayKey = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const localMonthKey = (value: string | Date) => localDayKey(value).slice(0, 7);

/** Valor para <input type="datetime-local"> (hora local, sin segundos). */
export const toDateTimeLocalValue = (date: Date) =>
  `${localDayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const normalizePlatformKey = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

export const validateOrderInput = (input: OrderInput, now: Date = new Date()): string | null => {
  const platform = input.platform.trim();
  if (!platform) return 'Elige la plataforma.';
  if (platform.length > 60) return 'El nombre de la plataforma es demasiado largo.';
  const when = new Date(input.occurredAt);
  if (Number.isNaN(when.getTime())) return 'La fecha y hora no son válidas.';
  if (when.getTime() > now.getTime() + 10 * 60_000) return 'La hora no puede estar en el futuro.';
  if (input.status === 'accepted') {
    if (input.amount === undefined || !Number.isFinite(input.amount)) return 'Indica el importe del pedido aceptado.';
  }
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 10000)) {
    return 'El importe debe estar entre 0 y 10.000.';
  }
  if (input.km !== undefined && (!Number.isFinite(input.km) || input.km < 0 || input.km > 1000)) {
    return 'Los km deben estar entre 0 y 1.000.';
  }
  if (input.status === 'accepted' && input.rejectReason) return 'Un pedido aceptado no lleva motivo de rechazo.';
  if (input.note && input.note.length > 500) return 'La nota admite como máximo 500 caracteres.';
  return null;
};

/** Parsea un importe/km escrito en español («4,50») o vacío → undefined. */
export const parseDecimalInput = (raw: string): number | undefined => {
  const cleaned = raw.trim().replace(/\s|€/g, '').replace(',', '.');
  if (!cleaned) return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : Number.NaN;
};

export interface OrderSummary {
  total: number;
  accepted: number;
  rejected: number;
  /** 0..1 o null si no hay pedidos. */
  acceptanceRate: number | null;
  earnings: number;
  km: number;
  eurPerKm: number | null;
  avgPerOrder: number | null;
  workedHours: number;
  eurPerHour: number | null;
  ordersPerHour: number | null;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export const summarizeOrders = (orders: OrderLogEntry[], workedMs = 0): OrderSummary => {
  const acceptedOrders = orders.filter((order) => order.status === 'accepted');
  const earnings = round2(acceptedOrders.reduce((sum, order) => sum + (order.amount || 0), 0));
  const km = round2(acceptedOrders.reduce((sum, order) => sum + (order.km || 0), 0));
  const workedHours = Math.max(0, workedMs) / 3_600_000;
  return {
    total: orders.length,
    accepted: acceptedOrders.length,
    rejected: orders.length - acceptedOrders.length,
    acceptanceRate: orders.length ? acceptedOrders.length / orders.length : null,
    earnings,
    km,
    eurPerKm: km > 0 ? round2(earnings / km) : null,
    avgPerOrder: acceptedOrders.length ? round2(earnings / acceptedOrders.length) : null,
    workedHours,
    eurPerHour: workedHours > 0 ? round2(earnings / workedHours) : null,
    ordersPerHour: workedHours > 0 ? Math.round((acceptedOrders.length / workedHours) * 10) / 10 : null
  };
};

/** Neto estimado del día: ganado − gastos registrados. No descuenta impuestos ni cuotas. */
export const netEstimate = (earnings: number, expenses: number) => round2(earnings - expenses);

export const ordersOnDay = (orders: OrderLogEntry[], dayKey: string) =>
  orders.filter((order) => localDayKey(order.occurredAt) === dayKey);

export const ordersInMonth = (orders: OrderLogEntry[], monthKey: string) =>
  orders.filter((order) => localMonthKey(order.occurredAt) === monthKey);

/** Tiempo trabajado (ms) dentro del día local, sumando jornadas que lo solapan. */
export const workedMsOnDay = (sessions: WorkSession[], dayKey: string, nowMs: number) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  const dayStart = new Date(year, month - 1, day).getTime();
  const dayEnd = new Date(year, month - 1, day + 1).getTime();
  return sessions.reduce((total, session) => {
    const start = Math.max(new Date(session.startedAt).getTime(), dayStart);
    const rawEnd = session.endedAt ? new Date(session.endedAt).getTime() : nowMs;
    const end = Math.min(rawEnd, dayEnd);
    return total + Math.max(0, end - start);
  }, 0);
};

export interface PlatformBreakdown {
  platform: string;
  accepted: number;
  rejected: number;
  earnings: number;
  km: number;
}

export const breakdownByPlatform = (orders: OrderLogEntry[]): PlatformBreakdown[] => {
  const map = new Map<string, PlatformBreakdown>();
  for (const order of orders) {
    const key = normalizePlatformKey(order.platform);
    const row = map.get(key) || { platform: order.platform.trim(), accepted: 0, rejected: 0, earnings: 0, km: 0 };
    if (order.status === 'accepted') {
      row.accepted += 1;
      row.earnings = round2(row.earnings + (order.amount || 0));
      row.km = round2(row.km + (order.km || 0));
    } else {
      row.rejected += 1;
    }
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => b.earnings - a.earnings || a.platform.localeCompare(b.platform, 'es'));
};

export interface DayBreakdown extends OrderSummary {
  day: string;
}

export const breakdownByDay = (orders: OrderLogEntry[]): DayBreakdown[] => {
  const groups = new Map<string, OrderLogEntry[]>();
  for (const order of orders) {
    const key = localDayKey(order.occurredAt);
    groups.set(key, [...(groups.get(key) || []), order]);
  }
  return Array.from(groups.entries())
    .map(([day, rows]) => ({ day, ...summarizeOrders(rows) }))
    .sort((a, b) => b.day.localeCompare(a.day));
};

export const rejectReasonCounts = (orders: OrderLogEntry[]) => {
  const counts: Record<RejectReason | 'none', number> = { too_far: 0, low_pay: 0, zone: 0, other: 0, none: 0 };
  for (const order of orders) {
    if (order.status !== 'rejected') continue;
    counts[order.rejectReason || 'none'] += 1;
  }
  return counts;
};

const addDays = (dayKey: string, delta: number) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return localDayKey(new Date(year, month - 1, day + delta));
};

export interface SeriesPoint {
  key: string;
  label: string;
  earnings: number;
  accepted: number;
  rejected: number;
}

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Últimos `days` días terminando en `endDayKey` (incluido), del más antiguo al más reciente. */
export const dailySeries = (orders: OrderLogEntry[], endDayKey: string, days = 7): SeriesPoint[] =>
  Array.from({ length: days }, (_, index) => {
    const key = addDays(endDayKey, index - (days - 1));
    const summary = summarizeOrders(ordersOnDay(orders, key));
    const [year, month, day] = key.split('-').map(Number);
    return {
      key,
      label: `${WEEKDAYS_ES[new Date(year, month - 1, day).getDay()]} ${day}`,
      earnings: summary.earnings,
      accepted: summary.accepted,
      rejected: summary.rejected
    };
  });

/** Lunes (YYYY-MM-DD) de la semana que contiene `dayKey`. */
export const weekStartKey = (dayKey: string) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  const weekday = (new Date(year, month - 1, day).getDay() + 6) % 7; // 0 = lunes
  return addDays(dayKey, -weekday);
};

/** Últimas `weeks` semanas (lunes-domingo) terminando en la semana de `endDayKey`. */
export const weeklySeries = (orders: OrderLogEntry[], endDayKey: string, weeks = 6): SeriesPoint[] => {
  const lastMonday = weekStartKey(endDayKey);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(lastMonday, (index - (weeks - 1)) * 7);
    const end = addDays(start, 6);
    const rows = orders.filter((order) => {
      const key = localDayKey(order.occurredAt);
      return key >= start && key <= end;
    });
    const summary = summarizeOrders(rows);
    const [, month, day] = start.split('-').map(Number);
    return { key: start, label: `${day}/${month}`, earnings: summary.earnings, accepted: summary.accepted, rejected: summary.rejected };
  });
};

export const goalProgress = (earnings: number, goal?: number | null) => {
  if (!goal || goal <= 0) return null;
  return {
    pct: Math.max(0, Math.min(100, Math.round((earnings / goal) * 100))),
    remaining: round2(Math.max(0, goal - earnings)),
    reached: earnings >= goal
  };
};

/** Un pedido está convertido si su ingreso sigue existiendo (si el rider lo borró, vuelve a estar disponible). */
export const isConverted = (order: OrderLogEntry, liveIncomeIds: Set<string>) =>
  Boolean(order.convertedIncomeId && liveIncomeIds.has(order.convertedIncomeId));

export interface ConversionGroup {
  date: string;
  platform: string;
  amount: number;
  count: number;
  orderIds: string[];
}

/** Agrupa pedidos aceptados no convertidos por día y plataforma → un ingreso por grupo. */
export const planIncomeConversion = (orders: OrderLogEntry[], liveIncomeIds: Set<string>): ConversionGroup[] => {
  const map = new Map<string, ConversionGroup>();
  for (const order of orders) {
    if (order.status !== 'accepted' || isConverted(order, liveIncomeIds)) continue;
    const date = localDayKey(order.occurredAt);
    const key = `${date}|${normalizePlatformKey(order.platform)}`;
    const group = map.get(key) || { date, platform: order.platform.trim(), amount: 0, count: 0, orderIds: [] };
    group.amount = round2(group.amount + (order.amount || 0));
    group.count += 1;
    group.orderIds.push(order.id);
    map.set(key, group);
  }
  return Array.from(map.values())
    .filter((group) => group.amount > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.platform.localeCompare(b.platform, 'es'));
};

/** Ingresos importados de liquidaciones (documento o texto/CSV), no manuales. */
export const isSettlementIncome = (income: Income) =>
  income.sourceType === 'document_import' || income.sourceType === 'text_import';

export interface SettlementComparison {
  platform: string;
  logged: number;
  settled: number;
  /** logged − settled. Positivo = apuntaste más de lo liquidado. */
  difference: number;
}

/** Compara lo apuntado con lo liquidado (importado) por plataforma en un mes. Solo plataformas con liquidación. */
export const compareWithSettlements = (orders: OrderLogEntry[], incomes: Income[], monthKey: string): SettlementComparison[] => {
  const settled = new Map<string, { platform: string; amount: number }>();
  for (const income of incomes) {
    if (!isSettlementIncome(income) || !(income.date || '').startsWith(monthKey)) continue;
    const key = normalizePlatformKey(income.platform);
    const row = settled.get(key) || { platform: income.platform.trim(), amount: 0 };
    row.amount = round2(row.amount + (income.amount || 0));
    settled.set(key, row);
  }
  const logged = new Map(breakdownByPlatform(ordersInMonth(orders, monthKey)).map((row) => [normalizePlatformKey(row.platform), row]));
  return Array.from(settled.entries())
    .map(([key, row]) => {
      const loggedAmount = logged.get(key)?.earnings || 0;
      return { platform: logged.get(key)?.platform || row.platform, logged: loggedAmount, settled: row.amount, difference: round2(loggedAmount - row.amount) };
    })
    .sort((a, b) => a.platform.localeCompare(b.platform, 'es'));
};

/** Plataformas del plan de conversión que ya tienen liquidación importada ese mes (posible doble conteo). */
export const settlementOverlaps = (groups: ConversionGroup[], incomes: Income[]) => {
  const overlaps = new Set<string>();
  for (const group of groups) {
    const month = group.date.slice(0, 7);
    const key = normalizePlatformKey(group.platform);
    if (incomes.some((income) => isSettlementIncome(income) && (income.date || '').startsWith(month) && normalizePlatformKey(income.platform) === key)) {
      overlaps.add(`${group.platform} (${month})`);
    }
  }
  return Array.from(overlaps);
};

export const ORDER_CSV_HEADER: CsvRow = ['Fecha', 'Hora', 'Plataforma', 'Estado', 'Importe', 'Km', 'Motivo rechazo', 'Nota', 'Pasado a ingresos'];

export const orderCsvRows = (orders: OrderLogEntry[], liveIncomeIds: Set<string>): CsvRow[] => [
  ORDER_CSV_HEADER,
  ...[...orders]
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((order) => {
      const date = new Date(order.occurredAt);
      return [
        localDayKey(date),
        `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        order.platform,
        order.status === 'accepted' ? 'Aceptado' : 'Rechazado',
        order.amount === undefined ? '' : money(order.amount),
        order.km === undefined ? '' : money(order.km),
        order.rejectReason ? REJECT_REASON_LABELS[order.rejectReason] : '',
        order.note || '',
        isConverted(order, liveIncomeIds) ? 'Sí' : 'No'
      ];
    })
];

