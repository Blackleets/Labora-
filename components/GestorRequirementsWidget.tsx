import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock, FileText, Fuel, Loader2, Plus, ShieldCheck, Upload, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GestorRequirement, UserRole } from '../types';
import { getMarketProfile } from '../modules/country-config/marketProfiles';

interface GestorRequirementsWidgetProps {
  compact?: boolean;
}

type RequirementCategory = GestorRequirement['category'];

export const GestorRequirementsWidget: React.FC<GestorRequirementsWidgetProps> = () => {
  const { currentUser, requirements, updateRequirementStatus, addRequirement, users, showNotification } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'approved'>('pending');
  const [selectedRequirement, setSelectedRequirement] = useState<GestorRequirement | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionProof, setSubmissionProof] = useState<string | null>(null);
  const [submissionFilename, setSubmissionFilename] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetClientId, setTargetClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RequirementCategory>('other');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const clients = users.filter((user) => user.role === UserRole.RIDER);
  const targetClient = clients.find((client) => client.id === targetClientId) || null;
  const targetMarket = getMarketProfile(targetClient?.countryCode);

  const userRequirements = requirements.filter((requirement) => isManager
    ? requirement.managerId === currentUser.id
    : requirement.riderId === currentUser.id,
  );
  const filteredRequirements = userRequirements.filter((requirement) => activeTab === 'all' || requirement.status === activeTab);
  const pendingCount = userRequirements.filter((requirement) => requirement.status === 'pending').length;

  const tabCounts = useMemo(() => ({
    pending: userRequirements.filter((requirement) => requirement.status === 'pending').length,
    submitted: userRequirements.filter((requirement) => requirement.status === 'submitted').length,
    approved: userRequirements.filter((requirement) => requirement.status === 'approved').length,
    all: userRequirements.length,
  }), [userRequirements]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', 'Usa PDF, JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'El archivo supera 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setSubmissionProof(String(loadEvent.target?.result || ''));
      setSubmissionFilename(file.name);
    };
    reader.onerror = () => showNotification('error', 'No se pudo leer el archivo.');
    reader.readAsDataURL(file);
  };

  const submitRequirementResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequirement || !submissionProof?.startsWith('data:')) {
      showNotification('error', 'Adjunta el documento solicitado antes de enviarlo.');
      return;
    }
    setSaving(true);
    try {
      await updateRequirementStatus(
        selectedRequirement.id,
        'submitted',
        submissionNotes.trim() || 'Documento adjuntado por el cliente.',
        submissionProof,
      );
      setSelectedRequirement(null);
      setSubmissionNotes('');
      setSubmissionProof(null);
      setSubmissionFilename('');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo enviar el documento.');
    } finally {
      setSaving(false);
    }
  };

  const createRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetClient || !title.trim()) {
      showNotification('error', 'Selecciona un cliente y explica qué necesitas.');
      return;
    }
    setSaving(true);
    try {
      await addRequirement({
        managerId: currentUser.id,
        managerName: currentUser.companyName || currentUser.name,
        riderId: targetClient.id,
        riderName: targetClient.name,
        title: title.trim(),
        description: description.trim(),
        category,
        deadline,
        status: 'pending',
        quarter: targetMarket.fiscalEngineStatus === 'verified' ? currentQuarter() : undefined,
      });
      setShowCreateModal(false);
      setTargetClientId('');
      setTitle('');
      setDescription('');
      setCategory('other');
      setDeadline('');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo enviar la petición.');
    } finally {
      setSaving(false);
    }
  };

  const approveResponse = async (requirement: GestorRequirement) => {
    setSaving(true);
    try {
      await updateRequirementStatus(requirement.id, 'approved', requirement.submissionNotes || 'Documento revisado por el asesor.');
      showNotification('success', 'Petición marcada como resuelta. Esto no convierte el documento en una validación oficial.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo cerrar la petición.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] shadow-sm">
      <header className="border-b border-[#E8DFC8] bg-[#FAF7F2] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D0E5D7] bg-[#EBF3ED] text-[#245338]"><Bell className="h-5 w-5" />{pendingCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C96846] px-1 text-[9px] font-black text-white">{pendingCount}</span>}</span><div><h1 className="font-serif text-lg font-bold text-stone-900">{isManager ? 'Peticiones a clientes' : 'Peticiones de mi asesor'}</h1><p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">{isManager ? 'Pide exactamente lo que falta y conserva la respuesta en el mismo expediente.' : 'Aquí ves qué documento falta, por qué te lo piden y dónde responder. Sin capturas perdidas entre conversaciones.'}</p></div></div>
          {isManager && <button onClick={() => setShowCreateModal(true)} disabled={clients.length === 0} className="flex items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Nueva petición</button>}
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-[#F2EDE4] p-1">{(['pending', 'submitted', 'approved', 'all'] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold ${activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>{tab === 'pending' ? 'Pendientes' : tab === 'submitted' ? 'En revisión' : tab === 'approved' ? 'Resueltas' : 'Todas'} ({tabCounts[tab]})</button>)}</nav>
      </header>

      <div className="divide-y divide-[#EEE8DE] bg-white p-4">
        {filteredRequirements.length === 0 ? (
          <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-[#91A99A]" /><p className="mt-3 text-sm font-semibold text-stone-700">No hay peticiones en este estado</p></div>
        ) : filteredRequirements.map((requirement) => (
          <article key={requirement.id} className="flex flex-col gap-3 rounded-2xl p-3 hover:bg-[#FAF7F2] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8DFC8] bg-[#FAF7F2]">{categoryIcon(requirement.category)}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-stone-900">{requirement.title}</h2><Status status={requirement.status} /></div><p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-600">{requirement.description || 'Sin descripción adicional.'}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-stone-500">{isManager && <span>Cliente: <strong>{requirement.riderName}</strong></span>}{!isManager && <span>Asesor: <strong>{requirement.managerName}</strong></span>}{requirement.deadline && <span>Fecha solicitada: <strong>{requirement.deadline}</strong></span>}{requirement.quarter && <span>Periodo: <strong>{requirement.quarter}</strong></span>}</div>{requirement.submissionNotes && <p className="mt-2 rounded-xl bg-[#F7F3EC] px-3 py-2 text-[11px] text-stone-600">Respuesta: {requirement.submissionNotes}</p>}</div></div>
            <div className="flex shrink-0 gap-2">{!isManager && requirement.status === 'pending' && <button onClick={() => setSelectedRequirement(requirement)} className="flex items-center gap-1.5 rounded-xl bg-[#C96846] px-3 py-2 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Responder</button>}{isManager && requirement.status === 'submitted' && <button disabled={saving} onClick={() => void approveResponse(requirement)} className="flex items-center gap-1.5 rounded-xl bg-[#2E5A44] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Marcar resuelta</button>}</div>
          </article>
        ))}
      </div>

      {selectedRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitRequirementResponse} className="w-full max-w-lg space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#C96846]">Respuesta a petición</p><h2 className="mt-1 font-serif text-xl font-bold text-stone-900">{selectedRequirement.title}</h2><p className="mt-2 text-xs leading-relaxed text-stone-500">{selectedRequirement.description}</p></div><button type="button" onClick={() => setSelectedRequirement(null)} className="rounded-xl p-2 text-stone-400"><X className="h-5 w-5" /></button></div>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#BFCDBF] bg-[#F5F8F4] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2E5A44]"><Upload className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-stone-800">{submissionFilename || 'Adjuntar documento solicitado'}</p><p className="mt-0.5 text-[10px] text-stone-500">PDF, JPG, PNG o WEBP · máximo 10 MB</p></div><input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" /></label>
            <label className="block text-xs font-semibold text-stone-700">Mensaje para tu asesor<textarea value={submissionNotes} onChange={(event) => setSubmissionNotes(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" placeholder="Opcional: explica qué estás enviando." /></label>
            <button disabled={saving || !submissionProof} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-bold text-white disabled:opacity-45">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{saving ? 'Enviando…' : 'Enviar documento'}</button>
          </form>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={createRequirement} className="w-full max-w-lg space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="font-serif text-xl font-bold text-stone-900">Nueva petición</h2><p className="mt-1 text-xs text-stone-500">Pide un documento concreto y explica para qué lo necesitas.</p></div><button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl p-2 text-stone-400"><X className="h-5 w-5" /></button></div>
            <label className="block text-xs font-semibold text-stone-700">Cliente<select required value={targetClientId} onChange={(event) => { setTargetClientId(event.target.value); setCategory('other'); }} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm"><option value="">Selecciona…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {getMarketProfile(client.countryCode).displayName}</option>)}</select></label>
            <label className="block text-xs font-semibold text-stone-700">Qué necesitas<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" placeholder="Ej. Extracto semanal de Uber" /></label>
            <label className="block text-xs font-semibold text-stone-700">Explícalo con claridad<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" placeholder="Dónde puede encontrarlo y por qué lo necesitas." /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-stone-700">Tipo<select value={category} onChange={(event) => setCategory(event.target.value as RequirementCategory)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm"><option value="platform_invoice">Documento de plataforma</option><option value="fuel_receipt">Ticket / comprobante</option>{targetMarket.fiscalEngineStatus === 'verified' && <><option value="social_security">Seguridad Social</option><option value="vat_correction">Corrección fiscal / IVA</option></>}<option value="other">Otro</option></select></label><label className="text-xs font-semibold text-stone-700">Fecha solicitada<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label></div>
            <button disabled={saving || !targetClientId || !title.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-bold text-white disabled:opacity-45">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? 'Enviando…' : 'Enviar petición'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const categoryIcon = (category: string) => category === 'fuel_receipt' ? <Fuel className="h-4 w-4 text-amber-600" /> : category === 'platform_invoice' ? <FileText className="h-4 w-4 text-[#3A7596]" /> : category === 'social_security' ? <ShieldCheck className="h-4 w-4 text-[#2E5A44]" /> : <AlertTriangle className="h-4 w-4 text-[#C96846]" />;

const Status: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-800', icon: <Clock className="h-3 w-3" /> },
    submitted: { label: 'En revisión', className: 'bg-sky-50 text-sky-700', icon: <Clock className="h-3 w-3" /> },
    approved: { label: 'Resuelta', className: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  };
  const item = map[status] || map.pending;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.className}`}>{item.icon}{item.label}</span>;
};
