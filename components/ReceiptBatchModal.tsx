import { MerchantBrandPreview } from './MerchantLogo';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';
import {
  BATCH_STATUS_LABELS,
  type BatchDraft,
  type BatchFileStatus,
  classifyBatch,
  draftAmount,
  precheckFile,
  sha256Hex,
  validateDraft
} from '../services/receiptBatch';
import { ExpenseCategory, type Expense } from '../types';
import { Dialog } from './orders/OrderDialog';
import { formControlFocusClass } from './formA11y';

interface BatchItem {
  key: string;
  name: string;
  size: number;
  type: string;
  hash?: string;
  status: BatchFileStatus;
  dataUrl?: string;
  draft: BatchDraft;
  ocr?: { confidence: number; needsReview: boolean; uncertainFields: string[]; summary: string };
  reading?: boolean;
}

interface ReceiptBatchModalProps {
  files: File[];
  existingHashes: Set<string>;
  onClose: () => void;
  onSave: (expenses: Omit<Expense, 'id' | 'userId'>[]) => void;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer la imagen.')));
  reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));
  reader.readAsDataURL(file);
});

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const inputClass = `min-h-11 w-full rounded-[12px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-2.5 text-sm font-bold text-[var(--labora-ink)] ${formControlFocusClass}`;

/** Varios tickets a la vez: huella SHA-256 por archivo, duplicados bloqueados, datos revisados por el usuario. */
export const ReceiptBatchModal: React.FC<ReceiptBatchModalProps> = ({ files, existingHashes, onClose, onSave, notify }) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [preparing, setPreparing] = useState(true);
  const [bulkCategory, setBulkCategory] = useState('');
  const todayKey = localToday();

  useEffect(() => {
    let active = true;
    (async () => {
      const infos: Array<{ file: File; hash?: string }> = [];
      let bytes = 0;
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const pre = precheckFile(file, index, bytes);
        bytes += file.size;
        infos.push({ file, hash: pre ? undefined : await sha256Hex(await file.arrayBuffer()) });
      }
      const statuses = classifyBatch(infos.map(({ file, hash }) => ({ name: file.name, size: file.size, type: file.type, hash })), existingHashes);
      const prepared: BatchItem[] = [];
      for (let index = 0; index < infos.length; index += 1) {
        const { file, hash } = infos[index];
        const status = statuses[index];
        prepared.push({
          key: `${index}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type,
          hash,
          status,
          dataUrl: status === 'ready' ? await readAsDataUrl(file) : undefined,
          draft: { date: '', amount: '', category: ExpenseCategory.OTROS, merchant: '' }
        });
      }
      if (active) { setItems(prepared); setPreparing(false); }
    })().catch((error) => {
      if (active) { notify('error', error instanceof Error ? error.message : 'No se pudieron preparar los tickets.'); setPreparing(false); }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const ready = items.filter((item) => item.status === 'ready');
  const rejected = items.filter((item) => item.status !== 'ready');
  const errors = useMemo(() => new Map(ready.map((item) => [item.key, validateDraft(item.draft, todayKey)])), [ready, todayKey]);
  const validCount = ready.filter((item) => !errors.get(item.key)).length;

  const patch = (key: string, next: Partial<BatchItem>) => setItems((previous) => previous.map((item) => (item.key === key ? { ...item, ...next } : item)));
  const patchDraft = (key: string, next: Partial<BatchDraft>) => setItems((previous) => previous.map((item) => (item.key === key ? { ...item, draft: { ...item.draft, ...next } } : item)));
  const remove = (key: string) => setItems((previous) => previous.filter((item) => item.key !== key));

  const readWithAi = async (item: BatchItem) => {
    if (!item.dataUrl) return;
    patch(item.key, { reading: true });
    try {
      const result = await analyzeReceipt(item.dataUrl.split(',')[1] || '', item.type);
      setItems((previous) => previous.map((current) => (current.key === item.key ? {
        ...current,
        reading: false,
        draft: {
          date: result.date || current.draft.date,
          amount: result.amount ? String(result.amount).replace('.', ',') : current.draft.amount,
          category: result.category || current.draft.category,
          merchant: result.merchantName || current.draft.merchant
        },
        ocr: { confidence: result.confidence, needsReview: result.needsReview, uncertainFields: result.uncertainFields, summary: result.summary }
      } : current)));
    } catch (error) {
      patch(item.key, { reading: false });
      notify('error', error instanceof Error && error.message === 'AI_NOT_CONFIGURED' ? 'IA no configurada: completa los datos a mano.' : 'No se pudo leer este ticket. Complétalo a mano.');
    }
  };

  const save = () => {
    const toSave = ready.filter((item) => !errors.get(item.key));
    if (!toSave.length) return;
    onSave(toSave.map((item) => ({
      category: item.draft.category,
      date: item.draft.date,
      amount: draftAmount(item.draft),
      merchant: item.draft.merchant.trim() || undefined,
      notes: item.ocr?.summary || undefined,
      receiptUrl: item.dataUrl,
      receiptHash: item.hash,
      receiptMimeType: item.type,
      ocrConfidence: item.ocr?.confidence,
      ocrNeedsReview: item.ocr ? item.ocr.needsReview : true,
      ocrUncertainFields: item.ocr?.uncertainFields,
      isRecurring: false,
      vatRate: 0,
      vatAmount: 0,
      deductiblePercentage: 0,
      status: 'pending_review'
    })));
    onClose();
  };

  return (
    <Dialog title="Varios tickets" onClose={onClose}>
      {preparing ? (
        <p className="flex items-center gap-2 py-6 text-xs text-[var(--labora-muted)]" role="status"><Loader2 size={16} className="animate-spin" aria-hidden /> Calculando huella SHA-256 de {files.length} {files.length === 1 ? 'archivo' : 'archivos'}…</p>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-[var(--labora-muted)]">
            Cada archivo lleva su huella SHA-256: el mismo ticket exacto no se registra dos veces. Revisa importe, fecha y categoría de cada uno. Se guardan como pendientes de revisión de tu gestoría, sin IVA ni % deducible supuestos.
          </p>

          {rejected.length > 0 && (
            <div className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] p-3" role="status">
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-clay-deep)]"><AlertTriangle size={14} aria-hidden /> {rejected.length} {rejected.length === 1 ? 'archivo no se añadirá' : 'archivos no se añadirán'}</p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--labora-clay-deep)]">
                {rejected.map((item) => <li key={item.key} className="truncate"><strong>{item.name}</strong>: {BATCH_STATUS_LABELS[item.status]}</li>)}
              </ul>
            </div>
          )}

          {ready.length > 1 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="labora-batch-bulk-category" className="text-[11px] font-extrabold text-[var(--labora-muted)]">Categoría para todos</label>
                <select id="labora-batch-bulk-category" value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} className={inputClass}>
                  <option value="">Elegir…</option>
                  {Object.values(ExpenseCategory).map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <button type="button" disabled={!bulkCategory} onClick={() => setItems((previous) => previous.map((item) => ({ ...item, draft: { ...item.draft, category: bulkCategory } })))} className={`min-h-11 rounded-[12px] border border-[var(--labora-border)] px-3 text-xs font-extrabold text-[var(--labora-primary)] disabled:opacity-40 ${formControlFocusClass}`}>Aplicar</button>
            </div>
          )}

          <ul className="space-y-2">
            {ready.map((item, index) => {
              const error = errors.get(item.key);
              return (
                <li key={item.key} className="rounded-[14px] border border-[var(--labora-border)] p-2.5">
                  <div className="flex gap-2.5">
                    <img src={item.dataUrl} alt={`Ticket ${index + 1}: ${item.name}`} className="h-20 w-16 shrink-0 rounded-[10px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="truncate text-xs font-extrabold text-[var(--labora-ink)]">{item.name}</p>
                        <button type="button" onClick={() => remove(item.key)} aria-label={`Quitar ${item.name}`} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--labora-muted)] hover:bg-[var(--labora-soft-clay)] ${formControlFocusClass}`}><Trash2 size={14} aria-hidden /></button>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1.5">
                        <div>
                          <label htmlFor={`labora-batch-amount-${item.key}`} className="text-[10px] font-extrabold text-[var(--labora-muted)]">Importe (€)</label>
                          <input id={`labora-batch-amount-${item.key}`} inputMode="decimal" value={item.draft.amount} onChange={(event) => patchDraft(item.key, { amount: event.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label htmlFor={`labora-batch-date-${item.key}`} className="text-[10px] font-extrabold text-[var(--labora-muted)]">Fecha</label>
                          <input id={`labora-batch-date-${item.key}`} type="date" max={todayKey} value={item.draft.date} onChange={(event) => patchDraft(item.key, { date: event.target.value })} className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <div>
                      <label htmlFor={`labora-batch-category-${item.key}`} className="text-[10px] font-extrabold text-[var(--labora-muted)]">Categoría</label>
                      <select id={`labora-batch-category-${item.key}`} value={item.draft.category} onChange={(event) => patchDraft(item.key, { category: event.target.value })} className={inputClass}>
                        {Object.values(ExpenseCategory).map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`labora-batch-merchant-${item.key}`} className="text-[10px] font-extrabold text-[var(--labora-muted)]">Comercio</label>
                      <input id={`labora-batch-merchant-${item.key}`} value={item.draft.merchant} onChange={(event) => patchDraft(item.key, { merchant: event.target.value })} className={inputClass} />
                      <MerchantBrandPreview merchant={item.draft.merchant} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className={`text-[10px] font-bold ${error ? 'text-[var(--labora-clay-deep)]' : 'text-[var(--labora-primary)]'}`} aria-live="polite">
                      {error || (item.ocr?.needsReview ? 'Leído por IA: revisa los campos marcados.' : 'Listo para guardar')}
                    </p>
                    <button type="button" onClick={() => void readWithAi(item)} disabled={item.reading} className={`inline-flex min-h-9 items-center gap-1 rounded-[10px] px-2.5 text-[11px] font-extrabold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] disabled:opacity-50 ${formControlFocusClass}`}>
                      {item.reading ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Sparkles size={13} aria-hidden />} Leer con IA
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {ready.length === 0 && <p className="py-4 text-center text-xs text-[var(--labora-muted)]" role="status">No hay tickets nuevos que añadir.</p>}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`min-h-12 flex-1 rounded-[14px] border border-[var(--labora-border)] text-sm font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}>Cancelar</button>
            <button type="button" onClick={save} disabled={validCount === 0} className={`inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] text-sm font-extrabold text-white disabled:opacity-40 ${formControlFocusClass}`}>
              <CheckCircle2 size={16} aria-hidden /> Guardar {validCount} {validCount === 1 ? 'gasto' : 'gastos'}
            </button>
          </div>
          {validCount < ready.length && ready.length > 0 && <p className="text-center text-[10px] text-[var(--labora-muted)]">Los tickets incompletos no se guardan: complétalos o quítalos.</p>}
        </div>
      )}
    </Dialog>
  );
};
