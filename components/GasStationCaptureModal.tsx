import React, { useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Fuel, Loader2, ShieldCheck, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ExpenseCategory } from '../types';
import { GAS_STATION_PRESETS } from '../modules/delivery/data/platforms';
import { analyzeReceipt, ReceiptAnalysis } from '../services/geminiService';

interface GasStationCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const hashBuffer = async (buffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string'
    ? resolve(reader.result)
    : reject(new Error('No se pudo leer la imagen.'));
  reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));
  reader.readAsDataURL(file);
});

export const GasStationCaptureModal: React.FC<GasStationCaptureModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, expenses, vehicle, currentUser, showNotification } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedStation, setSelectedStation] = useState('');
  const [customStation, setCustomStation] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [date, setDate] = useState('');
  const [plate, setPlate] = useState(currentUser?.vehiclePlate || vehicle?.plate || '');
  const [notes, setNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [receiptHash, setReceiptHash] = useState<string | undefined>();
  const [receiptMimeType, setReceiptMimeType] = useState<string | undefined>();
  const [ocr, setOcr] = useState<ReceiptAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const merchant = selectedStation === 'Otro' ? customStation.trim() : selectedStation.trim();
  const amount = Number(totalAmount || 0);
  const confidencePct = ocr ? Math.round(ocr.confidence * 100) : null;

  const resetImage = () => {
    setPreviewImage(null);
    setReceiptHash(undefined);
    setReceiptMimeType(undefined);
    setOcr(null);
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', 'Usa una foto JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'La foto supera el límite de 10 MB.');
      event.target.value = '';
      return;
    }

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const hash = await hashBuffer(buffer);
      const duplicate = expenses.some(
        (expense) => expense.userId === currentUser.id && expense.receiptHash === hash
      );
      if (duplicate) {
        resetImage();
        showNotification('error', 'Este ticket exacto ya está registrado.');
        return;
      }

      const dataUrl = await readAsDataUrl(file);
      setPreviewImage(dataUrl);
      setReceiptHash(hash);
      setReceiptMimeType(file.type);
      setOcr(null);

      try {
        const base64 = dataUrl.split(',')[1] || '';
        const analysis = await analyzeReceipt(base64, file.type);
        setOcr(analysis);

        if (analysis.amount > 0) setTotalAmount(analysis.amount.toFixed(2));
        if (analysis.date) setDate(analysis.date);
        if (analysis.merchantName) {
          const upper = analysis.merchantName.toUpperCase();
          const known = GAS_STATION_PRESETS.find((preset) => upper.includes(preset.name.toUpperCase()));
          if (known) {
            setSelectedStation(known.name);
            setCustomStation('');
          } else {
            setSelectedStation('Otro');
            setCustomStation(analysis.merchantName);
          }
        }

        const pct = Math.round(analysis.confidence * 100);
        showNotification(
          analysis.needsReview ? 'info' : 'success',
          analysis.needsReview
            ? `OCR ${pct}%: revisa los campos antes de guardar.`
            : `OCR ${pct}%: confirma los datos antes de guardar.`
        );
      } catch (ocrError) {
        console.warn('OCR unavailable or failed:', ocrError);
        showNotification('info', 'Foto guardada. OCR no disponible: completa los datos manualmente.');
      }
    } catch (error) {
      console.error(error);
      resetImage();
      showNotification('error', 'No se pudo procesar la foto.');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    if (!previewImage || !receiptHash) {
      showNotification('error', 'Adjunta una foto real del ticket.');
      return;
    }
    if (!merchant) {
      showNotification('error', 'Indica la gasolinera que aparece en el ticket.');
      return;
    }
    if (!date) {
      showNotification('error', 'Indica la fecha del ticket.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotification('error', 'Introduce el importe total visible en el ticket.');
      return;
    }

    const duplicate = expenses.some(
      (expense) => expense.userId === currentUser.id && expense.receiptHash === receiptHash
    );
    if (duplicate) {
      showNotification('error', 'Este ticket exacto ya está registrado.');
      return;
    }

    addExpense({
      category: ExpenseCategory.GASOLINA,
      merchant,
      date,
      amount,
      fuelLitres: fuelLitres ? Number(fuelLitres) : undefined,
      fuelType: fuelType || undefined,
      vatRate: 0,
      vatAmount: 0,
      deductiblePercentage: 0,
      notes: [
        notes.trim(),
        plate.trim() ? `Matrícula: ${plate.trim().toUpperCase()}` : ''
      ].filter(Boolean).join(' · ') || undefined,
      receiptUrl: previewImage,
      receiptHash,
      receiptMimeType,
      ocrConfidence: ocr?.confidence,
      ocrNeedsReview: ocr ? ocr.needsReview : true,
      ocrUncertainFields: ocr?.uncertainFields,
      status: 'pending_review'
    });

    showNotification('success', 'Repostaje guardado pendiente de revisión de gestoría.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#18211C]/60 p-3 backdrop-blur-sm">
      <div className="my-6 w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#E3DBD0] bg-[#FFFDF9] shadow-2xl">
        <header className="relative overflow-hidden bg-[#214E3A] p-5 text-white sm:p-6">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#F1C56B]/15" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-white/12 bg-white/10 text-[#F1C56B]"><Fuel size={22} /></div>
              <div>
                <p className="labora-kicker text-white/55">Gasto con justificante</p>
                <h2 className="mt-1 text-lg font-extrabold">Registrar repostaje</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/70">
                  Fotografía el ticket real. La IA puede sugerir datos, pero no determina IVA ni deducibilidad.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/15" aria-label="Cerrar"><X size={18} /></button>
          </div>
        </header>

        <form onSubmit={handleSave} className="space-y-5 p-4 sm:p-6">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => void handleImageCapture(event)} />

          <section className="rounded-[18px] border-2 border-dashed border-[#DDD4C8] bg-[#FAF7F1] p-4 text-center">
            {previewImage ? (
              <div>
                <div className="relative mx-auto max-w-sm overflow-hidden rounded-[15px] border border-[#E3DBD0] bg-white">
                  <img src={previewImage} alt="Ticket real de repostaje" className="max-h-64 w-full object-contain" />
                  <button type="button" onClick={resetImage} className="absolute right-2 top-2 rounded-full bg-stone-900/75 p-1.5 text-white" aria-label="Eliminar foto"><X size={15} /></button>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 text-xs font-extrabold text-[#D66C47]">Cambiar foto</button>
              </div>
            ) : (
              <button type="button" disabled={isProcessing} onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center py-6 disabled:opacity-60">
                {isProcessing ? <Loader2 size={26} className="animate-spin text-[#D66C47]" /> : <Camera size={26} className="text-[#D66C47]" />}
                <span className="mt-2 text-sm font-extrabold text-[#1E231F]">Tomar foto o elegir ticket</span>
                <span className="mt-1 text-[11px] text-stone-400">JPG, PNG o WebP · máximo 10 MB · sin tickets demo</span>
              </button>
            )}
          </section>

          {ocr && (
            <section className={`rounded-[14px] border p-3.5 ${ocr.needsReview ? 'border-[#EACFA9] bg-[#FFF8EC]' : 'border-[#CFE7D7] bg-[#ECF7F0]'}`}>
              <div className="flex items-center gap-2">
                {ocr.needsReview ? <AlertTriangle size={16} className="text-[#9A672C]" /> : <CheckCircle2 size={16} className="text-[#24613F]" />}
                <p className="text-xs font-extrabold text-[#1E231F]">OCR · confianza {confidencePct}%</p>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                {ocr.needsReview ? 'Hay datos dudosos. Comprueba el ticket antes de guardar.' : 'La lectura es de alta confianza, pero debes confirmar los campos.'}
              </p>
              {ocr.uncertainFields.length > 0 && <p className="mt-1 text-[10px] text-stone-500">Revisar: {ocr.uncertainFields.join(', ')}</p>}
            </section>
          )}

          <section>
            <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-stone-500">Gasolinera</label>
            <div className="flex flex-wrap gap-2">
              {GAS_STATION_PRESETS.map((preset) => (
                <button key={preset.name} type="button" onClick={() => { setSelectedStation(preset.name); setCustomStation(''); }} className={`rounded-[12px] border px-3 py-2 text-xs font-bold transition ${selectedStation === preset.name ? 'border-[#D66C47] bg-[#F8EDE7] text-[#A84F34]' : 'border-[#DFD5C6] bg-white text-stone-600 hover:bg-[#FAF7F1]'}`}>{preset.name}</button>
              ))}
              <button type="button" onClick={() => setSelectedStation('Otro')} className={`rounded-[12px] border px-3 py-2 text-xs font-bold transition ${selectedStation === 'Otro' ? 'border-[#D66C47] bg-[#F8EDE7] text-[#A84F34]' : 'border-[#DFD5C6] bg-white text-stone-600 hover:bg-[#FAF7F1]'}`}>Otra</button>
            </div>
            {selectedStation === 'Otro' && <input value={customStation} onChange={(event) => setCustomStation(event.target.value)} placeholder="Nombre exacto que aparece en el ticket" className="mt-2 w-full rounded-[13px] border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#789582]" />}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Field label="Importe total"><div className="relative"><input type="number" min="0" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} className="field-input pr-8" /><span className="absolute right-3 top-2.5 text-sm text-stone-400">€</span></div></Field>
            <Field label="Fecha del ticket"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-input" /></Field>
            <Field label="Litros · solo si los confirmas"><input type="number" min="0" step="0.01" value={fuelLitres} onChange={(event) => setFuelLitres(event.target.value)} placeholder="Opcional" className="field-input" /></Field>
            <Field label="Combustible"><select value={fuelType} onChange={(event) => setFuelType(event.target.value)} className="field-input"><option value="">Sin especificar</option><option value="Gasolina 95">Gasolina 95</option><option value="Gasolina 98">Gasolina 98</option><option value="Diésel / Gasóleo A">Diésel / Gasóleo A</option><option value="GLP Autogas">GLP Autogas</option><option value="Electricidad / Carga">Electricidad / Carga</option></select></Field>
            <Field label="Matrícula"><input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="Opcional" className="field-input uppercase" /></Field>
            <Field label="Notas"><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" className="field-input" /></Field>
          </section>

          <section className="rounded-[14px] border border-[#D7E5DC] bg-[#F1F7F3] p-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#214E3A]"><ShieldCheck size={15} /> Revisión antes de computar</div>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              Al guardar: IVA 0% y deducibilidad 0%. La gestoría deberá revisar el justificante antes de que el gasto aporte al cálculo fiscal.
            </p>
          </section>

          <div className="flex justify-end gap-2 border-t border-[#E8E1D7] pt-4">
            <button type="button" onClick={onClose} className="rounded-[13px] border border-[#DDD4C8] bg-white px-4 py-2.5 text-xs font-extrabold text-stone-600">Cancelar</button>
            <button type="submit" disabled={isProcessing} className="inline-flex items-center gap-2 rounded-[13px] bg-[#214E3A] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#183D2D] disabled:opacity-50"><CheckCircle2 size={15} /> Guardar para revisión</button>
          </div>
        </form>

        <style>{`.field-input{width:100%;border:1px solid #DED7CC;background:#fff;border-radius:13px;padding:.65rem .75rem;font-size:.875rem;outline:none}.field-input:focus{border-color:#789582;box-shadow:0 0 0 2px rgba(221,233,225,.7)}`}</style>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label><span className="mb-1.5 block text-[11px] font-extrabold text-stone-500">{label}</span>{children}</label>
);
