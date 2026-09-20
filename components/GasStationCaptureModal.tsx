import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileImage,
  Fuel,
  Loader2,
  ShieldCheck,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { ExpenseCategory } from '../types';
import { GAS_STATION_PRESETS } from '../data/gasStations';
import { analyzeReceipt, ReceiptAnalysis } from '../services/geminiService';

interface GasStationCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const hashBuffer = async (buffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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
  const { selectedCountry } = useCountry();
  const contentRef = useRef<HTMLDivElement>(null);

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
  const canSave = Boolean(previewImage && receiptHash && merchant && date && Number.isFinite(amount) && amount > 0 && !isProcessing);

  const resetImage = () => {
    setPreviewImage(null);
    setReceiptHash(undefined);
    setReceiptMimeType(undefined);
    setOcr(null);
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !currentUser) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification('error', 'Usa una foto JPG, PNG o WebP.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'La foto supera el límite de 10 MB.');
      input.value = '';
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
      window.setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 60);

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
            ? `Ticket leído al ${pct}%. Revisa los campos marcados.`
            : `Ticket leído al ${pct}%. Confirma los datos antes de guardar.`
        );
      } catch (ocrError) {
        console.warn('OCR unavailable or failed:', ocrError);
        const code = ocrError instanceof Error ? ocrError.message : '';
        if (code === 'AI_NOT_CONFIGURED') {
          showNotification(
            'info',
            'IA no configurada. Rellena gasolinera, fecha e importe a mano; la foto se conserva.'
          );
        } else {
          showNotification('info', 'La foto quedó cargada. Completa los datos manualmente.');
        }
      }
    } catch (error) {
      console.error(error);
      resetImage();
      showNotification('error', 'No se pudo procesar la foto. Prueba de nuevo o elige la imagen desde la galería.');
    } finally {
      setIsProcessing(false);
      input.value = '';
    }
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    if (!previewImage || !receiptHash) {
      showNotification('error', 'Primero toma una foto o elige el ticket desde la galería.');
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

    showNotification('success', 'Repostaje guardado y enviado a revisión.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--labora-ink)]/65 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--labora-surface)] sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-[28px] sm:border sm:border-[var(--labora-border)] sm:shadow-2xl">
        <header className="relative shrink-0 overflow-hidden bg-[var(--labora-primary)] px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[var(--labora-primary-3)]/20" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--labora-surface)]/10 text-[var(--labora-gold-soft)]"><Fuel size={20} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55">Repostaje</p>
                <h2 className="truncate text-lg font-extrabold">Añadir ticket</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--labora-surface)]/10" aria-label="Cerrar"><X size={18} /></button>
          </div>
        </header>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <input id="labora-fuel-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => void handleImageCapture(event)} />
            <input id="labora-fuel-gallery" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void handleImageCapture(event)} />

            {!previewImage ? (
              <section className="rounded-[22px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--labora-surface)] text-[var(--labora-primary)] shadow-sm">
                  {isProcessing ? <Loader2 size={27} className="animate-spin" /> : <Camera size={27} />}
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-base font-extrabold text-[var(--labora-ink)]">Primero, añade el ticket</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--labora-muted)]">Haz una foto clara o usa una imagen que ya tengas. Después podrás revisar lo que detecte la IA.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <label htmlFor="labora-fuel-camera" className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-clay)] px-3 py-3 text-sm font-extrabold text-white ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
                    <Camera size={17} /> Tomar foto
                  </label>
                  <label htmlFor="labora-fuel-gallery" className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-3 text-sm font-extrabold text-[var(--labora-primary)] ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
                    <FileImage size={17} /> Galería
                  </label>
                </div>
                <p className="mt-3 text-center text-[10px] text-[var(--labora-muted)]">JPG, PNG o WebP · máximo 10 MB</p>
              </section>
            ) : (
              <section className="rounded-[20px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => window.open(previewImage, '_blank')} className="h-24 w-20 shrink-0 overflow-hidden rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)]">
                    <img src={previewImage} alt="Ticket cargado" className="h-full w-full object-cover" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[var(--labora-primary)]"><CheckCircle2 size={16} /><p className="text-sm font-extrabold">Ticket cargado</p></div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">Toca la miniatura para verlo grande. Puedes reemplazarlo antes de guardar.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label htmlFor="labora-fuel-camera" className="cursor-pointer rounded-lg bg-[var(--labora-surface)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--labora-clay)] shadow-sm">Nueva foto</label>
                      <label htmlFor="labora-fuel-gallery" className="cursor-pointer rounded-lg bg-[var(--labora-surface)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--labora-primary)] shadow-sm">Cambiar imagen</label>
                      <button type="button" onClick={resetImage} className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--labora-muted)]">Quitar</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {isProcessing && (
              <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-3 text-xs font-bold text-[var(--labora-muted)]">
                <Loader2 size={15} className="animate-spin text-[var(--labora-primary-3)]" /> Leyendo el ticket…
              </div>
            )}

            {ocr && (
              <section className={`mt-3 rounded-[14px] border p-3.5 ${ocr.needsReview ? 'border-[var(--labora-border)] bg-[color-mix(in_srgb,var(--labora-gold)_14%,var(--labora-surface))]' : 'border-[var(--labora-border)] bg-[var(--labora-moss-soft)]'}`}>
                <div className="flex items-center gap-2">
                  {ocr.needsReview ? <AlertTriangle size={16} className="text-[var(--labora-gold)]" /> : <CheckCircle2 size={16} className="text-[var(--labora-primary)]" />}
                  <p className="text-xs font-extrabold text-[var(--labora-ink)]">Lectura IA · confianza {confidencePct}%</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">{ocr.needsReview ? 'Comprueba los datos antes de guardar.' : 'La lectura parece clara; confirma los datos igualmente.'}</p>
                {ocr.uncertainFields.length > 0 && <p className="mt-1 text-[10px] text-[var(--labora-muted)]">Campos dudosos: {ocr.uncertainFields.join(', ')}</p>}
              </section>
            )}

            <section className="mt-5 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[var(--labora-muted)]">Gasolinera</label>
                <select value={selectedStation} onChange={(event) => { setSelectedStation(event.target.value); if (event.target.value !== 'Otro') setCustomStation(''); }} className="field-input">
                  <option value="">Selecciona una gasolinera</option>
                  {GAS_STATION_PRESETS.map((preset) => <option key={preset.name} value={preset.name}>{preset.name}</option>)}
                  <option value="Otro">Otra</option>
                </select>
                {selectedStation === 'Otro' && <input value={customStation} onChange={(event) => setCustomStation(event.target.value)} placeholder="Nombre que aparece en el ticket" className="field-input mt-2" />}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Importe total"><div className="relative"><input type="number" min="0" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} className="field-input pr-8" placeholder="0,00" /><span className="absolute right-3 top-3 text-sm text-[var(--labora-muted)]">{selectedCountry.currency_symbol || '€'}</span></div></Field>
                <Field label="Fecha"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-input" /></Field>
              </div>
            </section>

            <details className="mt-4 rounded-[16px] border border-[var(--labora-border)] bg-[var(--labora-surface)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-extrabold text-[var(--labora-ink-soft)]">
                Detalles opcionales <ChevronDown size={16} className="text-[var(--labora-muted)]" />
              </summary>
              <div className="grid gap-3 border-t border-[var(--labora-border)] p-4 sm:grid-cols-2">
                <Field label="Litros"><input type="number" min="0" step="0.01" value={fuelLitres} onChange={(event) => setFuelLitres(event.target.value)} placeholder="Solo si los confirmas" className="field-input" /></Field>
                <Field label="Combustible"><select value={fuelType} onChange={(event) => setFuelType(event.target.value)} className="field-input"><option value="">Sin especificar</option><option value="Gasolina 95">Gasolina 95</option><option value="Gasolina 98">Gasolina 98</option><option value="Diésel / Gasóleo A">Diésel / Gasóleo A</option><option value="GLP Autogas">GLP Autogas</option><option value="Electricidad / Carga">Electricidad / Carga</option></select></Field>
                <Field label="Matrícula"><input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="Opcional" className="field-input uppercase" /></Field>
                <Field label="Notas"><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" className="field-input" /></Field>
              </div>
            </details>

            <section className="mt-4 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-3.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--labora-primary)]"><ShieldCheck size={15} /> Pendiente de revisión</div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">Guardar el ticket no lo convierte automáticamente en gasto deducible. Entra con IVA y deducibilidad a 0 hasta revisión.</p>
            </section>
          </div>

          <footer className="shrink-0 border-t border-[var(--labora-border)] bg-[var(--labora-surface)]/95 px-4 py-3 backdrop-blur sm:px-6">
            <button type="submit" disabled={!canSave} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-[var(--labora-primary)] px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-[var(--labora-muted)]">
              {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} Guardar para revisión
            </button>
            {!previewImage && <p className="mt-1.5 text-center text-[10px] text-[var(--labora-muted)]">Primero añade una foto del ticket.</p>}
          </footer>
        </form>

        <style>{`.field-input{width:100%;min-height:46px;border:1px solid var(--labora-border);background:var(--labora-surface);color:var(--labora-ink);border-radius:13px;padding:.7rem .8rem;font-size:.9rem;outline:none}.field-input:focus{border-color:var(--labora-primary-3);box-shadow:0 0 0 3px color-mix(in srgb, var(--labora-primary) 18%, transparent)}summary::-webkit-details-marker{display:none}`}</style>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label><span className="mb-1.5 block text-xs font-extrabold text-[var(--labora-muted)]">{label}</span>{children}</label>
);
