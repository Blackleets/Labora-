import React from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { useData } from '../../../contexts/DataContext';
import { Clock, CreditCard, Zap, Building2, Info, Banknote, LockKeyhole } from 'lucide-react';
import LogoResolver from '../../../components/LogoResolver';

/**
 * Informational payout / bank-landscape panel for the selected country.
 * This is NOT a live bank connection. Open Banking remains próximamente.
 */
export const BankingOverview: React.FC = () => {
  const config = useCountryConfig();
  const { currentUser } = useData();

  if (!config.banking_metadata) return null;

  const { banking_metadata: meta } = config;
  const userPlatforms = currentUser?.platforms || [];

  const getPlatformInfo = (pName: string) => {
    const key = Object.keys(meta.platform_payouts).find((k) => pName.toLowerCase().includes(k.toLowerCase()));
    return key ? meta.platform_payouts[key] : null;
  };

  return (
    <div className="labora-card space-y-6 animate-in fade-in slide-in-from-bottom-2 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#1E231F] flex items-center gap-2">
          <Building2 className="text-[#214E3A]" size={20} />
          Infraestructura bancaria: {config.display_name}
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#5A7A68] bg-[#E7F0EA] px-2.5 py-1 rounded-full border border-[#D7E5DC]">
          <LockKeyhole size={11} />
          Open Banking próximamente
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E8DFC8] bg-[#FFF9EE] px-3.5 py-3 text-[11px] leading-relaxed text-[#80612E] flex items-start gap-2">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Datos orientativos de plazos y bancos habituales en {config.display_name}.{' '}
          <strong>No hay cuenta bancaria conectada</strong> ni saldos reales. Labora+ no simula conexiones.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-[#FAF8F4] rounded-[14px] border border-[#E6E0D7]">
          <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-[0.08em] flex items-center gap-1">
            <Clock size={12} /> Depósito std.
          </p>
          <p className="font-bold text-[#1E231F] text-sm mt-1 leading-tight">{meta.deposit_time_standard}</p>
        </div>
        <div className="p-3 bg-[#FAF8F4] rounded-[14px] border border-[#E6E0D7]">
          <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-[0.08em] flex items-center gap-1">
            <Zap size={12} className="text-[#F1C56B]" /> Pago instant
          </p>
          <p className="font-bold text-[#1E231F] text-sm mt-1 leading-tight">{meta.deposit_time_instant || 'N/A'}</p>
        </div>
        <div className="p-3 bg-[#FAF8F4] rounded-[14px] border border-[#E6E0D7]">
          <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-[0.08em] flex items-center gap-1">
            <Banknote size={12} /> Fee promedio
          </p>
          <p className="font-bold text-[#1E231F] text-sm mt-1 leading-tight">
            {meta.avg_transfer_fee} {config.currency_symbol}
          </p>
        </div>
        <div className="p-3 bg-[#FAF8F4] rounded-[14px] border border-[#E6E0D7]">
          <p className="text-[10px] text-stone-400 uppercase font-extrabold tracking-[0.08em] mb-1">Bancos top</p>
          <div className="flex -space-x-2">
            {meta.compatible_banks.slice(0, 4).map((b, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center p-0.5"
                title={b.name}
              >
                <LogoResolver
                  id={b.name.toLowerCase().replace(/\s/g, '_')}
                  name={b.name}
                  domain={b.logo.replace('https://logo.clearbit.com/', '')}
                  category="banking"
                  size="sm"
                />
              </div>
            ))}
            {meta.compatible_banks.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-[#F1ECE3] flex items-center justify-center text-[10px] font-bold text-stone-500">
                +{meta.compatible_banks.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {userPlatforms.length > 0 ? (
        <div>
          <h4 className="text-sm font-bold text-[#1E231F] mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-[#214E3A]" />
            Plazos orientativos de tus plataformas
          </h4>
          <div className="space-y-3">
            {userPlatforms.map((p) => {
              const payoutOptions = getPlatformInfo(p);
              if (!payoutOptions) return null;

              return (
                <div
                  key={p}
                  className="border border-[#E6E0D7] rounded-[16px] p-4 hover:border-[#214E3A]/40 transition-colors bg-[#FFFDF9]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <LogoResolver
                      id={p.toLowerCase().replace(/\s/g, '_')}
                      name={p}
                      domain={`${p.toLowerCase().replace(/\s/g, '')}.com`}
                      category="delivery"
                      size="sm"
                      className="shadow-sm"
                    />
                    <span className="font-bold text-sm text-[#1E231F]">{p}</span>
                  </div>
                  <div className="space-y-2">
                    {payoutOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs sm:text-sm bg-[#FAF8F4] p-2 rounded-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          {opt.method.toLowerCase().includes('instant') || opt.method.toLowerCase().includes('flex') ? (
                            <Zap size={14} className="text-[#F1C56B] flex-shrink-0" />
                          ) : (
                            <CreditCard size={14} className="text-stone-400 flex-shrink-0" />
                          )}
                          <span className="font-medium text-stone-700">{opt.method}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="font-bold text-[#1E231F]">{opt.time}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                              opt.fee === '0.00€' || opt.fee === '$0.00'
                                ? 'bg-[#E7F0EA] text-[#214E3A]'
                                : 'bg-[#F1ECE3] text-stone-600'
                            }`}
                          >
                            {opt.fee === '0.00€' || opt.fee === '$0.00' ? 'GRATIS' : opt.fee}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#E7F0EA] rounded-[16px] text-[#214E3A] text-sm flex items-start gap-2 border border-[#D7E5DC]">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <p>Configura tus plataformas en el perfil para ver los tiempos de pago orientativos. Eso no conecta OAuth ni banca.</p>
        </div>
      )}

      <div>
        <h4 className="text-sm font-bold text-[#1E231F] mb-3">Bancos habituales en {config.display_name}</h4>
        <p className="text-[11px] text-stone-500 mb-3">Catálogo informativo — pulsar no inicia ninguna conexión.</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {meta.compatible_banks.map((bank, i) => (
            <div
              key={i}
              className="min-w-[140px] p-3 border border-[#E6E0D7] rounded-[16px] flex flex-col items-center gap-2 bg-[#FFFDF9]"
            >
              <LogoResolver
                id={bank.name.toLowerCase().replace(/\s/g, '_')}
                name={bank.name}
                domain={bank.logo.replace('https://logo.clearbit.com/', '')}
                category="banking"
                size="md"
              />
              <p className="text-xs font-bold text-[#1E231F] text-center">{bank.name}</p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  bank.type === 'neobank' ? 'bg-[#E7F0EA] text-[#214E3A]' : 'bg-[#F1ECE3] text-stone-500'
                }`}
              >
                {bank.type === 'neobank' ? 'Digital' : 'Tradicional'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
