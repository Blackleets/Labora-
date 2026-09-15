
import React, { useState, useMemo } from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { comparisonEngine } from '../services/comparisonEngine';
import { SCENARIOS } from '../types';
import { Zap, TrendingUp, DollarSign, Clock, Award, ChevronRight, Info } from 'lucide-react';
import LogoResolver from '../../../components/LogoResolver';

export const ComparatorView: React.FC = () => {
  const config = useCountryConfig();
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof SCENARIOS>('standard');

  // If no specific platforms defined for country, use generic fallback or empty
  const platforms = config.platforms || [];

  const results = useMemo(() => {
    return comparisonEngine.compare(platforms, SCENARIOS[selectedScenario]);
  }, [platforms, selectedScenario]);

  if (platforms.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100">
        <Info size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900">Comparador no disponible</h3>
        <p className="text-gray-500 mt-2">No tenemos datos detallados de plataformas para {config.display_name} aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Award className="text-[#2D6CDF]" /> Comparador Pro
          </h2>
          <p className="text-gray-500 mt-1">Analiza cuál plataforma paga mejor en {config.display_name} según tu ritmo.</p>
        </div>

        <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex gap-1 shadow-sm">
          {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedScenario(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedScenario === key 
                  ? 'bg-[#1A1A1A] text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {SCENARIOS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Context */}
      <div className="bg-blue-50 p-4 rounded-[20px] border border-blue-100 flex flex-wrap gap-4 text-sm text-blue-800">
         <div className="flex items-center gap-2">
           <Zap size={16} className="text-blue-600" />
           <span className="font-bold">{SCENARIOS[selectedScenario].trips_per_hour} pedidos/h</span>
         </div>
         <div className="flex items-center gap-2">
           <TrendingUp size={16} className="text-blue-600" />
           <span className="font-bold">x{SCENARIOS[selectedScenario].surge_multiplier} Tarifa Dinámica</span>
         </div>
         <div className="flex items-center gap-2">
           <Clock size={16} className="text-blue-600" />
           <span>~{(SCENARIOS[selectedScenario].avg_duration_per_trip + SCENARIOS[selectedScenario].wait_time_per_trip)} min/pedido</span>
         </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 gap-4">
        {results.map((res, idx) => (
          <div 
            key={res.platform.id} 
            className={`relative bg-white p-6 rounded-[24px] border transition-all group ${idx === 0 ? 'border-[#2ECC71] shadow-md ring-1 ring-green-100' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
          >
            {/* Rank Number */}
            <div className="absolute -left-3 top-6 w-8 h-8 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center font-bold shadow-lg z-10">
              #{idx + 1}
            </div>

            <div className="flex flex-col md:flex-row gap-6 pl-4">
              
              {/* Platform Brand */}
              <div className="flex items-center md:flex-col md:items-start gap-4 w-full md:w-48">
                <LogoResolver 
                  id={res.platform.id} 
                  name={res.platform.name} 
                  domain={res.platform.logo_domain}
                  category="delivery"
                  size="lg"
                />
                
                <div>
                   <h3 className="text-xl font-bold text-gray-900">{res.platform.name}</h3>
                   <div className="flex flex-wrap gap-1 mt-2">
                     {res.badges.map(b => (
                       <span key={b} className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                         {b}
                       </span>
                     ))}
                   </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                
                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase mb-1">Tarifa Base</p>
                   <p className="font-medium text-gray-700">{res.platform.base_fare.toFixed(2)} {config.currency_symbol}</p>
                   <p className="text-[10px] text-gray-400">+{res.platform.rate_km.toFixed(2)}/km</p>
                </div>

                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase mb-1">Comisión</p>
                   <p className="font-medium text-red-500">{(res.platform.commission_pct * 100).toFixed(0)}%</p>
                   <p className="text-[10px] text-red-400">-{res.commission_cost.toFixed(2)} {config.currency_symbol}/h</p>
                </div>

                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase mb-1">Pago</p>
                   <p className="font-medium text-gray-700 capitalize">{res.platform.payment_speed === 'biweekly' ? 'Quincenal' : res.platform.payment_speed === 'weekly' ? 'Semanal' : 'Diario'}</p>
                   <p className="text-[10px] text-gray-400 truncate max-w-[100px]" title={res.platform.incentives_summary}>
                     {res.platform.incentives_summary}
                   </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-2 flex flex-col justify-center items-end pr-4">
                   <p className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                     <DollarSign size={12} /> Neto / Hora
                   </p>
                   <p className={`text-xl font-bold ${idx === 0 ? 'text-[#2ECC71]' : 'text-gray-900'}`}>
                     {res.effective_hourly_rate.toFixed(2)} {config.currency_symbol}
                   </p>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
         <button className="text-gray-400 hover:text-[#2D6CDF] text-sm font-bold flex items-center gap-1 transition-colors">
           Ver detalle de cálculo <ChevronRight size={16} />
         </button>
      </div>
    </div>
  );
};
