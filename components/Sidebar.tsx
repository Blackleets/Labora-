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

  const renderItems = (items: NavItem[]) => items.map((item) => {
    const Icon = item.icon;
    const active = currentView === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.id)}
        className={`group relative flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm transition-all ${
          active
            ? 'bg-[#E7F0EA] font-bold text-[#0F3D2E] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.08)]'
            : 'font-semibold text-stone-600 hover:bg-[#F3EFE8] hover:text-[#0A1210]'
        }`}
      >
        <span className={`absolute left-0 h-5 w-1 rounded-r-full transition ${active ? 'bg-[#E85D3B]' : 'bg-transparent'}`} />
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] transition ${active ? 'bg-white/80 text-[#0F3D2E]' : 'text-stone-500 group-hover:bg-white/75'}`}>
          <Icon size={17} strokeWidth={active ? 2.35 : 2} />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {Boolean(item.badge && item.badge > 0) && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E85D3B] px-1.5 text-[10px] font-extrabold text-white">
            {item.badge}
          </span>
        )}
      </button>
    );
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[#18211C]/45 backdrop-blur-[2px] transition-opacity lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#E5DDD2] transition-transform duration-200 lg:static lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-[#EAE3D9] px-5">
          <div>
            <Logo size="md" showText animated />
            <p className="mt-1 ml-[48px] text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400">Trabajo claro</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-[#F1EDE6] lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-2 pb-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">{isManager ? 'Gestoría' : 'Tu espacio'}</p>
          </div>
          <div className="space-y-1">{renderItems(primaryItems)}</div>

          <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#DDD4C7] to-transparent" />

          <div className="px-2 pb-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Comunicación y archivo</p>
          </div>
          <div className="space-y-1">{renderItems(workspaceItems)}</div>
        </nav>

        <div className="border-t border-[#EAE3D9] p-4">
          <button
            onClick={() => handleNavigate('settings')}
            className={`mb-3 flex w-full items-center gap-3 rounded-[16px] border p-3 text-left transition ${
              currentView === 'settings'
                ? 'border-[#CFE0D5] bg-[#EAF2ED]'
                : 'border-[#E7DFD4] bg-[#F7F3ED] hover:bg-[#F1ECE4]'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-[#DDD4C8] bg-white text-[#0F3D2E] ${isManager ? 'rounded-xl' : 'rounded-full'}`}>
              {identityImage ? (
                <img src={identityImage} alt="Identidad" className={`h-full w-full ${isManager ? 'object-contain p-1' : 'object-cover'}`} />
              ) : isManager ? (
                <Building2 size={17} />
              ) : (
                <Users size={17} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[#0A1210]">{currentUser?.companyName || currentUser?.name || 'Usuario'}</p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-stone-500">{isManager ? 'Gestoría' : 'Autónomo'} · {currentUser?.email}</p>
            </div>
            <Settings size={15} className="shrink-0 text-stone-400" />
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-stone-500 transition hover:bg-[#F4EFE8] hover:text-[#A84F34]"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
