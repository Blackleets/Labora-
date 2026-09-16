import React, { useState } from 'react';
import { Bell, Eye, EyeOff, LayoutDashboard, Menu, Scale, User, Wallet } from 'lucide-react';
import { CountryProvider } from './contexts/CountryContext';
import { DataProvider, useData } from './contexts/DataContext';
import { GhibliAtmosphereProvider } from './contexts/GhibliAtmosphereContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { identityImageStore } from './services/identityImage';
import { UserRole } from './types';

import Dashboard from './components/Dashboard';
import { GestorRequirementsWidget } from './components/GestorRequirementsWidget';
import Login from './components/Login';
import Logo from './components/Logo';
import { ManagerDashboard } from './components/ManagerDashboard';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import { TaxOverview } from './components/TaxOverview';
import Toast from './components/Toast';
import { AutomationHub } from './modules/core/hubs/AutomationHub';
import { MoneyHub } from './modules/core/hubs/MoneyHub';
import { OperationsHub } from './modules/core/hubs/OperationsHub';
import { PeopleHub } from './modules/core/hubs/PeopleHub';
import { SettingsHub } from './modules/core/hubs/SettingsHub';
import { IntegrationCatalog } from './modules/integrations/components/IntegrationCatalog';
import { MessagesHub } from './modules/messages/components/MessagesHub';

const MainLayout: React.FC = () => {
  const { currentUser, hasOnboarded, completeOnboarding, requirements, privacyMode, togglePrivacyMode } = useData();
  const [currentView, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return <Login />;
  if (currentUser.role === UserRole.RIDER && !hasOnboarded) return <Onboarding onFinish={completeOnboarding} />;

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const identityImage = identityImageStore.getForUser(currentUser);
  const pendingReqCount = requirements.filter((requirement) => currentUser.role === UserRole.RIDER ? requirement.riderId === currentUser.id && requirement.status === 'pending' : requirement.status === 'pending').length;

  const getViewTitle = () => {
    const titles: Record<string, string> = {
      dashboard: isManager ? 'Resumen' : 'Inicio',
      money: isManager ? 'Auditoría' : 'Ingresos y gastos',
      'tax-declarations': 'Modelos fiscales',
      'gestor-requirements': isManager ? 'Peticiones' : 'Avisos',
      operations: 'Operaciones', integrations: 'Plataformas', automation: 'Asistente fiscal',
      people: 'Clientes', messages: 'Mensajes', settings: 'Perfil y ajustes', profile: 'Mi perfil', docs: 'Documentos'
    };
    return titles[currentView] || 'Labora+';
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
      case 'money': return <MoneyHub setView={setView} />;
      case 'tax-declarations': return <TaxOverview setView={setView} />;
      case 'gestor-requirements': return <div className="mx-auto max-w-4xl"><GestorRequirementsWidget /></div>;
      case 'operations': return <OperationsHub />;
      case 'integrations': return <IntegrationCatalog />;
      case 'automation': return <AutomationHub />;
      case 'people': return <PeopleHub />;
      case 'messages': return <MessagesHub />;
      case 'settings': return <SettingsHub />;
      case 'profile': return <Profile />;
      case 'docs': return <MoneyHub initialTab="docs" setView={setView} />;
      default: return isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
    }
  };

  const navItems = isManager ? [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'money', label: 'Auditoría', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos', icon: Scale },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Ajustes', icon: User }
  ] : [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'money', label: 'Dinero', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos', icon: Scale },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Perfil', icon: User }
  ];

  const Identity = ({ small = false }: { small?: boolean }) => (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-[#DDD4C8] bg-white text-[#2E5A44] ${small ? 'h-7 w-7' : 'h-9 w-9'} ${isManager ? 'rounded-lg' : 'rounded-full'}`}>
      {identityImage ? <img src={identityImage} alt="Identidad" className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`} /> : <User size={small ? 14 : 16} />}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F1] font-sans text-stone-800 selection:bg-[#DDE9E1] selection:text-[#245338]">
      <Toast />
      <Sidebar currentView={currentView} setView={setView} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F5F1]">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#E5DED4] bg-[#FCFAF7]/95 px-3 backdrop-blur sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <button onClick={() => setIsMobileMenuOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-600 hover:bg-[#F0ECE5] lg:hidden" aria-label="Abrir menú"><Menu size={20} /></button>
            <div className="lg:hidden"><Logo size="sm" showText /></div>
            <span className="hidden truncate text-sm font-semibold text-stone-800 lg:block">{getViewTitle()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setView('settings')} className="flex items-center gap-2 rounded-xl p-1 text-left hover:bg-[#F3EFE8]">
              <Identity />
              <div className="hidden text-right sm:block"><p className="max-w-[190px] truncate text-xs font-semibold text-stone-700">{currentUser.companyName || currentUser.name}</p><p className="text-[10px] text-stone-400">{isManager ? 'Gestoría' : 'Autónomo'}</p></div>
            </button>
            <button onClick={togglePrivacyMode} className={`flex h-9 w-9 items-center justify-center rounded-xl border ${privacyMode ? 'border-[#EAD9B8] bg-[#FFF7EA] text-[#8B652B]' : 'border-[#DED6CA] bg-white text-stone-500'}`} title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}>{privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 md:px-8 md:py-7"><div className="mx-auto min-h-full max-w-7xl min-w-0">{renderView()}</div></div>

        <nav className="safe-area-bottom shrink-0 border-t border-[#E3DCD1] bg-white/95 px-1.5 py-1.5 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return <button key={item.id} onClick={() => setView(item.id)} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 ${active ? 'text-[#2E5A44]' : 'text-stone-400'}`}><div className="relative">{item.id === 'settings' && identityImage ? <Identity small /> : <Icon size={19} strokeWidth={active ? 2.35 : 2} />}{Boolean(item.badge && item.badge > 0) && <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#C96846] px-1 text-[9px] font-bold text-white">{item.badge}</span>}</div><span className={`w-full truncate text-center text-[9px] ${active ? 'font-bold' : 'font-semibold'}`}>{item.label}</span></button>;
            })}
          </div>
        </nav>
      </main>
    </div>
  );
};

const App: React.FC = () => <OrganizationProvider><CountryProvider><DataProvider><GhibliAtmosphereProvider><MainLayout /></GhibliAtmosphereProvider></DataProvider></CountryProvider></OrganizationProvider>;
export default App;
