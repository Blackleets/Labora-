import React, { useState, useRef } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle2, Clock, Upload, Send, 
  FileText, Fuel, ShieldCheck, Plus, ArrowRight, UserCheck, Eye, X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GestorRequirement, UserRole } from '../types';

interface GestorRequirementsWidgetProps {
  compact?: boolean;
}

export const GestorRequirementsWidget: React.FC<GestorRequirementsWidgetProps> = ({ compact = false }) => {
  const { 
    currentUser, requirements, updateRequirementStatus, addRequirement, 
    users, showNotification 
  } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'approved'>('pending');
  const [selectedReq, setSelectedReq] = useState<GestorRequirement | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<string>('');
  const [submissionProof, setSubmissionProof] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New requirement form state (for gestores)
  const [newRiderId, setNewRiderId] = useState<string>('u1');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'fuel_receipt' | 'platform_invoice' | 'social_security' | 'vat_correction' | 'other'>('fuel_receipt');
  const [newDeadline, setNewDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newQuarter, setNewQuarter] = useState<string>('3T 2026');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManager = currentUser?.role === UserRole.MANAGER;
  
  // Filter requirements based on role
  const userRequirements = requirements.filter(r => {
    if (isManager) {
      return r.managerId === currentUser?.id || currentUser?.id === 'm1';
    } else {
      return r.riderId === currentUser?.id;
    }
  });

  const filteredRequirements = userRequirements.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const pendingCount = userRequirements.filter(r => r.status === 'pending').length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSubmissionProof(event.target?.result as string);
      showNotification('success', 'Archivo seleccionado para subsanación');
    };
    reader.readAsDataURL(file);
  };

  const handleResolveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    updateRequirementStatus(
      selectedReq.id,
      'submitted',
      submissionNotes || 'Justificante adjuntado por el repartidor.',
      submissionProof || undefined
    );

    setSelectedReq(null);
    setSubmissionNotes('');
    setSubmissionProof(null);
  };

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetRider = users.find(u => u.id === newRiderId);

    addRequirement({
      managerId: currentUser?.id || 'm1',
      managerName: currentUser?.companyName || currentUser?.name || 'Gestoría Fiscal',
      riderId: newRiderId,
      riderName: targetRider?.name || 'Rider',
      title: newTitle,
      description: newDesc,
      category: newCategory,
      deadline: newDeadline,
      status: 'pending',
      quarter: newQuarter
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel_receipt':
        return <Fuel className="w-4 h-4 text-amber-500" />;
      case 'platform_invoice':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'social_security':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div id="gestor-requirements-widget" className="bg-[#FCFAF7] rounded-3xl border border-[#E8DFC8] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#E8DFC8] flex flex-wrap items-center justify-between gap-3 bg-[#FAF7F2]">
        <div className="flex items-center space-x-3">
          <div className="relative p-2.5 bg-[#EBF3ED] text-[#245338] rounded-2xl border border-[#D0E5D7]">
            <Bell className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C96846] text-white text-[10px] font-extrabold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                {isManager ? 'Requerimientos Enviados a Clientes' : 'Requerimientos de tu Gestor'}
              </h3>
              <span className="px-2.5 py-0.5 bg-[#EBF3ED] text-[#245338] text-xs font-serif font-semibold rounded-full border border-[#D0E5D7]">
                {isManager ? 'Panel Gestor' : 'Gestoría Fiscal Pérez'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 font-serif">
              {isManager 
                ? 'Control de solicitudes de tickets de gasolinera, facturas y modelos pendientes de tus riders.' 
                : 'Documentos, aclaraciones y tickets de combustible que tu asesor fiscal necesita para presentar tus declaraciones.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isManager && (
            <button
              id="create-requirement-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Requerimiento</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex bg-[#F2EDE4] p-0.5 rounded-xl border border-[#E3DBD0] text-xs font-serif font-medium">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-stone-900 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pendientes ({userRequirements.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'submitted'
                  ? 'bg-white text-stone-900 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Enviados
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'approved'
                  ? 'bg-white text-stone-900 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Resueltos
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="p-4 divide-y divide-[#E8DFC8] bg-white">
        {filteredRequirements.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 bg-[#EBF3ED] text-[#2E5A44] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#D0E5D7]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-serif font-semibold text-stone-700">No hay requerimientos en este estado</p>
            <p className="text-xs text-stone-400 mt-0.5 font-serif">
              {isManager 
                ? 'Todos tus clientes tienen su documentación al día.' 
                : 'Tu asesor fiscal no tiene peticiones pendientes de combustible o facturas.'}
            </p>
          </div>
        ) : (
          filteredRequirements.map((req) => {
            const isPending = req.status === 'pending';
            const isSubmitted = req.status === 'submitted';
            const isApproved = req.status === 'approved';

            return (
              <div 
                key={req.id} 
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2] p-2.5 rounded-2xl transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-[#FAF7F2] rounded-xl shrink-0 mt-0.5 border border-[#E8DFC8]">
                    {getCategoryIcon(req.category)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="text-sm font-serif font-bold text-stone-800">{req.title}</h4>
                      {isPending && (
                        <span className="px-2.5 py-0.5 bg-[#FEF7EB] text-[#85531B] text-[10px] font-serif font-semibold rounded-full border border-[#FDE3B8]">
                          Falta Acción
                        </span>
                      )}
                      {isSubmitted && (
                        <span className="px-2.5 py-0.5 bg-[#EAF2F6] text-[#2C5F7B] text-[10px] font-serif font-semibold rounded-full border border-[#D2E4EE]">
                          En Revisión del Gestor
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 bg-[#EBF3ED] text-[#245338] text-[10px] font-serif font-semibold rounded-full border border-[#D0E5D7]">
                          Subsanado & Validado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
                      {req.description}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-stone-400 mt-2 font-serif">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Plazo Hacienda: <strong className="text-stone-600 font-semibold">{req.deadline}</strong></span>
                      </span>
                      <span>•</span>
                      <span>{req.quarter || '3T 2026'}</span>
                      {isManager && (
                        <>
                          <span>•</span>
                          <span className="text-[#2E5A44] font-semibold">Cliente: {req.riderName}</span>
                        </>
                      )}
                      {req.submissionNotes && (
                        <>
                          <span>•</span>
                          <span className="text-stone-500 italic">Nota: "{req.submissionNotes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 sm:self-center">
                  {!isManager && isPending && (
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="px-3 py-1.5 bg-[#C96846] hover:bg-[#B35636] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Justificante</span>
                    </button>
                  )}

                  {!isManager && isSubmitted && (
                    <span className="text-xs font-serif font-medium text-[#2C5F7B] bg-[#EAF2F6] px-2.5 py-1 rounded-xl border border-[#D2E4EE] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#3A7596]" />
                      <span>Esperando visto bueno</span>
                    </span>
                  )}

                  {isManager && isSubmitted && (
                    <button
                      onClick={() => {
                        updateRequirementStatus(req.id, 'approved', 'Revisado y validado para la declaración.');
                      }}
                      className="px-3 py-1.5 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar y Archivar</span>
                    </button>
                  )}

                  {isApproved && (
                    <span className="text-xs font-serif font-semibold text-[#245338] bg-[#EBF3ED] px-2.5 py-1 rounded-xl border border-[#D0E5D7] flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2E5A44]" />
                      <span>Auditado</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Rider Resolves / Submits Requirement */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FCFAF7] rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-[#E8DFC8]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 bg-[#FEF7EB] text-[#C96846] rounded-2xl border border-[#FDE3B8]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">Subsanar Requerimiento</h3>
                  <p className="text-xs text-stone-500 font-serif">Envío directo a {selectedReq.managerName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReq(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveRequirement} className="mt-4 space-y-4">
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DFC8] text-xs">
                <strong className="text-stone-800 font-serif font-bold block mb-1">{selectedReq.title}</strong>
                <p className="text-stone-600 leading-relaxed">{selectedReq.description}</p>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Foto o Archivo del Documento / Ticket
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*,.pdf" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-[#DFD5C6] hover:border-[#2E5A44] rounded-2xl flex items-center justify-center space-x-2 text-xs font-serif font-semibold text-stone-600 hover:text-[#2E5A44] transition-colors bg-white"
                >
                  <Upload className="w-4 h-4" />
                  <span>{submissionProof ? '✓ Archivo cargado (Click para cambiar)' : 'Seleccionar foto o PDF'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Nota / Aclaración para el Gestor
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Ej. Adjunto la foto del ticket de la gasolinera con el CIF y desglose de IVA bien visible..."
                  className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-serif font-semibold text-stone-600 hover:bg-[#FAF7F2] rounded-xl border border-[#DFD5C6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar al Asesor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gestor Creates New Requirement */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FCFAF7] rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-[#E8DFC8]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 bg-[#EBF3ED] text-[#2E5A44] rounded-2xl border border-[#D0E5D7]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">Solicitar Documentación al Rider</h3>
                  <p className="text-xs text-stone-500 font-serif">Notificación directa para la preparación tributaria</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Cliente / Rider Destinatario
                </label>
                <select
                  value={newRiderId}
                  onChange={(e) => setNewRiderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white font-serif font-medium text-stone-800"
                >
                  {users.filter(u => u.role === UserRole.RIDER).map(rider => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} ({rider.nif || 'Sin NIF'}) - {rider.platforms.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                    Tipo de Requerimiento
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white font-serif font-medium text-stone-800"
                  >
                    <option value="fuel_receipt">Ticket Gasolinera / Combustible</option>
                    <option value="platform_invoice">Auto-factura de Plataforma (Glovo/Uber)</option>
                    <option value="social_security">Cuota RETA / Seguridad Social</option>
                    <option value="vat_correction">Aclaración IVA / Modelo 303</option>
                    <option value="other">Otro Documento Censal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                    Trimestre Fiscal
                  </label>
                  <select
                    value={newQuarter}
                    onChange={(e) => setNewQuarter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white font-serif font-medium text-stone-800"
                  >
                    <option value="3T 2026">3T 2026 (Julio - Sept)</option>
                    <option value="4T 2026">4T 2026 (Oct - Dic)</option>
                    <option value="2T 2026">2T 2026 (Abril - Junio)</option>
                    <option value="1T 2026">1T 2026 (Enero - Marzo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Título del Requerimiento
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Ticket de combustible Repsol faltante del 14/09"
                  className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Instrucciones Detalladas para el Rider
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explica con claridad qué dato o fotografía necesitas y por qué es necesario para deducir el gasto..."
                  className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Fecha Límite (Antes de plazo Hacienda)
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white font-serif"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E8DFC8]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-serif font-semibold text-stone-600 hover:bg-[#FAF7F2] rounded-xl border border-[#DFD5C6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Requerimiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
