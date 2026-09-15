import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bike,
  Building2,
  CheckCircle2,
  FileText,
  Receipt,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Expense, User, UserRole } from '../types';
import { buildFiscalSnapshot } from '../services/fiscalEngine';

interface ManagerDashboardProps {
  setView?: (view: string) => void;
}

const money = (value: number) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
}).format(value);

const currentQuarterLabel = () => {
  const now = new Date();
  const quarter = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  return `${quarter}T ${now.getFullYear()}`;
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
    showNotification,
  } = useData();

  const clients = useMemo(() => users.filter((user) => user.role === UserRole.RIDER), [users]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [search, setSearch] = useState('');
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [requirementTitle, setRequirementTitle] = useState('');
  const [requirementDescription, setRequirementDescription] = useState('');
  const [requirementCategory, setRequirementCategory] = useState<'fuel_receipt' | 'platform_invoice' | 'social_security' | 'vat_correction' | 'other'>('other');
  const [requirementDeadline, setRequirementDeadline] = useState('');

  useEffect(() => {
    if (!selectedClientId && clients.length > 0) setSelectedClientId(clients[0].id);
    if (selectedClientId && !clients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(clients[0]?.id || '');
    }
  }, [clients, selectedClientId]);

  const selectedClient = clients.find((client) => client.id === selectedClientId) || null;
  const period = currentQuarterLabel();

  const snapshot = useMemo(() => {
    if (!selectedClient) return null;
    return buildFiscalSnapshot(incomes, expenses, selectedClient.id, period);
  }, [expenses, incomes, period, selectedClient]);

  const clientExpenses = useMemo(
    () => expenses.filter((expense) => expense.userId === selectedClient?.id),
    [expenses, selectedClient],
  );

  const clientRequirements = useMemo(
    () => requirements.filter((requirement) => requirement.riderId === selectedClient?.id),
    [requirements, selectedClient],
  );

  const filteredClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [client.name, client.email, client.nif, ...client.platforms]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const pendingExpenses = clientExpenses.filter((expense) => !expense.status || expense.status === 'pending_review');
  const openRequirements = clientRequirements.filter((requirement) => requirement.status === 'pending');

  const createRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClient || !currentUser || !requirementTitle.trim()) return;

    addRequirement({
      managerId: currentUser.id,
      managerName: currentUser.companyName || currentUser.name,
      riderId: selectedClient.id,
      riderName: selectedClient.name,
      title: requirementTitle.trim(),
      description: requirementDescription.trim(),
      category: requirementCategory,
      deadline: requirementDeadline,
      status: 'pending',
      quarter: period,
    });

    setRequirementTitle('');
    setRequirementDescription('');
    setRequirementDeadline('');
    setRequirementCategory('other');
    setShowRequirementForm(false);
  };

  const reviewExpense = (expense: Expense, status: 'approved' | 'rejected' | 'needs_fix') => {
    const notes = status === 'approved'
      ? 'Comprobante revisado por el gestor. La deducibilidad definitiva depende de la clasificación fiscal registrada.'
      : status === 'rejected'
        ? 'Comprobante rechazado por el gestor. Revisa el motivo y la documentación aportada.'
        : 'El gestor solicita corregir o completar la evidencia antes de validar este gasto.';
    updateExpenseAudit(expense.id, status, notes);
  };

  const exportReviewSummary = (client: User) => {
    if (!snapshot) return;
    const rows = [
      'LABORA+ — RESUMEN DE TRABAJO PARA REVISIÓN',
      'NO ES UN MODELO AEAT NI UN JUSTIFICANTE DE PRESENTACIÓN',
      '',
      `Cliente: ${client.name}`,
      `Periodo: ${period}`,
      `Ingresos registrados: ${money(snapshot.quarter.grossIncome)}`,
      `Gastos aprobados deducibles registrados: ${money(snapshot.quarter.approvedDeductibleExpenses)}`,
      `Gastos pendientes de revisión: ${snapshot.quarter.pendingExpenseCount}`,
      `Peticiones abiertas: ${openRequirements.length}`,
      '',
      'Avisos de calidad:',
      ...snapshot.dataQuality.warnings.map((warning) => `- ${warning}`),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Labora_Revision_${client.name.replace(/\s+/g, '_')}_${period.replace(' ', '_')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Resumen de revisión exportado como borrador interno.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <section className="overflow-hidden rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-[#48735E] bg-[#2F5241] px-3 py-1 text-xs font-semibold text-[#D8EADB]">
                <Building2 className="h-3.5 w-3.5" /> Espacio de gestoría
              </span>
              {currentUser?.collegiateNumber && (
                <span className="rounded-full border border-[#FDE3B8] bg-[#FEF7EB] px-3 py-1 text-xs font-semibold text-[#85531B]">
                  Nº profesional: {currentUser.collegiateNumber}
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">
              {currentUser?.companyName || currentUser?.name || 'Labora+ Gestoría'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D3E3D8]">
              Revisa evidencias, detecta lo que falta y pide al autónomo exactamente el documento que necesitas. Labora+ no presenta impuestos ni valida deducciones automáticamente.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricDark label="Clientes vinculados" value={String(clients.length)} />
            <MetricDark label="Pendientes totales" value={String(expenses.filter((expense) => !expense.status || expense.status === 'pending_review').length)} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-4 shadow-sm">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente…"
              className="w-full rounded-xl border border-[#DFD5C6] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2E5A44]"
            />
          </div>

          <div className="space-y-2">
            {filteredClients.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#DFD5C6] p-5 text-center text-xs text-stone-500">
                No hay autónomos vinculados todavía.
              </div>
            )}
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full rounded-2xl border p-3 text-left transition-colors ${selectedClientId === client.id ? 'border-[#94B5A1] bg-[#EDF4EF]' : 'border-[#E8DFC8] bg-white hover:bg-[#F7F3EC]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2E5A44] text-white"><Bike className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-sm font-bold text-stone-900">{client.name}</p>
                    <p className="truncate text-[11px] text-stone-500">{client.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          {!selectedClient || !snapshot ? (
            <section className="rounded-3xl border border-dashed border-[#DFD5C6] bg-[#FCFAF7] p-10 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-[#2E5A44]" />
              <h2 className="mt-3 font-serif text-lg font-bold">Sin cliente seleccionado</h2>
              <p className="mt-1 text-sm text-stone-500">Cuando un autónomo acepte el vínculo con tu gestoría aparecerá aquí.</p>
            </section>
          ) : (
            <>
              <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#2E5A44]">Cliente vinculado · {period}</p>
                    <h2 className="mt-1 font-serif text-xl font-bold text-stone-900">{selectedClient.name}</h2>
                    <p className="mt-1 text-xs text-stone-500">{[selectedClient.nif, selectedClient.platforms.join(' · ')].filter(Boolean).join(' · ') || 'Perfil pendiente de completar'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowRequirementForm(true)} className="flex items-center gap-2 rounded-xl bg-[#2E5A44] px-3.5 py-2 text-xs font-semibold text-white"><Bell className="h-4 w-4" /> Pedir documento</button>
                    <button onClick={() => exportReviewSummary(selectedClient)} className="flex items-center gap-2 rounded-xl border border-[#DFD5C6] bg-white px-3.5 py-2 text-xs font-semibold text-stone-700"><FileText className="h-4 w-4" /> Exportar borrador</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Ingresos registrados" value={money(snapshot.quarter.grossIncome)} />
                  <Metric label="Deducible aprobado" value={money(snapshot.quarter.approvedDeductibleExpenses)} />
                  <Metric label="Tickets pendientes" value={String(pendingExpenses.length)} warning={pendingExpenses.length > 0} />
                  <Metric label="Peticiones abiertas" value={String(openRequirements.length)} warning={openRequirements.length > 0} />
                </div>
              </section>

              <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-serif text-base font-bold text-stone-900"><Receipt className="h-5 w-5 text-[#C96846]" /> Evidencias de gasto</h3>
                    <p className="mt-1 text-xs text-stone-500">Valida únicamente lo que puedas comprobar en la evidencia aportada.</p>
                  </div>
                  <span className="rounded-full bg-[#F7F3EC] px-2.5 py-1 text-[11px] font-semibold text-stone-600">{clientExpenses.length} registros</span>
                </div>

                <div className="space-y-3">
                  {clientExpenses.length === 0 && <Empty text="Este cliente todavía no ha registrado gastos." />}
                  {clientExpenses.map((expense) => (
                    <div key={expense.id} className="rounded-2xl border border-[#E8DFC8] bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-stone-900">{expense.merchant || expense.category}</p>
                            <Status status={expense.status || 'pending_review'} />
                          </div>
                          <p className="mt-1 text-xs text-stone-500">{expense.date} · {expense.category} · {money(expense.amount)}</p>
                          {expense.receiptUrl ? <p className="mt-1 text-[11px] font-semibold text-[#2E5A44]">Evidencia adjunta</p> : <p className="mt-1 text-[11px] font-semibold text-red-600">Sin evidencia adjunta</p>}
                          {expense.gestorNotes && <p className="mt-2 rounded-xl bg-[#F7F3EC] px-3 py-2 text-xs text-stone-600">{expense.gestorNotes}</p>}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button onClick={() => reviewExpense(expense, 'approved')} disabled={!expense.receiptUrl} className="flex items-center gap-1.5 rounded-xl bg-[#EAF4ED] px-3 py-2 text-xs font-semibold text-[#2E5A44] disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="h-4 w-4" /> Revisado</button>
                          <button onClick={() => reviewExpense(expense, 'needs_fix')} className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" /> Falta algo</button>
                          <button onClick={() => reviewExpense(expense, 'rejected')} className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><XCircle className="h-4 w-4" /> Rechazar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
                <h3 className="font-serif text-base font-bold text-stone-900">Lo que falta para cerrar el trimestre</h3>
                <div className="mt-3 space-y-2">
                  {snapshot.dataQuality.warnings.map((warning) => <div key={warning} className="flex gap-2 rounded-xl bg-[#F7F3EC] px-3 py-2.5 text-xs text-stone-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C96846]" />{warning}</div>)}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {showRequirementForm && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={createRequirement} className="w-full max-w-lg space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-2xl">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2E5A44]">Petición para {selectedClient.name}</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-stone-900">¿Qué necesitas que te envíe?</h3>
            </div>
            <label className="block text-xs font-semibold text-stone-700">Título<input required value={requirementTitle} onChange={(event) => setRequirementTitle(event.target.value)} placeholder="Ej. Factura semanal de Uber Eats" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label>
            <label className="block text-xs font-semibold text-stone-700">Explicación sencilla<textarea value={requirementDescription} onChange={(event) => setRequirementDescription(event.target.value)} placeholder="Explica qué documento necesitas y dónde suele encontrarlo." rows={3} className="mt-1 w-full resize-none rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-stone-700">Tipo<select value={requirementCategory} onChange={(event) => setRequirementCategory(event.target.value as typeof requirementCategory)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5"><option value="platform_invoice">Factura de plataforma</option><option value="fuel_receipt">Ticket de combustible</option><option value="social_security">Seguridad Social</option><option value="vat_correction">Corrección IVA</option><option value="other">Otro</option></select></label>
              <label className="text-xs font-semibold text-stone-700">Fecha límite<input type="date" value={requirementDeadline} onChange={(event) => setRequirementDeadline(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5" /></label>
            </div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowRequirementForm(false)} className="rounded-xl px-4 py-2 text-sm text-stone-600">Cancelar</button><button type="submit" className="rounded-xl bg-[#2E5A44] px-4 py-2 text-sm font-semibold text-white">Enviar petición</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

const MetricDark: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="min-w-[112px] rounded-2xl border border-[#416854] bg-[#2D4E3E] p-3.5 text-center"><p className="text-[10px] font-bold uppercase text-[#A8C8B4]">{label}</p><p className="mt-1 font-serif text-xl font-bold text-white">{value}</p></div>;
const Metric: React.FC<{ label: string; value: string; warning?: boolean }> = ({ label, value, warning }) => <div className={`rounded-2xl border p-4 ${warning ? 'border-amber-200 bg-amber-50' : 'border-[#E8DFC8] bg-white'}`}><p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 font-serif text-xl font-bold text-stone-900">{value}</p></div>;
const Empty: React.FC<{ text: string }> = ({ text }) => <div className="rounded-2xl border border-dashed border-[#DFD5C6] p-6 text-center text-xs text-stone-500">{text}</div>;
const Status: React.FC<{ status: string }> = ({ status }) => {
  const labels: Record<string, string> = { pending_review: 'Pendiente', approved: 'Revisado', rejected: 'Rechazado', needs_fix: 'Falta información' };
  const classes: Record<string, string> = { approved: 'bg-[#EAF4ED] text-[#2E5A44]', rejected: 'bg-red-50 text-red-700', needs_fix: 'bg-amber-50 text-amber-800', pending_review: 'bg-stone-100 text-stone-600' };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${classes[status] || classes.pending_review}`}>{labels[status] || status}</span>;
};
