import React, { useEffect, useMemo, useState } from 'react';
import {
  Building,
  FileText,
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
import { BankingConnect } from '../../banking-connect/BankingConnect';

type MoneyTab = 'expenses' | 'incomes' | 'taxes' | 'docs' | 'banking';

interface MoneyHubProps {
  initialTab?: MoneyTab;
  setView?: (view: string) => void;
}

export const MoneyHub: React.FC<MoneyHubProps> = ({ initialTab = 'expenses', setView }) => {
  const { currentUser, users, getFiscalSummary, privacyMode, incomes, expenses } = useData();
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<MoneyTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const summary = useMemo(() => {
    if (!currentUser) {
      return { totalIncome: 0, totalExpenses: 0, deductibleExpenses: 0, netProfit: 0, estimatedIRPF: 0, taxEstimateAvailable: false, quarter: '' };
    }

    if (!isManager) return getFiscalSummary(currentUser.id);

    const linkedIds = new Set(
      users
        .filter((user) => user.role === UserRole.RIDER && user.managerId === currentUser.id)
        .map((user) => user.id)
    );
    const scopedIncomes = incomes.filter((income) => linkedIds.has(income.userId));
    const scopedExpenses = expenses.filter((expense) => linkedIds.has(expense.userId));
    const totalIncome = scopedIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = scopedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const deductibleExpenses = scopedExpenses
      .filter((expense) => expense.status !== 'rejected')
      .reduce(
        (sum, expense) => sum + expense.amount * ((expense.deductiblePercentage ?? 0) / 100),
        0
      );
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      deductibleExpenses,
      netProfit,
      estimatedIRPF: 0,
      taxEstimateAvailable: false,
      quarter: ''
    };
  }, [isManager, currentUser, users, getFiscalSummary, incomes, expenses]);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });
  };

  const tabs = useMemo(() => {
    const base = [
      { id: 'expenses' as const, label: isManager ? 'Auditoría' : 'Gastos', icon: Receipt },
      { id: 'incomes' as const, label: 'Ingresos', icon: TrendingUp },
      { id: 'taxes' as const, label: 'Fiscal', icon: Scale },
      { id: 'docs' as const, label: 'Documentos', icon: FileText }
    ];
    return isManager ? base : [...base, { id: 'banking' as const, label: 'Banca', icon: Building }];
  }, [isManager]);

  useEffect(() => {
    if (isManager && activeTab === 'banking') setActiveTab('expenses');
  }, [isManager, activeTab]);

  return (
    <div id="money-hub-workspace" className="min-w-0 space-y-4 animate-in fade-in duration-200">
      <section className="labora-card overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="labora-kicker text-[var(--labora-primary-2)]">
              {isManager ? 'Cartera vinculada' : 'Actividad registrada'}
            </p>
            <h1 className="labora-display mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-[var(--labora-ink)] sm:text-[2.05rem]">
              {isManager ? 'Auditoría y fiscalidad' : 'Tu dinero, sin ruido'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              {isManager
                ? 'Ingresos, gastos reales, documentación y revisión fiscal de tus clientes vinculados.'
                : 'Registra movimientos, guarda justificantes y prepara la información que revisará tu gestoría.'}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)] lg:h-14 lg:w-14">
            <Wallet size={22} />
          </div>
        </div>

        <div className="labora-divider" />

        <div className="grid grid-cols-2 gap-px bg-[var(--labora-border)] sm:grid-cols-4">
          <MetricButton label="Ingresos" value={formatCurrency(summary.totalIncome)} onClick={() => setActiveTab('incomes')} />
          <MetricButton label="Gastos reales" value={formatCurrency(summary.totalExpenses)} onClick={() => setActiveTab('expenses')} accent="clay" />
          <MetricButton label="Neto operativo" value={formatCurrency(summary.netProfit)} onClick={() => setActiveTab('expenses')} accent="green" />
          <MetricButton
            label="Fiscal"
            value={summary.taxEstimateAvailable ? formatCurrency(summary.estimatedIRPF) : 'Por revisar'}
            onClick={() => setActiveTab('taxes')}
            accent="amber"
          />
        </div>
      </section>

      <nav className="labora-card overflow-x-auto p-1.5 custom-scrollbar">
        <div className="flex min-w-max items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[12px] px-3.5 text-xs font-extrabold transition ${
                  active
                    ? 'bg-[var(--labora-primary)] text-white shadow-sm'
                    : 'text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)] hover:text-[var(--labora-ink)]'
                }`}
              >
                <Icon size={14} strokeWidth={2.2} />
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
        {activeTab === 'banking' && !isManager && <BankingConnect />}
      </div>
    </div>
  );
};

const MetricButton = ({
  label,
  value,
  onClick,
  accent = 'neutral'
}: {
  label: string;
  value: string;
  onClick: () => void;
  accent?: 'neutral' | 'green' | 'clay' | 'amber';
}) => {
  const valueClass = accent === 'green'
    ? 'text-[var(--labora-primary)]'
    : accent === 'clay'
      ? 'text-[var(--labora-clay-deep)]'
      : accent === 'amber'
        ? 'text-[var(--labora-gold)]'
        : 'text-[var(--labora-ink)]';

  return (
    <button onClick={onClick} className="min-w-0 bg-[var(--labora-surface)] p-3.5 text-left transition hover:bg-[var(--labora-surface-2)] sm:p-4">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-stone-400">{label}</p>
      <p className={`mt-1 truncate text-base font-extrabold tracking-[-0.03em] sm:text-lg ${valueClass}`}>{value}</p>
    </button>
  );
};
