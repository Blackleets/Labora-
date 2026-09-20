
import React, { useState, useEffect } from 'react';
import { CheckSquare, Wrench, Zap, Shield, RefreshCw } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useCountry } from '../../../contexts/CountryContext';

const formatRange = (sym: string, low: number, high: number) =>
  sym ? `${low}${sym} – ${high}${sym}` : `${low} – ${high}`;

export const RiderToolkit: React.FC = () => {
  const { showNotification } = useData();
  const { selectedCountry } = useCountry();
  const sym = selectedCountry.currency_symbol || selectedCountry.currency || '';

  const defaultChecklist = {
    'Powerbank cargada 100%': false,
    'Soporte móvil ajustado': false,
    'Kit pinchazos / Herramientas': false,
    'Chubasquero (Revisar clima)': false,
    'Documentación vehículo': false,
    'Luces funcionando': false,
    'Agua / Hidratación': false
  };

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('labora_toolkit_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist;
    } catch (e) {
      return defaultChecklist;
    }
  });

  useEffect(() => {
    localStorage.setItem('labora_toolkit_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleItem = (key: string) => {
    setChecklist((prev: any) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const resetChecklist = () => {
    setChecklist(Object.keys(checklist).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    showNotification('info', 'Checklist reiniciado para nueva ruta');
  };

  const repairRows = [
    { label: 'Pinchazo Rueda', low: 15, high: 25 },
    { label: 'Cambio Aceite', low: 40, high: 60 },
    { label: 'Pastillas Freno', low: 30, high: 50 },
    { label: 'Cadena Transmisión', low: 80, high: 120 }
  ];

  const tipAmount = sym ? `50${sym}/mes` : 'una cantidad fija al mes';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="flex items-center gap-2 text-3xl font-bold text-[var(--labora-ink)]">
        <Wrench className="text-[var(--labora-muted)]" /> Toolkit del Rider
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--labora-ink)]">
              <CheckSquare size={18} /> Checklist Salida
            </h3>
            <div className="rounded-lg bg-[var(--labora-moss-soft)] px-2 py-1 text-xs font-bold text-[var(--labora-primary)]">
              {Object.values(checklist).filter(Boolean).length}/{Object.keys(checklist).length}
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(checklist).map(([item, checked]) => (
              <label
                key={item}
                className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all ${
                  checked
                    ? 'border border-[var(--labora-border)] bg-[var(--labora-moss-soft)]'
                    : 'border border-transparent bg-[var(--labora-surface-2)] hover:bg-[var(--labora-parchment)]'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                    checked
                      ? 'border-[var(--labora-primary)] bg-[var(--labora-primary)]'
                      : 'border-[var(--labora-border)] bg-[var(--labora-surface)]'
                  }`}
                  onClick={() => toggleItem(item)}
                >
                  {checked && <Shield size={12} className="text-white" />}
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    checked ? 'text-[var(--labora-primary)] line-through' : 'text-[var(--labora-ink-soft)]'
                  }`}
                >
                  {item}
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked as boolean}
                  onChange={() => toggleItem(item)}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--labora-border)] pt-4 text-center">
            <button
              onClick={resetChecklist}
              className="mx-auto flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-xs font-bold text-[var(--labora-muted)] transition-colors hover:bg-[var(--labora-surface-2)] hover:text-[var(--labora-ink)]"
            >
              <RefreshCw size={12} /> Resetear Checklist
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--labora-ink)]">
            <Zap size={18} /> Costes Reparación (Est.)
          </h3>
          <div className="divide-y divide-[var(--labora-border)]">
            {repairRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg px-2 py-3 text-sm transition-colors hover:bg-[var(--labora-surface-2)]"
              >
                <span className="text-[var(--labora-muted)]">{row.label}</span>
                <span className="rounded-md bg-[var(--labora-surface-2)] px-2 py-1 font-bold text-[var(--labora-ink)]">
                  {formatRange(sym, row.low, row.high)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] p-4">
            <p className="text-xs leading-relaxed text-[var(--labora-ink-soft)]">
              <span className="font-bold">Tip:</span> Guarda {tipAmount} en una «hucha de averías» para que un pinchazo no arruine tu semana.
              Cantidades orientativas según país; no son precios oficiales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
