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
  Search,
  Save,
  Shield,
  ShoppingBag,
  Smartphone,
  Trash2,
  Utensils,
  Wrench,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { analyzeReceipt } from '../services/geminiService';
import { Expense, ExpenseCategory, UserRole } from '../types';
import { GasStationCaptureModal } from './GasStationCaptureModal';
import { canOwnerDeleteRow, expenseDeleteConfirmMessage } from '../services/deleteEligibility';
import { canAccessClientRecord } from '../services/gestoriaLinking';
import { sortExpensesForReview } from '../services/expenseOrganization';
import MerchantLogo from './MerchantLogo';
import { resolveMerchantBrand } from '../data/merchantBrands';

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
  const { expenses, addExpense, updateExpense, deleteExpense, updateExpenseAudit, showNotification, privacyMode, currentUser, users } = useData();
  const { selectedCountry } = useCountry();
  const [isScanning, setIsScanning] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [reviewingExpense, setReviewingExpense] = useState<Expense | null>(null);
  const [reviewPct, setReviewPct] = useState('0');
  const [reviewNote, setReviewNote] = useState('');
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseMerchantFilter, setExpenseMerchantFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const filteredExpenses = useMemo(() => sortExpensesForReview(expenses.filter((expense) => {
    if (!currentUser) return false;
    if (!isManager && expense.userId !== currentUser.id) return false;
    if (isManager) {
      const client = users.find((user) => user.id === expense.userId);
      if (!canAccessClientRecord(currentUser, client)) return false;
    }
    if (startDate && expense.date < startDate) return false;
    if (endDate && expense.date > endDate) return false;
    if (expenseCategoryFilter !== 'all' && String(expense.category) !== expenseCategoryFilter) return false;
    const match = resolveMerchantBrand(expense.merchant || '');
    const merchantId = match.brand?.id || `custom:${(expense.merchant || 'sin comercio').trim().toLocaleLowerCase('es')}`;
    if (expenseMerchantFilter !== 'all' && merchantId !== expenseMerchantFilter) return false;
    const query = expenseSearch.trim().toLocaleLowerCase('es');
    if (query && ![expense.merchant, expense.category, expense.notes, isManager ? users.find((user) => user.id === expense.userId)?.name : '']
      .some((value) => String(value || '').toLocaleLowerCase('es').includes(query))) return false;
    return true;
  })), [expenses, startDate, endDate, currentUser, isManager, users, expenseSearch, expenseCategoryFilter, expenseMerchantFilter]);

  const merchantGroups = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    for (const expense of filteredExpenses) {
      const match = resolveMerchantBrand(expense.merchant || '');
      const id = match.brand?.id || `custom:${(expense.merchant || 'sin comercio').trim().toLocaleLowerCase('es')}`;
      const label = match.brand?.name || expense.merchant || 'Sin comercio';
      const group = groups.get(id) || { label, count: 0 };
      group.count += 1;
      groups.set(id, group);
    }
    return [...groups.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  }, [filteredExpenses]);

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString(selectedCountry.country_code === 'MX' ? 'es-MX' : 'es-ES', {
      style: 'currency',
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 2
    });
  };

  const clientName = (userId: string) => users.find((user) => user.id === userId)?.name || 'Cliente';

  const handleDeleteExpense = async (expense: Expense, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!canOwnerDeleteRow(expense.userId, currentUser?.id, Boolean(isManager))) return;
    const approved = expense.status === 'approved';
    const label = expense.merchant || String(expense.category);
    if (!window.confirm(expenseDeleteConfirmMessage(approved, label))) return;
    setDeletingExpenseId(expense.id);
    try {
      await deleteExpense(expense.id);
    } finally {
      setDeletingExpenseId(null);
    }
  };


  const openManagerReview = (expense: Expense) => {
    if (!isManager) return;
    setReviewingExpense(expense);
    setReviewPct(String(expense.deductiblePercentage ?? 0));
    setReviewNote(expense.gestorNotes || '');
  };

  const submitManagerReview = (status: 'approved' | 'rejected' | 'needs_fix') => {
    if (!reviewingExpense) return;
    const pct = Math.max(0, Math.min(100, Number(reviewPct) || 0));
    const note = reviewNote.trim()
      || (status === 'approved'
        ? 'Validado por la gestoría.'
        : status === 'rejected'
          ? 'No computado por la gestoría.'
          : 'Revisa el justificante o completa la información.');
    updateExpenseAudit(reviewingExpense.id, status, note, status === 'rejected' ? 0 : pct);
    setReviewingExpense(null);
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
        return { label: 'Validado', detail: 'Gestoría', className: 'labora-status-ok', icon: CheckCircle2 };
      case 'pending_review':
        return { label: 'En revisión', detail: 'Gestoría', className: 'labora-status-pending', icon: Clock };
      case 'rejected':
        return { label: 'No computado', detail: '', className: 'labora-status-danger', icon: X };
      case 'needs_fix':
        return { label: 'Corregir', detail: '', className: 'labora-status-warn', icon: Clock };
      default:
        return { label: 'Pendiente', detail: '', className: 'labora-status-pending', icon: Clock };
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
        const code = error instanceof Error ? error.message : '';
        showNotification(
          'error',
          code === 'AI_NOT_CONFIGURED'
            ? 'IA no configurada. Completa el gasto a mano; la imagen se conserva.'
            : 'No se pudo leer el ticket. La imagen se conserva para que completes los datos manualmente.'
        );
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
    setFormError('');
    setIsManualOpen(true);
  };

  const openEdit = (expense: Expense) => {
    if (isManager) return;
    setSelectedExpense({ ...expense });
    setFormError('');
    setIsManualOpen(true);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedExpense || !currentUser || isManager) return;

    if (!selectedExpense.amount || selectedExpense.amount <= 0 || !selectedExpense.date || !selectedExpense.category) {
      setFormError('Completa importe, fecha y categoría.');
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
            <ActionCard icon={Camera} title={isScanning ? 'Leyendo…' : 'Escanear'} text="Foto + anti-duplicado" tone="green" onClick={() => fileInputRef.current?.click()} loading={isScanning} />
            <ActionCard icon={Plus} title="Añadir manual" text="Sin suposiciones fiscales" tone="stone" onClick={openManualEntry} wide />
          </section>
        </>
      )}

      <section className="labora-card min-w-0 overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--labora-border)] px-4 py-3.5">
          <div className="min-w-0">
            <p className="labora-kicker text-[var(--labora-muted)]">{isManager ? 'Cartera vinculada' : 'Registro'}</p>
            <h3 className="mt-0.5 text-base font-extrabold text-[var(--labora-ink)]">{isManager ? 'Gastos de clientes' : 'Gastos'}</h3>
          </div>
          <span className="rounded-full bg-[var(--labora-surface-2)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--labora-muted)]">{filteredExpenses.length}</span>
        </header>

        <div className="space-y-3 border-b border-[var(--labora-border)] p-3.5">
          <label className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-[var(--labora-muted)]">
            <Search size={16} aria-hidden />
            <input value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} placeholder={isManager ? 'Buscar comercio, categoría o cliente' : 'Buscar comercio o categoría'} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--labora-ink)] outline-none placeholder:text-[var(--labora-muted)]" aria-label="Buscar gastos" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={expenseCategoryFilter === 'all'} onClick={() => setExpenseCategoryFilter('all')}>Todas las categorías</FilterChip>
            {[...new Set(expenses.filter((expense) => !isManager || canAccessClientRecord(currentUser, users.find((user) => user.id === expense.userId))).map((expense) => String(expense.category)))].sort().map((category) => (
              <FilterChip key={category} active={expenseCategoryFilter === category} onClick={() => setExpenseCategoryFilter(category)}>{category}</FilterChip>
            ))}
          </div>
          {merchantGroups.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por comercio">
              <FilterChip active={expenseMerchantFilter === 'all'} onClick={() => setExpenseMerchantFilter('all')}>Todos los comercios</FilterChip>
              {merchantGroups.map(([id, group]) => <FilterChip key={id} active={expenseMerchantFilter === id} onClick={() => setExpenseMerchantFilter(expenseMerchantFilter === id ? 'all' : id)}>{group.label} · {group.count}</FilterChip>)}
            </div>
          )}
        </div>

        <div className="divide-y divide-[var(--labora-border)]">
          {filteredExpenses.map((expense) => {
            const status = getStatus(expense);
            const StatusIcon = status.icon;
            return (
              <article
                key={expense.id}
                onClick={() => (isManager ? openManagerReview(expense) : openEdit(expense))}
                className="min-w-0 cursor-pointer p-4 transition hover:bg-[var(--labora-parchment)]"
              >
                <div className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-start gap-3">
                  <MerchantLogo merchantName={expense.merchant || ''} category={merchantCategory(expense.category)} size="md" className="h-[42px] w-[42px] rounded-[14px]" />

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <h4 className="truncate text-[15px] font-extrabold leading-tight text-[var(--labora-ink)]">{expense.merchant || expense.category}</h4>
                          {expense.isRecurring && <Repeat size={12} className="shrink-0 text-[var(--labora-muted)]" />}
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-[var(--labora-muted)]">{isManager ? `${clientName(expense.userId)} · ` : ''}{expense.merchant ? `${expense.category} · ` : ''}{formatDate(expense.date)}</p>
                      </div>
                      <p className="shrink-0 whitespace-nowrap text-sm font-extrabold text-[var(--labora-ink)]">{formatCurrency(expense.amount)}</p>
                    </div>

                    {expense.notes && <p className="mt-2 line-clamp-2 break-words text-xs leading-relaxed text-[var(--labora-muted)]">{expense.notes}</p>}

                    <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none ${status.className}`}>
                          <StatusIcon size={11} /><span>{status.label}</span>{status.detail && <span className="hidden opacity-75 min-[380px]:inline">· {status.detail}</span>}
                        </span>
                        {typeof expense.ocrConfidence === 'number' && (
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${expense.ocrNeedsReview ? 'border-[var(--labora-border)] bg-[var(--labora-parchment)] text-[var(--labora-gold)]' : 'border-[var(--labora-border)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}>
                            OCR {Math.round(expense.ocrConfidence * 100)}%
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        {expense.receiptUrl && (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); setViewingImage(expense.receiptUrl || null); }}
                            className="inline-flex items-center gap-1 rounded-[10px] px-2 py-1.5 text-[11px] font-bold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"
                            title="Ver ticket"
                            aria-label="Ver ticket"
                          >
                            <Eye size={14} aria-hidden /> Ticket
                          </button>
                        )}
                        {!isManager && canOwnerDeleteRow(expense.userId, currentUser?.id, false) && (
                          <button
                            type="button"
                            onClick={(event) => void handleDeleteExpense(expense, event)}
                            disabled={deletingExpenseId === expense.id}
                            className="rounded-[10px] p-2 text-[var(--labora-muted)] hover:bg-[var(--labora-soft-clay)] hover:text-[var(--labora-clay-deep)] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"
                            aria-label="Eliminar gasto"
                            title="Eliminar gasto"
                          >
                            {deletingExpenseId === expense.id ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Trash2 size={16} aria-hidden />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredExpenses.length === 0 && (
            <div className="px-4 py-12 text-center" role="status" aria-live="polite">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]" aria-hidden><Receipt size={23} /></div>
              <p className="mt-3 text-sm font-extrabold text-[var(--labora-ink-soft)]">{isManager ? 'Sin gastos de clientes vinculados' : 'No hay gastos registrados'}</p>
              <p className="mt-1 text-xs text-[var(--labora-muted)]">{isManager ? 'Cuando un autónomo vinculado registre un ticket o gasto, aparecerá aquí para aprobar, rechazar o fijar el % deducible.' : 'Escanea un ticket o añade uno manualmente.'}</p>
            </div>
          )}
        </div>
      </section>

      {isManualOpen && selectedExpense && !isManager && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--labora-ink)]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] shadow-2xl sm:rounded-[26px]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--labora-border)] px-5 py-4">
              <div><p className="labora-kicker text-[var(--labora-primary-2)]">{selectedExpense.receiptUrl ? 'Revisar ticket' : 'Registro manual'}</p><h3 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">{selectedExpense.id.startsWith('temp_') ? 'Nuevo gasto' : 'Editar gasto'}</h3></div>
              <button type="button" onClick={() => { setFormError(''); setIsManualOpen(false); setSelectedExpense(null); }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]" aria-label="Cerrar"><X size={18} aria-hidden /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto p-5">
              {typeof selectedExpense.ocrConfidence === 'number' && (
                <div className={`rounded-[14px] border p-3 ${selectedExpense.ocrNeedsReview ? 'border-[var(--labora-border)] bg-[var(--labora-parchment)]' : 'border-[var(--labora-border)] bg-[var(--labora-moss-soft)]'}`}>
                  <div className="flex items-center justify-between gap-3"><p className={`text-xs font-extrabold ${selectedExpense.ocrNeedsReview ? 'text-[var(--labora-gold)]' : 'text-[var(--labora-primary)]'}`}>Lectura OCR · {Math.round(selectedExpense.ocrConfidence * 100)}%</p><span className="text-[10px] font-bold text-[var(--labora-muted)]">Siempre confirma los datos</span></div>
                  {selectedExpense.ocrUncertainFields?.length ? <p className="mt-1 text-[10px] text-[var(--labora-muted)]">Campos dudosos: {selectedExpense.ocrUncertainFields.join(', ')}</p> : null}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Importe" htmlFor="labora-expense-amount"><div className="relative"><input id="labora-expense-amount" type="number" min="0" step="0.01" value={selectedExpense.amount || ''} onChange={(event) => { setSelectedExpense({ ...selectedExpense, amount: Number(event.target.value) }); if (formError) setFormError(''); }} className="field-input pr-9" required aria-invalid={formError ? true : undefined} aria-describedby={formError ? 'labora-expense-form-error' : undefined} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--labora-muted)]" aria-hidden>{selectedCountry.currency_symbol || '€'}</span></div></Field>
                <Field label="Fecha" htmlFor="labora-expense-date"><input id="labora-expense-date" type="date" value={selectedExpense.date} onChange={(event) => { setSelectedExpense({ ...selectedExpense, date: event.target.value }); if (formError) setFormError(''); }} className="field-input" required aria-invalid={formError ? true : undefined} aria-describedby={formError ? 'labora-expense-form-error' : undefined} /></Field>
              </div>

              <Field label="Proveedor / comercio" htmlFor="labora-expense-merchant"><input id="labora-expense-merchant" value={selectedExpense.merchant || ''} onChange={(event) => setSelectedExpense({ ...selectedExpense, merchant: event.target.value })} className="field-input" placeholder="Nombre visible en el justificante" /></Field>

              <Field label="Categoría" htmlFor="labora-expense-category"><select id="labora-expense-category" value={String(selectedExpense.category)} onChange={(event) => { setSelectedExpense({ ...selectedExpense, category: event.target.value }); if (formError) setFormError(''); }} className="field-input" aria-invalid={formError ? true : undefined} aria-describedby={formError ? 'labora-expense-form-error' : undefined}>{Object.values(ExpenseCategory).map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>

              <Field label="Descripción" htmlFor="labora-expense-notes"><textarea id="labora-expense-notes" rows={3} value={selectedExpense.notes || ''} onChange={(event) => setSelectedExpense({ ...selectedExpense, notes: event.target.value })} placeholder="Concepto o nota…" className="field-input resize-none" /></Field>

              {selectedExpense.receiptUrl && (
                <button type="button" onClick={() => setViewingImage(selectedExpense.receiptUrl || null)} className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-3 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-primary)]"><ImageIcon size={17} /></div>
                  <div className="min-w-0"><p className="text-sm font-extrabold text-[var(--labora-ink)]">Justificante adjunto</p><p className="text-[11px] text-[var(--labora-muted)]">Toca para revisarlo</p></div>
                </button>
              )}

              <div className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-3 text-[10px] leading-relaxed text-[var(--labora-muted)]">
                Este gasto se guarda <strong className="text-[var(--labora-ink-soft)]">pendiente de revisión</strong>. Labora+ no asignará automáticamente IVA ni porcentaje deducible solo por haber subido el justificante.
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[var(--labora-muted)]"><input type="checkbox" checked={Boolean(selectedExpense.isRecurring)} onChange={(event) => setSelectedExpense({ ...selectedExpense, isRecurring: event.target.checked })} className="rounded border-[var(--labora-border)]" />Es un gasto recurrente</label>

              {formError ? (
                <p id="labora-expense-form-error" role="alert" className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3 py-2.5 text-xs font-medium text-[var(--labora-clay)]">{formError}</p>
              ) : null}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setFormError(''); setIsManualOpen(false); setSelectedExpense(null); }} className="flex-1 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-4 py-3 text-sm font-extrabold text-[var(--labora-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]">Cancelar</button>
                <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--labora-primary)] px-4 py-3 text-sm font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"><Save size={16} aria-hidden /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--labora-ink)]/90 p-4" onClick={() => setViewingImage(null)}>
          <button type="button" onClick={() => setViewingImage(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--labora-surface)]/10 text-white" aria-label="Cerrar ticket"><X size={20} /></button>
          <img src={viewingImage} alt="Justificante del gasto" className="max-h-[86vh] max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {isManager && reviewingExpense && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--labora-ink)]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] shadow-2xl sm:rounded-[26px]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--labora-border)] px-5 py-4">
              <div>
                <p className="labora-kicker text-[var(--labora-primary-2)]">Auditoría</p>
                <h3 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">{reviewingExpense.merchant || reviewingExpense.category}</h3>
                <p className="mt-1 text-xs text-[var(--labora-muted)]">{clientName(reviewingExpense.userId)} · {formatCurrency(reviewingExpense.amount)} · {formatDate(reviewingExpense.date)}</p>
              </div>
              <button type="button" onClick={() => setReviewingExpense(null)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]"><X size={18} /></button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5">
              {reviewingExpense.receiptUrl && (
                <button type="button" onClick={() => setViewingImage(reviewingExpense.receiptUrl || null)} className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-3 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-primary)]"><ImageIcon size={17} /></div>
                  <div className="min-w-0"><p className="text-sm font-extrabold text-[var(--labora-ink)]">Ver justificante</p><p className="text-[11px] text-[var(--labora-muted)]">Abre la imagen adjunta</p></div>
                </button>
              )}
              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--labora-muted)]">% deducible (0–100)</span>
                <input type="number" min="0" max="100" step="1" value={reviewPct} onChange={(event) => setReviewPct(event.target.value)} className="field-input" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--labora-muted)]">Nota para el autónomo</span>
                <textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="field-input resize-none" placeholder="Opcional" />
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => submitManagerReview('rejected')} className="rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3 py-3 text-xs font-extrabold text-[var(--labora-clay-deep)]">Rechazar</button>
                <button type="button" onClick={() => submitManagerReview('needs_fix')} className="rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3 py-3 text-xs font-extrabold text-[var(--labora-clay-deep)]">Pedir corrección</button>
                <button type="button" onClick={() => submitManagerReview('approved')} className="rounded-[13px] bg-[var(--labora-primary)] px-3 py-3 text-xs font-extrabold text-white">Aprobar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isManager && <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />}

      <style>{`.field-input{width:100%;border:1px solid var(--labora-border);background:var(--labora-surface);border-radius:13px;padding:.65rem .75rem;font-size:.875rem;outline:none}.field-input:focus{border-color:var(--labora-primary-2);box-shadow:0 0 0 2px color-mix(in srgb, var(--labora-primary) 18%, transparent)}`}</style>
    </div>
  );
};

const ActionCard = ({ icon: Icon, title, text, tone, onClick, loading = false, wide = false }: any) => {
  const toneClass = tone === 'clay'
    ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)] border-[var(--labora-border)]'
    : tone === 'green'
      ? 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)] border-[var(--labora-border)]'
      : 'bg-[var(--labora-surface-2)] text-[var(--labora-muted)] border-[var(--labora-border)]';
  return (
    <button type="button" onClick={onClick} disabled={loading} className={`labora-card labora-card-interactive min-w-0 p-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] disabled:opacity-60 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] border ${toneClass}`}>{loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}</div>
      <p className="mt-2 text-sm font-extrabold text-[var(--labora-ink)]">{title}</p>
      <p className="mt-0.5 text-[11px] font-medium text-[var(--labora-muted)]">{text}</p>
    </button>
  );
};

const merchantCategory = (category: ExpenseCategory | string): 'fuel' | 'restaurant' | 'supermarket' | 'other' => {
  if (category === ExpenseCategory.GASOLINA || String(category).toLowerCase().includes('combustible')) return 'fuel';
  if (String(category).toLowerCase().includes('comida')) return 'restaurant';
  if (String(category).toLowerCase().includes('compra') || String(category).toLowerCase().includes('supermercado')) return 'supermarket';
  return 'other';
};

const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={active} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${active ? 'border-[var(--labora-primary)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'}`}>
    {children}
  </button>
);

const Field = ({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) => (
  <div className="block space-y-1.5">
    <label htmlFor={htmlFor} className="text-xs font-extrabold text-[var(--labora-muted)]">{label}</label>
    {children}
  </div>
);

export default ExpenseTracker;
