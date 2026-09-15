
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { TrendingUp, Sparkles, ClipboardPaste, Loader2, Info, AlertCircle, X } from 'lucide-react';
import { extractIncomeFromText, getRetentionExplanation } from '../services/geminiService';

interface IncomeTrackerProps {
  startDate: string;
  endDate: string;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ startDate, endDate }) => {
  const { incomes, addIncome } = useData();
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for AI explanations
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<Record<string, boolean>>({});

  // Filter incomes based on date props
  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      if (startDate && income.date < startDate) return false;
      if (endDate && income.date > endDate) return false;
      return true;
    });
  }, [incomes, startDate, endDate]);

  const handleAIExtraction = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    try {
      const extractedData = await extractIncomeFromText(pastedText);
      if (extractedData.length === 0) {
        alert("No se encontraron ingresos claros en el texto.");
      } else {
        extractedData.forEach(item => {
          addIncome({
            platform: item.platform,
            amount: item.amount,
            date: item.date,
            retention: item.retention || 0
          });
        });
        alert(`${extractedData.length} ingresos añadidos correctamente.`);
        setIsPasteModalOpen(false);
        setPastedText('');
      }
    } catch (error) {
      console.error(error);
      alert("Error al procesar el texto.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeRetention = async (id: string, platform: string, amount: number, retention: number) => {
    if (loadingExplanation[id]) return;

    setLoadingExplanation(prev => ({ ...prev, [id]: true }));
    try {
      const explanation = await getRetentionExplanation(platform, amount, retention);
      setExplanations(prev => ({ ...prev, [id]: explanation }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingExplanation(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ingresos</h2>
          <p className="text-gray-500">
            {startDate || endDate 
              ? `Mostrando ${filteredIncomes.length} resultados filtrados`
              : 'Registra lo que ganas en cada plataforma'}
          </p>
        </div>
        <button 
          onClick={() => setIsPasteModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Sparkles size={18} />
          <span>Importar con IA</span>
        </button>
      </div>

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ClipboardPaste className="text-purple-600" />
                Pegar Factura/Email
                </h3>
                <button 
                  onClick={() => setIsPasteModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Copia el texto del email de Uber/Glovo o el PDF de la factura y pégalo aquí. La IA extraerá los datos y las retenciones automáticamente.
            </p>
            <textarea 
              className="w-full h-40 p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
              placeholder="Ej: Resumen de ganancias Uber. Fecha: 2024-03-01. Bruto: 150.50€. IRPF: 3.01€..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAIExtraction}
                disabled={isProcessing || !pastedText.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm font-medium"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isProcessing ? 'Procesando...' : 'Procesar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-3">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-green-50 rounded-lg text-green-600">
               <TrendingUp size={24} />
             </div>
             <div>
               <h3 className="text-lg font-semibold">Historial de Ingresos</h3>
               <p className="text-sm text-gray-500">Todas tus plataformas unificadas</p>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-medium text-gray-500 text-sm">Plataforma</th>
                  <th className="p-4 font-medium text-gray-500 text-sm hidden sm:table-cell">Fecha</th>
                  <th className="p-4 font-medium text-gray-500 text-sm text-right">Monto Bruto</th>
                  <th className="p-4 font-medium text-gray-500 text-sm hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      Retención <Sparkles size={14} className="text-indigo-500" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredIncomes.map((inc) => (
                  <React.Fragment key={inc.id}>
                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{inc.platform}</div>
                        {/* Mobile Date */}
                        <div className="text-xs text-gray-400 sm:hidden mt-0.5">{inc.date}</div>
                        {/* Mobile AI Analysis Trigger */}
                        {inc.retention > 0 && (
                          <button 
                            onClick={() => handleAnalyzeRetention(inc.id, inc.platform, inc.amount, inc.retention)}
                            disabled={loadingExplanation[inc.id]}
                            className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wide text-indigo-600 md:hidden"
                          >
                            {loadingExplanation[inc.id] ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Analizar Retención
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 hidden sm:table-cell">{inc.date}</td>
                      <td className="p-4 text-right align-top">
                        <div className="font-semibold text-green-600">+{inc.amount.toFixed(2)} €</div>
                        {/* Mobile Retention Display */}
                        {inc.retention > 0 && (
                          <div className="text-xs text-red-500 md:hidden font-medium mt-0.5">
                            -{inc.retention.toFixed(2)} € (Ret)
                          </div>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${inc.retention > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            -{inc.retention.toFixed(2)} €
                          </span>
                          {inc.retention > 0 && (
                            <button 
                              onClick={() => handleAnalyzeRetention(inc.id, inc.platform, inc.amount, inc.retention)}
                              disabled={loadingExplanation[inc.id]}
                              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Analizar motivo con IA"
                            >
                              {loadingExplanation[inc.id] ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Sparkles size={12} />
                              )}
                              <span>Analizar con IA</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* AI Explanation Row */}
                    {explanations[inc.id] && (
                      <tr className="bg-indigo-50/30 animate-in fade-in slide-in-from-top-2">
                        <td colSpan={4} className="p-4 pt-2 pb-4">
                          <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm max-w-2xl mx-auto sm:mx-0">
                             <div className="p-1 bg-indigo-100 text-indigo-600 rounded-full mt-0.5">
                               <Info size={14} />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-indigo-800 mb-1">Análisis IA Labora+</p>
                               <p className="text-sm text-gray-700 leading-relaxed">
                                 {explanations[inc.id]}
                               </p>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                 {filteredIncomes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      {incomes.length > 0 
                        ? "No se encontraron ingresos en este rango de fechas." 
                        : "No tienes ingresos registrados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeTracker;
