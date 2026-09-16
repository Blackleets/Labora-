import React, { useState } from 'react';
import { 
  FileCheck, Shield, AlertCircle, Calendar, Download, CheckCircle, 
  ExternalLink, ArrowUpRight, Scale, Clock, FileText, ChevronRight,
  FileSpreadsheet, X, Building2, UserCheck, Printer
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
    fileTaxDeclaration, showNotification 
  } = useData();

  const [selectedQuarter, setSelectedQuarter] = useState<string>('3T 2026');
  const [filingModalDec, setFilingModalDec] = useState<any | null>(null);
  const [customCsvRef, setCustomCsvRef] = useState<string>('');
  const [show036Modal, setShow036Modal] = useState<boolean>(false);

  const isManager = currentUser?.role === UserRole.MANAGER;
  const riderId = currentUser?.role === UserRole.RIDER ? currentUser.id : 'u1';

  // Quarterly calculation
  const { model130: currentCalc130, model303: currentCalc303 } = calculateQuarterlyTaxes(riderId, selectedQuarter);

  const userDeclarations = declarations.filter(d => d.userId === riderId);

  const handleFileDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filingModalDec) return;

    const ref = customCsvRef.trim() || `AEAT-${filingModalDec.modelType}-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    fileTaxDeclaration(filingModalDec.id, ref);
    setFilingModalDec(null);
    setCustomCsvRef('');
  };

  const handleDownloadProof = (dec: any) => {
    const proofText = `
======================================================
AGENCIA ESTATAL DE ADMINISTRACIÓN TRIBUTARIA (AEAT)
DOCUMENTO JUSTIFICANTE DE PRESENTACIÓN TELEMÁTICA
======================================================
MODELO: ${dec.modelType} - ${dec.title}
EJERCICIO: 2026 | PERIODO: ${dec.quarter}
TITULAR: ${currentUser?.name}
NIF/NIE: ${currentUser?.nif || '48192834K'}
EPÍGRAFE IAE: ${currentUser?.iaeCode || '849.5 - Servicios de mensajería y recadería'}
RÉGIMEN: Estimación Directa Simplificada

DATOS ECONÓMICOS DECLARADOS:
- Ingresos íntegros computables: ${dec.grossIncome.toFixed(2)} €
- Gastos fiscalmente deducibles: ${dec.deductibleExpenses.toFixed(2)} €
- Rendimiento neto de la actividad: ${dec.netYield.toFixed(2)} €
- Liquidación a ingresar: ${dec.taxAmount.toFixed(2)} €

