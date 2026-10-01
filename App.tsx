import React, { useState } from 'react';
import { Bell, Eye, EyeOff, LayoutDashboard, Menu, Scale, ShieldCheck, User, Wallet } from 'lucide-react';
import { CountryProvider } from './contexts/CountryContext';
import { DataProvider, useData } from './contexts/DataContext';
import { GhibliAtmosphereProvider } from './contexts/GhibliAtmosphereContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { useI18n } from './modules/core/i18n';
import { identityImageStore } from './services/identityImage';
import { UserRole } from './types';
import { pendingRequirementCount } from './services/workspaceDisplay';

import Login from './components/Login';
import { GhibliLightingControl } from './components/GhibliLightingControl';
import Logo from './components/Logo';
import Onboarding from './components/Onboarding';
import RemoteSyncBridge from './components/RemoteSyncBridge';
import OperationalSyncBanner from './components/OperationalSyncBanner';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { BubbleSessionBridge } from './components/orders/BubbleSessionBridge';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const GestorRequirementsWidget = React.lazy(() => import('./components/GestorRequirementsWidget').then(module => ({ default: module.GestorRequirementsWidget })));
const ManagerDashboard = React.lazy(() => import('./components/ManagerDashboard').then(module => ({ default: module.ManagerDashboard })));
const Profile = React.lazy(() => import('./components/Profile'));
const TaxOverview = React.lazy(() => import('./components/TaxOverview').then(module => ({ default: module.TaxOverview })));
const AutomationHub = React.lazy(() => import('./modules/core/hubs/AutomationHub').then(module => ({ default: module.AutomationHub })));
const MoneyHub = React.lazy(() => import('./modules/core/hubs/MoneyHub').then(module => ({ default: module.MoneyHub })));
const OperationsHub = React.lazy(() => import('./modules/core/hubs/OperationsHub').then(module => ({ default: module.OperationsHub })));
const PeopleHub = React.lazy(() => import('./modules/core/hubs/PeopleHub').then(module => ({ default: module.PeopleHub })));
const SettingsHub = React.lazy(() => import('./modules/core/hubs/SettingsHub').then(module => ({ default: module.SettingsHub })));
const IntegrationCatalog = React.lazy(() => import('./modules/integrations/components/IntegrationCatalog').then(module => ({ default: module.IntegrationCatalog })));
const MessagesHub = React.lazy(() => import('./modules/messages/components/MessagesHub').then(module => ({ default: module.MessagesHub })));
const OrderLogView = React.lazy(() => import('./components/orders/OrderLogView').then(module => ({ default: module.OrderLogView })));

