
import React, { useState, useEffect } from 'react';
import { CheckSquare, Wrench, Zap, Shield, RefreshCw } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';

export const RiderToolkit: React.FC = () => {
  const { showNotification } = useData();
  
  const defaultChecklist = {
    'Powerbank cargada 100%': false,
    'Soporte móvil ajustado': false,
    'Kit pinchazos / Herramientas': false,
    'Chubasquero (Revisar clima)': false,
    'Documentación vehículo': false,
    'Luces funcionando': false,
    'Agua / Hidratación': false
  };

  // Lazy load state with persistence
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('labora_toolkit_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist;
    } catch (e) {
      return defaultChecklist;
    }
  });

  // Persist state on change
  useEffect(() => {
    localStorage.setItem('labora_toolkit_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleItem = (key: string) => {
    setChecklist((prev: any) => ({...prev, [key]: !prev[key as keyof typeof prev]}));
  };

  const resetChecklist = () => {
    setChecklist(Object.keys(checklist).reduce((acc, k) => ({...acc, [k]: false}), {}));
    showNotification('info', 'Checklist reiniciado para nueva ruta');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
         <Wrench className="text-gray-700" /> Toolkit del Rider
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Checklist */}
         <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><CheckSquare size={18}/> Checklist Salida</h3>
              <div className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                {Object.values(checklist).filter(Boolean).length}/{Object.keys(checklist).length}
              </div>
            </div>
            
            <div className="space-y-3">
               {Object.entries(checklist).map(([item, checked]) => (
                 <label key={item} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${checked ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                    <div 
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checked ? 'bg-[#2ECC71] border-[#2ECC71]' : 'border-gray-300 bg-white'}`}
                      onClick={() => toggleItem(item)}
                    >
                      {checked && <Shield size={12} className="text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${checked ? 'text-green-800 line-through' : 'text-gray-700'}`}>{item}</span>
                    <input type="checkbox" className="hidden" checked={checked as boolean} onChange={() => toggleItem(item)} />
                 </label>
               ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <button 
                onClick={resetChecklist}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto py-2 px-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <RefreshCw size={12} /> Resetear Checklist
              </button>
            </div>
         </div>

         {/* Costs */}
         <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap size={18}/> Costes Reparación (Est.)</h3>
            <div className="divide-y divide-gray-50">
               <div className="py-3 flex justify-between text-sm items-center hover:bg-gray-50 px-2 rounded-lg transition-colors">
                 <span className="text-gray-600">Pinchazo Rueda</span>
                 <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">15€ - 25€</span>
               </div>
               <div className="py-3 flex justify-between text-sm items-center hover:bg-gray-50 px-2 rounded-lg transition-colors">
                 <span className="text-gray-600">Cambio Aceite</span>
                 <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">40€ - 60€</span>
               </div>
               <div className="py-3 flex justify-between text-sm items-center hover:bg-gray-50 px-2 rounded-lg transition-colors">
                 <span className="text-gray-600">Pastillas Freno</span>
                 <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">30€ - 50€</span>
               </div>
               <div className="py-3 flex justify-between text-sm items-center hover:bg-gray-50 px-2 rounded-lg transition-colors">
                 <span className="text-gray-600">Cadena Transmisión</span>
                 <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">80€ - 120€</span>
               </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
               <p className="text-xs text-blue-800 leading-relaxed">
                 <span className="font-bold">Tip Pro:</span> Guarda 50€/mes en una "hucha de averías" para que un pinchazo no arruine tu semana.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};
