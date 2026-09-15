
import React, { useState, useMemo } from 'react';
import { useCountry } from '../../../contexts/CountryContext';
import { useData } from '../../../contexts/DataContext';
import { IntegrationCategory, IntegrationDef } from '../../../types';
import { useIntegrations } from '../hooks/useIntegrations';
import LogoResolver from '../../../components/LogoResolver';
import { Plug, Check, Plus, Search, Filter, Globe, Package, Car, Building2, CreditCard, FileText, Settings, ExternalLink, Loader2 } from 'lucide-react';

export const IntegrationCatalog: React.FC = () => {
  const { selectedCountry, countries, selectCountry } = useCountry();
  const { currentUser, showNotification, updateUserConfig } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<IntegrationCategory | 'all'>('all');
  const [installingId, setInstallingId] = useState<string | null>(null);
  
  // Custom hook brings data sorted by ranking and filtered by country
  const { integrations } = useIntegrations({
    countryCode: selectedCountry.country_code,
    category: selectedCat
  });

  const categories: { id: IntegrationCategory | 'all', label: string, icon: any }[] = [
    { id: 'all', label: 'Todas', icon: Filter },
    { id: 'delivery', label: 'Delivery', icon: Package },
    { id: 'mobility', label: 'Movilidad', icon: Car },
    { id: 'banking', label: 'Bancos', icon: Building2 },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'accounting', label: 'Contabilidad', icon: FileText },
  ];

  // Client-side search filtering
  const filtered = useMemo(() => {
    return integrations.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [integrations, searchTerm]);

  // Check if integration is already active for the current user
  const isInstalled = (integration: IntegrationDef) => {
    if (!currentUser) return false;
    
    // Normalize checking against user arrays
    const userPlatforms = (currentUser.platforms || []).map(p => p.toLowerCase());
    const userBanks = (currentUser.banks || []).map(b => b.toLowerCase());
    
    // Check by ID or Name (handling different naming conventions)
    const idMatch = userPlatforms.includes(integration.id.toLowerCase()) || userBanks.includes(integration.id.toLowerCase());
    const nameMatch = userPlatforms.includes(integration.name.toLowerCase()) || userBanks.includes(integration.name.toLowerCase());
    
    // Special check for mock data consistency
    if (integration.id === 'uber' && userPlatforms.includes('uber eats')) return true;
    
    return idMatch || nameMatch;
  };

  const handleInstall = async (integration: IntegrationDef) => {
    if (!currentUser) return;
    setInstallingId(integration.id);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let newPlatforms = [...currentUser.platforms];
      let newBanks = [...(currentUser.banks || [])];

      if (['delivery', 'mobility'].includes(integration.category)) {
        if (!newPlatforms.includes(integration.name)) newPlatforms.push(integration.name);
      } else if (integration.category === 'banking') {
        if (!newBanks.includes(integration.name)) newBanks.push(integration.name);
      } else {
        // Fallback for other categories
        if (!newPlatforms.includes(integration.name)) newPlatforms.push(integration.name);
      }

      updateUserConfig(newPlatforms, newBanks);
      showNotification('success', `Se ha conectado ${integration.name} correctamente.`);
    } catch (error) {
      showNotification('error', 'Error al conectar la integración.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleConfigure = (integration: IntegrationDef) => {
    showNotification('info', `Abriendo configuración de ${integration.name}...`);
    // Logic to open specific settings modal would go here
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Plug className="text-blue-600" size={24} /> Marketplace Global
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Explora {integrations.length} integraciones disponibles para <span className="font-bold text-slate-800">{selectedCountry.display_name}</span>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative group flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar app, banco..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none w-full transition-all"
                />
             </div>
             
             {/* Country Quick Switcher */}
             <select 
               value={selectedCountry.country_code}
               onChange={(e) => selectCountry(e.target.value)}
               className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
             >
               {countries.map(c => (
                 <option key={c.country_code} value={c.country_code}>{c.country_code} - {c.display_name}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                selectedCat === cat.id 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filtered.map(int => {
              const installed = isInstalled(int);
              const isInstalling = installingId === int.id;

              return (
                <div key={int.id} className={`bg-white p-5 rounded-[24px] border transition-all hover:-translate-y-1 group flex flex-col justify-between h-full ${installed ? 'border-green-200 shadow-sm' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
                   
                   <div>
                     <div className="flex justify-between items-start mb-4">
                        <LogoResolver 
                          id={int.id} 
                          name={int.name} 
                          domain={int.domain} 
                          category={int.category} 
                          size="lg"
                          className="shadow-sm"
                        />
                        
                        {int.ranking > 95 && !installed && (
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-yellow-100 flex items-center gap-1">
                            Popular
                          </span>
                        )}
                        {installed && (
                          <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                     </div>
                     
                     <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">{int.name}</h3>
                     
                     <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          {int.category}
                        </span>
                        {int.supported_countries.length === 0 ? (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                            <Globe size={10} /> Global
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 px-1 py-1">
                            {int.supported_countries.length > 3 ? `${int.supported_countries.slice(0,3).join(', ')}...` : int.supported_countries.join(', ')}
                          </span>
                        )}
                     </div>
                     
                     <p className="text-xs text-slate-500 line-clamp-2 min-h-[2.5em] leading-relaxed">
                       {int.description || `Integración oficial con ${int.name} para sincronización de datos automática y conciliación.`}
                     </p>
                   </div>
                   
                   <div className="mt-5 pt-4 border-t border-slate-50">
                      {installed ? (
                         <div className="flex gap-2">
                           <button 
                             className="flex-1 py-2.5 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-default"
                           >
                              Conectado
                           </button>
                           <button 
                             onClick={() => handleConfigure(int)}
                             className="w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                             title="Configurar"
                           >
                             <Settings size={16} />
                           </button>
                         </div>
                      ) : (
                         <button 
                           onClick={() => handleInstall(int)}
                           disabled={isInstalling}
                           className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 group-hover:shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                         >
                            {isInstalling ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <Plus size={16} /> Conectar
                              </>
                            )}
                         </button>
                      )}
                   </div>
                </div>
              );
           })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
             <Search size={32} />
           </div>
           <h3 className="text-lg font-bold text-slate-700">No se encontraron resultados</h3>
           <p className="text-slate-500 text-sm mt-1">Prueba con otra categoría o término de búsqueda.</p>
           <button 
             onClick={() => { setSearchTerm(''); setSelectedCat('all'); }}
             className="mt-4 text-blue-600 font-bold text-sm hover:underline"
           >
             Limpiar filtros
           </button>
        </div>
      )}
    </div>
  );
};
