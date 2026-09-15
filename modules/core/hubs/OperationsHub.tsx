
import React, { useState } from 'react';
import { Truck, AlertTriangle, Zap, Map } from 'lucide-react';
import { DeliveryDashboard } from '../../delivery/components/DeliveryDashboard';
import { RiskMonitor } from '../../risks/components/RiskMonitor';
import { HotZonesWidget } from '../../hot-zones/components/HotZonesWidget';
import { RouteOptimizer } from '../../routes/components/RouteOptimizer';

export const OperationsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'risks' | 'planning'>('delivery');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Truck className="text-orange-500" /> Operations Center
          </h2>
          <p className="text-gray-500">Monitorización de flota, riesgos y rutas.</p>
        </div>

        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'delivery' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Map size={16} /> Live Delivery
          </button>
          <button 
            onClick={() => setActiveTab('risks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'risks' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <AlertTriangle size={16} /> Riesgos
          </button>
          <button 
            onClick={() => setActiveTab('planning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'planning' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Zap size={16} /> Planificación
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'delivery' && <DeliveryDashboard />}
        
        {activeTab === 'risks' && (
          <div className="space-y-6">
            <RiskMonitor />
            <div className="p-6 bg-red-50 rounded-[24px] border border-red-100">
              <h3 className="font-bold text-red-800 mb-2">Protocolos de Emergencia</h3>
              <p className="text-sm text-red-700">En caso de accidente mayor, activa el protocolo SOS desde la App Móvil.</p>
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <HotZonesWidget />
             <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                <RouteOptimizer />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
