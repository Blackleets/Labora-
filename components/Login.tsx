import React, { useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Mail,
  Phone,
  UserRound,
  Bike
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import Logo from './Logo';

const Login: React.FC = () => {
  const { login, registerUser, users } = useData();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [collegiateNumber, setCollegiateNumber] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const account = users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (!account) {
      setError('No encontramos una cuenta con ese correo. Puedes crear una cuenta nueva.');
      return;
    }

    login(account.email, account.role);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }

    if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('Ya existe una cuenta con ese correo.');
      return;
    }

    registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      nif: nif.trim() || undefined,
      role,
      platforms: role === UserRole.RIDER ? [] : [],
      managerId: role === UserRole.RIDER ? 'm1' : undefined,
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

  const inputClass = 'w-full rounded-xl border border-[#DED7CC] bg-white px-3.5 py-3 text-sm text-stone-800 outline-none transition focus:border-[#7FA18D] focus:ring-2 focus:ring-[#DDE9E1]';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-stone-600';

  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-8 sm:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <Logo size="lg" showText={true} />
          <h1 className="mt-8 max-w-xl text-4xl font-bold tracking-tight text-stone-900">
            La gestión fiscal del reparto, en un solo lugar.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-600">
            Ingresos, gastos, documentación, modelos y comunicación con tu gestoría sin mezclar herramientas ni duplicar trabajo.
          </p>
        </section>

        <section className="rounded-3xl border border-[#E4DDD3] bg-[#FCFAF7] p-5 shadow-sm sm:p-7">
          <div className="mb-6 lg:hidden">
            <Logo size="md" showText={true} />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-stone-900">
              {mode === 'login' ? 'Acceder' : 'Crear cuenta'}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {mode === 'login'
                ? 'Entra con el correo asociado a tu cuenta.'
                : 'Configura los datos básicos. Podrás completar el perfil después.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#F0ECE6] p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === 'register' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@correo.com"
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>

              {error && <p className="rounded-xl bg-[#FFF1EE] px-3 py-2.5 text-xs font-medium text-[#9B493C]">{error}</p>}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] py-3 text-sm font-bold text-white transition hover:bg-[#244936]"
              >
                Entrar
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelClass}>Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.RIDER)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      role === UserRole.RIDER
                        ? 'border-[#8DAE9A] bg-[#EAF2ED] text-[#245338]'
                        : 'border-[#DED7CC] bg-white text-stone-500'
                    }`}
                  >
                    <Bike size={15} /> Autónomo
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.MANAGER)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      role === UserRole.MANAGER
                        ? 'border-[#8DAE9A] bg-[#EAF2ED] text-[#245338]'
                        : 'border-[#DED7CC] bg-white text-stone-500'
                    }`}
                  >
                    <BriefcaseBusiness size={15} /> Gestoría
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}</label>
                  <div className="relative">
                    <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} pl-10`} required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Correo</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} className={`${inputClass} pl-10`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>NIF / NIE</label>
                  <input value={nif} onChange={(event) => setNif(event.target.value.toUpperCase())} className={inputClass} />
                </div>
              </div>

              {role === UserRole.RIDER ? (
                <div>
                  <label className={labelClass}>Matrícula del vehículo <span className="font-normal text-stone-400">(opcional)</span></label>
                  <input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value.toUpperCase())} className={inputClass} />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nombre de la gestoría</label>
                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>N.º colegiado <span className="font-normal text-stone-400">(opcional)</span></label>
                    <input value={collegiateNumber} onChange={(event) => setCollegiateNumber(event.target.value)} className={inputClass} />
                  </div>
                </div>
              )}

              {error && <p className="rounded-xl bg-[#FFF1EE] px-3 py-2.5 text-xs font-medium text-[#9B493C]">{error}</p>}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] py-3 text-sm font-bold text-white transition hover:bg-[#244936]"
              >
                Crear cuenta
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-[11px] leading-relaxed text-stone-400">
            Labora+ organiza información de trabajo y fiscal. Las presentaciones oficiales requieren revisión y confirmación profesional.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;