
import React, { useState, useEffect } from 'react';
import { approvalService } from '../ApprovalService';
import { ApprovalRequest } from '../../../../types';
import { useData } from '../../../../contexts/DataContext';
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle, ChevronDown, ChevronUp, User } from 'lucide-react';

export const ApprovalInbox: React.FC = () => {
  const { currentUser, showNotification } = useData();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'history'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRequests = () => {
    const all = approvalService.getAll();
    setRequests(all);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResolve = (id: string, status: 'approved' | 'rejected') => {
    if (!currentUser) return;
    try {
      approvalService.resolveRequest(id, status, currentUser.id);
      loadRequests();
      showNotification(
        status === 'approved' ? 'success' : 'info', 
        `Solicitud ${status === 'approved' ? 'Aprobada' : 'Rechazada'}`
      );
    } catch (e) {
      showNotification('error', 'Error al procesar la solicitud');
    }
  };

  const filteredRequests = requests.filter(r => 
    filter === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <CheckCircle className="text-[#2D6CDF]" /> Centro de Aprobaciones
          </h2>
          <p className="text-gray-500 mt-1">Gestiona solicitudes bloqueadas por políticas de la organización.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
           <button 
             onClick={() => setFilter('pending')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'pending' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Pendientes 
             {requests.filter(r => r.status === 'pending').length > 0 && (
               <span className="bg-red-50 text-white text-[10px] px-1.5 rounded-full">
                 {requests.filter(r => r.status === 'pending').length}
               </span>
             )}
           </button>
           <button 
             onClick={() => setFilter('history')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'history' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Historial
           </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[24px] border border-gray-100 border-dashed">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
               <FileText size={32} />
             </div>
             <p className="text-gray-400 font-bold">No hay solicitudes {filter === 'pending' ? 'pendientes' : 'en el historial'}.</p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className={`bg-white rounded-[24px] border transition-all overflow-hidden ${req.status === 'pending' ? 'border-l-4 border-l-yellow-400 border-y-gray-100 border-r-gray-100 shadow-sm' : 'border-gray-100 opacity-80'}`}>
               <div 
                 className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                 onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
               >
                  <div className="flex items-start gap-4">
                     <div className={`p-3 rounded-xl ${req.entityType === 'payroll_run' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {req.entityType === 'payroll_run' ? <FileText size={24} /> : <AlertTriangle size={24} />}
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-bold text-gray-900 text-lg capitalize">{req.entityType.replace('_', ' ')}</h3>
                           {req.status === 'pending' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Requiere Acción</span>}
                           {req.status === 'approved' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Aprobado</span>}
                           {req.status === 'rejected' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Rechazado</span>}
                        </div>
                        <p className="text-sm text-gray-500">
                           Política activada: <span className="font-bold text-gray-700">{req.policyTriggered || 'Unknown Policy'}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                           <span className="flex items-center gap-1"><Clock size={12} /> {new Date(req.createdAt).toLocaleString()}</span>
                           <span className="flex items-center gap-1"><User size={12} /> {req.requesterName}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                     {req.entityType === 'payroll_run' && (
                        <div className="text-right">
                           <p className="text-xs text-gray-400 font-bold uppercase">Total Cost</p>
                           <p className="text-xl font-bold text-gray-900">{formatCurrency(req.payload.total_cost, req.payload.currency)}</p>
                        </div>
                     )}
                     <div className={`transition-transform duration-300 ${expandedId === req.id ? 'rotate-180' : ''}`}>
                        <ChevronDown className="text-gray-400" />
                     </div>
                  </div>
               </div>

               {/* Expanded Details */}
               {expandedId === req.id && (
                 <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                       <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Detalles de la Solicitud</h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {Object.entries(req.payload).map(([key, value]) => (
                             <div key={key}>
                                <p className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                                <p className="font-bold text-gray-800">{String(value)}</p>
                             </div>
                          ))}
                       </div>
                    </div>

                    {req.status === 'pending' && (
                       <div className="flex gap-3 justify-end">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResolve(req.id, 'rejected'); }}
                            className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <XCircle size={18} /> Rechazar
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResolve(req.id, 'approved'); }}
                            className="px-6 py-3 rounded-xl bg-[#2D6CDF] text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                          >
                            <CheckCircle size={18} /> Aprobar Operación
                          </button>
                       </div>
                    )}
                    
                    {req.status !== 'pending' && (
                       <div className="text-right text-xs text-gray-400 font-mono">
                          Resuelto por: {req.resolvedBy || 'System'} el {new Date(req.resolvedAt || '').toLocaleString()}
                       </div>
                    )}
                 </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
