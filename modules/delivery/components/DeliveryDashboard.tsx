
import React, { useState } from 'react';
import { useCountry } from '../../../contexts/CountryContext';
import { Package, MapPin, Clock, AlertCircle, Navigation, AlertTriangle, FileWarning, Camera, CheckCircle2, UserPlus, X, ChevronRight, Filter, Map as MapIcon, List, PlusCircle } from 'lucide-react';
import LiveMap from '../../../components/LiveMap';

interface Incident {
  id: string;
  orderId: string;
  reason: 'accident' | 'weather' | 'customer_absent' | 'restaurant_delay' | 'damage' | 'other';
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  evidenceUrl?: string; // Mock base64 or url
  assignedTo?: string; // Manager Name
  timestamp: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export const DeliveryDashboard: React.FC = () => {
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<'orders' | 'incidents'>('orders');
  const [incidentViewMode, setIncidentViewMode] = useState<'active' | 'history'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Incident Reporting State
  const [isReportingOrder, setIsReportingOrder] = useState<string | null>(null);
  const [newIncidentForm, setNewIncidentForm] = useState({ reason: 'other', description: '', evidence: false });

  // Mock Data with Platform field
  const [orders] = useState([
    { id: 'ORD-982', status: 'En ruta', customer: 'Restaurante Tico', address: 'Av. Principal 123', eta: '12 min', value: 15.50, platform: 'Uber Eats' },
    { id: 'ORD-983', status: 'Pendiente', customer: 'Burger King', address: 'Calle 45', eta: '25 min', value: 8.20, platform: 'Glovo' },
    { id: 'ORD-984', status: 'Entregado', customer: 'Farmacia 24h', address: 'Plaza Mayor', eta: '-', value: 12.00, platform: 'Stuart' },
    { id: 'ORD-985', status: 'En ruta', customer: 'Sushi Shop', address: 'Gran Vía 40', eta: '5 min', value: 24.50, platform: 'Just Eat' },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    { 
      id: 'INC-001', 
      orderId: 'ORD-980', 
      reason: 'customer_absent', 
      description: 'Cliente no contesta tras 10 min de espera.', 
      status: 'pending', 
      timestamp: new Date(Date.now() - 86400000).toISOString() 
    },
    { 
      id: 'INC-002', 
      orderId: 'ORD-975', 
      reason: 'damage', 
      description: 'El paquete se mojó por lluvia intensa.', 
      status: 'resolved', 
      assignedTo: 'Soporte Nivel 2',
      evidenceUrl: 'mock_img',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      resolutionNotes: 'Se reembolsó al cliente y se bonificó al rider.',
      resolvedAt: new Date(Date.now() - 170000000).toISOString()
    }
  ]);

  // --- Actions ---

  const handleReportSubmit = () => {
    if (!isReportingOrder) return;
    
    const newIncident: Incident = {
      id: `INC-${Math.floor(Math.random() * 1000)}`,
      orderId: isReportingOrder,
      reason: newIncidentForm.reason as any,
      description: newIncidentForm.description,
      status: 'pending',
      evidenceUrl: newIncidentForm.evidence ? 'mock_evidence_url' : undefined,
      timestamp: new Date().toISOString()
    };

    setIncidents([newIncident, ...incidents]);
    setIsReportingOrder(null);
    setNewIncidentForm({ reason: 'other', description: '', evidence: false });
    setActiveTab('incidents'); // Auto switch to track it
  };

  const handleAssignManager = (id: string) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status: 'in_progress', assignedTo: 'Gestor Asignado' } : inc
    ));
  };

  const handleResolve = (id: string) => {
    const note = prompt("Nota de resolución (opcional):", "Incidencia resuelta satisfactoriamente.");
    if (note === null) return; // Cancelled

    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status: 'resolved', resolutionNotes: note, resolvedAt: new Date().toISOString() } : inc
    ));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-red-50 text-red-600 border-red-100';
      case 'in_progress': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'resolved': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      accident: 'Accidente',
      weather: 'Clima Adverso',
      customer_absent: 'Cliente Ausente',
      restaurant_delay: 'Retraso Restaurante',
      damage: 'Producto Dañado',
      other: 'Otro'
    };
    return labels[reason] || reason;
  };

  const activeOrders = orders.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado');
  
  // Filter incidents by tab
  const filteredIncidents = incidents.filter(inc => {
    if (incidentViewMode === 'active') return inc.status !== 'resolved';
    return inc.status === 'resolved';
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Package className="text-orange-500" /> Delivery Suite
          </h2>
          <p className="text-gray-500 mt-1">Gestión operativa en {selectedCountry.display_name}.</p>
        </div>
        
        <div className="flex gap-4">
          {/* Main Tabs */}
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
             <button 
               onClick={() => setActiveTab('orders')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <Package size={16} /> Pedidos
             </button>
             <button 
               onClick={() => setActiveTab('incidents')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'incidents' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <AlertTriangle size={16} /> Incidencias 
               {incidents.filter(i => i.status === 'pending').length > 0 && (
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
               )}
             </button>
          </div>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          
          {/* Sub-tabs for View Mode */}
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Tracking en Tiempo Real
               </h3>
               {/* Shortcut to Integrations */}
               <a href="#" className="hidden md:flex text-xs font-bold text-[#2D6CDF] bg-blue-50 px-3 py-1 rounded-full items-center gap-1 hover:bg-blue-100 transition-colors">
                 <PlusCircle size={12} /> Configurar Apps
               </a>
             </div>
             
             <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Vista Lista"
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Vista Mapa"
                >
                  <MapIcon size={18} />
                </button>
             </div>
          </div>

          {viewMode === 'map' ? (
            <LiveMap 
              orders={activeOrders} 
              mapConfig={selectedCountry.map_config}
            />
          ) : (
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Listado de Pedidos</h3>
                  <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{orders.length} en total</span>
               </div>
               <div className="divide-y divide-gray-50">
                  {orders.map(order => (
                     <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              order.status === 'En ruta' ? 'bg-blue-100 text-blue-600' : 
                              order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                           }`}>
                              <Package size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900">{order.customer}</p>
                                {order.platform && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{order.platform}</span>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                 <MapPin size={12} /> {order.address}
                                 <span className="text-gray-300">|</span>
                                 <span className="font-mono">{order.id}</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                           <div className="text-right">
                              <p className="font-bold text-gray-900">{order.value.toFixed(2)} {selectedCountry.currency_symbol}</p>
                              <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mt-1">
                                 <Clock size={12} /> {order.eta}
                              </div>
                           </div>
                           <button 
                             onClick={() => setIsReportingOrder(order.id)}
                             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                             title="Reportar Incidencia"
                           >
                             <AlertTriangle size={20} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          {/* Incidents Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
               <span className="text-xs font-bold text-red-400 uppercase">Pendientes</span>
               <p className="text-2xl font-bold text-red-600">{incidents.filter(i => i.status === 'pending').length}</p>
             </div>
             <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
               <span className="text-xs font-bold text-orange-400 uppercase">En Progreso</span>
               <p className="text-2xl font-bold text-orange-600">{incidents.filter(i => i.status === 'in_progress').length}</p>
             </div>
             <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
               <span className="text-xs font-bold text-green-400 uppercase">Resueltas</span>
               <p className="text-2xl font-bold text-green-600">{incidents.filter(i => i.status === 'resolved').length}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
               <div className="flex items-center gap-2">
                 <Filter size={16} /> <span className="text-sm font-bold">Filtros</span>
               </div>
             </div>
          </div>

          {/* History / Active Tabs */}
          <div className="flex gap-4 border-b border-gray-200 pb-1">
             <button 
               onClick={() => setIncidentViewMode('active')}
               className={`text-sm font-bold pb-2 px-2 transition-colors ${incidentViewMode === 'active' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Activas ({incidents.filter(i => i.status !== 'resolved').length})
             </button>
             <button 
               onClick={() => setIncidentViewMode('history')}
               className={`text-sm font-bold pb-2 px-2 transition-colors ${incidentViewMode === 'history' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
             >
               Historial Resuelto
             </button>
          </div>

          {/* Incidents List */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
             {filteredIncidents.length === 0 ? (
               <div className="p-12 text-center text-gray-400">
                 <CheckCircle2 size={48} className="mx-auto mb-4 text-green-100" />
                 <p>No hay incidencias {incidentViewMode === 'active' ? 'activas' : 'en el historial'}.</p>
               </div>
             ) : (
               <div className="divide-y divide-gray-50">
                 {filteredIncidents.map(inc => (
                   <div key={inc.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                         <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                               <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(inc.status)}`}>
                                 {inc.status === 'in_progress' ? 'En Revisión' : inc.status === 'pending' ? 'Pendiente' : 'Resuelta'}
                               </span>
                               <span className="text-xs text-gray-400 font-mono">{inc.id}</span>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(inc.timestamp).toLocaleDateString()}</span>
                         </div>
                         
                         <h4 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                           {getReasonLabel(inc.reason)} 
                           <span className="text-sm font-normal text-gray-500">sobre pedido <span className="font-mono font-bold text-gray-700">{inc.orderId}</span></span>
                         </h4>
                         
                         <p className="text-sm text-gray-600 mb-3">{inc.description}</p>
                         
                         <div className="flex flex-wrap items-center gap-4">
                            {inc.evidenceUrl && (
                              <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                <Camera size={12} /> Evidencia adjunta
                              </span>
                            )}
                            {inc.assignedTo && (
                              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                <UserPlus size={12} /> {inc.assignedTo}
                              </span>
                            )}
                         </div>

                         {/* Resolution Note */}
                         {inc.resolutionNotes && (
                           <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 animate-in fade-in">
                              <p className="text-xs font-bold text-green-800 uppercase mb-1 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Resolución ({new Date(inc.resolvedAt!).toLocaleDateString()})
                              </p>
                              <p className="text-sm text-green-700">{inc.resolutionNotes}</p>
                           </div>
                         )}
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                         {inc.status === 'pending' && (
                           <button 
                             onClick={() => handleAssignManager(inc.id)}
                             className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                           >
                             <UserPlus size={14} /> Asignar
                           </button>
                         )}
                         {inc.status !== 'resolved' && (
                           <button 
                             onClick={() => handleResolve(inc.id)}
                             className="flex-1 px-4 py-2 bg-[#2D6CDF] text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                           >
                             <CheckCircle2 size={14} /> Resolver
                           </button>
                         )}
                         <button className="flex-1 px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold flex items-center justify-center gap-1">
                           Ver Detalles <ChevronRight size={14} />
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      )}

      {/* Reporting Modal */}
      {isReportingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl p-6 animate-in slide-in-from-bottom-10 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                   <FileWarning className="text-red-500" /> Nueva Incidencia
                 </h3>
                 <button onClick={() => setIsReportingOrder(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                   <X size={20} />
                 </button>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pedido Afectado</label>
                    <input type="text" disabled value={isReportingOrder} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-mono text-gray-600" />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo</label>
                    <select 
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-red-500"
                      value={newIncidentForm.reason}
                      onChange={e => setNewIncidentForm({...newIncidentForm, reason: e.target.value})}
                    >
                       <option value="accident">Accidente / Avería</option>
                       <option value="weather">Clima Adverso</option>
                       <option value="customer_absent">Cliente Ausente</option>
                       <option value="restaurant_delay">Retraso Restaurante</option>
                       <option value="damage">Producto Dañado</option>
                       <option value="other">Otro</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                    <textarea 
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-red-500 min-h-[100px]"
                      placeholder="Describe qué ha pasado..."
                      value={newIncidentForm.description}
                      onChange={e => setNewIncidentForm({...newIncidentForm, description: e.target.value})}
                    ></textarea>
                 </div>

                 <button 
                   onClick={() => setNewIncidentForm(prev => ({...prev, evidence: !prev.evidence}))}
                   className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                     newIncidentForm.evidence 
                       ? 'border-green-500 bg-green-50 text-green-700' 
                       : 'border-gray-200 text-gray-400 hover:border-gray-300'
                   }`}
                 >
                   <Camera size={18} />
                   {newIncidentForm.evidence ? 'Evidencia Adjuntada (Mock)' : 'Adjuntar Foto / Evidencia'}
                 </button>

                 <div className="flex gap-3 mt-2">
                    <button 
                      onClick={() => setIsReportingOrder(null)} 
                      className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleReportSubmit}
                      className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700"
                    >
                      Registrar Incidencia
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
