import React, { useMemo, useState } from 'react';
import { Building2, Check, CreditCard, FileText, Filter, Globe, Package, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import LogoResolver from '../../../components/LogoResolver';
import { useCountry } from '../../../contexts/CountryContext';
import { useData } from '../../../contexts/DataContext';
import { IntegrationCategory, IntegrationDef } from '../../../types';
import { useIntegrations } from '../hooks/useIntegrations';
import { updateRemoteUserConfig } from '../../../services/authWorkspace';

export const IntegrationCatalog: React.FC = () => {
  const { selectedCountry } = useCountry();
  const { currentUser, showNotification, updateUserConfig } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<IntegrationCategory | 'all'>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const handleTogglePlatform = async (integration: IntegrationDef) => {
    if (!currentUser || !['delivery', 'mobility'].includes(integration.category) || savingId) return;

    const current = currentUser.platforms || [];
    const aliases = new Set([integration.id.toLowerCase(), integration.name.toLowerCase()]);
    const withoutIntegration = current.filter((item) => !aliases.has(item.toLowerCase()));
    const nextPlatforms = isAdded(integration)
      ? withoutIntegration
      : [...withoutIntegration, integration.id];

    setSavingId(integration.id);
    try {
      await updateRemoteUserConfig(nextPlatforms, currentUser.banks || []);
      updateUserConfig(nextPlatforms, currentUser.banks || []);
      showNotification(
        'success',
        isAdded(integration)
          ? `${integration.name} eliminada de tu actividad.`
          : `${integration.name} añadida a tu actividad.`
      );
    } catch (error) {
      console.error('[LABORA_PLATFORM_PREF_SAVE_FAILED]', error);
      showNotification('error', 'No se pudo guardar esta preferencia. Inténtalo de nuevo.');
    } finally {
      setSavingId(null);
    }
  };

  const descriptionFor = (integration: IntegrationDef) => {
    if (integration.category === 'banking') {
      return 'La conexión de movimientos se habilitará únicamente mediante Open Banking regulado bajo PSD2. Sin banco en vivo todavía.';
    }
    if (integration.category === 'delivery' || integration.category === 'mobility') {
      return 'Añádela a tu perfil para clasificar tu actividad e ingresos. La sincronización automática todavía no está habilitada.';
    }
    return 'Integración API prevista. Labora+ no marcará este servicio como conectado hasta que exista una autorización real.';
  };

  const categoryLabel = (category: IntegrationCategory) => {
    switch (category) {
      case 'delivery': return 'Delivery';
      case 'mobility': return 'Movilidad';
      case 'banking': return 'Bancos';
      case 'payments': return 'Pagos';
      case 'accounting': return 'Contabilidad';
      default: return category;
    }
  };

  return (
    <div
      className="mx-auto max-w-6xl space-y-5 pb-10"
      style={{ fontFamily: "var(--labora-font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Actividad</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Plataformas y servicios</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-stone-500">
          Selecciona las plataformas que utilizas. Solo mostramos como «en mi actividad» una preferencia de perfil;
          no hay conexión OAuth ni sincronización automática todavía.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E3DCD2] bg-[#FFFEFB] p-4 shadow-[0_1px_3px_rgba(46,90,68,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar plataforma o servicio"
              className="w-full rounded-xl border border-[#E2DBD1] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-[#9BB3A4] focus:ring-2 focus:ring-[#2E5A44]/10"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400">
            <Globe size={13} /> {selectedCountry.display_name}
          </span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCat(category.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  selectedCat === category.id
                    ? 'bg-[#2E5A44] text-white shadow-sm'
                    : 'border border-[#E3DCD2] bg-white text-stone-500 hover:bg-[#F8F5F0]'
                }`}
              >
                <Icon size={14} /> {category.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((integration) => {
          const added = isAdded(integration);
          const selectable = integration.category === 'delivery' || integration.category === 'mobility';
          const banking = integration.category === 'banking';

          return (
            <article
              key={integration.id}
              className="flex min-h-[236px] flex-col rounded-2xl border border-[#E3DCD2] bg-[#FFFEFB] p-4 shadow-[0_1px_3px_rgba(46,90,68,0.045)] transition hover:border-[#D5CFC4]"
            >
              <div className="flex items-start justify-between gap-3">
                <LogoResolver
                  id={integration.id}
                  name={integration.name}
                  domain={integration.domain}
                  category={integration.category}
                  size="lg"
                />
                {added ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2ED] px-2.5 py-1 text-[10px] font-bold text-[#245338]">
                    <Check size={11} /> En mi actividad
                  </span>
                ) : banking ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#E3DCD2] bg-[#F5F2ED] px-2.5 py-1 text-[10px] font-bold text-stone-500">
                    <ShieldCheck size={11} /> Open Banking
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-[#E8E1D7] bg-[#FAF8F4] px-2.5 py-1 text-[10px] font-bold text-stone-400">
                    Catálogo
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-base font-bold tracking-tight text-stone-900">{integration.name}</h2>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                {categoryLabel(integration.category)}
              </p>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-stone-500">{descriptionFor(integration)}</p>

              <div className="mt-4 border-t border-[#EEE7DD] pt-3">
                {selectable ? (
                  <button
                    type="button"
                    disabled={savingId === integration.id}
                    onClick={() => void handleTogglePlatform(integration)}
                    className={`w-full rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-60 ${
                      added
                        ? 'border border-[#D6E3DA] bg-[#F2F6F3] text-[#2E5A44] hover:bg-[#EAF2ED]'
                        : 'bg-[#2E5A44] text-white hover:bg-[#244936]'
                    }`}
                  >
                    {savingId === integration.id ? 'Guardando…' : added ? 'Quitar de mi actividad' : 'Añadir a mi actividad'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-[#E6DFD5] bg-[#F8F5F0] py-2.5 text-xs font-bold text-stone-400"
                  >
                    {banking ? 'Conexión segura próximamente' : 'API próximamente'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DDD5CA] bg-[#FFFEFB] py-12 text-center text-sm text-stone-400">
          No hay resultados para esta búsqueda.
        </div>
      )}
    </div>
  );
};
