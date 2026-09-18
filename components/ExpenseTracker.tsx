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
import { Expense, ExpenseCategory, UserRole } from '../types';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface ExpenseTrackerProps {
  startDate: string;
  endDate: string;
}

const MAX_SCAN_BYTES = 12 * 1024 * 1024;

const hashBuffer = async (buffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string'
    ? resolve(reader.result)
    : reject(new Error('No se pudo leer la imagen.'));
  reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));
  reader.readAsDataURL(file);
});

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ startDate, endDate }) => {
  const { expenses, addExpense, updateExpense, showNotification, privacyMode, currentUser } = useData();
  const [isScanning, setIsScanning] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    if (!currentUser) return false;
    if (!isManager && expense.userId !== currentUser.id) return false;
    if (isManager) {
      const linked = expense.userId !== currentUser.id;
      if (!linked) return false;
    }
    if (startDate && expense.date < startDate) return false;
    if (endDate && expense.date > endDate) return false;
    return true;
  }), [expenses, startDate, endDate, currentUser, isManager]);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '•••• €';
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date: string) => {
    if (!date) return 'Fecha pendiente';
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

  const getStatus = (expense: Expense) => {
    switch (expense.status) {
      case 'approved':
        return { label: 'Validado', detail: 'Gestoría', className: 'bg-[#ECF7F0] text-[#24613F] border-[#CFE7D7]', icon: CheckCircle2 };
      case 'pending_review':
        return { label: 'En revisión', detail: 'Gestoría', className: 'bg-[#FFF8E8] text-[#855D1E] border-[#ECD9A8]', icon: Clock };
      case 'rejected':
        return { label: 'No computado', detail: '', className: 'bg-[#FFF0EE] text-[#9A443B] border-[#EBCFCB]', icon: X };
      case 'needs_fix':
        return { label: 'Corregir', detail: '', className: 'bg-[#FFF3EA] text-[#A4562D] border-[#EDCFBB]', icon: Clock };
      default:
        return { label: 'Pendiente', detail: '', className: 'bg-[#F3F1ED] text-stone-600 border-[#E3DDD4]', icon: Clock };
    }
  };

  const makeManualDraft = (receipt?: { dataUrl: string; hash: string; mimeType: string }) => ({
    id: `temp_${Date.now()}`,
    userId: '',
    category: ExpenseCategory.OTROS,
    date: receipt ? '' : new Date().toISOString().split('T')[0],
    amount: 0,
    merchant: '',
    notes: '',
    receiptUrl: receipt?.dataUrl,
    receiptHash: receipt?.hash,
    receiptMimeType: receipt?.mimeType,
    vatRate: 0,
    vatAmount: 0,
    deductiblePercentage: 0,
    status: 'pending_review' as const,
    isRecurring: false
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || isManager) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', 'Para escanear usa JPG, PNG o WebP. Los PDF se suben desde Documentos.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_SCAN_BYTES) {
      showNotification('error', 'La imagen supera el límite de 12 MB.');
      event.target.value = '';
      return;
    }

    setIsScanning(true);
    try {
      const buffer = await file.arrayBuffer();
      const receiptHash = await hashBuffer(buffer);
      const duplicate = expenses.some(
        (expense) => expense.userId === currentUser.id && expense.receiptHash === receiptHash
      );
      if (duplicate) {
        showNotification('error', 'Este ticket exacto ya está registrado.');
        return;
      }

      const resultUrl = await readFileAsDataUrl(file);
      const base64Data = resultUrl.split(',')[1] || '';

      try {
        const result = await analyzeReceipt(base64Data, file.type);
        setSelectedExpense({
          id: `temp_${Date.now()}`,
          userId: '',
          category: result.category,
          date: result.date,
          amount: result.amount,
          merchant: result.merchantName,
          notes: result.summary,
          receiptUrl: resultUrl,
          receiptHash,
          receiptMimeType: file.type,
          ocrConfidence: result.confidence,
          ocrNeedsReview: result.needsReview,
          ocrUncertainFields: result.uncertainFields,
          vatRate: 0,
          vatAmount: 0,
          deductiblePercentage: 0,
          status: 'pending_review',
          isRecurring: false
        });
        setIsManualOpen(true);
        showNotification(
          result.needsReview ? 'info' : 'success',
          result.needsReview
            ? 'OCR completado con campos por revisar.'
            : 'OCR completado. Confirma los datos antes de guardar.'
        );
      } catch (error) {
        console.error(error);
        setSelectedExpense(makeManualDraft({ dataUrl: resultUrl, hash: receiptHash, mimeType: file.type }));
        setIsManualOpen(true);
        showNotification('error', 'No se pudo leer el ticket. La imagen se conserva para que completes los datos manualmente.');
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'No se pudo preparar la imagen.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openManualEntry = () => {
    if (isManager) return;
    setSelectedExpense(makeManualDraft());
    setIsManualOpen(true);
  };

  const openEdit = (expense: Expense) => {
    if (isManager) return;
    setSelectedExpense({ ...expense });
    setIsManualOpen(true);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedExpense || !currentUser || isManager) return;

    if (!selectedExpense.amount || selectedExpense.amount <= 0 || !selectedExpense.date || !selectedExpense.category) {
      showNotification('error', 'Completa importe, fecha y categoría.');
      return;
    }

    if (selectedExpense.receiptHash) {
      const duplicate = expenses.some(
        (expense) => expense.userId === currentUser.id
          && expense.receiptHash === selectedExpense.receiptHash
          && expense.id !== selectedExpense.id
      );
      if (duplicate) {
        showNotification('error', 'Este ticket exacto ya está registrado.');
        return;
      }
    }

    const truthfulFiscalDefaults = {
      vatRate: 0,
      vatAmount: 0,
      deductiblePercentage: 0,
      status: 'pending_review' as const
    };

    if (selectedExpense.id.startsWith('temp_')) {
      addExpense({
        category: selectedExpense.category,
        date: selectedExpense.date,
        amount: Number(selectedExpense.amount),
        merchant: selectedExpense.merchant?.trim() || undefined,
        notes: selectedExpense.notes,
        receiptUrl: selectedExpense.receiptUrl,
        receiptHash: selectedExpense.receiptHash,
        receiptMimeType: selectedExpense.receiptMimeType,
        ocrConfidence: selectedExpense.ocrConfidence,
        ocrNeedsReview: selectedExpense.ocrNeedsReview,
        ocrUncertainFields: selectedExpense.ocrUncertainFields,
        isRecurring: selectedExpense.isRecurring,
        ...truthfulFiscalDefaults
      });
    } else {
      updateExpense({
        ...selectedExpense,
        amount: Number(selectedExpense.amount),
        merchant: selectedExpense.merchant?.trim() || undefined,
        ...truthfulFiscalDefaults,
        gestorNotes: undefined
      });
      showNotification('info', 'El gasto modificado vuelve a revisión de gestoría.');
    }

    setIsManualOpen(false);
    setSelectedExpense(null);
  };

  return (
    <div className="min-w-0 space-y-4">
      {!isManager && (
        <>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleFileSelect(event)} />

          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <ActionCard icon={Fuel} title="Repostaje" text="Ticket de combustible" tone="clay" onClick={() => setIsGasModalOpen(true)} />
            <ActionCard icon={Camera} title={isScanning ? 'Leyendo…' : 'Escanear'} text="OCR + anti-duplicado" tone="green" onClick={() => fileInputRef.current?.click()} loading={isScanning} />
            <ActionCard icon={Plus} title="Añadir manual" text="Sin suposiciones fiscales" tone="stone" onClick={openManualEntry} wide />
          </section>
        </>
      )}

      <section className="labora-card min-w-0 overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-[#EEE8DF] px-4 py-3.5">
          <div className="min-w-0">
            <p className="labora-kicker text-stone-400">{isManager ? 'Cartera vinculada' : 'Registro'}</p>
            <h3 className="mt-0.5 text-base font-extrabold text-[#1E231F]">{isManager ? 'Gastos de clientes' : 'Gastos'}</h3>
          </div>
          <span className="rounded-full bg-[#F1ECE3] px-2.5 py-1 text-[10px] font-extrabold text-stone-500">{filteredExpenses.length}</span>
        </header>

        <div className="divide-y divide-[#EEE8DF]">
          {filteredExpenses.map((expense) => {
            const status = getStatus(expense);
            const StatusIcon = status.icon;
            return (
              <article
                key={expense.id}
                onClick={() => openEdit(expense)}
                className={`min-w-0 p-4 transition ${isManager ? '' : 'cursor-pointer hover:bg-[#FCFAF7]'}`}
              >
                <div className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-start gap-3">
                  <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] bg-[#F1ECE3] text-stone-500">
                    {getCategoryIcon(String(expense.category))}
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <h4 className="truncate text-[15px] font-extrabold leading-tight text-[#1E231F]">{expense.merchant || expense.category}</h4>
                          {expense.isRecurring && <Repeat size={12} className="shrink-0 text-stone-400" />}
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-stone-400">{expense.merchant ? `${expense.category} · ` : ''}{formatDate(expense.date)}</p>
                      </div>
                      <p className="shrink-0 whitespace-nowrap text-sm font-extrabold text-[#1E231F]">{formatCurrency(expense.amount)}</p>
                    </div>

                    {expense.notes && <p className="mt-2 line-clamp-2 break-words text-xs leading-relaxed text-stone-500">{expense.notes}</p>}

                    <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none ${status.className}`}>
                          <StatusIcon size={11} /><span>{status.label}</span>{status.detail && <span className="hidden opacity-75 min-[380px]:inline">· {status.detail}</span>}
                        </span>
                        {typeof expense.ocrConfidence === 'number' && (
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${expense.ocrNeedsReview ? 'border-[#ECD9A8] bg-[#FFF8E8] text-[#855D1E]' : 'border-[#D6E4DB] bg-[#EDF4EF] text-[#214E3A]'}`}>
                            OCR {Math.round(expense.ocrConfidence * 100)}%
                          </span>
                        )}
                      </div>

                      {expense.receiptUrl && (
                        <button
                          onClick={(event) => { event.stopPropagation(); setViewingImage(expense.receiptUrl || null); }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-[10px] px-2 py-1.5 text-[11px] font-bold text-[#214E3A] hover:bg-[#EDF4EF]"
                          title="Ver ticket"
                        >
                          <Eye size={14} /> Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredExpenses.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F1ECE3] text-stone-300"><Receipt size={23} /></div>
              <p className="mt-3 text-sm font-extrabold text-stone-500">No hay gastos registrados</p>
              <p className="mt-1 text-xs text-stone-400">{isManager ? 'Los gastos aparecerán cuando tus clientes los registren.' : 'Escanea un ticket o añade uno manualmente.'}</p>
            </div>
          )}
        </div>
      </section>

      {isManualOpen && selectedExpense && !isManager && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18211C]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] border border-[#E3DBD0] bg-[#FFFDF9] shadow-2xl sm:rounded-[26px]">
            <div className="flex items-center justify-between gap-3 border-b border-[#E8E1D7] px-5 py-4">
              <div><p className="labora-kicker text-[#789582]">{selectedExpense.receiptUrl ? 'Revisar ticket' : 'Registro manual'}</p><h3 className="mt-1 text-lg font-extrabold text-[#1E231F]">{selectedExpense.id.startsWith('temp_') ? 'Nuevo gasto' : 'Editar gasto'}</h3></div>
              <button type="button" onClick={() => { setIsManualOpen(false); setSelectedExpense(null); }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6DED2] bg-white text-stone-500"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto p-5">
              {typeof selectedExpense.ocrConfidence === 'number' && (
                <div className={`rounded-[14px] border p-3 ${selectedExpense.ocrNeedsReview ? 'border-[#ECD9A8] bg-[#FFF8E8]' : 'border-[#D5E4DA] bg-[#EDF4EF]'}`}>
                  <div className="flex items-center justify-between gap-3"><p className={`text-xs font-extrabold ${selectedExpense.ocrNeedsReview ? 'text-[#805F2B]' : 'text-[#214E3A]'}`}>Lectura OCR · {Math.round(selectedExpense.ocrConfidence * 100)}%</p><span className="text-[10px] font-bold text-stone-500">Siempre confirma los datos</span></div>
                  {selectedExpense.ocrUncertainFields?.length ? <p className="mt-1 text-[10px] text-stone-500">Campos dudosos: {selectedExpense.ocrUncertainFields.join(', ')}</p> : null}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Importe"><div className="relative"><input type="number" min="0" step="0.01" value={selectedExpense.amount || ''} onChange={(event) => setSelectedExpense({ ...selectedExpense, amount: Number(event.target.value) })} className="field-input pr-9" required /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">€</span></div></Field>
                <Field label="Fecha"><input type="date" value={selectedExpense.date} onChange={(event) => setSelectedExpense({ ...selectedExpense, date: event.target.value })} className="field-input" required /></Field>
              </div>

              <Field label="Proveedor / comercio"><input value={selectedExpense.merchant || ''} onChange={(event) => setSelectedExpense({ ...selectedExpense, merchant: event.target.value })} className="field-input" placeholder="Nombre visible en el justificante" /></Field>

              <Field label="Categoría"><select value={String(selectedExpense.category)} onChange={(event) => setSelectedExpense({ ...selectedExpense, category: event.target.value })} className="field-input">{Object.values(ExpenseCategory).map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>

              <Field label="Descripción"><textarea rows={3} value={selectedExpense.notes || ''} onChange={(event) => setSelectedExpense({ ...selectedExpense, notes: event.target.value })} placeholder="Concepto o nota…" className="field-input resize-none" /></Field>

              {selectedExpense.receiptUrl && (
                <button type="button" onClick={() => setViewingImage(selectedExpense.receiptUrl || null)} className="flex w-full items-center gap-3 rounded-[14px] border border-[#DDE7E0] bg-[#F2F7F4] p-3 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-[#DDE7E0] bg-white text-[#214E3A]"><ImageIcon size={17} /></div>
                  <div className="min-w-0"><p className="text-sm font-extrabold text-[#1E231F]">Justificante adjunto</p><p className="text-[11px] text-stone-500">Toca para revisarlo</p></div>
                </button>
              )}

              <div className="rounded-[14px] border border-[#E8DFD2] bg-[#FAF7F1] p-3 text-[10px] leading-relaxed text-stone-500">
                Este gasto se guarda <strong className="text-stone-700">pendiente de revisión</strong>. Labora+ no asignará automáticamente IVA ni porcentaje deducible solo por haber subido el justificante.
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={Boolean(selectedExpense.isRecurring)} onChange={(event) => setSelectedExpense({ ...selectedExpense, isRecurring: event.target.checked })} className="rounded border-stone-300" />Es un gasto recurrente</label>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setIsManualOpen(false); setSelectedExpense(null); }} className="flex-1 rounded-[13px] border border-[#DDD4C8] bg-white px-4 py-3 text-sm font-extrabold text-stone-600">Cancelar</button>
                <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[#214E3A] px-4 py-3 text-sm font-extrabold text-white"><Save size={16} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/90 p-4" onClick={() => setViewingImage(null)}>
          <button type="button" onClick={() => setViewingImage(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Cerrar ticket"><X size={20} /></button>
          <img src={viewingImage} alt="Justificante del gasto" className="max-h-[86vh] max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {!isManager && <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />}

      <style>{`.field-input{width:100%;border:1px solid #DDD4C8;background:#fff;border-radius:13px;padding:.65rem .75rem;font-size:.875rem;outline:none}.field-input:focus{border-color:#789582;box-shadow:0 0 0 2px rgba(221,233,225,.7)}`}</style>
    </div>
  );
};

const ActionCard = ({ icon: Icon, title, text, tone, onClick, loading = false, wide = false }: any) => {
  const toneClass = tone === 'clay'
    ? 'bg-[#F8EDE7] text-[#B95635] border-[#F0D8CD]'
    : tone === 'green'
      ? 'bg-[#E7F0EA] text-[#214E3A] border-[#D2E3D8]'
      : 'bg-[#F1ECE3] text-stone-600 border-[#E4DDD3]';
  return (
    <button onClick={onClick} disabled={loading} className={`labora-card labora-card-interactive min-w-0 p-3.5 text-left disabled:opacity-60 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] border ${toneClass}`}>{loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}</div>
      <p className="mt-2 text-sm font-extrabold text-[#1E231F]">{title}</p>
      <p className="mt-0.5 text-[11px] font-medium text-stone-500">{text}</p>
    </button>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5"><span className="text-xs font-extrabold text-stone-600">{label}</span>{children}</label>
);

export default ExpenseTracker;
