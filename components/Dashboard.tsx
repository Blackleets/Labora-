import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useCountry } from '../contexts/CountryContext';
import { 
  ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, 
  PiggyBank, Fuel, FileText, Building2, 
  CheckCircle2, ChevronRight, Bike, Bell,
  Sparkles, ExternalLink, Sun, Leaf, ShieldCheck,
  Calendar, Check, Navigation, AlertCircle, Scale, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CountrySelector from './CountrySelector';
import { GasStationCaptureModal } from './GasStationCaptureModal';
import { UserRole } from '../types';
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';

interface DashboardProps {
  setView?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements, switchUser, users } = useData();
  const { selectedCountry } = useCountry();
  const { timeOfDay, season, palette, title: atmosphereTitle, filmInspiration } = useGhibliAtmosphere();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  const getTimeGreeting = () => {
    switch (timeOfDay) {
      case 'dawn': return 'Buenos días de rocío';
      case 'midday': return 'Buen camino bajo el sol';
      case 'golden_hour': return 'Buena tarde al atardecer';
      case 'night': return 'Serena noche en ruta';
    }
  };

  const summary = useMemo(() => getFiscalSummary(currentUser?.id || 'u1'), [currentUser, getFiscalSummary]);
  
  const pendingRequirements = requirements.filter(
    r => r.riderId === currentUser?.id && r.status === 'pending'
  );

  // Weekly data
  const data = [
    { name: 'Lun', full: 'Lunes', ingresos: 120, gastos: 10 },
    { name: 'Mar', full: 'Martes', ingresos: 150, gastos: 20 },
    { name: 'Mié', full: 'Miércoles', ingresos: 180, gastos: 15 },
    { name: 'Jue', full: 'Jueves', ingresos: 100, gastos: 50 },
    { name: 'Vie', full: 'Viernes', ingresos: 220, gastos: 30 },
    { name: 'Sáb', full: 'Sábado', ingresos: 300, gastos: 40 },
    { name: 'Dom', full: 'Domingo', ingresos: 280, gastos: 25 },
  ];

  const formatCurrency = (amount: number) => {
    if (privacyMode) return '••••';
    return amount.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: selectedCountry.currency || 'EUR',
      maximumFractionDigits: 0 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = data.find(d => d.name === label);
      const dayName = dayData ? dayData.full : label;

      return (
        <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E3DBD0] shadow-lg min-w-[170px] text-stone-800">
          <p className="font-serif font-bold text-stone-900 mb-2 border-b border-[#EAE3D6] pb-1.5 text-xs flex items-center justify-between">
            <span>{dayName}</span>
            <span className="text-[10px] text-stone-500 font-sans font-normal">3T 2026</span>
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-stone-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B7258]"></span> Ingresos
              </span>
              <span className="font-bold text-stone-900">{formatCurrency(payload[0].value)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-stone-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D66847]"></span> Gastos
              </span>
              <span className="font-bold text-stone-900">{formatCurrency(payload[1].value)}</span>
            </div>
            {!privacyMode && (
              <div className="pt-2 mt-1 border-t border-[#EAE3D6] flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Neto Limpio</span>
                <span className="font-bold text-[#2E5A44]">
                  {formatCurrency(payload[0].value - payload[1].value)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="rider-dashboard" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      
      {/* 1. GHIBLI SCENIC WELCOME BANNER (DYNAMISED WITH TIME & SEASON) */}
      <div 
        className="relative overflow-hidden rounded-3xl shadow-[0_4px_20px_-4px_rgba(70,55,40,0.06)] p-6 md:p-8 transition-colors duration-700 border"
        style={{ 
          backgroundColor: palette.parchment, 
          borderColor: palette.border 
        }}
      >
        {/* Soft atmospheric background art: rolling meadows and morning/afternoon/night celestial light */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-50 md:opacity-85 overflow-hidden">
          <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-10 -bottom-6 w-[560px] h-[200px] transition-all duration-700">
            {/* Celestial Body: Sun or Moon according to time of day */}
            {timeOfDay === 'night' ? (
              <g className="transition-all duration-700">
                <circle cx="680" cy="50" r="34" fill={palette.sunGlow} fillOpacity="0.25" />
                <path d="M685 30C675 35 668 45 668 58C668 71 675 81 685 86C673 84 662 73 662 58C662 43 673 32 685 30Z" fill={palette.sunFill} fillOpacity="0.9" />
                {/* Firefly Starlight Points */}
                <circle cx="615" cy="38" r="2" fill="#E8F4F8" fillOpacity="0.75" />
                <circle cx="645" cy="72" r="1.5" fill="#E8F4F8" fillOpacity="0.6" />
                <circle cx="735" cy="32" r="2" fill="#E8F4F8" fillOpacity="0.7" />
                <circle cx="720" cy="78" r="1.5" fill="#E8F4F8" fillOpacity="0.8" />
              </g>
            ) : (
              <g className="transition-all duration-700">
                <circle cx="680" cy="50" r="38" fill={palette.sunGlow} fillOpacity="0.45" />
                <circle cx="680" cy="50" r="26" fill={palette.sunFill} fillOpacity="0.75" />
              </g>
            )}

            {/* Rolling Gentle Hills with dynamic lighting hues */}
            <path d="M400 240C460 160 540 140 640 170C720 195 760 210 820 240H400Z" fill={palette.hillFar} fillOpacity="0.30" className="transition-colors duration-700"/>
            <path d="M490 240C570 180 660 175 730 200C780 218 820 230 860 240H490Z" fill={palette.hillMid} fillOpacity="0.26" className="transition-colors duration-700"/>
            <path d="M350 240C430 190 510 180 610 210C680 230 730 235 800 240H350Z" fill={palette.hillNear} fillOpacity="0.38" className="transition-colors duration-700"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2.5 max-w-2xl">
            
            {/* Friendly Badge Strip */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Atmospheric Lighting Pill */}
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-serif font-semibold rounded-full border transition-colors duration-500 shadow-2xs"
                style={{ 
                  backgroundColor: palette.softgreen, 
                  borderColor: palette.bordergreen, 
                  color: palette.deepforest 
                }}
              >
                <Sparkles size={12} style={{ color: palette.moss }} />
                <span>Atmósfera: {atmosphereTitle.split(' ')[0]} ({filmInspiration.split(' ')[0]})</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBF3ED] text-[#245338] text-xs font-serif font-semibold rounded-full border border-[#D0E5D7]">
                <Leaf size={12} className="text-[#3B7258]" />
                <span>Autónomo IAE {currentUser?.iaeCode ? currentUser.iaeCode.split(' ')[0] : '849.5'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF7EB] text-[#85531B] text-xs font-serif font-semibold rounded-full border border-[#FDE3B8]">
                <Sun size={12} className="text-[#D9943B]" />
                <span>{currentUser?.socialSecurityType === 'tarifa_plana' ? 'Tarifa Plana RETA (80€/mes)' : 'RETA General'}</span>
              </span>

              <span className="inline-flex items-center px-2.5 py-1 bg-[#F2EDE4] text-stone-700 text-xs font-mono font-medium rounded-full border border-[#E3DBD0]">
                NIF {currentUser?.nif || '48192834K'}
              </span>
            </div>

            {/* Main Greeting with Literary Warmth */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2824] tracking-tight">
                {getTimeGreeting()}, {currentUser?.name || 'Alex'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Tu actividad de reparto está respaldada: vehículo afecto <strong className="text-stone-800 font-semibold">{currentUser?.vehicleType?.toUpperCase() || 'MOTO'} ({currentUser?.vehiclePlate || '4521 LBR'})</strong> con justificación de combustible <strong style={{ color: palette.forest }} className="font-semibold">100% deducible en IRPF e IVA</strong>.
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-end">
            <CountrySelector />
            <button 
              onClick={() => setView?.('tax-declarations')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-serif font-semibold shadow-sm transition-all active:scale-95"
              style={{ backgroundColor: palette.forest }}
            >
              <FileText size={15} /> 
              <span>Modelos AEAT</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TRES ACCIONES EN RUTA (Clean, Warm, Meaningful Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Fast Action 1: Repostaje Gasolinera (Warm Terracotta / Apricot) */}
        <button
          onClick={() => setIsGasModalOpen(true)}
          className="group relative p-5 bg-[#FAF3EE] hover:bg-[#F6EBE4] border border-[#EAD6C9] rounded-2xl text-left transition-all active:scale-98 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#C96846] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Fuel size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-bold text-sm text-stone-900 truncate">Ticket Gasolinera</span>
                <span className="text-[10px] bg-[#C96846]/15 text-[#9C4B30] px-1.5 py-0.2 rounded-md font-medium">Foto + OCR</span>
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">Deducción 100% con matrícula</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Fast Action 2: Modelos 130 & 303 (Warm Forest Moss) */}
        <button
          onClick={() => setView?.('tax-declarations')}
          className="group relative p-5 bg-[#F1F6F2] hover:bg-[#E8F0EA] border border-[#D4E3D7] rounded-2xl text-left transition-all active:scale-98 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#2E5A44] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-bold text-sm text-stone-900 truncate">Modelos 130 & 303</span>
                <span className="text-[10px] bg-[#2E5A44]/15 text-[#245338] px-1.5 py-0.2 rounded-md font-medium">Trimestre 3T</span>
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">IRPF (20%) y liquidación de IVA</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Fast Action 3: Asesor / Gestoría Conectada (Muted Sky Azure) */}
        <div 
          onClick={() => setView?.('gestor-requirements')}
          className="group relative p-5 bg-[#F2F7F9] hover:bg-[#EAF1F4] border border-[#D5E3E8] rounded-2xl text-left transition-all active:scale-98 shadow-sm flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#3A7596] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-bold text-sm text-stone-900 truncate">Gestoría Pérez</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">Col. 9421 • Asesor Asignado</p>
            </div>
          </div>
          <div className="shrink-0 pl-2">
            {pendingRequirements.length > 0 ? (
              <span className="px-2 py-1 bg-[#FEF2E2] text-[#B45309] text-[10px] font-serif font-bold rounded-lg flex items-center space-x-1 border border-[#FCD34D]">
                <Bell size={10} />
                <span>{pendingRequirements.length} aviso</span>
              </span>
            ) : (
              <span className="text-[10px] font-serif font-semibold text-[#2E5A44] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#D0E5D7]">
                Al día
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 3. ALERTA DE REQUERIMIENTOS DEL GESTOR (IF PENDING) */}
      {pendingRequirements.length > 0 && (
        <div className="p-4 bg-[#FFF9EE] border border-[#F5DCB3] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3D6] text-[#B45309] flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-xs font-serif font-bold text-stone-900">
                Tu gestor solicita documentación para la liquidación ({pendingRequirements[0].title})
              </p>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Plazo límite: {pendingRequirements[0].deadline} • {pendingRequirements[0].description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setView?.('gestor-requirements')}
            className="px-3.5 py-1.5 bg-[#C96846] hover:bg-[#A84A2A] text-white rounded-xl text-xs font-serif font-semibold shrink-0 transition-colors shadow-sm"
          >
            Subsanar ahora
          </button>
        </div>
      )}

      {/* 4. CUATRO PILARES FINANCIEROS (Organized, High-Readability Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Ingresos Brutos */}
        <div 
          onClick={() => setView?.('money')}
          className="bg-[#FCFAF7] hover:bg-white p-5 rounded-2xl border border-[#EBE3D5] hover:border-[#D0C4B0] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2ED] text-[#2E5A44] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet size={18} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-serif font-semibold text-[#2E5A44] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#D0E5D7]">
              <ArrowUpRight size={11} /> +12%
            </span>
          </div>
          <p className="text-stone-500 font-serif text-[11px] font-semibold tracking-wider uppercase">Ingresos Facturados</p>
          <h3 className="text-2xl font-bold font-serif text-stone-900 tracking-tight mt-1">{formatCurrency(summary.totalIncome)}</h3>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1 group-hover:text-stone-600 transition-colors">
            <span>Ver apps vinculadas</span> <ChevronRight size={11} />
          </p>
        </div>

        {/* Gastos & Combustible (Warm Terracotta accent) */}
        <div 
          onClick={() => setView?.('money')}
          className="bg-[#FCFAF7] hover:bg-white p-5 rounded-2xl border border-[#EBE3D5] hover:border-[#E8C0B2] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF3EE] text-[#C96846] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownRight size={18} />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#8D5B4C] bg-[#FAF3EE] px-2 py-0.5 rounded-full border border-[#EAD6C9]">
              100% Deducible
            </span>
          </div>
          <p className="text-stone-500 font-serif text-[11px] font-semibold tracking-wider uppercase">Gastos & Gasolina</p>
          <h3 className="text-2xl font-bold font-serif text-[#C96846] tracking-tight mt-1">{formatCurrency(summary.totalExpenses)}</h3>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1 group-hover:text-stone-600 transition-colors">
            <span>Ver tickets con foto</span> <ChevronRight size={11} />
          </p>
        </div>

        {/* Rendimiento Neto (Soft Forest Green) */}
        <div 
          onClick={() => setView?.('money')}
          className="bg-[#FCFAF7] hover:bg-white p-5 rounded-2xl border border-[#EBE3D5] hover:border-[#B4D2BE] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2ED] text-[#2E5A44] flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#2E5A44] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#D0E5D7]">
              Beneficio Limpio
            </span>
          </div>
          <p className="text-stone-500 font-serif text-[11px] font-semibold tracking-wider uppercase">Rendimiento Neto</p>
          <h3 className="text-2xl font-bold font-serif text-[#2E5A44] tracking-tight mt-1">{formatCurrency(summary.netProfit)}</h3>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1 group-hover:text-stone-600 transition-colors">
            <span>Base liquidable</span> <ChevronRight size={11} />
          </p>
        </div>

        {/* Hucha IRPF Modelo 130 (Warm Amber / Honey) */}
        <div 
          onClick={() => setView?.('tax-declarations')}
          className="bg-[#FCFAF7] hover:bg-white p-5 rounded-2xl border border-[#EBE3D5] hover:border-[#E8CE9D] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF6E9] text-[#B87A24] flex items-center justify-center group-hover:scale-105 transition-transform">
              <PiggyBank size={18} />
            </div>
            <span className="text-[10px] font-serif font-semibold text-[#85531B] bg-[#FEF7EB] px-2 py-0.5 rounded-full border border-[#FDE3B8]">
              Mod. 130 AEAT
            </span>
          </div>
          <p className="text-stone-500 font-serif text-[11px] font-semibold tracking-wider uppercase">Hucha IRPF (20%)</p>
          <h3 className="text-2xl font-bold font-serif text-[#945823] tracking-tight mt-1">{formatCurrency(summary.estimatedIRPF)}</h3>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1 group-hover:text-stone-600 transition-colors">
            <span>Apartado para Hacienda</span> <ChevronRight size={11} />
          </p>
        </div>
      </div>

      {/* 5. CHARTS & REASSURING FISCAL BAROMETER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 Cols): Cashflow Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFC8] shadow-[0_4px_20px_-4px_rgba(70,55,40,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Ritmo Semanal de Facturación & Gastos</h3>
                <p className="text-xs text-stone-500 font-sans">Comparativa orgánica entre ingresos de reparto y repostajes de gasolina</p>
              </div>
              
              {/* Legend with earthy dots */}
              <div className="flex items-center gap-4 text-xs font-serif font-medium text-stone-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full transition-colors duration-500" style={{ backgroundColor: palette.moss }}></div> 
                  <span>Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full transition-colors duration-500" style={{ backgroundColor: palette.terracotta }}></div> 
                  <span>Gastos</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={8} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.borderSubtle} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#7A7269', fontWeight: 500 }} 
                    dy={8} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: palette.parchment, radius: 8 }}
                  />
                  <Bar dataKey="ingresos" fill={palette.moss} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" fill={palette.terracotta} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calm Fiscal AI Advisor Callout */}
          <div 
            className="text-[#FAF8F5] p-5 sm:p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(35,55,45,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border transition-colors duration-700"
            style={{ 
              backgroundColor: palette.deepforest, 
              borderColor: palette.forest 
            }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border"
                style={{ 
                  backgroundColor: palette.forest, 
                  borderColor: palette.moss, 
                  color: palette.sunFill 
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-white">Consultor Fiscal de Bolsillo</h4>
                <p className="text-xs text-[#D8EADB] mt-0.5 max-w-xl leading-relaxed font-sans">
                  ¿Dudas sobre qué tickets son deducibles en el IAE 849.5, la cuota RETA o los plazos de Hacienda? Consulta en cualquier momento a tu asesor asistido.
                </p>
              </div>
            </div>
            <button
              onClick={() => setView?.('automation')}
              className="px-4 py-2.5 bg-[#FAF6EE] hover:bg-white text-[#244634] rounded-xl text-xs font-serif font-semibold whitespace-nowrap shadow-sm transition-all shrink-0 active:scale-95"
            >
              Consultar Asistente
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Serenity Barometer & Hot Zones */}
        <div className="space-y-6">
          
          {/* Fiscal Serenity Barometer (LaboraScore) */}
          <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFC8] shadow-[0_4px_20px_-4px_rgba(70,55,40,0.05)] relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-serif font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-stone-700">
                <ShieldCheck size={16} style={{ color: palette.forest }} /> Serenidad Fiscal
              </h3>
              <span className="bg-[#EBF3ED] text-[#245338] text-[10px] font-serif font-semibold px-2.5 py-0.5 rounded-full border border-[#D0E5D7]">
                EXPEDIENTE BLINDADO
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-serif font-bold text-stone-900">96</span>
              <span className="text-stone-500 font-serif text-sm font-medium">/100</span>
            </div>

            {/* Organic progress bar */}
            <div className="w-full bg-[#E8E1D3] rounded-full h-2.5 mb-3 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full transition-all duration-700" 
                style={{ width: '96%', backgroundColor: palette.forest }}
              />
            </div>

            <p className="text-stone-600 text-xs leading-relaxed font-sans">
              El 100% de tus repostajes cuentan con fotografía de ticket legible y matrícula vinculada para inspecciones de Hacienda.
            </p>
          </div>

          {/* Calendario Fiscal AEAT & Vencimientos Trimestrales */}
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8DFC8] shadow-[0_4px_20px_-4px_rgba(70,55,40,0.05)] overflow-hidden">
            <div className="p-5 border-b border-[#E8DFC8] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2ED] text-[#2E5A44] flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-stone-900">Calendario Fiscal AEAT</h4>
                  <p className="text-[11px] text-stone-500 font-sans">Campaña 3T 2026 • Supervisada</p>
                </div>
              </div>
              <button
                onClick={() => setView?.('tax-declarations')}
                className="text-xs font-serif font-semibold text-[#2E5A44] hover:underline flex items-center gap-1"
              >
                <span>Ver Modelos</span> <ChevronRight size={12} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              {/* Modelo 130 */}
              <div className="p-3 bg-[#FCFAF7] rounded-2xl border border-[#EBE4D8] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-bold text-xs text-stone-900">Modelo 130 (IRPF)</span>
                    <span className="text-[10px] font-serif font-semibold text-[#245338] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#D0E5D7]">
                      Listo 20%
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 font-sans">
                    <Clock size={11} className="text-stone-400" /> Vence el 20 de Octubre
                  </p>
                </div>
                <button
                  onClick={() => setView?.('tax-declarations')}
                  className="px-2.5 py-1 text-xs font-serif font-semibold text-[#2E5A44] hover:bg-[#EBF3ED] rounded-lg transition-colors"
                >
                  Borrador
                </button>
              </div>

              {/* Modelo 303 */}
              <div className="p-3 bg-[#FCFAF7] rounded-2xl border border-[#EBE4D8] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-bold text-xs text-stone-900">Modelo 303 (IVA)</span>
                    <span className="text-[10px] font-serif font-semibold text-[#85531B] bg-[#FEF7EB] px-2 py-0.5 rounded-full border border-[#FDE3B8]">
                      En revisión
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 font-sans">
                    <Clock size={11} className="text-stone-400" /> Vence el 20 de Octubre
                  </p>
                </div>
                <button
                  onClick={() => setView?.('tax-declarations')}
                  className="px-2.5 py-1 text-xs font-serif font-semibold text-stone-700 hover:bg-[#F2EDE4] rounded-lg transition-colors"
                >
                  Comprobar
                </button>
              </div>

              {/* Cuota RETA Seguridad Social */}
              <div className="p-3 bg-[#FCFAF7] rounded-2xl border border-[#EBE4D8] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-bold text-xs text-stone-900">Cuota RETA (Seg. Social)</span>
                    <span className="text-[10px] font-serif font-semibold text-stone-700 bg-[#F2EDE4] px-2 py-0.5 rounded-full border border-[#E3DBD0]">
                      80€ / mes
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 font-sans">
                    <CheckCircle2 size={11} className="text-[#2E5A44]" /> Domiciliado fin de mes
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-stone-800">
                  {currentUser?.socialSecurityType === 'tarifa_plana' ? 'Tarifa Plana' : 'Base Mínima'}
                </span>
              </div>

              {/* Enlace a Libros Oficiales AEAT */}
              <div className="pt-2 border-t border-[#E8DFC8] flex items-center justify-between text-xs text-stone-600">
                <span className="flex items-center gap-1.5 text-stone-500 font-sans">
                  <FileText size={13} className="text-[#2E5A44]" /> Libros oficiales AEAT
                </span>
                <button
                  onClick={() => setView?.('money')}
                  className="font-serif font-semibold text-xs text-[#2E5A44] hover:underline"
                >
                  Consultar asientos
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Gas Station Capture Modal */}
      <GasStationCaptureModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
