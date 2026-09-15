import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Fuel,
  Leaf,
  PiggyBank,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';
import { buildFiscalSnapshot } from '../services/fiscalEngine';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface DashboardProps {
  setView?: (view: string) => void;
}

const money = (value: number, hidden: boolean) => hidden
  ? '••••'
  : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const getQuarterLabel = (date = new Date()) => `${Math.floor(date.getMonth() / 3) + 1}T ${date.getFullYear()}`;
const isoLocal = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, incomes, expenses, payments, requirements, privacyMode } = useData();
  const { palette, timeOfDay } = useGhibliAtmosphere();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  if (!currentUser) return null;

  const quarterLabel = getQuarterLabel();
  const snapshot = useMemo(
    () => buildFiscalSnapshot(incomes, expenses, currentUser.id, quarterLabel),
    [currentUser.id, expenses, incomes, quarterLabel],
  );

  const pendingPayments = payments.filter((payment) => payment.status === 'pending');
  const pendingPaymentAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingExpenses = expenses.filter(
    (expense) => expense.userId === currentUser.id && (!expense.status || expense.status === 'pending_review' || expense.status === 'needs_fix'),
  );
  const pendingRequirements = requirements.filter(
    (requirement) => requirement.riderId === currentUser.id && requirement.status === 'pending',
  );

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const iso = isoLocal(date);
      const dayIncome = incomes
        .filter((income) => income.userId === currentUser.id && income.date === iso)
        .reduce((sum, income) => sum + income.amount, 0);
      const dayExpense = expenses
        .filter((expense) => expense.userId === currentUser.id && expense.date === iso)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return {
        date: iso,
        label: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date).replace('.', ''),
        ingresos: Number(dayIncome.toFixed(2)),
        gastos: Number(dayExpense.toFixed(2)),
      };
    });
  }, [currentUser.id, expenses, incomes]);

  const chartHasData = chartData.some((day) => day.ingresos > 0 || day.gastos > 0);
  const greeting = timeOfDay === 'dawn'
    ? 'Buenos días'
    : timeOfDay === 'midday'
      ? 'Buen día'
      : timeOfDay === 'golden_hour'
        ? 'Buenas tardes'
        : 'Buenas noches';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8" style={{ backgroundColor: palette.parchment, borderColor: palette.border }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: palette.sunGlow }} />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C9D9CC] bg-[#EDF4EF] px-3 py-1 text-xs font-semibold text-[#2E5A44]">
              <Leaf className="h-3.5 w-3.5" /> {quarterLabel} · datos reales registrados
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#27352E] sm:text-4xl">{greeting}, {currentUser.name}.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              Aquí ves lo que Labora+ puede demostrar con tus registros. Los gastos pendientes no se cuentan como deducibles y ningún impuesto se considera presentado sin justificante verificado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsGasModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#C96846] px-4 py-2.5 text-xs font-semibold text-white shadow-sm">
              <Fuel className="h-4 w-4" /> Guardar ticket
            </button>
            <button onClick={() => setView?.('gestor-requirements')} className="flex items-center gap-2 rounded-xl border border-[#D8D0C1] bg-white/80 px-4 py-2.5 text-xs font-semibold text-stone-700">
              <Bell className="h-4 w-4" /> Ver mi gestor
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Ingresos registrados" value={money(snapshot.quarter.grossIncome, privacyMode)} helper={`${quarterLabel} · no equivale a saldo bancario`} tone="green" onClick={() => setView?.('money')} />
        <MetricCard icon={Wallet} label="Pagos por conciliar" value={money(pendingPaymentAmount, privacyMode)} helper={pendingPayments.length ? `${pendingPayments.length} pago(s) aún no confirmados` : 'No hay pagos pendientes registrados'} tone="blue" onClick={() => setView?.('money')} />
        <MetricCard icon={Receipt} label="Gastos pendientes" value={String(pendingExpenses.length)} helper="No se cuentan como deducibles hasta revisión" tone={pendingExpenses.length ? 'amber' : 'green'} onClick={() => setView?.('money')} />
        <MetricCard icon={PiggyBank} label="Referencia IRPF" value={money(snapshot.model130.provisionalAccruedAmount, privacyMode)} helper="Estimación acumulada; requiere revisión del gestor" tone="amber" onClick={() => setView?.('tax-declarations')} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_.85fr]">
        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><h2 className="font-serif text-lg font-bold text-stone-900">Últimos 7 días registrados</h2><p className="mt-1 text-xs text-stone-500">Ingresos y gastos cargados en Labora+. No se generan datos para rellenar la gráfica.</p></div>
            <ShieldCheck className="h-5 w-5 text-[#2E5A44]" />
          </div>
          {chartHasData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE3D6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#78716c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                  <Tooltip content={<ChartTooltip hidden={privacyMode} />} cursor={{ fill: '#F5F1E9' }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3B7258" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#C96846" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Todavía no hay movimientos esta semana" text="Cuando registres cobros o gastos reales aparecerán aquí." action="Registrar movimientos" onClick={() => setView?.('money')} />
          )}
        </section>

        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-serif text-lg font-bold text-stone-900">Mi gestor</h2><p className="mt-1 text-xs text-stone-500">Lo que necesita de ti, explicado sin WhatsApp perdido.</p></div><Bell className="h-5 w-5 text-[#3A7596]" /></div>
          <div className="mt-4 space-y-3">
            {pendingRequirements.length === 0 ? (
              <div className="rounded-2xl border border-[#D6E3D9] bg-[#EEF5F0] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#2E5A44]"><CheckCircle2 className="h-4 w-4" /> No tienes peticiones pendientes</div><p className="mt-1 text-xs text-stone-600">Si tu gestor solicita un documento, aparecerá aquí con fecha y explicación.</p></div>
            ) : pendingRequirements.slice(0, 3).map((requirement) => (
              <button key={requirement.id} onClick={() => setView?.('gestor-requirements')} className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100/60">
                <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-stone-900">{requirement.title}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{requirement.description || 'Tu gestor necesita este documento para continuar la revisión.'}</p>{requirement.deadline && <p className="mt-2 text-[11px] font-semibold text-amber-800">Fecha límite: {new Intl.DateTimeFormat('es-ES').format(new Date(`${requirement.deadline}T12:00:00`))}</p>}</div><ArrowRight className="h-4 w-4 shrink-0 text-stone-400" /></div>
              </button>
            ))}
          </div>
          <button onClick={() => setView?.('gestor-requirements')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-xs font-semibold text-stone-700">Abrir conversación con mi gestor <ArrowRight className="h-3.5 w-3.5" /></button>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard icon={Fuel} title="Fotografía un ticket" text="Guardamos la evidencia original y cualquier lectura automática queda pendiente de revisión." action="Guardar ticket" onClick={() => setIsGasModalOpen(true)} />
        <ActionCard icon={FileText} title="Revisa el trimestre" text="Mira qué datos faltan antes de que llegue el cierre y evita sorpresas con tu gestor." action="Abrir fiscal" onClick={() => setView?.('tax-declarations')} />
        <ActionCard icon={Wallet} title="Ordena tus cobros" text="Registra o concilia pagos de plataformas sin confundir un pago esperado con dinero recibido." action="Abrir dinero" onClick={() => setView?.('money')} />
      </section>

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; helper: string; tone: 'green' | 'blue' | 'amber'; onClick: () => void; }> = ({ icon: Icon, label, value, helper, tone, onClick }) => {
  const tones = { green: 'bg-[#EEF5F0] border-[#D6E3D9] text-[#2E5A44]', blue: 'bg-[#EEF4F7] border-[#D8E5EA] text-[#3A7596]', amber: 'bg-[#FEF7EB] border-[#F3DFC0] text-[#9A6A27]' };
  return <button onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${tones[tone]}`}><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</p><Icon className="h-4 w-4" /></div><p className="mt-2 font-serif text-2xl font-bold text-stone-900">{value}</p><p className="mt-1 text-[11px] leading-relaxed text-stone-500">{helper}</p></button>;
};

const ActionCard: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; text: string; action: string; onClick: () => void; }> = ({ icon: Icon, title, text, action, onClick }) => <button onClick={onClick} className="rounded-2xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 text-left shadow-sm transition hover:bg-white"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F1EB] text-[#2E5A44]"><Icon className="h-5 w-5" /></div><h3 className="mt-4 font-serif font-bold text-stone-900">{title}</h3><p className="mt-1 text-xs leading-relaxed text-stone-500">{text}</p><span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#2E5A44]">{action} <ArrowRight className="h-3.5 w-3.5" /></span></button>;

const EmptyState: React.FC<{ title: string; text: string; action: string; onClick: () => void }> = ({ title, text, action, onClick }) => <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DFD5C6] bg-[#F9F6F0] px-6 text-center"><TrendingUp className="h-7 w-7 text-[#91A99A]" /><h3 className="mt-3 font-serif font-bold text-stone-900">{title}</h3><p className="mt-1 max-w-sm text-xs text-stone-500">{text}</p><button onClick={onClick} className="mt-4 rounded-xl bg-[#2E5A44] px-3.5 py-2 text-xs font-semibold text-white">{action}</button></div>;

const ChartTooltip: React.FC<any> = ({ active, payload, label, hidden }) => {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-[#E3DBD0] bg-[#FCFAF7] p-3 text-xs shadow-lg"><p className="mb-2 font-serif font-bold text-stone-800">{label}</p>{payload.map((item: any) => <div key={item.dataKey} className="flex min-w-36 items-center justify-between gap-4 py-0.5"><span className="text-stone-500">{item.name}</span><span className="font-semibold text-stone-900">{money(Number(item.value), hidden)}</span></div>)}</div>;
};

export default Dashboard;
