
import React, { useState, useMemo } from 'react';
import { useCountry } from '../contexts/CountryContext';
import { Calculator, AlertCircle, Globe, Clock, Wallet, Briefcase, TrendingDown, Building2, Check, ArrowRight, Map } from 'lucide-react';
import { TripCalculator } from './TripCalculator';
import TooltipSlider from './TooltipSlider';

const Simulator: React.FC = () => {
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<'monthly' | 'trip'>('monthly');
  
  // State for Monthly Simulator
  const [hoursPerWeek, setHoursPerWeek] = useState(30);
  const [hourlyGross, setHourlyGross] = useState(15); // Average gross earnings per hour
  const [expenses, setExpenses] = useState(200);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);

  // Toggle platform selection
  const togglePlatform = (id: string) => {
    setSelectedPlatformIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Calculations for Monthly
  const stats = useMemo(() => {
    // 1. Time & Gross
    const monthlyHours = hoursPerWeek * 4;
    const grossIncome = monthlyHours * hourlyGross;

    // 2. Platform Commissions
    let avgCommissionRate = selectedCountry.default_commission_pct;
    
    if (selectedPlatformIds.length > 0 && selectedCountry.platforms) {
      const selectedDetails = selectedCountry.platforms.filter(p => selectedPlatformIds.includes(p.id));
      if (selectedDetails.length > 0) {
        const totalRate = selectedDetails.reduce((acc, curr) => acc + curr.commission_pct, 0);
        avgCommissionRate = totalRate / selectedDetails.length;
      }
    }

    const platformFees = grossIncome * avgCommissionRate;

    // 3. Taxable Base
    const operatingProfit = grossIncome - platformFees - expenses;
    
    // 4. Taxes
    const calculateTax = (amount: number) => {
      if (amount <= 0) return 0;
      const projectedAnnual = amount * 12;
      const bracket = selectedCountry.income_tax_brackets.find(b => projectedAnnual >= b.min && projectedAnnual < b.max);
      const rate = bracket ? bracket.rate : (selectedCountry.income_tax_brackets[selectedCountry.income_tax_brackets.length-1]?.rate || 0.20);
      return amount * rate;
    };

    const estimatedTax = calculateTax(operatingProfit);

    // 5. Net
    const netIncome = operatingProfit - estimatedTax;

    return {
      monthlyHours,
      grossIncome,
      avgCommissionRate,
      platformFees,
      operatingProfit,
      estimatedTax,
      netIncome
    };
  }, [hoursPerWeek, hourlyGross, expenses, selectedPlatformIds, selectedCountry]);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('es-ES', { style: 'currency', currency: selectedCountry.currency, maximumFractionDigits: 0 });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24 lg:pb-0">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="text-[#4285F4]" />
            Simulador de Ingresos
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <Globe size={14} className="text-gray-400" />
             <p className="text-gray-500">Reglas fiscales: <span className="font-bold text-gray-800">{selectedCountry.display_name}</span></p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
           <button 
             onClick={() => setActiveTab('monthly')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'monthly' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Clock size={16} /> Proyección Mensual
           </button>
           <button 
             onClick={() => setActiveTab('trip')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'trip' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             <Map size={16} /> Calculadora por Viaje
           </button>
        </div>
      </div>

      {activeTab === 'trip' ? (
        <TripCalculator />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Workload Card */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" /> Configuración Laboral
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                     <label className="text-sm font-bold text-gray-600">Horas Semanales</label>
                     <span className="text-lg font-bold text-[#4285F4]">{hoursPerWeek} h</span>
                  </div>
                  <TooltipSlider 
                    min={5} max={80} step={1}
                    value={hoursPerWeek} 
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    suffix="h"
                    className="bg-blue-100"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Part-time</span>
                    <span>Full-time</span>
                    <span>Hardcore</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                     <label className="text-sm font-bold text-gray-600">Ingreso Bruto Promedio / Hora</label>
                     <span className="text-lg font-bold text-[#4285F4]">{hourlyGross} {selectedCountry.currency_symbol}</span>
                  </div>
                  <TooltipSlider 
                    min={5} max={50} step={0.5}
                    value={hourlyGross} 
                    onChange={(e) => setHourlyGross(Number(e.target.value))}
                    suffix={selectedCountry.currency_symbol}
                    className="bg-blue-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                     <label className="text-sm font-bold text-gray-600">Gastos Mensuales (Gasolina, Datos...)</label>
                     <span className="text-lg font-bold text-red-500">-{expenses} {selectedCountry.currency_symbol}</span>
                  </div>
                  <TooltipSlider 
                    min={0} max={1000} step={10}
                    value={expenses} 
                    onChange={(e) => setExpenses(Number(e.target.value))}
                    suffix={selectedCountry.currency_symbol}
                    className="bg-red-100"
                  />
                </div>
              </div>
            </div>

            {/* Platforms Selector */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-400" /> Plataformas Activas
                </h3>
                {selectedPlatformIds.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    Comisión Media: {(stats.avgCommissionRate * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {selectedCountry.platforms?.map(p => {
                  const isSelected = selectedPlatformIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-[#2D6CDF] bg-blue-50 text-[#2D6CDF] shadow-sm' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {isSelected ? <Check size={16} /> : <div className="w-4" />}
                      <span className="font-bold text-sm">{p.name}</span>
                      <span className="text-xs opacity-70 ml-1">{(p.commission_pct * 100).toFixed(0)}%</span>
                    </button>
                  );
                })}
                {(!selectedCountry.platforms || selectedCountry.platforms.length === 0) && (
                  <p className="text-sm text-gray-400 italic">No hay plataformas específicas configuradas para este país.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            
            {/* Main Result Card */}
            <div className="bg-[#1A1A1A] text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Resultado Neto Estimado</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatMoney(stats.netIncome)}</span>
                    <span className="text-sm text-gray-400">/ mes</span>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-xs text-gray-400 mb-1">Bruto Anual (Est.)</p>
                        <p className="font-bold text-lg">{formatMoney(stats.grossIncome * 12)}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-400 mb-1">Neto Anual (Est.)</p>
                        <p className="font-bold text-lg text-[#2ECC71]">{formatMoney(stats.netIncome * 12)}</p>
                     </div>
                  </div>
               </div>
               {/* Decorative circles */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500 rounded-full blur-[50px] opacity-10"></div>
            </div>

            {/* Breakdown Waterfall */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <TrendingDown size={18} className="text-gray-400" /> Desglose Mensual
               </h3>
               
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                     <span className="font-bold text-gray-700">Ingreso Bruto</span>
                     <span className="font-bold text-gray-900">{formatMoney(stats.grossIncome)}</span>
                  </div>
                  
                  <div className="pl-4 space-y-2 relative border-l-2 border-dashed border-gray-200 ml-4">
                     <div className="flex justify-between items-center text-gray-600">
                        <span className="flex items-center gap-2"><Building2 size={14}/> Comisiones Apps</span>
                        <span className="text-red-500 font-medium">-{formatMoney(stats.platformFees)}</span>
                     </div>
                     <div className="flex justify-between items-center text-gray-600">
                        <span className="flex items-center gap-2"><Wallet size={14}/> Gastos Operativos</span>
                        <span className="text-red-500 font-medium">-{formatMoney(expenses)}</span>
                     </div>
                     <div className="flex justify-between items-center text-gray-600">
                        <span className="flex items-center gap-2"><Building2 size={14}/> Impuestos (IRPF)</span>
                        <span className="text-blue-500 font-medium">-{formatMoney(stats.estimatedTax)}</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-xl mt-2">
                     <span className="font-bold text-green-800">Neto en Bolsillo</span>
                     <span className="font-bold text-green-700">{formatMoney(stats.netIncome)}</span>
                  </div>
               </div>
            </div>

            {/* Note */}
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-bold text-yellow-800 text-xs uppercase">Nota Legal ({selectedCountry.country_code})</h4>
                <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                  {selectedCountry.legal_notes}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;
