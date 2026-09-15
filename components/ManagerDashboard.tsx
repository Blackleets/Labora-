import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { 
  Users, DollarSign, AlertCircle, FileText, CheckCircle2, 
  Fuel, ShieldCheck, Search, Filter, Eye, ChevronRight, 
  Send, Download, Check, X, Clock, Plus, Bike, Building2,
  ExternalLink, ZoomIn, ZoomOut, RotateCcw, Scale, ArrowRight,
  RefreshCw
} from 'lucide-react';
import { User, UserRole, Expense, ExpenseCategory } from '../types';
import { GestorRequirementsWidget } from './GestorRequirementsWidget';
import { TaxDeclarationsViewer } from './TaxDeclarationsViewer';

interface ManagerDashboardProps {
  setView?: (view: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ setView }) => {
  const { 
    currentUser, users, incomes, expenses, requirements, 
    updateExpenseAudit, addRequirement, fileTaxDeclaration, 
    calculateQuarterlyTaxes, showNotification, switchUser 
  } = useData();
  const { selectedCountry } = useCountry();

  const [selectedClientId, setSelectedClientId] = useState<string>('u1');
  const [activeTab, setActiveTab] = useState<'audit_tickets' | 'declarations' | 'requirements' | 'census'>('audit_tickets');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'approved'>('all');
  
  // Modal for zoomed ticket proof
  const [zoomReceipt, setZoomReceipt] = useState<Expense | null>(null);
  const [receiptZoomLevel, setReceiptZoomLevel] = useState<number>(1);

  // New requirement dialog inside client view
  const [showReqModal, setShowReqModal] = useState<boolean>(false);
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqDesc, setReqDesc] = useState<string>('');
  const [reqCategory, setReqCategory] = useState<'fuel_receipt' | 'platform_invoice' | 'social_security' | 'vat_correction' | 'other'>('fuel_receipt');
  const [reqDeadline, setReqDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Get all rider clients
  const clientRiders = users.filter(u => u.role === UserRole.RIDER);
  const selectedClient = users.find(u => u.id === selectedClientId) || clientRiders[0];

  // Filter clients by search
  const filteredClients = clientRiders.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nif && c.nif.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.platforms.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Client-specific data
  const clientIncomes = incomes.filter(i => i.userId === selectedClient?.id);
  const clientExpenses = expenses.filter(e => e.userId === selectedClient?.id);
  const clientRequirements = requirements.filter(r => r.riderId === selectedClient?.id);

  const clientGrossIncome = clientIncomes.reduce((sum, i) => sum + i.amount, 0);
  const clientTotalExpenses = clientExpenses.reduce((sum, e) => sum + e.amount, 0);
  const clientDeductible = clientExpenses.reduce((sum, e) => {
    if (e.status === 'rejected') return sum;
    return sum + (e.amount * (e.deductiblePercentage ?? 100) / 100);
  }, 0);
  const clientNetYield = Math.max(0, clientGrossIncome - clientDeductible);
  const clientEstimatedIRPF = Number((clientNetYield * 0.20).toFixed(2));
  const clientPendingTickets = clientExpenses.filter(e => e.status === 'pending_review').length;

  const handleCreateRequirementForClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !selectedClient) return;

    addRequirement({
      managerId: currentUser?.id || 'm1',
      managerName: currentUser?.companyName || currentUser?.name || 'Gestoría Fiscal Pérez S.L.',
      riderId: selectedClient.id,
      riderName: selectedClient.name,
      title: reqTitle,
      description: reqDesc,
      category: reqCategory,
      deadline: reqDeadline,
      status: 'pending',
      quarter: '3T 2026'
    });

    setShowReqModal(false);
    setReqTitle('');
    setReqDesc('');
    showNotification('success', `Requerimiento enviado a ${selectedClient.name}`);
  };

  const handleAuditAction = (expenseId: string, status: 'approved' | 'rejected' | 'pending_review', percentage: number = 100) => {
    updateExpenseAudit(expenseId, status, percentage);
    const msg = status === 'approved' 
      ? `Ticket validado al ${percentage}% de deducción AEAT` 
      : (status === 'rejected' ? 'Ticket rechazado por no afecto' : 'Marcado para revisión');
    showNotification('info', msg);
  };

  const handleExportClientDossier = (client: User) => {
    const lines = [
      `============================================================`,
      `DOSSIER FISCAL Y AUDITORÍA AEAT - CLIENTE RIDER`,
      `============================================================`,
      `NOMBRE: ${client.name.toUpperCase()}`,
      `NIF/NIE: ${client.nif || 'No especificado'}`,
      `EPÍGRAFE IAE: ${client.iaeCode || '849.5 - Transporte y mensajería en ciclomotor'}`,
      `RÉGIMEN FISCAL: Estimación Directa Simplificada`,
      `SEGURIDAD SOCIAL: ${client.socialSecurityType === 'tarifa_plana' ? 'Tarifa Plana RETA (80€/mes)' : 'Cotización por Tramos Reales'}`,
      `VEHÍCULO AFECTO: ${client.vehicleType?.toUpperCase() || 'MOTO'} (Matrícula: ${client.vehiclePlate || 'N/A'})`,
      `PLATAFORMAS VINCULADAS: ${client.platforms.join(', ')}`,
      `GESTORÍA RESPONSABLE: Gestoría Fiscal Pérez S.L. (Colegiado Nº 9421)`,
      `FECHA DE AUDITORÍA: ${new Date().toLocaleDateString('es-ES')}`,
      `------------------------------------------------------------`,
      `RESUMEN ECONÓMICO 3T 2026:`,
      `- Ingresos Brutos Facturados: ${clientGrossIncome.toFixed(2)} €`,
      `- Gastos Fiscalmente Deducibles: ${clientDeductible.toFixed(2)} €`,
      `- Rendimiento Neto Computable: ${clientNetYield.toFixed(2)} €`,
      `- Retención / Pago Trimestral Modelo 130 (20%): ${clientEstimatedIRPF.toFixed(2)} €`,
      `------------------------------------------------------------`,
      `DESGLOSE DE COMPROBANTES DE GASTO CON RESPALDO FOTOGRÁFICO:`,
      ...clientExpenses.map(e => 
        `• [${e.date}] ${e.merchant || e.category} | Importe: ${e.amount.toFixed(2)} € | IVA: ${(e.vatAmount || 0).toFixed(2)} € | Deducibilidad: ${e.deductiblePercentage ?? 100}% | Estado: ${e.status.toUpperCase()} | Respaldo: ${e.receiptUrl ? 'SÍ (Fotografía digitalizada en servidor)' : 'NO'}`
      ),
      `============================================================`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dossier_Fiscal_${client.name.replace(/\s+/g, '_')}_3T2026.txt`;
    a.click();
    showNotification('success', `Dossier fiscal de ${client.name} generado con éxito`);
  };

  const handleSwitchToClient = (client: User) => {
    switchUser(client.id);
    setView?.('dashboard');
    showNotification('info', `Cambiado a la vista de ${client.name}`);
  };

  return (
    <div id="gestor-master-workspace" className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      
      {/* Gestor Header Banner - Warm Studio Ghibli Atelier Style */}
      <div className="bg-[#213B2F] text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#345947] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-[#2F5241] text-[#D8EADB] text-xs font-semibold rounded-full border border-[#48735E] flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#FAD082]" />
              <span>Despacho de Asesoría Fiscal</span>
            </span>
            <span className="px-2.5 py-1 bg-[#FEF7EB] text-[#85531B] text-xs font-semibold rounded-full border border-[#FDE3B8]">
              Colegiado Nº 9421
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
            {currentUser?.companyName || 'Gestoría Fiscal Pérez & Asociados'}
          </h1>
          <p className="text-[#D3E3D8] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Supervisión integral de repartidores autónomos: auditoría de tickets de repostaje con comprobante fotográfico, resolución de requerimientos y presentación de Modelos 130 y 303 en la AEAT.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <div className="bg-[#2D4E3E] rounded-2xl p-3.5 text-center border border-[#416854] min-w-[105px]">
            <p className="text-[10px] uppercase font-bold text-[#A8C8B4]">Riders Activos</p>
            <p className="text-xl font-serif font-bold text-white mt-0.5">{clientRiders.length}</p>
          </div>
          <div className="bg-[#2D4E3E] rounded-2xl p-3.5 text-center border border-[#416854] min-w-[115px]">
            <p className="text-[10px] uppercase font-bold text-[#FAD082]">Tickets Pendientes</p>
            <p className="text-xl font-serif font-bold text-[#FAD082] mt-0.5">
              {expenses.filter(e => e.status === 'pending_review').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Client List on Left, Active Client Audit on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Client Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FCFAF7] rounded-3xl border border-[#EBE3D5] shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#2E5A44]" />
                <span>Cartera de Clientes ({clientRiders.length})</span>
              </h3>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, NIF o app..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-800"
              />
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredClients.map((client) => {
                const isSelected = client.id === selectedClientId;
                const clientExp = expenses.filter(e => e.userId === client.id);
                const pendingCount = clientExp.filter(e => e.status === 'pending_review').length;

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#2E5A44] bg-[#EBF3ED] shadow-sm ring-1 ring-[#2E5A44]'
                        : 'border-[#EBE4D8] hover:border-[#D6CCC0] bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#2E5A44] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold font-serif text-stone-900 truncate">{client.name}</h4>
                        <p className="text-[11px] text-stone-500 font-mono">{client.nif || 'Sin NIF'} • {client.vehiclePlate || 'Bici'}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {client.platforms.slice(0, 3).map(p => (
                            <span key={p} className="text-[9px] font-semibold bg-[#F2EDE4] text-stone-700 px-1.5 py-0.5 rounded-md">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      {pendingCount > 0 ? (
                        <span className="text-[10px] font-bold bg-[#FEF2E2] text-[#B45309] px-2 py-0.5 rounded-full flex items-center space-x-1 border border-[#FCD34D]">
                          <Clock className="w-3 h-3" />
                          <span>{pendingCount}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#2E5A44] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#D0E5D7]">
                          Al día
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 mt-1.5 ${isSelected ? 'text-[#2E5A44]' : 'text-stone-300'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pending Requirements across Portfolio */}
          <div className="bg-[#FCFAF7] rounded-3xl border border-[#EBE3D5] shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-[#D97706]" />
                <span>Requerimientos Activos</span>
              </h3>
              <button
                onClick={() => setView?.('gestor-requirements')}
                className="text-xs text-[#2E5A44] font-semibold hover:underline"
              >
                Ver todos
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Hay {requirements.filter(r => r.status === 'pending').length} solicitudes pendientes de justificante por parte de los riders.
            </p>
          </div>
        </div>

        {/* Right Column: Selected Client Fiscal Audit File (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedClient ? (
            <div className="bg-[#FCFAF7] rounded-3xl border border-[#EBE3D5] shadow-sm overflow-hidden">
              
              {/* Client Header Info */}
              <div className="p-5 border-b border-[#E8DFC8] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-serif font-bold text-stone-900">{selectedClient.name}</h2>
                    <span className="px-2.5 py-0.5 bg-[#EBF3ED] text-[#245338] text-[10px] font-serif font-semibold rounded-full border border-[#D0E5D7]">
                      Rider Activo
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#FEF7EB] text-[#85531B] text-[10px] font-serif font-semibold rounded-full border border-[#FDE3B8]">
                      RETA: {selectedClient.socialSecurityType === 'tarifa_plana' ? 'Tarifa Plana 80€' : 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    NIF: <strong className="font-mono text-stone-800">{selectedClient.nif || '48192834K'}</strong> • IAE: <strong className="text-stone-800">{selectedClient.iaeCode || '849.5'}</strong> • Vehículo: <strong className="text-stone-800">{selectedClient.vehicleType?.toUpperCase() || 'MOTO'} ({selectedClient.vehiclePlate || '4521 LBR'})</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSwitchToClient(selectedClient)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F2EDE4] text-stone-700 border border-[#DFD5C6] text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                    title="Ver la app como este Rider"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                    <span>Ver como Rider</span>
                  </button>

                  <button
                    onClick={() => handleExportClientDossier(selectedClient)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F2EDE4] text-[#3A7596] border border-[#DFD5C6] text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                    title="Descargar libro registro y liquidaciones para inspección AEAT"
                  >
                    <Download className="w-3.5 h-3.5 text-[#3A7596]" />
                    <span>Dossier Fiscal</span>
                  </button>

                  <button
                    onClick={() => setShowReqModal(true)}
                    className="px-3.5 py-1.5 bg-[#C96846] hover:bg-[#B35534] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Pedir Documento</span>
                  </button>
                </div>
              </div>

              {/* Client Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 p-4 gap-3 bg-white border-b border-[#E8DFC8] text-center">
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                  <p className="text-[10px] uppercase font-serif font-bold text-stone-500">Facturado (3T)</p>
                  <p className="text-base font-serif font-bold text-stone-900 mt-0.5">{clientGrossIncome.toFixed(2)} €</p>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                  <p className="text-[10px] uppercase font-serif font-bold text-stone-500">Gastos Deducibles</p>
                  <p className="text-base font-serif font-bold text-[#2E5A44] mt-0.5">{clientDeductible.toFixed(2)} €</p>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                  <p className="text-[10px] uppercase font-serif font-bold text-stone-500">Rendimiento Neto</p>
                  <p className="text-base font-serif font-bold text-stone-900 mt-0.5">{clientNetYield.toFixed(2)} €</p>
                </div>
                <div className="p-3 bg-[#FEF7EB] rounded-2xl border border-[#FDE3B8]">
                  <p className="text-[10px] uppercase font-serif font-bold text-[#85531B]">Modelo 130 IRPF (20%)</p>
                  <p className="text-base font-serif font-bold text-[#85531B] mt-0.5">{clientEstimatedIRPF.toFixed(2)} €</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-[#E8DFC8] px-5 text-xs font-serif font-bold bg-[#FCFAF7]">
                <button
                  onClick={() => setActiveTab('audit_tickets')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    activeTab === 'audit_tickets'
                      ? 'border-[#2E5A44] text-[#2E5A44]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Auditoría de Tickets ({clientExpenses.length})
                </button>
                <button
                  onClick={() => setActiveTab('declarations')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    activeTab === 'declarations'
                      ? 'border-[#2E5A44] text-[#2E5A44]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Modelos Oficiales (130 / 303)
                </button>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    activeTab === 'requirements'
                      ? 'border-[#2E5A44] text-[#2E5A44]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Peticiones Enviadas ({clientRequirements.length})
                </button>
                <button
                  onClick={() => setActiveTab('census')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    activeTab === 'census'
                      ? 'border-[#2E5A44] text-[#2E5A44]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Ficha Censal 036 / 037
                </button>
              </div>

              {/* Tab 1: Auditoría de Tickets con Respaldo Fotográfico */}
              {activeTab === 'audit_tickets' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Fuel className="w-4 h-4 text-[#C96846]" />
                      <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700">
                        Comprobantes de Gasto del Cliente
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <button
                        onClick={() => setTicketFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-serif ${ticketFilter === 'all' ? 'bg-[#2E5A44] text-white font-semibold' : 'text-stone-600 hover:bg-[#F2EDE4]'}`}
                      >
                        Todos ({clientExpenses.length})
                      </button>
                      <button
                        onClick={() => setTicketFilter('pending')}
                        className={`px-2.5 py-1 rounded-lg font-serif ${ticketFilter === 'pending' ? 'bg-[#C96846] text-white font-semibold' : 'text-stone-600 hover:bg-[#F2EDE4]'}`}
                      >
                        Pendientes ({clientExpenses.filter(e => e.status === 'pending_review').length})
                      </button>
                      <button
                        onClick={() => setTicketFilter('approved')}
                        className={`px-2.5 py-1 rounded-lg font-serif ${ticketFilter === 'approved' ? 'bg-[#2E5A44] text-white font-semibold' : 'text-stone-600 hover:bg-[#F2EDE4]'}`}
                      >
                        Validados ({clientExpenses.filter(e => e.status === 'approved').length})
                      </button>
                    </div>
                  </div>

                  {/* Expense Items Table */}
                  <div className="divide-y divide-[#EBE4D8] border border-[#E8DFC8] rounded-2xl overflow-hidden bg-white">
                    {clientExpenses
                      .filter(e => ticketFilter === 'all' || e.status === ticketFilter)
                      .map((exp) => {
                        const isApproved = exp.status === 'approved';
                        const isPending = exp.status === 'pending_review';
                        const isRejected = exp.status === 'rejected';

                        return (
                          <div key={exp.id} className="p-3.5 hover:bg-[#FAF7F2] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              {/* Ticket Photo Thumbnail */}
                              {exp.receiptUrl ? (
                                <button
                                  onClick={() => { setZoomReceipt(exp); setReceiptZoomLevel(1); }}
                                  className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#DFD5C6] overflow-hidden relative group shrink-0"
                                  title="Click para ampliar comprobante original"
                                >
                                  <img 
                                    src={exp.receiptUrl} 
                                    alt="Ticket" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                    <Eye size={14} />
                                  </div>
                                </button>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-dashed border-[#DFD5C6] flex flex-col items-center justify-center text-stone-400 shrink-0">
                                  <FileText size={16} />
                                  <span className="text-[8px] font-serif">Sin foto</span>
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs font-serif font-bold text-stone-900 truncate">
                                    {exp.merchant || exp.category}
                                  </p>
                                  <span className="text-[10px] text-stone-500 font-mono">{exp.date}</span>
                                </div>
                                <p className="text-[11px] text-stone-500 truncate">
                                  {exp.notes || exp.category} {exp.vatAmount ? `• IVA 21%: ${exp.vatAmount.toFixed(2)}€` : ''}
                                </p>
                                
                                <div className="flex items-center space-x-2 mt-1">
                                  {isApproved && (
                                    <span className="px-2 py-0.5 bg-[#EBF3ED] text-[#245338] text-[9px] font-serif font-semibold rounded-md flex items-center space-x-1 border border-[#D0E5D7]">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Validado AEAT ({exp.deductiblePercentage ?? 100}%)</span>
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="px-2 py-0.5 bg-[#FEF7EB] text-[#85531B] text-[9px] font-serif font-semibold rounded-md flex items-center space-x-1 border border-[#FDE3B8]">
                                      <Clock className="w-3 h-3" />
                                      <span>Pendiente Auditoría</span>
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="px-2 py-0.5 bg-[#FAF3EE] text-[#C96846] text-[9px] font-serif font-semibold rounded-md flex items-center space-x-1 border border-[#EAD6C9]">
                                      <X className="w-3 h-3" />
                                      <span>Rechazado</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount & Audit Buttons */}
                            <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-serif font-bold text-stone-900">{exp.amount.toFixed(2)} €</p>
                                <p className="text-[10px] text-stone-400 font-mono">Base: {(exp.amount / 1.21).toFixed(2)} €</p>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleAuditAction(exp.id, 'approved', 100)}
                                  className={`p-2 rounded-xl text-xs font-serif font-semibold transition-all active:scale-95 ${
                                    isApproved && exp.deductiblePercentage === 100
                                      ? 'bg-[#2E5A44] text-white shadow-sm'
                                      : 'bg-[#EBF3ED] text-[#245338] hover:bg-[#D4E8DC]'
                                  }`}
                                  title="Validar 100% deducible IRPF e IVA"
                                >
                                  <Check size={14} />
                                </button>

                                <button
                                  onClick={() => handleAuditAction(exp.id, 'approved', 50)}
                                  className={`px-2 py-1.5 rounded-xl text-[10px] font-serif font-semibold transition-all active:scale-95 ${
                                    isApproved && exp.deductiblePercentage === 50
                                      ? 'bg-[#3A7596] text-white shadow-sm'
                                      : 'bg-[#F2F7F9] text-[#3A7596] hover:bg-[#E3EFF4]'
                                  }`}
                                  title="Validar 50% deducible"
                                >
                                  50%
                                </button>

                                <button
                                  onClick={() => handleAuditAction(exp.id, 'rejected', 0)}
                                  className={`p-2 rounded-xl text-xs font-serif font-semibold transition-all active:scale-95 ${
                                    isRejected
                                      ? 'bg-[#C96846] text-white shadow-sm'
                                      : 'bg-[#FAF3EE] text-[#C96846] hover:bg-[#F2DDD3]'
                                  }`}
                                  title="Rechazar deducción"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {clientExpenses.length === 0 && (
                      <div className="p-8 text-center text-stone-400 text-xs font-serif">
                        Este rider no tiene gastos registrados en el periodo seleccionado.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Modelos Oficiales 130 y 303 */}
              {activeTab === 'declarations' && (
                <div className="p-5">
                  <TaxDeclarationsViewer />
                </div>
              )}

              {/* Tab 3: Requerimientos enviados */}
              {activeTab === 'requirements' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700">
                      Requerimientos y Subsanaciones Solicitadas
                    </h3>
                    <button
                      onClick={() => setShowReqModal(true)}
                      className="px-3.5 py-1.5 bg-[#C96846] hover:bg-[#B35534] text-white text-xs font-serif font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Plus size={14} />
                      <span>Nueva Petición</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {clientRequirements.map(req => (
                      <div key={req.id} className="p-3.5 rounded-2xl border border-[#E8DFC8] bg-white flex items-center justify-between gap-3 shadow-sm">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-serif font-bold text-stone-900">{req.title}</h4>
                            <span className={`px-2 py-0.5 text-[9px] font-serif font-semibold rounded-full border ${
                              req.status === 'approved' 
                                ? 'bg-[#EBF3ED] text-[#245338] border-[#D0E5D7]' 
                                : (req.status === 'submitted' ? 'bg-[#F2F7F9] text-[#3A7596] border-[#D5E3E8]' : 'bg-[#FEF7EB] text-[#85531B] border-[#FDE3B8]')
                            }`}>
                              {req.status === 'approved' ? 'Aprobado' : (req.status === 'submitted' ? 'Subsanado por Rider' : 'Pendiente')}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5">{req.description}</p>
                          <p className="text-[10px] text-stone-400 mt-1 font-mono">Plazo: {req.deadline} • Periodo: {req.quarter}</p>
                        </div>

                        {req.submittedProof && (
                          <a
                            href={req.submittedProof}
                            download="archivo_rider.png"
                            className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#F2EDE4] border border-[#DFD5C6] text-stone-700 text-[11px] font-serif font-semibold rounded-xl flex items-center space-x-1 shrink-0 transition-colors"
                          >
                            <Download size={12} />
                            <span>Ver Archivo</span>
                          </a>
                        )}
                      </div>
                    ))}

                    {clientRequirements.length === 0 && (
                      <div className="p-8 text-center text-stone-400 text-xs font-serif">
                        No hay requerimientos pendientes para este rider.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Ficha Censal */}
              {activeTab === 'census' && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-white rounded-2xl border border-[#E8DFC8] space-y-2 shadow-sm">
                      <p className="font-serif font-bold text-stone-700 uppercase tracking-wider text-[10px]">Identificación Censal</p>
                      <p><span className="text-stone-500">Nombre Completo:</span> <strong className="text-stone-900 font-serif">{selectedClient.name}</strong></p>
                      <p><span className="text-stone-500">NIF / NIE:</span> <strong className="font-mono text-stone-900">{selectedClient.nif || '48192834K'}</strong></p>
                      <p><span className="text-stone-500">Domicilio Fiscal:</span> <strong className="text-stone-900">Madrid, España</strong></p>
                      <p><span className="text-stone-500">Epígrafe IAE:</span> <strong className="text-stone-900">{selectedClient.iaeCode || '849.5 (Mensajería)'}</strong></p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-[#E8DFC8] space-y-2 shadow-sm">
                      <p className="font-serif font-bold text-stone-700 uppercase tracking-wider text-[10px]">Vehículo y Régimen</p>
                      <p><span className="text-stone-500">Vehículo Afecto:</span> <strong className="text-stone-900">{selectedClient.vehicleType?.toUpperCase() || 'MOTO'}</strong></p>
                      <p><span className="text-stone-500">Matrícula Registrada:</span> <strong className="font-mono text-stone-900">{selectedClient.vehiclePlate || '4521 LBR'}</strong></p>
                      <p><span className="text-stone-500">Régimen Seguridad Social:</span> <strong className="text-stone-900">{selectedClient.socialSecurityType === 'tarifa_plana' ? 'Tarifa Plana RETA (80€)' : 'Cotización Tramos'}</strong></p>
                      <p><span className="text-stone-500">Plataformas Activas:</span> <strong className="text-stone-900">{selectedClient.platforms.join(', ')}</strong></p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8DFC8] p-12 text-center text-stone-400 font-serif">
              Selecciona un cliente de la lista para auditar sus comprobantes.
            </div>
          )}
        </div>

      </div>

      {/* Zoom Ticket Modal */}
      {zoomReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FCFAF7] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#E8DFC8]">
            <div className="p-4 border-b border-[#E8DFC8] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Comprobante: {zoomReceipt.merchant || zoomReceipt.category}
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {zoomReceipt.date} • {zoomReceipt.amount.toFixed(2)} € (IVA 21%: {(zoomReceipt.vatAmount || 0).toFixed(2)} €)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReceiptZoomLevel(z => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-[#EBE4D8] rounded-xl text-stone-600 transition-colors"
                  title="Alejar"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono font-bold text-stone-700">{Math.round(receiptZoomLevel * 100)}%</span>
                <button
                  onClick={() => setReceiptZoomLevel(z => Math.min(3, z + 0.25))}
                  className="p-1.5 hover:bg-[#EBE4D8] rounded-xl text-stone-600 transition-colors"
                  title="Acercar"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setReceiptZoomLevel(1)}
                  className="p-1.5 hover:bg-[#EBE4D8] rounded-xl text-stone-600 transition-colors"
                  title="Restablecer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setZoomReceipt(null)}
                  className="p-1.5 hover:bg-[#FAF3EE] hover:text-[#C96846] rounded-xl text-stone-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#23332B] flex items-center justify-center min-h-[350px]">
              {zoomReceipt.receiptUrl ? (
                <img 
                  src={zoomReceipt.receiptUrl} 
                  alt="Ticket original" 
                  style={{ transform: `scale(${receiptZoomLevel})` }}
                  className="max-w-full max-h-[60vh] object-contain transition-transform duration-150 rounded-lg shadow-md"
                />
              ) : (
                <p className="text-stone-300 text-xs font-serif">No hay imagen adjunta para este gasto.</p>
              )}
            </div>

            <div className="p-4 border-t border-[#E8DFC8] bg-[#FAF7F2] flex items-center justify-between">
              <span className="text-xs text-stone-500 font-serif">
                Verifica NIF del emisor, desglose del 21% de IVA y matrícula si es combustible.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleAuditAction(zoomReceipt.id, 'approved', 100);
                    setZoomReceipt(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#2E5A44] hover:bg-[#234735] text-white rounded-xl text-xs font-serif font-semibold shadow-sm transition-all"
                >
                  Validar 100%
                </button>
                <button
                  onClick={() => {
                    handleAuditAction(zoomReceipt.id, 'rejected', 0);
                    setZoomReceipt(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#C96846] hover:bg-[#B35534] text-white rounded-xl text-xs font-serif font-semibold shadow-sm transition-all"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Requirement Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FCFAF7] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8DFC8]">
            <div className="p-5 border-b border-[#E8DFC8] flex items-center justify-between bg-[#FAF7F2]">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-[#C96846]" />
                <span>Pedir Documento a {selectedClient?.name}</span>
              </h3>
              <button onClick={() => setShowReqModal(false)} className="text-stone-400 hover:text-stone-600 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequirementForClient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">Título de la petición</label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="Ej: Foto del ticket de Cepsa del 12/09"
                  className="w-full text-xs p-2.5 border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">Categoría</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-900 font-serif"
                >
                  <option value="fuel_receipt">Ticket de combustible / Gasolinera</option>
                  <option value="platform_invoice">Factura o extracto de Uber / Glovo / Just Eat</option>
                  <option value="social_security">Recibo de Cuota de Autónomos (RETA)</option>
                  <option value="vat_correction">Aclaración de IVA o CIF incorrecto</option>
                  <option value="other">Otro documento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">Instrucciones para el rider</label>
                <textarea
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Ej: La foto subida está borrosa y no se aprecia el NIF de la gasolinera ni el desglose del 21% de IVA."
                  className="w-full text-xs p-2.5 border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-900 h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">Fecha límite de respuesta</label>
                <input
                  type="date"
                  value={reqDeadline}
                  onChange={(e) => setReqDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-900 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 border border-[#DFD5C6] text-stone-600 rounded-xl text-xs font-serif font-semibold hover:bg-[#FAF7F2] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2E5A44] hover:bg-[#234735] text-white rounded-xl text-xs font-serif font-semibold shadow-sm transition-all"
                >
                  Enviar Requerimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerDashboard;
