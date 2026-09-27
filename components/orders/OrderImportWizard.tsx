import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import {
  type ColumnMapping,
  type DateFormat,
  type ImportCandidate,
  type KmUnit,
  type ParsedCsv,
  type ReconcileResult,
  type StatusChoice,
  MAX_IMPORT_BYTES,
  buildImportRows,
  detectDateFormat,
  distinctValues,
  importRef,
  parseCsv,
  reconcileImport,
  suggestMapping,
  suggestStatus
} from '../../services/orderImport';
import { listOrdersBetween, insertImportedOrders } from '../../services/orderLogRepository';
import { FieldLabel, formControlFocusClass } from '../formA11y';
import { Dialog } from './OrderDialog';

interface OrderImportWizardProps {
  platforms: string[];
  formatMoney: (value: number) => string;
  onClose: () => void;
  onImported: (count: number) => void;
}

type Step = 'file' | 'map' | 'review' | 'done';
const selectClass = `min-h-11 w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-sm font-bold text-[var(--labora-ink)] ${formControlFocusClass}`;
const FIELD_LABELS: Array<{ key: keyof ColumnMapping; label: string; required?: boolean; hint?: string }> = [
  { key: 'date', label: 'Fecha (y hora)', required: true },
  { key: 'time', label: 'Hora', hint: 'Solo si va en otra columna' },
  { key: 'amount', label: 'Importe', hint: 'Obligatorio para pedidos aceptados' },
  { key: 'km', label: 'Distancia' },
  { key: 'status', label: 'Estado', hint: 'Si no hay, todo cuenta como aceptado' },
  { key: 'platform', label: 'Plataforma', hint: 'Si no hay, eliges una abajo' }
];

