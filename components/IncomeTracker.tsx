import React, { useMemo, useRef, useState } from 'react';
import {
  ClipboardPaste,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { extractIncomeFromDocument, extractIncomeFromText, getRetentionExplanation } from '../services/geminiService';
import { parseIncomeTextLocally } from '../services/incomeTextParser';
import { reviewRemoteIncome } from '../services/remoteOperational';
import { canOwnerDeleteRow, incomeDeleteConfirmMessage } from '../services/deleteEligibility';
import { Income, UserRole } from '../types';

interface IncomeTrackerProps {
  startDate: string;
  endDate: string;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ startDate, endDate }) => {
  const {
    incomes,
    documents,
    addIncome,
    addIncomes,
    addDocument,
    deleteIncome,
    currentUser,
    users,
    privacyMode,
    showNotification
  } = useData();
  const { selectedCountry } = useCountry();

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pendingImports, setPendingImports] = useState<Array<{ platform: string; amount: number; date: string; retention: number }>>([]);
  const [pendingImportSource, setPendingImportSource] = useState<'text_import' | 'document_import'>('text_import');
  const [pendingImportReference, setPendingImportReference] = useState('Texto pegado por el usuario');
  const [pendingEvidence, setPendingEvidence] = useState<{
    name: string;
    dataUrl: string;
    mimeType: string;
    sizeBytes: number;
    contentHash: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [platform, setPlatform] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [retention, setRetention] = useState('0');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<Record<string, boolean>>({});
  const [reviewingIncome, setReviewingIncome] = useState<Record<string, boolean>>({});
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const linkedIds = useMemo(() => new Set(
    users
      .filter((user) => user.role === UserRole.RIDER && user.managerId === currentUser?.id)
      .map((user) => user.id)
  ), [users, currentUser?.id]);
  const ownerNames = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

  const filteredIncomes = useMemo(() => incomes.filter((income) => {
    if (!currentUser) return false;
    if (isManager) {
      if (!linkedIds.has(income.userId)) return false;
    } else if (income.userId !== currentUser.id) {
      return false;
    }
    if (startDate && income.date < startDate) return false;
    if (endDate && income.date > endDate) return false;
    return true;
  }), [incomes, startDate, endDate, currentUser, isManager, linkedIds]);

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalRetention = filteredIncomes.reduce((sum, income) => sum + income.retention, 0);

  const formatMoney = (value: number) => privacyMode
    ? '••••'
    : value.toLocaleString(selectedCountry.country_code === 'MX' ? 'es-MX' : 'es-ES', { style: 'currency', currency: selectedCountry.currency || 'EUR', maximumFractionDigits: 2 });

  const handleDeleteIncome = async (income: Income) => {
    if (!canOwnerDeleteRow(income.userId, currentUser?.id, Boolean(isManager))) return;
    if (!window.confirm(incomeDeleteConfirmMessage(income.platform))) return;
    setDeletingIncomeId(income.id);
    try {
      await deleteIncome(income.id);
    } finally {
      setDeletingIncomeId(null);
    }
  };

  const handleAIExtraction = async () => {
    if (!pastedText.trim() || isManager) return;
    setIsProcessing(true);
    try {
      // Prefer deterministic local parse (CSV / líneas Glovo·Uber) — works without Gemini.
      const localRows = parseIncomeTextLocally(pastedText);
      let extractedData = localRows;
      let sourceLabel = 'Texto / CSV (parser local)';

      if (extractedData.length === 0) {
        try {
          extractedData = await extractIncomeFromText(pastedText);
          sourceLabel = 'Texto (asistente IA)';
        } catch (error: unknown) {
          const code = error instanceof Error ? error.message : '';
          if (code === 'AI_NOT_CONFIGURED') {
            showNotification(
              'info',
              'Sin OCR/IA configurada. Pega CSV o líneas tipo «Glovo 10/09/2026 89,90» (plataforma, fecha, importe).'
            );
            return;
          }
          throw error;
        }
      }

      if (extractedData.length === 0) {
        showNotification(
          'info',
          'No se encontraron ingresos claros. Formato: plataforma;fecha;importe;retención o «Glovo 10/09/2026 89,90».'
        );
        return;
      }

      setPendingImportSource('text_import');
      setPendingImportReference(sourceLabel);
      setPendingEvidence(null);
      setPendingImports(extractedData.map((item) => ({
        platform: item.platform,
        amount: item.amount,
        date: item.date,
        retention: item.retention || 0
      })));
      showNotification('info', `${extractedData.length} ingresos detectados. Revisa antes de guardar.`);
    } catch (error: any) {
      console.error(error);
      showNotification('error', String(error?.message || 'No se pudo procesar el texto.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const closeImportModal = () => {
    setIsPasteModalOpen(false);
    setPastedText('');
    setPendingImports([]);
    setPendingImportSource('text_import');
    setPendingImportReference('Texto pegado por el usuario');
    setPendingEvidence(null);
  };

  const confirmPendingImports = () => {
    if (!pendingImports.length || isManager || !currentUser) return;

    const hasInvalidRow = pendingImports.some((item) =>
      !item.platform.trim()
      || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
      || !Number.isFinite(item.amount)
      || item.amount <= 0
      || !Number.isFinite(item.retention)
      || item.retention < 0
    );
    if (hasInvalidRow) {
      showNotification('error', 'Revisa plataforma, fecha, importe y retención antes de guardar.');
      return;
    }

    let sourceDocumentId: string | undefined;
    let sourceHash: string | undefined;

    if (pendingImportSource === 'document_import') {
      if (!pendingEvidence) {
        showNotification('error', 'Falta el documento original de esta importación.');
        return;
      }

      const duplicate = documents.some(
        (document) => document.userId === currentUser.id && document.contentHash === pendingEvidence.contentHash
      );
      if (duplicate) {
        showNotification('error', 'Esta liquidación exacta ya existe en tu expediente.');
        return;
      }

      const evidenceDocument = addDocument({
        type: 'Liquidación',
        name: pendingEvidence.name,
        date: new Date().toISOString().split('T')[0],
        content: pendingEvidence.dataUrl,
        mimeType: pendingEvidence.mimeType,
        sizeBytes: pendingEvidence.sizeBytes,
        contentHash: pendingEvidence.contentHash
      });
      if (!evidenceDocument) {
        showNotification('error', 'No se pudo conservar el documento original.');
        return;
      }

      sourceDocumentId = evidenceDocument.id;
      sourceHash = pendingEvidence.contentHash;
    }

    addIncomes(pendingImports.map((item) => ({
      ...item,
      sourceType: pendingImportSource,
      sourceReference: pendingImportReference,
      sourceDocumentId,
      sourceHash,
      needsReview: true
    })));
    closeImportModal();
  };

  const handleIncomeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || isManager) return;

    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.type)) {
      showNotification('error', 'Usa PDF, JPG, PNG o WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'La liquidación supera el límite de 10 MB.');
      return;
    }

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const contentHash = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      const duplicate = documents.some(
        (document) => document.userId === currentUser?.id && document.contentHash === contentHash
      );
      if (duplicate) {
        showNotification('error', 'Esta liquidación exacta ya existe en tu expediente.');
        return;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('No se pudo leer el archivo.'));
        reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(file);
      });
      const base64Data = dataUrl.split(',')[1] || '';
      if (!base64Data) throw new Error('No se pudo preparar el archivo.');

      const extractedData = await extractIncomeFromDocument(base64Data, file.type);
      if (extractedData.length === 0) {
        showNotification('info', 'No se encontraron ingresos claros en el archivo.');
        return;
      }

      setPendingImportSource('document_import');
      setPendingImportReference(`Archivo importado: ${file.name}`);
      setPendingEvidence({
        name: file.name,
        dataUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        contentHash
      });
      setPendingImports(extractedData.map((item) => ({
        platform: item.platform,
        amount: item.amount,
        date: item.date,
        retention: item.retention || 0
      })));
      showNotification('info', `${extractedData.length} ingresos extraídos. Revisa antes de guardar.`);
    } catch (error: any) {
      console.error('Income document import failed', error);
      const raw = String(error?.message || '');
      showNotification(
        'error',
        raw.includes('NOT_CONFIGURED')
          ? 'La extracción IA no está configurada en este entorno.'
          : 'No se pudo extraer la liquidación. Puedes introducirla manualmente.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || isManager) return;
    const numericAmount = Number(amount);
    const numericRetention = Number(retention || 0);

    if (!platform.trim() || !date || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Completa plataforma, fecha e importe.');
      showNotification('error', 'Completa plataforma, fecha e importe.');
      return;
    }
    if (!Number.isFinite(numericRetention) || numericRetention < 0) {
      showNotification('error', 'La retención debe ser un importe válido.');
      return;
    }

    addIncome({
      platform: platform.trim(),
      amount: numericAmount,
      date,
      retention: numericRetention,
      sourceType: 'manual',
      needsReview: false
    });
    setPlatform('');
    setAmount('');
    setRetention('0');
    setDate(new Date().toISOString().split('T')[0]);
    setIsManualOpen(false);
  };

  const handleIncomeReview = async (incomeId: string, action: 'reviewed' | 'needs_fix') => {
    if (!isManager || reviewingIncome[incomeId]) return;
    setReviewingIncome((previous) => ({ ...previous, [incomeId]: true }));
    try {
      await reviewRemoteIncome(
        incomeId,
        action,
        action === 'reviewed'
          ? 'Revisado por la gestoría.'
          : 'Revisa el importe, la fecha o el justificante antes de volver a enviarlo.'
      );
      showNotification(
        'success',
        action === 'reviewed' ? 'Ingreso marcado como revisado.' : 'Corrección solicitada al cliente.'
      );
    } catch (error) {
      console.error('Income review failed', error);
      showNotification('error', 'No se pudo actualizar la revisión del ingreso.');
    } finally {
      setReviewingIncome((previous) => ({ ...previous, [incomeId]: false }));
    }
  };

  const handleAnalyzeRetention = async (id: string, incomePlatform: string, incomeAmount: number, incomeRetention: number) => {
    if (loadingExplanation[id]) return;
    setLoadingExplanation((previous) => ({ ...previous, [id]: true }));
    try {
      const explanation = await getRetentionExplanation(incomePlatform, incomeAmount, incomeRetention);
      setExplanations((previous) => ({ ...previous, [id]: explanation }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'No se pudo analizar la retención.');
    } finally {
      setLoadingExplanation((previous) => ({ ...previous, [id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <section className="labora-card overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="labora-kicker text-[var(--labora-primary-2)]">{isManager ? 'Cartera vinculada' : 'Registro de actividad'}</p>
            <h2 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">{isManager ? 'Ingresos de clientes' : 'Ingresos'}</h2>
            <p className="mt-1 text-xs text-[var(--labora-muted)]">
              {isManager ? 'Lectura de ingresos registrados por tus clientes vinculados.' : 'Sin conexión a Glovo/Uber. Registra importes a mano o importa liquidación/CSV; nada se inventa.'}
            </p>
          </div>

          {!isManager && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setFormError(''); setIsManualOpen(true); }} className="inline-flex items-center gap-2 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3.5 py-2.5 text-xs font-extrabold text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"><Plus size={15} aria-hidden /> Añadir</button>
              <button type="button" onClick={() => setIsPasteModalOpen(true)} className="inline-flex items-center gap-2 rounded-[13px] bg-[var(--labora-primary)] px-3.5 py-2.5 text-xs font-extrabold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"><Sparkles size={15} aria-hidden /> Importar</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-[var(--labora-border)]">
          <SummaryMetric label="Ingresos visibles" value={formatMoney(totalIncome)} />
          <SummaryMetric label="Retenciones registradas" value={formatMoney(totalRetention)} accent />
        </div>
      </section>

      <section className="labora-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--labora-border)] px-4 py-3.5">
          <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><TrendingUp size={15} /></div><div><h3 className="text-sm font-extrabold text-[var(--labora-ink)]">Historial</h3><p className="text-[10px] text-[var(--labora-muted)]">{filteredIncomes.length} registros</p></div></div>
        </div>

        {filteredIncomes.length === 0 ? (
          <div className="px-4 py-12 text-center" role="status" aria-live="polite"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]" aria-hidden><TrendingUp size={23} /></div><p className="mt-3 text-sm font-extrabold text-[var(--labora-ink-soft)]">No hay ingresos en este periodo.</p><p className="mt-1 text-xs text-[var(--labora-muted)]">Añade un ingreso manual o importa una liquidación/CSV. Nada se inventa automáticamente.</p></div>
        ) : (
          <div className="divide-y divide-[var(--labora-border)]">
            {filteredIncomes.map((income) => (
              <React.Fragment key={income.id}>
                <article className="p-4 transition hover:bg-[var(--labora-parchment)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[var(--labora-ink)]">{income.platform}</p>
                      <p className="mt-1 text-[10px] font-medium text-[var(--labora-muted)]">
                        {income.date}{isManager ? ` · ${ownerNames.get(income.userId) || 'Cliente'}` : ''} · {incomeSourceLabel(income.sourceType)}
                      </p>
                      {income.reviewedBy && !income.needsReview ? (
                        <span className="labora-status-ok mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold">
                          Revisado por gestoría
                        </span>
                      ) : income.reviewedBy && income.needsReview ? (
                        <span className="labora-status-warn mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold">
                          Corrección solicitada
                        </span>
                      ) : income.needsReview ? (
                        <span className="labora-status-pending mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold">
                          Pendiente de revisión
                        </span>
                      ) : null}
                      {income.reviewNote && (
                        <p className="mt-1.5 max-w-md text-[10px] leading-relaxed text-[var(--labora-muted)]">{income.reviewNote}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="text-right"><p className="text-sm font-extrabold text-[var(--labora-primary)]">+{formatMoney(income.amount)}</p>{income.retention > 0 && <p className="mt-0.5 text-[10px] font-bold text-[var(--labora-clay-deep)]">Ret. −{formatMoney(income.retention)}</p>}</div>
                      {!isManager && canOwnerDeleteRow(income.userId, currentUser?.id, false) && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteIncome(income)}
                          disabled={deletingIncomeId === income.id}
                          className="rounded-[10px] p-2 text-[var(--labora-muted)] hover:bg-[var(--labora-soft-clay)] hover:text-[var(--labora-clay-deep)] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"
                          aria-label="Eliminar ingreso"
                          title="Eliminar ingreso"
                        >
                          {deletingIncomeId === income.id ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Trash2 size={16} aria-hidden />}
                        </button>
                      )}
                    </div>
                  </div>

                  {income.retention > 0 && (
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => void handleAnalyzeRetention(income.id, income.platform, income.amount, income.retention)} disabled={loadingExplanation[income.id]} className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--labora-surface-2)] px-2.5 py-1.5 text-[10px] font-extrabold text-[var(--labora-muted)] hover:bg-[var(--labora-border)] disabled:opacity-60">
                        {loadingExplanation[income.id] ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Explicar retención
                      </button>
                    </div>
                  )}

                  {isManager && income.needsReview && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => void handleIncomeReview(income.id, 'needs_fix')}
                        disabled={reviewingIncome[income.id]}
                        className="rounded-[10px] border border-[var(--labora-border)] px-2.5 py-1.5 text-[10px] font-extrabold text-[var(--labora-clay-deep)] hover:bg-[var(--labora-soft-clay)] disabled:opacity-50"
                      >
                        Pedir corrección
                      </button>
                      <button
                        onClick={() => void handleIncomeReview(income.id, 'reviewed')}
                        disabled={reviewingIncome[income.id]}
                        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--labora-primary)] px-2.5 py-1.5 text-[10px] font-extrabold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {reviewingIncome[income.id] && <Loader2 size={11} className="animate-spin" />}
                        Validar
                      </button>
                    </div>
                  )}
                </article>

                {explanations[income.id] && (
                  <div className="border-t border-[var(--labora-border)] bg-[var(--labora-parchment)] px-4 py-3">
                    <div className="flex items-start gap-2.5"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]"><Info size={13} /></div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--labora-primary-2)]">Explicación IA</p><p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">{explanations[income.id]}</p><p className="mt-1 text-[9px] text-[var(--labora-muted)]">Explicación informativa; no confirma que la retención sea fiscalmente correcta.</p></div></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {isManualOpen && !isManager && (
        <Modal onClose={() => setIsManualOpen(false)} title="Añadir ingreso" kicker="Registro manual">
          <form onSubmit={handleManualSave} className="space-y-4" noValidate>
            <Field label="Plataforma / pagador" htmlFor="labora-income-platform"><input id="labora-income-platform" value={platform} onChange={(e) => { setPlatform(e.target.value); if (formError) setFormError(''); }} className="field-input" placeholder="Ej. Uber Eats" aria-invalid={formError ? true : undefined} aria-describedby={formError ? 'labora-income-form-error' : undefined} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Importe bruto" htmlFor="labora-income-amount"><input id="labora-income-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => { setAmount(e.target.value); if (formError) setFormError(''); }} className="field-input" aria-invalid={formError ? true : undefined} aria-describedby={formError ? 'labora-income-form-error' : undefined} /></Field><Field label="Fecha" htmlFor="labora-income-date"><input id="labora-income-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); if (formError) setFormError(''); }} className="field-input" aria-invalid={formError ? true : undefined} aria-describedby={formError ? 'labora-income-form-error' : undefined} /></Field></div>
            <Field label="Retención registrada" htmlFor="labora-income-retention"><input id="labora-income-retention" type="number" min="0" step="0.01" value={retention} onChange={(e) => setRetention(e.target.value)} className="field-input" /></Field>
            <p className="rounded-[13px] bg-[var(--labora-parchment)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--labora-muted)]">Introduce únicamente importes que aparezcan en tu liquidación, factura o justificante.</p>
            {formError ? (
              <p id="labora-income-form-error" role="alert" className="rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3 py-2.5 text-xs font-medium text-[var(--labora-clay)]">{formError}</p>
            ) : null}
            <button type="submit" className="w-full rounded-[13px] bg-[var(--labora-primary)] py-3 text-sm font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]">Guardar ingreso</button>
          </form>
        </Modal>
      )}

      {isPasteModalOpen && !isManager && (
        <Modal onClose={closeImportModal} title="Importar ingresos" kicker="Extracción con IA">
          {pendingImports.length === 0 ? (
            <>
              <p className="mb-3 text-xs leading-relaxed text-[var(--labora-muted)]">
                Sin API de Glovo/Uber: importa liquidación (PDF/captura si hay IA) o pega CSV / líneas «Glovo 10/09/2026 89,90». Nada se guarda hasta que confirmes.
              </p>
              <input
                ref={importFileRef}
                type="file"
                className="hidden"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => void handleIncomeFile(event)}
              />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                disabled={isProcessing}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-3 py-3 text-xs font-extrabold text-[var(--labora-primary)] disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                PDF o captura de liquidación
              </button>
              <div className="mb-3 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--labora-muted)]">
                <span className="h-px flex-1 bg-[var(--labora-border)]" /> o pega texto <span className="h-px flex-1 bg-[var(--labora-border)]" />
              </div>
              <textarea
                className="h-40 w-full resize-none rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-3 text-sm outline-none focus:border-[var(--labora-primary-2)]"
                placeholder="Pega aquí el texto…"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <div className="mt-4 flex gap-2">
                <button onClick={closeImportModal} className="flex-1 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] py-2.5 text-xs font-extrabold text-[var(--labora-muted)]">Cancelar</button>
                <button onClick={() => void handleAIExtraction()} disabled={isProcessing || !pastedText.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--labora-clay)] py-2.5 text-xs font-extrabold text-white disabled:opacity-40">
                  {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Extraer
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--labora-gold)]">
                Revisa cada fila. Origen: {pendingImportSource === 'document_import' ? 'documento/captura' : 'texto pegado'}. Nada se considera verificado automáticamente.
              </div>
              <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                {pendingImports.map((item, index) => (
                  <div key={`${item.platform}-${item.date}-${index}`} className="rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="col-span-2">
                        <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--labora-muted)]">Plataforma</span>
                        <input
                          value={item.platform}
                          onChange={(event) => setPendingImports((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, platform: event.target.value } : row))}
                          className="field-input"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--labora-muted)]">Importe</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(event) => setPendingImports((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, amount: Number(event.target.value) } : row))}
                          className="field-input"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--labora-muted)]">Fecha</span>
                        <input
                          type="date"
                          value={item.date}
                          onChange={(event) => setPendingImports((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, date: event.target.value } : row))}
                          className="field-input"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setPendingImports([])} className="flex-1 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] py-2.5 text-xs font-extrabold text-[var(--labora-muted)]">Volver</button>
                <button onClick={confirmPendingImports} className="flex-1 rounded-[13px] bg-[var(--labora-primary)] py-2.5 text-xs font-extrabold text-white">Guardar {pendingImports.length}</button>
              </div>
            </>
          )}
        </Modal>
      )}

      <style>{`.field-input{width:100%;border:1px solid var(--labora-border);background:var(--labora-surface);border-radius:13px;padding:.65rem .75rem;font-size:.875rem;outline:none}.field-input:focus{border-color:var(--labora-primary-2);box-shadow:0 0 0 2px color-mix(in srgb, var(--labora-primary) 18%, transparent)}`}</style>
    </div>
  );
};

