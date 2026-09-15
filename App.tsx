import React, { useState } from 'react';
import { 
  Menu, X, Compass, Coins, ScrollText, Feather, Sliders,
  Briefcase, Bike, Plus, Sparkles, MapPin, Search, Fuel,
  Eye, EyeOff, RefreshCw, Bell, User
} from 'lucide-react';
import { DataProvider, useData } from './contexts/DataContext';
import { CountryProvider } from './contexts/CountryContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { GhibliAtmosphereProvider, useGhibliAtmosphere } from './contexts/GhibliAtmosphereContext';
import { UserRole } from './types';

// Components
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

// Hubs
import { MoneyHub } from './modules/core/hubs/MoneyHub';
import { OperationsHub } from './modules/core/hubs/OperationsHub';
import { AutomationHub } from './modules/core/hubs/AutomationHub';
import { SettingsHub } from './modules/core/hubs/SettingsHub';
import { PeopleHub } from './modules/core/hubs/PeopleHub';
import { MessagesHub } from './modules/messages/components/MessagesHub';
import { IntegrationCatalog } from './modules/integrations/components/IntegrationCatalog';
import { ModulesCenter } from './modules/core/components/ModulesCenter';

const MainLayout: React.FC = () => {
  const { currentUser, hasOnboarded, completeOnboarding, requirements, switchUser, users, privacyMode, togglePrivacyMode } = useData();
  const { palette } = useGhibliAtmosphere();
  const [currentView, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalGasModalOpen, setIsGlobalGasModalOpen] = useState(false);

  if (!currentUser) return <Login />;
  
  if (currentUser.role === UserRole.RIDER && !hasOnboarded) {
    return <Onboarding onFinish={completeOnboarding} />;
  }

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const pendingReqCount = requirements.filter(
    r => (currentUser.role === UserRole.RIDER ? r.riderId === currentUser.id : true) && r.status === 'pending'
  ).length;

  const handleToggleRole = () => {
    if (currentUser.role === UserRole.RIDER) {
      const gestor = users.find(u => u.role === UserRole.MANAGER) || users[1];
      if (gestor) switchUser(gestor.id);
    } else {
      const rider = users.find(u => u.role === UserRole.RIDER) || users[0];
      if (rider) switchUser(rider.id);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return isManager ? 'Panel Despacho Gestoría' : 'Inicio';
      case 'money': return isManager ? 'Auditoría & Facturación' : 'Gastos & Ingresos';
      case 'tax-declarations': return 'Modelos AEAT (130 / 303)';
      case 'gestor-requirements': return isManager ? 'Peticiones a Riders' : 'Avisos de mi Gestor';
      case 'operations': return 'Rutas & Operaciones';
      case 'integrations': return 'Plataformas de Reparto';
      case 'automation': return 'Asistente IA Fiscal';
      case 'all-modules': return 'Centro de Módulos';
      case 'people': return 'Clientes Riders (CRM)';
      case 'messages': return 'Comunicaciones';
      case 'settings': return 'Ajustes & Configuración';
      case 'profile': return 'Mi Perfil';
      case 'docs': return 'Expediente Digital';
      default: return 'Panel';
    }
  };

  const renderView = () => {
    switch (currentView) {
      // --- CORE SECTIONS ---
      case 'dashboard': 
        return isManager 
          ? <ManagerDashboard setView={setView} /> 
          : <Dashboard setView={setView} />;
      
      case 'money': 
        return <MoneyHub setView={setView} />;
      
      case 'tax-declarations': 
        return <TaxDeclarationsViewer setView={setView} />;
      
      case 'gestor-requirements': 
        return (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => setView('dashboard')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                ← Volver al Panel
              </button>
            </div>
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
      
      default: 
        return isManager ? <ManagerDashboard setView={setView} /> : <Dashboard setView={setView} />;
    }
  };

  const riderNavItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'money', label: 'Dinero', icon: Wallet },
    { id: 'tax-declarations', label: 'AEAT', icon: Scale },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount },
    { id: 'settings', label: 'Perfil', icon: User },
  ];

  const managerNavItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'tax-declarations', label: 'Modelos', icon: Scale },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'money', label: 'Auditoría', icon: Wallet },
    { id: 'settings', label: 'Ajustes', icon: User },
  ];

  const navItems = isManager ? managerNavItems : riderNavItems;

  return (
    <div 
      className="flex h-screen font-sans text-stone-800 overflow-hidden selection:bg-[#EAF2ED] selection:text-[#245338] transition-colors duration-500"
      style={{ backgroundColor: palette.canvas }}
    >
      <Toast />
      
      {/* Sidebar - Desktop */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Main Container */}
      <main 
        className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: palette.canvas }}
      >
        {/* Soft Ghibli Ambient Light Sky Vignette */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 opacity-70 transition-all duration-700" 
          style={{ background: palette.ambientGradient }}
        />
        
        {/* Universal Top Header Bar (Desktop & Mobile) */}
        <header 
          className="border-b px-4 md:px-8 py-3 flex items-center justify-between z-20 shrink-0 shadow-[0_1px_4px_rgba(70,55,40,0.03)] transition-colors duration-500 relative"
          style={{ backgroundColor: palette.card, borderColor: palette.border }}
        >
          {/* Left: Mobile hamburger or breadcrumb */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-stone-600 hover:bg-[#F2EDE4] rounded-xl transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-heading">
                Labora+
              </span>
              <span className="text-stone-300">/</span>
              <span className="text-sm font-serif font-bold text-stone-900">
                {getViewTitle()}
              </span>
            </div>

            <div className="sm:hidden">
              <Logo size="sm" showText={false} />
            </div>
          </div>

          {/* Right: Ghibli Lighting, Role Switcher, Quick Action, Privacy Toggle & User */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Ghibli Lighting Atmosphere Selector */}
            <GhibliLightingControl />

            {/* Instant Role Switcher Toggle Button */}
            <button
              onClick={handleToggleRole}
              className="px-2.5 sm:px-3 py-1.5 bg-[#F2EDE4] hover:bg-[#E8E1D3] text-stone-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-[#E0D7C7]"
              title="Alternar entre perfil de Rider autónomo y perfil de Gestoría"
            >
              <RefreshCw size={13} className="text-[#2E5A44] shrink-0" />
              <span className="hidden md:inline">
                {isManager ? 'Ver como Rider' : 'Ver como Gestor'}
              </span>
              <span className="md:hidden">
                {isManager ? 'Rider' : 'Gestor'}
              </span>
            </button>

            {/* Privacy Mode Masking */}
            <button
              onClick={togglePrivacyMode}
              className={`p-2 rounded-xl border transition-colors ${
                privacyMode 
                  ? 'bg-[#FEF7EB] border-[#FDE3B8] text-[#85531B]' 
                  : 'bg-[#FCFAF7] border-[#EAE3D6] text-stone-500 hover:bg-[#F2EDE4]'
              }`}
              title={privacyMode ? 'Mostrar importes monetarios' : 'Ocultar importes (Modo Privacidad)'}
            >
              {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {/* Quick Action Button */}
            {!isManager ? (
              <button
                onClick={() => setIsGlobalGasModalOpen(true)}
                className="px-3 py-1.5 bg-[#D96B43] hover:bg-[#C25832] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors active:scale-95"
              >
                <Fuel size={14} />
                <span className="hidden sm:inline">+ Ticket Gasolinera</span>
                <span className="sm:hidden">+ Ticket</span>
              </button>
            ) : (
              <button
                onClick={() => setView('gestor-requirements')}
                className="px-3 py-1.5 bg-[#2E5A44] hover:bg-[#254A37] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors active:scale-95"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Requerimiento</span>
                <span className="sm:hidden">+ Aviso</span>
              </button>
            )}

            {/* Notifications with counter */}
            <button
              onClick={() => setView('gestor-requirements')}
              className="p-2 relative bg-[#FCFAF7] border border-[#EAE3D6] hover:bg-[#F2EDE4] text-stone-600 rounded-xl transition-colors"
              title="Ver notificaciones y peticiones"
            >
              <Bell size={16} />
              {pendingReqCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D9943B] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {pendingReqCount}
                </span>
              )}
            </button>

            {/* User Pill */}
            <div 
              onClick={() => setView('settings')}
              className="flex items-center space-x-2 pl-1 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                isManager ? 'bg-[#3A7596]' : 'bg-[#2E5A44]'
              }`}>
                {isManager ? <Briefcase size={14} /> : <Bike size={14} />}
              </div>
            </div>

          </div>
        </header>

        {/* Scrollable Content View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto min-h-full">
            {renderView()}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden bg-white border-t border-slate-200 px-4 py-2.5 flex justify-around items-center z-30 safe-area-bottom shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center gap-1 transition-all relative py-1 px-3 rounded-lg ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-amber-500 text-slate-900 text-[8px] font-black rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* Global Gasoline Photo Modal accessible anywhere */}
      <GasStationCaptureModal
        isOpen={isGlobalGasModalOpen}
        onClose={() => setIsGlobalGasModalOpen(false)}
      />
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
