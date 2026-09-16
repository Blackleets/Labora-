import React, { useEffect, useMemo, useState } from 'react';
import {
  Building,
  FileText,
  PiggyBank,
  Receipt,
  Scale,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useCountry } from '../../../contexts/CountryContext';
import { UserRole } from '../../../types';
import ExpenseTracker from '../../../components/ExpenseTracker';
import IncomeTracker from '../../../components/IncomeTracker';
import { TaxOverview } from '../../../components/TaxOverview';
import Documents from '../../../components/Documents';
import { PayrollDashboard } from '../../payroll/components/PayrollDashboard';
import { BankingConnect } from '../../banking-connect/BankingConnect';

interface MoneyHubProps {
  initialTab?: 'expenses' | 'incomes' | 'taxes' | 'docs' | 'payroll' | 'banking';
  setView?: (view: string) => void;
}

export const MoneyHub: React.FC<MoneyHubProps> = ({ initialTab = 'expenses', setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, incomes, expenses } = useData();
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<'expenses' | 'incomes' | 'taxes' | 'docs' | 'payroll' | 'banking'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const summary = useMemo(() => {
    if (!isManager) return getFiscalSummary(currentUser?.id || 'u1');

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses
      .filter((expense) => expense.status !== 'rejected')
      .reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = Math.max(0, totalIncome - totalExpenses);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      estimatedIRPF: netProfit * 0.2,
      quarter: '3T 2026'
    };
  }, [isManager, currentUser, getFiscalSummary, incomes, expenses]);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  const tabs = [
    { id: 'expenses', label: isManager ? 'Auditoría' : 'Gastos', icon: Receipt },
    { id: 'incomes', label: 'Ingresos', icon: TrendingUp },
    { id: 'taxes', label: 'AEAT', icon: Scale },
    { id: 'docs', label: 'Documentos', icon: FileText },
    { id: 'payroll', label: 'Liquidaciones', icon: Wallet },
    { id: 'banking', label: 'Banca', icon: Building }
  ] as const;

  return (
    <div id="money-hub-workspace" className="space-y-4 min-w-0 animate-in fade-in duration-200">
      <section className="rounded-2xl border border-[#E5DED3] bg-white p-4 sm:p-5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2E5A44]">
              {isManager ? 'Gestoría · cartera' : '3T 2026'}
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {isManager ? 'Auditoría fiscal' : 'Dinero y fiscalidad'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-500 leading-relaxed max-w-2xl">
              {isManager
                ? 'Revisa tickets, ingresos y documentación de los riders sin perder el contexto fiscal.'
                : 'Controla ingresos, gastos y documentación desde un único lugar.'}
            </p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#EDF4EF] text-[#2E5A44] flex items-center justify-center">
            <Wallet size={19} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('incomes')}
            className="rounded-xl bg-[#FAF8F4] border border-[#EAE4DA] p-3 text-left min-w-0"
          >
            <p className="text-[10px] font-semibold text-stone-400">Ingresos</p>
            <p className="mt-1 text-base font-bold text-stone-900 truncate">{formatCurrency(summary.totalIncome)}</p>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className="rounded-xl bg-[#FAF8F4] border border-[#EAE4DA] p-3 text-left min-w-0"
          >
            <p className="text-[10px] font-semibold text-stone-400">Gastos</p>
            <p className="mt-1 text-base font-bold text-stone-900 truncate">{formatCurrency(summary.totalExpenses)}</p>
          </button>

          <div className="rounded-xl bg-[#F2F7F4] border border-[#DDE8E1] p-3 min-w-0">
            <p className="text-[10px] font-semibold text-[#5E7A69]">Neto</p>
            <p className="mt-1 text-base font-bold text-[#2E5A44] truncate">{formatCurrency(summary.netProfit)}</p>
          </div>

          <button
            onClick={() => setActiveTab('taxes')}
            className="rounded-xl bg-[#FFF8EC] border border-[#EEE0C4] p-3 text-left min-w-0"
          >
            <p className="text-[10px] font-semibold text-[#8A6B35]">Reserva IRPF</p>
            <p className="mt-1 text-base font-bold text-[#75551F] truncate">{formatCurrency(summary.estimatedIRPF)}</p>
          </button>
        </div>
      </section>

      <nav className="rounded-2xl border border-[#E5DED3] bg-white p-1.5 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#2E5A44] text-white'
                    : 'text-stone-500 hover:bg-[#F5F1EA] hover:text-stone-800'
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-w-0">
        {activeTab === 'expenses' && <ExpenseTracker startDate="" endDate="" />}
        {activeTab === 'incomes' && <IncomeTracker startDate="" endDate="" />}
        {activeTab === 'taxes' && <TaxOverview setView={setView} />}
        {activeTab === 'docs' && <Documents />}
        {activeTab === 'payroll' && <PayrollDashboard />}
        {activeTab === 'banking' && <BankingConnect />}
      </div>
    </div>
  );
};
