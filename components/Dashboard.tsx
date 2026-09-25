import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Fuel,
  Loader2,
  MessageSquare,
  Play,
  ReceiptText,
  ShieldCheck,
  Square,
  Upload,
  User,
  Wallet,
  ClipboardPaste,
  Link2
} from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';
import { useData } from '../contexts/DataContext';
import { GasStationCaptureModal } from './GasStationCaptureModal';
import AtmosphericPanel from './AtmosphericPanel';
import SeasonalEffects from './SeasonalEffects';
import { GhibliLightingControl } from './GhibliLightingControl';
import Logo from './Logo';
import { finishWorkSession, getActiveWorkSession, listRecentWorkSessions, startWorkSession } from '../services/workSessionService';
import { WorkSession } from '../types';
import { identityImageStore } from '../services/identityImage';


interface DashboardProps { setView?: (view: string) => void; }

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const greetSpanish = (hour: number) => {
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const MobileBotanicalScene: React.FC = () => (
  <svg viewBox="0 0 260 330" className="pointer-events-none absolute -right-8 top-3 h-[330px] w-[245px] select-none" aria-hidden="true">
    <defs>
      <linearGradient id="laboraLeafApproved" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#183D2F" />
        <stop offset="1" stopColor="#5B7864" />
      </linearGradient>
      <linearGradient id="laboraPotApproved" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F5EDDE" />
        <stop offset="1" stopColor="#D9CCB7" />
      </linearGradient>
      <filter id="laboraSoftShadowApproved" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#6A5842" floodOpacity="0.14" />
      </filter>
    </defs>
    <g opacity="0.98">
      <path d="M196 218 C191 160 178 100 156 43" fill="none" stroke="#5D5A42" strokeWidth="3" strokeLinecap="round" />
      <path d="M203 220 C215 159 220 104 214 57" fill="none" stroke="#5D5A42" strokeWidth="3" strokeLinecap="round" />
      <path d="M188 220 C156 171 129 132 98 103" fill="none" stroke="#5D5A42" strokeWidth="3" strokeLinecap="round" />
      <path d="M207 220 C226 192 242 165 252 133" fill="none" stroke="#5D5A42" strokeWidth="3" strokeLinecap="round" />
      <g fill="url(#laboraLeafApproved)">
        <ellipse cx="155" cy="55" rx="10" ry="29" transform="rotate(-13 155 55)" />
        <ellipse cx="173" cy="91" rx="11" ry="31" transform="rotate(30 173 91)" />
        <ellipse cx="136" cy="111" rx="11" ry="31" transform="rotate(-56 136 111)" />
        <ellipse cx="190" cy="128" rx="11" ry="33" transform="rotate(31 190 128)" />
        <ellipse cx="116" cy="132" rx="10" ry="29" transform="rotate(-61 116 132)" />
        <ellipse cx="217" cy="76" rx="10" ry="30" transform="rotate(9 217 76)" />
        <ellipse cx="226" cy="121" rx="10" ry="30" transform="rotate(48 226 121)" />
        <ellipse cx="244" cy="154" rx="9" ry="27" transform="rotate(26 244 154)" />
        <ellipse cx="166" cy="163" rx="11" ry="32" transform="rotate(-57 166 163)" />
        <ellipse cx="214" cy="172" rx="11" ry="31" transform="rotate(54 214 172)" />
      </g>
    </g>
    <g filter="url(#laboraSoftShadowApproved)">
      <path d="M157 203 H241 L232 283 Q231 296 217 299 H178 Q165 296 164 283 Z" fill="url(#laboraPotApproved)" />
      <path d="M166 206 Q198 220 233 206" fill="none" stroke="#CFC2AE" strokeWidth="2" opacity="0.8" />
      <g opacity="0.35" fill="#B9AA94">
        <circle cx="179" cy="236" r="2" /><circle cx="207" cy="250" r="1.7" /><circle cx="220" cy="229" r="1.5" />
        <circle cx="189" cy="278" r="1.6" /><circle cx="222" cy="274" r="2.1" /><circle cx="202" cy="221" r="1.3" />
      </g>
    </g>
    <g filter="url(#laboraSoftShadowApproved)" transform="translate(25 224)">
      <path d="M0 16 Q0 3 15 3 H70 Q83 3 83 16 V68 Q83 84 68 87 H17 Q0 84 0 68 Z" fill="#EDE4D5" stroke="#D8CDBE" strokeWidth="2" />
      <path d="M83 29 H99 Q113 29 113 45 Q113 62 97 63 H84" fill="none" stroke="#D8CDBE" strokeWidth="8" strokeLinecap="round" />
      <text x="12" y="34" fontSize="10" fontStyle="italic" fontWeight="700" fill="#163F2F">Trabajo</text>
      <text x="12" y="48" fontSize="10" fontStyle="italic" fontWeight="700" fill="#163F2F">también</text>
      <text x="12" y="62" fontSize="10" fontStyle="italic" fontWeight="700" fill="#163F2F">es libertad.</text>
      <path d="M43 72 Q55 75 68 68" fill="none" stroke="#D86A3D" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

const MobileManagerIllustration: React.FC = () => (
  <svg viewBox="0 0 250 175" className="h-[170px] w-[235px] max-w-full" aria-hidden="true">
    <g>
      <circle cx="119" cy="30" r="23" fill="#E8EFE7" />
      <path d="M104 30 H134 M119 15 V45" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
      <path d="M99 25 Q97 11 110 9 Q123 8 126 23 V33 Q126 44 115 44 Q101 43 101 32 Z" fill="#214E3A" opacity="0.96" />
      <path d="M124 27 Q124 14 137 14 Q149 14 149 27 Q149 40 137 40 Q125 40 124 27 Z" fill="#D86A3D" opacity="0.96" />
    </g>
    <g transform="translate(18 63)">
      <ellipse cx="48" cy="49" rx="29" ry="34" fill="#F4C39D" />
      <path d="M20 47 Q18 12 48 12 Q73 13 76 38 Q61 31 51 22 Q43 40 20 47 Z" fill="#294E34" />
      <path d="M11 111 Q16 73 46 72 Q79 73 86 111" fill="#2F6448" />
      <circle cx="58" cy="45" r="2" fill="#3B3A34" />
      <path d="M60 56 Q67 60 72 54" fill="none" stroke="#9D5A47" strokeWidth="2" strokeLinecap="round" />
    </g>
    <g transform="translate(133 60)">
      <ellipse cx="48" cy="49" rx="29" ry="34" fill="#F3BE97" />
      <path d="M20 43 Q22 10 52 11 Q79 13 78 42 Q65 35 57 22 Q45 36 20 43 Z" fill="#234832" />
      <path d="M15 111 Q20 74 49 72 Q79 74 86 111" fill="#EFEDE6" />
      <path d="M36 74 L48 105 L60 74" fill="#D6DDD5" />
      <circle cx="37" cy="45" r="2" fill="#3B3A34" />
      <path d="M24 57 Q31 62 36 56" fill="none" stroke="#9D5A47" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 86 Q-1 75 -10 72" fill="none" stroke="#E6A980" strokeWidth="7" strokeLinecap="round" />
    </g>
  </svg>
);

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { currentUser, getFiscalSummary, privacyMode, requirements, incomes, expenses, showNotification } = useData();
  const { selectedCountry } = useCountry();
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<WorkSession[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [odometerInput, setOdometerInput] = useState('');
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    void Promise.all([getActiveWorkSession(), listRecentWorkSessions(30)])
      .then(([session, sessions]) => {
        if (!active) return;
        setActiveSession(session);
        setRecentSessions(sessions);
      })
      .catch((error) => console.error('No se pudo cargar el historial de jornadas.', error))
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    setClockNow(Date.now());
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [activeSession?.id]);

  if (!currentUser) return null;

  const summary = useMemo(() => getFiscalSummary(currentUser.id), [currentUser.id, getFiscalSummary]);
  const pendingRequirements = requirements.filter(
    (requirement) => requirement.riderId === currentUser.id && requirement.status === 'pending'
  );
  const primaryRequirement = pendingRequirements[0];
  const identityImage = identityImageStore.getForUser(currentUser);
  const period = currentQuarter();
  const firstName = currentUser.name.trim().split(/\s+/)[0] || currentUser.name;
  const formatCurrency = (amount: number) => privacyMode
    ? '••••'
    : amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: selectedCountry.currency || 'EUR',
        maximumFractionDigits: 0
      });
  const formatCurrencyPrecise = (amount: number) => privacyMode
    ? '••••'
    : amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: selectedCountry.currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

  const nowDate = new Date(clockNow);
  const dateLabel = nowDate
    .toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
    .replace(',', '')
    .replace('.', '')
    .toUpperCase();
  const dayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const todayKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;
  const todayWorkedMs = recentSessions.reduce((total, session) => {
    const start = Math.max(new Date(session.startedAt).getTime(), dayStart);
    const rawEnd = session.endedAt ? new Date(session.endedAt).getTime() : clockNow;
    const end = Math.min(rawEnd, dayEnd);
    return total + Math.max(0, end - start);
  }, 0);
  const todayWorkedHours = todayWorkedMs / (60 * 60 * 1000);
  const todayRegisteredIncome = incomes
    .filter((income) => income.userId === currentUser.id && income.date === todayKey)
    .reduce((sum, income) => sum + income.amount, 0);
  const todayGrossPerHour = todayWorkedHours > 0 ? todayRegisteredIncome / todayWorkedHours : 0;
  const todayKm = recentSessions.reduce((total, session) => {
    const startedAt = new Date(session.startedAt).getTime();
    if (startedAt < dayStart || startedAt >= dayEnd) return total;
    if (session.startOdometerKm == null || session.endOdometerKm == null) return total;
    return total + Math.max(0, session.endOdometerKm - session.startOdometerKm);
  }, 0);
  const todayGrossPerKm = todayKm > 0 ? todayRegisteredIncome / todayKm : 0;
  const todayFuelCost = expenses
    .filter((expense) =>
      expense.userId === currentUser.id
      && expense.date === todayKey
      && String(expense.category).toLowerCase().includes('gasolina')
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
  const todayAfterRegisteredFuel = todayRegisteredIncome - todayFuelCost;

  const elapsedMinutes = activeSession
    ? Math.max(0, Math.floor((clockNow - new Date(activeSession.startedAt).getTime()) / 60_000))
    : 0;
  const elapsedLabel = activeSession
    ? `${Math.floor(elapsedMinutes / 60)} h ${elapsedMinutes % 60} min`
    : 'Sin jornada activa';

  const toggleWorkSession = async () => {
    if (sessionBusy) return;

    const parsedOdometer = odometerInput.trim() ? Number(odometerInput) : undefined;
    if (parsedOdometer !== undefined && (!Number.isFinite(parsedOdometer) || parsedOdometer < 0)) {
      showNotification('error', 'El odómetro debe ser un número válido.');
      return;
    }
    if (
      activeSession?.startOdometerKm != null
      && parsedOdometer !== undefined
      && parsedOdometer < activeSession.startOdometerKm
    ) {
      showNotification('error', 'El kilometraje final no puede ser menor que el inicial.');
      return;
    }

    setSessionBusy(true);
    try {
      if (activeSession) {
        await finishWorkSession(activeSession.id, parsedOdometer);
        setActiveSession(null);
        setRecentSessions(await listRecentWorkSessions(30));
        setOdometerInput('');
        setClockNow(Date.now());
        showNotification('success', 'Jornada finalizada.');
      } else {
        const session = await startWorkSession(parsedOdometer);
        setActiveSession(session);
        setRecentSessions(await listRecentWorkSessions(30));
        setOdometerInput('');
        setClockNow(Date.now());
        showNotification('success', 'Jornada iniciada.');
      }
    } catch (error: any) {
      console.error('No se pudo actualizar la jornada.', error);
      showNotification('error', 'No se pudo actualizar la jornada. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setSessionBusy(false);
    }
  };

  const hasGestoria = Boolean(currentUser.managerId);
  const quickActions = [
    {
      label: 'Importar ingresos',
      description: hasGestoria ? 'Liquidación CSV o texto' : 'Glovo/Uber: pega liquidación',
      icon: ClipboardPaste,
      tone: 'green',
      onClick: () => setView?.('money-incomes')
    },
    {
      label: 'Registrar gasto',
      description: 'Foto, ticket o factura',
      icon: Fuel,
      tone: 'clay',
      onClick: () => setIsGasModalOpen(true)
    },
    {
      label: hasGestoria ? 'Avisos gestoría' : 'Vincular gestoría',
      description: hasGestoria
        ? (pendingRequirements.length ? `${pendingRequirements.length} pendientes` : 'Todo revisado')
        : 'Por correo en Perfil',
      icon: hasGestoria ? Bell : Link2,
      tone: 'amber',
      onClick: () => setView?.(hasGestoria ? 'gestor-requirements' : 'settings')
    },
    {
      label: 'Modelos',
      description: `Periodo ${period}`,
      icon: FileText,
      tone: 'green',
      onClick: () => setView?.('tax-declarations')
    }
  ] as const;

  return (
    <div id="rider-dashboard" className="mx-auto max-w-6xl pb-12">
      <div className="md:hidden">
        <section className="relative z-30 bg-[#F8F4EC] px-6 pb-7 pt-7">
          <div className="flex items-start justify-between gap-4">
            <Logo size="lg" />
            <button
              type="button"
              onClick={() => setView?.('settings')}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-[#E9E6DD] bg-[#E6E8E1] shadow-[0_6px_20px_rgba(24,62,46,0.08)]"
              aria-label="Abrir perfil"
            >
              {identityImage ? (
                <img src={identityImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={24} className="text-[#5B6E63]" />
              )}
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#F8F4EC] bg-[#1C7958]" />
            </button>
          </div>

          <div className="relative z-30 mt-9 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#587064]">{dateLabel}</p>
            <GhibliLightingControl />
          </div>

          <div className="relative min-h-[345px] pt-12">
            <SeasonalEffects variant="mobile" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.72]" />
            <div className="relative z-10 max-w-[74%]">
              <h1
                className="font-semibold leading-[0.96] tracking-[-0.065em] text-[#0B412F]"
                style={{ fontSize: 'clamp(2.7rem, 14vw, 3.45rem)' }}
              >
                Tu trabajo,<br />en orden.
              </h1>
              <p className="mt-5 text-[1.62rem] font-medium tracking-[-0.035em] text-[#697A70]">Tu gestor, cerca.</p>
            </div>
            <MobileBotanicalScene />
          </div>

          <button
            type="button"
            onClick={() => setView?.('docs')}
            className="relative z-20 flex min-h-[74px] w-full items-center justify-center gap-4 rounded-full bg-[#165238] px-7 text-[1.05rem] font-extrabold text-white shadow-[0_12px_30px_rgba(18,78,53,0.18)] transition active:scale-[0.99]"
          >
            <Upload size={25} strokeWidth={2.2} />
            <span>Enviar documento</span>
            <ArrowRight size={25} strokeWidth={2.1} />
          </button>
          <p className="mt-3 text-center text-[13px] font-medium text-[#697970]">Facturas, justificantes, contratos… en un momento.</p>
        </section>

        <section className="bg-[#F8F4EC] px-6 pb-7 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[1.75rem] font-semibold tracking-[-0.045em] text-[#103E2E]">Lo siguiente</h2>
            <button
              type="button"
              onClick={() => setView?.('gestor-requirements')}
              className="flex items-center gap-2 text-sm font-bold text-[#1E6247]"
            >
              Ver todo <ArrowRight size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView?.('gestor-requirements')}
            className="mt-5 flex w-full items-center gap-4 border-b border-[#DED8CC] pb-7 text-left"
          >
            <span className={primaryRequirement ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FBE6D8] text-[#D25A2F]" : "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E2EFE8] text-[#1D6549]"}>
              {primaryRequirement ? <FileText size={26} /> : <CheckCircle2 size={26} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[1.02rem] font-extrabold text-[#123D2F]">
                {primaryRequirement ? primaryRequirement.title : 'Todo en orden'}
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-[#738078]">
                {primaryRequirement ? primaryRequirement.description : 'Tu gestoría no tiene documentos pendientes para ti.'}
              </span>
            </span>
            <span className={primaryRequirement ? "shrink-0 rounded-full bg-[#FBE1CF] px-4 py-2 text-xs font-extrabold text-[#D25A2F]" : "shrink-0 rounded-full bg-[#E4F0E9] px-4 py-2 text-xs font-extrabold text-[#27634C]"}>
              {primaryRequirement ? 'Pendiente' : 'Al día'}
            </span>
          </button>
        </section>

        <section className="relative overflow-hidden bg-[#F8F4EC] px-6 pb-7 pt-6">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.31em] text-[#64776C]">Tu gestoría</p>
          <div className="mt-4 grid min-h-[250px] grid-cols-[1.05fr_.95fr] items-center gap-1">
            <div className="relative z-10">
              <h2 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.045em] text-[#103E2E]">Conecta con tu gestor</h2>
              <p className="mt-3 max-w-[220px] text-[14px] leading-relaxed text-[#718078]">
                Un equipo para que tú solo te preocupes de lo importante.
              </p>
              <button
                type="button"
                onClick={() => setView?.(currentUser.managerId ? 'messages' : 'settings')}
                className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-full border-2 border-[#1D6549] px-6 text-sm font-extrabold text-[#145038] transition active:scale-[0.99]"
              >
                <Link2 size={18} />
                {currentUser.managerId ? 'Hablar con tu gestor' : 'Vincular gestoría'}
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="relative flex h-full flex-col items-center justify-center">
              <MobileManagerIllustration />
              <p className="-mt-4 rotate-[-4deg] text-center text-[15px] font-semibold italic leading-tight text-[#244D3B]">
                Mismas metas,<br />más camino.
              </p>
              <span className="mt-1 block h-0.5 w-16 rotate-[-8deg] rounded-full bg-[#D96535]" />
            </div>
          </div>
        </section>

        <section className="bg-[#F8F4EC] px-6 pb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setView?.('money-incomes')}
              className="rounded-[20px] border border-[#D8E2DA] bg-[#EEF4EF] px-4 py-4 text-left"
            >
              <ClipboardPaste size={18} className="text-[#205E45]" />
              <p className="mt-2 text-sm font-extrabold text-[#123D2F]">Importar ingresos</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#748078]">Liquidación o texto</p>
            </button>
            <button
              type="button"
              onClick={() => setIsGasModalOpen(true)}
              className="rounded-[20px] border border-[#EAD7CC] bg-[#FFF2EA] px-4 py-4 text-left"
            >
              <Fuel size={18} className="text-[#BD5A38]" />
              <p className="mt-2 text-sm font-extrabold text-[#123D2F]">Registrar gasto</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#748078]">Ticket o factura</p>
            </button>
          </div>
        </section>

        <details className="group mx-6 mb-5 rounded-[24px] border border-[#DED7C9] bg-[#FFFCF6]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className={activeSession ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E4F0E9] text-[#1D6549]" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0ECE3] text-[#6F7772]"}>
                <Clock3 size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#123D2F]">Jornada Labora</p>
                <p className="truncate text-xs text-[#758078]">
                  {sessionLoading ? 'Comprobando…' : activeSession ? 'En curso · ' + elapsedLabel : 'Registra tus horas y kilómetros reales'}
                </p>
              </div>
            </div>
            <ChevronRight size={19} className="text-[#567064] transition group-open:rotate-90" />
          </summary>

          <div className="border-t border-[#E7E0D5] px-5 pb-5 pt-4">
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={odometerInput}
                onChange={(event) => setOdometerInput(event.target.value)}
                placeholder={activeSession ? 'Km al terminar' : 'Km actuales'}
                className="min-h-11 min-w-0 flex-1 rounded-2xl border border-[#DED7C9] bg-white px-3 text-xs font-bold text-[#405249] outline-none focus:border-[#4D7C64]"
                aria-label={activeSession ? 'Kilometraje al terminar' : 'Kilometraje al iniciar'}
              />
              <button
                type="button"
                onClick={() => void toggleWorkSession()}
                disabled={sessionLoading || sessionBusy}
                className={activeSession ? "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#FFF0E8] px-4 text-xs font-extrabold text-[#B65132] disabled:opacity-50" : "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#165238] px-4 text-xs font-extrabold text-white disabled:opacity-50"}
              >
                {sessionBusy ? <Loader2 size={15} className="animate-spin" /> : activeSession ? <Square size={14} /> : <Play size={15} />}
                {activeSession ? 'Finalizar' : 'Iniciar'}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniMetric label="Horas hoy" value={todayWorkedHours > 0 ? todayWorkedHours.toFixed(1) + ' h' : '0 h'} />
              <MiniMetric label="Ingresos hoy" value={formatCurrency(todayRegisteredIncome)} />
              <MiniMetric label="Km cerrados" value={todayKm > 0 ? todayKm.toFixed(1) + ' km' : '—'} />
              <MiniMetric label={(selectedCountry.currency_symbol || '€') + '/h bruto'} value={todayWorkedHours > 0 ? formatCurrencyPrecise(todayGrossPerHour) : '—'} emphasis />
            </div>
          </div>
        </details>
      </div>

      <div className="hidden space-y-8 md:block">
      <section className="labora-hero p-6 sm:p-8 lg:p-10 xl:p-12">
        <AtmosphericPanel
          variant="hero"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] w-full opacity-[0.55]"
        />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="labora-chip labora-kicker text-[var(--labora-primary)]">Autónomo · {period}</span>
              {pendingRequirements.length === 0 ? (
                <span className="labora-chip text-[11px] font-bold text-[var(--labora-gold)]">
                  <CheckCircle2 size={13} /> Sin tareas pendientes
                </span>
              ) : (
                <span className="labora-chip text-[11px] font-bold text-[var(--labora-clay)]">
                  <Bell size={13} /> {pendingRequirements.length} {pendingRequirements.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                </span>
              )}
            </div>

            <p className="labora-kicker mt-7 text-[var(--labora-muted)]">{greetSpanish(nowDate.getHours())}, {firstName}</p>
            <h1 className="labora-display mt-3 max-w-2xl text-[var(--labora-display-sm)] font-semibold text-[var(--labora-ink)] sm:text-[2.85rem] lg:text-[3.15rem]">
              Tu trimestre, con claridad y evidencia.
            </h1>
            <p className="labora-body mt-4 max-w-xl text-[15px] leading-[1.7] text-[var(--labora-muted)] sm:text-base">
              Gastos, modelos y gestoría en un mismo espacio — calmado, verificable, sin ruido.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-[11px] font-semibold tracking-[0.02em] text-[var(--labora-muted)]">
              {currentUser.iaeCode && <span>IAE <strong className="text-[var(--labora-ink)]">{currentUser.iaeCode}</strong></span>}
              {currentUser.vehicleType && <span>Vehículo <strong className="capitalize text-[var(--labora-ink)]">{currentUser.vehicleType}</strong></span>}
              {currentUser.nif && <span>NIF <strong className="text-[var(--labora-ink)]">{currentUser.nif}</strong></span>}
            </div>
          </div>

          <button
            onClick={() => setView?.('money')}
            className="relative z-10 rounded-[22px] border border-[var(--labora-border)] bg-[color-mix(in_srgb,var(--labora-surface)_82%,transparent)] p-6 text-left shadow-[0_12px_36px_rgba(47,93,74,0.07),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur transition hover:bg-[var(--labora-surface)]"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--labora-muted)]">Neto operativo</p>
            <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[var(--labora-ink)]">{formatCurrency(summary.netProfit)}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[var(--labora-primary)]">
              <span>Ver dinero</span>
              <ChevronRight size={15} />
            </div>
          </button>
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border ${activeSession ? 'border-[var(--labora-border)] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'border-[var(--labora-border)] bg-[var(--labora-canvas)] text-[var(--labora-muted)]'}`}>
              <Clock3 size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-sm font-extrabold text-[var(--labora-ink)]">Jornada Labora</p>
                {activeSession && <span className="rounded-full bg-[var(--labora-moss-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--labora-primary)]">En curso</span>}
              </div>
              <p className="mt-1 text-xs text-[var(--labora-muted)]">
                {sessionLoading
                  ? 'Comprobando jornada…'
                  : activeSession
                    ? `Llevas ${elapsedLabel}. Iniciada a las ${new Date(activeSession.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                    : 'Registra tus horas reales. Esta versión no usa GPS ni rastrea tu ubicación.'}
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={odometerInput}
              onChange={(event) => setOdometerInput(event.target.value)}
              placeholder={activeSession ? 'Km al terminar' : 'Km actuales'}
              className="min-h-11 min-w-0 flex-1 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 text-xs font-bold text-[var(--labora-ink-soft)] outline-none focus:border-[var(--labora-primary-2)] sm:w-32"
              aria-label={activeSession ? 'Kilometraje al terminar' : 'Kilometraje al iniciar'}
            />
            <button
              type="button"
              onClick={() => void toggleWorkSession()}
              disabled={sessionLoading || sessionBusy}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[13px] px-4 py-2.5 text-xs font-extrabold transition disabled:opacity-50 ${activeSession ? 'border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)] hover:bg-[var(--labora-soft-clay)]' : 'bg-[var(--labora-primary)] text-white hover:opacity-90'}`}
            >
              {sessionBusy ? <Loader2 size={15} className="animate-spin" /> : activeSession ? <Square size={14} /> : <Play size={15} />}
              {activeSession ? 'Finalizar' : 'Iniciar'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--labora-border)] pt-4 sm:grid-cols-4">
          <MiniMetric label="Horas hoy" value={todayWorkedHours > 0 ? `${todayWorkedHours.toFixed(1)} h` : '0 h'} />
          <MiniMetric label="Km cerrados" value={todayKm > 0 ? `${todayKm.toFixed(1)} km` : '—'} />
          <MiniMetric label="Ingresos hoy" value={formatCurrency(todayRegisteredIncome)} />
          <MiniMetric
            label={`${selectedCountry.currency_symbol || '€'}/h bruto`}
            value={todayWorkedHours > 0 ? formatCurrencyPrecise(todayGrossPerHour) : '—'}
            emphasis
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-medium text-[var(--labora-muted)]">
          <span>Gasolina registrada hoy: <strong className="text-[var(--labora-muted)]">{formatCurrencyPrecise(todayFuelCost)}</strong></span>
          <span>Ingresos − gasolina: <strong className="text-[var(--labora-muted)]">{formatCurrencyPrecise(todayAfterRegisteredFuel)}</strong></span>
          <span>{selectedCountry.currency_symbol || '€'}/km bruto: <strong className="text-[var(--labora-muted)]">{todayKm > 0 ? formatCurrencyPrecise(todayGrossPerKm) : '—'}</strong></span>
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-[var(--labora-muted)]">
          Métricas operativas basadas solo en datos registrados. “Ingresos − gasolina” no es beneficio neto: faltan mantenimiento, seguro, cuota, depreciación, impuestos y otros costes.
        </p>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="labora-kicker text-[var(--labora-muted)]">Ahora</p>
            <h2 className="labora-title mt-1.5 text-[1.35rem] text-[var(--labora-ink)]">Acciones rápidas</h2>
          </div>
          <span className="hidden text-xs font-medium text-[var(--labora-muted)] sm:block">Lo más usado, sin menús extra</span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const tone = action.tone === 'clay'
              ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)] border-[var(--labora-border)]'
              : action.tone === 'amber'
              ? 'bg-[color-mix(in_srgb,var(--labora-gold)_14%,var(--labora-surface))] text-[var(--labora-gold)] border-[var(--labora-border)]'
              : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)] border-[var(--labora-border)]';

            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="labora-card labora-card-interactive group px-4 py-5 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border ${tone}`}>
                      <Icon size={19} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold tracking-[-0.015em] text-[var(--labora-ink)]">{action.label}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-[var(--labora-muted)]">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--labora-muted)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="labora-kicker text-[var(--labora-muted)]">Este periodo</p>
          <h2 className="labora-title mt-1.5 text-[1.35rem] text-[var(--labora-ink)]">Tus números</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <Metric onClick={() => setView?.('money-incomes')} icon={Wallet} label="Ingresos" value={formatCurrency(summary.totalIncome)} />
          <Metric onClick={() => setView?.('money')} icon={ReceiptText} label="Gastos" value={formatCurrency(summary.totalExpenses)} accent />
          <Metric onClick={() => setView?.('money')} icon={ShieldCheck} label="Neto operativo" value={formatCurrency(summary.netProfit)} />
          <Metric onClick={() => setView?.('messages')} icon={MessageSquare} label="Gestoría" value="Abrir chat" compact />
        </div>
      </section>

      {pendingRequirements.length > 0 && (
        <section className="rounded-[22px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[var(--labora-ink)]">
                  {pendingRequirements.length === 1 ? 'Tu gestoría necesita una cosa' : `Tu gestoría necesita ${pendingRequirements.length} cosas`}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">Resuélvelas aquí para mantener el trimestre al día.</p>
              </div>
            </div>
            <button onClick={() => setView?.('gestor-requirements')} className="shrink-0 rounded-xl bg-[var(--labora-primary)] px-3 py-2 text-xs font-extrabold text-white">
              Revisar
            </button>
          </div>
        </section>
      )}

      </div>

      <GasStationCaptureModal isOpen={isGasModalOpen} onClose={() => setIsGasModalOpen(false)} />
    </div>
  );
};

const MiniMetric = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
  <div className={`min-w-0 rounded-[12px] px-2 py-2.5 ${emphasis ? 'bg-[var(--labora-moss-soft)]' : 'bg-[var(--labora-surface-2)]'}`}>
    <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.09em] text-[var(--labora-muted)]">{label}</p>
    <p className={`mt-1 truncate text-xs font-extrabold ${emphasis ? 'text-[var(--labora-primary)]' : 'text-[var(--labora-ink)]'}`}>{value}</p>
  </div>
);

const Metric = ({ onClick, icon: Icon, label, value, accent = false, compact = false }: any) => (
  <button onClick={onClick} className="labora-card labora-card-interactive p-5 sm:p-6 text-left">
    <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${accent ? 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay)]' : 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]'}`}>
      <Icon size={18} strokeWidth={2.2} />
    </div>
    <p className="mt-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--labora-muted)]">{label}</p>
    <p className={`mt-1.5 font-extrabold tracking-[-0.03em] text-[var(--labora-ink)] ${compact ? 'text-sm' : 'text-[1.35rem]'}`}>{value}</p>
  </button>
);

export default Dashboard;
