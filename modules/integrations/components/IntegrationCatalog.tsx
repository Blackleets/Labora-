import React, { useMemo, useState } from 'react';
import { Check, Globe2, Package, Car, Plus, Search, ShieldCheck, Upload, WifiOff } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useIntegrations } from '../hooks/useIntegrations';
import { LaboraIntegration } from '../data/catalog';
import { MARKET_PROFILES, getMarketProfile } from '../../country-config/marketProfiles';
import LogoResolver from '../../../components/LogoResolver';

export const IntegrationCatalog: React.FC = () => {
  const { currentUser, showNotification, updateUserConfig } = useData();
  const [countryCode, setCountryCode] = useState(currentUser?.countryCode || 'ES');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'all' | 'delivery' | 'mobility'>('all');
  const [customPlatform, setCustomPlatform] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const market = getMarketProfile(countryCode);
  const { integrations } = useIntegrations({ countryCode, category });

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return integrations;
    return integrations.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query),
    );
  }, [integrations, searchTerm]);

  if (!currentUser) return null;

  const normalizedPlatforms = currentUser.platforms.map((platform) => platform.toLowerCase());
  const isAdded = (integration: LaboraIntegration) =>
    normalizedPlatforms.includes(integration.name.toLowerCase()) ||
    normalizedPlatforms.includes(integration.id.toLowerCase());

  const addPlatform = async (integration: LaboraIntegration) => {
    if (isAdded(integration)) return;
    setSavingId(integration.id);
    try {
      await updateUserConfig([...currentUser.platforms, integration.name], currentUser.banks || []);
      showNotification('success', `${integration.name} añadida. Los datos seguirán necesitando evidencia real.`);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar la plataforma.');
    } finally {
      setSavingId(null);
    }
  };

  const addCustomPlatform = async () => {
    const name = customPlatform.trim();
    if (!name) return;
    if (normalizedPlatforms.includes(name.toLowerCase())) {
      showNotification('info', 'Esa plataforma ya está en tu espacio.');
      return;
    }
    try {
      await updateUserConfig([...currentUser.platforms, name], currentUser.banks || []);
      setCustomPlatform('');
      showNotification('success', `${name} añadida como plataforma personalizada.`);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar la plataforma.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <section className="overflow-hidden rounded-[2rem] border border-[#DCD3C5] bg-[#FCFAF7] shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#CFE0D3] bg-[#EDF5EF] px-3 py-1.5 text-xs font-bold text-[#2E5A44]">
              <Globe2 className="h-4 w-4" /> Plataformas de trabajo
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Tus apps, sin fingir conexiones</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              Añade las plataformas con las que trabajas. Hasta que exista una API verificada, Labora+ importa únicamente comprobantes, extractos, capturas o documentos aportados por ti.
            </p>
          </div>

          <div className="min-w-[220px]">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-500">Explorar mercado</label>
            <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-full rounded-xl border border-[#DCD3C5] bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 outline-none focus:border-[#6A917A]">
              {MARKET_PROFILES.map((profile) => <option key={profile.countryCode} value={profile.countryCode}>{profile.displayName}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#E8E0D4] bg-[#F7F3EC] p-4 sm:grid-cols-3 md:px-8">
          <Info label="Modo en este país" value={market.productMode === 'fiscal_guided' ? 'Fiscalidad guiada + control financiero' : 'Control financiero + gestor'} />
          <Info label="Fiscalidad local" value={market.fiscalEngineStatus === 'verified' ? 'Motor habilitado' : 'No activada hasta verificar reglas'} />
          <Info label="Datos" value="Solo evidencia real o registro manual explícito" />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[#E0D8CC] bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            <FilterButton active={category === 'all'} onClick={() => setCategory('all')} label="Todas" icon={<Globe2 className="h-4 w-4" />} />
            <FilterButton active={category === 'delivery'} onClick={() => setCategory('delivery')} label="Delivery" icon={<Package className="h-4 w-4" />} />
            <FilterButton active={category === 'mobility'} onClick={() => setCategory('mobility')} label="Movilidad" icon={<Car className="h-4 w-4" />} />
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar Uber, Glovo, Rappi…" className="w-full rounded-xl border border-stone-200 bg-[#FBFAF8] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#6A917A]" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((integration) => {
          const added = isAdded(integration);
          return (
            <article key={integration.id} className="flex min-h-[270px] flex-col justify-between rounded-[1.75rem] border border-[#E2D9CD] bg-[#FCFAF7] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <LogoResolver id={integration.id} name={integration.name} domain={integration.domain} category={integration.category} size="lg" />
                  {added ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><Check className="h-3 w-3" /> En mi espacio</span>
                  ) : (
                    <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold text-stone-500">{integration.category === 'delivery' ? 'Delivery' : 'Movilidad'}</span>
                  )}
                </div>

                <h2 className="mt-4 font-serif text-xl font-bold text-stone-900">{integration.name}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{integration.description}</p>

                <div className="mt-4 space-y-2 rounded-2xl border border-[#E8E0D4] bg-white/70 p-3 text-[11px] text-stone-600">
                  <div className="flex items-center gap-2"><Upload className="h-3.5 w-3.5 text-[#2E5A44]" /><span><strong>Entrada:</strong> comprobantes y documentos reales</span></div>
                  <div className="flex items-center gap-2"><WifiOff className="h-3.5 w-3.5 text-amber-600" /><span><strong>API:</strong> no se presenta como conectada</span></div>
                  <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2E5A44]" /><span>{integration.availabilityNote}</span></div>
                </div>
              </div>

              <button disabled={added || savingId === integration.id} onClick={() => void addPlatform(integration)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#244A37] disabled:cursor-default disabled:bg-[#DCE8DF] disabled:text-[#557262]">
                {added ? <><Check className="h-4 w-4" /> Añadida</> : <><Plus className="h-4 w-4" /> {savingId === integration.id ? 'Guardando…' : 'Añadir a mi espacio'}</>}
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-[1.75rem] border border-dashed border-[#BFCDBF] bg-[#F3F7F2] p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#233E30]">¿Tu plataforma no aparece?</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#5B7163]">Añádela por nombre. Así Labora+ puede funcionar en cualquier país sin fingir que conocemos todas las apps locales.</p>
            <input value={customPlatform} onChange={(event) => setCustomPlatform(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addCustomPlatform(); }} placeholder="Ej. plataforma local de reparto" className="mt-3 w-full rounded-xl border border-[#C9D7CB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6A917A]" />
          </div>
          <button onClick={() => void addCustomPlatform()} className="flex items-center justify-center gap-2 rounded-xl bg-[#233E30] px-5 py-3 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Añadir plataforma</button>
        </div>
      </section>
    </div>
  );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${active ? 'bg-[#233E30] text-white' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}>{icon}{label}</button>
);

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-[#E4DDD2] bg-white/70 px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
    <p className="mt-0.5 text-xs font-semibold text-stone-700">{value}</p>
  </div>
);
