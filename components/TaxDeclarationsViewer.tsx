import React, { useMemo, useState } from 'react';
import { 
  FileText, CheckCircle2, Clock, AlertCircle, ExternalLink, Download, 
  Calculator, Building2, ShieldCheck, FileSpreadsheet, Scale, Eye, X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { SPANISH_TAX_MODELS } from '../modules/delivery/data/platforms';
import { UserRole } from '../types';

interface TaxDeclarationsViewerProps {
  setView?: (view: string) => void;
}

export const TaxDeclarationsViewer: React.FC<TaxDeclarationsViewerProps> = ({ setView }) => {
  const { 
    currentUser, declarations, expenses, incomes, calculateQuarterlyTaxes, 
    fileTaxDeclaration, showNotification, privacyMode 
  } = useData();

  const [selectedQuarter, setSelectedQuarter] = useState('3T 2026');
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null);
  const [filingRef, setFilingRef] = useState('');

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const activeUserId = isManager ? 'u1' : currentUser?.id || 'u1';

  const quarterDeclarations = useMemo(() => {
    const existing = declarations.filter(d => d.userId === activeUserId && d.quarter === selectedQuarter);
    if (existing.length >= 2) return existing;
    const calculated = calculateQuarterlyTaxes(activeUserId, selectedQuarter);
    return [calculated.model130, calculated.model303];
  }, [declarations, activeUserId, selectedQuarter, expenses, incomes]);

  const formatMoney = (amount: number) => privacyMode ? '•••• €' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  const handleFile = () => {
    if (!selectedDeclaration || !filingRef.trim()) {
      showNotification('error', 'Introduce la referencia oficial de presentación');
      return;
    }
    fileTaxDeclaration(selectedDeclaration.id, filingRef.trim());
    setSelectedDeclaration(null);
    setFilingRef('');
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportLibroGastos = () => {
    const rows = [
      ['Fecha', 'Proveedor', 'Concepto', 'Base/Total', 'IVA', '% Deducible', 'Estado'],
      ...expenses.filter(e => e.userId === activeUserId).map(e => [
        e.date,
        e.merchant || '',
        String(e.category),
        e.amount.toFixed(2),
        (e.vatAmount || 0).toFixed(2),
        String(e.deductiblePercentage ?? 100),
        e.status || 'pending_review'
      ])
    ];
    downloadCsv(`labora_libro_gastos_${selectedQuarter.replace(/\s/g, '_')}.csv`, rows);
    showNotification('success', 'Libro de gastos descargado');
  };

  const handleExportLibroIngresos = () => {
    const rows = [
      ['Fecha', 'Plataforma', 'Ingreso Bruto', 'Retención'],
      ...incomes.filter(i => i.userId === activeUserId).map(i => [
        i.date,
        i.platform,
        i.amount.toFixed(2),
        i.retention.toFixed(2)
      ])
    ];
    downloadCsv(`labora_libro_ingresos_${selectedQuarter.replace(/\s/g, '_')}.csv`, rows);
    showNotification('success', 'Libro de ingresos descargado');
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'filed_with_tax_agency':
        return { label: 'Presentado', icon: CheckCircle2, className: 'bg-[#EBF3ED] text-[#245338] border-[#D0E5D7]' };
      case 'reviewed_by_gestor':
        return { label: 'Revisado por Gestor', icon: ShieldCheck, className: 'bg-[#EAF2F6] text-[#2C5F7B] border-[#D2E4EE]' };
      default:
        return { label: 'Borrador', icon: Clock, className: 'bg-[#FEF7EB] text-[#85531B] border-[#FDE3B8]' };
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="rounded-3xl p-5 sm:p-6 border border-[#416854] bg-[#244735] text-[#F3EFE6] shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#4F7A61]/30 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-[#FAD082]/15 border border-[#FAD082]/30 text-[#FAD082] rounded-lg text-[10px] font-bold uppercase tracking-wider">España · AEAT</span>
              <span className="text-[10px] font-semibold text-[#C8D8CE]">Entorno de preparación fiscal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Modelos fiscales y libros registro</h2>
            <p className="text-sm text-[#D7E2DB] mt-1 max-w-2xl">
              Consolida ingresos, gastos y justificantes para preparar la revisión con tu gestor antes de presentar ante la Agencia Tributaria.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportLibroGastos}
              className="px-3.5 py-2 bg-[#2D4E3E] hover:bg-[#39634F] text-[#F3EFE6] text-xs font-serif font-semibold rounded-xl border border-[#416854] flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Descargar Libro de Gastos y Facturas para Hacienda en CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#FAD082]" />
              <span>Libro Gastos (AEAT)</span>
            </button>
            <button
              onClick={handleExportLibroIngresos}
              className="px-3.5 py-2 bg-[#2D4E3E] hover:bg-[#39634F] text-[#F3EFE6] text-xs font-serif font-semibold rounded-xl border border-[#416854] flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Descargar Libro de Ingresos de plataformas en CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#A3D9B1]" />
              <span>Libro Ingresos</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-[#2E5A44]" />
            <span>Modelos Tributarios Oficiales (Hacienda España)</span>
          </h3>
          <span className="text-xs font-serif text-stone-500">Referencia informativa para preparar cada obligación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SPANISH_TAX_MODELS.map((model) => (
            <div
              key={model.code}
              className="bg-[#FCFAF7] rounded-2xl p-4 border border-[#E8DFC8] shadow-sm flex flex-col justify-between hover:border-[#2E5A44] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="px-2.5 py-0.5 bg-[#EBF3ED] text-[#245338] text-xs font-mono font-bold rounded-lg border border-[#D0E5D7]">
                    {model.code}
                  </span>
                  <span className="text-[11px] font-serif font-semibold text-stone-600 bg-[#F2EDE4] px-2.5 py-0.5 rounded-full border border-[#E5DEC9] text-right">
                    {model.frequency}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 mb-1">{model.name}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">{model.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8DFC8] text-xs">
                <span className="text-stone-400 font-serif block mb-1">Plazos orientativos:</span>
                <span className="font-serif font-semibold text-stone-700 leading-relaxed">
                  {model.deadlines?.join(' · ') || 'Al iniciar o modificar la actividad'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DFC8] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8DFC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2]">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900">Liquidaciones trimestrales</h3>
            <p className="text-xs text-stone-500 mt-0.5 font-serif">Cálculo de trabajo para revisión; confirma siempre los datos antes de presentar.</p>
          </div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <span className="text-xs font-serif font-semibold text-stone-600">Trimestre:</span>
            {['1T 2026', '2T 2026', '3T 2026', '4T 2026'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${selectedQuarter === q ? 'bg-[#2E5A44] text-white border-[#2E5A44]' : 'bg-white text-stone-600 border-[#E5DEC9] hover:border-[#2E5A44]'}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#F2EDE4] text-[10px] uppercase tracking-wider text-stone-500 font-bold">
              <tr>
                <th className="px-5 py-3">Modelo</th>
                <th className="px-5 py-3">Ingresos</th>
                <th className="px-5 py-3">Gastos deducibles</th>
                <th className="px-5 py-3">Resultado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE7DA]">
              {quarterDeclarations.map((declaration) => {
                const status = getStatusMeta(declaration.status);
                const StatusIcon = status.icon;
                return (
                  <tr key={declaration.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-sm text-stone-900">Modelo {declaration.modelType}</p>
                      <p className="text-[11px] text-stone-400">{selectedQuarter}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-stone-700">{formatMoney(declaration.grossIncome)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-stone-700">{formatMoney(declaration.deductibleExpenses)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-stone-900">{formatMoney(declaration.taxAmount)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${status.className}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedDeclaration(declaration)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9D1C2] text-xs font-semibold text-stone-700 hover:bg-white hover:border-[#2E5A44]"
                      >
                        <Eye size={14} /> Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-900">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Importante</p>
          <p className="text-xs leading-relaxed mt-0.5">Los cálculos de Labora+ son una herramienta de preparación y control. La presentación y el tratamiento fiscal definitivo deben revisarse con el profesional responsable y la normativa vigente.</p>
        </div>
      </div>

      {selectedDeclaration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#FCFAF7] border border-[#E8DFC8] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E8DFC8] flex justify-between items-start gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#2E5A44]">{selectedQuarter}</p>
                <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">{selectedDeclaration.title}</h3>
              </div>
              <button onClick={() => setSelectedDeclaration(null)} className="p-2 rounded-full hover:bg-[#F2EDE4] text-stone-500"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E8DFC8]"><p className="text-[10px] text-stone-400 uppercase font-bold">Rendimiento neto</p><p className="font-bold text-stone-900 mt-1">{formatMoney(selectedDeclaration.netYield)}</p></div>
                <div className="p-3 rounded-xl bg-white border border-[#E8DFC8]"><p className="text-[10px] text-stone-400 uppercase font-bold">Resultado estimado</p><p className="font-bold text-stone-900 mt-1">{formatMoney(selectedDeclaration.taxAmount)}</p></div>
              </div>

              {selectedDeclaration.filingReference && (
                <div className="p-3 rounded-xl bg-[#EBF3ED] border border-[#D0E5D7] text-xs text-[#245338]">
                  <strong>Referencia registrada:</strong> {selectedDeclaration.filingReference}
                </div>
              )}

              {isManager && selectedDeclaration.status !== 'filed_with_tax_agency' && (
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5">Referencia oficial de presentación</label>
                  <input
                    value={filingRef}
                    onChange={(e) => setFilingRef(e.target.value)}
                    placeholder="Ej. AEAT-303-2026-..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9D1C2] bg-white text-sm outline-none focus:ring-2 focus:ring-[#2E5A44]/20 focus:border-[#2E5A44]"
                  />
                  <button onClick={handleFile} className="w-full mt-3 px-4 py-2.5 bg-[#2E5A44] hover:bg-[#244735] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <ExternalLink size={16} /> Registrar como presentado
                  </button>
                </div>
              )}

              {!isManager && setView && (
                <button onClick={() => { setSelectedDeclaration(null); setView('gestor-requirements'); }} className="w-full px-4 py-2.5 border border-[#D9D1C2] rounded-xl text-sm font-semibold text-stone-700 hover:bg-white flex items-center justify-center gap-2">
                  <Building2 size={16} /> Consultar con mi gestor
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
