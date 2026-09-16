import React, { useMemo, useState } from 'react';
import { ArrowRight, Bike, Briefcase, Globe2, Leaf, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { MARKET_PROFILES, getMarketProfile } from '../modules/country-config/marketProfiles';
import Logo from './Logo';

const Login: React.FC = () => {
  const { login, registerUser, backendConfigured, showNotification } = useData();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  const [countryCode, setCountryCode] = useState('ES');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const market = useMemo(() => getMarketProfile(countryCode), [countryCode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!backendConfigured) {
      setError('El backend seguro de Labora+ todavía no está conectado.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Introduce tu correo y contraseña.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError(role === UserRole.MANAGER ? 'Indica el nombre de tu despacho o tu nombre profesional.' : 'Indica tu nombre.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await registerUser({
          name: name.trim(),
          email: email.trim(),
          role,
          platforms: [],
          banks: [],
          countryCode,
          companyName: role === UserRole.MANAGER ? name.trim() : undefined,
        }, password);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo completar la operación.';
      setError(message);
      showNotification('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4EFE5] px-4 py-8 text-stone-800 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[#DCE9DE]/70 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-[#F3D9B5]/65 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden p-8 lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#BFD0C3] bg-[#EAF2EB] px-3 py-1.5 text-xs font-semibold text-[#2E5A44]">
            <Leaf className="h-4 w-4" /> Menos caos entre trabajador y asesor
          </div>
          <h1 className="max-w-2xl font-serif text-5xl font-bold leading-[1.05] text-[#1E3329]">
            Lo que cobras, lo que gastas y lo que tu gestor necesita, en un solo sitio.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            Labora+ organiza plataformas, cobros, gastos, documentos y conversaciones. En los países donde todavía no existe un motor fiscal verificado, la app sigue funcionando como centro financiero y documental sin inventar obligaciones tributarias.
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            <Value icon={Bike} title="Trabajo" text="Controla cobros y gastos, seas autónomo o independiente." />
            <Value icon={Briefcase} title="Asesor" text="Revisa excepciones y pide documentos sin suplantarte." />
            <Value icon={ShieldCheck} title="Evidencia" text="Sin justificante, no hay hecho fiscal verificado." />
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#DFD5C6] bg-[#FCFAF7]/95 shadow-[0_24px_80px_rgba(64,52,39,.13)] backdrop-blur">
          <div className="border-b border-[#E8DFC8] px-6 py-6 sm:px-8">
            <Logo size="md" animated />
            <h2 className="mt-5 font-serif text-2xl font-bold text-stone-900">
              {mode === 'login' ? 'Vuelve a tu espacio' : 'Crea tu espacio Labora+'}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {mode === 'login' ? 'Tu identidad decide qué puedes ver; no existe acceso demo ni cambio de identidad.' : 'Elige tu país. Labora+ solo activa fiscalidad local cuando las reglas están verificadas.'}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {!backendConfigured && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-bold">Infraestructura segura pendiente de conexión</p>
                <p className="mt-1 text-xs leading-relaxed">Este build no creará usuarios ni guardará datos localmente hasta que el proyecto privado de Labora+ esté configurado.</p>
              </div>
            )}

            {mode === 'register' && (
              <div className="mb-5 space-y-3">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F1ECE3] p-1.5">
                  <button type="button" onClick={() => setRole(UserRole.RIDER)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${role === UserRole.RIDER ? 'bg-white text-[#2E5A44] shadow-sm' : 'text-stone-500'}`}><Bike className="h-4 w-4" /> Trabajo por mi cuenta</button>
                  <button type="button" onClick={() => setRole(UserRole.MANAGER)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${role === UserRole.MANAGER ? 'bg-white text-[#2E5A44] shadow-sm' : 'text-stone-500'}`}><Briefcase className="h-4 w-4" /> Soy gestor / asesor</button>
                </div>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500"><Globe2 className="h-3.5 w-3.5" /> País principal</span>
                  <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#6A917A] focus:ring-2 focus:ring-[#DCE9DE]">
                    {MARKET_PROFILES.map((profile) => <option key={profile.countryCode} value={profile.countryCode}>{profile.displayName}</option>)}
                  </select>
                </label>

                <div className={`rounded-xl border px-3 py-2.5 text-xs ${market.fiscalEngineStatus === 'verified' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>
                  <p className="font-bold">{market.displayName}: {market.productMode === 'fiscal_guided' ? 'control financiero + fiscalidad guiada' : 'control financiero + documentos + asesor'}</p>
                  <p className="mt-1 leading-relaxed">{market.fiscalEngineStatus === 'verified' ? 'El motor fiscal local puede mostrar estimaciones siempre separadas de una presentación oficial.' : 'La fiscalidad local no se calculará hasta disponer de reglas verificadas y versionadas.'}</p>
                </div>

                {role === UserRole.MANAGER && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs text-violet-800">
                    <p className="font-bold">Registrarte como gestor no significa estar verificado.</p>
                    <p className="mt-1 leading-relaxed">Tu identidad, negocio y acreditación profesional —cuando exista en tu país— se comprobarán por separado antes de mostrar un distintivo de confianza.</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <Field icon={UserIcon} type="text" value={name} onChange={setName} placeholder={role === UserRole.MANAGER ? 'Nombre profesional o del despacho' : 'Tu nombre completo'} autoComplete="name" />
              )}
              <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="tu@email.com" autoComplete="email" />
              <Field icon={Lock} type="password" value={password} onChange={setPassword} placeholder="Contraseña" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              {mode === 'register' && <Field icon={Lock} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repite la contraseña" autoComplete="new-password" />}

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</div>}

              <button disabled={isSubmitting || !backendConfigured} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#244A37] disabled:cursor-not-allowed disabled:opacity-45">
                {isSubmitting ? 'Comprobando…' : mode === 'login' ? 'Entrar de forma segura' : 'Crear cuenta'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 border-t border-[#E8DFC8] pt-5 text-center text-xs text-stone-500">
              {mode === 'login' ? '¿Es tu primera vez?' : '¿Ya tienes una cuenta?'}
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="ml-1.5 font-bold text-[#2E5A44] hover:underline">
                {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const Field: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}> = ({ icon: Icon, type, value, onChange, placeholder, autoComplete }) => (
  <label className="relative block">
    <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
    <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-[#DFD5C6] bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#6A917A] focus:ring-2 focus:ring-[#DCE9DE]" />
  </label>
);

const Value: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}> = ({ icon: Icon, title, text }) => (
  <div className="rounded-2xl border border-[#D8D0C1] bg-[#FCFAF7]/75 p-4">
    <Icon className="h-5 w-5 text-[#2E5A44]" />
    <p className="mt-3 font-serif text-sm font-bold text-stone-900">{title}</p>
    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{text}</p>
  </div>
);

export default Login;
