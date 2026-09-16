import React, { useState } from 'react';
import {
  Bell,
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
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

  const pendingReqCount = requirements.filter((requirement) => {
    if (currentUser.role === UserRole.RIDER) {
      return requirement.riderId === currentUser.id && requirement.status === 'pending';
    }
    return requirement.status === 'pending';
  }).length;

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return isManager ? 'Resumen' : 'Inicio';
      case 'money': return isManager ? 'Auditoría' : 'Ingresos y gastos';
      case 'tax-declarations': return 'Modelos fiscales';
      case 'gestor-requirements': return isManager ? 'Peticiones' : 'Avisos';
      case 'operations': return 'Operaciones';
      case 'integrations': return 'Plataformas';
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
          <div className="mx-auto max-w-4xl space-y-4">
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
    { id: 'tax-declarations', label: 'Modelos', icon: Scale },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Perfil', icon: User }
  ];

  const managerNavItems = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'money', label: 'Auditoría', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos', icon: Scale },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Ajustes', icon: User }
  ];

  const navItems = isManager ? managerNavItems : riderNavItems;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F1] font-sans text-stone-800 selection:bg-[#DDE9E1] selection:text-[#245338]">
      <Toast />

      <Sidebar
        currentView={currentView}
        setView={setView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F5F1]">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#E5DED4] bg-[#FCFAF7]/95 px-3 backdrop-blur sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-600 hover:bg-[#F0ECE5] lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            <div className="lg:hidden">
              <Logo size="sm" showText={true} />
            </div>

            <div className="hidden min-w-0 items-center gap-3 lg:flex">
              <span className="truncate text-sm font-semibold text-stone-800">{getViewTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="max-w-[190px] truncate text-xs font-semibold text-stone-700">
                {currentUser.companyName || currentUser.name}
              </p>
              <p className="text-[10px] text-stone-400">
                {isManager ? 'Gestoría' : 'Autónomo'}
              </p>
            </div>

            <button
              onClick={togglePrivacyMode}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                privacyMode
                  ? 'border-[#EAD9B8] bg-[#FFF7EA] text-[#8B652B]'
                  : 'border-[#DED6CA] bg-white text-stone-500 hover:bg-[#F7F3EC]'
              }`}
              title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {privacyMode ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 md:px-8 md:py-7">
          <div className="mx-auto min-h-full max-w-7xl min-w-0">{renderView()}</div>
        </div>

        <nav className="safe-area-bottom shrink-0 border-t border-[#E3DCD1] bg-white/95 px-1.5 py-1.5 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors ${
                    active ? 'text-[#2E5A44]' : 'text-stone-400'
                  }`}
                >
                  <div className="relative">
                    <Icon size={19} strokeWidth={active ? 2.35 : 2} />
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#C96846] px-1 text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`w-full truncate text-center text-[9px] ${active ? 'font-bold' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <OrganizationProvider>
    <CountryProvider>
      <DataProvider>
        <GhibliAtmosphereProvider>
          <MainLayout />
        </GhibliAtmosphereProvider>
      </DataProvider>
    </CountryProvider>
  </OrganizationProvider>
);

export default App;