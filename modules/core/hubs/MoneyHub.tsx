import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Fuel,
  PiggyBank,
  Receipt,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import ExpenseTracker from '../../../components/ExpenseTracker';
import IncomeTracker from '../../../components/IncomeTracker';
import { TaxDeclarationsViewer } from '../../../components/TaxDeclarationsViewer';
import Documents from '../../../components/Documents';
import { GasStationCaptureModal } from '../../../components/GasStationCaptureModal';

interface MoneyHubProps {
  initialTab?: 'expenses' | 'incomes' | 'payments' | 'taxes' | 'docs' | 'payroll' | 'banking';
  setView?: (view: string) => void;
}

type RealTab = 'expenses' | 'incomes' | 'payments' | 'taxes' | 'docs';

const normalizeTab = (tab?: string): RealTab => {
  if (tab === 'incomes' || tab === 'payments' || tab === 'taxes' || tab === 'docs') return tab;
  return 'expenses';
};

const money = (value: number, hidden: boolean) => hidden
  ? '••••'
  : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

export const MoneyHub: React.FC<MoneyHubProps> = ({ initialTab = 'expenses' }) => {
  const { currentUser, getFiscalSummary, privacyMode, payments } = useData();
  const [activeTab, setActiveTab] = useState<RealTab>(normalizeTab(initialTab));
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  useEffect(() => setActiveTab(normalizeTab(initialTab)), [initialTab]);

  if (!currentUser) return null;
  const summary = getFiscalSummary(currentUser.id);
  const pendingPayments = payments.filter((payment) => payment.status === 'pending');
  const receivedPayments = payments.filter((payment) => payment.status === 'received');
  const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const receivedAmount = receivedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const tabs: { id: RealTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'payments', label: 'Cobros plataformas', icon: Wallet },
    { id: 'incomes', label: 'Ingresos', icon: TrendingUp },
    { id: 'expenses', label: 'Gastos y tickets', icon: Receipt },
    { id: 'docs', label: 'Documentos', icon: FileText },
    { id: 'taxes', label: 'Fiscal', icon: Scale },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D6E3D9] bg-[#EEF5F0] px-3 py-1 text-xs font-semibold text-[#2E5A44]"><Wallet className="h-3.5 w-3.5" /> Mi dinero · {summary.quarter}</div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Entender lo que cobras sin mezclarlo con lo que esperabas cobrar</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">Un pago esperado, un ingreso registrado y un movimiento bancario son cosas distintas. Labora+ los mantiene separados hasta que exista evidencia para conciliarlos.</p>
          </div>
          <button onClick={() => setIsGasModalOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#C96846] px-4 py-2.5 text-xs font-semibold text-white shadow-sm"><Fuel className="h-4 w-4" /> Guardar ticket</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Ingresos registrados" value={money(summary.totalIncome, privacyMode)} helper="Datos cargados para el trimestre" />
          <Summary label="Cobros recibidos" value={money(receivedAmount, privacyMode)} helper={`${receivedPayments.length} pago(s) marcados como recibidos`} />
          <Summary label="Por conciliar" value={money(pendingAmount, privacyMode)} helper={`${pendingPayments.length} pago(s) esperados`} warning={pendingPayments.length > 0} />
          <Summary label="Referencia IRPF" value={money(summary.estimatedIRPF, privacyMode)} helper="Estimación, no autoliquidación" warning />
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#E8DFC8] bg-[#FCFAF7] p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-[#213B2F] text-white shadow-sm' : 'text-stone-600 hover:bg-[#F2EDE4]'}`}><Icon className="h-4 w-4" />{tab.label}</button>;
        })}
      </nav>

      {activeTab === 'payments' && <PaymentsPanel />}
      {activeTab === 'incomes' && <IncomeTracker startDate="" endDate="" />}
      {activeTab === 'expenses' && <ExpenseTracker startDate="" endDate="" />}
      {activeTab === 'docs' && <Documents />}
      {activeTab === 'taxes' && <TaxDeclarationsViewer />}

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const PaymentsPanel: React.FC = () => {
  const { payments, addPayment, markPaymentAsReceived, privacyMode, showNotification } = useData();
  const [platform, setPlatform] = useState('Uber Eats');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'received'>('pending');
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date)), [payments]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!platform.trim() || !date || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      showNotification('error', 'Completa plataforma, fecha e importe real.');
      return;
    }
    setSaving(true);
    try {
      await addPayment({ platform: platform.trim(), amount: numericAmount, date, status, estimated: status === 'pending' });
      setAmount('');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar el cobro.');
    } finally {
      setSaving(false);
    }
  };

  const confirmReceived = async (id: string) => {
    try {
      await markPaymentAsReceived(id);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo actualizar el cobro.');
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
      <form onSubmit={submit} className="h-fit space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
        <div><h2 className="font-serif text-lg font-bold text-stone-900">Registrar un cobro</h2><p className="mt-1 text-xs leading-relaxed text-stone-500">Úsalo para anotar lo que una plataforma dice que te pagará o lo que ya has confirmado que recibiste. No crea un ingreso fiscal duplicado.</p></div>
        <label className="block text-xs font-semibold text-stone-700">Plataforma<input value={platform} onChange={(event) => setPlatform(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" placeholder="Uber Eats" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-stone-700">Importe (€)<input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-semibold text-stone-700">Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F2EDE4] p-1.5">
          <button type="button" onClick={() => setStatus('pending')} className={`rounded-xl px-3 py-2 text-xs font-semibold ${status === 'pending' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-500'}`}>Espero cobrarlo</button>
          <button type="button" onClick={() => setStatus('received')} className={`rounded-xl px-3 py-2 text-xs font-semibold ${status === 'received' ? 'bg-white text-[#2E5A44] shadow-sm' : 'text-stone-500'}`}>Ya lo recibí</button>
        </div>
        <button disabled={saving} className="w-full rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar cobro'}</button>
      </form>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
        <div className="mb-4"><h2 className="font-serif text-lg font-bold text-stone-900">Historial de cobros</h2><p className="mt-1 text-xs text-stone-500">“Recibido” significa que tú lo confirmaste; la conciliación bancaria automática se activará solo cuando exista una integración real.</p></div>
        <div className="space-y-3">
          {sorted.length === 0 && <div className="rounded-2xl border border-dashed border-[#DFD5C6] p-8 text-center text-xs text-stone-500">Todavía no has registrado cobros de plataformas.</div>}
          {sorted.map((payment) => <div key={payment.id} className="flex flex-col gap-3 rounded-2xl border border-[#E8DFC8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold text-stone-900">{payment.platform}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${payment.status === 'received' ? 'bg-[#EAF4ED] text-[#2E5A44]' : 'bg-amber-50 text-amber-800'}`}>{payment.status === 'received' ? 'RECIBIDO' : 'ESPERADO'}</span></div><p className="mt-1 text-xs text-stone-500">{payment.date} · {money(payment.amount, privacyMode)}</p></div>{payment.status === 'pending' && <button onClick={() => void confirmReceived(payment.id)} className="flex items-center justify-center gap-2 rounded-xl border border-[#CFE0D3] bg-[#EEF5F0] px-3 py-2 text-xs font-semibold text-[#2E5A44]"><CheckCircle2 className="h-4 w-4" /> Confirmar recibido</button>}</div>)}
        </div>
      </section>
    </div>
  );
};

const Summary: React.FC<{ label: string; value: string; helper: string; warning?: boolean }> = ({ label, value, helper, warning }) => <div className={`rounded-2xl border p-4 ${warning ? 'border-amber-200 bg-amber-50' : 'border-[#E8DFC8] bg-white'}`}><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</p>{warning && <PiggyBank className="h-4 w-4 text-amber-700" />}</div><p className="mt-1 font-serif text-xl font-bold text-stone-900">{value}</p><p className="mt-1 text-[10px] leading-relaxed text-stone-500">{helper}</p></div>;
