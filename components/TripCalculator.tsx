
import React, { useState, useMemo } from 'react';
import { useCountry } from '../contexts/CountryContext';
import { Car, Navigation, Clock, Zap, DollarSign, Info, Bike, Calculator, TrendingUp } from 'lucide-react';
import TooltipSlider from './TooltipSlider';

export const TripCalculator: React.FC = () => {
  const { selectedCountry } = useCountry();
  const fiscalReady = selectedCountry.knowledge.status === 'verified';
  
  // State
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>(selectedCountry.platforms?.[0]?.id || '');
  const [distance, setDistance] = useState(5); // km
  const [duration, setDuration] = useState(15); // min
  const [tripsPerHour, setTripsPerHour] = useState(2);
  const [surge, setSurge] = useState(1.0);
  const [vehicleType, setVehicleType] = useState<'moto' | 'bici' | 'coche'>('moto');

  // Find Platform
  const platform = useMemo(() => 
    selectedCountry.platforms?.find(p => p.id === selectedPlatformId) || selectedCountry.platforms?.[0], 
  [selectedPlatformId, selectedCountry]);

  // Calculations
  const results = useMemo(() => {
    if (!platform) return null;

    // 1. Single Trip Gross
    const baseFare = platform.base_fare;
    const distanceFare = distance * platform.rate_km;
    const timeFare = duration * platform.rate_min;
    
    let tripGross = (baseFare + distanceFare + timeFare) * surge;
    // Apply min fare
    tripGross = Math.max(tripGross, selectedCountry.min_fare * surge);

    // 2. Hourly Gross
    const hourlyGross = tripGross * tripsPerHour;

    // 3. Costs (Commission)
    const commission = hourlyGross * platform.commission_pct;

    // 4. Costs (Vehicle - Estimate)
    // Fuel: Assume 4L/100km for moto, 7L for car, 0 for bike
    let fuelConsumption = 0;
    if (vehicleType === 'moto') fuelConsumption = 3.5;
    if (vehicleType === 'coche') fuelConsumption = 7.0;
    
    const kmPerHour = distance * tripsPerHour;
    const fuelCostPerHour = (fuelConsumption / 100) * kmPerHour * selectedCountry.avg_fuel_price;
    
    // Maint Estimate: ~0.05 per km for moto
    const maintCostPerHour = kmPerHour * (vehicleType === 'bici' ? 0.02 : 0.05);

    const totalExpenses = commission + fuelCostPerHour + maintCostPerHour;

    // 5. Taxes (Simplified progressive on hourly rate extrapolated to month)
    const monthlyNetPreTax = (hourlyGross - totalExpenses) * 160; // 160h month
    // Simple bracket check
    const bracket = selectedCountry.income_tax_brackets.find(b => (monthlyNetPreTax * 12) < b.max);
    const taxRate = bracket ? bracket.rate : 0.20;
    
    const taxPerHour = Math.max(0, (hourlyGross - totalExpenses) * taxRate);

    // 6. Net
    const hourlyNet = hourlyGross - totalExpenses - taxPerHour;

    return {
      tripGross,
      hourlyGross,
      commission,
      fuelCostPerHour,
      maintCostPerHour,
      taxPerHour,
      hourlyNet,
      taxRate
    };
  }, [platform, distance, duration, tripsPerHour, surge, vehicleType, selectedCountry]);

  if (!fiscalReady) return <div className="labora-card mx-auto max-w-2xl p-8 text-center"><Info size={28} className="mx-auto text-[var(--labora-primary)]" /><h2 className="mt-3 text-base font-extrabold text-[var(--labora-ink)]">Calculadora en revisión para {selectedCountry.display_name}</h2><p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[var(--labora-muted)]">La bandera y la moneda ya están disponibles, pero las tarifas, impuestos y costes permanecerán bloqueados hasta verificar fuentes oficiales y su fecha de vigencia.</p></div>;

  if (!platform) return <div className="p-8 text-center text-gray-400">No hay plataformas verificadas para este país.</div>;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: selectedCountry.currency,
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Configuration Panel */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Platform & Vehicle Selector */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Calculator size={20} className="text-[#2D6CDF]" /> Configuración del Viaje
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Plataforma</label>
               <div className="grid grid-cols-2 gap-2">
                 {selectedCountry.platforms?.map(p => (
                   <button
                     key={p.id}
                     onClick={() => setSelectedPlatformId(p.id)}
                     className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                       selectedPlatformId === p.id 
                         ? 'border-[#2D6CDF] bg-blue-50 text-[#2D6CDF]' 
                         : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                     }`}
                   >
                     {p.name}
                   </button>
                 ))}
               </div>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Vehículo</label>
               <div className="flex gap-2">
                  <button onClick={() => setVehicleType('bici')} className={`flex-1 p-2 rounded-xl border flex items-center justify-center ${vehicleType === 'bici' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200'}`}><Bike size={20}/></button>
                  <button onClick={() => setVehicleType('moto')} className={`flex-1 p-2 rounded-xl border flex items-center justify-center ${vehicleType === 'moto' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}><Zap size={20}/></button>
                  <button onClick={() => setVehicleType('coche')} className={`flex-1 p-2 rounded-xl border flex items-center justify-center ${vehicleType === 'coche' ? 'bg-gray-800 border-gray-800 text-white' : 'border-gray-200'}`}><Car size={20}/></button>
               </div>
             </div>
           </div>

           {/* Sliders */}
           <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Navigation size={14}/> Distancia por Viaje</label>
                   <span className="font-bold text-[#2D6CDF]">{distance} km</span>
                </div>
                <TooltipSlider 
                  min={1} max={30} step={0.5} 
                  value={distance} 
                  onChange={e => setDistance(Number(e.target.value))} 
                  suffix=" km"
                  className="bg-blue-100"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Clock size={14}/> Duración por Viaje</label>
                   <span className="font-bold text-[#2D6CDF]">{duration} min</span>
                </div>
                <TooltipSlider 
                  min={5} max={90} step={1} 
                  value={duration} 
                  onChange={e => setDuration(Number(e.target.value))} 
                  suffix=" min"
                  className="bg-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-bold text-gray-600">Pedidos / Hora</label>
                      <span className="font-bold text-purple-600">{tripsPerHour}</span>
                   </div>
                   <TooltipSlider 
                     min={0.5} max={5} step={0.5} 
                     value={tripsPerHour} 
                     onChange={e => setTripsPerHour(Number(e.target.value))} 
                     suffix=""
                     className="bg-purple-100"
                   />
                </div>
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-bold text-gray-600 flex items-center gap-1"><TrendingUp size={14}/> Dinámica</label>
                      <span className="font-bold text-orange-500">x{surge.toFixed(1)}</span>
                   </div>
                   <TooltipSlider 
                     min={1.0} max={3.0} step={0.1} 
                     value={surge} 
                     onChange={e => setSurge(Number(e.target.value))} 
                     suffix="x"
                     className="bg-orange-100"
                   />
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* Results Panel */}
      <div className="lg:col-span-5 space-y-4">
         
         <div className="bg-[#1A1A1A] text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Salario Neto Estimado</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-5xl font-bold tracking-tight">{results?.hourlyNet.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                 <span className="text-xl text-gray-400 font-medium">{selectedCountry.currency_symbol} / h</span>
               </div>
               
               <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-xs text-gray-500 mb-1">Bruto / Hora</p>
                     <p className="font-bold text-lg">{results?.hourlyGross.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCountry.currency_symbol}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 mb-1">Por Viaje (Bruto)</p>
                     <p className="font-bold text-lg text-blue-400">{results?.tripGross.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCountry.currency_symbol}</p>
                  </div>
               </div>
            </div>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-500 rounded-full blur-[40px] opacity-20"></div>
         </div>

         {/* Breakdown */}
         <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Desglose de Costes (Hora)</h3>
            <div className="space-y-3 text-sm">
               <div className="flex justify-between items-center text-red-500">
                  <span className="flex items-center gap-2"><DollarSign size={14}/> Comisión {platform.name}</span>
                  <span className="font-medium">-{formatCurrency(results?.commission || 0)}</span>
               </div>
               <div className="flex justify-between items-center text-orange-600">
                  <span className="flex items-center gap-2"><Zap size={14}/> Combustible & Mant.</span>
                  <span className="font-medium">-{formatCurrency((results?.fuelCostPerHour || 0) + (results?.maintCostPerHour || 0))}</span>
               </div>
               <div className="flex justify-between items-center text-blue-600">
                  <span className="flex items-center gap-2"><Info size={14}/> Impuestos ({(results?.taxRate || 0) * 100}%)</span>
                  <span className="font-medium">-{formatCurrency(results?.taxPerHour || 0)}</span>
               </div>
               <div className="pt-3 border-t border-gray-100 mt-2">
                  <div className="flex justify-between items-center font-bold text-gray-900">
                     <span>Total Deducciones</span>
                     <span>-{formatCurrency((results?.hourlyGross || 0) - (results?.hourlyNet || 0))}</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 leading-relaxed border border-blue-100">
            <span className="font-bold block mb-1">ℹ️ Nota sobre tarifas:</span>
            Los cálculos se basan en las tarifas oficiales de {platform.name} en {selectedCountry.display_name}: 
            Base {platform.base_fare}{selectedCountry.currency_symbol} + {platform.rate_km}{selectedCountry.currency_symbol}/km + {platform.rate_min}{selectedCountry.currency_symbol}/min.
         </div>

      </div>
    </div>
  );
};
