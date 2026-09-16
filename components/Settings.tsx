import React, { useEffect, useState } from 'react';
import { Bell, Eye, LogOut, Moon, Save, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { identityImageStore } from '../services/identityImage';
import { UserRole } from '../types';
import IdentityImagePicker from './IdentityImagePicker';

const Settings: React.FC = () => {
  const {
    currentUser,
    logout,
    darkMode,
    toggleDarkMode,
    privacyMode,
    togglePrivacyMode,
    updateUserFiscalProfile,
    showNotification
  } = useData();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [nif, setNif] = useState(currentUser?.nif || '');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [collegiateNumber, setCollegiateNumber] = useState(currentUser?.collegiateNumber || '');
  const [vehiclePlate, setVehiclePlate] = useState(currentUser?.vehiclePlate || '');
  const [identityImage, setIdentityImage] = useState<string | undefined>(() => identityImageStore.getForUser(currentUser));
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    setName(currentUser?.name || '');
    setPhone(currentUser?.phone || '');
    setNif(currentUser?.nif || '');
    setCompanyName(currentUser?.companyName || '');
    setCollegiateNumber(currentUser?.collegiateNumber || '');
    setVehiclePlate(currentUser?.vehiclePlate || '');
    setIdentityImage(identityImageStore.getForUser(currentUser));
  }, [currentUser]);

  if (!currentUser) return null;

  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const inputClass = 'w-full rounded-xl border border-[#DED7CC] bg-white px-3.5 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8EA796] focus:ring-2 focus:ring-[#DDE9E1]';
  const labelClass = 'mb-1.5 block text-[11px] font-bold text-stone-500';

  const saveProfile = () => {
    if (!name.trim()) {
      showNotification('error', 'El nombre no puede quedar vacío.');
      return;
    }

    identityImageStore.setForEmail(currentUser.email, identityImage);
    updateUserFiscalProfile({
      name: name.trim(),
      phone: phone.trim() || undefined,
      nif: nif.trim().toUpperCase() || undefined,
      companyName: isManager ? companyName.trim() || name.trim() : currentUser.companyName,
      collegiateNumber: isManager ? collegiateNumber.trim() || undefined : currentUser.collegiateNumber,
      vehiclePlate: !isManager ? vehiclePlate.trim().toUpperCase() || undefined : currentUser.vehiclePlate
    });
    showNotification('success', 'Perfil actualizado.');
  };

  const ToggleRow = ({ icon: Icon, title, text, checked, onClick }: any) => (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2EFE9] text-stone-500"><Icon size={17} /></div>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-stone-800">{title}</p><p className="mt-0.5 text-[11px] text-stone-500">{text}</p></div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-[#2E5A44]' : 'bg-stone-200'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></span>
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Cuenta</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">Perfil y ajustes</h1>
        <p className="mt-1 text-sm text-stone-500">Mantén actualizada la información con la que te identificas en Labora+.</p>
      </section>

      <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4 sm:p-5">
        <IdentityImagePicker
          mode={isManager ? 'logo' : 'avatar'}
          value={identityImage}
          onChange={setIdentityImage}
          title={isManager ? 'Logo o imagen de la gestoría' : 'Foto de perfil'}
          helper={isManager ? 'Tus clientes la verán al recibir mensajes y peticiones.' : 'Tu gestor la verá al revisar tu actividad y comunicarse contigo.'}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>{isManager ? 'Nombre de contacto' : 'Nombre y apellidos'}</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Correo</label><input value={currentUser.email} disabled className={`${inputClass} bg-[#F7F4EF] text-stone-400`} /></div>
          <div><label className={labelClass}>Teléfono</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>NIF / NIE</label><input value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} className={inputClass} /></div>
          {isManager ? (
            <>
              <div><label className={labelClass}>Nombre de la gestoría</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>N.º colegiado</label><input value={collegiateNumber} onChange={(e) => setCollegiateNumber(e.target.value)} className={inputClass} /></div>
            </>
          ) : (
            <div><label className={labelClass}>Matrícula</label><input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className={inputClass} /></div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#EEE7DD] pt-4">
          <div className="flex items-center gap-2 text-xs text-stone-500"><UserRound size={15} /><span>{isManager ? 'Cuenta de gestoría' : 'Cuenta de autónomo'}</span></div>
          <button type="button" onClick={saveProfile} className="inline-flex items-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#244936]"><Save size={15} /> Guardar cambios</button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E3DCD2] bg-white p-4 sm:p-5">
        <h2 className="text-sm font-bold text-stone-900">Preferencias</h2>
        <div className="mt-2 divide-y divide-[#EEE7DD]">
          <ToggleRow icon={privacyMode ? Eye : ShieldCheck} title="Ocultar importes" text="Protege cifras cuando uses la app delante de otras personas." checked={privacyMode} onClick={togglePrivacyMode} />
          <ToggleRow icon={darkMode ? Moon : Sun} title="Modo oscuro" text="Cambia la apariencia de la aplicación." checked={darkMode} onClick={toggleDarkMode} />
          <ToggleRow icon={Bell} title="Notificaciones" text="Avisos sobre peticiones, documentos y revisiones." checked={notifications} onClick={() => setNotifications((value) => !value)} />
        </div>
      </section>

      <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F0D8D3] bg-[#FFF7F5] py-3 text-sm font-bold text-[#A34F42] hover:bg-[#FFF0EC]"><LogOut size={17} /> Cerrar sesión</button>
    </div>
  );
};

export default Settings;
