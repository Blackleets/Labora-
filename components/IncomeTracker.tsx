import React, { useMemo, useState } from 'react';
import {
  ClipboardPaste,
  Info,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { extractIncomeFromText, getRetentionExplanation } from '../services/geminiService';
import { UserRole } from '../types';

interface IncomeTrackerProps {
  startDate: string;
  endDate: string;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ startDate, endDate }) => {
  const {
    incomes,
    addIncome,
    currentUser,
    users,
    privacyMode,
    showNotification
  } = useData();

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [platform, setPlatform] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [retention, setRetention] = useState('0');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<Record<string, boolean>>({});

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
    : value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

  const handleAIExtraction = async () => {
    if (!pastedText.trim() || isManager) return;
    setIsProcessing(true);
    try {
      const extractedData = await extractIncomeFromText(pastedText);
      if (extractedData.length === 0) {
        showNotification('info', 'No se encontraron ingresos claros en el texto.');
        return;
      }

      extractedData.forEach((item) => {
        addIncome({
          platform: item.platform,
          amount: item.amount,
          date: item.date,
          retention: item.retention || 0,
          sourceType: 'text_import',
          sourceReference: 'Texto pegado por el usuario',
          needsReview: true
        });
      });
      showNotification('success', `${extractedData.length} ingresos añadidos para revisión.`);
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error: any) {
      console.error(error);
      showNotification('error', String(error?.message || 'No se pudo procesar el texto.'));
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
              {isManager ? 'Lectura de ingresos registrados por tus clientes vinculados.' : 'Registra importes explícitos de tus plataformas; la IA no crea filas si no puede extraerlas.'}
            </p>
          </div>

          {!isManager && (
            <div className="flex gap-2">
              <button onClick={() => setIsManualOpen(true)} className="inline-flex items-center gap-2 rounded-[13px] border border-[#DDD5CA] bg-white px-3.5 py-2.5 text-xs font-extrabold text-stone-600 hover:bg-[#F7F4EF]"><Plus size={15} /> Añadir</button>
              <button onClick={() => setIsPasteModalOpen(true)} className="inline-flex items-center gap-2 rounded-[13px] bg-[#214E3A] px-3.5 py-2.5 text-xs font-extrabold text-white hover:bg-[#183D2D]"><Sparkles size={15} /> Importar texto</button>
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
                      {income.needsReview && (
                        <span className="mt-1.5 inline-flex rounded-full border border-[#E8D9C8] bg-[#FFF5E9] px-2 py-0.5 text-[9px] font-extrabold text-[#8A641E]">
                          Pendiente de revisión
                        </span>
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
        <Modal onClose={() => setIsPasteModalOpen(false)} title="Importar desde texto" kicker="Extracción con IA">
          <p className="mb-4 text-xs leading-relaxed text-stone-500">Pega texto real de una liquidación, email o factura. Si la IA no puede determinar plataforma, fecha o importe, no creará esa fila.</p>
          <textarea className="h-40 w-full resize-none rounded-[14px] border border-[#DDD5CA] bg-[#FAF7F1] p-3 text-sm outline-none focus:border-[#789582]" placeholder="Pega aquí el texto…" value={pastedText} onChange={(e) => setPastedText(e.target.value)} />
          <div className="mt-4 flex gap-2"><button onClick={() => setIsPasteModalOpen(false)} className="flex-1 rounded-[13px] border border-[#DDD5CA] bg-white py-2.5 text-xs font-extrabold text-stone-600">Cancelar</button><button onClick={() => void handleAIExtraction()} disabled={isProcessing || !pastedText.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[#D66C47] py-2.5 text-xs font-extrabold text-white disabled:opacity-40">{isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Extraer</button></div>
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
