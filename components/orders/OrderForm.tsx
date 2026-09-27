import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, RotateCcw, X } from 'lucide-react';
import { FieldLabel, FormError, fieldErrorA11y, formControlFocusClass } from '../formA11y';
import {
  OrderInput,
  OrderLogEntry,
  OrderStatus,
  REJECT_REASON_LABELS,
  RejectReason,
  parseDecimalInput,
  toDateTimeLocalValue,
  validateOrderInput
} from '../../services/orderLog';

interface OrderFormProps {
  idPrefix: string;
  platforms: string[];
  lastPlatform?: string;
  initial?: OrderLogEntry;
  submitLabel: string;
  onSubmit: (input: OrderInput) => Promise<void>;
  onCancel?: () => void;
  currencySymbol: string;
}

const bigChip = `min-h-12 rounded-[14px] border px-3.5 text-sm font-extrabold transition ${formControlFocusClass}`;
const inputClass = `min-h-12 w-full rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3.5 text-base font-bold text-[var(--labora-ink)] outline-none focus:border-[var(--labora-primary-2)] ${formControlFocusClass}`;

const formatDecimal = (value?: number) => (value === undefined ? '' : String(value).replace('.', ','));

/** Formulario de pedido (nuevo o editar). Botones grandes, pocos toques. */
export const OrderForm: React.FC<OrderFormProps> = ({ idPrefix, platforms, lastPlatform, initial, submitLabel, onSubmit, onCancel, currencySymbol }) => {
  const initialPlatform = initial?.platform || lastPlatform || platforms[0] || '';
  const [platform, setPlatform] = useState(initialPlatform);
  const [customPlatform, setCustomPlatform] = useState(initialPlatform && !platforms.includes(initialPlatform) ? initialPlatform : '');
  const [useCustom, setUseCustom] = useState(Boolean(initialPlatform && !platforms.includes(initialPlatform)));
  const [status, setStatus] = useState<OrderStatus>(initial?.status || 'accepted');
  const [amount, setAmount] = useState(formatDecimal(initial?.amount));
  const [km, setKm] = useState(formatDecimal(initial?.km));
  const [reason, setReason] = useState<RejectReason | ''>(initial?.rejectReason || '');
  const [note, setNote] = useState(initial?.note || '');
  const [when, setWhen] = useState(initial ? toDateTimeLocalValue(new Date(initial.occurredAt)) : toDateTimeLocalValue(new Date()));
  const [timeEdited, setTimeEdited] = useState(Boolean(initial));
  const [showMore, setShowMore] = useState(Boolean(initial?.km || initial?.note));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Para pedidos nuevos, la hora sigue a «ahora» hasta que el rider la edite.
  useEffect(() => {
    if (timeEdited) return;
    const timer = window.setInterval(() => setWhen(toDateTimeLocalValue(new Date())), 30_000);
    return () => window.clearInterval(timer);
  }, [timeEdited]);

  const effectivePlatform = useCustom ? customPlatform.trim() : platform;
  const errorId = `${idPrefix}-error`;
  const chips = useMemo(() => platforms.slice(0, 8), [platforms]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseDecimalInput(amount);
    const parsedKm = parseDecimalInput(km);
    const input: OrderInput = {
      platform: effectivePlatform,
      occurredAt: new Date(when).toISOString(),
      status,
      amount: parsedAmount,
      km: parsedKm,
      rejectReason: status === 'rejected' && reason ? reason : undefined,
      note: note.trim() || undefined
    };
    if (!when || Number.isNaN(new Date(when).getTime())) {
      setError('La fecha y hora no son válidas.');
      return;
    }
    const validation = validateOrderInput(input);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(input);
      if (!initial) {
        setAmount('');
        setKm('');
        setNote('');
        setReason('');
        setTimeEdited(false);
        setWhen(toDateTimeLocalValue(new Date()));
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el pedido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-1.5 block text-[11px] font-extrabold text-[var(--labora-muted)]">Plataforma</legend>
        {lastPlatform && !initial && (
          <button
            type="button"
            onClick={() => { setUseCustom(!platforms.includes(lastPlatform)); setPlatform(lastPlatform); setCustomPlatform(platforms.includes(lastPlatform) ? '' : lastPlatform); }}
            className={`mb-2 inline-flex min-h-10 items-center gap-1.5 rounded-[12px] px-3 text-xs font-extrabold text-[var(--labora-primary)] hover:bg-[var(--labora-moss-soft)] ${formControlFocusClass}`}
          >
            <RotateCcw size={13} aria-hidden /> Repetir última: {lastPlatform}
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          {chips.map((name) => {
            const active = !useCustom && platform === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => { setPlatform(name); setUseCustom(false); }}
                className={`${bigChip} ${active ? 'border-[var(--labora-primary)] bg-[var(--labora-primary)] text-white' : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-ink-soft)]'}`}
              >
                {name}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={useCustom}
            onClick={() => setUseCustom(true)}
            className={`${bigChip} ${useCustom ? 'border-[var(--labora-primary)] bg-[var(--labora-primary)] text-white' : 'border-dashed border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'}`}
          >
            Otra…
          </button>
        </div>
        {useCustom && (
          <div className="mt-2">
            <FieldLabel htmlFor={`${idPrefix}-custom`}>Nombre de la plataforma</FieldLabel>
            <input id={`${idPrefix}-custom`} value={customPlatform} maxLength={60} onChange={(event) => setCustomPlatform(event.target.value)} className={inputClass} placeholder="Ej. Stuart" />
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 block text-[11px] font-extrabold text-[var(--labora-muted)]">Resultado</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={status === 'accepted'}
            onClick={() => { setStatus('accepted'); setReason(''); }}
            className={`${bigChip} inline-flex items-center justify-center gap-2 ${status === 'accepted' ? 'border-[var(--labora-primary)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'}`}
          >
            <Check size={16} aria-hidden /> Aceptado
          </button>
          <button
            type="button"
            aria-pressed={status === 'rejected'}
            onClick={() => setStatus('rejected')}
            className={`${bigChip} inline-flex items-center justify-center gap-2 ${status === 'rejected' ? 'border-[var(--labora-clay)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]' : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'}`}
          >
            <X size={16} aria-hidden /> Rechazado
          </button>
        </div>
      </fieldset>

      <div>
        <FieldLabel htmlFor={`${idPrefix}-amount`}>
          Importe ({currencySymbol}){status === 'rejected' ? ' · opcional' : ''}
        </FieldLabel>
        <input
          id={`${idPrefix}-amount`}
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => { setAmount(event.target.value); if (error) setError(''); }}
          placeholder={status === 'rejected' ? 'Lo que ofrecía (si lo sabes)' : 'Ej. 4,50'}
          className={`${inputClass} text-lg`}
          {...fieldErrorA11y(errorId, Boolean(error))}
        />
      </div>

      {status === 'rejected' && (
        <fieldset>
          <legend className="mb-1.5 block text-[11px] font-extrabold text-[var(--labora-muted)]">Motivo (opcional)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(REJECT_REASON_LABELS) as RejectReason[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={reason === key}
                onClick={() => setReason(reason === key ? '' : key)}
                className={`${bigChip} ${reason === key ? 'border-[var(--labora-clay)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]' : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-ink-soft)]'}`}
              >
                {REJECT_REASON_LABELS[key]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        onClick={() => setShowMore((value) => !value)}
        aria-expanded={showMore}
        className={`inline-flex min-h-10 items-center gap-1 text-xs font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}
      >
        <ChevronDown size={14} className={showMore ? 'rotate-180 transition' : 'transition'} aria-hidden /> Km, nota y hora
      </button>

      {showMore && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-km`}>Km (opcional)</FieldLabel>
            <input id={`${idPrefix}-km`} inputMode="decimal" autoComplete="off" value={km} onChange={(event) => setKm(event.target.value)} placeholder="Ej. 3,2" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor={`${idPrefix}-when`}>Fecha y hora</FieldLabel>
            <input
              id={`${idPrefix}-when`}
              type="datetime-local"
              value={when}
              max={toDateTimeLocalValue(new Date(Date.now() + 5 * 60_000))}
              onChange={(event) => { setWhen(event.target.value); setTimeEdited(true); }}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={`${idPrefix}-note`}>Nota (opcional)</FieldLabel>
            <input id={`${idPrefix}-note`} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Ej. espera larga en el restaurante" className={inputClass} />
          </div>
        </div>
      )}

      <FormError id={errorId}>{error}</FormError>

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className={`min-h-12 flex-1 rounded-[14px] border border-[var(--labora-border)] px-4 text-sm font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}>
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className={`inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] px-4 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-50 ${formControlFocusClass}`}
        >
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden />} {submitLabel}
        </button>
      </div>
    </form>
  );
};
