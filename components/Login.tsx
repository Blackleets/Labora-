import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Bike, BriefcaseBusiness, Mail, Phone, UserRound } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { identityImageStore } from '../services/identityImage';
import { UserRole } from '../types';
import IdentityImagePicker from './IdentityImagePicker';
import Logo from './Logo';

const Login: React.FC = () => {
  const { login, registerUser, users } = useData();
  const firstRun = users.length === 0;
  const [mode, setMode] = useState<'login' | 'register'>(firstRun ? 'register' : 'login');
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [collegiateNumber, setCollegiateNumber] = useState('');
  const [identityImage, setIdentityImage] = useState<string>();
  const [error, setError] = useState('');
  const [missingAccount, setMissingAccount] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const inputClass = 'w-full rounded-2xl border border-[#DED7CC] bg-white px-4 py-3.5 text-[15px] text-stone-800 outline-none transition placeholder:text-stone-300 focus:border-[#7FA18D] focus:ring-4 focus:ring-[#DDE9E1]/70';
  const labelClass = 'mb-2 block text-xs font-bold text-stone-600';

  const resetFeedback = () => {
    setError('');
    setMissingAccount(false);
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    const account = users.find((user) => user.email.toLowerCase() === normalizedEmail);
    if (!account) {
      setMissingAccount(true);
      setError('No existe una cuenta con este correo.');
      return;
    }
    login(account.email, account.role);
  };

  const continueRegistration = () => {
    resetFeedback();
    if (!name.trim()) return setError('Escribe tu nombre para continuar.');
    if (!normalizedEmail) return setError('Escribe un correo electrónico válido.');
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) return setError('Ya existe una cuenta con ese correo.');
    setStep(2);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    identityImageStore.setForEmail(normalizedEmail, identityImage);
    registerUser({
      name: name.trim(), email: normalizedEmail, phone: phone.trim() || undefined,
      nif: nif.trim() || undefined, role, platforms: [], countryCode: 'ES',
      fiscalRegime: role === UserRole.RIDER ? '036_037_directa' : undefined,
      iaeCode: role === UserRole.RIDER ? '849.5' : undefined,
      socialSecurityType: role === UserRole.RIDER ? 'tarifa_plana' : undefined,
      vehicleType: role === UserRole.RIDER ? 'moto' : undefined,
      vehiclePlate: role === UserRole.RIDER ? vehiclePlate.trim() : undefined,
      vehicleFuel: role === UserRole.RIDER ? 'gasolina' : undefined,
      companyName: role === UserRole.MANAGER ? companyName.trim() || name.trim() : undefined,
      collegiateNumber: role === UserRole.MANAGER ? collegiateNumber.trim() || undefined : undefined
    });
  };

  const openRegister = () => {
    resetFeedback();
    setMode('register');
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F1] px-4 py-7 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl items-center justify-center lg:grid lg:grid-cols-[1fr_430px] lg:gap-16">
        <section className="hidden lg:block">
          <Logo size="lg" showText />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#64806F]">Trabajo y fiscalidad</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight text-stone-900">Todo lo importante de tu actividad, sin ruido.</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-600">Gastos, ingresos, documentos, modelos y comunicación con tu gestoría en un mismo espacio.</p>
        </section>

        <main className="w-full max-w-md">
          <div className="mb-7 flex justify-center lg:hidden"><Logo size="md" showText /></div>
          <section className="rounded-[28px] border border-[#E4DED5] bg-[#FCFBF8] p-5 shadow-[0_18px_60px_-42px_rgba(50,42,34,0.35)] sm:p-7">
            {mode === 'login' ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64806F]">Labora+</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">Bienvenido de nuevo</h2>
                <p className="mt-2 text-sm text-stone-500">Entra con el correo asociado a tu cuenta.</p>
                <form onSubmit={handleLogin} className="mt-7 space-y-4">
                  <div>
                    <label className={labelClass}>Correo electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); resetFeedback(); }} placeholder="tu@correo.com" className={`${inputClass} pl-12`} required />
                    </div>
                  </div>
                  {error && (
                    <div className="rounded-2xl border border-[#F0D8D1] bg-[#FFF5F2] p-3.5 text-xs font-semibold text-[#944B3D]">
                      {error}
                      {missingAccount && <button type="button" onClick={openRegister} className="mt-2 block font-bold text-[#2E5A44]">Crear cuenta con este correo</button>}
                    </div>
                  )}
                  <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] py-3.5 text-sm font-bold text-white">Entrar <ArrowRight size={17} /></button>
                </form>
                <p className="mt-6 border-t border-[#EAE4DB] pt-5 text-center text-xs text-stone-500">¿Primera vez? <button type="button" onClick={openRegister} className="font-bold text-[#2E5A44]">Crear cuenta</button></p>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64806F]">{firstRun ? 'Empezar' : 'Nueva cuenta'}</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">{step === 1 ? 'Crea tu espacio' : 'Tu identidad'}</h2>
                    <p className="mt-2 text-sm text-stone-500">{step === 1 ? 'Elige el tipo de cuenta y añade tus datos básicos.' : 'Añade una foto o logo para identificarte dentro de Labora+.'}</p>
                  </div>
                  {!firstRun && step === 1 && <button type="button" onClick={() => setMode('login')} className="text-xs font-bold text-stone-400">Acceder</button>}
                </div>
                <div className="my-6 flex gap-2"><span className="h-1.5 flex-1 rounded-full bg-[#2E5A44]" /><span className={`h-1.5 flex-1 rounded-full ${step === 2 ? 'bg-[#2E5A44]' : 'bg-[#E8E2D8]'}`} /></div>

                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button type="button" onClick={() => setRole(UserRole.RIDER)} className={`rounded-2xl border p-3.5 text-left ${role === UserRole.RIDER ? 'border-[#8FAF9A] bg-[#EDF4EF] text-[#245338]' : 'border-[#E0D9CE] bg-white text-stone-500'}`}><Bike size={18} /><p className="mt-2 text-sm font-bold">Autónomo</p><p className="text-[10px] opacity-70">Gestiono mi actividad</p></button>
                      <button type="button" onClick={() => setRole(UserRole.MANAGER)} className={`rounded-2xl border p-3.5 text-left ${role === UserRole.MANAGER ? 'border-[#8FAF9A] bg-[#EDF4EF] text-[#245338]' : 'border-[#E0D9CE] bg-white text-stone-500'}`}><BriefcaseBusiness size={18} /><p className="mt-2 text-sm font-bold">Gestoría</p><p className="text-[10px] opacity-70">Gestiono clientes</p></button>
                    </div>
                    <div><label className={labelClass}>{role === UserRole.MANAGER ? 'Nombre de contacto' : 'Nombre y apellidos'}</label><div className="relative"><UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} pl-12`} /></div></div>
                    <div><label className={labelClass}>Correo electrónico</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-12`} /></div></div>
                    {error && <p className="rounded-xl bg-[#FFF5F2] p-3 text-xs font-semibold text-[#944B3D]">{error}</p>}
                    <button type="button" onClick={continueRegistration} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] py-3.5 text-sm font-bold text-white">Continuar <ArrowRight size={17} /></button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500"><ArrowLeft size={14} /> Volver</button>
                    <IdentityImagePicker mode={role === UserRole.MANAGER ? 'logo' : 'avatar'} value={identityImage} onChange={setIdentityImage} title={role === UserRole.MANAGER ? 'Logo o imagen de la gestoría' : 'Tu foto'} helper={role === UserRole.MANAGER ? 'Tus clientes la verán en mensajes y peticiones.' : 'Tu gestor la verá en clientes, auditoría y mensajes.'} />
                    <div><label className={labelClass}>Teléfono <span className="font-normal text-stone-400">(opcional)</span></label><div className="relative"><Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} pl-12`} /></div></div>
                    <div><label className={labelClass}>NIF / NIE <span className="font-normal text-stone-400">(opcional)</span></label><input value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} className={inputClass} /></div>
                    {role === UserRole.RIDER ? <div><label className={labelClass}>Matrícula <span className="font-normal text-stone-400">(opcional)</span></label><input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className={inputClass} /></div> : <><div><label className={labelClass}>Nombre de la gestoría</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} /></div><div><label className={labelClass}>N.º colegiado <span className="font-normal text-stone-400">(opcional)</span></label><input value={collegiateNumber} onChange={(e) => setCollegiateNumber(e.target.value)} className={inputClass} /></div></>}
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E5A44] py-3.5 text-sm font-bold text-white">Crear cuenta <ArrowRight size={17} /></button>
                  </form>
                )}
              </>
            )}
          </section>
          <p className="mt-5 text-center text-[10px] text-stone-400">Labora+ organiza tu información. Las presentaciones oficiales requieren revisión profesional.</p>
        </main>
      </div>
    </div>
  );
};

export default Login;