CÓDIGO SEGURO DE VERIFICACIÓN (CSV): ${dec.filingReference || 'AEAT-OFFICIAL-VERIFIED'}
FECHA DE PRESENTACIÓN: ${dec.filedAt || new Date().toISOString().split('T')[0]}
GESTOR RESPONSABLE: Gestoría Fiscal Pérez S.L. (Col. 9421)
======================================================
`;
    const blob = new Blob([proofText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Justificante_${dec.modelType}_${dec.quarter}.txt`;
    a.click();
    showNotification('success', `Justificante oficial de ${dec.title} descargado`);
  };

  // Export official Spanish "Libro Registro de Facturas Recibidas y Gastos" (AEAT Orden HAC/773/2019)
  const handleExportLibroGastos = () => {
    const userExpenses = expenses.filter(e => e.userId === riderId || !e.userId);
    const csvHeader = 'FECHA,NUMERO_TICKET_FACTURA,PROVEEDOR,CATEGORIA,BASE_IMPONIBLE,TIPO_IVA,CUOTA_IVA,TOTAL_GASTO,ESTADO_GESTORIA,FOTO_RESPALDO\n';
    const csvRows = userExpenses.map(e => {
      const total = e.amount;
      const vatRate = e.vatRate || 21;
      const base = (total / (1 + vatRate / 100)).toFixed(2);
      const cuota = (total - parseFloat(base)).toFixed(2);
      const status = e.status === 'approved' ? 'VALIDADO_AEAT' : (e.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE_REVISION');
      const hasPhoto = e.receiptUrl ? 'SI_DIGITALIZADO' : 'SIN_FOTO';
      const merchant = `"${(e.merchant || e.notes || 'Proveedor').replace(/"/g, '""')}"`;
      return `${e.date},${e.invoiceNumber || 'TICK-SN'},${merchant},${e.category},${base},${vatRate}%,${cuota},${total.toFixed(2)},${status},${hasPhoto}`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Libro_Registro_Gastos_AEAT_${selectedQuarter.replace(' ', '_')}.csv`;
    a.click();
    showNotification('success', 'Libro de Facturas y Gastos descargado en CSV oficial para Hacienda');
  };

  // Export official "Libro Registro de Ventas e Ingresos"
  const handleExportLibroIngresos = () => {
    const userIncomes = incomes.filter(i => i.userId === riderId || !i.userId);
    const csvHeader = 'FECHA,PLATAFORMA_CLIENTE,IMPORTE_BRUTO,RETENCION_IRPF,IMPORTE_NETO,CONCEPTO\n';
    const csvRows = userIncomes.map(i => {
      const merchant = `"${(i.platform || 'Plataforma').replace(/"/g, '""')}"`;
      const notes = `"${(i.notes || 'Reparto a domicilio').replace(/"/g, '""')}"`;
      return `${i.date},${merchant},${i.amount.toFixed(2)},${(i.retention || 0).toFixed(2)},${((i.amount) - (i.retention || 0)).toFixed(2)},${notes}`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Libro_Registro_Ingresos_AEAT_${selectedQuarter.replace(' ', '_')}.csv`;
    a.click();
    showNotification('success', 'Libro de Ingresos descargado en CSV oficial');
  };

  return (
    <div id="tax-declarations-viewer" className="space-y-6 animate-in fade-in duration-300">
      {setView && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('dashboard')}
            className="text-xs font-serif font-bold text-[#2E5A44] hover:text-[#1F3D2E] flex items-center space-x-1"
          >
            <span>← Volver al Panel</span>
          </button>
          <div className="flex items-center space-x-2 text-xs font-serif">
            <button
              onClick={() => setView('money')}
              className="text-stone-600 hover:text-stone-900 font-semibold hover:underline"
            >
              Auditar Gastos
            </button>
            <span className="text-stone-300">•</span>
            <button
              onClick={() => setView('gestor-requirements')}
              className="text-stone-600 hover:text-stone-900 font-semibold hover:underline"
            >
              Avisos del Gestor
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Fiscal Situation (036 / 037 + RETA) */}
      <div className="bg-[#213B2F] text-white rounded-3xl p-6 shadow-sm border border-[#345947]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#2F5241] text-[#D8EADB] text-xs font-serif font-semibold rounded-full border border-[#48735E] flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5 text-[#A3D9B1]" />
                <span>Situación Censal AEAT: ALTA ACTIVA</span>
              </span>
              <button 
                onClick={() => setShow036Modal(true)}
                className="px-3 py-1 bg-[#FAF7F2] hover:bg-white text-stone-800 text-xs font-serif font-semibold rounded-full border border-[#E8DFC8] flex items-center space-x-1 transition-colors"
              >
                <FileText className="w-3 h-3 text-[#C96846]" />
                <span>Ver Modelo 036 / 037</span>
              </button>
            </div>
            <h2 className="text-xl font-serif font-bold tracking-tight text-white">
              Cumplimiento Tributario de Autónomos
            </h2>
            <p className="text-[#D3E3D8] text-xs max-w-2xl leading-relaxed">
              Epígrafe IAE: <strong className="text-white">{currentUser?.iaeCode || '849.5 (Mensajería, recadería y reparto)'}</strong> • Régimen IRPF: <strong className="text-white">Estimación Directa Simplificada</strong> • Seguridad Social: <strong className="text-white">Tarifa Plana RETA (80€/mes)</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

      {/* Model Overview Catalog */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-[#2E5A44]" />
            <span>Modelos Tributarios Oficiales (Hacienda España)</span>
          </h3>
          <span className="text-xs font-serif text-stone-500">Calculados automáticamente con tus ingresos y tickets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SPANISH_TAX_MODELS.map((model) => (
            <div
              key={model.code}
              className="bg-[#FCFAF7] rounded-2xl p-4 border border-[#E8DFC8] shadow-sm flex flex-col justify-between hover:border-[#2E5A44] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 bg-[#EBF3ED] text-[#245338] text-xs font-mono font-bold rounded-lg border border-[#D0E5D7]">
                    Modelo {model.code}
                  </span>
                  <span className="text-[11px] font-serif font-semibold text-stone-600 bg-[#F2EDE4] px-2.5 py-0.5 rounded-full border border-[#E5DEC9]">
                    {model.frequency}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 mb-1">{model.title}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">{model.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8DFC8] flex items-center justify-between text-xs">
                <span className="text-stone-400 font-serif">Plazo límite:</span>
                <span className="font-serif font-semibold text-stone-700">{model.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly Selector & Declarations Live Table */}
      <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DFC8] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8DFC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2]">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900">
              Liquidaciones Trimestrales en Tiempo Real
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-serif">
              Resultados calculados con tus tickets de combustible y facturas validadas
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-serif font-semibold text-stone-600">Trimestre:</span>
            {['1T 2026', '2T 2026', '3T 2026', '4T 2026'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1.5 text-xs font-serif font-semibold rounded-xl transition-all ${
                  selectedQuarter === q
                    ? 'bg-[#2E5A44] text-white shadow-sm'
                    : 'bg-white text-stone-600 border border-[#DFD5C6] hover:bg-[#F2EDE4]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#E8DFC8] bg-white">
          {/* Card: Modelo 130 */}
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-[#FAF7F2] transition-colors">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-[#2E5A44] text-white font-mono text-xs font-bold rounded-lg">
                  MOD. 130
                </span>
                <h4 className="text-base font-serif font-bold text-stone-900">
                  Pago Fraccionado IRPF (20% Beneficio Neto)
                </h4>
                <span className="text-xs font-mono text-stone-400">({selectedQuarter})</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Anticipo a cuenta del IRPF anual calculado sobre el rendimiento neto acumulado (ingresos de plataformas menos gastos deducibles de gasolina, cuota y mantenimiento).
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC8]">
                  <p className="text-stone-400 text-[10px] uppercase font-serif font-bold">Ingresos Computables</p>
                  <p className="text-sm font-serif font-bold text-stone-800 mt-0.5">{currentCalc130.grossIncome.toFixed(2)} €</p>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC8]">
                  <p className="text-stone-400 text-[10px] uppercase font-serif font-bold">Gastos Justificados</p>
                  <p className="text-sm font-serif font-bold text-stone-800 mt-0.5">{currentCalc130.deductibleExpenses.toFixed(2)} €</p>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC8]">
                  <p className="text-stone-400 text-[10px] uppercase font-serif font-bold">Rendimiento Neto</p>
                  <p className="text-sm font-serif font-bold text-[#2E5A44] mt-0.5">{currentCalc130.netYield.toFixed(2)} €</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs pt-1">
                <span className="text-stone-500 font-serif">Cuota a ingresar (20%):</span>
                <span className="text-base font-serif font-bold text-[#85531B]">
                  {currentCalc130.taxAmount.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {userDeclarations.find(d => d.quarter === selectedQuarter && d.modelType === '130' && d.status === 'filed_with_tax_agency') ? (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#EBF3ED] text-[#245338] text-xs font-serif font-semibold rounded-xl flex items-center space-x-1 border border-[#D0E5D7]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Presentado en AEAT</span>
                  </span>
                  <button
                    onClick={() => handleDownloadProof(userDeclarations.find(d => d.quarter === selectedQuarter && d.modelType === '130'))}
                    className="p-2 text-stone-600 hover:text-[#2E5A44] hover:bg-[#FAF7F2] rounded-xl border border-[#DFD5C6] transition-colors"
                    title="Descargar justificante oficial"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#FEF7EB] text-[#85531B] text-xs font-serif font-semibold rounded-xl flex items-center space-x-1 border border-[#FDE3B8]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Borrador en Preparación</span>
                  </span>
                  {isManager && (
                    <button
                      onClick={() => setFilingModalDec(currentCalc130)}
                      className="px-3.5 py-1.5 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Presentar Declaración</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card: Modelo 303 */}
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-[#FAF7F2] transition-colors">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-[#3A7596] text-white font-mono text-xs font-bold rounded-lg">
                  MOD. 303
                </span>
                <h4 className="text-base font-serif font-bold text-stone-900">
                  Autoliquidación Periódica del IVA (21%)
                </h4>
                <span className="text-xs font-mono text-stone-400">({selectedQuarter})</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Liquidación entre el IVA repercutido a plataformas de delivery y el IVA soportado deducible de tickets de combustible con foto y gastos de actividad.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC8]">
                  <p className="text-stone-400 text-[10px] uppercase font-serif font-bold">IVA Repercutido (21%)</p>
                  <p className="text-sm font-serif font-bold text-stone-800 mt-0.5">
                    {(currentCalc303.grossIncome * 0.21).toFixed(2)} €
                  </p>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC8]">
                  <p className="text-stone-400 text-[10px] uppercase font-serif font-bold">IVA Soportado Deducible</p>
                  <p className="text-sm font-serif font-bold text-stone-800 mt-0.5">
                    {(currentCalc303.deductibleExpenses * 0.21).toFixed(2)} €
                  </p>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC8]">
                  <p className="text-stone-400 text-[10px] uppercase font-serif font-bold">Diferencia Neta</p>
                  <p className="text-sm font-serif font-bold text-[#3A7596] mt-0.5">{currentCalc303.taxAmount.toFixed(2)} €</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs pt-1">
                <span className="text-stone-500 font-serif">Resultado liquidación IVA:</span>
                <span className="text-base font-serif font-bold text-[#3A7596]">
                  {currentCalc303.taxAmount.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {userDeclarations.find(d => d.quarter === selectedQuarter && d.modelType === '303' && d.status === 'filed_with_tax_agency') ? (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#EBF3ED] text-[#245338] text-xs font-serif font-semibold rounded-xl flex items-center space-x-1 border border-[#D0E5D7]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Presentado en AEAT</span>
                  </span>
                  <button
                    onClick={() => handleDownloadProof(userDeclarations.find(d => d.quarter === selectedQuarter && d.modelType === '303'))}
                    className="p-2 text-stone-600 hover:text-[#2E5A44] hover:bg-[#FAF7F2] rounded-xl border border-[#DFD5C6] transition-colors"
                    title="Descargar justificante oficial"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#FEF7EB] text-[#85531B] text-xs font-serif font-semibold rounded-xl flex items-center space-x-1 border border-[#FDE3B8]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Borrador en Preparación</span>
                  </span>
                  {isManager && (
                    <button
                      onClick={() => setFilingModalDec(currentCalc303)}
                      className="px-3.5 py-1.5 bg-[#3A7596] hover:bg-[#2C5F7B] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-1 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Presentar Declaración</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Presentar Declaración con Justificante CSV */}
      {filingModalDec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FCFAF7] rounded-3xl shadow-2xl max-w-md w-full p-6 border border-[#E8DFC8]">
            <h3 className="text-base font-serif font-bold text-stone-900 mb-1">
              Confirmar Presentación en Agencia Tributaria
            </h3>
            <p className="text-xs text-stone-500 mb-4 font-serif">
              Registra el código de justificante o CSV devuelto por la sede electrónica de Hacienda al presentar el {filingModalDec.title}.
            </p>

            <form onSubmit={handleFileDeclaration} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-stone-700 mb-1">
                  Código Seguro de Verificación (CSV / Justificante)
                </label>
                <input
                  type="text"
                  placeholder="Ej. AEAT-130-2026-981245X"
                  value={customCsvRef}
                  onChange={(e) => setCustomCsvRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E3DBD0] rounded-xl focus:ring-2 focus:ring-[#2E5A44] focus:outline-none bg-white text-stone-900"
                />
                <p className="text-[11px] text-stone-400 mt-1 font-serif">
                  Si se deja vacío, el sistema generará un código de verificación estándar.
                </p>
              </div>

              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8DFC8] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Modelo:</span>
                  <span className="font-serif font-bold text-stone-800">{filingModalDec.modelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Periodo:</span>
                  <span className="font-serif font-bold text-stone-800">{filingModalDec.quarter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Total liquidación:</span>
                  <span className="font-serif font-bold text-[#85531B]">{filingModalDec.taxAmount.toFixed(2)} €</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFilingModalDec(null)}
                  className="px-4 py-2 text-xs font-serif font-semibold text-stone-600 hover:bg-[#FAF7F2] rounded-xl border border-[#DFD5C6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl shadow-sm transition-all"
                >
                  Registrar Presentación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha Censal Modelo 036 / 037 */}
      {show036Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FCFAF7] rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-[#E8DFC8] space-y-4">
            <div className="flex items-start justify-between border-b border-[#E8DFC8] pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#EBF3ED] text-[#245338] rounded-2xl border border-[#D0E5D7]">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Ficha Censal Oficial (Modelo 036 / 037)
                  </h3>
                  <p className="text-xs text-stone-500 font-serif">
                    Declaración censal de comienzo de actividad en la Agencia Tributaria
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShow036Modal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] shadow-sm">
                  <span className="text-stone-400 block text-[10px] uppercase font-serif font-bold">Titular Autónomo</span>
                  <span className="font-serif font-bold text-stone-800 text-sm mt-0.5 block">{currentUser?.name}</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DFC8] shadow-sm">
                  <span className="text-stone-400 block text-[10px] uppercase font-serif font-bold">NIF / NIE</span>
                  <span className="font-mono font-bold text-stone-800 text-sm mt-0.5 block">{currentUser?.nif || '48192834K'}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8DFC8] space-y-2.5 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Epígrafe IAE:</span>
                  <span className="font-serif font-bold text-stone-800">849.5 - Servicios de mensajería y reparto</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Método Determinación IRPF:</span>
                  <span className="font-serif font-bold text-stone-800">Estimación Directa Simplificada (Mod. 130)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Régimen IVA:</span>
                  <span className="font-serif font-bold text-stone-800">Régimen General (Mod. 303 - 21%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Seguridad Social:</span>
                  <span className="font-serif font-bold text-[#2E5A44]">RETA - Tarifa Plana 80€/mes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-serif">Vehículo Afecto:</span>
                  <span className="font-serif font-bold text-stone-800">{currentUser?.vehicleType?.toUpperCase() || 'MOTO'} ({currentUser?.vehiclePlate || '4521 LBR'})</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#EBF3ED] text-[#245338] rounded-2xl border border-[#D0E5D7] flex items-start space-x-2">
                <Shield className="w-4 h-4 text-[#2E5A44] shrink-0 mt-0.5" />
                <p className="text-[11px] font-serif leading-relaxed">
                  Alta censal validada telemáticamente. Todos los tickets de combustible, revisiones y telefonía asociados al epígrafe 849.5 son computables como gasto deducible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E8DFC8]">
              <button
                type="button"
                onClick={() => setShow036Modal(false)}
                className="px-4 py-2 bg-[#2E5A44] hover:bg-[#234735] text-white text-xs font-serif font-semibold rounded-xl transition-all shadow-sm"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
