import React, { useState, useEffect } from 'react';
import { 
  Wallet, Receipt, TrendingUp, Scale, FileText, 
  DollarSign, Building, ArrowUpRight, ArrowDownRight, 
  Plus, Fuel, ShieldCheck, Download, PiggyBank 
} from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useCountry } from '../../../contexts/CountryContext';
import { UserRole } from '../../../types';
import ExpenseTracker from '../../../components/ExpenseTracker';
import IncomeTracker from '../../../components/IncomeTracker';
import { TaxDeclarationsViewer } from '../../../components/TaxDeclarationsViewer';
import Documents from '../../../components/Documents';
import { PayrollDashboard } from '../../payroll/components/PayrollDashboard';
import { BankingConnect } from '../../banking-connect/BankingConnect';
import { GasStationCaptureModal } from '../../../components/GasStationCaptureModal';

interface MoneyHubProps {
  initialTab?: 'expenses' | 'incomes' | 'taxes' | 'docs' | 'payroll' | 'banking';
  setView?: (view: string) => void;
}

export const MoneyHub: React.FC<MoneyHubProps> = ({ initialTab = 'expenses', setView }) => {
  const { currentUser, getFiscalSummary, privacyMode } = useData();
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<'expenses' | 'incomes' | 'taxes' | 'docs' | 'payroll' | 'banking'>(initialTab);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const summary = getFiscalSummary(currentUser?.id || 'u1');

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0 
    });
  };

  const tabs = [
    { id: 'expenses', label: 'Gastos & Tickets', icon: Receipt, desc: 'Combustible y deducciones' },
    { id: 'incomes', label: 'Ingresos Plataformas', icon: TrendingUp, desc: 'Uber, Glovo, Just Eat' },
    { id: 'taxes', label: 'Modelos AEAT (130/303)', icon: Scale, desc: 'Liquidaciones trimestrales' },
    { id: 'docs', label: 'Expediente Digital', icon: FileText, desc: 'Tickets y certificados' },
    { id: 'payroll', label: 'Liquidaciones', icon: DollarSign, desc: 'Extractos semanales' },
    { id: 'banking', label: 'Banca Conectada', icon: Building, desc: 'Cuentas y cobros' },
  ];

  return (
    <div id="money-hub-workspace" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Quick Financial Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 flex items-center space-x-1">
                <Wallet className="w-3.5 h-3.5" />
                <span>Gestión Financiera & Tributaria</span>
              </span>
              <span className="text-xs text-slate-400">• Periodo Activo: 3T 2026</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentUser?.role === UserRole.MANAGER ? 'Auditoría Económica de Cartera' : 'Centro Económico & Fiscal'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de ingresos por plataforma, tickets de combustible deducibles con respaldo fotográfico y cálculo de IRPF e IVA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser?.role === UserRole.RIDER && (
              <button
                onClick={() => setIsGasModalOpen(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition-colors active:scale-95"
              >
                <Fuel size={16} />
                <span>+ Repostaje Gasolinera</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('taxes')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition-colors active:scale-95"
            >
              <Scale size={16} />
              <span>Ver Modelos 130 / 303</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div 
            onClick={() => setActiveTab('incomes')}
            className="p-3 bg-blue-50/50 hover:bg-blue-50 rounded-xl border border-blue-100/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-blue-700 text-xs font-bold mb-1">
              <span>Ingresos Brutos</span>
              <ArrowUpRight size={14} />
            </div>
            <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalIncome)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Plataformas de reparto</p>
          </div>

          <div 
            onClick={() => setActiveTab('expenses')}
            className="p-3 bg-rose-50/50 hover:bg-rose-50 rounded-xl border border-rose-100/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-rose-700 text-xs font-bold mb-1">
              <span>Gastos Deducibles</span>
              <ArrowDownRight size={14} />
            </div>
            <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Combustible, cuota y taller</p>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
              <span>Rendimiento Neto</span>
              <TrendingUp size={14} />
            </div>
            <p className="text-lg font-black text-emerald-600">{formatCurrency(summary.netProfit)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Base liquidable IRPF</p>
          </div>

          <div 
            onClick={() => setActiveTab('taxes')}
            className="p-3 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-100/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1">
              <span>Hucha IRPF (130)</span>
              <PiggyBank size={14} />
            </div>
            <p className="text-lg font-black text-amber-900">{formatCurrency(summary.estimatedIRPF)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">20% reservado AEAT</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-1 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Area */}
      <div className="transition-all duration-200">
        {activeTab === 'expenses' && (
          <ExpenseTracker startDate="" endDate="" />
        )}

        {activeTab === 'incomes' && (
          <IncomeTracker startDate="" endDate="" />
        )}

        {activeTab === 'taxes' && (
          <TaxDeclarationsViewer />
        )}

        {activeTab === 'docs' && (
          <Documents />
        )}

        {activeTab === 'payroll' && (
          <PayrollDashboard />
        )}

        {activeTab === 'banking' && (
          <BankingConnect />
        )}
      </div>

      {/* Gasoline Capture Modal */}
      <GasStationCaptureModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};