export const OrderImportWizard: React.FC<OrderImportWizardProps> = ({ platforms, formatMoney, onClose, onImported }) => {
  const [step, setStep] = useState<Step>('file');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileError, setFileError] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ date: null, time: null, amount: null, km: null, status: null, platform: null });
  const [dateFormat, setDateFormat] = useState<DateFormat>('dmy');
  const [dateAmbiguous, setDateAmbiguous] = useState(false);
  const [kmUnit, setKmUnit] = useState<KmUnit>('km');
  const [fixedPlatform, setFixedPlatform] = useState(platforms[0] || '');
  const [statusMap, setStatusMap] = useState<Record<string, StatusChoice>>({});
  const [review, setReview] = useState<{ result: ReconcileResult; refs: Map<ImportCandidate, string> } | null>(null);
  const [includeMatches, setIncludeMatches] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyError, setBusyError] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  const build = useMemo(() => (parsed ? buildImportRows(parsed, mapping, { dateFormat, kmUnit, fixedPlatform, statusMap }) : null), [parsed, mapping, dateFormat, kmUnit, fixedPlatform, statusMap]);
  const statusValues = useMemo(() => (parsed && mapping.status !== null ? distinctValues(parsed.rows, mapping.status) : []), [parsed, mapping.status]);

  const onFile = async (file: File | undefined) => {
    setFileError('');
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { setFileError('El archivo supera 5 MB.'); return; }
    if (!/\.(csv|txt|tsv)$/i.test(file.name) && !/csv|text\/plain|tab-separated/.test(file.type)) {
      setFileError('Solo archivos CSV. Si tu exportación viene en PDF, JSON o Excel, ábrela y guárdala como CSV.');
      return;
    }
    const text = await file.text();
    const result = parseCsv(text);
    if (!result.header.length || !result.rows.length) { setFileError('No se encontraron filas con datos en el archivo.'); return; }
    const suggested = suggestMapping(result.header);
    setParsed(result);
    setFileName(file.name);
    setMapping(suggested);
    setKmUnit(suggested.km !== null && /mile|milla/i.test(result.header[suggested.km]) ? 'mi' : 'km');
    if (suggested.date !== null) {
      const detected = detectDateFormat(result.rows.slice(0, 200).map((row) => row[suggested.date as number] || ''));
      setDateFormat(detected.format);
      setDateAmbiguous(detected.ambiguous);
    }
    if (suggested.status !== null) {
      setStatusMap(Object.fromEntries(distinctValues(result.rows, suggested.status, 200).map(({ value }) => [value, suggestStatus(value)])));
    }
    setStep('map');
  };

  const setColumn = (key: keyof ColumnMapping, value: string) => {
    const column = value === '' ? null : Number(value);
    setMapping((previous) => ({ ...previous, [key]: column }));
    if (key === 'date' && column !== null && parsed) {
      const detected = detectDateFormat(parsed.rows.slice(0, 200).map((row) => row[column] || ''));
      setDateFormat(detected.format);
      setDateAmbiguous(detected.ambiguous);
    }
    if (key === 'km' && column !== null && parsed) setKmUnit(/mile|milla/i.test(parsed.header[column]) ? 'mi' : 'km');
    if (key === 'status' && column !== null && parsed) {
      setStatusMap(Object.fromEntries(distinctValues(parsed.rows, column, 200).map(({ value: statusValue }) => [statusValue, suggestStatus(statusValue)])));
    }
  };

  const goReview = async () => {
    if (!build || !build.candidates.length) return;
    setBusy(true);
    setBusyError('');
    try {
      const times = build.candidates.map((candidate) => new Date(candidate.occurredAt).getTime());
      const from = new Date(Math.min(...times) - 86_400_000).toISOString();
      const to = new Date(Math.max(...times) + 86_400_000).toISOString();
      const [existing, refs] = await Promise.all([listOrdersBetween(from, to), Promise.all(build.candidates.map(importRef))]);
      const result = reconcileImport(build.candidates, refs, existing);
      setReview({ result, refs: new Map(build.candidates.map((candidate, index) => [candidate, refs[index]])) });
      setIncludeMatches(false);
      setStep('review');
    } catch (error) {
      setBusyError(error instanceof Error ? error.message : 'No se pudo comparar con tu registro.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    if (!review) return;
    const rows = [...review.result.fresh, ...(includeMatches ? review.result.manualMatches.map((match) => match.candidate) : [])];
    if (!rows.length) return;
    setBusy(true);
    setBusyError('');
    try {
      const count = await insertImportedOrders(rows.map((candidate) => ({
        importRef: review.refs.get(candidate) as string,
        input: {
          platform: candidate.platform,
          occurredAt: candidate.occurredAt,
          status: candidate.status,
          amount: candidate.amount,
          km: candidate.km,
          note: `Importado de ${fileName}`.slice(0, 500)
        }
      })));
      setImportedCount(count);
      setStep('done');
      onImported(count);
    } catch (error) {
      setBusyError(error instanceof Error ? error.message : 'No se pudo importar.');
    } finally {
      setBusy(false);
    }
  };

  const preview = build?.candidates.slice(0, 5) || [];
  const columnOptions = parsed?.header.map((name, index) => ({ value: String(index), label: `${index + 1}. ${name || '(sin nombre)'} — ej.: ${(parsed.rows[0]?.[index] || '').slice(0, 24)}` })) || [];

  return (
    <Dialog title="Importar pedidos desde CSV" onClose={onClose}>
      {step === 'file' && (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-[var(--labora-ink-soft)]">
            Sube un CSV con <strong>tus propios datos</strong>. Por ejemplo, el de «Descargar tus datos» de Uber o el que te envíe Glovo si le pides tus datos (RGPD).
          </p>
          <p className="rounded-[12px] bg-[var(--labora-surface-2)] px-3 py-2 text-[11px] leading-relaxed text-[var(--labora-muted)]">
            Las plataformas no publican el formato de esos archivos, así que no lo adivinamos: en el siguiente paso eliges tú qué columna es la fecha, el importe, los km y el estado. El archivo se lee en tu dispositivo; solo se guardan los pedidos que confirmes.
          </p>
          <label htmlFor="labora-import-file" className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[16px] border-2 border-dashed border-[var(--labora-border)] p-4 text-center text-xs font-extrabold text-[var(--labora-primary)] ${formControlFocusClass}`}>
            <FileUp size={22} aria-hidden /> Elegir archivo CSV
            <span className="font-semibold text-[var(--labora-muted)]">Máximo 5 MB</span>
          </label>
          <input id="labora-import-file" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="sr-only" onChange={(event) => void onFile(event.target.files?.[0])} />
          {fileError && <p role="alert" className="text-[11px] font-bold text-[var(--labora-clay-deep)]">{fileError}</p>}
        </div>
      )}

      {step === 'map' && parsed && build && (
        <div className="space-y-3">
          <p className="text-[11px] text-[var(--labora-muted)]"><strong className="text-[var(--labora-ink)]">{fileName}</strong> · {parsed.rows.length} filas. Hemos propuesto columnas por su nombre: revísalas.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FIELD_LABELS.map((field) => (
              <div key={field.key}>
                <FieldLabel htmlFor={`labora-import-col-${field.key}`}>{field.label}{field.required ? ' *' : ''}</FieldLabel>
                <select id={`labora-import-col-${field.key}`} value={mapping[field.key] === null ? '' : String(mapping[field.key])} onChange={(event) => setColumn(field.key, event.target.value)} className={selectClass}>
                  <option value="">{field.required ? 'Elige una columna' : 'No hay / no usar'}</option>
                  {columnOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {field.hint && <p className="mt-0.5 text-[10px] text-[var(--labora-muted)]">{field.hint}</p>}
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="labora-import-datefmt">Formato de fecha</FieldLabel>
              <select id="labora-import-datefmt" value={dateFormat} onChange={(event) => { setDateFormat(event.target.value as DateFormat); setDateAmbiguous(false); }} className={selectClass}>
                <option value="dmy">Día/mes/año</option>
                <option value="mdy">Mes/día/año</option>
                <option value="iso">Año-mes-día</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="labora-import-unit">Distancia en</FieldLabel>
              <select id="labora-import-unit" value={kmUnit} onChange={(event) => setKmUnit(event.target.value as KmUnit)} className={selectClass}>
                <option value="km">Kilómetros</option>
                <option value="mi">Millas (se pasan a km)</option>
              </select>
            </div>
            {mapping.platform === null && (
              <div>
                <FieldLabel htmlFor="labora-import-platform">Plataforma de todas las filas</FieldLabel>
                <input id="labora-import-platform" list="labora-import-platforms" value={fixedPlatform} onChange={(event) => setFixedPlatform(event.target.value)} className={selectClass} />
                <datalist id="labora-import-platforms">{platforms.map((name) => <option key={name} value={name} />)}</datalist>
              </div>
            )}
          </div>
          {dateAmbiguous && <p role="status" className="rounded-[12px] bg-[var(--labora-soft-clay)] px-3 py-2 text-[11px] font-bold text-[var(--labora-clay-deep)]">Las fechas podrían ser día/mes o mes/día. Comprueba la vista previa y elige el formato correcto.</p>}

          {mapping.status !== null && statusValues.length > 0 && (
            <fieldset className="rounded-[14px] border border-[var(--labora-border)] p-3">
              <legend className="px-1 text-xs font-extrabold text-[var(--labora-ink)]">¿Qué significa cada estado?</legend>
              <p className="mb-2 text-[10px] text-[var(--labora-muted)]">Los cancelados o desconocidos se ignoran por defecto: no son un rechazo tuyo.</p>
              <ul className="space-y-1.5">
                {statusValues.map(({ value, count }) => (
                  <li key={value} className="flex items-center justify-between gap-2 text-xs">
                    <label htmlFor={`labora-import-status-${value}`} className="min-w-0 truncate"><strong>{value || '(vacío)'}</strong> <span className="text-[var(--labora-muted)]">· {count}</span></label>
                    <select id={`labora-import-status-${value}`} value={statusMap[value] || 'skip'} onChange={(event) => setStatusMap((previous) => ({ ...previous, [value]: event.target.value as StatusChoice }))} className={`${selectClass} max-w-[150px]`}>
                      <option value="accepted">Aceptado</option>
                      <option value="rejected">Rechazado</option>
                      <option value="skip">Ignorar</option>
                    </select>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <div>
            <p className="text-xs font-extrabold text-[var(--labora-ink)]">Vista previa</p>
            {preview.length ? (
              <div className="mt-1 overflow-x-auto">
                <table className="w-full min-w-[380px] text-left text-[11px]">
                  <caption className="sr-only">Primeras filas interpretadas</caption>
                  <thead className="text-[9px] uppercase tracking-[0.08em] text-[var(--labora-muted)]"><tr><th className="py-1">Línea</th><th>Fecha</th><th>Plataforma</th><th>Estado</th><th>Importe</th><th>Km</th></tr></thead>
                  <tbody className="divide-y divide-[var(--labora-border)]">
                    {preview.map((row) => (
                      <tr key={row.line}>
                        <td className="py-1">{row.line}</td>
                        <td>{new Date(row.occurredAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{row.platform}</td>
                        <td>{row.status === 'accepted' ? 'Aceptado' : 'Rechazado'}</td>
                        <td>{row.amount === undefined ? '—' : formatMoney(row.amount)}</td>
                        <td>{row.km === undefined ? '—' : row.km.toLocaleString('es-ES')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-1 text-[11px] text-[var(--labora-muted)]">Ninguna fila válida con esta configuración.</p>}
            <p className="mt-1 text-[11px] text-[var(--labora-muted)]">{build.candidates.length} válidas · {build.skipped} ignoradas por estado · {build.errors.length} con errores</p>
            {build.errors.length > 0 && (
              <details className="mt-1 text-[11px] text-[var(--labora-clay-deep)]">
                <summary className="cursor-pointer font-bold">Ver errores</summary>
                <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto">{build.errors.slice(0, 50).map((error) => <li key={`${error.line}-${error.message}`}>Línea {error.line}: {error.message}</li>)}</ul>
              </details>
            )}
          </div>
          {busyError && <p role="alert" className="text-[11px] font-bold text-[var(--labora-clay-deep)]">{busyError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('file')} className={`min-h-12 flex-1 rounded-[14px] border border-[var(--labora-border)] text-sm font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}>Otro archivo</button>
            <button type="button" onClick={() => void goReview()} disabled={busy || !build.candidates.length} className={`inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] text-sm font-extrabold text-white disabled:opacity-40 ${formControlFocusClass}`}>
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden />} Comparar con mi registro
            </button>
          </div>
        </div>
      )}

      {step === 'review' && review && (
        <div className="space-y-3">
          <ul className="space-y-1.5 text-xs">
            <li className="flex justify-between rounded-[12px] bg-[var(--labora-moss-soft)] px-3 py-2"><span>Nuevos para importar</span><strong>{review.result.fresh.length}</strong></li>
            <li className="flex justify-between rounded-[12px] bg-[var(--labora-surface-2)] px-3 py-2"><span>Ya importados antes (se omiten)</span><strong>{review.result.alreadyImported.length}</strong></li>
            <li className="flex justify-between rounded-[12px] bg-[var(--labora-surface-2)] px-3 py-2"><span>Coinciden con pedidos que apuntaste a mano</span><strong>{review.result.manualMatches.length}</strong></li>
          </ul>
          {review.result.manualMatches.length > 0 && (
            <div className="rounded-[14px] border border-[var(--labora-border)] p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--labora-ink)]"><AlertTriangle size={14} aria-hidden /> Posibles duplicados</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--labora-muted)]">Misma plataforma, estado e importe, con menos de 10 min de diferencia. Por defecto no se importan, para no contarlos dos veces.</p>
              <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-[11px]">
                {review.result.manualMatches.slice(0, 30).map((match) => (
                  <li key={match.candidate.line} className="rounded-[10px] bg-[var(--labora-surface-2)] px-2 py-1">
                    Línea {match.candidate.line}: {new Date(match.candidate.occurredAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {match.candidate.amount === undefined ? 'sin importe' : formatMoney(match.candidate.amount)} ↔ tu apunte de las {new Date(match.existing.occurredAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ({match.minutesApart} min)
                  </li>
                ))}
              </ul>
              <label className="mt-2 flex min-h-11 items-center gap-2 text-xs font-bold text-[var(--labora-ink)]">
                <input type="checkbox" checked={includeMatches} onChange={(event) => setIncludeMatches(event.target.checked)} className="h-5 w-5" /> Importarlos igualmente (son pedidos distintos)
              </label>
            </div>
          )}
          {busyError && <p role="alert" className="text-[11px] font-bold text-[var(--labora-clay-deep)]">{busyError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('map')} className={`min-h-12 flex-1 rounded-[14px] border border-[var(--labora-border)] text-sm font-extrabold text-[var(--labora-muted)] ${formControlFocusClass}`}>Atrás</button>
            <button type="button" onClick={() => void doImport()} disabled={busy || (review.result.fresh.length + (includeMatches ? review.result.manualMatches.length : 0)) === 0} className={`inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] text-sm font-extrabold text-white disabled:opacity-40 ${formControlFocusClass}`}>
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden />} Importar {review.result.fresh.length + (includeMatches ? review.result.manualMatches.length : 0)} pedidos
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3 text-center" role="status">
          <CheckCircle2 size={36} className="mx-auto text-[var(--labora-primary)]" aria-hidden />
          <p className="text-sm font-extrabold text-[var(--labora-ink)]">{importedCount} {importedCount === 1 ? 'pedido importado' : 'pedidos importados'}</p>
          <p className="text-[11px] text-[var(--labora-muted)]">Aparecen en Mes con la etiqueta «Importado» y cuentan en Análisis. Puedes editarlos o borrarlos como cualquier pedido.</p>
          <button type="button" onClick={onClose} className={`min-h-12 w-full rounded-[14px] bg-[var(--labora-primary)] text-sm font-extrabold text-white ${formControlFocusClass}`}>Cerrar</button>
        </div>
      )}
    </Dialog>
  );
};
