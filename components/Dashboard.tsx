import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  FileText,
  Fuel,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface DashboardProps {
  setView?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements } = useData();
  const { selectedCountry } = useCountry();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  const summary = useMemo(
    () => getFiscalSummary(currentUser?.id || 'u1'),
    [currentUser, getFiscalSummary]
  );

  const pendingRequirements = requirements.filter(
    (requirement) => requirement.riderId === currentUser?.id && requirement.status === 'pending'
  );

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  const quickActions = [
    {
      label: 'Registrar gasto',
      description: 'Sube un ticket',
      icon: Fuel,
      onClick: () => setIsGasModalOpen(true)
    },
    {
      label: 'Avisos',
      description: pendingRequirements.length > 0 ? `${pendingRequirements.length} pendientes` : 'Sin pendientes',
      icon: Bell,
      onClick: () => setView?.('gestor-requirements')
    },
    {
      label: 'Modelos',
      description: '130 y 303',
      icon: FileText,
      onClick: () => setView?.('tax-declarations')
    }
  ];

  return (
    <div id="rider-dashboard" className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="rounded-2xl border border-[#E1D9CF] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Resumen</p>
            <h1 className="mt-1 text-2xl font-bold text-stone-900">
              {currentUser?.name || 'Mi actividad'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              Revisa tus movimientos, documentación y tareas pendientes del trimestre.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
              {currentUser?.iaeCode && <span><strong className="text-stone-700">IAE</strong> {currentUser.iaeCode}</span>}
              {currentUser?.vehicleType && <span><strong className="text-stone-700">Vehículo</strong> {currentUser.vehicleType}</span>}
              <span><strong className="text-stone-700">Periodo</strong> {summary.quarter || '3T 2026'}</span>
            </div>
          </div>

          <button
            onClick={() => setView?.('tax-declarations')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#244A37]"
          >
            <FileText size={16} />
            Revisar modelos
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-stone-800">Acciones</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="group rounded-2xl border border-[#E4DDD2] bg-white px-4 py-4 text-left transition-colors hover:border-[#CFC4B5]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F4F1] text-[#2E5A44]">
                      <Icon size={18} strokeWidth={2.1} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900">{action.label}</p>
                      <p className="mt-0.5 truncate text-xs text-stone-500">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-stone-300 transition-colors group-hover:text-stone-500" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          onClick={() => setView?.('money')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left transition-colors hover:border-[#CFC4B5]"
        >
          <Wallet size={18} className="text-[#2E5A44]" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Ingresos</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(summary.totalIncome)}</p>
        </button>

        <button
          onClick={() => setView?.('money')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left transition-colors hover:border-[#CFC4B5]"
        >
          <ReceiptText size={18} className="text-[#C96846]" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Gastos</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(summary.totalExpenses)}</p>
        </button>

        <button
          onClick={() => setView?.('tax-declarations')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left transition-colors hover:border-[#CFC4B5]"
        >
          <ShieldCheck size={18} className="text-[#2E5A44]" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Neto</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatCurrency(summary.netProfit)}</p>
        </button>

        <button
          onClick={() => setView?.('messages')}
          className="rounded-2xl border border-[#E4DDD2] bg-white p-4 text-left transition-colors hover:border-[#CFC4B5]"
        >
          <MessageSquare size={18} className="text-[#2E5A44]" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Mensajes</p>
          <p className="mt-1 text-sm font-bold text-stone-900">Abrir conversación</p>
        </button>
      </section>

      {pendingRequirements.length > 0 && (
        <section className="rounded-2xl border border-[#E8D7C8] bg-[#FFF9F4] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7E8DE] text-[#B55D3D]">
                <Bell size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  {pendingRequirements.length === 1 ? '1 tarea pendiente' : `${pendingRequirements.length} tareas pendientes`}
                </p>
                <p className="mt-1 text-xs text-stone-500">Revisa las peticiones recibidas de tu gestoría.</p>
              </div>
            </div>
            <button
              onClick={() => setView?.('gestor-requirements')}
              className="whitespace-nowrap text-xs font-bold text-[#2E5A44]"
            >
              Ver
            </button>
          </div>
        </section>
      )}

      <GasStationCaptureModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;