import React, { useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, Fuel, Loader2, ShieldCheck, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ExpenseCategory } from '../types';
import { GAS_STATION_PRESETS } from '../modules/delivery/data/platforms';
import { getMarketProfile } from '../modules/country-config/marketProfiles';
import { analyzeReceipt } from '../services/geminiService';

interface GasStationCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasStationCaptureModal: React.FC<GasStationCaptureModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, vehicle, currentUser, showNotification } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const market = getMarketProfile(currentUser?.countryCode);

  const [selectedStation, setSelectedStation] = useState<string>('Otro');
  const [customStation, setCustomStation] = useState('');
  const [fuelType, setFuelType] = useState('Combustible / energía');
  const [totalAmount, setTotalAmount] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [date, setDate] = useState('');
  const [plate, setPlate] = useState(currentUser?.vehiclePlate || vehicle?.plate || '');
  const [notes, setNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ocrNeedsReview, setOcrNeedsReview] = useState(false);

  if (!isOpen) return null;

  const merchant = selectedStation === 'Otro' ? customStation.trim() : selectedStation;
  const amount = Number(totalAmount) || 0;
  const parsedTaxRate = taxRate.trim() ? Number(taxRate) : undefined;
  const parsedTaxAmount = taxAmount.trim() ? Number(taxAmount) : undefined;
  const showSpanishPresets = market.countryCode === 'ES';

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Selecciona una imagen válida del ticket.');
      return;
    }

    const reader = new FileReader();
    setIsProcessing(true);
    setOcrNeedsReview(false);
    reader.onload = async (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setPreviewImage(dataUrl);
      try {
        const base64 = dataUrl.split(',')[1];
        if (!base64) throw new Error('No se pudo leer la imagen.');
        const result = await analyzeReceipt(base64);
        if (result.amount > 0) setTotalAmount(result.amount.toFixed(2));
        if (result.date) setDate(result.date);
        if (result.merchantName) {
          const station = showSpanishPresets
            ? GAS_STATION_PRESETS.find((item) => result.merchantName.toLowerCase().includes(item.name.toLowerCase()))
            : undefined;
          if (station) {
            setSelectedStation(station.name);
            setCustomStation('');
          } else {
            setSelectedStation('Otro');
            setCustomStation(result.merchantName);
          }
        }
        setOcrNeedsReview(Boolean(result.requiresManualReview) || (result.confidence ?? 1) < 0.85);
        showNotification('success', 'Ticket leído. Revisa todos los campos antes de guardarlo.');
      } catch (error) {
        console.warn('OCR unavailable or failed:', error);
        setOcrNeedsReview(true);
        showNotification('info', 'Foto preparada. Introduce los datos manualmente; no se ha inventado ningún valor.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showNotification('error', 'No se pudo leer la imagen seleccionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!previewImage) return showNotification('error', 'Adjunta una foto real del ticket antes de guardarlo.');
    if (!merchant) return showNotification('error', 'Indica el comercio que aparece en el ticket.');
    if (!date) return showNotification('error', 'Indica la fecha que aparece en el ticket.');
    if (amount <= 0) return showNotification('error', 'Introduce el importe real del ticket.');
    if (parsedTaxRate !== undefined && (!Number.isFinite(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100)) return showNotification('error', 'Revisa el porcentaje de impuesto.');
    if (parsedTaxAmount !== undefined && (!Number.isFinite(parsedTaxAmount) || parsedTaxAmount < 0 || parsedTaxAmount > amount)) return showNotification('error', 'Revisa el importe de impuesto.');

    setIsSaving(true);
    try {
      await addExpense({
        category: ExpenseCategory.GASOLINA,
        merchant,
        date,
        amount,
        fuelLitres: Number(fuelLitres) > 0 ? Number(fuelLitres) : undefined,
        fuelType,
        vatRate: parsedTaxRate,
        vatAmount: parsedTaxAmount,
        deductiblePercentage: 0,
        notes: [notes.trim(), plate.trim() ? `Matrícula / placa declarada: ${plate.trim().toUpperCase()}` : ''].filter(Boolean).join(' · '),
        receiptUrl: previewImage,
        status: 'pending_review',
      });
      showNotification('success', 'Ticket guardado con evidencia y pendiente de revisión.');
      onClose();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar el ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FAF7F2] shadow-2xl">
        <div className="flex items-start justify-between bg-[#C96846] p-6 text-white">
          <div className="flex items-start gap-3"><div className="rounded-2xl bg-white/15 p-3"><Fuel className="h-6 w-6" /></div><div><h2 className="font-serif text-xl font-bold">Guardar ticket real de combustible</h2><p className="mt-1 max-w-lg text-xs text-orange-50/90">Conservamos la imagen como evidencia. La IA puede transcribir campos, pero nunca convierte una estimación en un hecho verificado.</p></div></div>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 p-6">
          <div className="rounded-2xl border-2 border-dashed border-[#DFD5C6] bg-[#FCFAF7] p-4 text-center">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
            {previewImage ? (
              <div className="space-y-3"><img src={previewImage} alt="Ticket aportado por el usuario" className="mx-auto max-h-64 rounded-xl object-contain" /><div className="flex justify-center gap-2"><button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 text-xs font-semibold text-stone-700">Repetir foto</button><button type="button" onClick={() => setPreviewImage(null)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Eliminar</button></div></div>
            ) : <button type="button" onClick={() => fileInputRef.current?.click()} className="mx-auto flex items-center gap-2 rounded-xl bg-[#C96846] px-4 py-2.5 text-sm font-semibold text-white"><Camera className="h-4 w-4" /> Tomar foto / subir ticket</button>}
            {isProcessing && <p className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-600"><Loader2 className="h-4 w-4 animate-spin" /> Leyendo evidencia…</p>}
            {ocrNeedsReview && !isProcessing && <p className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-amber-700"><AlertCircle className="h-4 w-4" /> Verifica manualmente los campos antes de guardar.</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700">Comercio / estación</label>
            {showSpanishPresets && <div className="mb-3 flex flex-wrap gap-2">{GAS_STATION_PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => setSelectedStation(preset.name)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${selectedStation === preset.name ? 'border-[#C96846] bg-[#FAF3EE] text-[#9C4B30]' : 'border-[#DFD5C6] bg-white text-stone-700'}`}>{preset.name}</button>)}</div>}
            <button type="button" onClick={() => setSelectedStation('Otro')} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${selectedStation === 'Otro' ? 'border-[#C96846] bg-[#FAF3EE] text-[#9C4B30]' : 'border-[#DFD5C6] bg-white text-stone-700'}`}>Escribir comercio</button>
            {selectedStation === 'Otro' && <input value={customStation} onChange={(event) => setCustomStation(event.target.value)} placeholder="Nombre exacto del ticket" className="mt-3 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 text-sm" />}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-stone-700">Importe real ({market.currencySymbol})<input type="number" min="0" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 text-base font-bold" /></label>
            <label className="text-xs font-semibold text-stone-700">Cantidad / litros<input type="number" min="0" step="0.01" value={fuelLitres} onChange={(event) => setFuelLitres(event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label>
            <label className="text-xs font-semibold text-stone-700">Tipo<select value={fuelType} onChange={(event) => setFuelType(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2"><option>Combustible / energía</option><option>Gasolina</option><option>Diésel</option><option>GLP / gas</option><option>Electricidad / carga</option><option>Otro</option></select></label>
          </div>

          <div className="rounded-2xl border border-[#EAD6C9] bg-[#FAF3EE] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8D5B4C]"><ShieldCheck className="h-4 w-4" /> Impuestos: solo lo que figure en el documento</div>
            <p className="mt-1 text-xs leading-relaxed text-stone-600">Labora+ no aplica automáticamente el 21%, VAT, IVA ni otro impuesto según el país. Si el ticket muestra la cuota, puedes registrarla literalmente.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-stone-700">Tipo / tasa (%)<input type="number" min="0" max="100" step="0.001" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label><label className="text-xs font-semibold text-stone-700">Cuota indicada ({market.currencySymbol})<input type="number" min="0" step="0.01" value={taxAmount} onChange={(event) => setTaxAmount(event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-stone-700">Fecha del ticket<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label><label className="text-xs font-semibold text-stone-700">Matrícula / placa declarada<input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 uppercase" /></label></div>
          <label className="block text-xs font-semibold text-stone-700">Notas para revisión<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label>

          <div className="flex justify-end gap-3 border-t border-[#E8DFC8] pt-4"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600">Cancelar</button><button type="submit" disabled={isSaving || isProcessing} className="flex items-center gap-2 rounded-xl bg-[#2E5A44] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}{isSaving ? 'Guardando…' : 'Guardar para revisión'}</button></div>
        </form>
      </div>
    </div>
  );
};
