
import React, { useState } from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Building, Home, Utensils, Bus, Target } from 'lucide-react';

export const CityLivingCost: React.FC = () => {
  const config = useCountryConfig();
  const cities = config.cities || [];
  const [selectedCity, setSelectedCity] = useState(cities[0]);

  if (cities.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
         <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Building className="text-[#2D6CDF]" /> Coste de Vida
         </h2>
         <select 
           className="bg-white border border-gray-200 p-2 rounded-xl text-sm font-bold outline-none"
           onChange={(e) => setSelectedCity(cities.find(c => c.name === e.target.value) || cities[0])}
         >
            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
         </select>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-4 md:col-span-2">
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Home size={18}/></div>
                     <span className="font-bold text-gray-700">Alquiler Habitación</span>
                  </div>
                  <span className="font-bold">{selectedCity?.rent_avg} {config.currency_symbol}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Utensils size={18}/></div>
                     <span className="font-bold text-gray-700">Comida Mensual</span>
                  </div>
                  <span className="font-bold">{selectedCity?.food_avg} {config.currency_symbol}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Bus size={18}/></div>
                     <span className="font-bold text-gray-700">Transporte</span>
                  </div>
                  <span className="font-bold">{selectedCity?.transport_avg} {config.currency_symbol}</span>
               </div>
            </div>

            <div className="bg-[#1A1A1A] text-white p-6 rounded-[20px] flex flex-col justify-center text-center">
               <Target className="mx-auto mb-2 text-[#2ECC71]" size={32} />
               <p className="text-xs text-gray-400 uppercase font-bold">Meta Ingresos Sugerida</p>
               <p className="text-3xl font-bold mt-1">{selectedCity?.suggested_income_goal.toLocaleString()} {config.currency_symbol}</p>
               <p className="text-xs text-gray-500 mt-2">Para vivir cómodamente en {selectedCity?.name}</p>
            </div>

         </div>
      </div>
    </div>
  );
};
