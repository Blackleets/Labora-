import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  BriefcaseBusiness,
  Mail,
  Phone,
  UserRound
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import Logo from './Logo';

const Login: React.FC = () => {
  const { login, registerUser, users } = useData();
  const firstRun = users.length === 0;

  const [mode, setMode] = useState<'login' | 'register'>(firstRun ? 'register' : 'login');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [collegiateNumber, setCollegiateNumber] = useState('');
  const [error, setError] = useState('');
  const [missingAccount, setMissingAccount] = useState(false);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMissingAccount(false);

    const normalizedEmail = normalizeEmail(email);
    const account = users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (!account) {
      setMissingAccount(true);
      setError('No existe una cuenta con este correo.');
      return;
    }

    login(account.email, account.role);
  };

  const openRegisterWithCurrentEmail = () => {
    setError('');
    setMissingAccount(false);
    setMode('register');
    setRegisterStep(1);
  };

  const continueRegistration = () => {
    setError('');

    if (!name.trim()) {
      setError('Escribe tu nombre para continuar.');
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError('Escribe un correo electrónico válido.');
      return;
    }

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      setError('Ya existe una cuenta con ese correo.');
      return;
    }

    setRegisterStep(2);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    registerUser({
      name: name.trim(),
      email: normalizeEmail(email),
      phone: phone.trim() || undefined,
      nif: nif.trim() || undefined,
      role,
      platforms: [],
      fiscalRegime: role === UserRole.RIDER ? '036_037_directa' : undefined,
      iaeCode: role === UserRole.RIDER ? '849.5' : undefined,
      socialSecurityType: role === UserRole.RIDER ? 'tarifa_plana' : undefined,
      vehicleType: role === UserRole.RIDER ? 'moto' : undefined,
      vehiclePlate: role === UserRole.RIDER ? vehiclePlate.trim() : undefined,
      vehicleFuel: role === UserRole.RIDER ? 'gasolina' : undefined,
      companyName: role === UserRole.MANAGER ? companyName.trim() || name.trim() : undefined,
      collegiateNumber: role === UserRole.MANAGER ? collegiateNumber.trim() || undefined : undefined,
      countryCode: 'ES'
    });
  };

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setRegisterStep(1);
    setError('');
    setMissingAccount(false);
  };

  const inputClass = 'w-full rounded-2xl border border-[#DED7CC] bg-white px-4 py-3.5 text-[15px] text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-[#7FA18D] focus:ring-4 focus:ring-[#DDE9E1]/70';
  const labelClass = 'mb-2 block text-xs font-bold text-stone-600';

  return (
    <div className="min-h-screen bg-[#F7F5F1] px-4 py-7 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl items-center justify-center lg:grid lg:grid-cols-[1fr_430px] lg:gap-16">
        <section className="hidden lg:block">
          <Logo size="lg" showText={true} />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#64806F]">Trabajo y fiscalidad</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight text-stone-900">
            Todo lo importante de tu actividad, sin ruido.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-600">
            Gastos, ingresos, documentación, modelos y comunicación con tu gestoría desde un mismo espacio.
          </p>
        </section>

        <main className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="md" showText={true} />
          </div>

          <section className="rounded-[28px] border border-[#E4DED5] bg-[#FCFBF8] p-5 shadow-[0_18px_60px_-42px_rgba(50,42,34,0.35)] sm:p-7">
            {mode === 'login' ? (
              <>
                <div className="mb-7">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64806F]">Labora+</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">Bienvenido de nuevo</h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    Entra con el correo que usaste al crear tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={labelClass}>Correo electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (error) {
                            setError('');
                            setMissingAccount(false);
                          }
                        }}
                        placeholder="tu@correo.com"
                        className={`${inputClass} pl-12`}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-[#F0D8D1] bg-[#FFF5F2] p-3.5">
                      <p className="text-xs font-semibold text-[#944B3D]">{error}</p>
                      {missingAccount && (
                        <button
                          type="button"
                          onClick={openRegisterWithCurrentEmail}
                          className="mt-2 text-xs font-bold text-[#2E5A44] hover:underline"
                        >
                          Crear cuenta con este correo
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] py-3.5 text-sm font-bold text-white transition hover:bg-[#244936] active:scale-[0.99]"
                  >
                    Continuar
                    <ArrowRight size={17} />
                  </button>
                </form>

                <div className="mt-6 border-t border-[#EAE4DB] pt-5 text-center">
                  <p className="text-xs text-stone-500">
                    ¿Primera vez en Labora+?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#2E5A44] hover:underline"
                    >
                      Crear cuenta
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64806F]">
                      {firstRun ? 'Empezar' : 'Nueva cuenta'}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
                      {registerStep === 1 ? 'Crea tu espacio' : 'Completa tu perfil'}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-stone-500">
                      {registerStep === 1
                        ? 'Solo necesitamos los datos básicos para empezar.'
                        : 'Estos datos son opcionales y puedes cambiarlos después.'}
                    </p>
                  </div>

                  {!firstRun && registerStep === 1 && (
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="shrink-0 text-xs font-bold text-stone-400 hover:text-stone-700"
                    >
                      Acceder
                    </button>
                  )}
                </div>

                <div className="mb-6 flex items-center gap-2">
                  <span className={`h-1.5 flex-1 rounded-full ${registerStep >= 1 ? 'bg-[#2E5A44]' : 'bg-[#E8E2D8]'}`} />
                  <span className={`h-1.5 flex-1 rounded-full ${registerStep >= 2 ? 'bg-[#2E5A44]' : 'bg-[#E8E2D8]'}`} />
                </div>

                {registerStep === 1 ? (
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>¿Cómo vas a usar Labora+?</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRole(UserRole.RIDER)}
                          className={`rounded-2xl border p-3.5 text-left transition ${
                            role === UserRole.RIDER
                              ? 'border-[#8FAF9A] bg-[#EDF4EF] text-[#245338] ring-1 ring-[#BFD1C5]'
                              : 'border-[#E0D9CE] bg-white text-stone-500'
                          }`}
                        >
                          <Bike size={18} />
                          <p className="mt-2 text-sm font-bold">Autónomo</p>
                          <p className="mt-0.5 text-[10px] leading-snug opacity-70">Gestiono mi actividad</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole(UserRole.MANAGER)}
                          className={`rounded-2xl border p-3.5 text-left transition ${
                            role === UserRole.MANAGER
                              ? 'border-[#8FAF9A] bg-[#EDF4EF] text-[#245338] ring-1 ring-[#BFD1C5]'
                              : 'border-[#E0D9CE] bg-white text-stone-500'
                          }`}
                        >
                          <BriefcaseBusiness size={18} />
                          <p className="mt-2 text-sm font-bold">Gestoría</p>
                          <p className="mt-0.5 text-[10px] leading-snug opacity-70">Gestiono clientes</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>{role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}</label>
                      <div className="relative">
                        <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className={`${inputClass} pl-12`}
                          placeholder={role === UserRole.MANAGER ? 'Tu nombre' : 'Nombre y apellidos'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Correo electrónico</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={`${inputClass} pl-12`}
                          placeholder="tu@correo.com"
                        />
                      </div>
                    </div>

                    {error && <p className="rounded-2xl bg-[#FFF5F2] px-3.5 py-3 text-xs font-semibold text-[#944B3D]">{error}</p>}

                    <button
                      type="button"
                      onClick={continueRegistration}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] py-3.5 text-sm font-bold text-white transition hover:bg-[#244936] active:scale-[0.99]"
                    >
                      Continuar
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => { setRegisterStep(1); setError(''); }}
                      className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800"
                    >
                      <ArrowLeft size={14} />
                      Volver
                    </button>

                    <div>
                      <label className={labelClass}>Teléfono <span className="font-normal text-stone-400">(opcional)</span></label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          inputMode="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className={`${inputClass} pl-12`}
                          placeholder="+34 600 000 000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>NIF / NIE <span className="font-normal text-stone-400">(opcional)</span></label>
                      <input
                        value={nif}
                        onChange={(event) => setNif(event.target.value.toUpperCase())}
                        className={inputClass}
                        placeholder="12345678A"
                      />
                    </div>

                    {role === UserRole.RIDER ? (
                      <div>
                        <label className={labelClass}>Matrícula <span className="font-normal text-stone-400">(opcional)</span></label>
                        <input
                          value={vehiclePlate}
                          onChange={(event) => setVehiclePlate(event.target.value.toUpperCase())}
                          className={inputClass}
                          placeholder="1234 ABC"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>Nombre de la gestoría</label>
                          <input
                            value={companyName}
                            onChange={(event) => setCompanyName(event.target.value)}
                            className={inputClass}
                            placeholder="Nombre comercial"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>N.º colegiado <span className="font-normal text-stone-400">(opcional)</span></label>
                          <input
                            value={collegiateNumber}
                            onChange={(event) => setCollegiateNumber(event.target.value)}
                            className={inputClass}
                            placeholder="Número de colegiado"
                          />
                        </div>
                      </div>
                    )}

                    {error && <p className="rounded-2xl bg-[#FFF5F2] px-3.5 py-3 text-xs font-semibold text-[#944B3D]">{error}</p>}

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] py-3.5 text-sm font-bold text-white transition hover:bg-[#244936] active:scale-[0.99]"
                    >
                      Crear cuenta
                      <ArrowRight size={17} />
                    </button>
                  </form>
                )}
              </>
            )}
          </section>

          <p className="mt-5 text-center text-[10px] leading-relaxed text-stone-400">
            Labora+ organiza tu información de trabajo y fiscalidad. No sustituye una presentación oficial ante la AEAT.
          </p>
        </main>
      </div>
    </div>
  );
};

export default Login;
