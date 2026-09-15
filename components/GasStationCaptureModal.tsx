import React, { useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, Fuel, Loader2, ShieldCheck, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ExpenseCategory } from '../types';
import { GAS_STATION_PRESETS } from '../modules/delivery/data/platforms';
import { analyzeReceipt } from '../services/geminiService';

interface GasStationCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasStationCaptureModal: React.FC<GasStationCaptureModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, vehicle, currentUser, showNotification } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedStation, setSelectedStation] = useState<string>('Otro');
  const [customStation, setCustomStation] = useState('');
  const [fuelType, setFuelType] = useState('Gasolina 95');
  const [totalAmount, setTotalAmount] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [date, setDate] = useState('');
  const [plate, setPlate] = useState(currentUser?.vehiclePlate || vehicle?.plate || '');
  const [notes, setNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrNeedsReview, setOcrNeedsReview] = useState(false);

  if (!isOpen) return null;

  const merchant = selectedStation === 'Otro' ? customStation.trim() : selectedStation;
  const amount = Number(totalAmount) || 0;
  const baseImponible = amount > 0 ? Number((amount / 1.21).toFixed(2)) : 0;
  const vatEstimate = amount > 0 ? Number((amount - baseImponible).toFixed(2)) : 0;

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
          const station = GAS_STATION_PRESETS.find((item) =>
            result.merchantName.toLowerCase().includes(item.name.toLowerCase()),
          );
          if (station) {
            setSelectedStation(station.name);
            setCustomStation('');
          } else {
            setSelectedStation('Otro');
            setCustomStation(result.merchantName);
          }
        }

        setOcrNeedsReview(Boolean(result.requiresManualReview) || (result.confidence ?? 1) < 0.85);
        showNotification('success', 'Ticket leído. Revisa los datos antes de guardarlo.');
      } catch (error) {
        console.warn('OCR unavailable or failed:', error);
        setOcrNeedsReview(true);
        showNotification('info', 'Foto guardada. Introduce los datos manualmente; no se ha inventado ningún valor.');
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

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    if (!previewImage) {
      showNotification('error', 'Adjunta una foto real del ticket antes de guardarlo.');
      return;
    }
    if (!merchant) {
      showNotification('error', 'Indica la estación que aparece en el ticket.');
      return;
    }
    if (!date) {
      showNotification('error', 'Indica la fecha que aparece en el ticket.');
      return;
    }
    if (amount <= 0) {
      showNotification('error', 'Introduce el importe real del ticket.');
      return;
    }

    addExpense({
      category: ExpenseCategory.GASOLINA,
      merchant,
      date,
      amount,
      fuelLitres: Number(fuelLitres) > 0 ? Number(fuelLitres) : undefined,
      fuelType,
      vatRate: 21,
      vatAmount: vatEstimate,
      deductiblePercentage: 0,
      notes: [notes.trim(), plate.trim() ? `Matrícula declarada: ${plate.trim().toUpperCase()}` : '']
        .filter(Boolean)
        .join(' · '),
      receiptUrl: previewImage,
      status: 'pending_review',
    });

    showNotification('success', 'Ticket guardado como pendiente de revisión del gestor.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FAF7F2] shadow-2xl">
        <div className="flex items-start justify-between bg-[#C96846] p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/15 p-3"><Fuel className="h-6 w-6" /></div>
            <div>
              <h2 className="font-serif text-xl font-bold">Guardar ticket real de combustible</h2>
              <p className="mt-1 max-w-lg text-xs text-orange-50/90">
                Conservamos la foto como evidencia. La IA puede transcribir, pero nunca inventa datos y el gasto queda pendiente de revisión fiscal.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 p-6">
          <div className="rounded-2xl border-2 border-dashed border-[#DFD5C6] bg-[#FCFAF7] p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            {previewImage ? (
              <div className="space-y-3">
                <img src={previewImage} alt="Ticket aportado por el usuario" className="mx-auto max-h-64 rounded-xl object-contain" />
                <div className="flex justify-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 text-xs font-semibold text-stone-700">
                    Repetir foto
                  </button>
                  <button type="button" onClick={() => setPreviewImage(null)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mx-auto flex items-center gap-2 rounded-xl bg-[#C96846] px-4 py-2.5 text-sm font-semibold text-white">
                <Camera className="h-4 w-4" /> Tomar foto / subir ticket
              </button>
            )}

            {isProcessing && <p className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-600"><Loader2 className="h-4 w-4 animate-spin" /> Leyendo evidencia…</p>}
            {ocrNeedsReview && !isProcessing && (
              <p className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-amber-700"><AlertCircle className="h-4 w-4" /> Verifica manualmente los campos antes de guardar.</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700">Estación de servicio</label>
            <div className="flex flex-wrap gap-2">
              {GAS_STATION_PRESETS.map((preset) => (
                <button key={preset.name} type="button" onClick={() => setSelectedStation(preset.name)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${selectedStation === preset.name ? 'border-[#C96846] bg-[#FAF3EE] text-[#9C4B30]' : 'border-[#DFD5C6] bg-white text-stone-700'}`}>
                  {preset.name}
                </button>
              ))}
              <button type="button" onClick={() => setSelectedStation('Otro')} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${selectedStation === 'Otro' ? 'border-[#C96846] bg-[#FAF3EE] text-[#9C4B30]' : 'border-[#DFD5C6] bg-white text-stone-700'}`}>Otra</button>
            </div>
            {selectedStation === 'Otro' && <input value={customStation} onChange={(e) => setCustomStation(e.target.value)} placeholder="Nombre exacto del ticket" className="mt-3 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 text-sm" />}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-stone-700">Importe real (€)<input type="number" min="0" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0,00" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 text-base font-bold" /></label>
            <label className="text-xs font-semibold text-stone-700">Litros<input type="number" min="0" step="0.01" value={fuelLitres} onChange={(e) => setFuelLitres(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label>
            <label className="text-xs font-semibold text-stone-700">Combustible<select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2"><option>Gasolina 95</option><option>Gasolina 98</option><option>Diésel / Gasóleo A</option><option>GLP Autogas</option><option>Electricidad / Carga</option></select></label>
          </div>

          <div className="rounded-2xl border border-[#EAD6C9] bg-[#FAF3EE] p-4 text-xs text-stone-700">
            <div className="flex items-center gap-2 font-bold text-[#8D5B4C]"><ShieldCheck className="h-4 w-4" /> Estimación técnica, no declaración fiscal</div>
            <p className="mt-1">Con IVA 21% seleccionado: base estimada {baseImponible.toFixed(2)} € · cuota estimada {vatEstimate.toFixed(2)} €. La deducibilidad queda en 0% hasta que el gestor la valide.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-stone-700">Fecha del ticket<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label>
            <label className="text-xs font-semibold text-stone-700">Matrícula declarada<input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2 uppercase" /></label>
          </div>

          <label className="block text-xs font-semibold text-stone-700">Notas para el gestor<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2" /></label>

          <div className="flex justify-end gap-3 border-t border-[#E8DFC8] pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-[#2E5A44] px-5 py-2.5 text-sm font-semibold text-white"><CheckCircle className="h-4 w-4" /> Guardar para revisión</button>
          </div>
        </form>
      </div>
    </div>
  );
};
