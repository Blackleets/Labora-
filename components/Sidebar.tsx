import React from 'react';
import { 
  Compass, ScrollText, Feather, Coins, Bike, Send, 
  BookOpen, Stamp, Store, Sliders, Flame, Briefcase, 
  LogOut, X, RefreshCw
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

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { currentUser, logout, switchUser, users, requirements } = useData();
  const { palette } = useGhibliAtmosphere();

  const pendingReqCount = requirements.filter(
    r => (currentUser?.role === UserRole.RIDER ? r.riderId === currentUser.id : true) && r.status === 'pending'
  ).length;

  // Manager / Gestor Menu - Artisanal Hand-Drawn Ghibli Palette
  const managerItems = [
    { section: 'Despacho de Gestoría' },
    { 
      id: 'dashboard', 
      label: 'Panel de Control', 
      icon: Compass, 
      organicShape: 'rounded-[46%_54%_60%_40%/42%_55%_45%_58%]' 
    },
    { 
      id: 'tax-declarations', 
      label: 'Modelos AEAT (130/303)', 
      icon: ScrollText, 
      organicShape: 'rounded-[54%_46%_43%_57%/48%_60%_40%_52%]' 
    },
    { 
      id: 'gestor-requirements', 
      label: 'Peticiones a Riders', 
      icon: Feather, 
      badge: pendingReqCount, 
      organicShape: 'rounded-[40%_60%_52%_48%/56%_44%_56%_44%]' 
    },
    { 
      id: 'money', 
      label: 'Auditoría & Facturación', 
      icon: Coins, 
      organicShape: 'rounded-[52%_48%_46%_54%/46%_54%_48%_52%]' 
    },
    
    { section: 'Cartera de Clientes' },
    { 
      id: 'people', 
      label: 'Clientes Riders (CRM)', 
      icon: Bike, 
      organicShape: 'rounded-[58%_42%_48%_52%/44%_56%_44%_56%]' 
    },
    { 
      id: 'messages', 
      label: 'Comunicaciones', 
      icon: Send, 
      organicShape: 'rounded-[45%_55%_58%_42%/52%_48%_52%_48%]' 
    },
    { 
      id: 'docs', 
      label: 'Libros Oficiales AEAT', 
      icon: BookOpen, 
      organicShape: 'rounded-[50%_50%_42%_58%/48%_52%_46%_54%]' 
    },
    
    { section: 'Taller & Configuración' },
    { 
      id: 'integrations', 
      label: 'Plataformas de Facturación', 
      icon: Stamp, 
      organicShape: 'rounded-[48%_52%_60%_40%/56%_44%_56%_44%]' 
    },
    { 
      id: 'all-modules', 
      label: 'Centro de Módulos', 
      icon: Store, 
      organicShape: 'rounded-[55%_45%_46%_54%/46%_54%_46%_54%]' 
    },
    { 
      id: 'settings', 
      label: 'Ajustes Despacho', 
      icon: Sliders, 
      organicShape: 'rounded-[46%_54%_54%_46%/50%_50%_50%_50%]' 
    },
  ];

  // Rider Menu - Hand-drawn Travel & Guild Metaphors
  const riderItems = [
    { section: 'Ruta Principal' },
    { 
      id: 'dashboard', 
      label: 'Inicio', 
      icon: Compass, 
      organicShape: 'rounded-[46%_54%_60%_40%/42%_55%_45%_58%]' 
    },
    { 
      id: 'money', 
      label: 'Gastos & Ingresos', 
      icon: Coins, 
      organicShape: 'rounded-[52%_48%_46%_54%/46%_54%_48%_52%]' 
    },
    { 
      id: 'tax-declarations', 
      label: 'Modelos AEAT (130/303)', 
      icon: ScrollText, 
      organicShape: 'rounded-[54%_46%_43%_57%/48%_60%_40%_52%]' 
    },
    { 
      id: 'gestor-requirements', 
      label: 'Avisos de mi Gestor', 
      icon: Feather, 
      badge: pendingReqCount, 
      organicShape: 'rounded-[40%_60%_52%_48%/56%_44%_56%_44%]' 
    },
    { 
      id: 'messages', 
      label: 'Mensajes con mi Gestor', 
      icon: Send, 
      organicShape: 'rounded-[45%_55%_58%_42%/52%_48%_52%_48%]' 
    },
    
    { section: 'Gestoría & Fiscalidad' },
    { 
      id: 'docs', 
      label: 'Libro de Facturas & Tickets', 
      icon: BookOpen, 
      organicShape: 'rounded-[50%_50%_42%_58%/48%_52%_46%_54%]' 
    },
    { 
      id: 'integrations', 
      label: 'Apps de Facturación', 
      icon: Stamp, 
      organicShape: 'rounded-[48%_52%_60%_40%/56%_44%_56%_44%]' 
    },
    { 
      id: 'automation', 
      label: 'Asistente IA Fiscal', 
      icon: Flame, 
      organicShape: 'rounded-[44%_56%_50%_50%/54%_46%_52%_48%]' 
    },
    { 
      id: 'all-modules', 
      label: 'Todos los Módulos', 
      icon: Store, 
      organicShape: 'rounded-[55%_45%_46%_54%/46%_54%_46%_54%]' 
    },
    { 
      id: 'settings', 
      label: 'Mi Perfil Fiscal', 
      icon: Sliders, 
      organicShape: 'rounded-[46%_54%_54%_46%/50%_50%_50%_50%]' 
    },
  ];

  const menuItems = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN 
    ? managerItems 
    : riderItems;

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setIsMobileMenuOpen(false);
  };

  const handleToggleRole = () => {
    if (currentUser?.role === UserRole.RIDER) {
      const gestor = users.find(u => u.role === UserRole.MANAGER) || users[1];
      if (gestor) switchUser(gestor.id);
    } else {
      const rider = users.find(u => u.role === UserRole.RIDER) || users[0];
      if (rider) switchUser(rider.id);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#1A2620] text-[#D3E2D8] transform transition-transform duration-300 ease-in-out lg:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        flex flex-col border-r border-[#283830]
      `}>
        {/* SVG filter for organic, hand-drawn ink stroke contours */}
        <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
          <defs>
            <filter id="ghibli-organic-stroke" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>

        {/* Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#283830] justify-between">
          <Logo size="md" variant="dark" showText={true} />
          
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-stone-400 hover:text-white transition-colors">
             <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {menuItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={`sec-${idx}`} className="px-3 mt-6 mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B9687] font-heading font-serif">{item.section}</span>
                  <div className="flex-1 h-px bg-[#283830]"></div>
                </div>
              );
            }

            const isActive = currentView === item.id || currentView.startsWith(item.id + '-');
            return (
              <button
                key={item.id}
                onClick={() => item.id && handleNavClick(item.id)}
                style={isActive ? { backgroundColor: palette.forest } : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-serif font-medium transition-all duration-300 group relative ${
                  isActive 
                    ? 'text-white shadow-md' 
                    : 'text-[#9CB6A8] hover:text-white hover:bg-[#25362E]'
                }`}
              >
                {/* Hand-drawn organic pebble badge wrapping the artisanal icon */}
                {item.icon && (
                  <div 
                    className={`w-7 h-7 flex items-center justify-center shrink-0 transition-all duration-300 ${item.organicShape || 'rounded-xl'} ${
                      isActive
                        ? 'bg-white/20 text-[#FAF7F2] ring-1 ring-white/30 shadow-xs'
                        : 'bg-[#25382E]/80 text-[#A6C4B4] group-hover:text-[#F3F9F5] group-hover:bg-[#2F473A] border border-[#354D40]'
                    }`}
                    style={{
                      filter: 'url(#ghibli-organic-stroke)',
                    }}
                  >
                    <item.icon 
                      size={15} 
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-200 group-hover:scale-110" 
                    />
                  </div>
                )}

                <span className="truncate tracking-wide">{item.label}</span>
                
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="ml-auto px-1.5 py-0.5 bg-[#D9943B] text-white text-[10px] font-bold rounded-full shadow-2xs">
                    {item.badge}
                  </span>
                )}

                {/* Hand-painted golden wax seal dot for active item */}
                {isActive && !item.badge && (
                  <div className="ml-auto w-1.5 h-1.5 bg-[#FAD082] rounded-full shadow-[0_0_6px_rgba(250,208,130,0.6)]"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Role Switcher for seamless evaluation */}
        <div className="px-4 py-2 border-t border-[#283830]">
          <button
            onClick={handleToggleRole}
            className="w-full py-2 px-3 bg-[#24352D] hover:bg-[#2D4238] text-[#D8EADB] rounded-xl text-[11px] font-medium flex items-center justify-between border border-[#354D40] transition-colors"
            title="Alternar entre vista de Rider y vista de Gestor"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw size={13} className="text-[#FAD082]" />
              <span className="font-serif">
                {currentUser?.role === UserRole.RIDER ? 'Cambiar a Gestor' : 'Cambiar a Rider'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#9CB6A8] uppercase">
              {currentUser?.role === UserRole.RIDER ? 'Gestoría' : 'Alex'}
            </span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#283830] bg-[#141E1A]">
          <div className="flex items-center gap-3 px-1">
            <div 
              className={`w-9 h-9 rounded-[48%_52%_58%_42%/44%_56%_44%_56%] flex items-center justify-center text-white font-bold text-xs shadow-md border ${
                currentUser?.role === UserRole.MANAGER 
                  ? 'bg-[#2D4E3E] border-[#48735E] text-[#D8EADB]' 
                  : 'bg-[#2E5A44] border-[#3D7256]'
              }`}
              style={{ filter: 'url(#ghibli-organic-stroke)' }}
            >
              {currentUser?.role === UserRole.MANAGER ? <Briefcase size={16} strokeWidth={1.9} /> : <Bike size={16} strokeWidth={1.9} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif font-bold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-[#8CA597] font-medium truncate">
                {currentUser?.role === UserRole.MANAGER ? 'Gestor Colegiado' : (currentUser?.vehiclePlate || 'Rider Autónomo')}
              </p>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-[#8CA597] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;