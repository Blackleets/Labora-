
import React from 'react';
import { useData } from '../../../contexts/DataContext';
import { BarChart2, TrendingUp, Clock, Activity } from 'lucide-react';

export const ProDashboard: React.FC = () => {
  const { incomes, vehicle } = useData();

  // Mock calculations based on incomes
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const estimatedKm = vehicle?.currentKm || 1000; // Fallback
  const profitPerKm = totalIncome / (estimatedKm || 1);
  const hourlyRate = totalIncome / 160; // Mock 160h worked

  const KPICard = ({ label, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
         <Icon size={20} />
       </div>
       <p className="text-xs font-bold text-gray-400 uppercase">{label}</p>
       <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
       <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
         <Activity className="text-[#2D6CDF]" /> Panel KPIs Pro
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <KPICard 
           label="Ganancia / Km" 
           value={profitPerKm.toFixed(2)} 
           sub="Eficiencia de ruta"
           icon={TrendingUp}
           color="bg-green-50 text-green-600"
         />
         <KPICard 
           label="Ganancia / Hora" 
           value={hourlyRate.toFixed(2)} 
           sub="Productividad"
           icon={Clock}
           color="bg-blue-50 text-blue-600"
         />
         <KPICard 
           label="Coste / Km" 
           value="0.15" 
           sub="Mantenimiento + Gas"
           icon={BarChart2}
           color="bg-red-50 text-red-600"
         />
         <KPICard 
           label="Tiempo Muerto" 
           value="12%" 
           sub="Esperando pedidos"
           icon={Clock}
           color="bg-orange-50 text-orange-600"
         />
      </div>
    </div>
  );
};
