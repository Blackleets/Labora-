import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  Fuel,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  Monitor,
  Plus,
  Receipt,
  Repeat,
  Save,
  Shield,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wrench,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { analyzeReceipt } from '../services/geminiService';
import { Expense, ExpenseCategory } from '../types';
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
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (startDate && expense.date < startDate) return false;
      if (endDate && expense.date > endDate) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '•••• €';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(`${date}T12:00:00`));
    } catch {
      return date;
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Gasolina': return <Fuel size={19} />;
      case 'Mantenimiento': return <Wrench size={19} />;
      case 'Comida': return <Utensils size={19} />;
      case 'Móvil': return <Smartphone size={19} />;
      case 'Cuota Autónomo': return <Shield size={19} />;
      case 'Equipamiento': return <Briefcase size={19} />;
      case 'Marketing': return <ShoppingBag size={19} />;
      case 'Suscripciones Software': return <Monitor size={19} />;
      case 'Formación': return <BookOpen size={19} />;
      default: return <HelpCircle size={19} />;
    }
  };

  const getStatus = (expense: Expense) => {
    switch (expense.status) {
      case 'approved':
        return {
          label: 'Validado',
          detail: 'AEAT',
          className: 'bg-[#ECF7F0] text-[#24613F] border-[#CFE7D7]',
          icon: CheckCircle2
        };
      case 'pending_review':
        return {
          label: 'En revisión',
          detail: 'Gestor',
          className: 'bg-[#FFF8E8] text-[#855D1E] border-[#ECD9A8]',
          icon: Clock
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          detail: '',
          className: 'bg-[#FFF0EE] text-[#9A443B] border-[#EBCFCB]',
          icon: X
        };
      case 'needs_fix':
        return {
          label: 'Corregir',
          detail: '',
          className: 'bg-[#FFF3EA] text-[#A4562D] border-[#EDCFBB]',
          icon: Clock
        };
      default:
        return {
          label: 'Pendiente',
          detail: '',
          className: 'bg-[#F3F1ED] text-stone-600 border-[#E3DDD4]',
          icon: Clock
        };
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      const resultUrl = loadEvent.target?.result;
      if (!resultUrl || typeof resultUrl !== 'string') {
        setIsScanning(false);
        return;
      }

      try {
        const base64Data = resultUrl.split(',')[1];
        const result = await analyzeReceipt(base64Data);

        setSelectedExpense({
          id: `temp_${Date.now()}`,
          userId: '',
          category: result.category,
          date: result.date,
          amount: result.amount,
          notes: `${result.merchantName} - ${result.summary}`,
          receiptUrl: resultUrl,
          isRecurring: false
        });
        setIsManualOpen(true);
        showNotification('success', 'Ticket analizado. Revisa los datos antes de guardar.');
      } catch (error) {
        console.error(error);
        showNotification('error', 'No se pudo leer el ticket. Puedes registrarlo manualmente.');
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const openManualEntry = () => {
    setSelectedExpense({
      id: `temp_${Date.now()}`,
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

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedExpense) return;

    if (!selectedExpense.amount || !selectedExpense.date || !selectedExpense.category) {
      showNotification('error', 'Completa importe, fecha y categoría.');
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
      updateExpense({ ...selectedExpense, amount: Number(selectedExpense.amount) });
    }

    setIsManualOpen(false);
    setSelectedExpense(null);
    showNotification('success', 'Gasto guardado.');
  };

  return (
    <div className="space-y-4 min-w-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          onClick={() => setIsGasModalOpen(true)}
          className="min-w-0 rounded-2xl border border-[#E6DDD2] bg-white px-3 py-3 text-left hover:bg-[#FAF7F2] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F5EEE8] text-[#B65F3F] flex items-center justify-center mb-2">
            <Fuel size={18} />
          </div>
          <p className="text-sm font-bold text-stone-900 leading-tight">Repostaje</p>
          <p className="mt-1 text-[11px] text-stone-500 leading-tight">Ticket de gasolina</p>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="min-w-0 rounded-2xl border border-[#D6E1DA] bg-[#F3F8F5] px-3 py-3 text-left hover:bg-[#ECF4EF] transition-colors disabled:opacity-60"
        >
          <div className="w-9 h-9 rounded-xl bg-[#2E5A44] text-white flex items-center justify-center mb-2">
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </div>
          <p className="text-sm font-bold text-stone-900 leading-tight">{isScanning ? 'Leyendo…' : 'Escanear'}</p>
          <p className="mt-1 text-[11px] text-stone-500 leading-tight">Ticket con IA</p>
        </button>

        <button
          onClick={openManualEntry}
          className="col-span-2 sm:col-span-1 min-w-0 rounded-2xl border border-[#E6DDD2] bg-white px-3 py-3 text-left hover:bg-[#FAF7F2] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F2F0EC] text-stone-600 flex items-center justify-center mb-2">
            <Plus size={18} />
          </div>
          <p className="text-sm font-bold text-stone-900 leading-tight">Añadir manual</p>
          <p className="mt-1 text-[11px] text-stone-500 leading-tight">Registro rápido</p>
        </button>
      </section>

      <section className="rounded-2xl border border-[#E5DED3] bg-white overflow-hidden min-w-0">
        <header className="px-4 py-3.5 border-b border-[#EEE8DF] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-stone-900">Gastos</h3>
            <p className="text-xs text-stone-500">{filteredExpenses.length} registros</p>
          </div>
          {startDate && (
            <span className="shrink-0 rounded-full bg-[#F1F5F2] text-[#2E5A44] border border-[#D8E5DC] px-2.5 py-1 text-[10px] font-bold">
              Filtrado
            </span>
          )}
        </header>

        <div className="divide-y divide-[#EEE8DF]">
          {filteredExpenses.map((expense) => {
            const status = getStatus(expense);
            const StatusIcon = status.icon;

            return (
              <article
                key={expense.id}
                onClick={() => openEdit(expense)}
                className="p-4 cursor-pointer hover:bg-[#FCFAF7] transition-colors min-w-0"
              >
                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 items-start min-w-0">
                  <div className="w-[42px] h-[42px] rounded-xl bg-[#F4F2EE] text-stone-500 flex items-center justify-center shrink-0">
                    {getCategoryIcon(String(expense.category))}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-stone-900 text-[15px] leading-tight truncate">{expense.category}</h4>
                          {expense.isRecurring && <Repeat size={12} className="shrink-0 text-stone-400" />}
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-stone-400">{formatDate(expense.date)}</p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-stone-900 whitespace-nowrap">{formatCurrency(expense.amount)}</p>
                    </div>

                    {expense.notes && (
                      <p className="mt-2 text-xs text-stone-500 leading-relaxed line-clamp-2 break-words">
                        {expense.notes}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2 min-w-0">
                      <span className={`max-w-full inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none ${status.className}`}>
                        <StatusIcon size={11} className="shrink-0" />
                        <span className="whitespace-nowrap">{status.label}</span>
                        {status.detail && <span className="hidden min-[380px]:inline opacity-75">· {status.detail}</span>}
                      </span>

                      {expense.receiptUrl && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setViewingImage(expense.receiptUrl || null);
                          }}
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E5A44] px-2 py-1.5 rounded-lg hover:bg-[#EDF4EF]"
                          title="Ver ticket"
                        >
                          <Eye size={14} />
                          <span>Ticket</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredExpenses.length === 0 && (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 bg-[#F4F2EE] rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                <Receipt size={24} />
              </div>
              <p className="text-stone-500 text-sm font-semibold">No hay gastos registrados</p>
              <p className="text-stone-400 text-xs mt-1">Escanea un ticket o añade uno manualmente.</p>
            </div>
          )}
        </div>
      </section>

      {isManualOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-stone-950/55 backdrop-blur-sm p-3 sm:p-4 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#FCFAF7] border border-[#E3DBD0] shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-[#E8E1D7] flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {selectedExpense.id.startsWith('temp_') ? 'Nuevo gasto' : 'Editar gasto'}
                </h3>
                <p className="text-xs text-stone-500">Revisa los datos antes de guardar.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManualOpen(false);
                  setSelectedExpense(null);
                }}
                className="w-9 h-9 rounded-xl bg-white border border-[#E6DED2] text-stone-500 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-600">Importe</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedExpense.amount || ''}
                      onChange={(event) => setSelectedExpense({ ...selectedExpense, amount: Number(event.target.value) })}
                      className="w-full rounded-xl border border-[#DDD4C8] bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-[#2E5A44]"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-600">Fecha</span>
                  <input
                    type="date"
                    value={selectedExpense.date}
                    onChange={(event) => setSelectedExpense({ ...selectedExpense, date: event.target.value })}
                    className="w-full rounded-xl border border-[#DDD4C8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2E5A44]"
                    required
                  />
                </label>
              </div>

              <label className="space-y-1.5 block">
                <span className="text-xs font-bold text-stone-600">Categoría</span>
                <select
                  value={String(selectedExpense.category)}
                  onChange={(event) => setSelectedExpense({ ...selectedExpense, category: event.target.value })}
                  className="w-full rounded-xl border border-[#DDD4C8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2E5A44]"
                >
                  {Object.values(ExpenseCategory).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-bold text-stone-600">Descripción</span>
                <textarea
                  rows={3}
                  value={selectedExpense.notes || ''}
                  onChange={(event) => setSelectedExpense({ ...selectedExpense, notes: event.target.value })}
                  placeholder="Proveedor, concepto o nota…"
                  className="w-full resize-none rounded-xl border border-[#DDD4C8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2E5A44]"
                />
              </label>

              {selectedExpense.receiptUrl && (
                <button
                  type="button"
                  onClick={() => setViewingImage(selectedExpense.receiptUrl || null)}
                  className="w-full flex items-center gap-3 rounded-xl border border-[#DDE7E0] bg-[#F2F7F4] p-3 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-white text-[#2E5A44] flex items-center justify-center border border-[#DDE7E0]">
                    <ImageIcon size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800">Justificante adjunto</p>
                    <p className="text-[11px] text-stone-500">Toca para verlo</p>
                  </div>
                </button>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <input
                  type="checkbox"
                  checked={Boolean(selectedExpense.isRecurring)}
                  onChange={(event) => setSelectedExpense({ ...selectedExpense, isRecurring: event.target.checked })}
                  className="rounded border-stone-300"
                />
                Es un gasto recurrente
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualOpen(false);
                    setSelectedExpense(null);
                  }}
                  className="flex-1 rounded-xl border border-[#DDD4C8] bg-white px-4 py-3 text-sm font-bold text-stone-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingImage && (
        <div className="fixed inset-0 z-[60] bg-stone-950/90 p-4 flex items-center justify-center" onClick={() => setViewingImage(null)}>
          <button
            type="button"
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            aria-label="Cerrar ticket"
          >
            <X size={20} />
          </button>
          <img
            src={viewingImage}
            alt="Justificante del gasto"
            className="max-w-full max-h-[86vh] object-contain rounded-xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      <GasStationCaptureModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};

export default ExpenseTracker;
