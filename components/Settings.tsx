import React, { useEffect, useState } from 'react';
import { Building2, Eye, Link2, Loader2, LogOut, Mail, Moon, Save, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import {
  linkManagerByEmail,
  signOutRemote,
  updateRemoteProfile,
  uploadIdentityDataUrl
} from '../services/authWorkspace';
import { identityImageStore } from '../services/identityImage';
import { UserRole } from '../types';
import IdentityImagePicker from './IdentityImagePicker';

const Settings: React.FC = () => {
  const {
    currentUser,
    users,
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
  const [saving, setSaving] = useState(false);
  const [managerEmail, setManagerEmail] = useState('');
  const [linking, setLinking] = useState(false);

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
  const linkedManager = !isManager && currentUser.managerId
    ? users.find((user) => user.id === currentUser.managerId)
    : undefined;

  const inputClass = 'w-full rounded-[13px] border border-[#DED7CC] bg-white px-3.5 py-3 text-sm text-[#1E231F] outline-none transition focus:border-[#789582] focus:ring-2 focus:ring-[#DDE9E1]';
  const labelClass = 'mb-1.5 block text-[11px] font-extrabold text-stone-500';

  const saveProfile = async () => {
    if (!name.trim()) {
      showNotification('error', 'El nombre no puede quedar vacío.');
      return;
    }

    const patch = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      nif: nif.trim().toUpperCase() || undefined,
      companyName: isManager ? companyName.trim() || name.trim() : currentUser.companyName,
      collegiateNumber: isManager ? collegiateNumber.trim() || undefined : currentUser.collegiateNumber,
      vehiclePlate: !isManager ? vehiclePlate.trim().toUpperCase() || undefined : currentUser.vehiclePlate
    };

    setSaving(true);
    try {
      await updateRemoteProfile(currentUser.id, patch);

      const currentStored = identityImageStore.getForUser(currentUser);
      if (identityImage && identityImage !== currentStored && identityImage.startsWith('data:')) {
        await uploadIdentityDataUrl(currentUser.id, identityImage, isManager ? 'logo' : 'avatar');
      }

      identityImageStore.setForEmail(currentUser.email, identityImage);
      updateUserFiscalProfile(patch);
      showNotification('success', 'Perfil sincronizado.');
    } catch (error: any) {
      showNotification('error', String(error?.message || 'No se pudo guardar el perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const handleLinkManager = async () => {
    if (!managerEmail.trim()) {
      showNotification('error', 'Escribe el correo de tu gestoría.');
      return;
    }

    setLinking(true);
    try {
      await linkManagerByEmail(managerEmail);
      showNotification('success', 'Gestoría vinculada correctamente.');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      const raw = String(error?.message || 'No se pudo vincular la gestoría.');
      showNotification('error', raw.includes('Manager not found') ? 'No existe una gestoría con ese correo.' : raw);
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutRemote();
    } finally {
      logout();
      window.location.reload();
    }
  };

  const ToggleRow = ({ icon: Icon, title, text, checked, onClick }: any) => (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-[14px] px-1 py-3 text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#F1ECE3] text-stone-500"><Icon size={17} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[#1E231F]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">{text}</p>
      </div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-[#214E3A]' : 'bg-stone-200'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  );

  const displayName = isManager ? (currentUser.companyName || currentUser.name) : currentUser.name;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24 lg:pb-8">
      <section className="labora-card overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-[#D9D0C4] bg-[#F7F3ED] text-[#214E3A] shadow-sm ${isManager ? 'rounded-[18px]' : 'rounded-full'}`}>
              {identityImage ? (
                <img src={identityImage} alt={displayName} className={`h-full w-full ${isManager ? 'object-contain p-1.5' : 'object-cover'}`} />
              ) : isManager ? (
                <Building2 size={24} />
              ) : (
                <UserRound size={24} />
              )}
            </div>
            <div className="min-w-0">
              <p className="labora-kicker text-[#789582]">{isManager ? 'Cuenta de gestoría' : 'Cuenta de autónomo'}</p>
              <h1 className="labora-display mt-1 truncate text-2xl font-semibold text-[#1E231F] sm:text-[2rem]">{displayName}</h1>
              <p className="mt-1 truncate text-sm text-stone-500">{currentUser.email}</p>
            </div>
          </div>

          <div className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${isManager || linkedManager ? 'border-[#D3E2D8] bg-[#EAF2ED] text-[#214E3A]' : 'border-[#E8D9C8] bg-[#FFF5E9] text-[#8A641E]'}`}>
            {isManager ? 'Gestoría activa' : linkedManager ? 'Gestoría vinculada' : 'Sin gestoría vinculada'}
          </div>
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="mb-5">
          <p className="labora-kicker text-stone-400">Identidad</p>
          <h2 className="mt-1 text-base font-extrabold text-[#1E231F]">Datos del perfil</h2>
          <p className="mt-1 text-xs text-stone-500">La otra parte verá estos datos en el contexto de trabajo compartido.</p>
        </div>

        <IdentityImagePicker
          mode={isManager ? 'logo' : 'avatar'}
          value={identityImage}
          onChange={setIdentityImage}
          title={isManager ? 'Logo o imagen de la gestoría' : 'Foto de perfil'}
          helper={isManager ? 'Tus clientes la verán en mensajes, peticiones y cartera.' : 'Tu gestoría la verá al revisar tu actividad y comunicarse contigo.'}
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

        <div className="mt-5 flex flex-col gap-3 border-t border-[#EEE7DD] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500"><ShieldCheck size={15} className="text-[#214E3A]" />Perfil protegido por sesión y RLS</div>
          <button type="button" onClick={saveProfile} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#214E3A] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#183D2D] disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar cambios
          </button>
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#E7F0EA] text-[#214E3A]">
            {isManager ? <Building2 size={19} /> : <Link2 size={19} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="labora-kicker text-[#789582]">Relación de trabajo</p>
            <h2 className="mt-1 text-base font-extrabold text-[#1E231F]">{isManager ? 'Vincular clientes' : 'Mi gestoría'}</h2>

            {isManager ? (
              <>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">Tus clientes pueden vincularse introduciendo este correo desde su propio perfil.</p>
                <div className="mt-3 flex items-center gap-2 rounded-[13px] border border-[#E3DCD2] bg-[#F8F5F0] px-3 py-2.5 text-xs font-bold text-stone-700"><Mail size={14} className="text-stone-400" /> {currentUser.email}</div>
              </>
            ) : linkedManager ? (
              <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-[#D7E5DC] bg-[#F1F7F3] p-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[11px] bg-white text-[#214E3A]">
                  {identityImageStore.getForUser(linkedManager) ? <img src={identityImageStore.getForUser(linkedManager)} alt="Gestoría" className="h-full w-full object-contain p-1" /> : <Building2 size={16} />}
                </div>
                <div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#214E3A]">{linkedManager.companyName || linkedManager.name}</p><p className="mt-0.5 truncate text-[11px] text-stone-500">{linkedManager.email}</p></div>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="correo@gestoria.com" className={`${inputClass} min-w-0 flex-1`} />
                <button type="button" onClick={handleLinkManager} disabled={linking} className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#D66C47] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#BE5838] disabled:opacity-60">
                  {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} Vincular
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="labora-card p-4 sm:p-5">
        <div className="mb-1">
          <p className="labora-kicker text-stone-400">Aplicación</p>
          <h2 className="mt-1 text-base font-extrabold text-[#1E231F]">Preferencias reales</h2>
        </div>
        <div className="divide-y divide-[#EEE7DD]">
          <ToggleRow icon={privacyMode ? Eye : ShieldCheck} title="Ocultar importes" text="Protege las cifras cuando uses la app delante de otras personas." checked={privacyMode} onClick={togglePrivacyMode} />
          <ToggleRow icon={darkMode ? Moon : Sun} title="Modo oscuro" text="Cambia la apariencia local de la aplicación." checked={darkMode} onClick={toggleDarkMode} />
        </div>
        <p className="mt-3 rounded-[13px] bg-[#F7F4EE] px-3 py-2.5 text-[10px] leading-relaxed text-stone-400">Las notificaciones push/email todavía no están habilitadas; no mostramos un ajuste falso hasta que exista ese canal.</p>
      </section>

      <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#F0D8D3] bg-[#FFF7F5] py-3 text-sm font-extrabold text-[#A34F42] hover:bg-[#FFF0EC]"><LogOut size={17} /> Cerrar sesión</button>
    </div>
  );
};

export default Settings;
