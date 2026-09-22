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
import { managerSignupError, normalizeSpanishTaxId } from '../services/registrationValidation';
import { UserRole } from '../types';
import { useCountry } from '../contexts/CountryContext';
import AtmosphericPanel from './AtmosphericPanel';
import CountrySelector from './CountrySelector';
import IdentityImagePicker from './IdentityImagePicker';
import IntroAnimation from './IntroAnimation';
import Logo from './Logo';
import { withBaseUrl } from './brandMarks';

const Login: React.FC = () => {
  const { palette } = useGhibliAtmosphere();
  const { selectedCountry } = useCountry();
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
  const [introDone, setIntroDone] = useState(() => {
    try {
      return sessionStorage.getItem('labora_intro_seen') === '1';
    } catch {
      return false;
    }
  });

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
    'w-full rounded-xl border border-[var(--labora-border)] bg-[var(--labora-surface)] px-4 py-3.5 text-[15px] leading-normal text-[var(--labora-ink)] outline-none transition placeholder:text-[var(--labora-muted)] focus:border-[var(--labora-primary)]/40 focus:ring-4 focus:ring-[var(--labora-primary)]/08';
  const labelClass = 'labora-label mb-2.5 block';

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

    if (role === UserRole.MANAGER) {
      const managerError = managerSignupError({
        companyName: companyName.trim() || name.trim(),
        nif,
        collegiateNumber
      });
      if (managerError) {
        setError(managerError);
        return;
      }
    }

    setLoading(true);

    try {
      const result = await signUpRemote({
        name: name.trim(),
        email: normalizeEmail(email),
        phone: phone.trim() || undefined,
        nif: role === UserRole.MANAGER
          ? normalizeSpanishTaxId(nif)
          : (nif.trim().toUpperCase() || undefined),
        role,
        platforms: [],
        fiscalRegime: undefined,
        iaeCode: undefined,
        socialSecurityType: undefined,
        vehicleType: undefined,
        vehiclePlate: role === UserRole.RIDER ? vehiclePlate.trim().toUpperCase() || undefined : undefined,
        vehicleFuel: undefined,
        companyName: role === UserRole.MANAGER ? companyName.trim() || name.trim() : undefined,
        collegiateNumber: role === UserRole.MANAGER ? collegiateNumber.trim() : undefined,
        countryCode: selectedCountry.country_code
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--labora-canvas)]">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--labora-border)] bg-[var(--labora-surface)] px-5 py-3.5 text-sm font-medium text-[var(--labora-primary)] shadow-[0_12px_40px_rgba(30,42,36,0.06)]">
          <Loader2 size={18} className="animate-spin text-[var(--labora-clay)]" /> Recuperando sesión…
        </div>
      </div>
    );
  }

  if (!introDone) {
    return (
      <IntroAnimation
        onComplete={() => {
          try {
            sessionStorage.setItem('labora_intro_seen', '1');
          } catch {
            /* ignore quota / private mode */
          }
          setIntroDone(true);
        }}
      />
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[var(--labora-canvas)] text-[var(--labora-ink)] lg:flex-row">
      {/* Mobile atmospheric strip */}
      <div
        className="labora-film-grain relative h-36 w-full shrink-0 overflow-hidden border-b lg:hidden"
        style={{
          borderColor: palette.border,
          background: `
            radial-gradient(ellipse at 80% 20%, ${palette.sunGlow}99, transparent 42%),
            linear-gradient(180deg, #C5D5E4 0%, #D8E4DC 55%, ${palette.parchment} 100%)
          `
        }}
      >
        <AtmosphericPanel
          variant="strip"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <div className="relative z-10 flex h-full items-start justify-between p-5 pt-6">
          <Logo size="lg" showText variant="light" animated />
          <span
            className="rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm"
            style={{
              borderColor: 'rgba(30,42,36,0.10)',
              background: 'rgba(255,254,251,0.88)',
              color: palette.forest
            }}
          >
            Confianza
          </span>
        </div>
      </div>

      {/* Desktop left — editorial atmospheric narrative */}
      <section className="labora-film-grain relative hidden overflow-hidden lg:flex lg:flex-1 lg:flex-col">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 78% 12%, ${palette.sunGlow}aa, transparent 40%),
              radial-gradient(ellipse at 16% 8%, rgba(180, 200, 215, 0.38), transparent 48%),
              radial-gradient(ellipse at 50% 88%, ${palette.hillNear}55, transparent 55%),
              linear-gradient(180deg, #C5D5E4 0%, #D5E2DC 30%, #E8E6D8 58%, ${palette.parchment} 82%, ${palette.warmearth} 100%)
            `
          }}
        />
        <AtmosphericPanel
          variant="panel"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-16 2xl:p-20">
          <div className="flex items-center justify-between">
            <Logo size="hero" showText variant="light" animated />
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm"
              style={{
                borderColor: 'rgba(30,42,36,0.10)',
                background: 'rgba(255,254,251,0.72)',
                color: palette.forest
              }}
            >
              Espacio de trabajo
            </span>
          </div>

          <div className="mt-auto max-w-lg pb-12 xl:max-w-xl">
            <p
              className="labora-kicker"
              style={{ color: palette.gold }}
            >
              Claridad fiscal
            </p>
            <div className="labora-gold-line mt-4" />
            <h1 className="labora-display mt-6 text-[var(--labora-ink)] xl:text-[4rem] 2xl:text-[4.35rem]">
              Evidencia.<br />Confianza.<br />Sin ruido.
            </h1>
            <p className="labora-body mt-6 max-w-md text-[15px] leading-[1.7] text-[var(--labora-muted)] xl:text-base">
              Espacio de trabajo para autónomos y gestorías: claridad fiscal,
              archivo privado y estados claros con evidencia.
            </p>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-5">
              {[
                { k: 'Auth', v: 'Sesión segura' },
                { k: 'Docs', v: 'Archivo privado' },
                { k: 'Fiscal', v: 'Estados claros' }
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-2xl border bg-[var(--labora-surface)]/75 px-4 py-4 shadow-[0_8px_28px_rgba(30,42,36,0.05)] backdrop-blur-md"
                  style={{ borderColor: 'rgba(30,42,36,0.08)' }}
                >
                  <p className="labora-label" style={{ color: palette.clay }}>
                    {item.k}
                  </p>
                  <p className="mt-2 text-[13px] font-semibold leading-snug text-[var(--labora-ink-soft)]">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Auth column — elevated paper card */}
      <section className="relative z-20 flex flex-1 shrink-0 flex-col items-center justify-center px-5 py-10 pb-[40px] sm:px-10 lg:max-w-[540px] lg:bg-[var(--labora-canvas)] lg:pb-0 lg:py-14 xl:max-w-[620px] xl:px-14">
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${palette.softgreen}88, transparent 58%)`
          }}
        />
        <div className="relative w-full max-w-[420px]">
          <div className="labora-card-auth overflow-hidden">
            <div className="border-b px-3 pt-3" style={{ borderColor: 'rgba(232,223,200,0.55)' }}>
              <div className="grid grid-cols-2 gap-1.5 p-1.5">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`rounded-xl py-3 text-[13px] font-semibold tracking-[-0.01em] transition ${
                    mode === 'login'
                      ? 'bg-[var(--labora-primary)] text-[var(--labora-surface)] shadow-sm'
                      : 'text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)] hover:text-[var(--labora-ink-soft)]'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`rounded-xl py-3 text-[13px] font-semibold tracking-[-0.01em] transition ${
                    mode === 'register'
                      ? 'bg-[var(--labora-primary)] text-[var(--labora-surface)] shadow-sm'
                      : 'text-[var(--labora-muted)] hover:bg-[var(--labora-surface-2)] hover:text-[var(--labora-ink-soft)]'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              {mode === 'login' ? (
                <>
                  <h2 className="labora-title text-[var(--labora-ink)]">
                    Bienvenido de nuevo
                  </h2>
                  <p className="labora-body mt-3 text-[15px] leading-[1.65]">
                    Accede a tu espacio — autónomo o gestoría.
                  </p>

                  <form onSubmit={handleLogin} className="mt-9 space-y-5" noValidate>
                    <div>
                      <label htmlFor="labora-login-email" className={labelClass}>Correo</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" aria-hidden />
                        <input
                          id="labora-login-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); resetFeedback(); }}
                          placeholder="tu@correo.com"
                          className={`${inputClass} pl-11`}
                          required
                          aria-invalid={!!error}
                          aria-describedby={error ? 'labora-login-error' : info ? 'labora-login-info' : undefined}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="labora-login-password" className={labelClass}>Contraseña</label>
                      <div className="relative">
                        <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" aria-hidden />
                        <input
                          id="labora-login-password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); resetFeedback(); }}
                          placeholder="Tu contraseña"
                          className={`${inputClass} pl-11`}
                          required
                          aria-invalid={!!error}
                          aria-describedby={error ? 'labora-login-error' : undefined}
                        />
                      </div>
                    </div>
                    {error && (
                      <p id="labora-login-error" role="alert" className="rounded-xl border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3.5 py-3 text-xs font-medium text-[var(--labora-clay)]">
                        {error}
                      </p>
                    )}
                    {info && (
                      <p id="labora-login-info" role="status" className="rounded-xl border border-[var(--labora-border)] bg-[var(--labora-parchment)] px-3.5 py-3 text-xs font-medium text-[var(--labora-gold)]">
                        {info}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="labora-btn-clay mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] disabled:opacity-60"
                    >
                      {loading ? <Loader2 size={17} className="animate-spin" /> : <>Entrar <ArrowRight size={17} /></>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="labora-title text-[var(--labora-ink)]">
                        Crea tu espacio
                      </h2>
                      <p className="labora-body mt-3 text-[15px]">Paso {registerStep} de 2</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`h-1 w-7 rounded-full ${registerStep >= 1 ? 'bg-[var(--labora-clay)]' : 'bg-[var(--labora-border)]'}`} />
                      <span className={`h-1 w-7 rounded-full ${registerStep >= 2 ? 'bg-[var(--labora-clay)]' : 'bg-[var(--labora-border)]'}`} />
                    </div>
                  </div>

                  {registerStep === 1 ? (
                    <div className="space-y-6">
                      <div>
                        <label className={labelClass}>Tipo de cuenta</label>
                        <div className="grid grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={() => setRole(UserRole.RIDER)}
                            className={`rounded-xl border p-3.5 text-left transition ${
                              role === UserRole.RIDER
                                ? 'border-[var(--labora-primary)]/35 bg-[var(--labora-moss-soft)] text-[var(--labora-ink)]'
                                : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'
                            }`}
                          >
                            <Bike size={18} className={role === UserRole.RIDER ? 'text-[var(--labora-primary)]' : ''} />
                            <p className="mt-2 text-sm font-semibold">Trabajador</p>
                            <p className="mt-0.5 text-[10px] opacity-70">Mi vida laboral</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRole(UserRole.MANAGER)}
                            className={`rounded-xl border p-3.5 text-left transition ${
                              role === UserRole.MANAGER
                                ? 'border-[var(--labora-primary)]/35 bg-[var(--labora-moss-soft)] text-[var(--labora-ink)]'
                                : 'border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-muted)]'
                            }`}
                          >
                            <BriefcaseBusiness size={18} className={role === UserRole.MANAGER ? 'text-[var(--labora-primary)]' : ''} />
                            <p className="mt-2 text-sm font-semibold">Gestoría</p>
                            <p className="mt-0.5 text-[10px] opacity-70">Mis clientes</p>
                          </button>
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-[var(--labora-muted)]">
                          Para empleados, riders, autónomos y freelancers. Las gestorías disponen de un espacio profesional independiente.
                        </p>
                      </div>
                      <div>
                        <label htmlFor="labora-register-name" className={labelClass}>
                          {role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}
                        </label>
                        <div className="relative">
                          <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" aria-hidden />
                          <input id="labora-register-name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} pl-11`} placeholder="Tu nombre" aria-describedby={error ? 'labora-register-error' : undefined} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="labora-register-email" className={labelClass}>Correo electrónico</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" aria-hidden />
                          <input id="labora-register-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11`} placeholder="tu@correo.com" aria-describedby={error ? 'labora-register-error' : undefined} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="labora-register-password" className={labelClass}>Contraseña</label>
                        <div className="relative">
                          <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" aria-hidden />
                          <input id="labora-register-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-11`} placeholder="8 caracteres o más" aria-describedby={error ? 'labora-register-error' : undefined} />
                        </div>
                      </div>
                      {error && (
                        <p id="labora-register-error" role="alert" className="rounded-xl border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3.5 py-3 text-xs font-medium text-[var(--labora-clay)]">
                          {error}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={continueRegistration}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--labora-primary)] py-3.5 text-sm font-semibold text-[var(--labora-surface)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"
                      >
                        Continuar <ArrowRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-5">
                      <button
                        type="button"
                        onClick={() => { setRegisterStep(1); resetFeedback(); }}
                        className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--labora-muted)] hover:text-[var(--labora-primary)]"
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
                        <label className={labelClass}>País de operación</label>
                        <CountrySelector variant="cards" />
                        <p className="mt-2 text-[11px] leading-relaxed text-[var(--labora-muted)]">
                          Se guarda en tu perfil ({selectedCountry.display_name}). Moneda y modelos fiscales seguirán esta elección.
                        </p>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Teléfono <span className="font-normal text-[var(--labora-muted)]">(opcional)</span>
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--labora-muted)]" />
                          <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} pl-11`} placeholder="+34 600 000 000" />
                        </div>
                      </div>
                      {role === UserRole.RIDER ? (
                        <>
                          <div>
                            <label className={labelClass}>
                              NIF / NIE <span className="font-normal text-[var(--labora-muted)]">(opcional)</span>
                            </label>
                            <input value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} className={inputClass} placeholder="12345678Z" />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Matrícula <span className="font-normal text-[var(--labora-muted)]">(opcional)</span>
                            </label>
                            <input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className={inputClass} placeholder="1234 ABC" />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-5">
                          <p className="rounded-xl border border-[var(--labora-border)] bg-[var(--labora-canvas)] px-3.5 py-3 text-[11px] leading-relaxed text-[var(--labora-muted)]">
                            Las gestorías deben identificar NIF y colegiado. Los autónomos se registran libremente.
                          </p>
                          <div>
                            <label htmlFor="labora-register-company" className={labelClass}>Nombre de la gestoría</label>
                            <input
                              id="labora-register-company"
                              value={companyName}
                              onChange={(e) => { setCompanyName(e.target.value); resetFeedback(); }}
                              className={inputClass}
                              placeholder="Nombre comercial"
                              required
                              aria-describedby={error ? 'labora-register2-error' : undefined}
                            />
                          </div>
                          <div>
                            <label htmlFor="labora-register-nif-company" className={labelClass}>NIF de la empresa</label>
                            <input
                              id="labora-register-nif-company"
                              value={nif}
                              onChange={(e) => { setNif(e.target.value.toUpperCase()); resetFeedback(); }}
                              className={inputClass}
                              placeholder="B12345674"
                              required
                              autoComplete="off"
                              aria-describedby={error ? 'labora-register2-error' : 'labora-register-nif-hint'}
                            />
                            <p id="labora-register-nif-hint" className="mt-1.5 text-[10px] text-[var(--labora-muted)]">NIF, CIF o NIE válido (formato). No consultamos AEAT en tiempo real.</p>
                          </div>
                          <div>
                            <label htmlFor="labora-register-colegiado" className={labelClass}>Número de colegiado</label>
                            <input
                              id="labora-register-colegiado"
                              value={collegiateNumber}
                              onChange={(e) => { setCollegiateNumber(e.target.value); resetFeedback(); }}
                              className={inputClass}
                              placeholder="Ej. COL-9988"
                              required
                              autoComplete="off"
                              aria-describedby={error ? 'labora-register2-error' : undefined}
                            />
                          </div>
                        </div>
                      )}

                      {error && (
                        <p id="labora-register2-error" role="alert" className="rounded-xl border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3.5 py-3 text-xs font-medium text-[var(--labora-clay)]">
                          {error}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="labora-btn-clay flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={17} className="animate-spin" /> : <>Crear cuenta <ArrowRight size={17} /></>}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-medium tracking-[0.02em] text-[var(--labora-muted)]">
              <ShieldCheck size={12} className="text-[var(--labora-primary)]/70" />
              Auth segura · archivo privado · sin datos inventados
            </div>
            <p className="text-[10px] text-[var(--labora-muted)]">
              <a href={withBaseUrl("privacidad.html")} className="font-semibold text-[var(--labora-primary)] underline-offset-2 hover:underline">
                Privacidad
              </a>
              <span className="mx-1.5 text-[var(--labora-border)]">·</span>
              <a href={withBaseUrl("terminos.html")} className="font-semibold text-[var(--labora-primary)] underline-offset-2 hover:underline">
                Términos
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
