
import React, { useState } from 'react';
import { Settings, Globe, FileText, Database } from 'lucide-react';
import SettingsView from '../../../components/Settings';
import { CountryHub } from '../../country-config/components/CountryHub';
import { AuditLogViewer } from '../../core/audit/components/AuditLogViewer';
import { AssetDiagnostics } from '../../core/diagnostics/components/AssetDiagnostics';

export const SettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'countries' | 'audit' | 'system'>('general');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Settings className="text-gray-600" /> System Settings
          </h2>
          <p className="text-gray-500">Configuración global de la organización.</p>
        </div>

        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Settings size={16} /> General
          </button>
          <button 
            onClick={() => setActiveTab('countries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'countries' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Globe size={16} /> Países
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText size={16} /> Auditoría
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Database size={16} /> Assets
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'general' && <SettingsView />}
        {activeTab === 'countries' && <CountryHub />}
        {activeTab === 'audit' && <AuditLogViewer />}
        {activeTab === 'system' && <AssetDiagnostics />}
      </div>
    </div>
  );
};
