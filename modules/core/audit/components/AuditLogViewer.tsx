
import React, { useState, useEffect } from 'react';
import { auditService, AuditRecord } from '../AuditService';
import { FileText, Search, Filter, Clock, Globe, Download, User, Building, Box, Hash, RefreshCw, X } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
    org: '',
    module: '',
    country: '',
    requestId: ''
  });

  const loadLogs = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setLogs(auditService.getLogs());
      setIsLoading(false);
    }, 400);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      user: '',
      org: '',
      module: '',
      country: '',
      requestId: ''
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchUser = !filters.user || log.user_id.toLowerCase().includes(filters.user.toLowerCase());
    const matchOrg = !filters.org || (log.organization_id && log.organization_id.toLowerCase().includes(filters.org.toLowerCase()));
    const matchModule = !filters.module || log.module.toLowerCase().includes(filters.module.toLowerCase());
    const matchCountry = !filters.country || log.country_code.toLowerCase().includes(filters.country.toLowerCase());
    const matchRequest = !filters.requestId || (log.request_id && log.request_id.toLowerCase().includes(filters.requestId.toLowerCase()));
    
    let matchDate = true;
    if (filters.startDate) {
      matchDate = matchDate && new Date(log.timestamp) >= new Date(filters.startDate);
    }
    if (filters.endDate) {
      // End date inclusive (end of day)
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      matchDate = matchDate && new Date(log.timestamp) <= end;
    }

    return matchUser && matchOrg && matchModule && matchCountry && matchRequest && matchDate;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Module', 'User', 'Org', 'Country', 'Summary', 'Request ID'];
    const rows = filteredLogs.map(l => [
      l.timestamp, l.action, l.module, l.user_id, l.organization_id || '-', l.country_code, l.summary, l.request_id || '-'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <FileText className="text-[#2D6CDF]" /> Audit & Events
          </h2>
          <p className="text-gray-500 mt-1">Traza completa de eventos del sistema y cambios de estado.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadLogs} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCSV} className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black flex items-center gap-2 transition-colors">
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">
          <Filter size={14} /> Filtros de Búsqueda
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="md:col-span-1">
            <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">Rango de Fechas</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#2D6CDF] outline-none"
              />
              <input 
                type="date" 
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#2D6CDF] outline-none"
              />
            </div>
          </div>

          <div className="relative">
             <User size={14} className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-gray-400" />
             <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">Usuario</label>
             <input 
               type="text" 
               placeholder="ID o Email"
               value={filters.user}
               onChange={e => setFilters({...filters, user: e.target.value})}
               className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6CDF]"
             />
          </div>

          <div className="relative">
             <Box size={14} className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-gray-400" />
             <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">Módulo</label>
             <select 
               value={filters.module}
               onChange={e => setFilters({...filters, module: e.target.value})}
               className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6CDF] appearance-none"
             >
               <option value="">Todos</option>
               <option value="payroll">Payroll</option>
               <option value="delivery">Delivery</option>
               <option value="auth">Auth</option>
               <option value="pricing_engine">Pricing Engine</option>
             </select>
          </div>

          <div className="relative">
             <Hash size={14} className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-gray-400" />
             <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">Request ID</label>
             <input 
               type="text" 
               placeholder="req_..."
               value={filters.requestId}
               onChange={e => setFilters({...filters, requestId: e.target.value})}
               className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6CDF]"
             />
          </div>
          
          <div className="relative">
             <Globe size={14} className="absolute left-3 top-1/2 mt-3 -translate-y-1/2 text-gray-400" />
             <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">País</label>
             <input 
               type="text" 
               placeholder="ES, MX..."
               value={filters.country}
               onChange={e => setFilters({...filters, country: e.target.value})}
               className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6CDF]"
             />
          </div>

          <div className="flex items-end">
            <button 
              onClick={clearFilters}
              className="w-full py-2 bg-red-50 text-red-500 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} /> Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
               <tr>
                 <th className="px-6 py-4">Evento / Acción</th>
                 <th className="px-6 py-4">Contexto</th>
                 <th className="px-6 py-4">Usuario</th>
                 <th className="px-6 py-4">Detalles</th>
                 <th className="px-6 py-4 text-right">Timestamp</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {filteredLogs.map(log => (
                 <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${log.status === 'failure' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                       <div>
                         <p className="font-bold text-gray-900">{log.action}</p>
                         <p className="text-xs text-gray-400 font-mono">{log.request_id || log.id}</p>
                       </div>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                       <span className="inline-flex w-fit items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-purple-100">
                         {log.module}
                       </span>
                       <span className="inline-flex w-fit items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                         <Globe size={8} /> {log.country_code}
                       </span>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-gray-700">
                       <User size={14} className="text-gray-400" />
                       <span className="truncate max-w-[120px]" title={log.user_id}>{log.user_id}</span>
                     </div>
                     {log.organization_id && (
                       <div className="flex items-center gap-2 text-gray-500 text-xs mt-0.5">
                         <Building size={12} />
                         <span>{log.organization_id}</span>
                       </div>
                     )}
                   </td>
                   <td className="px-6 py-4">
                     <p className="text-gray-700 font-medium truncate max-w-xs" title={log.summary}>
                       {log.summary}
                     </p>
                     <p className="text-xs text-gray-400 font-mono mt-1 truncate max-w-xs">
                       Hash: {log.hash || 'N/A'}
                     </p>
                   </td>
                   <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">
                     {new Date(log.timestamp).toLocaleDateString()} <br/>
                     {new Date(log.timestamp).toLocaleTimeString()}
                   </td>
                 </tr>
               ))}
               {filteredLogs.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                     <Search className="mx-auto mb-2 opacity-20" size={32} />
                     <p>No se encontraron registros con los filtros actuales.</p>
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
         <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-400">
           Mostrando {filteredLogs.length} de {logs.length} eventos registrados.
         </div>
      </div>
    </div>
  );
};
