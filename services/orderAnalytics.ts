/**
 * Análisis del registro de pedidos — cálculos puros sobre lo que el rider apuntó.
 * Sin datos de referencia, medias de mercado ni estimaciones externas: si no hay
 * registros suficientes, se devuelve null / «pocos datos» en lugar de inventar.
 */
import type { WorkSession } from '../types';
import {
  REJECT_REASON_LABELS,
  type OrderLogEntry,
  type RejectReason,
  breakdownByPlatform,
  goalProgress,
  localDayKey,
  normalizePlatformKey,
  weekStartKey
} from './orderLog';

const round2 = (value: number) => Math.round(value * 100) / 100;
const HOUR_MS = 3_600_000;

/** Mínimos para mostrar una franja como «con datos»: evita conclusiones con 1 pedido. */
export const MIN_ACCEPTED_FOR_SLOT = 3;
export const MIN_WORKED_MS_FOR_SLOT = HOUR_MS;

export const WEEKDAY_LABELS_MON_FIRST = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAY_SHORT_MON_FIRST = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const dayKeyToDate = (dayKey: string) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDaysKey = (dayKey: string, delta: number) => {
  const date = dayKeyToDate(dayKey);
  return localDayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta));
};

/** Inicio (ms) del día local `dayKey`. */
export const dayStartMs = (dayKey: string) => dayKeyToDate(dayKey).getTime();

/** 0 = lunes … 6 = domingo, en hora local. */
export const mondayFirstWeekday = (date: Date) => (date.getDay() + 6) % 7;

const sessionEndMs = (session: WorkSession, nowMs: number) =>
  session.endedAt ? new Date(session.endedAt).getTime() : nowMs;

/** Tiempo trabajado (ms) dentro de [fromMs, toMs). */
export const workedMsBetween = (sessions: WorkSession[], fromMs: number, toMs: number, nowMs: number) =>
  sessions.reduce((total, session) => {
    const start = Math.max(new Date(session.startedAt).getTime(), fromMs);
    const end = Math.min(sessionEndMs(session, nowMs), toMs, nowMs);
    return total + Math.max(0, end - start);
  }, 0);

/**
 * Reparte las jornadas en franjas locales de una hora dentro de [fromMs, toMs) y
 * llama a `visit(fechaInicioFranja, msEnEsaFranja)`. Corta en cada cambio de hora local.
 */
const walkHourSlices = (sessions: WorkSession[], fromMs: number, toMs: number, nowMs: number, visit: (sliceStart: Date, ms: number) => void) => {
  for (const session of sessions) {
    let cursor = Math.max(new Date(session.startedAt).getTime(), fromMs);
    const end = Math.min(sessionEndMs(session, nowMs), toMs, nowMs);
    let guard = 0;
    while (cursor < end && guard < 24 * 400) {
      const at = new Date(cursor);
      const nextHour = new Date(at.getFullYear(), at.getMonth(), at.getDate(), at.getHours() + 1).getTime();
      const sliceEnd = Math.min(end, nextHour > cursor ? nextHour : cursor + HOUR_MS);
      visit(at, sliceEnd - cursor);
      cursor = sliceEnd;
      guard += 1;
    }
  }
};

export const workedMsByHour = (sessions: WorkSession[], fromMs: number, toMs: number, nowMs: number) => {
  const buckets = Array.from({ length: 24 }, () => 0);
  walkHourSlices(sessions, fromMs, toMs, nowMs, (at, ms) => { buckets[at.getHours()] += ms; });
  return buckets;
};

export const workedMsByWeekday = (sessions: WorkSession[], fromMs: number, toMs: number, nowMs: number) => {
  const buckets = Array.from({ length: 7 }, () => 0);
  walkHourSlices(sessions, fromMs, toMs, nowMs, (at, ms) => { buckets[mondayFirstWeekday(at)] += ms; });
  return buckets;
};

export interface SlotPerformance {
  key: number;
  label: string;
  accepted: number;
  rejected: number;
  earnings: number;
  /** Km de pedidos aceptados que tienen km apuntados. */
  km: number;
  workedHours: number;
  /** Ganado en la franja / horas de jornada en la franja. Null si hay menos de 1 h trabajada. */
  eurPerHour: number | null;
  /** Solo con pedidos que tienen km apuntados. Null si no hay km. */
  eurPerKm: number | null;
  /** Al menos 3 aceptados y 1 h de jornada en la franja. */
  enoughData: boolean;
}

const inRange = (order: OrderLogEntry, fromMs: number, toMs: number) => {
  const time = new Date(order.occurredAt).getTime();
  return time >= fromMs && time < toMs;
};

