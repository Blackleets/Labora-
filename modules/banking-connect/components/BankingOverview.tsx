
import React from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { useData } from '../../../contexts/DataContext';
import { Clock, CreditCard, Zap, Building2, Info, Banknote } from 'lucide-react';
import LogoResolver from '../../../components/LogoResolver';

export const BankingOverview: React.FC = () => {
  const config = useCountryConfig();
  const { currentUser } = useData();
  
  if (!config.banking_metadata) return null;
  
  const { banking_metadata: meta } = config;
  const userPlatforms = currentUser?.platforms || []; 
  
  // Helper to match platform names broadly
  const getPlatformInfo = (pName: string) => {
    const key = Object.keys(meta.platform_payouts).find(k => pName.toLowerCase().includes(k.toLowerCase()));
    return key ? meta.platform_payouts[key] : null;
  };

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-[#2D6CDF]" size={20} />
            Infraestructura Bancaria: {config.display_name}
        </h3>
        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
            <Zap size={12} />
            {meta.instant_payment_options[0]?.name} Ready
        </div>
      </div>

      {/* General Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                <Clock size={12} /> Depósito Std.
            </p>
            <p className="font-bold text-gray-800 text-sm mt-1 leading-tight">{meta.deposit_time_standard}</p>
         </div>
         <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                <Zap size={12} className="text-yellow-500" /> Pago Instant
            </p>
            <p className="font-bold text-gray-800 text-sm mt-1 leading-tight">{meta.deposit_time_instant || 'N/A'}</p>
         </div>
         <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                <Banknote size={12} /> Fee Promedio
            </p>
            <p className="font-bold text-gray-800 text-sm mt-1 leading-tight">{meta.avg_transfer_fee} {config.currency_symbol}</p>
         </div>
         <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bancos Top</p>
            <div className="flex -space-x-2">
               {meta.compatible_banks.slice(0,4).map((b, i) => (
                 <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center p-0.5" title={b.name}>
                    <LogoResolver 
                      id={b.name.toLowerCase().replace(/\s/g, '_')} 
                      name={b.name} 
                      // Banking metadata in country config has 'logo' as full URL, we extract domain roughly
                      domain={b.logo.replace('https://logo.clearbit.com/', '')} 
                      category="banking"
                      size="sm"
                    />
                 </div>
               ))}
               {meta.compatible_banks.length > 4 && (
                 <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                   +{meta.compatible_banks.length - 4}
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Platform Integration Table */}
      {userPlatforms.length > 0 ? (
        <div>
           <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
             <CreditCard size={16} />
             Integración con tus Plataformas
           </h4>
           <div className="space-y-3">
             {userPlatforms.map(p => {
                const payoutOptions = getPlatformInfo(p);
                if (!payoutOptions) return null;

                return (
                  <div key={p} className="border border-gray-100 rounded-xl p-4 hover:border-[#2D6CDF] transition-colors group">
                    <div className="flex items-center gap-3 mb-3">
                       <LogoResolver 
                         id={p.toLowerCase().replace(/\s/g, '_')} 
                         name={p} 
                         domain={`${p.toLowerCase().replace(/\s/g, '')}.com`}
                         category="delivery"
                         size="sm"
                         className="shadow-sm"
                       />
                       <span className="font-bold text-sm text-gray-900">{p}</span>
                    </div>
                    <div className="space-y-2">
                       {payoutOptions.map((opt, idx) => (
                         <div key={idx} className="flex justify-between items-center text-xs sm:text-sm bg-gray-50/50 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                               {opt.method.toLowerCase().includes('instant') || opt.method.toLowerCase().includes('flex') 
                                 ? <Zap size={14} className="text-yellow-500 flex-shrink-0"/> 
                                 : <CreditCard size={14} className="text-gray-400 flex-shrink-0"/>}
                               <span className="font-medium text-gray-700">{opt.method}</span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                               <span className="font-bold text-gray-900">{opt.time}</span>
                               <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${opt.fee === '0.00€' || opt.fee === '$0.00' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                 {opt.fee === '0.00€' || opt.fee === '$0.00' ? 'GRATIS' : opt.fee}
                               </span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                );
             })}
           </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 rounded-xl text-blue-700 text-sm flex items-start gap-2">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p>Configura tus plataformas en el perfil para ver los tiempos de pago específicos para ellas.</p>
        </div>
      )}

      {/* Banks List */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-3">Bancos Recomendados en {config.display_name}</h4>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
           {meta.compatible_banks.map((bank, i) => (
              <div key={i} className="min-w-[140px] p-3 border border-gray-100 rounded-xl flex flex-col items-center gap-2 hover:shadow-md transition-all cursor-pointer bg-white">
                 <LogoResolver 
                    id={bank.name.toLowerCase().replace(/\s/g, '_')} 
                    name={bank.name} 
                    domain={bank.logo.replace('https://logo.clearbit.com/', '')} 
                    category="banking"
                    size="md"
                 />
                 <p className="text-xs font-bold text-gray-700 text-center">{bank.name}</p>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${bank.type === 'neobank' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                    {bank.type === 'neobank' ? 'Digital' : 'Tradicional'}
                 </span>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};
