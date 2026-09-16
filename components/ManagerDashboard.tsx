import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
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

const currentQuarterLabel = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

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

  const clients = useMemo(
    () => users.filter((user) => user.role === UserRole.RIDER && user.managerId === currentUser?.id),
    [users, currentUser?.id]
  );
  const clientIds = useMemo(() => new Set(clients.map((client) => client.id)), [clients]);
  const quarter = currentQuarterLabel();

  const [selectedClientId, setSelectedClientId] = useState('');
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
    return client.name.toLowerCase().includes(term)
      || client.email.toLowerCase().includes(term)
      || (client.nif || '').toLowerCase().includes(term);
  });

  const linkedExpenses = expenses.filter((expense) => clientIds.has(expense.userId));
  const linkedRequirements = requirements.filter(
    (requirement) => requirement.managerId === currentUser?.id && clientIds.has(requirement.riderId)
  );
  const clientExpenses = linkedExpenses.filter((expense) => expense.userId === selectedClient?.id);
  const clientIncomes = incomes.filter(
    (income) => income.userId === selectedClient?.id && clientIds.has(income.userId)
  );
  const clientRequirements = linkedRequirements.filter(
    (requirement) => requirement.riderId === selectedClient?.id
  );

  const totalIncome = clientIncomes.reduce((sum, income) => sum + income.amount, 0);
  const deductibleExpenses = clientExpenses
    .filter((expense) => expense.status !== 'rejected')
    .reduce((sum, expense) => sum + expense.amount * ((expense.deductiblePercentage ?? 0) / 100), 0);
  const net = Math.max(0, totalIncome - deductibleExpenses);
  const pendingAudit = clientExpenses.filter(
    (expense) => expense.status === 'pending_review' || expense.status === 'needs_fix'
  ).length;
  const pendingRequirements = clientRequirements.filter((requirement) => requirement.status === 'pending').length;
  const globalPendingAudit = linkedExpenses.filter(
    (expense) => expense.status === 'pending_review' || expense.status === 'needs_fix'
  ).length;
  const globalPendingRequirements = linkedRequirements.filter(
    (requirement) => requirement.status === 'pending'
  ).length;

  const formatMoney = (amount: number) => amount.toLocaleString('es-ES', {
    style: 'currency',
    currency: selectedCountry.currency || 'EUR',
    maximumFractionDigits: 0
  });

  const getExpenseStatus = (expense: Expense) => {
    switch (expense.status) {
      case 'approved':
        return { label: 'Validado', className: 'bg-[#ECF7F0] text-[#24613F] border-[#CFE7D7]' };
      case 'rejected':
        return { label: 'No deducible', className: 'bg-[#FFF0EE] text-[#93443B] border-[#EBCFCB]' };
      case 'needs_fix':
        return { label: 'Corregir', className: 'bg-[#FFF3EA] text-[#A4562D] border-[#EDCFBB]' };
      default:
        return { label: 'Pendiente', className: 'bg-[#FFF8E8] text-[#855D1E] border-[#ECD9A8]' };
    }
  };

  const handleCreateRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClient || !requirementTitle.trim() || !currentUser) return;

    addRequirement({
      managerId: currentUser.id,
      managerName: currentUser.companyName || currentUser.name,
      riderId: selectedClient.id,
      riderName: selectedClient.name,
      title: requirementTitle.trim(),
      description: requirementDescription.trim(),
      category: 'other',
      deadline: requirementDeadline,
      status: 'pending',
      quarter
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

  const taxModels = selectedClient ? calculateQuarterlyTaxes(selectedClient.id, quarter) : null;
  const managerName = currentUser?.companyName || currentUser?.name || 'Gestoría';

  return (
    <div id="manager-dashboard" className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="labora-hero p-5 sm:p-7">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <span className="labora-chip labora-kicker text-[#EAF4EE]">Gestoría · {quarter}</span>
            <p className="mt-5 text-sm font-semibold text-white/70">{managerName}</p>
            <h1 className="labora-display mt-1 max-w-2xl text-[2rem] font-semibold leading-[1.04] text-white sm:text-[2.55rem]">
              Toda tu cartera, sin perder el contexto.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 sm:text-[15px]">
              Clientes, gastos por revisar, peticiones y modelos en una sola vista, separados por relación real con tu gestoría.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setView?.('messages')}
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/18 bg-white/10 px-3.5 py-2.5 text-xs font-extrabold text-white backdrop-blur transition hover:bg-white/15"
              >
                <MessageSquare size={15} /> Mensajes
              </button>
              <button
                onClick={() => setShowRequirementModal(true)}
                disabled={!selectedClient}
                className="inline-flex items-center gap-2 rounded-[14px] bg-[#FFFDF9] px-3.5 py-2.5 text-xs font-extrabold text-[#214E3A] transition hover:bg-white disabled:opacity-50"
              >
                <Plus size={15} /> Nueva petición
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <HeroStat label="Clientes" value={String(clients.length)} />
            <HeroStat label="Por revisar" value={String(globalPendingAudit)} accent />
            <HeroStat label="Peticiones" value={String(globalPendingRequirements)} />
            <HeroStat label="Cliente activo" value={selectedClient ? '1' : '0'} />
          </div>
        </div>
      </section>

      {clients.length === 0 ? (
        <section className="labora-card border-dashed px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#E7F0EA] text-[#214E3A]">
            <Users size={24} />
          </div>
          <h2 className="mt-4 text-base font-extrabold text-[#1E231F]">Aún no tienes clientes vinculados</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
            Comparte el correo de esta gestoría. El autónomo puede vincularte desde Perfil y ajustes.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="labora-card self-start p-3 lg:sticky lg:top-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="labora-kicker text-stone-400">Cartera</p>
                <h2 className="mt-0.5 text-sm font-extrabold text-[#1E231F]">Clientes</h2>
              </div>
              <span className="rounded-full bg-[#F1ECE3] px-2 py-1 text-[10px] font-bold text-stone-500">{clients.length}</span>
            </div>

            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente"
                className="w-full rounded-[13px] border border-[#E2DBD1] bg-[#F8F5F0] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#789582]"
              />
            </div>

            <div className="space-y-1.5 lg:max-h-[560px] lg:overflow-y-auto">
              {filteredClients.map((client) => {
                const clientPending = linkedExpenses.filter(
                  (expense) => expense.userId === client.id
                    && (expense.status === 'pending_review' || expense.status === 'needs_fix')
                ).length;
                const active = client.id === selectedClient?.id;

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`flex w-full items-center gap-3 rounded-[14px] p-3 text-left transition ${
                      active
                        ? 'bg-[#E7F0EA] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.07)]'
                        : 'hover:bg-[#F7F4EF]'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-extrabold ${active ? 'bg-[#214E3A] text-white' : 'bg-[#F0ECE6] text-stone-500'}`}>
                      {client.photoUrl
                        ? <img src={client.photoUrl} alt="" className="h-full w-full object-cover" />
                        : client.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#1E231F]">{client.name}</p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-stone-500">{client.nif || client.email}</p>
                    </div>
                    {clientPending > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D66C47] px-1 text-[10px] font-extrabold text-white">
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
            {selectedClient && (
              <>
                <section className="labora-card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E7F0EA] text-sm font-extrabold text-[#214E3A]">
                        {selectedClient.photoUrl
                          ? <img src={selectedClient.photoUrl} alt="" className="h-full w-full object-cover" />
                          : selectedClient.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="labora-kicker text-stone-400">Cliente activo</p>
                        <h2 className="mt-0.5 truncate text-lg font-extrabold tracking-[-0.02em] text-[#1E231F]">{selectedClient.name}</h2>
                        <p className="mt-1 truncate text-xs text-stone-500">{selectedClient.nif || 'Sin NIF'} · {selectedClient.email}</p>
                        <p className="mt-1 text-xs text-stone-400">
                          {selectedClient.platforms.length ? selectedClient.platforms.join(' · ') : 'Sin plataformas registradas'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      <span className="rounded-full bg-[#FFF3E8] px-2.5 py-1 text-[#9B5C2C]">{pendingAudit} por revisar</span>
                      <span className="rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[#2A5A43]">{pendingRequirements} peticiones</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <SummaryBox label="Ingresos" value={formatMoney(totalIncome)} />
                    <SummaryBox label="Gastos validados" value={formatMoney(deductibleExpenses)} />
                    <SummaryBox label="Neto" value={formatMoney(net)} emphasis />
                  </div>
                </section>

                <section className="labora-card overflow-hidden">
                  <div className="flex gap-1 overflow-x-auto border-b border-[#ECE5DB] p-2">
                    <TabButton active={tab === 'audit'} onClick={() => setTab('audit')}>Auditoría</TabButton>
                    <TabButton active={tab === 'requirements'} onClick={() => setTab('requirements')}>Peticiones</TabButton>
                    <TabButton active={tab === 'taxes'} onClick={() => setTab('taxes')}>Modelos</TabButton>
                  </div>

                  {tab === 'audit' && (
                    <div className="divide-y divide-[#EEE8DF]">
                      {clientExpenses.length === 0 ? (
                        <EmptyState text="No hay gastos registrados para este cliente." />
                      ) : clientExpenses.map((expense) => {
                        const status = getExpenseStatus(expense);
                        return (
                          <div key={expense.id} className="p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-extrabold text-[#1E231F]">{expense.category}</p>
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>{status.label}</span>
                                </div>
                                <p className="mt-1 text-xs text-stone-500">{expense.date} · {expense.merchant || 'Sin proveedor'}</p>
                                {expense.notes && <p className="mt-1 line-clamp-2 text-xs text-stone-400">{expense.notes}</p>}
                              </div>

                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <p className="text-sm font-extrabold text-[#1E231F]">{formatMoney(expense.amount)}</p>
                                {expense.status !== 'approved' && (
                                  <div className="flex gap-1.5">
                                    <button onClick={() => handleRequestFix(expense)} className="rounded-[10px] border border-[#E4D8CF] px-2.5 py-1.5 text-[10px] font-bold text-[#9A5637] hover:bg-[#FFF6F0]">Corregir</button>
                                    <button onClick={() => handleApproveExpense(expense)} className="rounded-[10px] bg-[#214E3A] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#183D2D]">Validar</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tab === 'requirements' && (
                    <div className="divide-y divide-[#EEE8DF]">
                      {clientRequirements.length === 0 ? (
                        <EmptyState text="No hay peticiones para este cliente." />
                      ) : clientRequirements.map((requirement) => (
                        <div key={requirement.id} className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#1E231F]">{requirement.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-stone-500">{requirement.description}</p>
                              <p className="mt-2 text-[11px] text-stone-400">Fecha límite: {requirement.deadline}</p>
                            </div>
                            <RequirementStatus status={requirement.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tab === 'taxes' && (
                    <div className="p-4 sm:p-5">
                      {taxModels ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TaxCard title="Modelo 130" amount={formatMoney(taxModels.model130.taxAmount)} status={taxModels.model130.status} />
                          <TaxCard title="Modelo 303" amount={formatMoney(taxModels.model303.taxAmount)} status={taxModels.model303.status} />
                        </div>
                      ) : (
                        <EmptyState text="No hay cálculo fiscal disponible." />
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </section>
      )}

      {showRequirementModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18211C]/50 p-4 backdrop-blur-sm" onClick={() => setShowRequirementModal(false)}>
          <form
            onSubmit={handleCreateRequirement}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[24px] border border-[#E6DDD2] bg-[#FFFDF9] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="labora-kicker text-stone-400">Nueva petición</p>
                <h2 className="mt-1 text-lg font-extrabold text-[#1E231F]">{selectedClient.name}</h2>
              </div>
              <button type="button" onClick={() => setShowRequirementModal(false)} className="rounded-xl p-1.5 text-stone-400 hover:bg-[#F3EFE8]">
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input value={requirementTitle} onChange={(event) => setRequirementTitle(event.target.value)} placeholder="Título" className="w-full rounded-[13px] border border-[#DDD5CA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#789582]" required />
              <textarea value={requirementDescription} onChange={(event) => setRequirementDescription(event.target.value)} placeholder="Qué necesitas del cliente" rows={4} className="w-full resize-none rounded-[13px] border border-[#DDD5CA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#789582]" />
              <div>
                <label className="mb-1 block text-[11px] font-bold text-stone-500">Fecha límite</label>
                <input type="date" value={requirementDeadline} onChange={(event) => setRequirementDeadline(event.target.value)} className="w-full rounded-[13px] border border-[#DDD5CA] bg-white px-3 py-2.5 text-sm outline-none" />
              </div>
            </div>

            <button type="submit" className="mt-4 w-full rounded-[13px] bg-[#214E3A] py-2.5 text-sm font-extrabold text-white hover:bg-[#183D2D]">
              Enviar petición
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const HeroStat = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-[18px] border p-3.5 backdrop-blur ${accent ? 'border-[#F1C56B]/30 bg-[#F1C56B]/12' : 'border-white/14 bg-white/8'}`}>
    <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-white/55">{label}</p>
    <p className={`mt-1 text-xl font-extrabold tracking-[-0.03em] ${accent ? 'text-[#FFE4A5]' : 'text-white'}`}>{value}</p>
  </div>
);

const SummaryBox = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
  <div className={`rounded-[14px] border p-3 ${emphasis ? 'border-[#CFE0D5] bg-[#EAF2ED]' : 'border-[#E8E0D5] bg-[#F8F5F0]'}`}>
    <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-stone-400">{label}</p>
    <p className={`mt-1 truncate text-sm font-extrabold ${emphasis ? 'text-[#214E3A]' : 'text-[#1E231F]'}`}>{value}</p>
  </div>
);

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap rounded-[11px] px-3 py-2 text-xs font-bold transition ${active ? 'bg-[#214E3A] text-white shadow-sm' : 'text-stone-500 hover:bg-[#F5F2ED]'}`}
  >
    {children}
  </button>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="p-8 text-center text-xs font-medium text-stone-400">{text}</div>
);

const RequirementStatus = ({ status }: { status: string }) => {
  const map: Record<string, string> = { pending: 'Pendiente', submitted: 'En revisión', approved: 'Resuelto' };
  return (
    <span className="shrink-0 rounded-full bg-[#F3F0EA] px-2.5 py-1 text-[10px] font-bold text-stone-600">
      {map[status] || status}
    </span>
  );
};

const TaxCard = ({ title, amount, status }: { title: string; amount: string; status: string }) => (
  <div className="rounded-[16px] border border-[#E7E0D6] bg-[#FAF8F4] p-4">
    <div className="flex items-center justify-between">
      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#E7F0EA] text-[#214E3A]">
        <FileText size={16} />
      </div>
      <span className="text-[10px] font-semibold text-stone-400">{status}</span>
    </div>
    <p className="mt-3 text-sm font-extrabold text-[#1E231F]">{title}</p>
    <p className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-[#1E231F]">{amount}</p>
  </div>
);