const buildSlots = (
  orders: OrderLogEntry[],
  workedMs: number[],
  labels: string[],
  slotOf: (date: Date) => number
): SlotPerformance[] => {
  const rows = labels.map((label, key) => ({ key, label, accepted: 0, rejected: 0, earnings: 0, km: 0, kmEarnings: 0 }));
  for (const order of orders) {
    const row = rows[slotOf(new Date(order.occurredAt))];
    if (!row) continue;
    if (order.status !== 'accepted') { row.rejected += 1; continue; }
    row.accepted += 1;
    row.earnings += order.amount || 0;
    if (order.km && order.km > 0) {
      row.km += order.km;
      row.kmEarnings += order.amount || 0;
    }
  }
  return rows.map((row) => {
    const worked = workedMs[row.key] || 0;
    const workedHours = worked / HOUR_MS;
    return {
      key: row.key,
      label: row.label,
      accepted: row.accepted,
      rejected: row.rejected,
      earnings: round2(row.earnings),
      km: round2(row.km),
      workedHours: Math.round(workedHours * 10) / 10,
      eurPerHour: worked >= MIN_WORKED_MS_FOR_SLOT ? round2(row.earnings / workedHours) : null,
      eurPerKm: row.km > 0 ? round2(row.kmEarnings / row.km) : null,
      enoughData: row.accepted >= MIN_ACCEPTED_FOR_SLOT && worked >= MIN_WORKED_MS_FOR_SLOT
    };
  });
};

/**
 * Rendimiento por hora del día. Cada pedido cuenta en la hora en que se apuntó
 * (aproximación: no sabemos cuánto duró cada pedido).
 */
