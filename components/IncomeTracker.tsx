import React, { useMemo, useState } from 'react';
import { ClipboardPaste, Info, Loader2, Sparkles, TrendingUp, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { extractIncomeFromText, getRetentionExplanation } from '../services/geminiService';
import { getMarketProfile } from '../modules/country-config/marketProfiles';

interface IncomeTrackerProps {
  startDate: string;
  endDate: string;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ startDate, endDate }) => {
  const { currentUser, incomes, addIncomes, showNotification, privacyMode } = useData();
  const market = getMarketProfile(currentUser?.countryCode);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<Record<string, boolean>>({});

  const filteredIncomes = useMemo(() => incomes.filter((income) => {
    if (startDate && income.date < startDate) return false;
    if (endDate && income.date > endDate) return false;
    return true;
  }), [incomes, startDate, endDate]);

  const money = (value: number) => privacyMode
    ? '••••'
    : new Intl.NumberFormat(market.locale, { style: 'currency', currency: market.currency }).format(value);

  const handleAIExtraction = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    try {
      const extractedData = await extractIncomeFromText(pastedText);
      if (extractedData.length === 0) {
        showNotification('info', 'No se encontraron ingresos suficientemente claros. No se guardó nada.');
        return;
      }
      await addIncomes(extractedData.map((item) => ({
        platform: item.platform,
        amount: item.amount,
        date: item.date,
        retention: item.retention || 0,
      })));
      showNotification('success', `${extractedData.length} ingreso(s) guardados como datos importados no verificados.`);
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo procesar el texto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeRetention = async (id: string, platform: string, amount: number, retention: number) => {
    if (market.countryCode !== 'ES' || loadingExplanation[id]) return;
    setLoadingExplanation((previous) => ({ ...previous, [id]: true }));
    try {
      const explanation = await getRetentionExplanation(platform, amount, retention);
      setExplanations((previous) => ({ ...previous, [id]: explanation }));
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo explicar el campo.');
    } finally {
      setLoadingExplanation((previous) => ({ ...previous, [id]: false }));
    }
  };

  const total = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-serif text-xl font-bold text-stone-900">Ingresos registrados</h2><p className="mt-1 text-xs text-stone-500">Registros aportados por ti o extraídos de texto. No equivalen a un cobro bancario conciliado.</p></div>
        <button onClick={() => setIsPasteModalOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#3A7596] px-4 py-2.5 text-xs font-bold text-white"><ClipboardPaste className="h-4 w-4" /> Importar texto</button>
      </div>

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF5F0] text-[#2E5A44]"><TrendingUp className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Total del filtro actual</p><p className="font-serif text-xl font-bold text-stone-900">{money(total)}</p></div></div><span className="rounded-full bg-[#F3EFE8] px-2.5 py-1 text-[10px] font-bold text-stone-500">{filteredIncomes.length} registro(s)</span></div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] shadow-sm">
        {filteredIncomes.length === 0 ? (
          <div className="p-10 text-center text-sm text-stone-500">No hay ingresos registrados en este periodo.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-[#E8DFC8] bg-[#F7F3EC] text-[11px] uppercase tracking-wide text-stone-500"><tr><th className="p-4">Plataforma</th><th className="p-4">Fecha</th><th className="p-4 text-right">Importe registrado</th><th className="p-4 text-right">Retención / descuento</th></tr></thead>
              <tbody className="divide-y divide-[#EEE8DE]">
                {filteredIncomes.map((income) => <React.Fragment key={income.id}><tr className="bg-white"><td className="p-4 font-semibold text-stone-900">{income.platform}</td><td className="p-4 text-stone-500">{income.date}</td><td className="p-4 text-right font-bold text-[#2E5A44]">{money(income.amount)}</td><td className="p-4 text-right"><div className="flex items-center justify-end gap-2"><span className={income.retention > 0 ? 'font-semibold text-rose-600' : 'text-stone-400'}>{money(income.retention || 0)}</span>{market.countryCode === 'ES' && income.retention > 0 && <button disabled={loadingExplanation[income.id]} onClick={() => void handleAnalyzeRetention(income.id, income.platform, income.amount, income.retention)} className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">{loadingExplanation[income.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Explicar'}</button>}</div></td></tr>{explanations[income.id] && <tr className="bg-indigo-50/40"><td colSpan={4} className="p-4"><div className="flex gap-2 rounded-xl border border-indigo-100 bg-white p-3 text-xs leading-relaxed text-stone-700"><Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /><span><strong>Explicación orientativa:</strong> {explanations[income.id]}</span></div></td></tr>}</React.Fragment>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#3A7596]" /><h3 className="font-serif text-lg font-bold text-stone-900">Extraer ingresos de texto</h3></div><p className="mt-2 text-xs leading-relaxed text-stone-500">Pega el texto real de un email, extracto o documento. La IA solo propone filas; si no identifica datos claros, no guarda nada.</p></div><button onClick={() => setIsPasteModalOpen(false)} className="rounded-xl p-2 text-stone-400 hover:bg-stone-100"><X className="h-4 w-4" /></button></div>
            <textarea value={pastedText} onChange={(event) => setPastedText(event.target.value)} className="mt-4 h-44 w-full resize-none rounded-2xl border border-[#DFD5C6] bg-white p-3 text-sm outline-none focus:border-[#6A917A]" placeholder="Pega aquí el contenido real…" />
            <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] leading-relaxed text-sky-800">La moneda se deriva del país de tu cuenta en el backend. La importación no confirma que el pago haya llegado a tu banco.</div>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setIsPasteModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600">Cancelar</button><button disabled={isProcessing || !pastedText.trim()} onClick={() => void handleAIExtraction()} className="flex items-center gap-2 rounded-xl bg-[#3A7596] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{isProcessing ? 'Procesando…' : 'Extraer y guardar'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeTracker;
