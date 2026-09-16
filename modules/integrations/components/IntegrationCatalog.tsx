import React, { useMemo, useState } from 'react';
import { Building2, Check, CreditCard, FileText, Filter, Globe, Package, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import LogoResolver from '../../../components/LogoResolver';
import { useCountry } from '../../../contexts/CountryContext';
import { useData } from '../../../contexts/DataContext';
import { IntegrationCategory, IntegrationDef } from '../../../types';
import { useIntegrations } from '../hooks/useIntegrations';

export const IntegrationCatalog: React.FC = () => {
  const { selectedCountry } = useCountry();
  const { currentUser, showNotification, updateUserConfig } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<IntegrationCategory | 'all'>('all');

  const { integrations } = useIntegrations({
    countryCode: selectedCountry.country_code,
    category: selectedCat
  });

  const categories: { id: IntegrationCategory | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'Todas', icon: Filter },
    { id: 'delivery', label: 'Delivery', icon: Package },
    { id: 'mobility', label: 'Movilidad', icon: SlidersHorizontal },
    { id: 'banking', label: 'Bancos', icon: Building2 },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'accounting', label: 'Contabilidad', icon: FileText }
  ];

  const filtered = useMemo(() => integrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [integrations, searchTerm]);

  const isAdded = (integration: IntegrationDef) => {
    if (!currentUser || !['delivery', 'mobility'].includes(integration.category)) return false;
    const platforms = (currentUser.platforms || []).map((item) => item.toLowerCase());
    return platforms.includes(integration.id.toLowerCase()) || platforms.includes(integration.name.toLowerCase());
  };

  const handleAddPlatform = (integration: IntegrationDef) => {
    if (!currentUser || !['delivery', 'mobility'].includes(integration.category)) return;
    const current = currentUser.platforms || [];
    if (isAdded(integration)) return;
    updateUserConfig([...current, integration.name], currentUser.banks || []);
    showNotification('success', `${integration.name} añadida a tu actividad.`);
  };

  const descriptionFor = (integration: IntegrationDef) => {
    if (integration.category === 'banking') {
      return 'La conexión de movimientos se habilitará únicamente mediante Open Banking regulado bajo PSD2.';
    }
    if (integration.category === 'delivery' || integration.category === 'mobility') {
      return 'Añádela a tu perfil para clasificar tu actividad e ingresos. La sincronización automática todavía no está habilitada.';
    }
    return 'Integración API prevista. Labora+ no marcará este servicio como conectado hasta que exista una autorización real.';
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Actividad</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">Plataformas y servicios</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-500">Selecciona las plataformas que utilizas. Solo mostramos como conectada una integración cuando existe una autorización real.</p>
      </header>

      <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar plataforma o servicio" className="w-full rounded-xl border border-[#E2DBD1] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#9BB3A4]" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400"><Globe size={13} /> {selectedCountry.display_name}</span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button key={category.id} onClick={() => setSelectedCat(category.id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedCat === category.id ? 'bg-[#2E5A44] text-white' : 'border border-[#E3DCD2] bg-white text-stone-500'}`}>
                <Icon size={14} /> {category.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((integration) => {
          const added = isAdded(integration);
          const selectable = integration.category === 'delivery' || integration.category === 'mobility';
          const banking = integration.category === 'banking';

          return (
            <article key={integration.id} className="flex min-h-[220px] flex-col rounded-2xl border border-[#E3DCD2] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <LogoResolver id={integration.id} name={integration.name} domain={integration.domain} category={integration.category} size="md" />
                {added ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-bold text-[#245338]"><Check size={11} /> En mi actividad</span>
                ) : banking ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F2ED] px-2.5 py-1 text-[10px] font-bold text-stone-500"><ShieldCheck size={11} /> Open Banking</span>
                ) : null}
              </div>

              <h2 className="mt-4 text-base font-bold text-stone-900">{integration.name}</h2>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">{integration.category}</p>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-stone-500">{descriptionFor(integration)}</p>

              <div className="mt-4 border-t border-[#EEE7DD] pt-3">
                {selectable ? (
                  <button disabled={added} onClick={() => handleAddPlatform(integration)} className={`w-full rounded-xl py-2.5 text-xs font-bold transition ${added ? 'cursor-default bg-[#F2F6F3] text-[#2E5A44]' : 'bg-[#2E5A44] text-white hover:bg-[#244936]'}`}>
                    {added ? 'Añadida' : 'Añadir a mi actividad'}
                  </button>
                ) : (
                  <button disabled className="w-full cursor-not-allowed rounded-xl border border-[#E6DFD5] bg-[#F8F5F0] py-2.5 text-xs font-bold text-stone-400">
                    {banking ? 'Conexión segura próximamente' : 'API próximamente'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DDD5CA] bg-white py-12 text-center text-sm text-stone-400">No hay resultados para esta búsqueda.</div>
      )}
    </div>
  );
};
