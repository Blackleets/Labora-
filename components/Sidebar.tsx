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
  const pendingReqCount = requirements.filter((requirement) => {
    if (currentUser?.role === UserRole.RIDER) {
      return requirement.riderId === currentUser.id && requirement.status === 'pending';
    }
    return requirement.status === 'pending';
  }).length;

  const riderItems: NavItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'money', label: 'Ingresos y gastos', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos fiscales', icon: FileText },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'docs', label: 'Documentos', icon: BookOpen },
    { id: 'integrations', label: 'Plataformas', icon: Receipt },
    { id: 'settings', label: 'Perfil y ajustes', icon: Settings }
  ];

  const managerItems: NavItem[] = [
    { id: 'dashboard', label: 'Resumen', icon: Home },
    { id: 'people', label: 'Clientes', icon: Users },
    { id: 'money', label: 'Auditoría', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos fiscales', icon: FileText },
    { id: 'gestor-requirements', label: 'Peticiones', icon: Bell, badge: pendingReqCount },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'docs', label: 'Documentos', icon: BookOpen },
    { id: 'settings', label: 'Ajustes', icon: Settings }
  ];

  const items = isManager ? managerItems : riderItems;

  const handleNavigate = (view: string) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-[1px] transition-opacity lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-[#E7E0D6] bg-[#FCFAF7] transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#ECE5DB] px-5">
          <Logo size="sm" showText={true} />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-[#F1EDE6] lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-5 pb-2">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
            {isManager ? 'Gestoría' : 'Autónomo'}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[#EAF2ED] font-semibold text-[#245338]'
                      : 'font-medium text-stone-600 hover:bg-[#F4F0EA] hover:text-stone-900'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 2} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C96846] px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[#ECE5DB] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#F6F2EC] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2E5A44] text-white">
              {isManager ? <Building2 size={17} /> : <Users size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-stone-900">
                {currentUser?.companyName || currentUser?.name || 'Usuario'}
              </p>
              <p className="truncate text-[10px] text-stone-500">{currentUser?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E3DBD0] bg-white py-2.5 text-xs font-semibold text-stone-600 hover:bg-[#F7F3ED]"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;