import React from 'react';
import {
  Bell,
  Bike,
  BookOpen,
  Briefcase,
  Coins,
  Compass,
  LogOut,
  MessageCircle,
  ScrollText,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';
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

type NavSection = { section: string };

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { currentUser, logout, requirements } = useData();
  const { palette } = useGhibliAtmosphere();

  const pendingReqCount = requirements.filter((requirement) => {
    if (requirement.status !== 'pending') return false;
    return currentUser?.role === UserRole.RIDER ? requirement.riderId === currentUser.id : true;
  }).length;

  const managerItems: Array<NavItem | NavSection> = [
    { section: 'Trabajo diario' },
    { id: 'dashboard', label: 'Panel', icon: Compass },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'money', label: 'Ingresos y gastos', icon: Coins },
    { id: 'tax-declarations', label: 'Revisión fiscal', icon: ScrollText },
    { id: 'docs', label: 'Documentos', icon: BookOpen },
    { section: 'Clientes' },
    { id: 'people', label: 'Autónomos vinculados', icon: Users },
    { id: 'messages', label: 'Mensajes', icon: MessageCircle },
    { section: 'Cuenta' },
    { id: 'settings', label: 'Ajustes', icon: Sliders },
  ];

  const riderItems: Array<NavItem | NavSection> = [
    { section: 'Mi trabajo' },
    { id: 'dashboard', label: 'Inicio', icon: Compass },
    { id: 'money', label: 'Mi dinero', icon: Coins },
    { id: 'gestor-requirements', label: 'Mi gestor', icon: Bell, badge: pendingReqCount },
    { id: 'tax-declarations', label: 'Mis impuestos', icon: ScrollText },
    { id: 'docs', label: 'Mis documentos', icon: BookOpen },
    { id: 'messages', label: 'Mensajes', icon: MessageCircle },
    { section: 'Cuenta' },
    { id: 'settings', label: 'Perfil y ajustes', icon: Sliders },
  ];

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const menuItems = isManager ? managerItems : riderItems;

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-sm transition-opacity lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#283830] bg-[#1A2620] text-[#D3E2D8] transition-transform duration-300 lg:static lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between border-b border-[#283830] px-6">
          <Logo size="md" variant="dark" showText />
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-stone-400 hover:text-white lg:hidden" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {menuItems.map((item, index) => {
            if ('section' in item) {
              return (
                <div key={`${item.section}-${index}`} className="mb-2 mt-6 flex items-center gap-2 px-3 first:mt-0">
                  <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#7B9687]">{item.section}</span>
                  <div className="h-px flex-1 bg-[#283830]" />
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = currentView === item.id || currentView.startsWith(`${item.id}-`);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={isActive ? { backgroundColor: palette.forest } : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${isActive ? 'text-white shadow-md' : 'text-[#9CB6A8] hover:bg-[#25362E] hover:text-white'}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[45%_55%_48%_52%/52%_48%_55%_45%] border ${isActive ? 'border-white/20 bg-white/15 text-white' : 'border-[#354D40] bg-[#25382E] text-[#A6C4B4]'}`}>
                  <Icon size={15} strokeWidth={1.9} />
                </div>
                <span className="truncate font-serif tracking-wide">{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="ml-auto rounded-full bg-[#D9943B] px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#283830] bg-[#141E1A] p-4">
          <div className="flex items-center gap-3 px-1">
            <div className={`flex h-9 w-9 items-center justify-center rounded-[48%_52%_58%_42%/44%_56%_44%_56%] border text-white ${isManager ? 'border-[#48735E] bg-[#2D4E3E]' : 'border-[#3D7256] bg-[#2E5A44]'}`}>
              {isManager ? <Briefcase size={16} /> : <Bike size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-xs font-bold text-white">{currentUser?.name}</p>
              <p className="truncate text-[10px] font-medium text-[#8CA597]">{isManager ? 'Gestoría' : 'Autónomo'}</p>
            </div>
            <button onClick={logout} className="rounded-lg p-1.5 text-[#8CA597] transition-colors hover:bg-red-500/10 hover:text-red-400" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
