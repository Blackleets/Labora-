import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Bell, Eye, EyeOff, FileText, Home, LayoutDashboard, Menu, MessageSquare, Scale, User, Wallet } from 'lucide-react';
import { CountryProvider } from './contexts/CountryContext';
import { DataProvider, useData } from './contexts/DataContext';
import { GhibliAtmosphereProvider } from './contexts/GhibliAtmosphereContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { identityImageStore } from './services/identityImage';
import { AppView, canOpenView, hashForView, resolveAppView, viewStorageKey } from './services/appNavigation';
import { UserRole } from './types';

import { AppErrorBoundary } from './components/AppErrorBoundary';
import Login from './components/Login';
import Logo from './components/Logo';
import RemoteSyncBridge from './components/RemoteSyncBridge';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

const Dashboard = lazy(() => import('./components/Dashboard'));
const GestorRequirementsWidget = lazy(() => import('./components/GestorRequirementsWidget').then((module) => ({ default: module.GestorRequirementsWidget })));
const GhibliLightingControl = lazy(() => import('./components/GhibliLightingControl').then((module) => ({ default: module.GhibliLightingControl })));
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard').then((module) => ({ default: module.ManagerDashboard })));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Profile = lazy(() => import('./components/Profile'));
const TaxOverview = lazy(() => import('./components/TaxOverview').then((module) => ({ default: module.TaxOverview })));
const AutomationHub = lazy(() => import('./modules/core/hubs/AutomationHub').then((module) => ({ default: module.AutomationHub })));
const MoneyHub = lazy(() => import('./modules/core/hubs/MoneyHub').then((module) => ({ default: module.MoneyHub })));
const OperationsHub = lazy(() => import('./modules/core/hubs/OperationsHub').then((module) => ({ default: module.OperationsHub })));
const PeopleHub = lazy(() => import('./modules/core/hubs/PeopleHub').then((module) => ({ default: module.PeopleHub })));
const SettingsHub = lazy(() => import('./modules/core/hubs/SettingsHub').then((module) => ({ default: module.SettingsHub })));
const IntegrationCatalog = lazy(() => import('./modules/integrations/components/IntegrationCatalog').then((module) => ({ default: module.IntegrationCatalog })));
const MessagesHub = lazy(() => import('./modules/messages/components/MessagesHub').then((module) => ({ default: module.MessagesHub })));

const ViewLoading = () => (
  <div className="mx-auto flex min-h-[45vh] max-w-3xl items-center justify-center px-6" role="status" aria-live="polite">
    <div className="w-full rounded-[24px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-6 shadow-sm">
      <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--labora-moss-soft)]" />
      <div className="mt-5 h-8 w-2/3 animate-pulse rounded-xl bg-[var(--labora-surface-2)]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-[var(--labora-surface-2)]" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded-lg bg-[var(--labora-surface-2)]" />
      <span className="sr-only">Cargando pantalla</span>
    </div>
  </div>
);

const readStoredView = (userId: string) => {
  try {
    return sessionStorage.getItem(viewStorageKey(userId));
  } catch {
    return null;
  }
};

const rememberView = (userId: string, view: AppView) => {
  try {
    sessionStorage.setItem(viewStorageKey(userId), view);
  } catch {
    // Private browsing or a full storage quota must not break navigation.
  }
};

