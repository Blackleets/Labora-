
import React, { useState } from 'react';
import { Shield, CreditCard, UserCheck, Bell, Lock, FileText, LogOut, ChevronRight, Moon, Sun, Briefcase, Globe, ToggleRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { BankingConnect } from '../modules/banking-connect/BankingConnect';
import { FeatureFlagSettings } from '../modules/core/feature-flags/components/FeatureFlagSettings';

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
    <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">{title}</h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const ToggleItem = ({ icon: Icon, label, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
    <div className="flex items-center gap-3 text-gray-700">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Icon size={20} /></div>
      <span className="font-medium">{label}</span>
    </div>
    <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${checked ? 'bg-[#4285F4]' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
  </div>
);

const LinkItem = ({ icon: Icon, label, onClick }: any) => (
  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={onClick}>
    <div className="flex items-center gap-3 text-gray-700">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Icon size={20} /></div>
      <span className="font-medium">{label}</span>
    </div>
    <ChevronRight size={18} className="text-gray-400" />
  </div>
);

const Settings: React.FC<{ setView?: (view: string) => void }> = ({ setView }) => {
  const { logout, darkMode, toggleDarkMode, currentUser } = useData();
  const { organization } = useOrganization();
  const [notifications, setNotifications] = useState(true);
  const [managerAccess, setManagerAccess] = useState(true);
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);

  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-8 pb-24 lg:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1A1A1A]">Configuración</h2>
        {organization && (
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase border border-blue-100">
            {organization.name}
          </span>
        )}
      </div>

      {/* Enterprise / Manager Section */}
      {isManager && (
        <Section title="Enterprise Core">
          <LinkItem icon={Shield} label="Motor de Políticas (Policy Engine)" onClick={() => setView?.('policies')} />
          <LinkItem icon={FileText} label="Auditoría y Logs" onClick={() => setView?.('audit')} />
          <LinkItem icon={Globe} label="Gestión de Países" onClick={() => setView?.('countries')} />
          
          <div className="border-t border-gray-100 my-2 pt-2">
             <div 
               className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" 
               onClick={() => setShowFeatureFlags(!showFeatureFlags)}
             >
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><ToggleRight size={20} /></div>
                  <span className="font-medium">Feature Flags</span>
                </div>
                <ChevronRight size={18} className={`text-gray-400 transition-transform ${showFeatureFlags ? 'rotate-90' : ''}`} />
             </div>
             
             {showFeatureFlags && (
               <div className="mt-4 pl-2 animate-in slide-in-from-top-2">
                 <FeatureFlagSettings />
               </div>
             )}
          </div>
        </Section>
      )}

      {/* Financial Hub Integrated */}
      <Section title="Hub Financiero">
         <BankingConnect />
      </Section>

      <Section title="Gestoría y Permisos">
        <ToggleItem icon={UserCheck} label="Permitir acceso a Gestor" checked={managerAccess} onChange={setManagerAccess} />
        <LinkItem icon={FileText} label="Documentación Legal" onClick={() => {}} />
      </Section>

      <Section title="Aplicación">
        <ToggleItem icon={darkMode ? Moon : Sun} label="Modo Oscuro" checked={darkMode} onChange={toggleDarkMode} />
        <ToggleItem icon={Bell} label="Notificaciones Push" checked={notifications} onChange={setNotifications} />
        <LinkItem icon={Shield} label="Seguridad y Privacidad" onClick={() => {}} />
      </Section>

      <button 
        onClick={logout}
        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={20} />
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Settings;
