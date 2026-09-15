
import React, { useState, useEffect } from 'react';
import { VehicleCostProfile, VehicleType } from '../types';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Car, Bike, Zap, Save, X, Info } from 'lucide-react';

interface Props {
  initialProfile?: VehicleCostProfile;
  onSave: (profile: VehicleCostProfile) => void;
  onCancel: () => void;
}

export const VehicleCostWizard: React.FC<Props> = ({ initialProfile, onSave, onCancel }) => {
  const config = useCountryConfig();
  const benchmarks = config.vehicle_benchmarks;

  const [type, setType] = useState<VehicleType>(initialProfile?.vehicleType || 'motorcycle');
  
  const [form, setForm] = useState<VehicleCostProfile>(initialProfile || {
    vehicleType: 'motorcycle',
    purchasePrice: 3000,
    purchaseDate: new Date().toISOString().split('T')[0],
    currentValue: 2500,
    insuranceAnnualCost: benchmarks?.avg_insurance_cost_yr.motorcycle || 300,
    maintenanceAnnualBudget: benchmarks?.avg_maintenance_yr.motorcycle || 400,
    fuelConsumptionL100km: 3.5,
    tireReplacementCost: 150,
    tireLifespanKm: 10000,
    expectedLifespanYears: 5
  });

  // Update defaults when type changes if it's a new form
  useEffect(() => {
    if (!initialProfile && benchmarks) {
      setForm(prev => ({
        ...prev,
        vehicleType: type,
        insuranceAnnualCost: benchmarks.avg_insurance_cost_yr[type],
        maintenanceAnnualBudget: benchmarks.avg_maintenance_yr[type],
        fuelConsumptionL100km: type === 'bicycle' ? 0 : (type === 'motorcycle' ? 3.5 : 7.0),
        purchasePrice: type === 'bicycle' ? 500 : (type === 'motorcycle' ? 3000 : 15000),
        expectedLifespanYears: 5
      }));
    }
  }, [type, benchmarks, initialProfile]);

  const handleChange = (field: keyof VehicleCostProfile, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-xl animate-in zoom-in-95 max-w-lg w-full mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">Configurar Vehículo Real</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* Type Selection */}
        <div>
           <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipo de Vehículo</label>
           <div className="flex gap-2">
             {(['bicycle', 'motorcycle', 'car'] as VehicleType[]).map(t => (
               <button
                 key={t}
                 onClick={() => setType(t)}
                 className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all ${
                   type === t ? 'border-[#2D6CDF] bg-blue-50 text-[#2D6CDF]' : 'border-gray-100 text-gray-400 hover:border-gray-300'
                 }`}
               >
                 {t === 'bicycle' && <Bike size={20} />}
                 {t === 'motorcycle' && <Zap size={20} />}
                 {t === 'car' && <Car size={20} />}
                 <span className="capitalize">{t === 'bicycle' ? 'Bici/VMP' : t === 'motorcycle' ? 'Moto' : 'Coche'}</span>
               </button>
             ))}
           </div>
        </div>

        {/* Acquisition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Precio Compra ({config.currency_symbol})</label>
            <input 
              type="number" 
              value={form.purchasePrice} 
              onChange={e => handleChange('purchasePrice', Number(e.target.value))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Vida Útil (Años)</label>
            <input 
              type="number" 
              value={form.expectedLifespanYears} 
              onChange={e => handleChange('expectedLifespanYears', Number(e.target.value))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold"
            />
          </div>
        </div>

        {/* Variable Costs */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
          <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
            <Zap size={16} className="text-orange-500" /> Consumo y Desgaste
          </h4>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Consumo (L/100km)</label>
               <input 
                  type="number" step="0.1"
                  value={form.fuelConsumptionL100km}
                  onChange={e => handleChange('fuelConsumptionL100km', Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm"
                  disabled={type === 'bicycle'}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Mantenimiento/Año ({config.currency_symbol})</label>
               <input 
                  type="number"
                  value={form.maintenanceAnnualBudget}
                  onChange={e => handleChange('maintenanceAnnualBudget', Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm"
               />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Cambio Ruedas ({config.currency_symbol})</label>
               <input 
                  type="number"
                  value={form.tireReplacementCost}
                  onChange={e => handleChange('tireReplacementCost', Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Cada cuántos km</label>
               <input 
                  type="number"
                  value={form.tireLifespanKm}
                  onChange={e => handleChange('tireLifespanKm', Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm"
               />
             </div>
          </div>
        </div>

        {/* Insurance */}
        <div>
           <label className="block text-xs font-bold text-gray-500 mb-1">Seguro Anual ({config.currency_symbol})</label>
           <div className="flex items-center gap-2">
             <input 
               type="number"
               value={form.insuranceAnnualCost}
               onChange={e => handleChange('insuranceAnnualCost', Number(e.target.value))}
               className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold"
             />
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl" title="Seguro obligatorio/voluntario">
               <Info size={18} />
             </div>
           </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-xl flex gap-2 text-xs text-yellow-800">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <p>Estos datos se usarán para calcular la depreciación mensual y el coste real por kilómetro en el simulador.</p>
        </div>

      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl">Cancelar</button>
        <button 
          onClick={() => onSave(form)}
          className="flex-1 py-3 bg-[#1A1A1A] text-white font-bold text-sm rounded-xl hover:bg-black flex items-center justify-center gap-2"
        >
          <Save size={18} /> Guardar Vehículo
        </button>
      </div>
    </div>
  );
};
