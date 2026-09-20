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
import { useGhibliAtmosphere } from '../contexts/GhibliAtmosphereContext';
import { recoverRemoteSession, signInRemote, signUpRemote } from '../services/authWorkspace';
import { UserRole } from '../types';
import IdentityImagePicker from './IdentityImagePicker';
import Logo from './Logo';
import MeadowLandscape from './MeadowLandscape';

const Login: React.FC = () => {
  const { palette, title, subtitle } = useGhibliAtmosphere();
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
  const inputClass =
    'w-full rounded-2xl border border-[#E8DFC8] bg-[#FFFEFB] px-4 py-3.5 text-[15px] text-[#292524] outline-none transition placeholder:text-[#9A9186] focus:border-[#2F5D4A]/45 focus:ring-4 focus:ring-[#2F5D4A]/10';
  const labelClass = 'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B645C]';

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F7F3EA]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E8DFC8] bg-[#FFFEFB] px-5 py-3.5 text-sm font-semibold text-[#2F5D4A] shadow-[0_12px_40px_rgba(47,93,74,0.08)]">
          <Loader2 size={18} className="animate-spin text-[#C96846]" /> Recuperando sesión…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F3EA] text-[#292524]">
      <div className="mx-auto grid min-h-[100dvh] lg:grid-cols-[1.12fr_minmax(380px,480px)]">
        {/* Soft landscape narrative */}
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 78% 14%, ${palette.sunGlow}cc, transparent 38%),
                radial-gradient(ellipse at 18% 10%, rgba(180, 210, 230, 0.42), transparent 46%),
                radial-gradient(ellipse at 50% 70%, ${palette.hillNear}66, transparent 55%),
                linear-gradient(180deg, #C9DDEE 0%, #DCEAE6 28%, #E8F0E0 52%, ${palette.parchment} 78%, ${palette.warmearth} 100%)
              `
            }}
          />

          {/* Watercolor wash */}
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{ background: palette.ambientGradient }}
          />

          {/* Rich meadow landscape illustration */}
          <MeadowLandscape
            variant="panel"
            className="pointer-events-none absolute inset-0 h-full w-full"
          />

          <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center justify-between">
              <Logo size="lg" showText variant="light" />
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{
                  borderColor: palette.bordergreen,
                  background: palette.softgreen,
                  color: palette.forest
                }}
              >
                Luz & cuidado
              </span>
            </div>

            <div className="max-w-xl pb-8">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: palette.gold }}
              >
                {title}
              </p>
              <h1 className="mt-5 font-serif text-[3.15rem] font-semibold leading-[1.04] tracking-[-0.03em] text-[#1E2A24] xl:text-[3.6rem]">
                Trabajo claro, entre colinas y hierba al sol.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#5C6E64]">
                {subtitle}. Fiscalidad y gestoría sin ruido: evidencia real, permisos limpios y un espacio con la calma de un prado.
              </p>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                {[
                  { k: 'Auth', v: 'Sesión segura' },
                  { k: 'Docs', v: 'Archivo privado' },
                  { k: 'Fiscal', v: 'Estados claros' }
                ].map((item) => (
                  <div
                    key={item.k}
                    className="rounded-2xl border px-3.5 py-3 shadow-[0_8px_28px_rgba(47,93,74,0.06)]"
                    style={{
                      borderColor: palette.border,
                      background: 'rgba(255,254,251,0.88)'
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.clay }}>
                      {item.k}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#2A332E]">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cream paper auth card */}
        <section className="relative flex items-center justify-center px-4 py-9 sm:px-8 lg:py-10">
          <div
            className="absolute inset-0 lg:bg-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${palette.softgreen}, transparent 55%)`
            }}
          />
          <div className="relative w-full max-w-[420px]">
            <div className="mb-6 overflow-hidden rounded-[22px] border lg:hidden" style={{ borderColor: palette.border }}>
              <div
                className="relative h-[152px] overflow-hidden"
                style={{
                  background: `
                    radial-gradient(ellipse at 80% 20%, ${palette.sunGlow}bb, transparent 40%),
                    linear-gradient(180deg, #D2E4F0 0%, #E4EFE4 55%, ${palette.hillNear} 100%)
                  `
                }}
              >
                <MeadowLandscape
                  variant="strip"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
                <div className="relative z-10 flex h-full flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Logo size="md" showText variant="light" />
                    <span
                      className="rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        borderColor: palette.bordergreen,
                        background: 'rgba(255,254,251,0.88)',
                        color: palette.forest
                      }}
                    >
                      Prado
                    </span>
                  </div>
                  <p className="max-w-[240px] font-serif text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-[#1E2A24]/90">
                    Luz suave, trabajo claro.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="overflow-hidden rounded-[28px] border shadow-[0_28px_80px_rgba(47,93,74,0.11),0_1px_0_rgba(255,255,255,0.95)_inset]"
              style={{
                borderColor: palette.border,
                background: 'linear-gradient(165deg, #FFFEFB 0%, #FCFAF5 42%, #F8F3EA 100%)',
                boxShadow: '0 28px 80px rgba(47,93,74,0.11), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,254,251,0.5)'
              }}
            >
              <div className="border-b px-2 pt-2" style={{ borderColor: palette.borderSubtle }}>
                <div className="grid grid-cols-2 gap-1 p-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`rounded-2xl py-3 text-xs font-bold transition ${
                      mode === 'login'
                        ? 'bg-[#EBF3ED] text-[#1E2A24] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.12)]'
                        : 'text-[#6B645C] hover:bg-[#F0EBE1] hover:text-[#2A332E]'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`rounded-2xl py-3 text-xs font-bold transition ${
                      mode === 'register'
                        ? 'bg-[#EBF3ED] text-[#1E2A24] shadow-[inset_0_0_0_1px_rgba(47,93,74,0.12)]'
                        : 'text-[#6B645C] hover:bg-[#F0EBE1] hover:text-[#2A332E]'
                    }`}
                  >
                    Crear cuenta
                  </button>
                </div>
              </div>

              <div className="p-7 sm:p-9">
                {mode === 'login' ? (
                  <>
                    <h2 className="font-serif text-[2rem] font-semibold leading-none tracking-tight text-[#1E2A24]">
                      Bienvenido de nuevo
                    </h2>
                    <p className="mt-2 text-sm text-[#6B645C]">
                      Entra a tu espacio de autónomo o gestoría, con luz suave.
                    </p>

                    <form onSubmit={handleLogin} className="mt-9 space-y-4">
                      <div>
                        <label className={labelClass}>Correo</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9186]" />
                          <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); resetFeedback(); }}
                            placeholder="tu@correo.com"
                            className={`${inputClass} pl-11`}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Contraseña</label>
                        <div className="relative">
                          <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9186]" />
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); resetFeedback(); }}
                            placeholder="Tu contraseña"
                            className={`${inputClass} pl-11`}
                            required
                          />
                        </div>
                      </div>
                      {error && (
                        <p className="rounded-2xl border border-[#EAD6C9] bg-[#FAF3EE] px-3.5 py-3 text-xs font-semibold text-[#C96846]">
                          {error}
                        </p>
                      )}
                      {info && (
                        <p className="rounded-2xl border border-[#FDE3B8] bg-[#FEF7EB] px-3.5 py-3 text-xs font-semibold text-[#B87A24]">
                          {info}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#D97757] to-[#C96846] py-3.5 text-sm font-extrabold text-white shadow-[0_12px_32px_rgba(201,104,70,0.28)] transition hover:brightness-105 disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={17} className="animate-spin" /> : <>Entrar <ArrowRight size={17} /></>}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="font-serif text-[2rem] font-semibold leading-none tracking-tight text-[#1E2A24]">
                          Crea tu espacio
                        </h2>
                        <p className="mt-2 text-sm text-[#6B645C]">Paso {registerStep} de 2</p>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`h-1.5 w-8 rounded-full ${registerStep >= 1 ? 'bg-[#C96846]' : 'bg-[#E8DFC8]'}`} />
                        <span className={`h-1.5 w-8 rounded-full ${registerStep >= 2 ? 'bg-[#C96846]' : 'bg-[#E8DFC8]'}`} />
                      </div>
                    </div>

                    {registerStep === 1 ? (
                      <div className="space-y-5">
                        <div>
                          <label className={labelClass}>Tipo de cuenta</label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setRole(UserRole.RIDER)}
                              className={`rounded-2xl border p-3.5 text-left transition ${
                                role === UserRole.RIDER
                                  ? 'border-[#2F5D4A]/40 bg-[#EBF3ED] text-[#1E2A24]'
                                  : 'border-[#E8DFC8] bg-[#FFFEFB] text-[#6B645C]'
                              }`}
                            >
                              <Bike size={18} className={role === UserRole.RIDER ? 'text-[#2F5D4A]' : ''} />
                              <p className="mt-2 text-sm font-extrabold">Autónomo</p>
                              <p className="mt-0.5 text-[10px] opacity-70">Mi actividad</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRole(UserRole.MANAGER)}
                              className={`rounded-2xl border p-3.5 text-left transition ${
                                role === UserRole.MANAGER
                                  ? 'border-[#2F5D4A]/40 bg-[#EBF3ED] text-[#1E2A24]'
                                  : 'border-[#E8DFC8] bg-[#FFFEFB] text-[#6B645C]'
                              }`}
                            >
                              <BriefcaseBusiness size={18} className={role === UserRole.MANAGER ? 'text-[#2F5D4A]' : ''} />
                              <p className="mt-2 text-sm font-extrabold">Gestoría</p>
                              <p className="mt-0.5 text-[10px] opacity-70">Mis clientes</p>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>
                            {role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}
                          </label>
                          <div className="relative">
                            <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9186]" />
                            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} pl-11`} placeholder="Tu nombre" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Correo electrónico</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9186]" />
                            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11`} placeholder="tu@correo.com" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Contraseña</label>
                          <div className="relative">
                            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9186]" />
                            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-11`} placeholder="8 caracteres o más" />
                          </div>
                        </div>
                        {error && (
                          <p className="rounded-2xl border border-[#EAD6C9] bg-[#FAF3EE] px-3.5 py-3 text-xs font-semibold text-[#C96846]">
                            {error}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={continueRegistration}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2F5D4A] py-3.5 text-sm font-extrabold text-[#FFFEFB] transition hover:bg-[#264A3C]"
                        >
                          Continuar <ArrowRight size={17} />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-4">
                        <button
                          type="button"
                          onClick={() => { setRegisterStep(1); resetFeedback(); }}
                          className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#6B645C] hover:text-[#2F5D4A]"
                        >
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
                          <label className={labelClass}>
                            Teléfono <span className="font-normal text-[#9A9186]">(opcional)</span>
                          </label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9186]" />
                            <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} pl-11`} placeholder="+34 600 000 000" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>
                            NIF / NIE <span className="font-normal text-[#9A9186]">(opcional)</span>
                          </label>
                          <input value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} className={inputClass} placeholder="12345678A" />
                        </div>

                        {role === UserRole.RIDER ? (
                          <div>
                            <label className={labelClass}>
                              Matrícula <span className="font-normal text-[#9A9186]">(opcional)</span>
                            </label>
                            <input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className={inputClass} placeholder="1234 ABC" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className={labelClass}>Nombre de la gestoría</label>
                              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="Nombre comercial" />
                            </div>
                            <div>
                              <label className={labelClass}>
                                N.º colegiado <span className="font-normal text-[#9A9186]">(opcional)</span>
                              </label>
                              <input value={collegiateNumber} onChange={(e) => setCollegiateNumber(e.target.value)} className={inputClass} placeholder="Número de colegiado" />
                            </div>
                          </div>
                        )}

                        {error && (
                          <p className="rounded-2xl border border-[#EAD6C9] bg-[#FAF3EE] px-3.5 py-3 text-xs font-semibold text-[#C96846]">
                            {error}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#D97757] to-[#C96846] py-3.5 text-sm font-extrabold text-white shadow-[0_12px_32px_rgba(201,104,70,0.28)] disabled:opacity-60"
                        >
                          {loading ? <Loader2 size={17} className="animate-spin" /> : <>Crear cuenta <ArrowRight size={17} /></>}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium text-[#8A8278]">
              <ShieldCheck size={12} className="text-[#2F5D4A]/80" />
              Auth segura · archivo privado · sin datos inventados
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
