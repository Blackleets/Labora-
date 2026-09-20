import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bike,
  Check,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet
} from 'lucide-react';
import CountrySelector from './CountrySelector';
import Logo from './Logo';
import LogoResolver from './LogoResolver';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import {
  completeRemoteOnboarding,
  updateRemoteProfile,
  updateRemoteUserConfig
} from '../services/authWorkspace';

const platforms = [
  { id: 'uber_eats', name: 'Uber Eats', domain: 'ubereats.com' },
  { id: 'glovo', name: 'Glovo', domain: 'glovoapp.com' },
  { id: 'just_eat', name: 'Just Eat', domain: 'just-eat.com' },
  { id: 'stuart', name: 'Stuart', domain: 'stuart.com' },
  { id: 'bolt_food', name: 'Bolt Food', domain: 'bolt.eu' },
  { id: 'catcher', name: 'Catcher', domain: 'catcher.eu' }
];

const banks = [
  { id: 'bbva_es', name: 'BBVA', domain: 'bbva.es' },
  { id: 'santander_es', name: 'Santander', domain: 'santander.com' },
  { id: 'caixabank', name: 'CaixaBank', domain: 'caixabank.es' },
  { id: 'revolut', name: 'Revolut', domain: 'revolut.com' },
  { id: 'wise', name: 'Wise', domain: 'wise.com' },
  { id: 'n26', name: 'N26', domain: 'n26.com' },
  { id: 'sabadell', name: 'Sabadell', domain: 'bancsabadell.com' },
  { id: 'qonto', name: 'Qonto', domain: 'qonto.com' },
  { id: 'bunq', name: 'Bunq', domain: 'bunq.com' }
];

