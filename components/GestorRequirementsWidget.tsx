import React, { useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Upload,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GestorRequirement, UserRole } from '../types';

interface GestorRequirementsWidgetProps {
  compact?: boolean;
}

type RequirementTab = 'pending' | 'submitted' | 'approved' | 'all';

export const GestorRequirementsWidget: React.FC<GestorRequirementsWidgetProps> = ({ compact = false }) => {
  const {
    currentUser,
    requirements,
    updateRequirementStatus,
    addRequirement,
    users,
    showNotification
  } = useData();

  const [activeTab, setActiveTab] = useState<RequirementTab>('pending');
  const [selectedReq, setSelectedReq] = useState<GestorRequirement | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionProof, setSubmissionProof] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newRiderId, setNewRiderId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<GestorRequirement['category']>('fuel_receipt');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newQuarter, setNewQuarter] = useState('3T 2026');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const riders = users.filter((user) => user.role === UserRole.RIDER);
  const effectiveRiderId = newRiderId || riders[0]?.id || '';

  const userRequirements = requirements.filter((requirement) => {
    if (isManager) return requirement.managerId === currentUser?.id;
    return requirement.riderId === currentUser?.id;
  });

  const filteredRequirements = userRequirements.filter((requirement) => {
    if (activeTab === 'all') return true;
    return requirement.status === activeTab;
  });

  const pendingCount = userRequirements.filter((requirement) => requirement.status === 'pending').length;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setSubmissionProof(readerEvent.target?.result as string);
      showNotification('success', 'Justificante preparado para enviar');
    };
    reader.readAsDataURL(file);
  };

  const handleResolveRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedReq) return;

    updateRequirementStatus(
      selectedReq.id,
      'submitted',
      submissionNotes || 'Justificante adjuntado.',
      submissionProof || undefined
    );

    setSelectedReq(null);
    setSubmissionNotes('');
    setSubmissionProof(null);
  };

  const handleCreateRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !effectiveRiderId || !newTitle.trim()) return;

    const rider = riders.find((user) => user.id === effectiveRiderId);
    if (!rider) return;

    addRequirement({
      managerId: currentUser.id,
      managerName: currentUser.companyName || currentUser.name,
      riderId: rider.id,
      riderName: rider.name,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      deadline: newDeadline,
      status: 'pending',
      quarter: newQuarter
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewRiderId('');
  };

  const tabs: Array<{ id: RequirementTab; label: string }> = [
    { id: 'pending', label: `Pendientes${pendingCount ? ` ${pendingCount}` : ''}` },
    { id: 'submitted', label: 'En revisión' },
    { id: 'approved', label: 'Resueltos' },
    { id: 'all', label: 'Todos' }
  ];

  const statusMeta = (status: GestorRequirement['status']) => {
    if (status === 'submitted') return { label: 'En revisión', className: 'bg-[#EEF3F6] text-[#466372]' };
    if (status === 'approved') return { label: 'Resuelto', className: 'bg-[#EAF1EC] text-[#2E5A44]' };
    return { label: 'Pendiente', className: 'bg-[#FFF3E8] text-[#A45B37]' };
  };

  return (
    <div id="gestor-requirements-widget" className="overflow-hidden rounded-2xl border border-[#E2DBD0] bg-white">
      <div className={`border-b border-[#E9E2D8] bg-[#FBF9F5] ${compact ? 'p-4' : 'p-5'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#2E5A44]">
              <Bell size={18} strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-stone-900">
                {isManager ? 'Peticiones' : 'Avisos'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {isManager
                  ? 'Solicita documentación y revisa las respuestas de tus clientes.'
                  : 'Documentación o información que necesita tu gestoría.'}
              </p>
            </div>
          </div>

          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={riders.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#244A37] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus size={15} strokeWidth={2.1} />
              Nueva petición
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-[#F2EEE7] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {filteredRequirements.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 size={28} className="mx-auto text-[#2E5A44]" strokeWidth={1.8} />
            <p className="mt-3 text-sm font-bold text-stone-800">Sin elementos</p>
            <p className="mt-1 text-xs text-stone-400">No hay peticiones en este estado.</p>
          </div>
        ) : (
          filteredRequirements.map((requirement) => {
            const status = statusMeta(requirement.status);

            return (
              <article key={requirement.id} className="rounded-2xl border border-[#E7E0D6] bg-[#FFFEFC] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F1EB] text-stone-600">
                        <FileText size={17} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900">{requirement.title}</h4>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>

                        {requirement.description && (
                          <p className="mt-2 text-sm leading-relaxed text-stone-600">{requirement.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-stone-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={13} />
                            {requirement.deadline}
                          </span>
                          {requirement.quarter && <span>{requirement.quarter}</span>}
                          {isManager && <span>{requirement.riderName}</span>}
                        </div>

                        {requirement.submissionNotes && (
                          <div className="mt-3 rounded-xl bg-[#F7F4EE] px-3 py-2 text-xs text-stone-600">
                            {requirement.submissionNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!isManager && requirement.status === 'pending' && (
                      <button
                        onClick={() => setSelectedReq(requirement)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#C96846] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B85A39]"
                      >
                        <Upload size={15} strokeWidth={2.1} />
                        Subir justificante
                      </button>
                    )}

                    {!isManager && requirement.status === 'submitted' && (
                      <span className="inline-flex rounded-xl bg-[#EEF3F6] px-3 py-2 text-xs font-semibold text-[#466372]">
                        Esperando revisión
                      </span>
                    )}

                    {isManager && requirement.status === 'submitted' && (
                      <button
                        onClick={() => updateRequirementStatus(requirement.id, 'approved', 'Revisado por la gestoría.')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2E5A44] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#244A37]"
                      >
                        <CheckCircle2 size={15} strokeWidth={2.1} />
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={handleResolveRequirement} className="w-full max-w-md overflow-hidden rounded-3xl border border-[#E2DBD0] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E9E2D8] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2E5A44]">Responder</p>
                <h3 className="mt-1 text-lg font-bold text-stone-900">{selectedReq.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedReq(null)} className="rounded-xl p-2 text-stone-400 hover:bg-[#F4F1EB]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border border-dashed border-[#CFC5B8] bg-[#FBF9F5] p-5 text-center transition-colors hover:bg-[#F7F3ED]"
              >
                <Upload size={20} className="mx-auto text-[#2E5A44]" />
                <p className="mt-2 text-sm font-bold text-stone-800">
                  {submissionProof ? 'Justificante seleccionado' : 'Seleccionar justificante'}
                </p>
                <p className="mt-1 text-xs text-stone-400">Foto o archivo desde tu dispositivo</p>
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

              <textarea
                value={submissionNotes}
                onChange={(event) => setSubmissionNotes(event.target.value)}
                placeholder="Añade una nota opcional..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[#DCD4C8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2E5A44] focus:ring-2 focus:ring-[#2E5A44]/10"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#244A37]"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateRequirement} className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#E2DBD0] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E9E2D8] p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2E5A44]">Gestoría</p>
                <h3 className="mt-1 text-lg font-bold text-stone-900">Nueva petición</h3>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl p-2 text-stone-400 hover:bg-[#F4F1EB]">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
                Cliente
                <select
                  value={effectiveRiderId}
                  onChange={(event) => setNewRiderId(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DCD4C8] bg-white px-3 py-2.5 text-sm"
                >
                  {riders.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
                Título
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#DCD4C8] px-3 py-2.5 text-sm"
                />
              </label>

              <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
                Descripción
                <textarea
                  value={newDesc}
                  onChange={(event) => setNewDesc(event.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#DCD4C8] px-3 py-2.5 text-sm"
                />
              </label>

              <label className="text-xs font-semibold text-stone-600">
                Tipo
                <select
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value as GestorRequirement['category'])}
                  className="mt-1.5 w-full rounded-xl border border-[#DCD4C8] bg-white px-3 py-2.5 text-sm"
                >
                  <option value="fuel_receipt">Ticket combustible</option>
                  <option value="platform_invoice">Factura plataforma</option>
                  <option value="social_security">Seguridad Social</option>
                  <option value="vat_correction">Corrección IVA</option>
                  <option value="other">Otro</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-stone-600">
                Trimestre
                <select
                  value={newQuarter}
                  onChange={(event) => setNewQuarter(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DCD4C8] bg-white px-3 py-2.5 text-sm"
                >
                  <option>1T 2026</option>
                  <option>2T 2026</option>
                  <option>3T 2026</option>
                  <option>4T 2026</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
                Fecha límite
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(event) => setNewDeadline(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DCD4C8] px-3 py-2.5 text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={!effectiveRiderId}
                className="rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#244A37] disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2"
              >
                Crear petición
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};