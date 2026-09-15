
import React from 'react';
import { CloudRain, TrendingDown, Wrench, AlertTriangle, Wind } from 'lucide-react';

export const RiskMonitor: React.FC = () => {
  // Mocked risks
  const risks = [
    { type: 'weather', level: 'medium', message: 'Lluvia ligera esperada a las 18:00.', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'demand', level: 'high', message: 'Baja demanda detectada en Zona Norte.', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { type: 'maintenance', level: 'low', message: 'Revisa presión de neumáticos.', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
    { type: 'wind', level: 'critical', message: 'Rachas de viento > 40km/h.', icon: Wind, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
         <AlertTriangle className="text-orange-500" /> Centro de Riesgos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {risks.map((risk, idx) => (
           <div key={idx} className={`p-5 rounded-[24px] border border-gray-100 flex items-start gap-4 ${risk.bg}`}>
              <div className={`p-3 rounded-xl bg-white shadow-sm ${risk.color}`}>
                 <risk.icon size={24} />
              </div>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/50 ${risk.color}`}>
                      Riesgo {risk.level}
                    </span>
                 </div>
                 <p className="font-bold text-gray-800 leading-tight">{risk.message}</p>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
