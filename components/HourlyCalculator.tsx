
import React, { useState, useMemo } from 'react';
import { useCountryConfig } from '../modules/country-config/hooks/useCountryConfig';
import { Bike, Car, Zap, Fuel, Wrench, PiggyBank, AlertCircle, HelpCircle, Settings, TrendingDown } from 'lucide-react';
import { VehicleCostWizard } from '../modules/vehicle-cost/components/VehicleCostWizard';
import { VehicleCostProfile } from '../modules/vehicle-cost/types';
import { costEngine } from '../modules/vehicle-cost/services/costEngine';

export const HourlyCalculator: React.FC = () => {
  const config = useCountryConfig();
  const [grossHour, setGrossHour] = useState(15);
  const [kmHour, setKmHour] = useState(12);
  const [monthlyHours, setMonthlyHours] = useState(120); // Hours worked per month
  
  // Vehicle State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [realProfile, setRealProfile] = useState<VehicleCostProfile | null>(null);
  
  // Fallback simple mode state
  const [simpleVehicle, setSimpleVehicle] = useState<'bicycle' | 'motorcycle' | 'car'>('motorcycle');

  // Constants for simple mode fallback
  const simpleSpecs = {
    bicycle: { efficiency: 0, maint: 0.02, name: 'Bicicleta/E-bike', icon: Bike },
    motorcycle: { efficiency: 0.035, maint: 0.05, name: 'Moto', icon: Zap },
    car: { efficiency: 0.07, maint: 0.10, name: 'Coche', icon: Car },
  };

  const activeVehicleType = realProfile ? realProfile.vehicleType : simpleVehicle;

  const stats = useMemo(() => {
    const monthlyKm = kmHour * monthlyHours;

    // 1. Commission
    const commission = grossHour * config.default_commission_pct;
    
    // 2. Vehicle Costs
    let fuelCost = 0;
    let maintCost = 0;
    let fixedDepreciationHourly = 0; // Allocation of monthly fixed costs to this hour

    if (realProfile) {
      // REAL MODE
      const breakdown = costEngine.calculateCosts(realProfile, config.avg_fuel_price, monthlyKm);
      
      // Variable costs per km
      fuelCost = kmHour * breakdown.fuelPerKm;
      maintCost = kmHour * breakdown.maintenancePerKm;
      
      // Fixed costs allocated to this hour (Monthly Fixed / Monthly Hours)
      fixedDepreciationHourly = monthlyHours > 0 ? breakdown.fixedMonthly / monthlyHours : 0;

    } else {
      // SIMPLE MODE
      const specs = simpleSpecs[simpleVehicle];
      fuelCost = (kmHour * specs.efficiency) * config.avg_fuel_price;
      maintCost = kmHour * specs.maint;
      fixedDepreciationHourly = 0; // Simple mode ignores depreciation
    }
    
    // 3. Operating Profit (Pre-Tax)
    const operatingProfit = grossHour - commission - fuelCost - maintCost - fixedDepreciationHourly;
    
    // 4. Taxes
    const taxRate = config.income_tax_brackets[0]?.rate || 0.19;
    const taxes = Math.max(0, operatingProfit * taxRate);

    // 5. Net
    const net = operatingProfit - taxes;

    return {
      commission,
      fuelCost,
      maintCost,
      fixedDepreciationHourly,
      taxes,
      net,
      operatingProfit
    };
  }, [grossHour, kmHour, monthlyHours, realProfile, simpleVehicle, config]);

  const format = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: config.currency });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <VehicleCostWizard 
             initialProfile={realProfile || undefined}
             onSave={(p) => {
               setRealProfile(p);
               setIsWizardOpen(false);
             }}
             onCancel={() => setIsWizardOpen(false)}
           />
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-8">
        
        {/* Vehicle Selector Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-6">
          <div className="flex gap-3 w-full sm:w-auto justify-center">
            {(Object.keys(simpleSpecs) as Array<keyof typeof simpleSpecs>).map((v) => (
              <button
                key={v}
                onClick={() => { setSimpleVehicle(v); setRealProfile(null); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all w-24 ${
                  !realProfile && simpleVehicle === v 
                    ? 'border-[#2D6CDF] bg-blue-50 text-[#2D6CDF] shadow-sm' 
                    : 'border-gray-100 text-gray-300 hover:text-gray-500'
                }`}
                disabled={!!realProfile} // Visual disable if real profile active, though click resets it
              >
                {React.createElement(simpleSpecs[v].icon, { size: 20, strokeWidth: 2.5 })}
                <span className="text-[10px] font-bold">{simpleSpecs[v].name.split('/')[0]}</span>
              </button>
            ))}
          </div>

          {/* Real Mode Toggle */}
          <button 
            onClick={() => setIsWizardOpen(true)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              realProfile 
                ? 'border-[#7B3FE4] bg-purple-50 text-[#7B3FE4] shadow-md' 
                : 'border-dashed border-gray-300 text-gray-400 hover:border-[#7B3FE4] hover:text-[#7B3FE4]'
            }`}
          >
            <Settings size={18} />
            <span className="text-xs font-bold">{realProfile ? 'Configuración Real Activa' : 'Configurar Vehículo Real'}</span>
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2 items-end">
              <label className="text-sm font-bold text-gray-700">Ganancia Bruta / Hora</label>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#2D6CDF]">{format(grossHour)}</span>
                <span className="text-xs text-gray-400 block">Total facturado</span>
              </div>
            </div>
            <input 
              type="range" min="5" max="60" step="1"
              value={grossHour} onChange={e => setGrossHour(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D6CDF]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between mb-2 items-end">
                <label className="text-sm font-bold text-gray-700">Distancia / Hora</label>
                <span className="text-xl font-bold text-gray-600">{kmHour} km</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1"
                value={kmHour} onChange={e => setKmHour(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-600"
              />
            </div>
            <div>
               <div className="flex justify-between mb-2 items-end">
                <label className="text-sm font-bold text-gray-700">Horas Mensuales</label>
                <span className="text-xl font-bold text-gray-600">{monthlyHours} h</span>
              </div>
              <input 
                type="range" min="10" max="250" step="10"
                value={monthlyHours} onChange={e => setMonthlyHours(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-400"
              />
              <p className="text-[10px] text-gray-400 mt-1">Usado para distribuir costes fijos (seguro, depreciación).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Waterfall */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
           <span className="font-bold text-gray-700 text-sm">Desglose de Rentabilidad Real</span>
           <div className="flex gap-2">
             {realProfile && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Datos Reales</span>}
             <span className="text-[10px] font-bold bg-gray-100 border border-gray-200 px-2 py-1 rounded-full text-gray-500 uppercase">Base 1 Hora</span>
           </div>
        </div>
        
        <div className="divide-y divide-gray-50 text-sm">
           {/* Start */}
           <div className="p-4 flex justify-between items-center bg-white">
             <span className="font-bold text-gray-900">Ingreso Bruto</span>
             <span className="font-bold text-gray-900">{format(grossHour)}</span>
           </div>

           {/* Deductions */}
           <div className="p-4 space-y-3 bg-gray-50/30">
             <div className="flex justify-between text-red-500 items-center">
                <span className="flex items-center gap-2 text-xs sm:text-sm"><AlertCircle size={14}/> Comisión Plataforma ({(config.default_commission_pct*100).toFixed(0)}%)</span>
                <span className="font-medium">-{format(stats.commission)}</span>
             </div>
             
             {activeVehicleType !== 'bicycle' && (
               <div className="flex justify-between text-orange-600 items-center">
                  <span className="flex items-center gap-2 text-xs sm:text-sm"><Fuel size={14}/> Combustible ({realProfile ? `${realProfile.fuelConsumptionL100km}L/100km` : 'Est.'})</span>
                  <span className="font-medium">-{format(stats.fuelCost)}</span>
               </div>
             )}
             
             <div className="flex justify-between text-gray-500 items-center">
                <span className="flex items-center gap-2 text-xs sm:text-sm"><Wrench size={14}/> Mantenimiento y Desgaste</span>
                <span className="font-medium">-{format(stats.maintCost)}</span>
             </div>

             {stats.fixedDepreciationHourly > 0 && (
               <div className="flex justify-between text-gray-600 items-center">
                  <span className="flex items-center gap-2 text-xs sm:text-sm"><TrendingDown size={14}/> Depreciación y Seguro (Fijos)</span>
                  <span className="font-medium">-{format(stats.fixedDepreciationHourly)}</span>
               </div>
             )}
             
             <div className="flex justify-between text-blue-500 items-center">
                <span className="flex items-center gap-2 text-xs sm:text-sm"><PiggyBank size={14}/> Impuestos Est. (IRPF/ISR)</span>
                <span className="font-medium">-{format(stats.taxes)}</span>
             </div>
           </div>

           {/* Final */}
           <div className="p-6 bg-[#1A1A1A] text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-50"></div>
              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold">Beneficio Neto Real</h3>
                <p className="text-gray-400 text-xs">Limpios en tu bolsillo</p>
              </div>
              <div className="text-right relative z-10">
                <span className={`text-3xl font-bold ${stats.net > 0 ? 'text-[#2ECC71]' : 'text-red-500'}`}>{format(stats.net)}</span>
                <p className="text-gray-400 text-xs">/ hora</p>
              </div>
           </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex gap-3">
        <HelpCircle className="text-yellow-600 flex-shrink-0" size={20} />
        <p className="text-xs text-yellow-800 leading-relaxed">
          <span className="font-bold">Nota:</span> El cálculo "real" incluye la depreciación de tu vehículo (lo que pierde de valor por usarlo) y el seguro prorrateado por horas trabajadas.
          { !realProfile && " Para mayor precisión, configura los datos de tu vehículo con el botón superior."}
        </p>
      </div>
    </div>
  );
};
