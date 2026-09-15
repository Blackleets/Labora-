
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Camera, Loader2, Plus, Receipt, X, AlignLeft, Calendar, Euro, Save, Image as ImageIcon, Maximize2, Tag, CheckCircle2, ZoomIn, ZoomOut, RotateCcw, Fuel, Wrench, Utensils, Smartphone, Shield, Briefcase, ShoppingBag, Monitor, BookOpen, HelpCircle, Repeat, Trash2, Eye, ScanLine, Clock } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';
import { ExpenseCategory, Expense } from '../types';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface ExpenseTrackerProps {
  startDate: string;
  endDate: string;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ startDate, endDate }) => {
  const { expenses, addExpense, updateExpense, showNotification, privacyMode } = useData();
  const [isScanning, setIsScanning] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // State for viewing image
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Image Viewer State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format currency respecting Privacy Mode
  const formatCurrency = (amount: number) => {
    if (privacyMode) return '**** €';
    return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (startDate && expense.date < startDate) return false;
      if (endDate && expense.date > endDate) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      setIsScanning(true);
      
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          const base64Data = base64.split(',')[1]; // Remove data header

          try {
            const result = await analyzeReceipt(base64Data);
            
            setSelectedExpense({
              id: 'temp_' + Date.now(),
              userId: '',
              category: result.category,
              date: result.date,
              amount: result.amount,
              notes: `${result.merchantName} - ${result.summary}`,
              receiptUrl: base64,
              isRecurring: false
            });
            setIsManualOpen(true);
            showNotification('success', 'Ticket analizado correctamente');
          } catch (error) {
            console.error(error);
            showNotification('error', 'Error al leer ticket. Inténtalo manual.');
          } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    // Validation
    if (!selectedExpense.amount || !selectedExpense.date || !selectedExpense.category) {
      showNotification('error', 'Rellena todos los campos obligatorios');
      return;
    }

    if (selectedExpense.id.startsWith('temp_')) {
      addExpense({
        category: selectedExpense.category,
        date: selectedExpense.date,
        amount: Number(selectedExpense.amount),
        notes: selectedExpense.notes,
        receiptUrl: selectedExpense.receiptUrl,
        isRecurring: selectedExpense.isRecurring
      });
    } else {
      updateExpense(selectedExpense);
    }
    
    setIsManualOpen(false);
    setSelectedExpense(null);
  };

  const openManualEntry = () => {
    setSelectedExpense({
      id: 'temp_' + Date.now(),
      userId: '',
      category: ExpenseCategory.OTROS,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: '',
      isRecurring: false
    });
    setIsManualOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setSelectedExpense({ ...expense });
    setIsManualOpen(true);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Gasolina': return <Fuel size={18} />;
      case 'Mantenimiento': return <Wrench size={18} />;
      case 'Comida': return <Utensils size={18} />;
      case 'Móvil': return <Smartphone size={18} />;
      case 'Cuota Autónomo': return <Shield size={18} />;
      case 'Equipamiento': return <Briefcase size={18} />;
      case 'Marketing': return <ShoppingBag size={18} />;
      case 'Suscripciones Software': return <Monitor size={18} />;
      case 'Formación': return <BookOpen size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  // Image Viewer Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleAdjustment = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(1, zoom + scaleAdjustment), 4);
    setZoom(newZoom);
    
    // Reset pan if zoomed out to 1
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-6 relative">
      {/* Hidden Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileSelect}
      />

      {/* Actions Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Gas Station Receipt with Photo Backup */}
        <button 
          onClick={() => setIsGasModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-4 rounded-[20px] shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 transition-all active:scale-95 group"
        >
          <Fuel className="group-hover:scale-110 transition-transform shrink-0" size={24} />
          <div className="text-left min-w-0">
            <p className="font-bold text-sm truncate">Repostaje Gasolinera</p>
            <p className="text-[11px] opacity-90 font-medium truncate">Foto ticket + IRPF/IVA</p>
          </div>
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex items-center justify-center gap-3 bg-[#2D6CDF] text-white py-4 px-4 rounded-[20px] shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 group"
        >
          {isScanning ? (
            <Loader2 className="animate-spin shrink-0" size={24} />
          ) : (
            <Camera className="group-hover:rotate-12 transition-transform shrink-0" size={24} />
          )}
          <div className="text-left min-w-0">
            <p className="font-bold text-sm truncate">{isScanning ? 'Analizando...' : 'Escanear Ticket'}</p>
            <p className="text-[11px] opacity-80 font-medium truncate">Cualquier gasto con IA</p>
          </div>
        </button>

        <button 
          onClick={openManualEntry}
          className="flex items-center justify-center gap-3 bg-white border-2 border-dashed border-gray-200 text-gray-600 py-4 px-4 rounded-[20px] hover:border-[#2D6CDF] hover:text-[#2D6CDF] hover:bg-blue-50 transition-all active:scale-95"
        >
          <div className="bg-gray-100 p-1.5 rounded-full shrink-0">
            <Plus size={18} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-bold text-sm truncate">Añadir Manual</p>
            <p className="text-[11px] opacity-60 font-medium truncate">Registro rápido</p>
          </div>
        </button>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-lg text-gray-900">Gastos Recientes</h3>
             <p className="text-xs text-gray-400 font-medium">{filteredExpenses.length} registros</p>
          </div>
          {startDate && (
            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              Filtrado
            </span>
          )}
        </div>
        
        <div className="divide-y divide-gray-50">
          {filteredExpenses.map((expense) => (
            <div 
              key={expense.id} 
              className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
              onClick={() => openEdit(expense)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-white group-hover:text-[#2D6CDF] group-hover:shadow-md transition-all">
                  {getCategoryIcon(expense.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800">{expense.category}</h4>
                    {expense.isRecurring && (
                      <Repeat size={12} className="text-purple-500" title="Gasto Recurrente" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="font-medium">{expense.date}</span>
                    {expense.notes && <span className="truncate max-w-[150px]">• {expense.notes}</span>}
                    {expense.status === 'approved' && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                        ✓ Validado AEAT
                      </span>
                    )}
                    {expense.status === 'pending_review' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 flex items-center space-x-1">
                        <Clock size={10} />
                        <span>En revisión Gestor</span>
                      </span>
                    )}
                    {expense.status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                        ✕ Rechazado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right">
                   <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                   {expense.receiptUrl && (
                     <span className="flex items-center justify-end gap-1 text-[10px] text-[#2D6CDF] font-bold">
                       <Receipt size={10} /> Ticket
                     </span>
                   )}
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(expense.receiptUrl) setViewingImage(expense.receiptUrl);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
                      title="Ver ticket"
                    >
                      <Eye size={18} />
                    </button>
                 </div>
              </div>
            </div>
          ))}
          
          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Receipt size={32} />
              </div>
              <p className="text-gray-400 text-sm font-medium">No hay gastos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) for Mobile Scan */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        className="fixed bottom-24 right-6 md:hidden w-14 h-14 bg-[#2D6CDF] text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center z-40 transition-transform active:scale-90 hover:scale-110"
        title="Escanear Ticket"
      >
        {isScanning ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <ScanLine size={24} strokeWidth={2.5} />
        )}
      </button>

      {/* Edit/Create Modal */}
      {isManualOpen && selectedExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[32px]">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedExpense.id.startsWith('temp_') ? 'Nuevo Gasto' : 'Editar Gasto'}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Detalles de la transacción</p>
              </div>
              <button onClick={() => setIsManualOpen(false)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5">
              
              {/* Amount Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-bold text-lg">€</span>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={selectedExpense.amount || ''} 
                  onChange={(e) => setSelectedExpense({ ...selectedExpense, amount: parseFloat(e.target.value) })}
                  className="w-full pl-10 pr-4 py-5 text-3xl font-bold text-gray-900 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#2D6CDF] outline-none transition-all text-center group-hover:bg-gray-100 focus:group-hover:bg-white placeholder-gray-300"
                  placeholder="0.00"
                />
                <p className="text-center text-xs text-gray-400 font-bold uppercase mt-2 tracking-widest">Importe Total</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                    <Calendar size={14} /> Fecha
                  </label>
                  <input 
                    type="date"
                    required
                    value={selectedExpense.date}
                    onChange={(e) => setSelectedExpense({ ...selectedExpense, date: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                    <Tag size={14} /> Categoría
                  </label>
                  <select 
                    value={selectedExpense.category}
                    onChange={(e) => setSelectedExpense({ ...selectedExpense, category: e.target.value as any })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2D6CDF] outline-none appearance-none"
                  >
                    {Object.values(ExpenseCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                 <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                    <AlignLeft size={14} /> Notas
                 </label>
                 <input 
                    type="text"
                    value={selectedExpense.notes || ''}
                    onChange={(e) => setSelectedExpense({ ...selectedExpense, notes: e.target.value })}
                    placeholder="Ej: Gasolinera Repsol"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2D6CDF] outline-none"
                 />
              </div>

              {/* Recurring Toggle */}
              <div 
                className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => setSelectedExpense({...selectedExpense, isRecurring: !selectedExpense.isRecurring})}
              >
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${selectedExpense.isRecurring ? 'bg-purple-500 text-white' : 'bg-white text-purple-300'}`}>
                     <Repeat size={18} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-purple-900">Gasto Recurrente</p>
                     <p className="text-[10px] text-purple-700">Se repite mensualmente (ej. Cuota)</p>
                   </div>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedExpense.isRecurring ? 'bg-purple-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${selectedExpense.isRecurring ? 'left-6' : 'left-1'}`}></div>
                 </div>
              </div>

              {/* Receipt Preview if available */}
              {selectedExpense.receiptUrl && (
                <div className="relative h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={selectedExpense.receiptUrl} alt="Ticket" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <button 
                       type="button"
                       onClick={() => setViewingImage(selectedExpense.receiptUrl || null)}
                       className="bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm hover:bg-black/70 transition-colors flex items-center gap-2"
                     >
                       <Maximize2 size={14} /> Ampliar Ticket
                     </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-[#2D6CDF] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Guardar Gasto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-in fade-in duration-300">
          {/* Viewer Toolbar */}
          <div className="flex justify-between items-center p-4 text-white bg-black/50 backdrop-blur-md z-10">
            <div className="flex gap-4">
              <button 
                onClick={() => setZoom(z => Math.max(1, z - 0.5))} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={24} />
              </button>
              <span className="self-center font-mono text-sm min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(4, z + 0.5))} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={24} />
              </button>
              <button 
                onClick={resetZoom} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors" 
                title="Reset View"
              >
                <RotateCcw size={24} />
              </button>
            </div>
            <button 
              onClick={() => {
                setViewingImage(null);
                resetZoom();
              }} 
              className="p-2 bg-white/10 hover:bg-red-500 rounded-full transition-colors"
              title="Close Viewer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image Area */}
          <div 
            className={`flex-1 overflow-hidden flex items-center justify-center relative select-none ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img 
              src={viewingImage} 
              alt="Receipt Fullscreen" 
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                maxWidth: '90%',
                maxHeight: '90%'
              }}
              className="object-contain"
              draggable={false}
            />
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs pointer-events-none">
            Usa el scroll para hacer zoom y arrastra para mover
          </div>
        </div>
      )}

      {/* Gas Station Capture Modal */}
      <GasStationCaptureModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};

export default ExpenseTracker;
