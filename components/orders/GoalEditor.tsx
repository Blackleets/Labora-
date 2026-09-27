import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { goalProgress, parseDecimalInput } from '../../services/orderLog';
import { FieldLabel, formControlFocusClass } from '../formA11y';

interface GoalEditorProps {
  id: string;
  title: string;
  /** Unidad para la etiqueta del campo, p. ej. «€/día». */
  unitLabel: string;
  goal: number | null;
  earnings: number;
  formatMoney: (value: number) => string;
  onSave: (goal: number | null) => Promise<void>;
  /** Texto extra bajo la barra (p. ej. días que quedan). */
  hint?: string;
}

/** Objetivo propio (diario o semanal): barra de progreso + edición en línea. */
export const GoalEditor: React.FC<GoalEditorProps> = ({ id, title, unitLabel, goal, earnings, formatMoney, onSave, hint }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const progress = goalProgress(earnings, goal);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseDecimalInput(draft);
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000)) {
      setError('El objetivo debe ser un importe positivo (máx. 100.000).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(parsed ?? null);
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el objetivo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-ink)]"><Target size={14} aria-hidden /> {title}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-form`}
          onClick={() => { setDraft(goal ? String(goal).replace('.', ',') : ''); setError(''); setOpen((value) => !value); }}
          className={`min-h-10 rounded-[12px] px-3 text-xs font-extrabold text-[var(--labora-primary)] ${formControlFocusClass}`}
        >
          {goal ? 'Cambiar' : 'Fijar objetivo'}
        </button>
      </div>
      {progress ? (
        <div className="mt-1">
          <div className="h-3 overflow-hidden rounded-full bg-[var(--labora-surface-2)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label={`Progreso: ${title}`}>
            <div className="h-full rounded-full bg-[var(--labora-primary)]" style={{ width: `${progress.pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--labora-muted)]">
            {progress.reached ? '¡Objetivo cumplido!' : `${progress.pct}% · faltan ${formatMoney(progress.remaining)} de ${formatMoney(goal || 0)}`}
            {hint ? ` · ${hint}` : ''}
          </p>
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-[var(--labora-muted)]">Sin objetivo. Es tuyo y solo sirve para seguir tu progreso.</p>
      )}
      {open && (
        <form id={`${id}-form`} onSubmit={submit} className="mt-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FieldLabel htmlFor={id}>Objetivo ({unitLabel}) · vacío para quitar</FieldLabel>
              <input id={id} inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} aria-invalid={Boolean(error)} className={`min-h-11 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-sm font-bold text-[var(--labora-ink)] ${formControlFocusClass}`} />
            </div>
            <button type="submit" disabled={busy} className={`min-h-11 rounded-[13px] bg-[var(--labora-primary)] px-4 text-xs font-extrabold text-white disabled:opacity-50 ${formControlFocusClass}`}>Guardar</button>
          </div>
          {error && <p role="alert" className="mt-1 text-[11px] font-bold text-[var(--labora-clay-deep)]">{error}</p>}
        </form>
      )}
    </div>
  );
};
