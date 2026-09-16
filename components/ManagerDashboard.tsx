import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { Expense, UserRole } from '../types';

interface ManagerDashboardProps {
  setView?: (view: string) => void;
}

type Tab = 'audit' | 'requirements' | 'taxes';

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ setView }) => {
  const {
    currentUser,
    users,
    incomes,
    expenses,
    requirements,
    updateExpenseAudit,
    addRequirement,
    calculateQuarterlyTaxes,
    showNotification
  } = useData();
  const { selectedCountry } = useCountry();

  const clients = useMemo(() => users.filter((user) => user.role === UserRole.RIDER), [users]);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('audit');
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [requirementTitle, setRequirementTitle] = useState('');
  const [requirementDescription, setRequirementDescription] = useState('');
  const [requirementDeadline, setRequirementDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];

  const filteredClients = clients.filter((client) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      (client.nif || '').toLowerCase().includes(term)
    );
  });

  const clientExpenses = expenses.filter((expense) => expense.userId === selectedClient?.id);
  const clientIncomes = incomes.filter((income) => income.userId === selectedClient?.id);
  const clientRequirements = requirements.filter((requirement) => requirement.riderId === selectedClient?.id);

  const totalIncome = clientIncomes.reduce((sum, income) => sum + income.amount, 0);
  const deductibleExpenses = clientExpenses
    .filter((expense) => expense.status !== 'rejected')
    .reduce((sum, expense) => sum + expense.amount * ((expense.deductiblePercentage ?? 100) / 100), 0);
  const net = Math.max(0, totalIncome - deductibleExpenses);
  const pendingAudit = clientExpenses.filter((expense) => expense.status === 'pending_review' || expense.status === 'needs_fix').length;
  const pendingRequirements = clientRequirements.filter((requirement) => requirement.status === 'pending').length;

  const globalPendingAudit = expenses.filter((expense) => expense.status === 'pending_review' || expense.status === 'needs_fix').length;
  const globalPendingRequirements = requirements.filter((requirement) => requirement.status === 'pending').length;

  const formatMoney = (amount: number) =>
    amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0
    });

  const getExpenseStatus = (expense: Expense) => {
    switch (expense.status) {
      case 'approved': return { label: 'Validado', className: 'bg-[#ECF7F0] text-[#24613F] border-[#CFE7D7]' };
      case 'rejected': return { label: 'No deducible', className: 'bg-[#FFF0EE] text-[#93443B] border-[#EBCFCB]' };
      case 'needs_fix': return { label: 'Corregir', className: 'bg-[#FFF3EA] text-[#A4562D] border-[#EDCFBB]' };
      default: return { label: 'Pendiente', className: 'bg-[#FFF8E8] text-[#855D1E] border-[#ECD9A8]' };
    }
  };

  const handleCreateRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClient || !requirementTitle.trim()) return;

    addRequirement({
      managerId: currentUser?.id || 'm1',
      managerName: currentUser?.companyName || currentUser?.name || 'Gestoría',
      riderId: selectedClient.id,
      riderName: selectedClient.name,
      title: requirementTitle.trim(),
      description: requirementDescription.trim(),
      category: 'other',
      deadline: requirementDeadline,
      status: 'pending',
      quarter: '3T 2026'
    });

    setRequirementTitle('');
    setRequirementDescription('');
    setShowRequirementModal(false);
  };

  const handleApproveExpense = (expense: Expense) => {
    updateExpenseAudit(expense.id, 'approved', 'Revisado por la gestoría.');
  };

  const handleRequestFix = (expense: Expense) => {
    updateExpenseAudit(expense.id, 'needs_fix', 'Revisa el justificante o completa la información del gasto.');
    showNotification('info', 'El gasto se ha marcado para corrección.');
  };

  const taxModels = selectedClient
    ? calculateQuarterlyTaxes(selectedClient.id, '3T 2026')
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Gestoría</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">Resumen</h1>
          <p className="mt-1 text-sm text-stone-500">
            {currentUser?.companyName || currentUser?.name || 'Gestión de clientes'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView?.('messages')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DED7CC] bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F8F5F0]"
          >
            <MessageSquare size={15} /> Mensajes
          </button>
          <button
            onClick={() => setShowRequirementModal(true)}
            disabled={!selectedClient}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2E5A44] px-3 py-2 text-xs font-semibold text-white hover:bg-[#244936] disabled:opacity-50"
          >
            <Plus size={15} /> Nueva petición
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Clientes" value={String(clients.length)} icon={Users} />
        <Metric label="Gastos por revisar" value={String(globalPendingAudit)} icon={Wallet} />
        <Metric label="Peticiones pendientes" value={String(globalPendingRequirements)} icon={Bell} />
        <Metric label="Cliente activo" value={selectedClient?.name || '—'} icon={FileText} compact />
      </section>

      <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#E3DCD2] bg-white p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-stone-900">Clientes</h2>
            <span className="text-[11px] text-stone-400">{clients.length}</span>
          </div>

          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente"
              className="w-full rounded-xl border border-[#E2DBD1] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#9BB3A4]"
            />
          </div>

          <div className="space-y-1.5 lg:max-h-[560px] lg:overflow-y-auto">
            {filteredClients.map((client) => {
              const clientPending = expenses.filter(
                (expense) => expense.userId === client.id && (expense.status === 'pending_review' || expense.status === 'needs_fix')
              ).length;
              const active = client.id === selectedClient?.id;

              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    active ? 'bg-[#EAF2ED]' : 'hover:bg-[#F7F4EF]'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    active ? 'bg-[#2E5A44] text-white' : 'bg-[#F0ECE6] text-stone-500'
                  }`}>
                    {client.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-stone-900">{client.name}</p>
                    <p className="truncate text-[10px] text-stone-500">{client.nif || client.email}</p>
                  </div>
                  {clientPending > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C96846] px-1 text-[10px] font-bold text-white">
                      {clientPending}
                    </span>
                  ) : (
                    <ChevronRight size={15} className="text-stone-300" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {selectedClient ? (
            <>
              <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-stone-900">{selectedClient.name}</h2>
                    <p className="mt-1 text-xs text-stone-500">
                      {selectedClient.nif || 'Sin NIF'} · {selectedClient.email}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {selectedClient.platforms.length ? selectedClient.platforms.join(' · ') : 'Sin plataformas vinculadas'}
                    </p>
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    <span className="rounded-full bg-[#F3F0EA] px-2.5 py-1 font-semibold text-stone-600">
                      {pendingAudit} por revisar
                    </span>
                    <span className="rounded-full bg-[#F3F0EA] px-2.5 py-1 font-semibold text-stone-600">
                      {pendingRequirements} peticiones
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  <SummaryBox label="Ingresos" value={formatMoney(totalIncome)} />
                  <SummaryBox label="Gastos" value={formatMoney(deductibleExpenses)} />
                  <SummaryBox label="Neto" value={formatMoney(net)} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E3DCD2] bg-white overflow-hidden">
                <div className="flex gap-1 border-b border-[#ECE5DB] p-2 overflow-x-auto">
                  <TabButton active={tab === 'audit'} onClick={() => setTab('audit')}>Auditoría</TabButton>
                  <TabButton active={tab === 'requirements'} onClick={() => setTab('requirements')}>Peticiones</TabButton>
                  <TabButton active={tab === 'taxes'} onClick={() => setTab('taxes')}>Modelos</TabButton>
                </div>

                {tab === 'audit' && (
                  <div className="divide-y divide-[#EEE8DF]">
                    {clientExpenses.length === 0 ? (
                      <EmptyState text="No hay gastos registrados para este cliente." />
                    ) : (
                      clientExpenses.map((expense) => {
                        const status = getExpenseStatus(expense);
                        return (
                          <div key={expense.id} className="p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold text-stone-900">{expense.category}</p>
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-stone-500">
                                  {expense.date} · {expense.merchant || 'Sin proveedor'}
                                </p>
                                {expense.notes && <p className="mt-1 line-clamp-2 text-xs text-stone-400">{expense.notes}</p>}
                              </div>

                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <p className="text-sm font-bold text-stone-900">{formatMoney(expense.amount)}</p>
                                {expense.status !== 'approved' && (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleRequestFix(expense)}
                                      className="rounded-lg border border-[#E4D8CF] px-2.5 py-1.5 text-[10px] font-semibold text-[#9A5637] hover:bg-[#FFF6F0]"
                                    >
                                      Corregir
                                    </button>
                                    <button
                                      onClick={() => handleApproveExpense(expense)}
                                      className="rounded-lg bg-[#2E5A44] px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#244936]"
                                    >
                                      Validar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {tab === 'requirements' && (
                  <div className="divide-y divide-[#EEE8DF]">
                    {clientRequirements.length === 0 ? (
                      <EmptyState text="No hay peticiones para este cliente." />
                    ) : (
                      clientRequirements.map((requirement) => (
                        <div key={requirement.id} className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-stone-900">{requirement.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-stone-500">{requirement.description}</p>
                              <p className="mt-2 text-[11px] text-stone-400">Fecha límite: {requirement.deadline}</p>
                            </div>
                            <RequirementStatus status={requirement.status} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === 'taxes' && taxModels && (
                  <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                    <TaxCard code="130" title="Pago fraccionado IRPF" amount={formatMoney(taxModels.model130.taxAmount)} />
                    <TaxCard code="303" title="Autoliquidación IVA" amount={formatMoney(taxModels.model303.taxAmount)} />
                    <p className="sm:col-span-2 text-[11px] leading-relaxed text-stone-400">
                      Importes calculados con la información registrada en Labora+. Deben revisarse antes de cualquier presentación oficial.
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-[#E3DCD2] bg-white p-8 text-center text-sm text-stone-500">
              No hay clientes registrados.
            </section>
          )}
        </div>
      </section>

      {showRequirementModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-[#E3DCD2] bg-[#FCFAF7] shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-[#ECE5DB] px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">Nueva petición</h3>
                <p className="text-xs text-stone-500">Para {selectedClient.name}</p>
              </div>
              <button
                onClick={() => setShowRequirementModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-[#F0ECE6]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-600">Título</label>
                <input
                  value={requirementTitle}
                  onChange={(event) => setRequirementTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8BA393]"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-600">Descripción</label>
                <textarea
                  value={requirementDescription}
                  onChange={(event) => setRequirementDescription(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8BA393]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-600">Fecha límite</label>
                <input
                  type="date"
                  value={requirementDeadline}
                  onChange={(event) => setRequirementDeadline(event.target.value)}
                  className="w-full rounded-xl border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8BA393]"
                />
              </div>
              <button type="submit" className="w-full rounded-xl bg-[#2E5A44] py-3 text-sm font-bold text-white hover:bg-[#244936]">
                Enviar petición
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, icon: Icon, compact = false }: { label: string; value: string; icon: React.ComponentType<{ size?: number }>; compact?: boolean }) => (
  <div className="rounded-2xl border border-[#E3DCD2] bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-semibold text-stone-500">{label}</p>
      <Icon size={15} className="text-stone-400" />
    </div>
    <p className={`mt-2 font-bold text-stone-900 ${compact ? 'truncate text-sm' : 'text-xl'}`}>{value}</p>
  </div>
);

const SummaryBox = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0 rounded-xl bg-[#F7F4EF] p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
    <p className="mt-1 truncate text-sm font-bold text-stone-900">{value}</p>
  </div>
);

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
      active ? 'bg-[#EAF2ED] text-[#245338]' : 'text-stone-500 hover:bg-[#F5F2ED] hover:text-stone-800'
    }`}
  >
    {children}
  </button>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="p-8 text-center text-xs text-stone-400">{text}</div>
);

const RequirementStatus = ({ status }: { status: 'pending' | 'submitted' | 'approved' }) => {
  const meta = status === 'approved'
    ? { label: 'Resuelta', icon: CheckCircle2, className: 'bg-[#ECF7F0] text-[#24613F]' }
    : status === 'submitted'
      ? { label: 'En revisión', icon: Clock, className: 'bg-[#EEF3F7] text-[#3E6177]' }
      : { label: 'Pendiente', icon: Bell, className: 'bg-[#FFF8E8] text-[#855D1E]' };
  const Icon = meta.icon;

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${meta.className}`}>
      <Icon size={11} /> {meta.label}
    </span>
  );
};

const TaxCard = ({ code, title, amount }: { code: string; title: string; amount: string }) => (
  <div className="rounded-xl border border-[#E6DFD5] bg-[#FAF8F4] p-4">
    <p className="text-[10px] font-bold uppercase tracking-wide text-[#2E5A44]">Modelo {code}</p>
    <p className="mt-1 text-sm font-bold text-stone-900">{title}</p>
    <p className="mt-3 text-lg font-bold text-stone-900">{amount}</p>
  </div>
);
