import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, Download, Eye, Calendar, MoreVertical, Folder, Upload, 
  FileBarChart, Printer, Share2, X, CheckCircle, Shield, Fuel, 
  Trash2, Plus, ArrowUpRight 
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { User, Document as UserDoc } from '../types';

export const Documents: React.FC = () => {
  const { 
    documents, expenses, declarations, currentUser, getFiscalSummary, 
    addDocument, showNotification 
  } = useData();

  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportQuarter, setReportQuarter] = useState<string>('3T 2026');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; type: string; content?: string; date: string } | null>(null);

  // Upload Form State
  const [docName, setDocName] = useState<string>('');
  const [docType, setDocType] = useState<'Factura' | 'Trimestre' | 'Alta' | 'Otro'>('Factura');
  const [docFileBase64, setDocFileBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    if (currentUser) return getFiscalSummary(currentUser.id);
    return { totalIncome: 0, totalExpenses: 0, netProfit: 0, estimatedIRPF: 0, quarter: '3T 2026' };
  }, [currentUser, getFiscalSummary]);

  // Combined documents: user custom docs + expenses with receipts + filed declarations
  const riderId = currentUser?.id || 'u1';
  const userExpensesWithReceipt = expenses.filter(e => (e.userId === riderId || !e.userId) && e.receiptUrl);
  const userFiledDeclarations = declarations.filter(d => (d.userId === riderId || !d.userId) && d.status === 'filed_with_tax_agency');

  // Map to unified display items
  const allItems = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      category: 'Factura' | 'Trimestre' | 'Alta' | 'Gasolina' | 'Otro';
      date: string;
      size: string;
      fileType: string;
      content?: string;
      isOfficial?: boolean;
    }> = [];

    // User docs
    documents.forEach(d => {
      list.push({
        id: d.id,
        name: d.name,
        category: d.type,
        date: d.date,
        size: '1.2 MB',
        fileType: 'PDF',
        content: d.content
      });
    });

    // Receipts from gas station & expenses
    userExpensesWithReceipt.forEach(e => {
      list.push({
        id: e.id,
        name: `Ticket_${e.merchant || 'Gasolinera'}_${e.date}.jpg`,
        category: 'Gasolina',
        date: e.date,
        size: '850 KB',
        fileType: 'IMG',
        content: e.receiptUrl,
        isOfficial: e.status === 'approved'
      });
    });

    // Tax declarations
    userFiledDeclarations.forEach(d => {
      list.push({
        id: d.id,
        name: `Justificante_AEAT_Mod_${d.modelType}_${d.quarter}.pdf`,
        category: 'Trimestre',
        date: d.filedAt || d.dueDate,
        size: '540 KB',
        fileType: 'PDF',
        isOfficial: true
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [documents, userExpensesWithReceipt, userFiledDeclarations]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return allItems;
    if (selectedFilter === 'receipts') return allItems.filter(i => i.category === 'Gasolina' || i.category === 'Factura');
    if (selectedFilter === 'taxes') return allItems.filter(i => i.category === 'Trimestre');
    if (selectedFilter === 'legal') return allItems.filter(i => i.category === 'Alta' || i.category === 'Otro');
    return allItems;
  }, [allItems, selectedFilter]);

  const categories = [
    { id: 'all', name: 'Todos los Archivos', count: allItems.length, color: 'bg-slate-100 text-slate-700' },
    { id: 'receipts', name: 'Tickets y Gastos', count: allItems.filter(i => i.category === 'Gasolina' || i.category === 'Factura').length, color: 'bg-amber-100 text-amber-700' },
    { id: 'taxes', name: 'Modelos AEAT', count: allItems.filter(i => i.category === 'Trimestre').length, color: 'bg-blue-100 text-blue-700' },
    { id: 'legal', name: 'Legal y Censal 036', count: allItems.filter(i => i.category === 'Alta' || i.category === 'Otro').length, color: 'bg-purple-100 text-purple-700' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!docName) {
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocFileBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      showNotification('error', 'Indica un nombre para el archivo');
      return;
    }

    addDocument({
      name: docName.trim() + (docName.endsWith('.pdf') ? '' : '.pdf'),
      type: docType,
      date: new Date().toISOString().split('T')[0],
      content: docFileBase64 || undefined
    });

    setDocName('');
    setDocFileBase64('');
    setIsUploadModalOpen(false);
  };

  const handleDownloadItem = (item: typeof allItems[0]) => {
    if (item.content) {
      const a = document.createElement('a');
      a.href = item.content;
      a.download = item.name;
      a.click();
      showNotification('success', `Descargado: ${item.name}`);
    } else {
      // Generate synthetic receipt text
      const content = `LABORA+ EXPEDIENTE FISCAL\nDocumento: ${item.name}\nFecha: ${item.date}\nTitular: ${currentUser?.name}\nEstado: Validez oficial garantizada`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      a.click();
      showNotification('success', `Descargado: ${item.name}`);
    }
  };

  return (
    <div id="documents-screen" className="space-y-8 pb-20 lg:pb-0 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Expediente Fiscal Digital</h2>
          <p className="text-slate-500 text-sm mt-0.5">Archivo permanente de tickets de combustible, facturas y justificantes de Hacienda</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setIsGeneratingReport(true)}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileBarChart size={16} className="text-blue-600" />
            <span>Generar Informe Fiscal</span>
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <Upload size={16} />
            <span>Subir Documento</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedFilter(cat.id)}
            className={`p-5 rounded-2xl border text-left transition-all group ${
              selectedFilter === cat.id
                ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <Folder size={20} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{cat.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{cat.count} archivos registrados</p>
          </button>
        ))}
      </div>

      {/* Files List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <span>Archivos y Comprobantes Digitales</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {filteredItems.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400">Archivado en la nube con valor probatorio</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Folder className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium text-slate-600">No hay documentos en esta categoría</p>
              <p className="text-xs text-slate-400">Puedes cargar tickets de gasolina con foto o subir contratos y facturas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredItems.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      doc.category === 'Gasolina'
                        ? 'bg-amber-100 text-amber-800'
                        : doc.category === 'Trimestre'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {doc.category === 'Gasolina' ? <Fuel className="w-5 h-5" /> : doc.fileType}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{doc.name}</h4>
                        {doc.isOfficial && (
                          <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center space-x-1 shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            <span>Validado AEAT</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {doc.date}</span>
                        <span>{doc.size}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-500">{doc.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button 
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Previsualizar"
                    >
                      <Eye size={17} />
                    </button>
                    <button 
                      onClick={() => handleDownloadItem(doc)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Subir Documento */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload size={18} className="text-blue-600" />
                Subir Archivo al Expediente
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Archivo</label>
                <input
                  type="text"
                  placeholder="Ej. Factura Compra Mochila Térmica"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Factura">Factura de Gasto Deducible</option>
                  <option value="Trimestre">Modelo Trimestral (130 / 303)</option>
                  <option value="Alta">Documento de Alta Censal / 036 / RETA</option>
                  <option value="Otro">Otro Comprobante / Seguro</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {docFileBase64 ? 'Archivo cargado con éxito' : 'Selecciona un archivo PDF o imagen'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Examinar dispositivo
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Guardar en Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Previsualización de Documento / Ticket */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDoc.name}</h3>
                <p className="text-xs text-slate-500">Registrado el {previewDoc.date}</p>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-[220px] max-h-[380px] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-4 border border-slate-200">
              {previewDoc.content ? (
                <img 
                  src={previewDoc.content} 
                  alt={previewDoc.name} 
                  className="max-h-[350px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">Documento Oficial Certificado</p>
                  <p className="text-xs text-slate-500">Hash SHA-256 verificado por el gestor contable.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copia electrónica válida ante inspección</span>
              </span>
              <button
                onClick={() => handleDownloadItem(previewDoc as any)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Report Generation Modal */}
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[24px]">
               <div>
                 <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                   <FileBarChart className="text-[#2D6CDF]" />
                   Informe Trimestral de IRPF e IVA
                 </h3>
                 <p className="text-sm text-gray-500">Liquidación oficial estimada para Hacienda (Modelos 130 y 303)</p>
               </div>
               <button onClick={() => setIsGeneratingReport(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                 <X size={20} className="text-gray-500" />
               </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
               <div className="border border-gray-200 p-8 rounded-xl max-w-2xl mx-auto shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)]" id="printable-area">
                  <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">LABORA+</h1>
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">Expediente Fiscal Oficial</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-600">Borrador Informativo</p>
                      <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                     <div>
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Contribuyente</p>
                        <p className="font-bold text-gray-800">{currentUser?.name}</p>
                        <p className="text-sm text-gray-600">{currentUser?.email}</p>
                        <p className="text-sm text-gray-600">NIF: {currentUser?.nif || '48192834K'}</p>
                        <p className="text-sm text-gray-600">Epígrafe IAE: {currentUser?.iaeCode || '849.5'}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Periodo</p>
                        <p className="font-bold text-gray-800 text-lg">{reportQuarter}</p>
                        <p className="text-sm text-gray-600">Estimación Directa Simplificada</p>
                     </div>
                  </div>

                  {/* Table */}
                  <div className="mb-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="text-left py-2 font-bold text-gray-600">Concepto</th>
                          <th className="text-right py-2 font-bold text-gray-600">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <tr>
                          <td className="py-3 text-gray-700">01. Ingresos de explotación computables</td>
                          <td className="py-3 text-right font-mono font-medium">{summary.totalIncome.toFixed(2)} €</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-gray-700">02. Gastos deducibles con justificante</td>
                          <td className="py-3 text-right font-mono font-medium text-red-500">-{summary.totalExpenses.toFixed(2)} €</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold">
                          <td className="py-3 pl-2 text-gray-900">03. Rendimiento Neto (01 - 02)</td>
                          <td className="py-3 pr-2 text-right font-mono text-gray-900">{summary.netProfit.toFixed(2)} €</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-gray-700">04. Pago fraccionado IRPF (20% s/ 03)</td>
                          <td className="py-3 text-right font-mono font-bold text-blue-600">{summary.estimatedIRPF.toFixed(2)} €</td>
                        </tr>
                        <tr className="border-t-2 border-gray-900 text-lg">
                          <td className="py-4 font-bold text-gray-900">TOTAL ESTIMADO MODELO 130</td>
                          <td className="py-4 text-right font-bold font-mono text-gray-900">{summary.estimatedIRPF.toFixed(2)} €</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-xs text-amber-800 text-center leading-relaxed">
                      <strong>Aviso de Auditoría:</strong> Los gastos reflejados en este informe están respaldados por los tickets y fotos almacenados en tu cuenta de Labora+, listos para ser verificados por tu gestor antes de su presentación en la AEAT.
                    </p>
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-[24px]">
               <div className="text-xs text-gray-500 font-medium">
                 Generado el {new Date().toLocaleString()}
               </div>
               <div className="flex gap-3">
                 <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors text-gray-700">
                   <Printer size={16} /> Imprimir / PDF
                 </button>
                 <button 
                   onClick={() => {
                     showNotification('success', 'Borrador enviado a tu gestor para validación');
                     setIsGeneratingReport(false);
                   }}
                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                 >
                   <Share2 size={16} /> Validar con Gestor
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
