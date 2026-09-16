import React, { useMemo, useState } from 'react';
import { Bell, ChevronRight, FileText, Fuel, MessageSquare, ReceiptText, ShieldCheck, Wallet } from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { useData } from '../contexts/DataContext';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface DashboardProps { setView?: (view: string) => void; }

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements } = useData();
  const { selectedCountry } = useCountry();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  if (!currentUser) return null;

  const summary = useMemo(() => getFiscalSummary(currentUser.id), [currentUser.id, getFiscalSummary]);
  const pendingRequirements = requirements.filter((requirement) => requirement.riderId === currentUser.id && requirement.status === 'pending');
  const period = currentQuarter();
  const formatCurrency = (amount: number) => privacyMode ? '••••' : amount.toLocaleString('es-ES', { style: 'currency', currency: selectedCountry.currency || 'EUR', maximumFractionDigits: 0 });

  const quickActions = [
    { label: 'Registrar gasto', description: 'Sube un ticket o factura', icon: Fuel, onClick: () => setIsGasModalOpen(true) },
    { label: 'Avisos', description: pendingRequirements.length ? `${pendingRequirements.length} pendientes` : 'Sin pendientes', icon: Bell, onClick: () => setView?.('gestor-requirements') },
    { label: 'Modelos', description: `Periodo ${period}`, icon: FileText, onClick: () => setView?.('tax-declarations') }
  ];

  return (
    <div id="rider-dashboard" className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="rounded-2xl border border-[#E1D9CF] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Resumen</p>
            <h1 className="mt-1 text-2xl font-bold text-stone-900">{currentUser.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Revisa tus movimientos, documentación y tareas pendientes del trimestre.</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
              {currentUser.iaeCode && <span><strong className="text-stone-700">IAE</strong> {currentUser.iaeCode}</span>}
              {currentUser.vehicleType && <span><strong className="text-stone-700">Vehículo</strong> {currentUser.vehicleType}</span>}
              <span><strong className="text-stone-700">Periodo</strong> {period}</span>
            </div>
          </div>
          <button onClick={() => setView?.('tax-declarations')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#244A37]"><FileText size={16} /> Revisar modelos</button>
        </div>
      </section>

      <section><h2 className="mb-3 text-sm font-bold text-stone-800">Acciones</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{quickActions.map((action) => { const Icon = action.icon; return <button key={action.label} onClick={action.onClick} className="group rounded-2xl border border-[#E4DDD2] bg-white px-4 py-4 text-left hover:border-[#CFC4B5]"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F4F1] text-[#2E5A44]"><Icon size={18} /></div><div className="min-w-0"><p className="text-sm font-bold text-stone-900">{action.label}</p><p className="mt-0.5 truncate text-xs text-stone-500">{action.description}</p></div></div><ChevronRight size={16} className="text-stone-300" /></div></button>; })}</div></section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric onClick={() => setView?.('money')} icon={Wallet} label="Ingresos" value={formatCurrency(summary.totalIncome)} />
        <Metric onClick={() => setView?.('money')} icon={ReceiptText} label="Gastos" value={formatCurrency(summary.totalExpenses)} accent />
        <Metric onClick={() => setView?.('tax-declarations')} icon={ShieldCheck} label="Neto" value={formatCurrency(summary.netProfit)} />
        <Metric onClick={() => setView?.('messages')} icon={MessageSquare} label="Mensajes" value="Abrir conversación" compact />
      </section>

      {pendingRequirements.length > 0 && <section className="rounded-2xl border border-[#E8D7C8] bg-[#FFF9F4] p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7E8DE] text-[#B55D3D]"><Bell size={17} /></div><div><p className="text-sm font-bold text-stone-900">{pendingRequirements.length === 1 ? '1 tarea pendiente' : `${pendingRequirements.length} tareas pendientes`}</p><p className="mt-1 text-xs text-stone-500">Revisa las peticiones recibidas de tu gestoría.</p></div></div><button onClick={() => setView?.('gestor-requirements')} className="text-xs font-bold text-[#2E5A44]">Ver</button></div></section>}

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const Metric = ({ onClick, icon: Icon, label, value, accent = false, compact = false }: any) => <button onClick={onClick} className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left hover:border-[#CFC4B5]"><Icon size={18} className={accent ? 'text-[#C96846]' : 'text-[#2E5A44]'} /><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</p><p className={`mt-1 font-bold text-stone-900 ${compact ? 'text-sm' : 'text-xl'}`}>{value}</p></button>;

export default Dashboard;
