import React, { useState } from 'react';
import {
  Bell,
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Scale,
  User,
  Wallet
} from 'lucide-react';
import { DataProvider, useData } from './contexts/DataContext';
import { CountryProvider } from './contexts/CountryContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { GhibliAtmosphereProvider } from './contexts/GhibliAtmosphereContext';
import { UserRole } from './types';

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
import { TaxOverview } from './components/TaxOverview';
import { GestorRequirementsWidget } from './components/GestorRequirementsWidget';

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
    switchUser,
    users,
    privacyMode,
    togglePrivacyMode
  } = useData();

  const [currentView, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return <Login />;

  if (currentUser.role === UserRole.RIDER && !hasOnboarded) {
    return <Onboarding onFinish={completeOnboarding} />;
  }

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const currentRoleLabel = isManager ? 'Gestor' : 'Rider';
  const targetRoleLabel = isManager ? 'Rider' : 'Gestor';

  const pendingReqCount = requirements.filter(
    (requirement) =>
      (currentUser.role === UserRole.RIDER ? requirement.riderId === currentUser.id : true) &&
      requirement.status === 'pending'
  ).length;

  const handleToggleRole = () => {
    if (currentUser.role === UserRole.RIDER) {
      const gestor = users.find((user) => user.role === UserRole.MANAGER) || users[1];
      if (gestor) switchUser(gestor.id);
    } else {
      const rider = users.find((user) => user.role === UserRole.RIDER) || users[0];
      if (rider) switchUser(rider.id);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return isManager ? 'Panel de gestoría' : 'Inicio';
      case 'money': return isManager ? 'Auditoría y facturación' : 'Dinero';
      case 'tax-declarations': return 'Modelos AEAT';
      case 'gestor-requirements': return isManager ? 'Peticiones a riders' : 'Avisos';
      case 'operations': return 'Operaciones';
      case 'integrations': return 'Integraciones';
      case 'automation': return 'Asistente fiscal';
      case 'all-modules': return 'Módulos';
      case 'people': return 'Clientes';
      case 'messages': return 'Mensajes';
      case 'settings': return 'Perfil y ajustes';
      case 'profile': return 'Mi perfil';
      case 'docs': return 'Documentos';
      default: return 'Labora+';
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return isManager
          ? <ManagerDashboard setView={setView} />
          : <Dashboard setView={setView} />;
      case 'money': return <MoneyHub setView={setView} />;
      case 'tax-declarations': return <TaxOverview setView={setView} />;
      case 'gestor-requirements':
        return (
          <div className="max-w-4xl mx-auto space-y-4">
            <button
              onClick={() => setView('dashboard')}
              className="text-xs font-semibold text-[#2E5A44] hover:underline"
            >
              ← Volver
            </button>
            <GestorRequirementsWidget />
          </div>
        );
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
      case 'payroll': return <MoneyHub initialTab="payroll" setView={setView} />;
      case 'banking': return <MoneyHub initialTab="banking" setView={setView} />;
      default: return isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
    }
  };

  const riderNavItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'money', label: 'Dinero', icon: Wallet },
    { id: 'tax-declarations', label: 'AEAT', icon: Scale },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Perfil', icon: User }
  ];

  const managerNavItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'tax-declarations', label: 'Modelos', icon: Scale },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'money', label: 'Auditoría', icon: Wallet },
    { id: 'settings', label: 'Ajustes', icon: User }
  ];

  const navItems = isManager ? managerNavItems : riderNavItems;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F4ED] font-sans text-stone-800 selection:bg-[#DDE9E1] selection:text-[#245338]">
      <Toast />

      <Sidebar
        currentView={currentView}
        setView={setView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F7F4ED] min-w-0">
        <header className="z-20 shrink-0 border-b border-[#E3DCD1] bg-[#FCFAF6]/95 backdrop-blur px-3 sm:px-5 md:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-stone-600 rounded-xl hover:bg-[#F0ECE4] transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            <div className="lg:hidden min-w-0">
              <Logo size="sm" showText={true} />
            </div>

            <div className="hidden lg:flex items-center gap-3 min-w-0">
              <Logo size="sm" showText={true} />
              <div className="w-px h-5 bg-[#DDD5C8]" />
              <span className="text-sm font-semibold text-stone-600 truncate">{getViewTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleToggleRole}
              className="h-9 px-2.5 rounded-xl border border-[#DED6CA] bg-white text-stone-700 text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#F7F3EC] transition-colors"
              title={`Perfil actual: ${currentRoleLabel}. Cambiar a ${targetRoleLabel}.`}
              aria-label={`Cambiar de ${currentRoleLabel} a ${targetRoleLabel}`}
            >
              <RefreshCw size={13} strokeWidth={2} className="text-[#2E5A44]" />
              <span>{currentRoleLabel}</span>
            </button>

            <button
              onClick={togglePrivacyMode}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                privacyMode
                  ? 'bg-[#FFF7EA] border-[#EAD9B8] text-[#8B652B]'
                  : 'bg-white border-[#DED6CA] text-stone-500 hover:bg-[#F7F3EC]'
              }`}
              title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {privacyMode ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 md:px-8 md:py-7 scroll-smooth custom-scrollbar min-w-0">
          <div className="max-w-7xl mx-auto min-h-full min-w-0">{renderView()}</div>
        </div>

        <nav className="lg:hidden shrink-0 border-t border-[#E3DCD1] bg-white/95 backdrop-blur px-1.5 py-1.5 safe-area-bottom shadow-[0_-6px_18px_-16px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-5 items-center">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`min-w-0 py-1.5 flex flex-col items-center gap-1 rounded-xl transition-colors ${
                    isActive ? 'text-[#2E5A44]' : 'text-stone-400'
                  }`}
                >
                  <div className="relative">
                    <Icon size={19} strokeWidth={isActive ? 2.35 : 2} />
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 bg-[#C96846] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`max-w-full truncate text-[9px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
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
            {showIntro ? (
              <IntroAnimation onComplete={() => setShowIntro(false)} />
            ) : (
              <MainLayout />
            )}
          </GhibliAtmosphereProvider>
        </DataProvider>
      </CountryProvider>
    </OrganizationProvider>
  );
};

export default App;
