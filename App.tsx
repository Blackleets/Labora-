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
import RemoteSyncBridge from './components/RemoteSyncBridge';
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
  const identityImage = identityImageStore.getForUser(currentUser);
  const pendingReqCount = requirements.filter((requirement) =>
    currentUser.role === UserRole.RIDER
      ? requirement.riderId === currentUser.id && requirement.status === 'pending'
      : requirement.managerId === currentUser.id && requirement.status === 'pending'
  ).length;

  const getViewTitle = () => {
    const titles: Record<string, string> = {
      dashboard: isManager ? 'Resumen' : 'Inicio',
      money: isManager ? 'Auditoría' : 'Dinero',
      'tax-declarations': 'Modelos fiscales',
      'gestor-requirements': isManager ? 'Peticiones' : 'Avisos',
      operations: 'Operaciones',
      integrations: 'Plataformas',
      automation: 'Asistente fiscal',
      people: 'Clientes',
      messages: 'Mensajes',
      settings: 'Perfil y ajustes',
      profile: 'Mi perfil',
      docs: 'Documentos'
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
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-[#DDD4C8] bg-white text-[#0F3D2E] shadow-sm ${small ? 'h-7 w-7' : 'h-9 w-9'} ${isManager ? 'rounded-[11px]' : 'rounded-full'}`}>
      {identityImage ? (
        <img src={identityImage} alt="Identidad" className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`} />
      ) : (
        <User size={small ? 14 : 16} />
      )}
    </div>
  );

  return (
    <div className="safe-area-x flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#F0EDE6] font-sans text-[#0A1210] selection:bg-[#C9A227]/35 selection:text-[#0A1210]">
      <Toast />
      <Sidebar
        currentView={currentView}
        setView={setView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="safe-area-top z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-black/5 bg-[#FFFEFB]/85 px-3 backdrop-blur-2xl sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white text-[#0A1210] shadow-sm lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="lg:hidden">
              <Logo size="sm" showText={false} />
            </div>

            <div className="min-w-0">
              <p className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-[#C9A227] lg:block">
                {isManager ? 'Gestoría' : 'Autónomo'}
              </p>
              <span className="block truncate font-serif text-[1.15rem] font-semibold tracking-[-0.03em] text-[#0A1210]">
                {getViewTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePrivacyMode}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                privacyMode
                  ? 'border-[#C9A227]/40 bg-[#FFF8E8] text-[#8B652B]'
                  : 'border-black/8 bg-white text-stone-500 hover:text-[#0F3D2E]'
              }`}
              title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <button
              onClick={() => setView('settings')}
              className="flex items-center gap-2 rounded-2xl border border-black/8 bg-white p-1 pr-3 text-left shadow-sm transition hover:border-[#C9A227]/35"
            >
              <Identity />
              <div className="hidden text-right sm:block">
                <p className="max-w-[190px] truncate text-xs font-extrabold text-[#0A1210]">
                  {currentUser.companyName || currentUser.name}
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">
                  {isManager ? 'Gestoría' : 'Autónomo'}
                </p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto min-h-full max-w-7xl min-w-0">{renderView()}</div>
        </div>

        <nav className="safe-area-bottom shrink-0 border-t border-black/5 bg-[#FFFEFB]/95 px-1.5 py-1.5 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex min-w-0 flex-col items-center gap-0.5 rounded-[14px] px-1 py-1.5 transition ${active ? 'text-[#0F3D2E]' : 'text-stone-400'}`}
                >
                  <div className={`relative flex h-8 min-w-10 items-center justify-center rounded-[12px] px-2 transition ${active ? 'bg-[#E3EFE8] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.06)]' : ''}`}>
                    {item.id === 'settings' && identityImage ? (
                      <Identity small />
                    ) : (
                      <Icon size={18} strokeWidth={active ? 2.45 : 2} />
                    )}
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#E85D3B] px-1 text-[9px] font-extrabold text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`w-full truncate text-center text-[9px] ${active ? 'font-extrabold' : 'font-semibold'}`}>
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
          <RemoteSyncBridge />
          <MainLayout />
        </GhibliAtmosphereProvider>
      </DataProvider>
    </CountryProvider>
  </OrganizationProvider>
);

export default App;
