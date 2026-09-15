
import React, { useState, useEffect } from 'react';
import { Globe, Plus, Edit2, Trash2, Save, X, Check, Code, Percent, DollarSign } from 'lucide-react';
import { useCountry } from '../../../contexts/CountryContext';
import { CountryConfig } from '../types';
import { countryApi } from '../services/countryApi';

export const CountryHub: React.FC = () => {
  const { countries, selectedCountry, selectCountry, refreshCountries } = useCountry();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CountryConfig | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleEdit = (config: CountryConfig) => {
    setEditingConfig(config);
    setEditText(JSON.stringify(config, null, 2));
    setJsonError(null);
  };

  const handleCreate = () => {
    const template: CountryConfig = {
      ...selectedCountry, 
      country_code: "NEW", 
      display_name: "New Country"
    };
    setEditingConfig(template);
    setEditText(JSON.stringify(template, null, 2));
    setJsonError(null);
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(editText) as CountryConfig;
      if (!parsed.country_code) throw new Error("Missing country_code");
      
      if (countries.some(c => c.country_code === parsed.country_code && editingConfig?.country_code !== parsed.country_code)) {
         await countryApi.create(parsed);
      } else {
         await countryApi.update(parsed.country_code, parsed);
      }
      
      await refreshCountries();
      setEditingConfig(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleDelete = async (code: string) => {
    if (confirm(`¿Eliminar configuración de ${code}?`)) {
      await countryApi.delete(code);
      await refreshCountries();
    }
  };

  const updateField = (field: keyof CountryConfig, value: any) => {
    try {
      const current = JSON.parse(editText);
      const updated = { ...current, [field]: value };
      setEditText(JSON.stringify(updated, null, 2));
      setJsonError(null);
    } catch (e) {
      setJsonError("Corrige el JSON antes de usar los controles rápidos.");
    }
  };

  let parsedConfig: CountryConfig | null = null;
  try {
    parsedConfig = JSON.parse(editText);
  } catch (e) {}

  if (editingConfig) {
    return (
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 animate-in fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Code size={20} className="text-[#2D6CDF]" />
            Editor Configuración País
          </h3>
          <button onClick={() => setEditingConfig(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        
        {/* Quick Edit Controls */}
        {parsedConfig && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                  <DollarSign size={12}/> Tasa de Servicio Fija
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={parsedConfig.service_fee_flat}
                  onChange={(e) => updateField('service_fee_flat', parseFloat(e.target.value))}
                  className="w-full p-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <p className="text-[10px] text-blue-600 mt-1">Cobro fijo por pedido (Service Fee)</p>
             </div>
             <div>
                <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                  <Percent size={12}/> IVA Aplicable
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="0.01"
                    value={parsedConfig.vat_pct}
                    onChange={(e) => updateField('vat_pct', parseFloat(e.target.value))}
                    className="w-full p-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <span className="text-sm font-bold text-blue-800">{(parsedConfig.vat_pct * 100).toFixed(0)}%</span>
                </div>
                <p className="text-[10px] text-blue-600 mt-1">Impuesto sobre servicio (ej. 0.21 para 21%)</p>
             </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-2">Edita el JSON completo para ajustes avanzados.</p>
        
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full h-96 font-mono text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-[#2D6CDF] outline-none"
        />
        
        {jsonError && (
          <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
            <X size={12} /> {jsonError}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setEditingConfig(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#2D6CDF] text-white rounded-xl font-bold text-sm flex items-center gap-2">
            <Save size={16} /> Guardar Configuración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Country Hub</h2>
          <p className="text-gray-500 text-sm">Gestiona la localización fiscal y bancaria.</p>
        </div>
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isAdminMode ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'text-gray-500 border-gray-200'}`}
        >
          {isAdminMode ? 'Modo Admin ON' : 'Administrar'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {countries.map(country => (
          <div 
            key={country.country_code}
            className={`relative p-4 rounded-2xl border transition-all ${selectedCountry.country_code === country.country_code ? 'bg-blue-50 border-[#2D6CDF] shadow-sm' : 'bg-white border-gray-100 hover:border-blue-200'}`}
          >
             <div onClick={() => selectCountry(country.country_code)} className="cursor-pointer flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg shadow-sm">
                 {country.country_code === 'ES' ? '🇪🇸' : country.country_code === 'MX' ? '🇲🇽' : '🌍'}
               </div>
               <div>
                 <h4 className="font-bold text-gray-800">{country.display_name}</h4>
                 <p className="text-xs text-gray-500">{country.currency} • {country.vat_pct * 100}% VAT</p>
               </div>
               {selectedCountry.country_code === country.country_code && (
                 <div className="absolute top-4 right-4 text-[#2D6CDF]"><Check size={18} /></div>
               )}
             </div>

             {isAdminMode && (
               <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                 <button onClick={() => handleEdit(country)} className="p-1.5 text-gray-400 hover:text-[#2D6CDF] hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                 <button onClick={() => handleDelete(country.country_code)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
               </div>
             )}
          </div>
        ))}
        
        {isAdminMode && (
          <button onClick={handleCreate} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#2D6CDF] hover:text-[#2D6CDF] hover:bg-blue-50 transition-all">
            <Plus size={24} />
            <span className="text-xs font-bold">Nuevo País</span>
          </button>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-500 font-mono">
        <p>Active Config: {selectedCountry.country_code} ({selectedCountry.timezone})</p>
        <p>API Endpoint: /api/v1/countries/{selectedCountry.country_code}</p>
      </div>
    </div>
  );
};
