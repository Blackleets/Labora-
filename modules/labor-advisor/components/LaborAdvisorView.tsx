import React from 'react';
import { AlertTriangle, BadgeCheck, BookOpen, CheckCircle2, FileText, Info, Landmark, Shield } from 'lucide-react';
import { isAutomaticCountryCalculationEnabled } from '../../country-config/catalog';
import { countryFlagForCode } from '../../country-config/catalog';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';

export const LaborAdvisorView: React.FC = () => {
  const config = useCountryConfig();
  const verified = isAutomaticCountryCalculationEnabled(config.country_code);
  const advice = config.labor_advisor;

  if (!verified) {
    return (
      <div className="rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
          <Shield size={25} />
        </div>
        <p className="labora-kicker mt-4 text-[var(--labora-primary-2)]">Fail-closed fiscal</p>
        <h3 className="mt-2 text-xl font-extrabold text-[var(--labora-ink)]">
          Pack fiscal verificado pendiente para {config.display_name}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--labora-muted)]">
          Labora+ no mostrará altas, retenciones, obligaciones, tipos de contrato ni porcentajes automáticos hasta que esta jurisdicción tenga fuentes oficiales versionadas y pruebas de regresión.
        </p>
        <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-[var(--labora-border)] bg-[var(--labora-canvas)] px-3 py-2 text-xs font-bold text-[var(--labora-muted)]">
          <span className="text-lg" aria-hidden="true">{countryFlagForCode(config.country_code)}</span>
          {config.country_code} · {config.currency} · fiscalidad automática OFF
        </div>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="rounded-[24px] border border-gray-100 bg-white py-12 text-center">
        <Info size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-bold text-gray-900">Asesor no disponible</h3>
        <p className="mt-2 text-gray-500">No hay datos legales configurados para {config.display_name}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-50 opacity-50" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <BadgeCheck className="text-[#2D6CDF]" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#2D6CDF]">Pack fiscal verificado</p>
            </div>
            <h2 className="text-3xl font-bold text-[#1A1A1A]">Guía fiscal en {config.display_name}</h2>
            <p className="mt-1 max-w-lg text-gray-500">
              Información habilitada únicamente después de validar fuentes oficiales y vigencia para {advice.tax_entity_name}.
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg shadow-sm">
            {countryFlagForCode(config.country_code)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CheckCircle2 className="text-green-600" /> Requisitos de alta
            </h3>
            <div className="space-y-3">
              {advice.registration_steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="mt-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                    <span className="block h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Landmark className="text-[#7B3FE4]" /> Obligaciones fiscales
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {advice.tax_obligations.map((obl, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border-l-4 p-4 ${
                    obl.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    obl.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <h4 className={`text-sm font-bold ${
                    obl.severity === 'critical' ? 'text-red-800' :
                    obl.severity === 'warning' ? 'text-orange-800' : 'text-blue-800'
                  }`}>{obl.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{obl.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <FileText className="text-gray-600" /> Modalidades
            </h3>
            <div className="divide-y divide-gray-50">
              {advice.contract_types.map((contract, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <h4 className="font-bold text-gray-800">{contract.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{contract.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] bg-gradient-to-br from-[#1A1A1A] to-[#2c3e50] p-6 text-white shadow-lg">
            <div className="mb-2 flex items-center gap-2 opacity-80">
              <Shield size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Reserva orientativa</span>
            </div>
            <h3 className="mb-1 text-lg font-bold">Retención configurada</h3>
            <div className="my-3 text-4xl font-bold text-[#2ECC71]">
              {(advice.recommended_retention_pct * 100).toFixed(1)}%
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              Dato disponible porque el pack de {config.display_name} está marcado como verificado. Confirma siempre tu situación concreta con un profesional.
            </p>
          </div>

          <div className="rounded-[24px] border border-yellow-100 bg-yellow-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-yellow-600" size={24} />
              <div>
                <h4 className="text-sm font-bold text-yellow-800">Importante</h4>
                <p className="mt-1 text-xs leading-relaxed text-yellow-700">{advice.freelancer_threshold_note}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <BookOpen size={16} /> Fuente declarada
            </h3>
            <p className="text-xs leading-relaxed text-gray-500">
              Autoridad de referencia: <strong>{advice.tax_entity_name}</strong>. Los enlaces oficiales deben formar parte del pack versionado antes de habilitarlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
