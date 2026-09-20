import React, { useMemo, useRef, useState } from 'react';
import {
  ClipboardPaste,
  Info,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  Upload,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { extractIncomeFromDocument, extractIncomeFromText, getRetentionExplanation } from '../services/geminiService';
import { parseIncomeTextLocally } from '../services/incomeTextParser';
import { reviewRemoteIncome } from '../services/remoteOperational';
import { UserRole } from '../types';

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
    currentUser,
    users,
    privacyMode,
    showNotification
  } = useData();
  const { selectedCountry } = useCountry();

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
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
            <p className="labora-kicker text-[#789582]">{isManager ? 'Cartera vinculada' : 'Registro de actividad'}</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#1E231F]">{isManager ? 'Ingresos de clientes' : 'Ingresos'}</h2>
            <p className="mt-1 text-xs text-stone-500">
              {isManager ? 'Lectura de ingresos registrados por tus clientes vinculados.' : 'Sin conexión a Glovo/Uber. Registra importes a mano o importa liquidación/CSV; nada se inventa.'}
            </p>
          </div>

          {!isManager && (
            <div className="flex gap-2">
              <button onClick={() => setIsManualOpen(true)} className="inline-flex items-center gap-2 rounded-[13px] border border-[#DDD5CA] bg-white px-3.5 py-2.5 text-xs font-extrabold text-stone-600 hover:bg-[#F7F4EF]"><Plus size={15} /> Añadir</button>
              <button onClick={() => setIsPasteModalOpen(true)} className="inline-flex items-center gap-2 rounded-[13px] bg-[#214E3A] px-3.5 py-2.5 text-xs font-extrabold text-white hover:bg-[#183D2D]"><Sparkles size={15} /> Importar</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-[#EAE3D9]">
          <SummaryMetric label="Ingresos visibles" value={formatMoney(totalIncome)} />
          <SummaryMetric label="Retenciones registradas" value={formatMoney(totalRetention)} accent />
        </div>
      </section>

      <section className="labora-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#EEE7DD] px-4 py-3.5">
          <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#E7F0EA] text-[#214E3A]"><TrendingUp size={15} /></div><div><h3 className="text-sm font-extrabold text-[#1E231F]">Historial</h3><p className="text-[10px] text-stone-400">{filteredIncomes.length} registros</p></div></div>
        </div>

        {filteredIncomes.length === 0 ? (
          <div className="px-4 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F1ECE3] text-stone-300"><TrendingUp size={23} /></div><p className="mt-3 text-sm font-extrabold text-stone-500">No hay ingresos en este periodo.</p></div>
        ) : (
          <div className="divide-y divide-[#EEE7DD]">
            {filteredIncomes.map((income) => (
              <React.Fragment key={income.id}>
                <article className="p-4 transition hover:bg-[#FCFAF7]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#1E231F]">{income.platform}</p>
                      <p className="mt-1 text-[10px] font-medium text-stone-400">
                        {income.date}{isManager ? ` · ${ownerNames.get(income.userId) || 'Cliente'}` : ''} · {incomeSourceLabel(income.sourceType)}
                      </p>
                      {income.reviewedBy && !income.needsReview ? (
                        <span className="mt-1.5 inline-flex rounded-full border border-[#CFE7D7] bg-[#ECF7F0] px-2 py-0.5 text-[9px] font-extrabold text-[#24613F]">
                          Revisado por gestoría
                        </span>
                      ) : income.reviewedBy && income.needsReview ? (
                        <span className="mt-1.5 inline-flex rounded-full border border-[#EBCFCB] bg-[#FFF0EE] px-2 py-0.5 text-[9px] font-extrabold text-[#93443B]">
                          Corrección solicitada
                        </span>
                      ) : income.needsReview ? (
                        <span className="mt-1.5 inline-flex rounded-full border border-[#E8D9C8] bg-[#FFF5E9] px-2 py-0.5 text-[9px] font-extrabold text-[#8A641E]">
                          Pendiente de revisión
                        </span>
                      ) : null}
                      {income.reviewNote && (
                        <p className="mt-1.5 max-w-md text-[10px] leading-relaxed text-stone-500">{income.reviewNote}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right"><p className="text-sm font-extrabold text-[#214E3A]">+{formatMoney(income.amount)}</p>{income.retention > 0 && <p className="mt-0.5 text-[10px] font-bold text-[#A45632]">Ret. −{formatMoney(income.retention)}</p>}</div>
                  </div>

                  {income.retention > 0 && (
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => void handleAnalyzeRetention(income.id, income.platform, income.amount, income.retention)} disabled={loadingExplanation[income.id]} className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#F1ECE3] px-2.5 py-1.5 text-[10px] font-extrabold text-stone-600 hover:bg-[#EAE3D9] disabled:opacity-60">
                        {loadingExplanation[income.id] ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Explicar retención
                      </button>
                    </div>
                  )}

                  {isManager && income.needsReview && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => void handleIncomeReview(income.id, 'needs_fix')}
                        disabled={reviewingIncome[income.id]}
                        className="rounded-[10px] border border-[#E4D8CF] px-2.5 py-1.5 text-[10px] font-extrabold text-[#9A5637] hover:bg-[#FFF6F0] disabled:opacity-50"
                      >
                        Pedir corrección
                      </button>
                      <button
                        onClick={() => void handleIncomeReview(income.id, 'reviewed')}
                        disabled={reviewingIncome[income.id]}
                        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#214E3A] px-2.5 py-1.5 text-[10px] font-extrabold text-white hover:bg-[#183D2D] disabled:opacity-50"
                      >
                        {reviewingIncome[income.id] && <Loader2 size={11} className="animate-spin" />}
                        Validar
                      </button>
                    </div>
                  )}
                </article>

                {explanations[income.id] && (
                  <div className="border-t border-[#E8E1D7] bg-[#F7F4EE] px-4 py-3">
                    <div className="flex items-start gap-2.5"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F0EA] text-[#214E3A]"><Info size={13} /></div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#789582]">Explicación IA</p><p className="mt-1 text-xs leading-relaxed text-stone-600">{explanations[income.id]}</p><p className="mt-1 text-[9px] text-stone-400">Explicación informativa; no confirma que la retención sea fiscalmente correcta.</p></div></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {isManualOpen && !isManager && (
        <Modal onClose={() => setIsManualOpen(false)} title="Añadir ingreso" kicker="Registro manual">
          <form onSubmit={handleManualSave} className="space-y-4">
            <Field label="Plataforma / pagador"><input value={platform} onChange={(e) => setPlatform(e.target.value)} className="field-input" placeholder="Ej. Uber Eats" /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Importe bruto"><input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="field-input" /></Field><Field label="Fecha"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field-input" /></Field></div>
            <Field label="Retención registrada"><input type="number" min="0" step="0.01" value={retention} onChange={(e) => setRetention(e.target.value)} className="field-input" /></Field>
            <p className="rounded-[13px] bg-[#FAF7F1] px-3 py-2.5 text-[10px] leading-relaxed text-stone-500">Introduce únicamente importes que aparezcan en tu liquidación, factura o justificante.</p>
            <button type="submit" className="w-full rounded-[13px] bg-[#214E3A] py-3 text-sm font-extrabold text-white">Guardar ingreso</button>
          </form>
        </Modal>
      )}

      {isPasteModalOpen && !isManager && (
        <Modal onClose={closeImportModal} title="Importar ingresos" kicker="Extracción con IA">
          {pendingImports.length === 0 ? (
            <>
              <p className="mb-3 text-xs leading-relaxed text-stone-500">
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
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#D7E2DA] bg-[#EDF4EF] px-3 py-3 text-xs font-extrabold text-[#214E3A] disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                PDF o captura de liquidación
              </button>
              <div className="mb-3 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-stone-300">
                <span className="h-px flex-1 bg-[#E8E1D7]" /> o pega texto <span className="h-px flex-1 bg-[#E8E1D7]" />
              </div>
              <textarea
                className="h-40 w-full resize-none rounded-[14px] border border-[#DDD5CA] bg-[#FAF7F1] p-3 text-sm outline-none focus:border-[#789582]"
                placeholder="Pega aquí el texto…"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <div className="mt-4 flex gap-2">
                <button onClick={closeImportModal} className="flex-1 rounded-[13px] border border-[#DDD5CA] bg-white py-2.5 text-xs font-extrabold text-stone-600">Cancelar</button>
                <button onClick={() => void handleAIExtraction()} disabled={isProcessing || !pastedText.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[#D66C47] py-2.5 text-xs font-extrabold text-white disabled:opacity-40">
                  {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Extraer
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 rounded-[13px] border border-[#E8D9C8] bg-[#FFF8EC] px-3 py-2.5 text-[10px] leading-relaxed text-[#805F2B]">
                Revisa cada fila. Origen: {pendingImportSource === 'document_import' ? 'documento/captura' : 'texto pegado'}. Nada se considera verificado automáticamente.
              </div>
              <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                {pendingImports.map((item, index) => (
                  <div key={`${item.platform}-${item.date}-${index}`} className="rounded-[14px] border border-[#E5DED4] bg-[#FAF8F4] p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="col-span-2">
                        <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.08em] text-stone-400">Plataforma</span>
                        <input
                          value={item.platform}
                          onChange={(event) => setPendingImports((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, platform: event.target.value } : row))}
                          className="field-input"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.08em] text-stone-400">Importe</span>
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
                        <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.08em] text-stone-400">Fecha</span>
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
                <button onClick={() => setPendingImports([])} className="flex-1 rounded-[13px] border border-[#DDD5CA] bg-white py-2.5 text-xs font-extrabold text-stone-600">Volver</button>
                <button onClick={confirmPendingImports} className="flex-1 rounded-[13px] bg-[#214E3A] py-2.5 text-xs font-extrabold text-white">Guardar {pendingImports.length}</button>
              </div>
            </>
          )}
        </Modal>
      )}

      <style>{`.field-input{width:100%;border:1px solid #DDD5CA;background:#fff;border-radius:13px;padding:.65rem .75rem;font-size:.875rem;outline:none}.field-input:focus{border-color:#789582;box-shadow:0 0 0 2px rgba(221,233,225,.7)}`}</style>
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

const SummaryMetric = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => <div className="bg-[#FFFDF9] p-3.5 sm:p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-stone-400">{label}</p><p className={`mt-1 text-base font-extrabold tracking-[-0.03em] ${accent ? 'text-[#B95635]' : 'text-[#214E3A]'}`}>{value}</p></div>;

const Modal = ({ onClose, title, kicker, children }: { onClose: () => void; title: string; kicker: string; children: React.ReactNode }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18211C]/55 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[26px] border border-[#E3DBD0] bg-[#FFFDF9] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="labora-kicker text-[#789582]">{kicker}</p><h3 className="mt-1 text-lg font-extrabold text-[#1E231F]">{title}</h3></div><button onClick={onClose} className="rounded-xl p-2 text-stone-400 hover:bg-[#F1ECE3]"><X size={18} /></button></div>{children}</div></div>;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block space-y-1.5"><span className="text-xs font-extrabold text-stone-600">{label}</span>{children}</label>;

export default IncomeTracker;
