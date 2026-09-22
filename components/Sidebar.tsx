import React, { useMemo } from 'react';
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
  ShieldCheck,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';
import { unreadIncomingCount } from '../modules/messages/messagingRules';
import { offlineFallbackFor } from '../modules/messages/repositories/messageCache';
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
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const identityImage = identityImageStore.getForUser(currentUser);

  const pendingReqCount = requirements.filter((requirement) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.RIDER) {
      return requirement.riderId === currentUser.id && requirement.status === 'pending';
    }
    return requirement.managerId === currentUser.id && requirement.status === 'pending';
  }).length;

  // Cheap unread: per-user offline cache only (no extra network). Best-effort.
  const unreadMessages = useMemo(() => {
    if (!currentUser?.id) return 0;
    return unreadIncomingCount(offlineFallbackFor(currentUser.id), currentUser.id);
  }, [currentUser?.id, currentView]);

  const riderPrimary: NavItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'money', label: 'Ingresos y gastos', icon: Wallet },
    { id: 'tax-declarations', label: 'Modelos fiscales', icon: FileText },
    { id: 'gestor-requirements', label: 'Avisos', icon: Bell, badge: pendingReqCount }
  ];

  const riderWorkspace: NavItem[] = [
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, badge: unreadMessages },
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
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, badge: unreadMessages },
    { id: 'docs', label: 'Documentos', icon: BookOpen },
    ...(isAdmin ? [{ id: 'admin', label: 'Centro de administración', icon: ShieldCheck }] : [])
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
          className={`group flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left text-[13.5px] tracking-[-0.01em] transition-all ${
            active
              ? 'bg-[var(--labora-moss-soft)] font-semibold text-[var(--labora-primary)] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.10)]'
              : 'font-medium text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)]/90 hover:text-[var(--labora-ink-soft)]'
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition ${
              active
                ? 'bg-[var(--labora-surface)]/80 text-[var(--labora-primary)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_3px_rgba(47,93,74,0.08)]'
                : 'bg-transparent text-[var(--labora-muted)] group-hover:text-[var(--labora-primary)]'
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2.35 : 2} />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {Boolean(item.badge && item.badge > 0) && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--labora-clay)] px-1.5 text-[10px] font-extrabold text-white">
              {item.badge}
            </span>
          )}
        </button>
      );
    });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[var(--labora-ink-soft)]/35 backdrop-blur-sm transition-opacity lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`labora-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{
          borderColor: palette.border,
          background: `linear-gradient(180deg, var(--labora-ivory) 0%, var(--labora-parchment) 60%, var(--labora-surface-2) 100%)`
        }}
      >
        <div
          className="flex h-[84px] items-center justify-between border-b px-5"
          style={{ borderColor: palette.borderSubtle }}
        >
          <div>
            <Logo size="md" showText variant="light" animated />
            <p
              className="labora-section-label ml-[48px] mt-1.5"
              style={{ color: palette.moss }}
            >
              Claridad fiscal
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)] lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 py-6">
          <div className="px-2.5 pb-3">
            <p className="labora-section-label">
              {isManager ? 'Gestoría' : 'Tu espacio'}
            </p>
          </div>
          <div className="space-y-1.5">{renderItems(primaryItems)}</div>

          <div
            className="my-7 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${palette.border}, transparent)`
            }}
          />

          <div className="px-2.5 pb-3">
            <p className="labora-section-label">
              Comunicación
            </p>
          </div>
          <div className="space-y-1.5">{renderItems(workspaceItems)}</div>
        </nav>

        <div className="border-t p-5" style={{ borderColor: palette.borderSubtle }}>
          <button
            onClick={() => handleNavigate('settings')}
            className="mb-3 flex w-full items-center gap-3 rounded-[20px] border p-3.5 text-left transition shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_24px_rgba(47,93,74,0.04)]"
            style={{
              borderColor: currentView === 'settings' ? `${palette.clay}55` : palette.border,
              background: currentView === 'settings'
                ? 'linear-gradient(180deg, var(--labora-soft-clay) 0%, var(--labora-soft-clay) 100%)'
                : 'linear-gradient(180deg, var(--labora-ivory) 0%, var(--labora-parchment) 100%)'
            }}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border bg-[var(--labora-surface)] text-[var(--labora-primary)] ${
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
              <p className="truncate text-xs font-extrabold text-[var(--labora-ink)]">
                {currentUser?.companyName || currentUser?.name || 'Usuario'}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--labora-muted)]">
                {isManager ? 'Gestoría' : 'Trabajador'} · {currentUser?.email}
              </p>
            </div>
            <Settings size={15} className="shrink-0 text-[var(--labora-muted)]" />
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-[var(--labora-muted)] transition hover:bg-[var(--labora-soft-clay)] hover:text-[var(--labora-clay)]"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
