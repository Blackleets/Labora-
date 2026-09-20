import React from 'react';
import {
  DollarSign, Building, Wallet, FileText,
  Map, AlertTriangle, Zap, Navigation,
  Shield, CheckCircle, MessageSquare,
  Plug, Globe, Settings, Database, Activity,
  Package, Users, LockKeyhole, BarChart2, Calendar
} from 'lucide-react';

interface ModuleCardProps {
  title: string;
  desc: string;
  icon: any;
  color: string;
  onClick?: () => void;
  tags?: string[];
  blocked?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, desc, icon: Icon, color, onClick, tags, blocked }) => (
  <button
    type="button"
    onClick={blocked ? undefined : onClick}
    disabled={blocked}
    className={`flex flex-col text-left p-5 bg-white rounded-[24px] border border-gray-100 shadow-sm h-full transition-all ${
      blocked
        ? 'cursor-not-allowed opacity-80'
        : 'hover:shadow-md hover:border-blue-200 hover:-translate-y-1 group'
    }`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color} ${blocked ? '' : 'group-hover:scale-110 transition-transform'}`}>
      <Icon size={24} />
    </div>
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      {blocked && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em] text-amber-800">
          <LockKeyhole size={10} /> Bloqueado
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 mb-3 leading-relaxed">{desc}</p>

    <div className="mt-auto flex flex-wrap gap-2">
      {tags?.map(tag => (
        <span key={tag} className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border border-gray-100">
          {tag}
        </span>
      ))}
    </div>
  </button>
);

interface ModulesCenterProps {
  setView: (view: string) => void;
}

/**
 * Catalog of product areas. Blocked entries must not sound live (payroll, policies,
 * risks, events, KPIs, live ops). Only real hubs navigate.
 */
export const ModulesCenter: React.FC<ModulesCenterProps> = ({ setView }) => {
  const sections = [
    {
      title: 'Finanzas & Dinero',
      modules: [
        {
          id: 'payroll',
          title: 'Nóminas',
          desc: 'No habilitado. Sin empleados ni recibos de demostración. El producto actual es para autónomos y gestorías.',
          icon: DollarSign,
          color: 'bg-green-50 text-green-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'banking',
          title: 'Bancos',
          desc: 'Open Banking regulado: pendiente. Hoy solo preferencias e importación local de ingresos — sin conexión bancaria real.',
          icon: Building,
          color: 'bg-blue-50 text-blue-600',
          tags: ['MoneyHub'],
          blocked: false,
          navigateTo: 'money'
        },
        {
          id: 'movements',
          title: 'Movimientos',
          desc: 'Ingresos y gastos que tú registras (CSV/texto/manual). Sin sync de plataforma ni banco.',
          icon: Wallet,
          color: 'bg-purple-50 text-purple-600',
          tags: ['MoneyHub'],
          blocked: false,
          navigateTo: 'money'
        },
        {
          id: 'docs',
          title: 'Documentos',
          desc: 'Archivo digital de facturas y modelos fiscales.',
          icon: FileText,
          color: 'bg-orange-50 text-orange-600',
          tags: ['MoneyHub'],
          blocked: false,
          navigateTo: 'docs'
        },
      ]
    },
    {
      title: 'Operaciones & Reparto',
      modules: [
        {
          id: 'delivery',
          title: 'Live Delivery',
          desc: 'No disponible. Sin telemetría ni API de plataforma (Glovo/Uber OAuth no existe en Labora+).',
          icon: Package,
          color: 'bg-indigo-50 text-indigo-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'operations',
          title: 'Mapa Operativo',
          desc: 'Bloqueado hasta datos reales de flota. El hub Operaciones explica el estado con honestidad.',
          icon: Map,
          color: 'bg-cyan-50 text-cyan-600',
          tags: ['OpsHub'],
          blocked: false,
          navigateTo: 'operations'
        },
        {
          id: 'risks',
          title: 'Monitor de Riesgos',
          desc: 'Bloqueado. Sin clima ni demanda inventados; hace falta fuente verificable.',
          icon: AlertTriangle,
          color: 'bg-red-50 text-red-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'events',
          title: 'Eventos masivos',
          desc: 'Bloqueado. Sin «añadido a calendario» simulado ni multiplicadores de demanda inventados.',
          icon: Calendar,
          color: 'bg-fuchsia-50 text-fuchsia-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'kpis',
          title: 'KPIs Pro',
          desc: 'Bloqueado. Sin 160 h ni €/km hardcodeados; métricas solo con evidencia del usuario.',
          icon: BarChart2,
          color: 'bg-sky-50 text-sky-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'hot-zones',
          title: 'Zonas Calientes',
          desc: 'No disponible. Sin heatmap ni surge xN inventados; hace falta feed de demanda verificable.',
          icon: Zap,
          color: 'bg-yellow-50 text-yellow-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'routes',
          title: 'Optimizador Rutas',
          desc: 'No es flota en vivo. Herramienta local/estimación no cableada al producto principal.',
          icon: Navigation,
          color: 'bg-emerald-50 text-emerald-600',
          tags: ['Bloqueado'],
          blocked: true
        },
      ]
    },
    {
      title: 'Automatización & IA',
      modules: [
        {
          id: 'policies',
          title: 'Motor de Políticas',
          desc: 'No disponible. Sin políticas de demostración en localStorage.',
          icon: Shield,
          color: 'bg-slate-100 text-slate-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'approvals',
          title: 'Aprobaciones',
          desc: 'Flujo no cableado a producción. Sin bandeja inventada.',
          icon: CheckCircle,
          color: 'bg-rose-50 text-rose-600',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'ai',
          title: 'Asistente Fiscal IA',
          desc: 'Chat fiscal autenticado (edge function). Si falta Gemini en servidor, falla cerrado.',
          icon: MessageSquare,
          color: 'bg-violet-50 text-violet-600',
          tags: ['AutoHub'],
          blocked: false,
          navigateTo: 'automation'
        },
      ]
    },
    {
      title: 'Sistema & Configuración',
      modules: [
        {
          id: 'integrations',
          title: 'Integraciones',
          desc: 'Catálogo de plataformas: preferencias de actividad, no OAuth ni sync.',
          icon: Plug,
          color: 'bg-teal-50 text-teal-600',
          tags: ['Catalog'],
          blocked: false,
          navigateTo: 'integrations'
        },
        {
          id: 'people',
          title: 'Personas (Clientes)',
          desc: 'Clientes vinculados por email/RPC — sin org enterprise inventada.',
          icon: Users,
          color: 'bg-pink-50 text-pink-600',
          tags: ['CRM'],
          blocked: false,
          navigateTo: 'people'
        },
        {
          id: 'countries',
          title: 'Config. Países',
          desc: 'Variables fiscales por región (configuración de producto, no telemetría).',
          icon: Globe,
          color: 'bg-blue-50 text-blue-800',
          tags: ['SettingsHub'],
          blocked: false,
          navigateTo: 'settings'
        },
        {
          id: 'audit',
          title: 'Audit Log',
          desc: 'No expuesto como módulo en vivo en esta shell.',
          icon: Activity,
          color: 'bg-gray-100 text-gray-700',
          tags: ['Bloqueado'],
          blocked: true
        },
        {
          id: 'settings',
          title: 'Ajustes Generales',
          desc: 'Preferencias, vínculo gestoría y perfil.',
          icon: Settings,
          color: 'bg-gray-50 text-gray-600',
          tags: ['SettingsHub'],
          blocked: false,
          navigateTo: 'settings'
        },
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div className="bg-[#1A1A1A] text-white p-8 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Database className="text-[#2D6CDF]" /> Centro de Módulos
          </h2>
          <p className="text-gray-400 mt-2 max-w-2xl text-lg">
            Índice honesto de áreas de Labora+. Las entradas bloqueadas no simulan producto en vivo
            (nómina, políticas, riesgos, eventos, KPIs, ops en tiempo real).
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600 rounded-full blur-[80px] opacity-20" />
      </div>

      {sections.map((section, idx) => (
        <div key={idx}>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pl-2">
            <span className="w-1.5 h-6 bg-[#2D6CDF] rounded-full block" />
            {section.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.modules.map((mod: any) => (
              <ModuleCard
                key={mod.id}
                title={mod.title}
                desc={mod.desc}
                icon={mod.icon}
                color={mod.color}
                tags={mod.tags}
                blocked={mod.blocked}
                onClick={
                  mod.blocked
                    ? undefined
                    : () => setView(mod.navigateTo || mod.id)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
