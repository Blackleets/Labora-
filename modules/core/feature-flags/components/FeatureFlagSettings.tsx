
import React from 'react';
import { useOrganization } from '../../../../contexts/OrganizationContext';
import { ToggleLeft, ToggleRight, Layers, Globe, Box, Cpu, AlertCircle } from 'lucide-react';

interface FlagDefinition {
  key: string;
  label: string;
  description: string;
  category: 'module' | 'core' | 'beta';
}

const DEFINED_FLAGS: FlagDefinition[] = [
  // Modules
  { key: 'payroll_pro', label: 'Payroll Suite', description: 'Enable advanced payroll calculation and payslip generation.', category: 'module' },
  { key: 'delivery_pro', label: 'Delivery Ops', description: 'Enable incident management and advanced route optimization.', category: 'module' },
  { key: 'policy_engine', label: 'Policy Engine', description: 'Enable the automated rule and compliance system.', category: 'module' },
  
  // Core
  { key: 'audit_log', label: 'Audit Logging', description: 'Record all critical actions for compliance.', category: 'core' },
  { key: 'dark_mode_force', label: 'Force Dark Mode', description: 'Enforce dark theme for all organization members.', category: 'core' },
  
  // Beta
  { key: 'beta_ai_analysis', label: 'AI Risk Analysis', description: 'Experimental: Predict labor risks using GenAI.', category: 'beta' },
];

export const FeatureFlagSettings: React.FC = () => {
  const { organization, updateFeatureFlag } = useOrganization();

  if (!organization) return null;

  const renderSection = (category: string, title: string, icon: React.ElementType) => {
    const flags = DEFINED_FLAGS.filter(f => f.category === category);
    if (flags.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          {React.createElement(icon, { size: 14 })} {title}
        </h4>
        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          {flags.map((flag, idx) => {
            const isEnabled = organization.feature_flags[flag.key] || false;
            return (
              <div 
                key={flag.key} 
                className={`p-4 flex items-center justify-between ${idx !== flags.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-100/50 transition-colors`}
              >
                <div className="pr-4">
                  <p className="font-bold text-gray-800 text-sm">{flag.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
                </div>
                
                <button
                  onClick={() => updateFeatureFlag(flag.key, !isEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-[#2D6CDF]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-800">Control de Funcionalidades (Feature Flags)</h4>
          <p className="text-xs text-blue-700 mt-1">
            Activa o desactiva módulos para toda la organización "{organization.name}". 
            Los cambios se propagan inmediatamente a todos los usuarios.
          </p>
        </div>
      </div>

      {renderSection('module', 'Módulos Principales', Box)}
      {renderSection('core', 'Sistema & Core', Cpu)}
      {renderSection('beta', 'Beta & Experimental', Layers)}
    </div>
  );
};