const ViewLoading: React.FC = () => (
  <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
    <div className="rounded-2xl border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] px-5 py-3 text-sm font-bold text-[color:var(--labora-muted,#5A7A68)] shadow-sm">
      Cargando espacio…
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const {
    currentUser,
    hasOnboarded,
    completeOnboarding,
    requirements,
    privacyMode,
    togglePrivacyMode
  } = useData();
  const { t } = useI18n();
  const [currentView, setView] = useState(() => currentUser?.role === UserRole.ADMIN ? 'admin' : 'dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return <Login />;
  if (currentUser.role === UserRole.RIDER && !hasOnboarded) {
    return <Onboarding onFinish={completeOnboarding} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isManager = currentUser.role === UserRole.MANAGER || isAdmin;
  const identityImage = identityImageStore.getForUser(currentUser);
  const roleLabel = isAdmin ? 'Administración' : isManager ? t('role.professional') : t('role.worker');
  const pendingReqCount = pendingRequirementCount(currentUser, requirements);

  const getViewTitle = () => {
    const titles: Record<string, string> = {
      dashboard: isManager ? t('nav.summary') : t('nav.home'),
      admin: 'Centro de control',
      money: isManager ? t('nav.audit') : t('nav.money'),
      'money-incomes': isManager ? `${t('nav.audit')} · ${t('nav.income')}` : t('nav.income'),
      'tax-declarations': t('nav.tax'),
      'gestor-requirements': isManager ? t('nav.requests') : t('nav.alerts'),
      operations: t('nav.operations'),
      integrations: t('nav.platforms'),
      automation: t('nav.assistant'),
      people: isAdmin ? 'Usuarios' : t('nav.clients'),
      messages: t('nav.messages'),
      settings: t('nav.settings'),
      profile: t('nav.profile'),
      docs: t('nav.documents'),
      orders: t('nav.orders')
    };
    return titles[currentView] || 'Labora+';
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return isAdmin ? <AdminDashboard /> : isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
      case 'admin': return isAdmin ? <AdminDashboard /> : isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
      case 'money': return <MoneyHub setView={setView} />;
      case 'money-incomes': return <MoneyHub initialTab="incomes" setView={setView} />;
      case 'tax-declarations': return <TaxOverview setView={setView} />;
      case 'gestor-requirements': return <div className="mx-auto max-w-4xl"><GestorRequirementsWidget /></div>;
      case 'operations': return <OperationsHub />;
      case 'integrations': return <IntegrationCatalog />;
      case 'automation': return <AutomationHub />;
      case 'people': return isAdmin ? <AdminDashboard initialTab="users" /> : <PeopleHub />;
      case 'messages': return <MessagesHub />;
      case 'settings': return <SettingsHub />;
      case 'profile': return <Profile />;
      case 'docs': return <MoneyHub initialTab="docs" setView={setView} />;
      case 'orders': return isManager ? <ManagerDashboard setView={setView} /> : <OrderLogView setView={setView} />;
      default: return isAdmin ? <AdminDashboard /> : isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
    }
  };

  const navItems = isAdmin ? [
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'people', label: t('nav.clients'), icon: User },
    { id: 'money', label: t('nav.audit'), icon: Wallet },
    { id: 'gestor-requirements', label: t('nav.requests'), icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: t('nav.settings_short'), icon: User }
  ] : isManager ? [
    { id: 'dashboard', label: t('nav.summary'), icon: LayoutDashboard },
    { id: 'money', label: t('nav.audit'), icon: Wallet },
    { id: 'tax-declarations', label: t('nav.tax_short'), icon: Scale },
    { id: 'gestor-requirements', label: t('nav.requests'), icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: t('nav.settings_manager_short'), icon: User }
  ] : [
    { id: 'dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { id: 'money', label: t('nav.money'), icon: Wallet },
    { id: 'tax-declarations', label: t('nav.tax_short'), icon: Scale },
    { id: 'gestor-requirements', label: t('nav.alerts'), icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: t('nav.settings_short'), icon: User }
  ];

  const Identity = ({ small = false }: { small?: boolean }) => (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] text-[color:var(--labora-primary,#2F5D4A)] shadow-sm ${small ? 'h-7 w-7' : 'h-9 w-9'} ${isManager ? 'rounded-[11px]' : 'rounded-full'}`}>
      {identityImage ? (
        <img src={identityImage} alt={roleLabel} className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`} />
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
        <header className="safe-area-top z-20 flex h-[80px] shrink-0 items-center justify-between border-b border-[color:var(--labora-border,#E8DFC8)]/70 bg-[color:var(--labora-ivory,#FFFEFB)]/82 px-3 backdrop-blur-2xl sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="labora-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] text-[color:var(--labora-ink,#1E2A24)] shadow-sm lg:hidden"
              aria-label={t('common.open_menu')}
            >
              <Menu size={20} />
            </button>

            <div className="lg:hidden">
              <Logo size="sm" showText={false} />
            </div>

            <div className="min-w-0">
              <p className="labora-section-label hidden text-[color:var(--labora-muted,#5A7A68)] lg:block">
                {roleLabel}
              </p>
              <span className="labora-title mt-0.5 block truncate text-[1.3rem] text-[color:var(--labora-ink,#1E2A24)]">
                {getViewTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="shrink-0">
              <GhibliLightingControl />
            </div>
            <button
              onClick={togglePrivacyMode}
              className={`labora-icon-btn flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                privacyMode
                  ? 'border-[color:var(--labora-gold,#B87A24)]/35 bg-[color:var(--labora-soft-clay,#FEF7EB)] text-[color:var(--labora-gold,#B87A24)]'
                  : 'border-[color:var(--labora-border,#E8DFC8)] bg-[color:var(--labora-surface,#FFFEFB)] text-[color:var(--labora-muted,#78716c)] hover:text-[color:var(--labora-primary,#2F5D4A)]'
              }`}
              title={privacyMode ? t('common.show_amounts') : t('common.hide_amounts')}
              aria-label={privacyMode ? t('common.show_amounts') : t('common.hide_amounts')}
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
                  {roleLabel}
                </p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-7 md:px-8 md:py-10">
          <div className="mx-auto min-h-full max-w-7xl min-w-0">
            <OperationalSyncBanner />
            <React.Suspense fallback={<ViewLoading />}>
              {renderView()}
            </React.Suspense>
          </div>
        </div>

        <nav className="safe-area-bottom shrink-0 border-t border-[color:var(--labora-border-hairline,rgba(0,0,0,0.05))] bg-[color:var(--labora-ivory,#FFFEFB)]/95 px-1.5 py-1.5 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex min-w-0 flex-col items-center gap-0.5 rounded-[14px] px-1 py-1.5 transition ${active ? 'text-[color:var(--labora-primary,#2F5D4A)]' : 'text-[color:var(--labora-muted,#A39B90)]'}`}
                >
                  <div className={`relative flex h-8 min-w-10 items-center justify-center rounded-[14px] px-2 transition ${active ? 'bg-[color:var(--labora-moss-soft,#EBF3ED)] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.10),0_1px_0_rgba(255,255,255,0.8)_inset]' : ''}`}>
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
    <DataProvider>
      <CountryProvider>
        <GhibliAtmosphereProvider>
          <RemoteSyncBridge />
          <BubbleSessionBridge />
          <MainLayout />
        </GhibliAtmosphereProvider>
      </CountryProvider>
    </DataProvider>
  </OrganizationProvider>
);

export default App;
