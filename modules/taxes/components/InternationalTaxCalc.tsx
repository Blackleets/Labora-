
import React, { useState } from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Globe, Calculator, PieChart } from 'lucide-react';

export const InternationalTaxCalc: React.FC = () => {
  const config = useCountryConfig();
  const [annualRevenue, setAnnualRevenue] = useState(24000);
  
  // Simple progressive tax calculation
  const calculateTax = (amount: number) => {
    let tax = 0;
    let remaining = amount;
    // Simplified logic for demo: Flat rate based on first bracket found or average
    // Ideally calculate progressive steps
    const effectiveRate = config.income_tax_brackets.find(b => amount < b.max)?.rate || 0.20;
    return amount * effectiveRate;
  };

  const tax = calculateTax(annualRevenue);
  const net = annualRevenue - tax;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
         <Globe className="text-[#2D6CDF]" /> Impuestos Internacionales
      </h2>
      
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
         <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
               {config.country_code === 'ES' ? '🇪🇸' : '🇲🇽'}
            </div>
            <span className="font-bold text-gray-700">Normativa: {config.display_name}</span>
         </div>

         <div className="mb-8">
            <label className="block text-sm font-bold text-gray-600 mb-2">Ingresos Brutos Anuales ({config.currency_symbol})</label>
            <input 
              type="range" min="5000" max="100000" step="1000"
              value={annualRevenue} onChange={e => setAnnualRevenue(Number(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D6CDF] mb-4"
            />
            <div className="text-4xl font-bold text-[#1A1A1A] text-center">
               {annualRevenue.toLocaleString()} {config.currency_symbol}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-2xl">
               <p className="text-xs font-bold text-red-500 uppercase mb-1">Impuestos Est.</p>
               <p className="text-xl font-bold text-red-700">{tax.toLocaleString(undefined, { maximumFractionDigits: 0 })} {config.currency_symbol}</p>
               <p className="text-[10px] text-red-400">~{(tax/annualRevenue*100).toFixed(1)}% Tipo Medio</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl md:col-span-2">
               <p className="text-xs font-bold text-green-500 uppercase mb-1">Neto Anual</p>
               <p className="text-xl font-bold text-green-700">{net.toLocaleString(undefined, { maximumFractionDigits: 0 })} {config.currency_symbol}</p>
               <p className="text-[10px] text-green-400">Disponible para vivir</p>
            </div>
         </div>
      </div>
    </div>
  );
};