const MainLayout: React.FC = () => {
  const {
    currentUser,
    hasOnboarded,
    completeOnboarding,
    requirements,
    privacyMode,
    togglePrivacyMode
  } = useData();
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const stored = currentUser?.id ? readStoredView(currentUser.id) : null;
    return resolveAppView(window.location.hash, stored, currentUser?.role);
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const setView = useCallback((nextView: string) => {
    if (!currentUser || !canOpenView(nextView, currentUser.role)) return;
    setCurrentView(nextView);
    rememberView(currentUser.id, nextView);
    const nextHash = hashForView(nextView);
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const restoreFromLocation = () => {
      const stored = readStoredView(currentUser.id);
      const resolved = resolveAppView(window.location.hash, stored, currentUser.role);
      setCurrentView(resolved);
      rememberView(currentUser.id, resolved);
    };

    restoreFromLocation();
    window.addEventListener('hashchange', restoreFromLocation);
    return () => window.removeEventListener('hashchange', restoreFromLocation);
  }, [currentUser]);

  if (!currentUser) return <Login />;
  if (currentUser.role === UserRole.RIDER && !hasOnboarded) {
    return <Suspense fallback={<ViewLoading />}><Onboarding onFinish={completeOnboarding} /></Suspense>;
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
      'money-incomes': isManager ? 'Auditoría · Ingresos' : 'Ingresos',
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
      case 'money-incomes': return <MoneyHub initialTab="incomes" setView={setView} />;
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
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'docs', label: 'Documentos', icon: FileText },
    { id: 'money', label: 'Dinero', icon: Wallet },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'settings', label: 'Perfil', icon: User }
  ];

  const Identity = ({ small = false }: { small?: boolean }) => (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] text-[color:var(--labora-primary,#2F5D4A)] shadow-sm ${small ? 'h-7 w-7' : 'h-9 w-9'} ${isManager ? 'rounded-[11px]' : 'rounded-full'}`}>
      {identityImage ? (
        <img src={identityImage} alt="Identidad" className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`} />
      ) : (
        <User size={small ? 14 : 16} />
      )}
    </div>
  );

  return (
    <div className="safe-area-x flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-[color:var(--labora-canvas,#F7F3EA)] font-sans text-[color:var(--labora-ink,#1E2A24)] selection:bg-[color:var(--labora-gold,#B87A24)]/25 selection:text-[color:var(--labora-ink,#1E2A24)]">
      <Toast />
      <Sidebar
        currentView={currentView}
        setView={setView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className={`${!isManager && currentView === 'dashboard' ? 'hidden lg:flex' : 'flex'} safe-area-top z-20 h-[80px] shrink-0 items-center justify-between border-b border-[color:var(--labora-border,#E8DFC8)]/70 bg-[color:var(--labora-ivory,#FFFEFB)]/92 px-3 backdrop-blur-2xl sm:px-5 md:px-8`}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="labora-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] text-[color:var(--labora-ink,#1E2A24)] shadow-sm lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="lg:hidden">
              <Logo size="sm" showText={false} />
            </div>

            <div className="min-w-0">
              <p className="labora-section-label hidden text-[color:var(--labora-muted,#5A7A68)] lg:block">
                {isManager ? 'Gestoría' : 'Autónomo'}
              </p>
              <span className="labora-title mt-0.5 block truncate text-[1.3rem] text-[color:var(--labora-ink,#1E2A24)]">
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
              className={`labora-icon-btn flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                privacyMode
                  ? 'border-[color:var(--labora-gold,#B87A24)]/35 bg-[color:var(--labora-soft-clay,#FEF7EB)] text-[color:var(--labora-gold,#B87A24)]'
                  : 'border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] text-[color:var(--labora-muted,#78716c)] hover:text-[color:var(--labora-primary,#2F5D4A)]'
              }`}
              title={privacyMode ? 'Mostrar importes' : 'Ocultar importes'}
            >
              {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <button
              onClick={() => setView('settings')}
              className="labora-icon-btn flex items-center gap-2 rounded-2xl border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] p-1 pr-3 text-left shadow-sm transition hover:border-[color:var(--labora-primary,#2F5D4A)]/30"
            >
              <Identity />
              <div className="hidden text-right sm:block">
                <p className="max-w-[190px] truncate text-xs font-extrabold text-[color:var(--labora-ink,#1E2A24)]">
                  {currentUser.companyName || currentUser.name}
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400">
                  {isManager ? 'Gestoría' : 'Autónomo'}
                </p>
              </div>
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-x-hidden overflow-y-auto ${!isManager && currentView === 'dashboard' ? 'px-0 py-0 md:px-8 md:py-10' : 'px-4 py-6 md:px-8 md:py-10'}`}>
          <div className="mx-auto min-h-full max-w-7xl min-w-0">
            <AppErrorBoundary resetKey={currentView}>
              <Suspense fallback={<ViewLoading />}>{renderView()}</Suspense>
            </AppErrorBoundary>
          </div>
        </div>

        <nav className="safe-area-bottom shrink-0 border-t border-[#E6DED1] bg-[#FFFCF7]/96 px-2 pb-1.5 pt-2 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex min-w-0 flex-col items-center gap-0.5 px-1 py-1.5 transition ${active ? 'text-[#145039]' : 'text-[#758078]'}`}
                >
                  <div className="relative flex h-8 min-w-10 items-center justify-center px-2">
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
                  {active && <span className="absolute -bottom-1 h-[3px] w-8 rounded-full bg-[#145039]" />}
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
    <DataProvider>
      <CountryProvider>
        <GhibliAtmosphereProvider>
          <RemoteSyncBridge />
          <MainLayout />
        </GhibliAtmosphereProvider>
      </CountryProvider>
    </DataProvider>
  </OrganizationProvider>
);

export default App;
