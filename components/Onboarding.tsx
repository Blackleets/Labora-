import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  FileUp,
  Globe2,
  Link2,
  Package,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getMarketProfile } from '../modules/country-config/marketProfiles';
import { useIntegrations } from '../modules/integrations/hooks/useIntegrations';
import LogoResolver from './LogoResolver';

const Onboarding: React.FC<{ onFinish: () => void | Promise<void> }> = ({ onFinish }) => {
  const { currentUser, updateUserConfig, showNotification } = useData();
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(currentUser?.platforms || []);
  const [customPlatform, setCustomPlatform] = useState('');
  const [saving, setSaving] = useState(false);

  const market = getMarketProfile(currentUser?.countryCode);
  const { integrations } = useIntegrations({ countryCode: market.countryCode, category: 'delivery', limit: 8 });

  const selectedLower = useMemo(() => selectedPlatforms.map((item) => item.toLowerCase()), [selectedPlatforms]);

  if (!currentUser) return null;

  const togglePlatform = (name: string) => {
    setSelectedPlatforms((previous) => previous.some((item) => item.toLowerCase() === name.toLowerCase())
      ? previous.filter((item) => item.toLowerCase() !== name.toLowerCase())
      : [...previous, name]);
  };

  const addCustomPlatform = () => {
    const name = customPlatform.trim();
    if (!name) return;
    if (!selectedLower.includes(name.toLowerCase())) setSelectedPlatforms((previous) => [...previous, name]);
    setCustomPlatform('');
  };

  const finish = async () => {
    setSaving(true);
    try {
      await updateUserConfig(selectedPlatforms, []);
      await onFinish();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo terminar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < 3) setStep((value) => value + 1);
    else void finish();
  };

  return (
    <main className="min-h-screen overflow-y-auto bg-[#F4EFE5] px-4 py-8 text-stone-800 sm:px-6">
      <div className="mx-auto w-full max-w-5xl py-6">
        <div className="mb-7 flex items-center justify-center gap-2">
          {[1, 2, 3].map((value) => <div key={value} className={`h-1.5 rounded-full transition-all ${value <= step ? 'w-12 bg-[#2E5A44]' : 'w-5 bg-[#D8D0C1]'}`} />)}
        </div>

        {step === 1 && (
          <section className="mx-auto max-w-3xl rounded-[2rem] border border-[#DDD4C7] bg-[#FCFAF7] p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[45%_55%_52%_48%/50%_45%_55%_50%] bg-[#DCE9DE] text-[#2E5A44]"><Globe2 className="h-7 w-7" /></div>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[.16em] text-[#6B8575]">{market.displayName} · {market.currency}</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#23362D] sm:text-4xl">Vamos a ordenar tu trabajo, no a inventarlo.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone-600">
              Labora+ empieza vacío. Tú decides qué plataformas usas y qué documentos aportas. No conectamos una app, banco o autoridad fiscal hasta que exista una integración real y verificable.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <TruthCard icon={<Wallet className="h-5 w-5" />} title="Cobros" text="Separa lo esperado de lo realmente recibido." />
              <TruthCard icon={<FileUp className="h-5 w-5" />} title="Evidencia" text="Tickets y documentos conservan su origen." />
              <TruthCard icon={<ShieldCheck className="h-5 w-5" />} title="Fiscalidad" text={market.fiscalEngineStatus === 'verified' ? 'Estimaciones guiadas, nunca presentaciones falsas.' : 'No se calcula hasta verificar las reglas de tu país.'} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-[2rem] border border-[#DDD4C7] bg-[#FCFAF7] p-6 shadow-sm sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2EB] text-[#2E5A44]"><Package className="h-6 w-6" /></div>
              <h2 className="mt-4 font-serif text-2xl font-bold text-stone-900">¿Con qué plataformas trabajas?</h2>
              <p className="mt-2 text-sm text-stone-500">Seleccionarlas organiza tu espacio. <strong>No significa que exista una conexión API.</strong></p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {integrations.map((integration) => {
                const selected = selectedLower.includes(integration.name.toLowerCase());
                return (
                  <button key={integration.id} onClick={() => togglePlatform(integration.name)} className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition ${selected ? 'border-[#7BA089] bg-[#EDF5EF] shadow-sm' : 'border-[#E4DDD2] bg-white hover:bg-[#FAF8F4]'}`}>
                    {selected && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2E5A44] text-white"><Check className="h-3 w-3" /></span>}
                    <LogoResolver id={integration.id} name={integration.name} domain={integration.domain} category={integration.category} size="md" />
                    <p className="mt-3 text-xs font-black text-stone-800">{integration.name}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-stone-500">Documentos / comprobantes</p>
                  </button>
                );
              })}
            </div>

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-dashed border-[#BFD0C3] bg-[#F2F6F1] p-4">
              <p className="text-xs font-bold text-[#2E5A44]">¿No aparece la tuya?</p>
              <div className="mt-2 flex gap-2">
                <input value={customPlatform} onChange={(event) => setCustomPlatform(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomPlatform(); } }} placeholder="Nombre de plataforma local" className="min-w-0 flex-1 rounded-xl border border-[#D4DED5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6A917A]" />
                <button onClick={addCustomPlatform} className="rounded-xl bg-[#2E5A44] px-4 text-xs font-bold text-white">Añadir</button>
              </div>
              {selectedPlatforms.length > 0 && <p className="mt-3 text-[11px] text-stone-500">Seleccionadas: {selectedPlatforms.join(' · ')}</p>}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mx-auto max-w-3xl rounded-[2rem] border border-[#DDD4C7] bg-[#FCFAF7] p-7 shadow-sm sm:p-10">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[46%_54%_60%_40%/44%_56%_48%_52%] bg-[#E8EEF2] text-[#3A7596]"><Link2 className="h-7 w-7" /></div>
              <h2 className="mt-5 font-serif text-3xl font-bold text-stone-900">Tu gestor es opcional y siempre requiere tu permiso.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600">Si tienes asesor, te dará un código temporal para vincularos. Podrás compartir documentos, peticiones y mensajes dentro de Labora+. Tener una cuenta de gestor no significa estar profesionalmente verificado.</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <TruthCard icon={<ShieldCheck className="h-5 w-5" />} title="Sin suplantación" text="Tu gestor nunca entra haciéndose pasar por ti." />
              <TruthCard icon={<Link2 className="h-5 w-5" />} title="Consentimiento" text="El vínculo existe solo después de que tú lo aceptes." />
              <TruthCard icon={<FileUp className="h-5 w-5" />} title="Todo junto" text="La petición y su documento quedan en el mismo expediente." />
            </div>
            <div className="mt-6 rounded-2xl border border-[#E4DDD2] bg-[#F8F5EF] p-4 text-center text-xs leading-relaxed text-stone-600">Podrás introducir el código del gestor más tarde desde <strong>Perfil y ajustes → Mi gestor</strong>.</div>
          </section>
        )}

        <div className="mt-7 flex flex-col items-center gap-3">
          <button onClick={next} disabled={saving} className="flex min-w-[230px] items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-6 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#244A37] disabled:opacity-50">
            {saving ? 'Guardando…' : step === 3 ? 'Entrar a Labora+' : 'Continuar'} <ArrowRight className="h-4 w-4" />
          </button>
          {step > 1 && <button onClick={() => setStep((value) => Math.max(1, value - 1))} className="text-xs font-bold text-stone-500 hover:text-stone-700">Volver</button>}
        </div>
      </div>
    </main>
  );
};

const TruthCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="rounded-2xl border border-[#E3DBCF] bg-white p-4 text-left">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4EF] text-[#2E5A44]">{icon}</div>
    <p className="mt-3 font-serif text-sm font-bold text-stone-900">{title}</p>
    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{text}</p>
  </div>
);

export default Onboarding;
