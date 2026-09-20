# Layouts — App shell + Sidebar

## MainLayout / App providers — `App.tsx`
GhibliAtmosphereProvider wraps Country/Org/Data. Unauthenticated → Login. Rider without onboarding → Onboarding. Else Sidebar + header + view + mobile bottom nav. Canvas `#F7F3EA`.

### `App.tsx`

```tsx
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
import { GhibliLightingControl } from './components/GhibliLightingControl';
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
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-[#E8DFC8] bg-white text-[#2F5D4A] shadow-sm ${small ? 'h-7 w-7' : 'h-9 w-9'} ${isManager ? 'rounded-[11px]' : 'rounded-full'}`}>
      {identityImage ? (
        <img src={identityImage} alt="Identidad" className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`} />
      ) : (
        <User size={small ? 14 : 16} />
      )}
    </div>
  );

  return (
    <div className="safe-area-x flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#F7F3EA] font-sans text-[#1E2A24] selection:bg-[#B87A24]/25 selection:text-[#1E2A24]">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E8DFC8] bg-white text-[#1E2A24] shadow-sm lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="lg:hidden">
              <Logo size="sm" showText={false} />
            </div>

            <div className="min-w-0">
              <p className="hidden text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B7258] lg:block">
                {isManager ? 'Gestoría' : 'Autónomo'}
              </p>
              <span className="block truncate font-serif text-[1.15rem] font-semibold tracking-[-0.03em] text-[#1E2A24]">
                {getViewTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <GhibliLightingControl />
            </div>
            <button
              onClick={togglePrivacyMode}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                privacyMode
                  ? 'border-[#B87A24]/35 bg-[#FEF7EB] text-[#B87A24]'
                  : 'border-[#E8DFC8] bg-white text-stone-500 hover:text-[#2F5D4A]'
              }`}
              title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <button
              onClick={() => setView('settings')}
              className="flex items-center gap-2 rounded-2xl border border-[#E8DFC8] bg-white p-1 pr-3 text-left shadow-sm transition hover:border-[#2F5D4A]/30"
            >
              <Identity />
              <div className="hidden text-right sm:block">
                <p className="max-w-[190px] truncate text-xs font-extrabold text-[#1E2A24]">
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
                  className={`flex min-w-0 flex-col items-center gap-0.5 rounded-[14px] px-1 py-1.5 transition ${active ? 'text-[#2F5D4A]' : 'text-stone-400'}`}
                >
                  <div className={`relative flex h-8 min-w-10 items-center justify-center rounded-[12px] px-2 transition ${active ? 'bg-[#EBF3ED] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.08)]' : ''}`}>
                    {item.id === 'settings' && identityImage ? (
                      <Identity small />
                    ) : (
                      <Icon size={18} strokeWidth={active ? 2.45 : 2} />
                    )}
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-[#C96846] px-1 text-[9px] font-extrabold text-white">
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

```

## Sidebar — `components/Sidebar.tsx`
Warm parchment aside with Logo, role-aware Spanish nav, identity chip, logout.

### `components/Sidebar.tsx`

```tsx
import React from 'react';
import {
  Bell,
  BookOpen,
  Building2,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Receipt,
  Settings,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';
import { signOutRemote } from '../services/authWorkspace';
import { identityImageStore } from '../services/identityImage';
import { UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: number;
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { currentUser, logout, requirements } = useData();
  const { palette } = useGhibliAtmosphere();
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const identityImage = identityImageStore.getForUser(currentUser);

  const pendingReqCount = requirements.filter((requirement) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.RIDER) {
      return requirement.riderId === currentUser.id && requirement.status === 'pending';
    }
    return requirement.managerId === currentUser.id && requirement.status === 'pending';
  }).length;

  const riderPrimary: NavItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'money', label: 'Ingresos y gastos', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos fiscales', icon: FileText },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount }
  ];

  const riderWorkspace: NavItem[] = [
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'docs', label: 'Documentos', icon: BookOpen },
    { id: 'integrations', label: 'Plataformas', icon: Receipt }
  ];

  const managerPrimary: NavItem[] = [
    { id: 'dashboard', label: 'Resumen', icon: Home },
    { id: 'people', label: 'Clientes', icon: Users },
    { id: 'money', label: 'Auditoría', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos fiscales', icon: FileText },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount }
  ];

  const managerWorkspace: NavItem[] = [
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'docs', label: 'Documentos', icon: BookOpen }
  ];

  const primaryItems = isManager ? managerPrimary : riderPrimary;
  const workspaceItems = isManager ? managerWorkspace : riderWorkspace;

  const handleNavigate = (view: string) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOutRemote();
    } finally {
      logout();
      window.location.reload();
    }
  };

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = currentView === item.id;

      return (
        <button
          key={item.id}
          onClick={() => handleNavigate(item.id)}
          className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-all ${
            active
              ? 'font-bold text-[#1E2A24] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.08)]'
              : 'font-semibold text-[#6B645C] hover:bg-[#F3EEE4] hover:text-[#2A332E]'
          }`}
          style={active ? { background: palette.softgreen } : undefined}
        >
          <span
            className={`absolute left-0 h-5 w-1 rounded-r-full transition ${
              active ? 'bg-[#C96846]' : 'bg-transparent'
            }`}
          />
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
              active
                ? 'text-[#FFFEFB]'
                : 'bg-transparent text-[#8A8278] group-hover:text-[#2F5D4A]'
            }`}
            style={active ? { background: palette.forest } : undefined}
          >
            <Icon size={17} strokeWidth={active ? 2.35 : 2} />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {Boolean(item.badge && item.badge > 0) && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C96846] px-1.5 text-[10px] font-extrabold text-white">
              {item.badge}
            </span>
          )}
        </button>
      );
    });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[#2A332E]/35 backdrop-blur-sm transition-opacity lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{
          borderColor: palette.border,
          background: `linear-gradient(180deg, #FFFEFB 0%, ${palette.parchment} 55%, ${palette.softgreen} 140%)`
        }}
      >
        <div
          className="flex h-[76px] items-center justify-between border-b px-5"
          style={{ borderColor: palette.borderSubtle }}
        >
          <div>
            <Logo size="md" showText variant="light" animated />
            <p
              className="ml-[48px] mt-1 text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: palette.moss }}
            >
              Trabajo claro
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8A8278] hover:bg-[#F0EBE1] lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="px-2 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A9186]">
              {isManager ? 'Gestoría' : 'Tu espacio'}
            </p>
          </div>
          <div className="space-y-1">{renderItems(primaryItems)}</div>

          <div
            className="my-5 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${palette.border}, transparent)`
            }}
          />

          <div className="px-2 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A9186]">
              Comunicación
            </p>
          </div>
          <div className="space-y-1">{renderItems(workspaceItems)}</div>
        </nav>

        <div className="border-t p-4" style={{ borderColor: palette.borderSubtle }}>
          <button
            onClick={() => handleNavigate('settings')}
            className="mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition"
            style={{
              borderColor: currentView === 'settings' ? `${palette.clay}55` : palette.border,
              background: currentView === 'settings' ? palette.warmearth : 'rgba(255,254,251,0.85)'
            }}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border bg-white text-[#2F5D4A] ${
                isManager ? 'rounded-xl' : 'rounded-full'
              }`}
              style={{ borderColor: palette.border }}
            >
              {identityImage ? (
                <img
                  src={identityImage}
                  alt="Identidad"
                  className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`}
                />
              ) : isManager ? (
                <Building2 size={17} />
              ) : (
                <Users size={17} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[#1E2A24]">
                {currentUser?.companyName || currentUser?.name || 'Usuario'}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#8A8278]">
                {isManager ? 'Gestoría' : 'Autónomo'} · {currentUser?.email}
              </p>
            </div>
            <Settings size={15} className="shrink-0 text-[#9A9186]" />
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-[#8A8278] transition hover:bg-[#FAF3EE] hover:text-[#C96846]"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

```