export const hourlyPerformance = (orders: OrderLogEntry[], sessions: WorkSession[], fromMs: number, toMs: number, nowMs: number) =>
  buildSlots(
    orders.filter((order) => inRange(order, fromMs, toMs)),
    workedMsByHour(sessions, fromMs, toMs, nowMs),
    Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}h`),
    (date) => date.getHours()
  );

export const weekdayPerformance = (orders: OrderLogEntry[], sessions: WorkSession[], fromMs: number, toMs: number, nowMs: number) =>
  buildSlots(
    orders.filter((order) => inRange(order, fromMs, toMs)),
    workedMsByWeekday(sessions, fromMs, toMs, nowMs),
    WEEKDAY_LABELS_MON_FIRST,
    mondayFirstWeekday
  );

/** Las `limit` mejores franjas con datos suficientes según la métrica. */
export const bestSlots = (slots: SlotPerformance[], metric: 'eurPerHour' | 'eurPerKm', limit = 3) =>
  slots
    .filter((slot) => slot.enoughData && slot[metric] !== null)
    .sort((a, b) => (b[metric] as number) - (a[metric] as number) || a.key - b.key)
    .slice(0, limit);

export interface AcceptancePoint {
  key: string;
  label: string;
  total: number;
  accepted: number;
  /** 0..1 o null si esa semana no hay pedidos apuntados. */
  rate: number | null;
}

/** % de aceptación por semana (lunes-domingo), de la más antigua a la actual. */
export const acceptanceTrend = (orders: OrderLogEntry[], endDayKey: string, weeks = 8): AcceptancePoint[] => {
  const lastMonday = weekStartKey(endDayKey);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDaysKey(lastMonday, (index - (weeks - 1)) * 7);
    const end = addDaysKey(start, 6);
    let total = 0;
    let accepted = 0;
    for (const order of orders) {
      const key = localDayKey(order.occurredAt);
      if (key < start || key > end) continue;
      total += 1;
      if (order.status === 'accepted') accepted += 1;
    }
    const [, month, day] = start.split('-').map(Number);
    return { key: start, label: `${day}/${month}`, total, accepted, rate: total ? accepted / total : null };
  });
};

export interface ReasonShare {
  reason: RejectReason | 'none';
  label: string;
  count: number;
  /** 0..1 sobre el total de rechazos. */
  share: number;
}

export const rejectionBreakdown = (orders: OrderLogEntry[]): ReasonShare[] => {
  const counts = new Map<RejectReason | 'none', number>();
  let total = 0;
  for (const order of orders) {
    if (order.status !== 'rejected') continue;
    const reason = order.rejectReason || 'none';
    counts.set(reason, (counts.get(reason) || 0) + 1);
    total += 1;
  }
  return Array.from(counts.entries())
    .map(([reason, count]) => ({
      reason,
      label: reason === 'none' ? 'Sin motivo' : REJECT_REASON_LABELS[reason],
      count,
      share: total ? count / total : 0
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
};

export interface PlatformComparisonRow {
  platform: string;
  accepted: number;
  rejected: number;
  acceptanceRate: number | null;
  earnings: number;
  avgPerOrder: number | null;
  km: number;
  /** Solo con pedidos que tienen km apuntados. */
  eurPerKm: number | null;
  /** Parte del total ganado en el periodo (0..1). */
  shareOfEarnings: number;
}

/** Comparativa entre plataformas. Sin €/h: la jornada no va ligada a una plataforma. */
export const platformComparison = (orders: OrderLogEntry[]): PlatformComparisonRow[] => {
  const kmEarnings = new Map<string, { km: number; amount: number }>();
  for (const order of orders) {
    if (order.status !== 'accepted' || !order.km || order.km <= 0) continue;
    const key = normalizePlatformKey(order.platform);
    const row = kmEarnings.get(key) || { km: 0, amount: 0 };
    row.km += order.km;
    row.amount += order.amount || 0;
    kmEarnings.set(key, row);
  }
  const rows = breakdownByPlatform(orders);
  const totalEarnings = rows.reduce((sum, row) => sum + row.earnings, 0);
  return rows.map((row) => {
    const total = row.accepted + row.rejected;
    const withKm = kmEarnings.get(normalizePlatformKey(row.platform));
    return {
      platform: row.platform,
      accepted: row.accepted,
      rejected: row.rejected,
      acceptanceRate: total ? row.accepted / total : null,
      earnings: row.earnings,
      avgPerOrder: row.accepted ? round2(row.earnings / row.accepted) : null,
      km: row.km,
      eurPerKm: withKm && withKm.km > 0 ? round2(withKm.amount / withKm.km) : null,
      shareOfEarnings: totalEarnings > 0 ? row.earnings / totalEarnings : 0
    };
  });
};

export interface PeriodStats {
  from: string;
  to: string;
  accepted: number;
  rejected: number;
  earnings: number;
  km: number;
  workedHours: number;
  eurPerHour: number | null;
  eurPerKm: number | null;
  acceptanceRate: number | null;
}

/** Estadísticas de pedidos cuyo día local está en [fromDay, toDay] y jornada en [fromMs, toMs). */
export const periodStats = (orders: OrderLogEntry[], sessions: WorkSession[], fromDay: string, toDay: string, nowMs: number, toMsOverride?: number): PeriodStats => {
  let accepted = 0;
  let rejected = 0;
  let earnings = 0;
  let km = 0;
  let kmEarnings = 0;
  for (const order of orders) {
    const key = localDayKey(order.occurredAt);
    if (key < fromDay || key > toDay) continue;
    if (toMsOverride !== undefined && new Date(order.occurredAt).getTime() >= toMsOverride) continue;
    if (order.status !== 'accepted') { rejected += 1; continue; }
    accepted += 1;
    earnings += order.amount || 0;
    if (order.km && order.km > 0) { km += order.km; kmEarnings += order.amount || 0; }
  }
  const toMs = toMsOverride ?? dayStartMs(addDaysKey(toDay, 1));
  const worked = workedMsBetween(sessions, dayStartMs(fromDay), toMs, nowMs);
  const workedHours = worked / HOUR_MS;
  const total = accepted + rejected;
  return {
    from: fromDay,
    to: toDay,
    accepted,
    rejected,
    earnings: round2(earnings),
    km: round2(km),
    workedHours: Math.round(workedHours * 10) / 10,
    eurPerHour: workedHours > 0 ? round2(earnings / workedHours) : null,
    eurPerKm: km > 0 ? round2(kmEarnings / km) : null,
    acceptanceRate: total ? accepted / total : null
  };
};

export interface WeekSummary {
  thisWeek: PeriodStats;
  /** Semana pasada hasta el mismo día de la semana y la misma hora, para comparar justo. */
  lastWeekSoFar: PeriodStats;
  /** Semana pasada completa (lunes-domingo). */
  lastWeekFull: PeriodStats;
  goal: ReturnType<typeof goalProgress>;
  /** Días que quedan en la semana incluyendo hoy. */
  daysLeft: number;
}

export const weekSummary = (orders: OrderLogEntry[], sessions: WorkSession[], todayKey: string, nowMs: number, weeklyGoal?: number | null): WeekSummary => {
  const monday = weekStartKey(todayKey);
  const lastMonday = addDaysKey(monday, -7);
  const lastSunday = addDaysKey(monday, -1);
  const sameMomentLastWeek = nowMs - 7 * 86_400_000;
  const thisWeek = periodStats(orders, sessions, monday, todayKey, nowMs);
  const weekdayIndex = mondayFirstWeekday(dayKeyToDate(todayKey));
  return {
    thisWeek,
    lastWeekSoFar: periodStats(orders, sessions, lastMonday, addDaysKey(todayKey, -7), nowMs, sameMomentLastWeek),
    lastWeekFull: periodStats(orders, sessions, lastMonday, lastSunday, nowMs),
    goal: goalProgress(thisWeek.earnings, weeklyGoal),
    daysLeft: 7 - weekdayIndex
  };
};

/** Cambio relativo (−1..∞) o null si no hay base con la que comparar. */
export const relativeChange = (current: number | null, previous: number | null) => {
  if (current === null || previous === null || previous <= 0) return null;
  return (current - previous) / previous;
};
