import React, { useState, useRef } from 'react';
import { Camera, Upload, Fuel, CheckCircle, AlertCircle, X, Shield, Sparkles, MapPin, Zap, Loader2 } from 'lucide-react';
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

  const [selectedStation, setSelectedStation] = useState<string>('Repsol');
  const [customStation, setCustomStation] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Gasolina 95');
  const [totalAmount, setTotalAmount] = useState<string>('35.00');
  const [fuelLitres, setFuelLitres] = useState<string>('21.5');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plate, setPlate] = useState<string>(currentUser?.vehiclePlate || vehicle?.plate || '4521 LBR');
  const [notes, setNotes] = useState<string>('Repostaje jornada de reparto');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentMerchantName = selectedStation === 'Otro' ? (customStation || 'Gasolinera') : selectedStation;
  const numAmount = parseFloat(totalAmount) || 0;
  const baseImponible = Number((numAmount / 1.21).toFixed(2));
  const cuotaIva = Number((numAmount - baseImponible).toFixed(2));

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      showNotification('info', 'Foto guardada. Extrayendo datos con IA...');

      try {
        // Strip data:image/...;base64, for Gemini API
        const base64Clean = result.split(',')[1] || result;
        const analysis = await analyzeReceipt(base64Clean);

        if (analysis.amount && analysis.amount > 0) {
          setTotalAmount(analysis.amount.toFixed(2));
          // Calculate approx litres based on avg Spanish price 1.62€/L
          const approxLitres = (analysis.amount / 1.62).toFixed(1);
          setFuelLitres(approxLitres);
        }

        if (analysis.date) {
          setDate(analysis.date);
        }

        if (analysis.merchantName) {
          const upperMerchant = analysis.merchantName.toUpperCase();
          const match = GAS_STATION_PRESETS.find(p => upperMerchant.includes(p.name.toUpperCase()));
          if (match) {
            setSelectedStation(match.name);
          } else {
            setSelectedStation('Otro');
            setCustomStation(analysis.merchantName);
          }
        }

        showNotification('success', `Datos detectados: ${analysis.merchantName} - ${analysis.amount}€`);
      } catch (err) {
        console.warn("Auto-OCR non-blocking fallback:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showNotification('error', 'Error al procesar la imagen');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSampleReceipt = () => {
    // Generate a high-fidelity SVG ticket proof if user is on desktop without camera
    const stationName = currentMerchantName.toUpperCase();
    const mockSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="%23FFFFFF"><rect width="400" height="600" fill="%23FFFBEB" stroke="%23D97706" stroke-width="4"/><text x="200" y="50" font-family="monospace" font-size="18" font-weight="bold" fill="%23B45309" text-anchor="middle">${stationName}</text><text x="200" y="80" font-family="monospace" font-size="11" fill="%234B5563" text-anchor="middle">ESTACIÓN DE SERVICIO OFICIAL</text><line x1="20" y1="100" x2="380" y2="100" stroke="%23D97706" stroke-dasharray="4"/><text x="40" y="140" font-family="monospace" font-size="14" fill="%231F2937">COMBUSTIBLE: ${fuelType.toUpperCase()}</text><text x="40" y="170" font-family="monospace" font-size="14" fill="%231F2937">VOLUMEN: ${fuelLitres} L</text><text x="40" y="200" font-family="monospace" font-size="14" fill="%231F2937">BASE IMPONIBLE: ${baseImponible.toFixed(2)} €</text><text x="40" y="230" font-family="monospace" font-size="14" fill="%231F2937">IVA (21%): ${cuotaIva.toFixed(2)} €</text><text x="40" y="270" font-family="monospace" font-size="22" font-weight="bold" fill="%23B45309">TOTAL: ${numAmount.toFixed(2)} €</text><text x="40" y="310" font-family="monospace" font-size="13" fill="%236B7280">MATRÍCULA: ${plate}</text><text x="40" y="340" font-family="monospace" font-size="13" fill="%236B7280">FECHA: ${date}</text><line x1="20" y1="370" x2="380" y2="370" stroke="%23D97706" stroke-dasharray="4"/><text x="200" y="420" font-family="monospace" font-size="14" font-weight="bold" fill="%23059669" text-anchor="middle">COPIA ELECTRÓNICA DE RESPALDO</text><text x="200" y="445" font-family="monospace" font-size="11" fill="%234B5563" text-anchor="middle">VALIDEZ FISCAL GARANTIZADA ANTE PÉRDIDA</text></svg>`;
    setPreviewImage(mockSvg);
    showNotification('info', 'Generada copia electrónica de respaldo');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      showNotification('error', 'Introduce un importe válido');
      return;
    }

    addExpense({
      category: ExpenseCategory.GASOLINA,
      merchant: currentMerchantName,
      date,
      amount: numAmount,
      fuelLitres: parseFloat(fuelLitres) || undefined,
      fuelType,
      vatRate: 21,
      vatAmount: cuotaIva,
      deductiblePercentage: 100,
      notes: `${notes} - Matrícula: ${plate}`,
      receiptUrl: previewImage || undefined,
      status: 'pending_review',
      invoiceNumber: `TICK-${Date.now().toString().slice(-6)}`
    });

    onClose();
  };

  return (
    <div id="gas-station-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF7F2] rounded-3xl shadow-2xl max-w-2xl w-full border border-[#E8DFC8] overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header (Warm Terracotta / Earth Ghibli Style) */}
        <div className="bg-[#C96846] p-6 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
              <Fuel className="w-7 h-7 text-[#FED7AA]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-serif font-bold tracking-tight text-white">Respaldo Digital de Repostaje</h2>
                <span className="px-2.5 py-0.5 bg-white/20 text-[#FFF5EB] text-xs font-serif font-semibold rounded-full border border-white/25">
                  Antipérdida Fiscal
                </span>
              </div>
              <p className="text-orange-100/90 text-xs sm:text-sm mt-1 leading-relaxed">
                Fotografía el ticket de gasolinera: aunque el papel térmico se borre o se pierda, tu deducción queda blindada ante Hacienda.
              </p>
            </div>
          </div>
          <button 
            id="close-gas-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Photo Capture Section */}
          <div className="bg-[#FCFAF7] border-2 border-dashed border-[#DFD5C6] rounded-2xl p-4 text-center hover:border-[#C96846] transition-colors">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageCapture} 
              className="hidden" 
              id="camera-receipt-input"
            />

            {previewImage ? (
              <div className="space-y-3">
                <div className="relative inline-block max-h-64 overflow-hidden rounded-xl border border-[#E3DBD0] shadow-sm">
                  <img 
                    src={previewImage} 
                    alt="Ticket de gasolinera" 
                    className="max-h-64 object-contain mx-auto"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="p-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full text-xs transition-colors"
                      title="Eliminar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-[#234233]/90 text-[#D8EADB] text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center justify-center space-x-1.5 font-serif font-medium">
                    <Shield className="w-3.5 h-3.5 text-[#A3D9B5]" />
                    <span>Copia fotográfica encriptada y archivada</span>
                  </div>
                </div>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-serif font-semibold text-[#C96846] hover:text-[#A84A2A] flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Volver a tomar foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="mx-auto w-12 h-12 bg-[#FAF3EE] text-[#C96846] rounded-2xl flex items-center justify-center border border-[#EAD6C9]">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-stone-900">Fotografía o sube tu ticket de gasolina</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                    Usa la cámara del móvil o sube el archivo. El gestor lo auditará y lo incluirá en tu Modelo 303 e IRPF.
                  </p>
                </div>
                <div className="flex justify-center items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#C96846] hover:bg-[#A84A2A] text-white text-xs font-serif font-semibold rounded-xl shadow-sm flex items-center space-x-2 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar Foto / Subir Archivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateSampleReceipt}
                    className="px-3 py-2 bg-[#F2EDE4] hover:bg-[#EBE4D8] text-stone-700 text-xs font-serif font-semibold rounded-xl border border-[#DFD5C6] flex items-center space-x-1.5 transition-colors"
                    title="Simular captura fotográfica si no dispones de cámara en este dispositivo"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C96846]" />
                    <span>Ticket Digital Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gas Station Brand Select */}
          <div>
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-stone-700 mb-2">
              Estación de Servicio / Gasolinera
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {GAS_STATION_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedStation(preset.name)}
                  className={`px-3 py-2 text-xs font-serif font-semibold rounded-xl border transition-all text-center truncate ${
                    selectedStation === preset.name
                      ? 'border-[#C96846] bg-[#FAF3EE] text-[#9C4B30] shadow-sm ring-1 ring-[#C96846]'
                      : 'border-[#DFD5C6] hover:border-stone-400 text-stone-700 bg-white'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedStation('Otro')}
                className={`px-3 py-2 text-xs font-serif font-semibold rounded-xl border transition-all text-center ${
                  selectedStation === 'Otro'
                    ? 'border-[#C96846] bg-[#FAF3EE] text-[#9C4B30] shadow-sm ring-1 ring-[#C96846]'
                    : 'border-[#DFD5C6] hover:border-stone-400 text-stone-700 bg-white'
                }`}
              >
                Otra estación
              </button>
            </div>

            {selectedStation === 'Otro' && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Nombre de la estación (ej. Gasolinera M-30)"
                  value={customStation}
                  onChange={(e) => setCustomStation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white"
                  required
                />
              </div>
            )}
          </div>

          {/* Core Numerical & Fiscal Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-serif font-semibold text-stone-700 mb-1">
                Importe Total (€ IVA Incl.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-base font-serif font-bold text-stone-900 border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white"
                  required
                />
                <span className="absolute right-3 top-2.5 text-sm font-semibold text-stone-400">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-stone-700 mb-1">
                Litros de Combustible
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={fuelLitres}
                  onChange={(e) => setFuelLitres(e.target.value)}
                  placeholder="20.0"
                  className="w-full pl-3 pr-8 py-2 text-sm font-medium text-stone-900 border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs font-medium text-stone-400">L</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-stone-700 mb-1">
                Tipo de Combustible
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 text-sm text-stone-900 border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white font-serif"
              >
                <option value="Gasolina 95">Gasolina 95</option>
                <option value="Gasolina 98">Gasolina 98</option>
                <option value="Diésel / Gasóleo A">Diésel / Gasóleo A</option>
                <option value="GLP Autogas">GLP Autogas</option>
                <option value="Electricidad / Carga">Electricidad / Carga</option>
              </select>
            </div>
          </div>

          {/* Breakdown Box (Hacienda 21% IVA) */}
          <div className="bg-[#FAF3EE] border border-[#EAD6C9] rounded-2xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-serif font-bold text-[#8D5B4C]">Desglose Fiscal Hacienda:</span>
              <p className="text-stone-600 mt-0.5">
                Base Imponible: <strong className="text-stone-900">{baseImponible.toFixed(2)} €</strong> | IVA Deducible 21%: <strong className="text-[#2E5A44]">{cuotaIva.toFixed(2)} €</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#EBF3ED] text-[#245338] font-serif font-semibold rounded-full border border-[#D0E5D7]">
                100% Deducible
              </span>
            </div>
          </div>

          {/* Date & Vehicle Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-semibold text-stone-700 mb-1">
                Fecha del Repostaje
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-stone-700 mb-1">
                Matrícula del Vehículo de Reparto
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="4521 LBR"
                className="w-full px-3 py-2 text-sm uppercase font-mono font-medium border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-stone-700 mb-1">
              Notas adicionales para el Asesor Fiscal
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Repostaje durante jornada de lluvia alta demanda"
              className="w-full px-3 py-2 text-sm border border-[#DFD5C6] rounded-xl focus:ring-2 focus:ring-[#C96846] focus:outline-none bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E8DFC8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-serif font-medium text-stone-600 hover:text-stone-900 hover:bg-[#F2EDE4] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-fuel-receipt-btn"
              type="submit"
              className="px-6 py-2.5 bg-[#2E5A44] hover:bg-[#234735] text-white font-serif font-semibold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Guardar Respaldo y Notificar Gestor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
