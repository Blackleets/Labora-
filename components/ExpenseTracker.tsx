import React, { useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock, Eye, Fuel, Loader2, Receipt, ScanLine, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Expense, ExpenseCategory } from '../types';
import { analyzeReceipt } from '../services/geminiService';
import { getMarketProfile } from '../modules/country-config/marketProfiles';
import { GasStationCaptureModal } from './GasStationCaptureModal';

interface ExpenseTrackerProps {
  startDate: string;
  endDate: string;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ startDate, endDate }) => {
  const { currentUser, expenses, addExpense, updateExpense, showNotification, privacyMode } = useData();
  const market = getMarketProfile(currentUser?.countryCode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [draft, setDraft] = useState<Expense | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    if (startDate && expense.date < startDate) return false;
    if (endDate && expense.date > endDate) return false;
    return true;
  }), [expenses, startDate, endDate]);

  const money = (amount: number) => privacyMode
    ? '••••'
    : new Intl.NumberFormat(market.locale, { style: 'currency', currency: market.currency }).format(amount);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Selecciona una imagen válida del comprobante.');
      return;
    }

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const dataUrl = String(loadEvent.target?.result || '');
      if (!dataUrl.startsWith('data:')) {
        setIsScanning(false);
        return;
      }

      let extracted: Awaited<ReturnType<typeof analyzeReceipt>> | null = null;
      try {
        const base64 = dataUrl.split(',')[1];
        if (!base64) throw new Error('No se pudo leer la imagen.');
        extracted = await analyzeReceipt(base64);
      } catch (error) {
        console.warn('Receipt extraction failed:', error);
        showNotification('info', 'Conservamos la foto. Completa los campos manualmente; no se ha inventado ningún dato.');
      }

      setDraft({
        id: `temp_${crypto.randomUUID()}`,
        userId: currentUser?.id || '',
        category: extracted?.category || ExpenseCategory.OTROS,
        merchant: extracted?.merchantName || '',
        date: extracted?.date || new Date().toISOString().slice(0, 10),
        amount: extracted?.amount || 0,
        notes: extracted?.summary || '',
        receiptUrl: dataUrl,
        deductiblePercentage: 0,
        status: 'pending_review',
      });
      setIsEditorOpen(true);
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setIsScanning(false);
      showNotification('error', 'No se pudo leer el archivo.');
    };
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!draft.date || !draft.category || !Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0) {
      showNotification('error', 'Completa fecha, categoría e importe real.');
      return;
    }
    if (draft.id.startsWith('temp_') && !draft.receiptUrl?.startsWith('data:')) {
      showNotification('error', 'Un gasto nuevo necesita una evidencia real en este flujo.');
      return;
    }

    setIsSaving(true);
    try {
      if (draft.id.startsWith('temp_')) {
        await addExpense({
          category: draft.category,
          merchant: draft.merchant?.trim() || undefined,
          date: draft.date,
          amount: Number(draft.amount),
          notes: draft.notes?.trim() || undefined,
          receiptUrl: draft.receiptUrl,
          deductiblePercentage: 0,
          status: 'pending_review',
        });
      } else {
        await updateExpense(draft);
      }
      setIsEditorOpen(false);
      setDraft(null);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar el gasto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => setIsGasModalOpen(true)} className="flex items-center gap-3 rounded-2xl border border-[#EAD6C9] bg-[#FAF3EE] p-4 text-left transition hover:bg-[#F7ECE5]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C96846] text-white"><Fuel className="h-5 w-5" /></span><div><p className="text-sm font-black text-stone-900">Combustible / energía</p><p className="mt-0.5 text-[11px] text-stone-500">Foto del ticket + revisión posterior</p></div></button>
        <button disabled={isScanning} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 rounded-2xl border border-[#D7E1E8] bg-[#F0F5F8] p-4 text-left transition hover:bg-[#EAF1F5] disabled:opacity-50"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A7596] text-white">{isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}</span><div><p className="text-sm font-black text-stone-900">Otro gasto con comprobante</p><p className="mt-0.5 text-[11px] text-stone-500">OCR opcional; tú confirmas los campos</p></div></button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E8DFC8] p-5"><div><h2 className="font-serif text-lg font-bold text-stone-900">Gastos registrados</h2><p className="mt-1 text-xs text-stone-500">{filteredExpenses.length} registro(s) · evidencia revisada ≠ deducibilidad fiscal automática</p></div><Receipt className="h-5 w-5 text-[#C96846]" /></div>
        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center"><Receipt className="mx-auto h-8 w-8 text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-600">Todavía no hay gastos</p><p className="mt-1 text-xs text-stone-400">Fotografía un comprobante para empezar.</p></div>
        ) : (
          <div className="divide-y divide-[#EEE8DE]">
            {filteredExpenses.map((expense) => <div key={expense.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => { setDraft({ ...expense }); setIsEditorOpen(true); }} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-stone-900">{expense.merchant || String(expense.category)}</p><Status status={expense.status || 'pending_review'} /></div><p className="mt-1 text-xs text-stone-500">{expense.date} · {expense.category}</p>{expense.gestorNotes && <p className="mt-2 line-clamp-2 text-[11px] text-stone-500">Nota del asesor: {expense.gestorNotes}</p>}</button><div className="flex items-center justify-between gap-3 sm:justify-end"><p className="font-serif text-base font-bold text-stone-900">{money(expense.amount)}</p>{expense.receiptUrl && <button onClick={() => setViewingImage(expense.receiptUrl || null)} className="rounded-xl border border-[#E4DDD2] bg-white p-2 text-stone-500" title="Ver evidencia"><Eye className="h-4 w-4" /></button>}</div></div>)}
          </div>
        )}
      </section>

      <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#3A7596] text-white shadow-xl md:hidden" aria-label="Escanear comprobante">{isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}</button>

      {isEditorOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="my-8 w-full max-w-lg space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h3 className="font-serif text-xl font-bold text-stone-900">{draft.id.startsWith('temp_') ? 'Revisar gasto antes de guardarlo' : 'Editar registro'}</h3><p className="mt-1 text-xs text-stone-500">Los campos extraídos por IA no se consideran verificados hasta que tú los confirmas.</p></div><button type="button" onClick={() => { setIsEditorOpen(false); setDraft(null); }} className="rounded-xl p-2 text-stone-400 hover:bg-stone-100"><X className="h-5 w-5" /></button></div>
            {draft.receiptUrl && <button type="button" onClick={() => setViewingImage(draft.receiptUrl || null)} className="block w-full overflow-hidden rounded-2xl border border-[#E4DDD2] bg-white"><img src={draft.receiptUrl} alt="Evidencia del gasto" className="max-h-56 w-full object-contain" /></button>}
            <label className="block text-xs font-semibold text-stone-700">Comercio / proveedor<input value={draft.merchant || ''} onChange={(event) => setDraft({ ...draft, merchant: event.target.value })} placeholder="Nombre tal como aparece" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-stone-700">Importe ({market.currencySymbol})<input required type="number" min="0" step="0.01" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold text-stone-700">Fecha<input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label></div>
            <label className="block text-xs font-semibold text-stone-700">Categoría<select value={String(draft.category)} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm">{Object.values(ExpenseCategory).map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="block text-xs font-semibold text-stone-700">Notas<input value={draft.notes || ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm" /></label>
            <div className="rounded-2xl border border-[#D7E4DA] bg-[#EEF5F0] p-3 text-xs leading-relaxed text-[#42614D]">Los gastos nuevos quedan con deducibilidad 0% y pendientes de revisión. Labora+ no los marca como aceptados por una autoridad fiscal.</div>
            <button disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{isSaving ? 'Guardando…' : 'Guardar registro'}</button>
          </form>
        </div>
      )}

      {viewingImage && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewingImage(null)}><button className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white" aria-label="Cerrar"><X className="h-5 w-5" /></button><img src={viewingImage} alt="Evidencia ampliada" className="max-h-[90vh] max-w-[94vw] object-contain" onClick={(event) => event.stopPropagation()} /></div>}

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const Status: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    approved: { label: 'Evidencia revisada', className: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    pending_review: { label: 'Pendiente de revisión', className: 'bg-amber-50 text-amber-700', icon: <Clock className="h-3 w-3" /> },
    needs_fix: { label: 'Falta información', className: 'bg-orange-50 text-orange-700' },
    rejected: { label: 'Evidencia rechazada', className: 'bg-red-50 text-red-700' },
  };
  const item = map[status] || map.pending_review;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.className}`}>{item.icon}{item.label}</span>;
};

export default ExpenseTracker;
