import React, { useMemo, useRef, useState } from 'react';
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

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

export const GestorRequirementsWidget: React.FC<GestorRequirementsWidgetProps> = ({ compact = false }) => {
  const {
    currentUser,
    requirements,
    submitRequirement,
    reviewRequirement,
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
  const [newCategory, setNewCategory] = useState<GestorRequirement['category']>('other');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const riders = useMemo(() => {
    if (!currentUser || !isManager) return [];
    return users.filter(
      (user) => user.role === UserRole.RIDER && user.managerId === currentUser.id
    );
  }, [users, currentUser, isManager]);

  const effectiveRiderId = newRiderId || riders[0]?.id || '';

  const userRequirements = requirements.filter((requirement) => {
    if (!currentUser) return false;
    if (isManager) {
      return requirement.managerId === currentUser.id && riders.some((rider) => rider.id === requirement.riderId);
    }
    return requirement.riderId === currentUser.id;
  });

  const filteredRequirements = userRequirements.filter((requirement) => {
    if (activeTab === 'all') return true;
    return requirement.status === activeTab;
  });

  const counts = {
    pending: userRequirements.filter((item) => item.status === 'pending').length,
    submitted: userRequirements.filter((item) => item.status === 'submitted').length,
    approved: userRequirements.filter((item) => item.status === 'approved').length
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showNotification('error', 'El justificante no puede superar 15 MB.');
      event.target.value = '';
      return;
    }

    const allowed = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!allowed) {
      showNotification('error', 'Sube una imagen o un PDF.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setSubmissionProof(readerEvent.target?.result as string);
      showNotification('success', 'Justificante preparado para enviar.');
    };
    reader.onerror = () => showNotification('error', 'No se pudo leer el archivo.');
    reader.readAsDataURL(file);
  };

  const handleResolveRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedReq) return;

    submitRequirement(
      selectedReq.id,
      submissionNotes.trim() || 'Justificante adjuntado.',
      submissionProof || undefined
    );

    setSelectedReq(null);
    setSubmissionNotes('');
    setSubmissionProof(null);
  };

  const handleCreateRequirement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !isManager || !effectiveRiderId || !newTitle.trim()) return;

    const rider = riders.find((user) => user.id === effectiveRiderId);
    if (!rider) {
      showNotification('error', 'Ese cliente no está vinculado a tu gestoría.');
      return;
    }

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
      quarter: currentQuarter()
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewRiderId('');
    setNewCategory('other');
  };

  const tabs: Array<{ id: RequirementTab; label: string; count?: number }> = [
    { id: 'pending', label: 'Pendientes', count: counts.pending },
    { id: 'submitted', label: 'En revisión', count: counts.submitted },
    { id: 'approved', label: 'Resueltos', count: counts.approved },
    { id: 'all', label: 'Todos', count: userRequirements.length }
  ];

  const statusMeta = (status: GestorRequirement['status']) => {
    if (status === 'submitted') return { label: 'En revisión', className: 'labora-status-pending' };
    if (status === 'approved') return { label: 'Resuelto', className: 'labora-status-ok' };
    return { label: 'Pendiente', className: 'labora-status-warn' };
  };

  return (
    <div id="gestor-requirements-widget" className="labora-card overflow-hidden">
      <div className={`${compact ? 'p-4' : 'p-5'} border-b border-[var(--labora-border)] bg-[var(--labora-parchment)]`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
              <Bell size={19} strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <p className="labora-kicker text-[var(--labora-primary-2)]">{isManager ? 'Gestoría' : 'Tu gestoría'}</p>
              <h3 className="mt-0.5 text-lg font-extrabold tracking-[-0.02em] text-[var(--labora-ink)]">
                {isManager ? 'Peticiones a clientes' : 'Lo que necesita tu gestoría'}
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--labora-muted)]">
                {isManager
                  ? 'Solicita documentación únicamente a tus clientes vinculados y revisa sus respuestas.'
                  : 'Responde aquí a solicitudes de documentos o información.'}
              </p>
            </div>
          </div>

          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={riders.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[var(--labora-primary)] px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus size={15} strokeWidth={2.2} />
              Nueva petición
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto rounded-[14px] bg-[var(--labora-surface-2)] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[11px] px-3 py-2 text-[11px] font-extrabold transition ${
                activeTab === tab.id ? 'bg-[var(--labora-surface)] text-[var(--labora-ink)] shadow-sm' : 'text-[var(--labora-muted)] hover:text-[var(--labora-ink-soft)]'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'bg-[var(--labora-surface)]/70 text-[var(--labora-muted)]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {filteredRequirements.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
              <CheckCircle2 size={24} strokeWidth={1.9} />
            </div>
            <p className="mt-3 text-sm font-extrabold text-[var(--labora-ink)]">Nada pendiente aquí</p>
            <p className="mt-1 text-xs text-[var(--labora-muted)]">No hay peticiones en este estado.</p>
          </div>
        ) : (
          filteredRequirements.map((requirement) => {
            const status = statusMeta(requirement.status);

            return (
              <article key={requirement.id} className="rounded-[18px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4 transition hover:border-[var(--labora-border)] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]">
                        <FileText size={17} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-[var(--labora-ink)]">{requirement.title}</h4>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>

                        {requirement.description && (
                          <p className="mt-2 text-sm leading-relaxed text-[var(--labora-muted)]">{requirement.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-[var(--labora-muted)]">
                          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {requirement.deadline}</span>
                          {requirement.quarter && <span>{requirement.quarter}</span>}
                          {isManager && <span>{requirement.riderName}</span>}
                        </div>

                        {requirement.submissionNotes && (
                          <div className="mt-3 rounded-[13px] bg-[var(--labora-parchment)] px-3 py-2 text-xs leading-relaxed text-[var(--labora-muted)]">
                            {requirement.submissionNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!isManager && requirement.status === 'pending' && (
                      <button onClick={() => setSelectedReq(requirement)} className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--labora-clay)] px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[var(--labora-clay-deep)]">
                        <Upload size={15} /> Responder
                      </button>
                    )}

                    {!isManager && requirement.status === 'submitted' && (
                      <span className="labora-status-pending inline-flex rounded-[12px] px-3 py-2 text-xs font-bold">Esperando revisión</span>
                    )}

                    {isManager && requirement.status === 'submitted' && (
                      <button onClick={() => reviewRequirement(requirement.id, 'approved', 'Revisado por la gestoría.')} className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--labora-primary)] px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90">
                        <CheckCircle2 size={15} /> Aprobar
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--labora-ink)]/55 p-4 backdrop-blur-sm">
          <form onSubmit={handleResolveRequirement} className="w-full max-w-md overflow-hidden rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--labora-border)] p-5">
              <div>
                <p className="labora-kicker text-[var(--labora-primary-2)]">Responder</p>
                <h3 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">{selectedReq.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedReq(null)} className="rounded-xl p-2 text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)]"><X size={18} /></button>
            </div>

            <div className="space-y-4 p-5">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full rounded-[16px] border border-dashed border-[var(--labora-border)] bg-[var(--labora-parchment)] p-5 text-center transition hover:bg-[var(--labora-surface-2)]">
                <Upload size={20} className="mx-auto text-[var(--labora-primary)]" />
                <p className="mt-2 text-sm font-extrabold text-[var(--labora-ink)]">{submissionProof ? 'Justificante seleccionado' : 'Seleccionar justificante'}</p>
                <p className="mt-1 text-xs text-[var(--labora-muted)]">Imagen o PDF · máximo 15 MB</p>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />

              <textarea value={submissionNotes} onChange={(event) => setSubmissionNotes(event.target.value)} placeholder="Añade una nota opcional…" rows={3} className="w-full resize-none rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--labora-primary-2)]" />

              <button type="submit" className="w-full rounded-[13px] bg-[var(--labora-primary)] px-4 py-3 text-sm font-extrabold text-white hover:opacity-90">Enviar respuesta</button>
            </div>
          </form>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--labora-ink)]/55 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateRequirement} className="w-full max-w-lg overflow-hidden rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--labora-border)] p-5">
              <div>
                <p className="labora-kicker text-[var(--labora-primary-2)]">Gestoría</p>
                <h3 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">Nueva petición</h3>
                <p className="mt-1 text-xs text-[var(--labora-muted)]">Solo aparecen clientes vinculados a esta cuenta.</p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl p-2 text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)]"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-bold text-[var(--labora-muted)] sm:col-span-2">
                Cliente
                <select value={effectiveRiderId} onChange={(event) => setNewRiderId(event.target.value)} className="mt-1.5 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm" required>
                  {riders.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </label>

              <label className="text-xs font-bold text-[var(--labora-muted)] sm:col-span-2">
                Título
                <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required className="mt-1.5 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--labora-primary-2)]" placeholder="Ej. Falta factura de combustible" />
              </label>

              <label className="text-xs font-bold text-[var(--labora-muted)] sm:col-span-2">
                Descripción
                <textarea value={newDesc} onChange={(event) => setNewDesc(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--labora-primary-2)]" placeholder="Explica qué necesitas del cliente" />
              </label>

              <label className="text-xs font-bold text-[var(--labora-muted)]">
                Tipo
                <select value={newCategory} onChange={(event) => setNewCategory(event.target.value as GestorRequirement['category'])} className="mt-1.5 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm">
                  <option value="fuel_receipt">Ticket combustible</option>
                  <option value="platform_invoice">Factura plataforma</option>
                  <option value="social_security">Seguridad Social</option>
                  <option value="vat_correction">Corrección IVA</option>
                  <option value="other">Otro</option>
                </select>
              </label>

              <label className="text-xs font-bold text-[var(--labora-muted)]">
                Fecha límite
                <input type="date" value={newDeadline} onChange={(event) => setNewDeadline(event.target.value)} className="mt-1.5 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm" required />
              </label>

              <button type="submit" disabled={!effectiveRiderId} className="rounded-[13px] bg-[var(--labora-primary)] px-4 py-3 text-sm font-extrabold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2">Crear petición · {currentQuarter()}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
