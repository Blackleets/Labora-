
import React from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Zap, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export const PayoutFastCheck: React.FC = () => {
  const config = useCountryConfig();
  const meta = config.banking_metadata;

  if (!meta) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
         <Zap className="text-yellow-500" /> Payout FastCheck
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(meta.platform_payouts).map(([plat, methods]) => (
           <div key={plat} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-gray-50 rounded-xl p-2 border border-gray-100 flex items-center justify-center">
                   <img src={`https://logo.clearbit.com/${plat.replace(/\s/g, '')}.com`} alt={plat} className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).style.display='none'}/>
                 </div>
                 <h3 className="font-bold text-lg capitalize">{plat}</h3>
              </div>
              
              <div className="space-y-3">
                 {methods.map((m, i) => (
                   <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-bold text-gray-700 uppercase">{m.method}</span>
                         {m.method.toLowerCase().includes('instant') && <Zap size={12} className="text-yellow-500" />}
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500 flex items-center gap-1"><Clock size={12} /> {m.time}</span>
                         <span className={`font-bold ${m.fee === '0.00€' || m.fee === '$0.00' ? 'text-green-600' : 'text-gray-900'}`}>
                           {m.fee === '0.00€' || m.fee === '$0.00' ? 'GRATIS' : m.fee}
                         </span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        ))}
      </div>

      <div className="bg-green-50 p-4 rounded-[20px] border border-green-100 flex items-center gap-3">
         <CheckCircle2 className="text-green-600" size={24} />
         <div>
            <h4 className="font-bold text-green-800 text-sm">Consejo Pro</h4>
            <p className="text-xs text-green-700">Usa bancos con SEPA Instant o SPEI para recibir tu dinero en segundos cuando retires.</p>
         </div>
      </div>
    </div>
  );
};
