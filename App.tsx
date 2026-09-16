import React, { useState } from 'react';
import {
  Bell,
  Bike,
  Briefcase,
  Eye,
  EyeOff,
  Fuel,
  LayoutDashboard,
  Menu,
  Plus,
  Scale,
  User,
  Wallet,
} from 'lucide-react';
import { DataProvider, useData } from './contexts/DataContext';
import { CountryProvider } from './contexts/CountryContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { GhibliAtmosphereProvider, useGhibliAtmosphere } from './contexts/GhibliAtmosphereContext';
import { UserRole } from './types';
import { getMarketProfile } from './modules/country-config/marketProfiles';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Education from './components/Education';
import Simulator from './components/Simulator';
import Toast from './components/Toast';
import Logo from './components/Logo';
import IntroAnimation from './components/IntroAnimation';
import { TaxDeclarationsViewer } from './components/TaxDeclarationsViewer';
import { GestorRequirementsWidget } from './components/GestorRequirementsWidget';
import { GasStationCaptureModal } from './components/GasStationCaptureModal';
import { GhibliLightingControl } from './components/GhibliLightingControl';

import { MoneyHub } from './modules/core/hubs/MoneyHub';
import { OperationsHub } from './modules/core/hubs/OperationsHub';
import { AutomationHub } from './modules/core/hubs/AutomationHub';
import { SettingsHub } from './modules/core/hubs/SettingsHub';
import { PeopleHub } from './modules/core/hubs/PeopleHub';
import { MessagesHub } from './modules/messages/components/MessagesHub';
import { IntegrationCatalog } from './modules/integrations/components/IntegrationCatalog';
import { ModulesCenter } from './modules/core/components/ModulesCenter';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    hasOnboarded,
    completeOnboarding,
    requirements,
    privacyMode,
    togglePrivacyMode,
  } = useData();
  const { palette } = useGhibliAtmosphere();
  const [currentView, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalGasModalOpen, setIsGlobalGasModalOpen] = useState(false);

  if (!currentUser) return <Login />;

  if (currentUser.role === UserRole.RIDER && !hasOnboarded) {
    return <Onboarding onFinish={completeOnboarding} />;
  }

  const market = getMarketProfile(currentUser.countryCode);
  const fiscalEnabled = market.fiscalEngineStatus === 'verified';
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const pendingReqCount = requirements.filter((requirement) => {
    if (requirement.status !== 'pending') return false;
    return currentUser.role === UserRole.RIDER ? requirement.riderId === currentUser.id : true;
  }).length;

  const viewTitle = (() => {
    switch (currentView) {
      case 'dashboard': return isManager ? 'Panel de gestoría' : 'Inicio';
      case 'money': return isManager ? 'Revisión económica' : 'Dinero';
      case 'tax-declarations': return fiscalEnabled ? 'Obligaciones fiscales' : 'Control financiero';
      case 'gestor-requirements': return isManager ? 'Peticiones a clientes' : 'Avisos del gestor';
      case 'operations': return 'Operaciones';
      case 'integrations': return 'Plataformas';
      case 'automation': return fiscalEnabled ? 'Asistente fiscal' : 'Asistente financiero';
      case 'people': return 'Clientes';
      case 'messages': return 'Mensajes';
      case 'settings': return 'Ajustes';
      case 'profile': return 'Mi perfil';
      case 'docs': return 'Documentos';
      default: return 'Labora+';
    }
  })();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
      case 'money': return <MoneyHub setView={setView} />;
      case 'tax-declarations': return fiscalEnabled ? <TaxDeclarationsViewer setView={setView} /> : <MoneyHub initialTab="docs" setView={setView} />;
      case 'gestor-requirements': return <div className="mx-auto max-w-4xl"><GestorRequirementsWidget /></div>;
      case 'operations': return <OperationsHub />;
      case 'integrations': return <IntegrationCatalog />;
      case 'automation': return <AutomationHub />;
      case 'people': return <PeopleHub />;
      case 'messages': return <MessagesHub />;
      case 'settings': return <SettingsHub />;
      case 'all-modules': return <ModulesCenter setView={setView} />;
      case 'profile': return <Profile />;
      case 'education': return <Education setView={setView} />;
      case 'simulator': return <Simulator />;
      case 'docs': return <MoneyHub initialTab="docs" setView={setView} />;
      case 'payroll': return <MoneyHub setView={setView} />;
      case 'banking': return <MoneyHub setView={setView} />;
      default: return isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
    }
  };

  const managerNav = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    ...(fiscalEnabled ? [{ id: 'tax-declarations', label: 'Fiscal', icon: Scale }] : []),
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'money', label: 'Economía', icon: Wallet },
    { id: 'settings', label: 'Ajustes', icon: User },
  ];

  const workerNav = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'money', label: 'Dinero', icon: Wallet },
    ...(fiscalEnabled ? [{ id: 'tax-declarations', label: 'Fiscal', icon: Scale }] : []),
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Perfil', icon: User },
  ];

  const navItems = isManager ? managerNav : workerNav;

  return (
    <div className="flex h-screen overflow-hidden font-sans text-stone-800" style={{ backgroundColor: palette.canvas }}>
      <Toast />
      <Sidebar
        currentView={currentView}
        setView={setView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="relative flex h-full flex-1 flex-col overflow-hidden" style={{ backgroundColor: palette.canvas }}>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-70" style={{ background: palette.ambientGradient }} />

        <header className="relative z-20 flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-8" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="rounded-xl p-2 text-stone-600 hover:bg-[#F2EDE4] lg:hidden" aria-label="Abrir menú">
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Labora+</span>
              <span className="text-stone-300">/</span>
              <span className="font-serif text-sm font-bold text-stone-900">{viewTitle}</span>
            </div>
            <div className="sm:hidden"><Logo size="sm" showText={false} /></div>
          </div>

          <div className="flex items-center gap-2">
            <GhibliLightingControl />
            <button
              onClick={togglePrivacyMode}
              className={`rounded-xl border p-2 ${privacyMode ? 'border-[#FDE3B8] bg-[#FEF7EB] text-[#85531B]' : 'border-[#EAE3D6] bg-[#FCFAF7] text-stone-500'}`}
              title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {!isManager ? (
              <button onClick={() => setIsGlobalGasModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-[#D96B43] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                <Fuel size={14} /><span className="hidden sm:inline">Guardar ticket</span><span className="sm:hidden">Ticket</span>
              </button>
            ) : (
              <button onClick={() => setView('gestor-requirements')} className="flex items-center gap-1.5 rounded-xl bg-[#2E5A44] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                <Plus size={14} /><span className="hidden sm:inline">Pedir documento</span><span className="sm:hidden">Pedir</span>
              </button>
            )}

            <button onClick={() => setView('gestor-requirements')} className="relative rounded-xl border border-[#EAE3D6] bg-[#FCFAF7] p-2 text-stone-600" title="Avisos">
              <Bell size={16} />
              {pendingReqCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D9943B] text-[9px] font-black text-white">{pendingReqCount}</span>}
            </button>

            <button onClick={() => setView('settings')} className={`flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm ${isManager ? 'bg-[#3A7596]' : 'bg-[#2E5A44]'}`} title="Perfil autenticado">
              {isManager ? <Briefcase size={14} /> : <Bike size={14} />}
            </button>
          </div>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto min-h-full max-w-7xl">{renderView()}</div>
        </div>

        <nav className="z-30 flex shrink-0 items-center justify-around border-t border-stone-200 bg-[#FCFAF7] px-3 py-2.5 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)} className={`relative flex flex-col items-center gap-1 rounded-lg px-2 py-1 ${isActive ? 'text-[#2E5A44]' : 'text-stone-400'}`}>
                <div className="relative"><Icon size={19} strokeWidth={isActive ? 2.5 : 2} />{Boolean(item.badge && item.badge > 0) && <span className="absolute -right-2 -top-1 h-3.5 min-w-3.5 rounded-full bg-[#D9943B] px-0.5 text-[8px] font-black text-white">{item.badge}</span>}</div>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      <GasStationCaptureModal isOpen={isGlobalGasModalOpen} onClose={() => setIsGlobalGasModalOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <OrganizationProvider>
      <CountryProvider>
        <DataProvider>
          <GhibliAtmosphereProvider>
            {showIntro ? <IntroAnimation onComplete={() => setShowIntro(false)} /> : <MainLayout />}
          </GhibliAtmosphereProvider>
        </DataProvider>
      </CountryProvider>
    </OrganizationProvider>
  );
};

export default App;
