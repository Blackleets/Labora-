import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { 
  Bike, Briefcase, Mail, Lock, User as UserIcon, Phone, ArrowRight, 
  CheckCircle2, AlertCircle, Sparkles, Shield, Fuel, FileText, Check 
} from 'lucide-react';
import Logo from './Logo';
import { OFFICIAL_DELIVERY_PLATFORMS } from '../modules/delivery/data/platforms';

const Login: React.FC = () => {
  const { login, registerUser, users } = useData();
  const [isRegistering, setIsRegistering] = useState(false);
  const [regStep, setRegStep] = useState(1);
  
  // Basic Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+34 612 345 678');
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  
  // Fiscal & Delivery Specifics
  const [nif, setNif] = useState('48192834K');
  const [fiscalRegime, setFiscalRegime] = useState('036_037_directa');
  const [iaeCode, setIaeCode] = useState('849.5 - Servicios de mensajería y reparto');
  const [socialSecurityType, setSocialSecurityType] = useState('tarifa_plana');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Uber Eats', 'Glovo']);
  const [vehicleType, setVehicleType] = useState<'moto' | 'bici' | 'coche' | 'furgoneta' | 'patinete'>('moto');
  const [vehiclePlate, setVehiclePlate] = useState('4521 LBR');
  const [vehicleFuel, setVehicleFuel] = useState<'gasolina' | 'diesel' | 'electrico' | 'glp'>('gasolina');
  
  // Gestor Specifics
  const [companyName, setCompanyName] = useState('Gestoría Fiscal & Tributaria S.L.');
  const [collegiateNumber, setCollegiateNumber] = useState('COL-MAD-9421');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const togglePlatform = (platName: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platName) 
        ? prev.filter(p => p !== platName) 
        : [...prev, platName]
    );
  };

  const handleSimpleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: 'Introduce un correo válido' });
      return;
    }
    login(email, role);
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    registerUser({
      name: name || (role === UserRole.RIDER ? 'Nuevo Rider' : 'Nuevo Gestor'),
      email: email || `usuario_${Date.now()}@labora.plus`,
      role,
      phone,
      nif,
      fiscalRegime: role === UserRole.RIDER ? fiscalRegime : undefined,
      iaeCode: role === UserRole.RIDER ? iaeCode : undefined,
      socialSecurityType: role === UserRole.RIDER ? socialSecurityType : undefined,
      vehicleType: role === UserRole.RIDER ? vehicleType : undefined,
      vehiclePlate: role === UserRole.RIDER ? vehiclePlate : undefined,
      vehicleFuel: role === UserRole.RIDER ? vehicleFuel : undefined,
      companyName: role === UserRole.MANAGER ? companyName : undefined,
      collegiateNumber: role === UserRole.MANAGER ? collegiateNumber : undefined,
      platforms: role === UserRole.RIDER ? (selectedPlatforms.length ? selectedPlatforms : ['Uber Eats']) : [],
      managerId: role === UserRole.RIDER ? 'm1' : undefined,
      countryCode: 'ES'
    });
  };

  const quickLoginAsRider = () => {
    const rider = users.find(u => u.role === UserRole.RIDER) || users[0];
    login(rider.email, UserRole.RIDER);
  };

  const quickLoginAsGestor = () => {
    const gestor = users.find(u => u.role === UserRole.MANAGER) || users[1];
    login(gestor.email, UserRole.MANAGER);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 w-full max-w-2xl relative z-10 border border-slate-100 animate-in fade-in duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <Logo size="lg" animated={true} />
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 tracking-tight">
            Labora<span className="text-emerald-500">+</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs uppercase tracking-widest mt-1">
            Plataforma Fiscal para Repartidores y Gestorías
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-700 block">Acceso Rápido Demo:</span>
            <span className="text-[10px] text-slate-500">Prueba los dos lados de la plataforma instantáneamente</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={quickLoginAsRider}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1 transition-all"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Entrar Rider</span>
            </button>
            <button
              onClick={quickLoginAsGestor}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Entrar Gestor</span>
            </button>
          </div>
        </div>

        {!isRegistering ? (
          /* LOGIN MODE */
          <div>
            {/* Role Switcher */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRole(UserRole.RIDER)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  role === UserRole.RIDER ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bike size={16} /> Soy Rider Autónomo
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.MANAGER)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  role === UserRole.MANAGER ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase size={16} /> Soy Gestor / Asesor
              </button>
            </div>

            <form onSubmit={handleSimpleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder={role === UserRole.RIDER ? "alex@labora.plus" : "info@gestoriaperez.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Acceder a mi panel</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                ¿No tienes cuenta?
                <button 
                  onClick={() => { setIsRegistering(true); setRegStep(1); }}
                  className="text-blue-600 font-bold ml-1.5 hover:underline"
                >
                  Regístrate gratis con tu perfil fiscal
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* REGISTRATION WORKFLOW WITH OFFICIAL PLATFORMS & FISCAL SETUP */
          <div className="space-y-5">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  regStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>1</span>
                <span className="text-xs font-semibold text-slate-700">Datos Básicos</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200"></div>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  regStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>2</span>
                <span className="text-xs font-semibold text-slate-700">
                  {role === UserRole.RIDER ? 'Plataformas & Vehículo' : 'Datos Gestoría'}
                </span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200"></div>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  regStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>3</span>
                <span className="text-xs font-semibold text-slate-700">Situación Censal</span>
              </div>
            </div>

            {/* Step 1: Basics & Role */}
            {regStep === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.RIDER)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      role === UserRole.RIDER ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    Rider Autónomo
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.MANAGER)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      role === UserRole.MANAGER ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    Gestoría / Asesor Fiscal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder={role === UserRole.RIDER ? "Ej. Javier Morales" : "Ej. Asesoría Morales & Pérez"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">DNI / NIE / NIF</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                      placeholder="48192834K"
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="+34 600 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                  >
                    <span>Siguiente paso</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Role Specifics (Platform Selection with original logos) */}
            {regStep === 2 && (
              <div className="space-y-4">
                {role === UserRole.RIDER ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Elige tus plataformas de reparto
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Selecciona las aplicaciones con las que trabajas para organizar tus facturas e ingresos (sin inventar logos).
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                        {OFFICIAL_DELIVERY_PLATFORMS.map((plat) => {
                          const isSelected = selectedPlatforms.includes(plat.name);
                          return (
                            <button
                              key={plat.id}
                              type="button"
                              onClick={() => togglePlatform(plat.name)}
                              className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                                isSelected 
                                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm"
                                style={{ backgroundColor: plat.brandColor, color: plat.textColor }}
                              >
                                {plat.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="truncate min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">{plat.name}</div>
                                <div className="text-[10px] text-slate-400 capitalize">{plat.paymentCycle}</div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Vehículo de Reparto</label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                        >
                          <option value="moto">Moto / Ciclomotor</option>
                          <option value="bici">Bicicleta / E-Bike</option>
                          <option value="coche">Coche</option>
                          <option value="furgoneta">Furgoneta</option>
                          <option value="patinete">Patinete Eléctrico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula</label>
                        <input
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="4521 LBR"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Combustible</label>
                        <select
                          value={vehicleFuel}
                          onChange={(e) => setVehicleFuel(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                        >
                          <option value="gasolina">Gasolina 95/98</option>
                          <option value="diesel">Diésel</option>
                          <option value="electrico">Eléctrico</option>
                          <option value="glp">GLP / Gas</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Gestor Details */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Despacho / Asesoría</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej. Gestoría Fiscal Morales & Pérez S.L."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Número de Colegiado</label>
                        <input
                          type="text"
                          value={collegiateNumber}
                          onChange={(e) => setCollegiateNumber(e.target.value)}
                          placeholder="COL-MAD-9421"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">País de Actuación</label>
                        <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white">
                          <option value="ES">España (Hacienda AEAT / TGSS)</option>
                          <option value="MX">México (SAT Plataformas)</option>
                          <option value="CO">Colombia (DIAN)</option>
                          <option value="US">EE.UU. (IRS 1099-NEC)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegStep(3)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                  >
                    <span>Siguiente paso</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Fiscal Setup (036 / 037 / RETA) */}
            {regStep === 3 && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                {role === UserRole.RIDER ? (
                  <>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Declaración Censal Modelo 036 / 037</span>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Epígrafe IAE (Impuesto de Actividades Económicas)
                        </label>
                        <select
                          value={iaeCode}
                          onChange={(e) => setIaeCode(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="849.5 - Servicios de mensajería y reparto">
                            849.5 - Servicios de mensajería, recadería y reparto
                          </option>
                          <option value="722 - Transporte de mercancías">
                            722 - Transporte de mercancías por carretera
                          </option>
                          <option value="849.9 - Otros servicios independientes">
                            849.9 - Otros servicios independientes
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Régimen de Cotización Seguridad Social (RETA)
                        </label>
                        <select
                          value={socialSecurityType}
                          onChange={(e) => setSocialSecurityType(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="tarifa_plana">Tarifa Plana Reducida (80 €/mes primer año)</option>
                          <option value="tramos_reales">Cotización por Ingresos Reales Netos</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Gestoría / Asesor Fiscal Asignado
                        </label>
                        <div className="p-2.5 bg-white border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">Gestoría Fiscal Pérez & Asociados</span>
                            <p className="text-[11px] text-slate-500">Col. 9421 • Especialistas en fiscalidad de reparto</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                            Conectado
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <p className="font-bold text-slate-800">Panel de Control de Clientes Autónomos</p>
                    <p className="text-slate-600">
                      Al completar el registro como gestor, podrás revisar tickets de combustible con foto, solicitar justificantes pendientes a tus riders y presentar los Modelos 130 y 303 en la AEAT.
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completar Registro y Entrar</span>
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                ¿Ya tienes cuenta? Inicia sesión aquí
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
