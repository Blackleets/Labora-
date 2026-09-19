import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  BriefcaseBusiness,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { recoverRemoteSession, signInRemote, signUpRemote } from '../services/authWorkspace';
import { UserRole } from '../types';
import IdentityImagePicker from './IdentityImagePicker';
import Logo from './Logo';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [collegiateNumber, setCollegiateNumber] = useState('');
  const [identityImage, setIdentityImage] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(true);

  useEffect(() => {
    let active = true;
    recoverRemoteSession()
      .then((restored) => {
        if (active && restored) window.location.reload();
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setRecovering(false);
      });
    return () => { active = false; };
  }, []);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const inputClass = 'w-full rounded-[14px] border border-[#D8D1C6] bg-[#FFFEFB] px-4 py-3.5 text-[15px] text-[#0A1210] outline-none transition placeholder:text-stone-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#1A5C42] focus:ring-4 focus:ring-[#C9A227]/25';
  const labelClass = 'mb-2 block text-xs font-extrabold text-stone-600';

  const resetFeedback = () => {
    setError('');
    setInfo('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (!normalizeEmail(email) || !password) {
      setError('Escribe tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await signInRemote(email, password);
      window.location.reload();
    } catch (err: any) {
      const message = String(err?.message || 'No se pudo iniciar sesión.');
      if (message.toLowerCase().includes('email not confirmed')) {
        setError('Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.');
      } else if (message.toLowerCase().includes('invalid login')) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const continueRegistration = () => {
    resetFeedback();
    if (!name.trim()) {
      setError('Escribe tu nombre para continuar.');
      return;
    }
    if (!normalizeEmail(email)) {
      setError('Escribe un correo electrónico válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setRegisterStep(2);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      const result = await signUpRemote({
        name: name.trim(),
        email: normalizeEmail(email),
        phone: phone.trim() || undefined,
        nif: nif.trim().toUpperCase() || undefined,
        role,
        platforms: [],
        fiscalRegime: undefined,
        iaeCode: undefined,
        socialSecurityType: undefined,
        vehicleType: undefined,
        vehiclePlate: role === UserRole.RIDER ? vehiclePlate.trim().toUpperCase() || undefined : undefined,
        vehicleFuel: undefined,
        companyName: role === UserRole.MANAGER ? companyName.trim() || name.trim() : undefined,
        collegiateNumber: role === UserRole.MANAGER ? collegiateNumber.trim() || undefined : undefined,
        countryCode: 'ES'
      }, password, identityImage);

      if (result.session) {
        window.location.reload();
      } else {
        setInfo('Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión.');
        setMode('login');
        setRegisterStep(1);
      }
    } catch (err: any) {
      const message = String(err?.message || 'No se pudo crear la cuenta.');
      if (message.toLowerCase().includes('already registered')) {
        setError('Ya existe una cuenta con este correo.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setRegisterStep(1);
    resetFeedback();
  };

  if (recovering) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F1EA]">
        <div className="flex items-center gap-2 rounded-2xl border border-[#DDD6CB] bg-white/85 px-4 py-3 text-sm font-bold text-[#5E6862] shadow-sm">
          <Loader2 size={18} className="animate-spin" /> Recuperando sesión…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] px-4 py-5 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] max-w-6xl items-stretch gap-5 lg:grid-cols-[minmax(0,1.1fr)_448px]">
        <section className="labora-hero hidden p-8 lg:flex lg:flex-col lg:justify-between xl:p-11">
          <div className="relative z-10">
            <Logo size="lg" showText variant="dark" animated />
            <div className="mt-16 max-w-xl">
              <span className="labora-chip labora-kicker text-[#E8D48A]">Autónomo + Gestoría</span>
              <div className="labora-gold-line mt-6" />
              <h1 className="labora-display mt-5 text-[3.35rem] font-semibold leading-[0.96] text-white">
                Infraestructura seria para dinero real.
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70">
                Identidad, gastos, documentos, modelos, peticiones y mensajes — con evidencia, permisos y sin fingir APIs que aún no existen.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            <Feature icon={ShieldCheck} title="Datos privados" text="Permisos por relación" />
            <Feature icon={CheckCircle2} title="Sin simulación" text="Estados verificables" />
            <Feature icon={BriefcaseBusiness} title="Dos espacios" text="Rider y gestoría" />
          </div>
        </section>

        <main className="flex w-full items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <Logo size="md" showText animated />
              <span className="rounded-full border border-[#D8D1C6] bg-white/80 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#5E6862]">Acceso seguro</span>
            </div>

            <section className="labora-card-premium p-5 sm:p-8">
              <div className="mb-6 grid grid-cols-2 rounded-[14px] bg-[#EFEBE3] p-1">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`rounded-[11px] px-3 py-2.5 text-xs font-extrabold transition ${mode === 'login' ? 'bg-[#FFFEFB] text-[#0A1210] shadow-[0_4px_14px_rgba(10,18,16,0.08)]' : 'text-[#5E6862]'}`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`rounded-[11px] px-3 py-2.5 text-xs font-extrabold transition ${mode === 'register' ? 'bg-[#FFFEFB] text-[#0A1210] shadow-[0_4px_14px_rgba(10,18,16,0.08)]' : 'text-[#5E6862]'}`}
                >
                  Crear cuenta
                </button>
              </div>

              {mode === 'login' ? (
                <>
                  <div className="mb-7">
                    <p className="labora-kicker text-[#1A5C42]">Labora+</p>
                    <h2 className="labora-display mt-2 text-3xl font-semibold text-[#0A1210]">Qué bueno verte.</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#5E6862]">Entra a tu espacio de autónomo o gestoría.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className={labelClass}>Correo electrónico</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); resetFeedback(); }} placeholder="tu@correo.com" className={`${inputClass} pl-12`} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Contraseña</label>
                      <div className="relative">
                        <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); resetFeedback(); }} placeholder="Tu contraseña" className={`${inputClass} pl-12`} required />
                      </div>
                    </div>

                    {error && <p className="rounded-[14px] border border-[#F0D8D1] bg-[#FFF5F2] p-3.5 text-xs font-bold text-[#944B3D]">{error}</p>}
                    {info && <p className="rounded-[14px] border border-[#CFE1D6] bg-[#F0F7F2] p-3.5 text-xs font-bold text-[#0F3D2E]">{info}</p>}

                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#0F3D2E] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#0A2E22] disabled:opacity-60">
                      {loading ? <Loader2 size={17} className="animate-spin" /> : <>Entrar <ArrowRight size={17} /></>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="labora-kicker text-[#789582]">Nueva cuenta</p>
                      <h2 className="labora-display mt-2 text-3xl font-semibold text-[#0A1210]">
                        {registerStep === 1 ? 'Crea tu espacio.' : 'Hazlo reconocible.'}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-stone-500">
                        {registerStep === 1 ? 'Elige cómo usarás Labora+ y crea tu acceso.' : 'Añade la identidad que verá la otra parte.'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 flex items-center gap-2">
                    <span className="h-1.5 flex-1 rounded-full bg-[#0F3D2E]" />
                    <span className={`h-1.5 flex-1 rounded-full transition ${registerStep === 2 ? 'bg-[#E85D3B]' : 'bg-[#E8E2D8]'}`} />
                  </div>

                  {registerStep === 1 ? (
                    <div className="space-y-5">
                      <div>
                        <label className={labelClass}>¿Cómo vas a usar Labora+?</label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button type="button" onClick={() => setRole(UserRole.RIDER)} className={`rounded-[16px] border p-3.5 text-left transition ${role === UserRole.RIDER ? 'border-[#9AB4A3] bg-[#EAF2ED] text-[#0F3D2E] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.05)]' : 'border-[#E0D9CE] bg-white text-stone-500'}`}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/75"><Bike size={18} /></div>
                            <p className="mt-2 text-sm font-extrabold">Autónomo</p>
                            <p className="mt-0.5 text-[10px] font-medium opacity-70">Gestiono mi actividad</p>
                          </button>
                          <button type="button" onClick={() => setRole(UserRole.MANAGER)} className={`rounded-[16px] border p-3.5 text-left transition ${role === UserRole.MANAGER ? 'border-[#9AB4A3] bg-[#EAF2ED] text-[#0F3D2E] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.05)]' : 'border-[#E0D9CE] bg-white text-stone-500'}`}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/75"><BriefcaseBusiness size={18} /></div>
                            <p className="mt-2 text-sm font-extrabold">Gestoría</p>
                            <p className="mt-0.5 text-[10px] font-medium opacity-70">Gestiono clientes</p>
                          </button>
                        </div>
                      </div>

                      <div><label className={labelClass}>{role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}</label><div className="relative"><UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} pl-12`} placeholder="Tu nombre" /></div></div>
                      <div><label className={labelClass}>Correo electrónico</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-12`} placeholder="tu@correo.com" /></div></div>
                      <div><label className={labelClass}>Contraseña</label><div className="relative"><KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-12`} placeholder="8 caracteres o más" /></div></div>
                      {error && <p className="rounded-[14px] bg-[#FFF5F2] px-3.5 py-3 text-xs font-bold text-[#944B3D]">{error}</p>}
                      <button type="button" onClick={continueRegistration} className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#0F3D2E] py-3.5 text-sm font-extrabold text-white">Continuar <ArrowRight size={17} /></button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <button type="button" onClick={() => { setRegisterStep(1); resetFeedback(); }} className="mb-1 inline-flex items-center gap-1.5 text-xs font-extrabold text-stone-500 hover:text-stone-800"><ArrowLeft size={14} /> Volver</button>

                      <IdentityImagePicker
                        mode={role === UserRole.MANAGER ? 'logo' : 'avatar'}
                        value={identityImage}
                        onChange={setIdentityImage}
                        title={role === UserRole.MANAGER ? 'Logo o imagen de la gestoría' : 'Foto de perfil'}
                        helper={role === UserRole.MANAGER ? 'Tus clientes la verán en mensajes y peticiones.' : 'Tu gestoría la verá al revisar tu actividad.'}
                      />

                      <div><label className={labelClass}>Teléfono <span className="font-normal text-stone-400">(opcional)</span></label><div className="relative"><Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} pl-12`} placeholder="+34 600 000 000" /></div></div>
                      <div><label className={labelClass}>NIF / NIE <span className="font-normal text-stone-400">(opcional)</span></label><input value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} className={inputClass} placeholder="12345678A" /></div>

                      {role === UserRole.RIDER ? (
                        <div><label className={labelClass}>Matrícula <span className="font-normal text-stone-400">(opcional)</span></label><input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className={inputClass} placeholder="1234 ABC" /></div>
                      ) : (
                        <div className="space-y-4">
                          <div><label className={labelClass}>Nombre de la gestoría</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="Nombre comercial" /></div>
                          <div><label className={labelClass}>N.º colegiado <span className="font-normal text-stone-400">(opcional)</span></label><input value={collegiateNumber} onChange={(e) => setCollegiateNumber(e.target.value)} className={inputClass} placeholder="Número de colegiado" /></div>
                        </div>
                      )}

                      {error && <p className="rounded-[14px] bg-[#FFF5F2] px-3.5 py-3 text-xs font-bold text-[#944B3D]">{error}</p>}
                      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#0F3D2E] py-3.5 text-sm font-extrabold text-white disabled:opacity-60">
                        {loading ? <Loader2 size={17} className="animate-spin" /> : <>Crear cuenta <ArrowRight size={17} /></>}
                      </button>
                    </form>
                  )}
                </>
              )}
            </section>

            <p className="mt-4 text-center text-[10px] font-medium leading-relaxed text-stone-400">
              Sesión protegida con Supabase Auth. El acceso a datos se limita mediante RLS.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

const Feature = ({ icon: Icon, title, text }: { icon: React.ComponentType<{ size?: number }>; title: string; text: string }) => (
  <div className="rounded-[18px] border border-white/12 bg-white/8 p-3.5 backdrop-blur">
    <Icon size={17} />
    <p className="mt-2 text-xs font-extrabold text-white">{title}</p>
    <p className="mt-0.5 text-[10px] font-medium text-white/55">{text}</p>
  </div>
);

export default Login;
