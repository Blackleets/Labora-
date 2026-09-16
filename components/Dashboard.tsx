import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Fuel,
  Globe2,
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
import { FISCAL_POLICY_ES_2026 } from '../services/fiscalPolicyES2026';
import { getMarketProfile, MarketProfile } from '../modules/country-config/marketProfiles';
import { GLOBAL_INTEGRATION_CATALOG } from '../modules/integrations/data/catalog';
import { GasStationCaptureModal } from './GasStationCaptureModal';
import LogoResolver from './LogoResolver';

interface DashboardProps {
  setView?: (view: string) => void;
}

const formatMoney = (value: number, hidden: boolean, market: MarketProfile) => hidden
  ? '••••'
  : new Intl.NumberFormat(market.locale, { style: 'currency', currency: market.currency }).format(value);

const getQuarterLabel = (date = new Date()) => `${Math.floor(date.getMonth() / 3) + 1}T ${date.getFullYear()}`;
const getSupportedFiscalQuarterLabel = (date = new Date()) => {
  const taxYear = FISCAL_POLICY_ES_2026.taxYear;
  if (date.getFullYear() < taxYear) return `1T ${taxYear}`;
  if (date.getFullYear() > taxYear) return `4T ${taxYear}`;
  return `${Math.floor(date.getMonth() / 3) + 1}T ${taxYear}`;
};
const isoLocal = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, incomes, expenses, payments, requirements, privacyMode } = useData();
  const { palette, timeOfDay } = useGhibliAtmosphere();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  const currentUserId = currentUser?.id || '';
  const market = getMarketProfile(currentUser?.countryCode);
  const fiscalEnabled = Boolean(currentUser && market.fiscalEngineStatus === 'verified');
  const quarterLabel = fiscalEnabled ? getSupportedFiscalQuarterLabel() : getQuarterLabel();
  const userIncomes = incomes.filter((income) => income.userId === currentUserId);
  const userExpenses = expenses.filter((expense) => expense.userId === currentUserId);
  const totalIncome = userIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const registeredBalance = totalIncome - totalExpenses;

  const fiscalSnapshot = useMemo(
    () => fiscalEnabled && currentUserId ? buildFiscalSnapshot(incomes, expenses, currentUserId, quarterLabel) : null,
    [currentUserId, expenses, fiscalEnabled, incomes, quarterLabel],
  );

  const pendingPayments = payments.filter((payment) => payment.status === 'pending');
  const pendingPaymentAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingExpenses = userExpenses.filter((expense) => !expense.status || expense.status === 'pending_review' || expense.status === 'needs_fix');
  const pendingRequirements = requirements.filter((requirement) => requirement.riderId === currentUserId && requirement.status === 'pending');

  const platformCards = (currentUser?.platforms || []).slice(0, 6).map((platformName) => {
    const normalized = platformName.toLowerCase();
    const integration = GLOBAL_INTEGRATION_CATALOG.find((item) => item.name.toLowerCase() === normalized || item.id.toLowerCase() === normalized);
    return { name: integration?.name || platformName, integration };
  });

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const iso = isoLocal(date);
      const dayIncome = incomes.filter((income) => income.userId === currentUserId && income.date === iso).reduce((sum, income) => sum + income.amount, 0);
      const dayExpense = expenses.filter((expense) => expense.userId === currentUserId && expense.date === iso).reduce((sum, expense) => sum + expense.amount, 0);
      return {
        date: iso,
        label: new Intl.DateTimeFormat(market.locale, { weekday: 'short' }).format(date).replace('.', ''),
        ingresos: Number(dayIncome.toFixed(2)),
        gastos: Number(dayExpense.toFixed(2)),
      };
    });
  }, [currentUserId, expenses, incomes, market.locale]);

  if (!currentUser) return null;

  const chartHasData = chartData.some((day) => day.ingresos > 0 || day.gastos > 0);
  const greeting = timeOfDay === 'dawn' ? 'Buenos días' : timeOfDay === 'midday' ? 'Buen día' : timeOfDay === 'golden_hour' ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8" style={{ backgroundColor: palette.parchment, borderColor: palette.border }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: palette.sunGlow }} />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C9D9CC] bg-[#EDF4EF] px-3 py-1 text-xs font-semibold text-[#2E5A44]"><Leaf className="h-3.5 w-3.5" /> {quarterLabel} · datos registrados</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E5EA] bg-[#EEF4F7] px-3 py-1 text-xs font-semibold text-[#3A7596]"><Globe2 className="h-3.5 w-3.5" /> {market.displayName} · {market.currency}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#27352E] sm:text-4xl">{greeting}, {currentUser.name}.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              Aquí ves únicamente lo que has registrado o aportado. {fiscalEnabled ? 'Las referencias fiscales sirven para detectar qué falta; no son importes finales, órdenes de pago ni prueba de presentación.' : `Labora+ no calcula impuestos de ${market.displayName} todavía; tu espacio funciona como control financiero, documental y de colaboración.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsGasModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#C96846] px-4 py-2.5 text-xs font-semibold text-white shadow-sm"><Fuel className="h-4 w-4" /> Guardar ticket</button>
            <button onClick={() => setView?.('gestor-requirements')} className="flex items-center gap-2 rounded-xl border border-[#D8D0C1] bg-white/80 px-4 py-2.5 text-xs font-semibold text-stone-700"><Bell className="h-4 w-4" /> Mi gestor</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Ingresos registrados" value={formatMoney(totalIncome, privacyMode, market)} helper="No equivale a saldo bancario" tone="green" onClick={() => setView?.('money')} />
        <MetricCard icon={Wallet} label="Pagos por conciliar" value={formatMoney(pendingPaymentAmount, privacyMode, market)} helper={pendingPayments.length ? `${pendingPayments.length} pago(s) por confirmar` : 'No hay pagos pendientes registrados'} tone="blue" onClick={() => setView?.('money')} />
        <MetricCard icon={Receipt} label="Evidencias pendientes" value={String(pendingExpenses.length)} helper="El asesor aún no ha cerrado estas revisiones" tone={pendingExpenses.length ? 'amber' : 'green'} onClick={() => setView?.('money')} />
        {fiscalEnabled && fiscalSnapshot ? (
          <MetricCard icon={PiggyBank} label="Referencia fiscal no accionable" value={formatMoney(fiscalSnapshot.model130.standardRateReferenceAmount, privacyMode, market)} helper={`Regla estándar de trabajo · ${fiscalSnapshot.policyId} · no cuota final`} tone="amber" onClick={() => setView?.('tax-declarations')} />
        ) : (
          <MetricCard icon={Wallet} label="Balance registrado" value={formatMoney(registeredBalance, privacyMode, market)} helper="Ingresos registrados menos gastos registrados" tone={registeredBalance >= 0 ? 'green' : 'amber'} onClick={() => setView?.('money')} />
        )}
      </section>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-serif text-lg font-bold text-stone-900">Mis plataformas</h2><p className="mt-1 text-xs text-stone-500">Son las apps que declaraste usar. “Añadida” no significa API conectada.</p></div>
          <button onClick={() => setView?.('integrations')} className="flex items-center gap-1.5 text-xs font-bold text-[#2E5A44]">Gestionar plataformas <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
        {platformCards.length === 0 ? (
          <button onClick={() => setView?.('integrations')} className="mt-4 w-full rounded-2xl border border-dashed border-[#CFD8CF] bg-[#F5F8F4] p-5 text-center text-xs font-semibold text-[#52705E]">Añade Uber Eats, Glovo, Rappi, DoorDash o cualquier plataforma local</button>
        ) : (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {platformCards.map(({ name, integration }) => (
              <div key={name} className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-[#E4DDD2] bg-white p-3">
                <LogoResolver id={integration?.id || name.toLowerCase().replace(/\s+/g, '_')} name={name} domain={integration?.domain} category={integration?.category || 'delivery'} size="sm" />
                <div className="min-w-0"><p className="truncate text-xs font-black text-stone-800">{name}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-400">Añadida</p></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_.85fr]">
        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-serif text-lg font-bold text-stone-900">Últimos 7 días registrados</h2><p className="mt-1 text-xs text-stone-500">La gráfica queda vacía si tú no has aportado movimientos.</p></div><ShieldCheck className="h-5 w-5 text-[#2E5A44]" /></div>
          {chartHasData ? (
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE3D6" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#78716c' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} /><Tooltip content={<ChartTooltip hidden={privacyMode} market={market} />} cursor={{ fill: '#F5F1E9' }} /><Bar dataKey="ingresos" name="Ingresos" fill="#3B7258" radius={[6, 6, 0, 0]} /><Bar dataKey="gastos" name="Gastos" fill="#C96846" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          ) : <EmptyState title="Todavía no hay movimientos esta semana" text="Cuando registres cobros o gastos reales aparecerán aquí." action="Registrar movimientos" onClick={() => setView?.('money')} />}
        </section>

        <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-serif text-lg font-bold text-stone-900">Mi gestor</h2><p className="mt-1 text-xs text-stone-500">Peticiones claras, sin capturas perdidas en WhatsApp.</p></div><Bell className="h-5 w-5 text-[#3A7596]" /></div>
          <div className="mt-4 space-y-3">
            {pendingRequirements.length === 0 ? (
              <div className="rounded-2xl border border-[#D6E3D9] bg-[#EEF5F0] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#2E5A44]"><CheckCircle2 className="h-4 w-4" /> No tienes peticiones pendientes</div><p className="mt-1 text-xs text-stone-600">Si tu gestor solicita un documento, aparecerá aquí con fecha y explicación.</p></div>
            ) : pendingRequirements.slice(0, 3).map((requirement) => (
              <button key={requirement.id} onClick={() => setView?.('gestor-requirements')} className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100/60"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-stone-900">{requirement.title}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{requirement.description || 'Tu gestor necesita este documento para continuar la revisión.'}</p>{requirement.deadline && <p className="mt-2 text-[11px] font-semibold text-amber-800">Fecha límite: {new Intl.DateTimeFormat(market.locale).format(new Date(`${requirement.deadline}T12:00:00`))}</p>}</div><ArrowRight className="h-4 w-4 shrink-0 text-stone-400" /></div></button>
            ))}
          </div>
          <button onClick={() => setView?.('gestor-requirements')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-xs font-semibold text-stone-700">Abrir espacio con mi gestor <ArrowRight className="h-3.5 w-3.5" /></button>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard icon={Fuel} title="Fotografía un ticket" text="Guardamos la evidencia original y cualquier lectura automática queda pendiente de revisión." action="Guardar ticket" onClick={() => setIsGasModalOpen(true)} />
        {fiscalEnabled ? (
          <ActionCard icon={FileText} title="Revisa el periodo" text="Comprueba qué datos faltan antes del cierre sin confundir una referencia con una cuota final o una presentación." action="Abrir fiscal" onClick={() => setView?.('tax-declarations')} />
        ) : (
          <ActionCard icon={FileText} title="Ordena documentos" text={`Conserva comprobantes y extractos mientras Labora+ prepara soporte fiscal verificado para ${market.displayName}.`} action="Abrir documentos" onClick={() => setView?.('docs')} />
        )}
        <ActionCard icon={Wallet} title="Ordena tus cobros" text="Registra pagos esperados y recibidos sin convertirlos automáticamente en otra cosa." action="Abrir dinero" onClick={() => setView?.('money')} />
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

const ChartTooltip: React.FC<any> = ({ active, payload, label, hidden, market }) => {
  if (!active || !payload?.length) return null;
  return <div className="min-w-[150px] rounded-xl border border-[#E8DFC8] bg-white p-3 shadow-lg"><p className="mb-2 text-xs font-bold text-stone-700">{label}</p>{payload.map((item: any) => <div key={item.dataKey} className="flex items-center justify-between gap-4 text-[11px]"><span className="capitalize text-stone-500">{item.name}</span><strong>{formatMoney(Number(item.value || 0), hidden, market)}</strong></div>)}</div>;
};

export default Dashboard;