const Onboarding: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const {
    currentUser,
    updateUserConfig,
    updateUserFiscalProfile,
    showNotification
  } = useData();
  const { selectedCountry } = useCountry();

  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(currentUser?.platforms || []);
  const [selectedBanks, setSelectedBanks] = useState<string[]>(currentUser?.banks || []);
  const [saving, setSaving] = useState(false);

  const totalSteps = 4;
  const selectedServices = selectedPlatforms.length + selectedBanks.length;

  const toggle = (value: string, current: string[], setCurrent: React.Dispatch<React.SetStateAction<string[]>>) => {
    setCurrent(current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };

  const finishSetup = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      await Promise.all([
        updateRemoteUserConfig(selectedPlatforms, selectedBanks),
        updateRemoteProfile(currentUser.id, { countryCode: selectedCountry.country_code })
      ]);
      await completeRemoteOnboarding();

      updateUserConfig(selectedPlatforms, selectedBanks);
      updateUserFiscalProfile({ countryCode: selectedCountry.country_code });
      showNotification('success', 'Tu espacio de Labora+ está preparado.');
      onFinish();
    } catch (error) {
      console.error('[LABORA_ONBOARDING_SAVE_FAILED]', error);
      showNotification('error', 'No se pudo guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((previous) => previous + 1);
      return;
    }
    void finishSetup();
  };

  const progress = useMemo(
    () => Array.from({ length: totalSteps }, (_, index) => index + 1),
    []
  );

  return (
    <div className="min-h-screen bg-[var(--labora-canvas)] px-4 py-5 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl items-center justify-center">
        <div className="w-full">
          <div className="mb-5 flex items-center justify-between">
            <Logo size="md" showText animated />
            <span className="rounded-full border border-[var(--labora-border)] bg-[var(--labora-surface)]/75 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--labora-muted)]">
              Configuración inicial
            </span>
          </div>

          <section className="labora-card overflow-hidden">
            <div className="border-b border-[var(--labora-border)] px-5 py-4 sm:px-7">
              <div className="flex gap-2">
                {progress.map((item) => (
                  <span
                    key={item}
                    className={`h-1.5 flex-1 rounded-full transition ${item <= step ? 'bg-[var(--labora-primary)]' : 'bg-[var(--labora-border)]'}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {step === 1 && (
                <div className="mx-auto max-w-2xl py-4 text-center sm:py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
                    <Sparkles size={28} />
                  </div>
                  <p className="labora-kicker mt-5 text-[var(--labora-primary-2)]">Bienvenido a Labora+</p>
                  <h1 className="labora-display mt-2 text-3xl font-semibold text-[var(--labora-ink)] sm:text-[2.4rem]">
                    Primero ordenamos tu actividad. Luego automatizamos lo que sea real.
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--labora-muted)]">
                    Labora+ te ayuda a registrar jornada, ingresos, gastos y documentos. No conectaremos ninguna
                    plataforma o banco sin una integración oficial y tu consentimiento.
                  </p>

                  <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
                    <TruthCard icon={Bike} title="Jornada real" text="Horas y kilómetros registrados por ti." />
                    <TruthCard icon={ShieldCheck} title="Datos privados" text="Supabase Auth, RLS y Storage privado." />
                    <TruthCard icon={Wallet} title="Dinero sin ficción" text="Importes con fuente y estado de revisión." />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mx-auto max-w-2xl py-2">
                  <div className="mb-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
                      <Globe size={21} />
                    </div>
                    <p className="labora-kicker mt-4 text-[var(--labora-primary-2)]">Contexto fiscal</p>
                    <h2 className="labora-display mt-1 text-2xl font-semibold text-[var(--labora-ink)]">¿Dónde desarrollas tu actividad?</h2>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--labora-muted)]">
                      Esto adapta moneda y contexto. No genera por sí solo una obligación fiscal ni una declaración.
                    </p>
                  </div>
                  <CountrySelector variant="cards" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="labora-kicker text-[var(--labora-primary-2)]">Tus herramientas</p>
                    <h2 className="labora-display mt-1 text-2xl font-semibold text-[var(--labora-ink)]">¿Qué servicios usas?</h2>
                    <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-[var(--labora-muted)]">
                      Seleccionarlos solo guarda una preferencia. <strong>No significa que estén conectados.</strong>
                      Puedes importar liquidaciones manualmente mientras no exista una API oficial integrada.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ServiceSection
                      title="Plataformas de reparto"
                      helper="Nos ayuda a ordenar tus ingresos y liquidaciones."
                      items={platforms}
                      selected={selectedPlatforms}
                      onToggle={(id) => toggle(id, selectedPlatforms, setSelectedPlatforms)}
                      category="delivery"
                    />
                    <ServiceSection
                      title="Bancos que utilizas"
                      helper="Solo preferencia. Labora+ no solicita ni almacena tus credenciales bancarias."
                      items={banks}
                      selected={selectedBanks}
                      onToggle={(id) => toggle(id, selectedBanks, setSelectedBanks)}
                      category="banking"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="mx-auto max-w-2xl py-4 text-center sm:py-7">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
                    <Check size={28} strokeWidth={2.5} />
                  </div>
                  <p className="labora-kicker mt-5 text-[var(--labora-primary-2)]">Listo para empezar</p>
                  <h2 className="labora-display mt-1 text-3xl font-semibold text-[var(--labora-ink)]">
                    Tu espacio queda preparado sin conexiones ficticias.
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--labora-muted)]">
                    Has indicado {selectedServices} {selectedServices === 1 ? 'servicio' : 'servicios'} que utilizas.
                    Podrás registrar jornada, importar liquidaciones y guardar justificantes desde el primer día.
                  </p>

                  <div className="mt-6 space-y-2 text-left">
                    <ReadyRow text="Jornada Labora lista para registrar horas y odómetro." />
                    <ReadyRow text="Ingresos manuales, por texto y por PDF/captura con revisión antes de guardar." />
                    <ReadyRow text="Gastos y documentos privados preparados para revisión de gestoría." />
                    <ReadyRow text="Cálculos fiscales no verificados permanecen marcados como «Por revisar»." />
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-2 border-t border-[var(--labora-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep((previous) => Math.max(1, previous - 1))}
                  disabled={step === 1 || saving}
                  className="min-h-11 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-4 text-xs font-extrabold text-[var(--labora-muted)] disabled:invisible"
                >
                  Atrás
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] bg-[var(--labora-primary)] px-6 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Guardando…</>
                  ) : step === totalSteps ? (
                    <>Entrar en Labora+ <ArrowRight size={16} /></>
                  ) : (
                    <>Continuar <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </section>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-[var(--labora-muted)]">
            Las preferencias pueden cambiarse después. Seleccionar un servicio nunca equivale a autorizar una conexión externa.
          </p>
        </div>
      </div>
    </div>
  );
};

const TruthCard = ({
  icon: Icon,
  title,
  text
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  text: string;
}) => (
  <div className="rounded-[16px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4">
    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
      <Icon size={17} />
    </div>
    <p className="mt-3 text-xs font-extrabold text-[var(--labora-ink)]">{title}</p>
    <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">{text}</p>
  </div>
);

const ReadyRow = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-3.5 py-3">
    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]">
      <Check size={12} strokeWidth={3} />
    </div>
    <p className="text-xs leading-relaxed text-[var(--labora-muted)]">{text}</p>
  </div>
);

const ServiceSection = ({
  title,
  helper,
  items,
  selected,
  onToggle,
  category
}: {
  title: string;
  helper: string;
  items: Array<{ id: string; name: string; domain: string }>;
  selected: string[];
  onToggle: (id: string) => void;
  category: 'delivery' | 'banking';
}) => (
  <section className="rounded-[20px] border border-[var(--labora-border)] bg-[var(--labora-parchment)] p-4">
    <h3 className="text-sm font-extrabold text-[var(--labora-ink)]">{title}</h3>
    <p className="mt-1 text-[10px] leading-relaxed text-[var(--labora-muted)]">{helper}</p>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {items.map((service) => {
        const active = selected.includes(service.id);
        return (
          <button
            type="button"
            key={service.id}
            onClick={() => onToggle(service.id)}
            className={`relative min-h-[92px] rounded-[15px] border p-2.5 text-center transition ${active
              ? 'border-[var(--labora-primary-2)] bg-[var(--labora-moss-soft)]'
              : 'border-[var(--labora-border)] bg-[var(--labora-surface)] hover:bg-[var(--labora-surface-2)]'}`}
          >
            {active && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--labora-primary)] text-white">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
            <LogoResolver
              id={service.id}
              name={service.name}
              domain={service.domain}
              category={category}
              size="sm"
              className="mx-auto"
            />
            <p className={`mt-2 text-[10px] font-extrabold leading-tight ${active ? 'text-[var(--labora-primary)]' : 'text-[var(--labora-muted)]'}`}>
              {service.name}
            </p>
          </button>
        );
      })}
    </div>
  </section>
);

export default Onboarding;