const incomeSourceLabel = (sourceType?: string) => {
  if (sourceType === 'text_import') return 'Texto importado';
  if (sourceType === 'document_import') return 'Documento';
  if (sourceType === 'api_sync') return 'API verificada';
  if (sourceType === 'bank_import') return 'Movimiento bancario';
  return 'Manual';
};

const SummaryMetric = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => <div className="bg-[var(--labora-parchment)] p-3.5 sm:p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--labora-muted)]">{label}</p><p className={`mt-1 text-base font-extrabold tracking-[-0.03em] ${accent ? 'text-[var(--labora-clay-deep)]' : 'text-[var(--labora-primary)]'}`}>{value}</p></div>;

const Modal = ({ onClose, title, kicker, children }: { onClose: () => void; title: string; kicker: string; children: React.ReactNode }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--labora-ink)]/55 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[26px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label={title}><div className="mb-5 flex items-start justify-between"><div><p className="labora-kicker text-[var(--labora-primary-2)]">{kicker}</p><h3 className="mt-1 text-lg font-extrabold text-[var(--labora-ink)]">{title}</h3></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]" aria-label="Cerrar"><X size={18} aria-hidden /></button></div>{children}</div></div>;

const Field = ({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) => (
  <div className="block space-y-1.5">
    <label htmlFor={htmlFor} className="text-xs font-extrabold text-[var(--labora-muted)]">{label}</label>
    {children}
  </div>
);

export default IncomeTracker;
