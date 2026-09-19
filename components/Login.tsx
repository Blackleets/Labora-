import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  BriefcaseBusiness,
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
  const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-[#C9A227]/55 focus:bg-white/[0.06] focus:ring-4 focus:ring-[#C9A227]/12';
  const labelClass = 'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/40';

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#070C0A]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white/80 backdrop-blur">
          <Loader2 size={18} className="animate-spin text-[#C9A227]" /> Recuperando sesión…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#070C0A] text-[#FFFEFB]">
      <div className="mx-auto grid min-h-[100dvh] lg:grid-cols-[1.15fr_minmax(380px,480px)]">
        {/* Product stage — real composition change */}
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(26,92,66,0.45),transparent_55%),radial-gradient(ellipse_at_90%_20%,rgba(201,162,39,0.18),transparent_40%),linear-gradient(165deg,#050807_0%,#0A1F18_45%,#0F3D2E_100%)]" />
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E")' }} />

          <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center justify-between">
              <Logo size="lg" showText variant="dark" />
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8D48A]">
                Production grade
              </span>
            </div>

            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A227]">Sistema operativo fiscal</p>
              <h1 className="mt-4 font-serif text-[3.6rem] font-semibold leading-[0.95] tracking-[-0.04em] text-white xl:text-[4.1rem]">
                El panel que una gestoría seria pondría delante de un cliente.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/60">
                Evidencia, permisos y estados reales. Sin bots de “conectar banco” inventados. Sin dashboards de juguete.
              </p>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                {[
                  { k: 'Auth', v: 'Supabase + RLS' },
                  { k: 'Docs', v: 'Storage privado' },
                  { k: 'Fiscal', v: 'Estados auditables' }
                ].map((item) => (
                  <div key={item.k} className="rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9A227]">{item.k}</p>
                    <p className="mt-1 text-xs font-semibold text-white/85">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fake product frame — layout device, not fake data claims */}
            <div className="relative mt-10 max-w-2xl">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.45)] backdrop-blur">
                <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#0C1612]">
                  <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E85D3B]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C9A227]/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1A5C42]" />
                    <span className="ml-3 text-[10px] font-semibold tracking-wide text-white/35">labora.app / dinero</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-0">
                    <div className="space-y-2 border-r border-white/8 bg-black/30 p-4">
                      {['Inicio', 'Dinero', 'Modelos', 'Avisos'].map((label, i) => (
                        <div key={label} className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${i === 1 ? 'bg-[#1A5C42] text-white' : 'text-white/45'}`}>{label}</div>
                      ))}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Este mes</p>
                          <p className="mt-1 font-serif text-3xl font-semibold tracking-tight text-white">€ —</p>
                        </div>
                        <div className="rounded-full bg-[#E85D3B]/15 px-2.5 py-1 text-[10px] font-bold text-[#F3A08A]">Sin cifras inventadas</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-20 rounded-2xl border border-white/8 bg-white/[0.04]" />
                        <div className="h-20 rounded-2xl border border-white/8 bg-white/[0.04]" />
                      </div>
                      <div className="h-16 rounded-2xl border border-dashed border-white/10 bg-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Auth column */}
        <section className="relative flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(26,92,66,0.2),transparent_50%)] lg:bg-none" />
          <div className="relative w-full max-w-[420px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Logo size="md" showText variant="dark" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9A227]">Secure</span>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0E1512]/90 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="border-b border-white/8 px-2 pt-2">
                <div className="grid grid-cols-2 gap-1 p-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`rounded-2xl py-3 text-xs font-bold transition ${mode === 'login' ? 'bg-white text-[#070C0A]' : 'text-white/45 hover:text-white/70'}`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`rounded-2xl py-3 text-xs font-bold transition ${mode === 'register' ? 'bg-white text-[#070C0A]' : 'text-white/45 hover:text-white/70'}`}
                  >
                    Crear cuenta
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {mode === 'login' ? (
                  <>
                    <h2 className="font-serif text-[2rem] font-semibold leading-none tracking-tight text-white">Bienvenido de nuevo</h2>
                    <p className="mt-2 text-sm text-white/45">Accede a tu espacio de autónomo o gestoría.</p>

                    <form onSubmit={handleLogin} className="mt-8 space-y-4">
                      <div>
                        <label className={labelClass}>Correo</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); resetFeedback(); }} placeholder="tu@correo.com" className={`${inputClass} pl-11`} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Contraseña</label>
                        <div className="relative">
                          <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); resetFeedback(); }} placeholder="Tu contraseña" className={`${inputClass} pl-11`} required />
                        </div>
                      </div>
                      {error && <p className="rounded-2xl border border-[#E85D3B]/30 bg-[#E85D3B]/10 px-3.5 py-3 text-xs font-semibold text-[#F3A08A]">{error}</p>}
                      {info && <p className="rounded-2xl border border-[#C9A227]/25 bg-[#C9A227]/10 px-3.5 py-3 text-xs font-semibold text-[#E8D48A]">{info}</p>}
                      <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#E96B4B] to-[#E85D3B] py-3.5 text-sm font-extrabold text-white shadow-[0_12px_32px_rgba(232,93,59,0.35)] transition hover:brightness-110 disabled:opacity-60">
                        {loading ? <Loader2 size={17} className="animate-spin" /> : <>Entrar <ArrowRight size={17} /></>}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="font-serif text-[2rem] font-semibold leading-none tracking-tight text-white">Crea tu espacio</h2>
                        <p className="mt-2 text-sm text-white/45">Paso {registerStep} de 2</p>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`h-1.5 w-8 rounded-full ${registerStep >= 1 ? 'bg-[#E85D3B]' : 'bg-white/15'}`} />
                        <span className={`h-1.5 w-8 rounded-full ${registerStep >= 2 ? 'bg-[#E85D3B]' : 'bg-white/15'}`} />
                      </div>
                    </div>

                    {registerStep === 1 ? (
                      <div className="space-y-5">
                        <div>
                          <label className={labelClass}>Tipo de cuenta</label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button type="button" onClick={() => setRole(UserRole.RIDER)} className={`rounded-2xl border p-3.5 text-left transition ${role === UserRole.RIDER ? 'border-[#C9A227]/50 bg-[#1A5C42]/40 text-white' : 'border-white/10 bg-white/[0.03] text-white/55'}`}>
                              <Bike size={18} className={role === UserRole.RIDER ? 'text-[#C9A227]' : ''} />
                              <p className="mt-2 text-sm font-extrabold">Autónomo</p>
                              <p className="mt-0.5 text-[10px] opacity-70">Mi actividad</p>
                            </button>
                            <button type="button" onClick={() => setRole(UserRole.MANAGER)} className={`rounded-2xl border p-3.5 text-left transition ${role === UserRole.MANAGER ? 'border-[#C9A227]/50 bg-[#1A5C42]/40 text-white' : 'border-white/10 bg-white/[0.03] text-white/55'}`}>
                              <BriefcaseBusiness size={18} className={role === UserRole.MANAGER ? 'text-[#C9A227]' : ''} />
                              <p className="mt-2 text-sm font-extrabold">Gestoría</p>
                              <p className="mt-0.5 text-[10px] opacity-70">Mis clientes</p>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>{role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}</label>
                          <div className="relative">
                            <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} pl-11`} placeholder="Tu nombre" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Correo electrónico</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11`} placeholder="tu@correo.com" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Contraseña</label>
                          <div className="relative">
                            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-11`} placeholder="8 caracteres o más" />
                          </div>
                        </div>
                        {error && <p className="rounded-2xl border border-[#E85D3B]/30 bg-[#E85D3B]/10 px-3.5 py-3 text-xs font-semibold text-[#F3A08A]">{error}</p>}
                        <button type="button" onClick={continueRegistration} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-extrabold text-[#070C0A] transition hover:bg-[#E8D48A]">
                          Continuar <ArrowRight size={17} />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-4">
                        <button type="button" onClick={() => { setRegisterStep(1); resetFeedback(); }} className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-white/45 hover:text-white">
                          <ArrowLeft size={14} /> Volver
                        </button>

                        <IdentityImagePicker
                          mode={role === UserRole.MANAGER ? 'logo' : 'avatar'}
                          value={identityImage}
                          onChange={setIdentityImage}
                          title={role === UserRole.MANAGER ? 'Logo o imagen de la gestoría' : 'Foto de perfil'}
                          helper={role === UserRole.MANAGER ? 'Tus clientes la verán en mensajes y peticiones.' : 'Tu gestoría la verá al revisar tu actividad.'}
                        />

                        <div>
                          <label className={labelClass}>Teléfono <span className="font-normal text-white/30">(opcional)</span></label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} pl-11`} placeholder="+34 600 000 000" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>NIF / NIE <span className="font-normal text-white/30">(opcional)</span></label>
                          <input value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} className={inputClass} placeholder="12345678A" />
                        </div>

                        {role === UserRole.RIDER ? (
                          <div>
                            <label className={labelClass}>Matrícula <span className="font-normal text-white/30">(opcional)</span></label>
                            <input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className={inputClass} placeholder="1234 ABC" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className={labelClass}>Nombre de la gestoría</label>
                              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="Nombre comercial" />
                            </div>
                            <div>
                              <label className={labelClass}>N.º colegiado <span className="font-normal text-white/30">(opcional)</span></label>
                              <input value={collegiateNumber} onChange={(e) => setCollegiateNumber(e.target.value)} className={inputClass} placeholder="Número de colegiado" />
                            </div>
                          </div>
                        )}

                        {error && <p className="rounded-2xl border border-[#E85D3B]/30 bg-[#E85D3B]/10 px-3.5 py-3 text-xs font-semibold text-[#F3A08A]">{error}</p>}
                        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#E96B4B] to-[#E85D3B] py-3.5 text-sm font-extrabold text-white shadow-[0_12px_32px_rgba(232,93,59,0.35)] disabled:opacity-60">
                          {loading ? <Loader2 size={17} className="animate-spin" /> : <>Crear cuenta <ArrowRight size={17} /></>}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium text-white/30">
              <ShieldCheck size={12} className="text-[#C9A227]/70" />
              Supabase Auth · RLS · sin datos inventados
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
