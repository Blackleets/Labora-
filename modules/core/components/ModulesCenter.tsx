
import React from 'react';
import { 
  DollarSign, Building, Wallet, FileText, 
  Map, AlertTriangle, Zap, Navigation, 
  Shield, CheckCircle, MessageSquare, 
  Plug, Globe, Settings, Database, Activity,
  Package, Truck, Users, BarChart2
} from 'lucide-react';

interface ModuleCardProps {
  title: string;
  desc: string;
  icon: any;
  color: string;
  onClick: () => void;
  tags?: string[];
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, desc, icon: Icon, color, onClick, tags }) => (
  <button 
    onClick={onClick}
    className="flex flex-col text-left p-5 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all group h-full"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
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

export const ModulesCenter: React.FC<ModulesCenterProps> = ({ setView }) => {
  const sections = [
    {
      title: "Finanzas & Dinero",
      modules: [
        { id: 'payroll', title: 'Nóminas (Payroll)', desc: 'Cálculo de recibos, IRPF y Seguridad Social.', icon: DollarSign, color: 'bg-green-50 text-green-600', tags: ['MoneyHub', 'RRHH'] },
        { id: 'banking', title: 'Bancos Conectados', desc: 'Sincronización PSD2 con BBVA, Santander, Revolut, etc.', icon: Building, color: 'bg-blue-50 text-blue-600', tags: ['MoneyHub', 'API'] },
        { id: 'movements', title: 'Movimientos', desc: 'Control de ingresos y gastos deducibles.', icon: Wallet, color: 'bg-purple-50 text-purple-600', tags: ['MoneyHub', 'Contabilidad'] },
        { id: 'docs', title: 'Documentos', desc: 'Archivo digital de facturas y modelos fiscales.', icon: FileText, color: 'bg-orange-50 text-orange-600', tags: ['MoneyHub', 'Legal'] },
      ]
    },
    {
      title: "Operaciones & Reparto",
      modules: [
        { id: 'delivery', title: 'Live Delivery', desc: 'Tracking de pedidos y estado de flota en tiempo real.', icon: Package, color: 'bg-indigo-50 text-indigo-600', tags: ['OpsHub', 'RealTime'] },
        { id: 'operations', title: 'Mapa Operativo', desc: 'Visualización geoespacial de activos y rutas.', icon: Map, color: 'bg-cyan-50 text-cyan-600', tags: ['OpsHub', 'GPS'] },
        { id: 'risks', title: 'Monitor de Riesgos', desc: 'Alertas de clima, tráfico y seguridad.', icon: AlertTriangle, color: 'bg-red-50 text-red-600', tags: ['OpsHub', 'Safety'] },
        { id: 'hot-zones', title: 'Zonas Calientes', desc: 'Predicción de demanda y multiplicadores.', icon: Zap, color: 'bg-yellow-50 text-yellow-600', tags: ['OpsHub', 'Demand'] },
        { id: 'routes', title: 'Optimizador Rutas', desc: 'Calculadora de rentabilidad por trayecto.', icon: Navigation, color: 'bg-emerald-50 text-emerald-600', tags: ['OpsHub', 'Efficiency'] },
      ]
    },
    {
      title: "Automatización & IA",
      modules: [
        { id: 'policies', title: 'Motor de Políticas', desc: 'Reglas de negocio automáticas (Policy Engine).', icon: Shield, color: 'bg-slate-100 text-slate-600', tags: ['AutoHub', 'Enterprise'] },
        { id: 'approvals', title: 'Aprobaciones', desc: 'Gestión de bloqueos y validaciones manuales.', icon: CheckCircle, color: 'bg-rose-50 text-rose-600', tags: ['AutoHub', 'Workflow'] },
        { id: 'ai', title: 'Asistente Fiscal IA', desc: 'Chatbot experto en normativa local.', icon: MessageSquare, color: 'bg-violet-50 text-violet-600', tags: ['AutoHub', 'GenAI'] },
      ]
    },
    {
      title: "Sistema & Configuración",
      modules: [
        { id: 'integrations', title: 'Integraciones', desc: 'Conexión con Apps de Reparto (Uber, Glovo) y herramientas.', icon: Plug, color: 'bg-teal-50 text-teal-600', tags: ['Catalog', 'Apps'] },
        { id: 'people', title: 'Personas (Clientes)', desc: 'Gestión de usuarios, riders y perfiles.', icon: Users, color: 'bg-pink-50 text-pink-600', tags: ['CRM', 'Management'] },
        { id: 'countries', title: 'Config. Países', desc: 'Editor de variables fiscales y normativas por región.', icon: Globe, color: 'bg-blue-50 text-blue-800', tags: ['SettingsHub', 'Global'] },
        { id: 'audit', title: 'Audit Log', desc: 'Registro inmutable de eventos del sistema.', icon: Activity, color: 'bg-gray-100 text-gray-700', tags: ['SettingsHub', 'Compliance'] },
        { id: 'settings', title: 'Ajustes Generales', desc: 'Preferencias de la aplicación.', icon: Settings, color: 'bg-gray-50 text-gray-600', tags: ['SettingsHub'] },
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
             Índice completo de funcionalidades de Labora+ Core. Accede directamente a cualquier herramienta del ecosistema sin navegar por menús.
           </p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600 rounded-full blur-[80px] opacity-20"></div>
      </div>

      {sections.map((section, idx) => (
        <div key={idx}>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pl-2">
            <span className="w-1.5 h-6 bg-[#2D6CDF] rounded-full block"></span>
            {section.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.modules.map(mod => (
              <ModuleCard 
                key={mod.id}
                {...mod}
                onClick={() => setView(mod.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
