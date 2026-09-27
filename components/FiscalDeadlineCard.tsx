import React from 'react';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { AEAT_CALENDAR_SOURCE_URL, formatDateEs, getNextAeatDeadline } from '../services/fiscalDeadlines';

interface FiscalDeadlineCardProps {
  /** Texto de contexto: autónomo («tu») o gestoría («tus clientes»). */
  audience?: 'rider' | 'manager';
  now?: Date;
}

const daysLabel = (days: number) => (days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`);

/**
 * Próximo plazo 130/303 desde la tabla oficial AEAT incluida en el código.
 * Sin notificaciones push; sin fechas inventadas (pendiente si no están publicadas).
 */
export const FiscalDeadlineCard: React.FC<FiscalDeadlineCardProps> = ({ audience = 'rider', now }) => {
  const { selectedCountry } = useCountry();
  const result = getNextAeatDeadline(now || new Date(), selectedCountry.country_code);

  if (!result.verified && result.reason === 'country_pending') {
    return (
      <section className="labora-card p-4 sm:p-5" aria-label="Plazos fiscales">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]"><CalendarClock size={18} aria-hidden /></div>
          <div>
            <p className="text-sm font-extrabold text-[var(--labora-ink)]">Plazos fiscales</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">Calendario oficial para {selectedCountry.name || selectedCountry.country_code} pendiente. No mostramos fechas sin fuente oficial.</p>
          </div>
        </div>
      </section>
    );
  }

  const urgent = result.verified && result.daysToFilingEnd <= 7;

  return (
    <section
      className={`rounded-[22px] border border-[var(--labora-border)] p-4 sm:p-5 ${urgent ? 'bg-[var(--labora-soft-clay)]' : 'labora-card'}`}
      aria-label="Próximo plazo AEAT"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${urgent ? 'bg-[var(--labora-surface)] text-[var(--labora-clay-deep)]' : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}>
          <CalendarClock size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="labora-kicker text-[var(--labora-muted)]">Próximo plazo AEAT · Modelos 130 y 303</p>
          {result.verified ? (
            <>
              <p className="mt-1 text-sm font-extrabold text-[var(--labora-ink)]">
                {result.deadline.quarter}: hasta el {formatDateEs(result.deadline.filingUntil)} ({daysLabel(result.daysToFilingEnd)})
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
                {result.phase === 'upcoming' && `Se abre el ${formatDateEs(result.deadline.opensOn)}. `}
                {result.phase !== 'direct_debit_closed'
                  ? `Con domiciliación bancaria: hasta el ${formatDateEs(result.deadline.directDebitUntil)} (${daysLabel(result.daysToDirectDebitEnd)}).`
                  : 'El plazo con domiciliación bancaria ya cerró; queda el pago por otros medios hasta el último día.'}
                {' '}
                {audience === 'manager'
                  ? 'Revisa los gastos pendientes de tus clientes antes de presentar.'
                  : 'Sube tus tickets e ingresos a tiempo para que tu gestoría pueda revisarlos.'}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-extrabold text-[var(--labora-ink)]">{result.quarter}: fecha exacta pendiente de publicación</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
                La AEAT aún no ha publicado el calendario con esta fecha. Consulta el calendario del contribuyente antes de presentar.
              </p>
            </>
          )}
          <a
            href={AEAT_CALENDAR_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--labora-primary)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"
          >
            Fuente: calendario AEAT 2026 <ExternalLink size={11} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
};
