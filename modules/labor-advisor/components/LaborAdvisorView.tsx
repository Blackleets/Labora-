
import React from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Shield, FileText, AlertTriangle, CheckCircle2, Info, Landmark, BadgeCheck, BookOpen } from 'lucide-react';

export const LaborAdvisorView: React.FC = () => {
  const config = useCountryConfig();
  const advice = config.labor_advisor;

  if (!advice) {
    return (
      <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100">
        <Info size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900">Asesor no disponible</h3>
        <p className="text-gray-500 mt-2">No hay datos legales configurados para {config.display_name}.</p>
      </div>
    );
  }

  const FlagIcon = () => (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg shadow-sm border border-gray-200 overflow-hidden">
      {config.country_code === 'ES' ? '🇪🇸' : config.country_code === 'MX' ? '🇲🇽' : '🌍'}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <div className="flex items-center gap-3 mb-2">
                 <BadgeCheck className="text-[#2D6CDF]" />
                 <p className="text-xs font-bold text-[#2D6CDF] uppercase tracking-wider">Asesor Laboral Automático</p>
               </div>
               <h2 className="text-3xl font-bold text-[#1A1A1A]">Tu Guía Fiscal en {config.display_name}</h2>
               <p className="text-gray-500 mt-1 max-w-lg">
                 Información legal adaptada a las normativas de {advice.tax_entity_name} para repartidores y autónomos.
               </p>
            </div>
            <FlagIcon />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Status & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Registration Steps */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
               <CheckCircle2 className="text-green-600" /> Requisitos de Alta
             </h3>
             <div className="space-y-3">
               {advice.registration_steps.map((step, idx) => (
                 <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="bg-white p-1 rounded-full border border-gray-200 mt-0.5 shadow-sm">
                      <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-relaxed">{step}</span>
                 </div>
               ))}
             </div>
          </div>

          {/* 2. Tax Obligations */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Landmark className="text-[#7B3FE4]" /> Obligaciones Fiscales
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advice.tax_obligations.map((obl, idx) => (
                   <div 
                     key={idx} 
                     className={`p-4 rounded-xl border-l-4 ${
                       obl.severity === 'critical' ? 'bg-red-50 border-red-500' : 
                       obl.severity === 'warning' ? 'bg-orange-50 border-orange-500' : 
                       'bg-blue-50 border-blue-500'
                     }`}
                   >
                      <h4 className={`font-bold text-sm ${
                         obl.severity === 'critical' ? 'text-red-800' : 
                         obl.severity === 'warning' ? 'text-orange-800' : 
                         'text-blue-800'
                      }`}>{obl.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{obl.description}</p>
                   </div>
                ))}
             </div>
          </div>

          {/* 3. Contract Types */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
               <FileText className="text-gray-600" /> Modalidades de Contrato
             </h3>
             <div className="divide-y divide-gray-50">
               {advice.contract_types.map((contract, idx) => (
                 <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                       <h4 className="font-bold text-gray-800">{contract.title}</h4>
                       {contract.severity === 'critical' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recomendado</span>}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{contract.description}</p>
                 </div>
               ))}
             </div>
          </div>

        </div>

        {/* Right Column: Summary & Recommendations */}
        <div className="space-y-6">
          
          {/* Recommended Retention Card */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2c3e50] text-white rounded-[24px] p-6 shadow-lg">
             <div className="flex items-center gap-2 mb-2 opacity-80">
                <Shield size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Estrategia Labora+</span>
             </div>
             <h3 className="text-lg font-bold mb-1">Retención Recomendada</h3>
             <div className="text-4xl font-bold text-[#2ECC71] my-3">
               {(advice.recommended_retention_pct * 100).toFixed(1)}%
             </div>
             <p className="text-sm text-gray-300 leading-relaxed mb-4">
               Te sugerimos guardar este porcentaje de cada ingreso para evitar sorpresas con {advice.tax_entity_name}.
             </p>
             <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">
               Ajustar en Calculadora
             </button>
          </div>

          {/* Warning Note */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-[24px] p-5">
             <div className="flex gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
                <div>
                   <h4 className="font-bold text-yellow-800 text-sm">Importante</h4>
                   <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                     {advice.freelancer_threshold_note}
                   </p>
                </div>
             </div>
          </div>

          {/* Didactic Resources */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
             <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen size={16} /> Recursos Oficiales
             </h3>
             <ul className="space-y-2">
                <li>
                  <a href="#" className="text-xs font-medium text-[#2D6CDF] hover:underline flex items-center gap-1">
                    • Web oficial de {advice.tax_entity_name}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs font-medium text-[#2D6CDF] hover:underline flex items-center gap-1">
                    • Calendario Fiscal 2024
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs font-medium text-[#2D6CDF] hover:underline flex items-center gap-1">
                    • Guía Rider {config.country_code} (PDF)
                  </a>
                </li>
             </ul>
          </div>

        </div>
      </div>
    </div>
  );
};
