import React, { useState } from 'react';
import ExpenseTracker from './ExpenseTracker';
import IncomeTracker from './IncomeTracker';
import { Wallet, Receipt, Filter, X, Calendar, Download } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Movements: React.FC = () => {
  const { incomes, expenses } = useData();
  const [activeTab, setActiveTab] = useState<'incomes' | 'expenses'>('expenses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'incomes' ? incomes : expenses;
    if (dataToExport.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const headers = activeTab === 'incomes' 
      ? ['ID', 'Plataforma', 'Fecha', 'Importe', 'Retención']
      : ['ID', 'Categoría', 'Fecha', 'Importe', 'Notas'];

    const rows = dataToExport.map((item: any) => {
      if (activeTab === 'incomes') {
        return [item.id, item.platform, item.date, item.amount, item.retention].join(',');
      } else {
        return [item.id, item.category, item.date, item.amount, `"${item.notes || ''}"`].join(',');
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Labora_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasFilters = startDate || endDate;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Movimientos</h2>
          <p className="text-gray-500 mt-1">Gestiona tus ingresos y gastos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('incomes')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                activeTab === 'incomes' 
                  ? 'bg-[#2ECC71]/10 text-[#2ECC71] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wallet size={18} />
              Ingresos
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                activeTab === 'expenses' 
                  ? 'bg-[#E74C3C]/10 text-[#E74C3C] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Receipt size={18} />
              Gastos
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 min-w-fit">
          <Filter size={18} className="text-[#2D6CDF]" />
          <span className="text-sm font-bold">Filtrar por fecha:</span>
        </div>
        
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
               <Calendar size={14} />
             </div>
             <input 
               type="date" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6CDF] text-gray-700"
               placeholder="Desde"
             />
          </div>
          <span className="hidden sm:block self-center text-gray-300">-</span>
          <div className="relative flex-1">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
               <Calendar size={14} />
             </div>
             <input 
               type="date" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6CDF] text-gray-700"
               placeholder="Hasta"
             />
          </div>
        </div>

        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-red-500 flex items-center gap-1 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'incomes' ? (
          <IncomeTracker startDate={startDate} endDate={endDate} /> 
        ) : (
          <ExpenseTracker startDate={startDate} endDate={endDate} />
        )}
      </div>
    </div>
  );
};

export default Movements;