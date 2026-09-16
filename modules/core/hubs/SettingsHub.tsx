import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Link2, Moon, Save, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { getSupabase } from '../../../services/supabaseClient';
import { UserRole } from '../../../types';
import { AdvisorTrustPanel } from '../../../components/AdvisorTrustPanel';
import { AdvisorVerificationCenter } from '../../../components/AdvisorVerificationCenter';

export const SettingsHub: React.FC = () => {
  const {
    currentUser,
    privacyMode,
    darkMode,
    togglePrivacyMode,
    toggleDarkMode,
    updateUserFiscalProfile,
    refreshData,
    exportData,
    showNotification,
  } = useData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [iaeCode, setIaeCode] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    setName(currentUser?.name || '');
    setPhone(currentUser?.phone || '');
    setNif(currentUser?.nif || '');
    setIaeCode(currentUser?.iaeCode || '');
    setVehiclePlate(currentUser?.vehiclePlate || '');
    setProfessionalId(currentUser?.collegiateNumber || '');
  }, [currentUser]);

  if (!currentUser) return null;
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateUserFiscalProfile({
        name: name.trim(),
        phone: phone.trim(),
        nif: nif.trim().toUpperCase(),
        iaeCode: iaeCode.trim(),
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        collegiateNumber: professionalId.trim(),
      });
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const acceptInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    setLinking(true);
    try {
      const { error } = await getSupabase().rpc('labora_accept_manager_invite', { invite_code: inviteCode.trim().toUpperCase() });
      if (error) throw error;
      setInviteCode('');
      await refreshData();
      showNotification('success', 'Gestor vinculado. Ya podéis compartir peticiones, evidencias y mensajes con permisos limitados.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'El código no es válido o ha caducado.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2D4E3E]"><UserRound className="h-6 w-6" /></div><div><p className="text-xs font-semibold text-[#BFD5C6]">{isManager ? 'Cuenta de gestoría' : 'Cuenta de trabajador'}</p><h1 className="mt-1 font-serif text-2xl font-bold">Perfil y seguridad</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#D3E3D8]">Tus datos pertenecen a tu cuenta autenticada. El rol y los permisos no se cambian desde este formulario.</p></div></div>
      </section>

      {isManager && <AdvisorTrustPanel user={currentUser} />}
      {isManager && <AdvisorVerificationCenter />}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <form onSubmit={saveProfile} className="space-y-4 rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
          <div><h2 className="font-serif text-lg font-bold text-stone-900">Mis datos</h2><p className="mt-1 text-xs text-stone-500">Introduce solo información real. Declarar un número profesional no equivale a que Labora+ lo haya verificado.</p></div>
          <Field label={isManager ? 'Nombre / gestoría' : 'Nombre completo'} value={name} onChange={setName} />
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Teléfono" value={phone} onChange={setPhone} inputMode="tel" /><Field label="NIF / identificador fiscal" value={nif} onChange={setNif} /></div>
          {isManager ? (
            <Field label="Nº de colegiado, licencia o registro (si existe)" value={professionalId} onChange={setProfessionalId} placeholder="Se guardará como declarado, no verificado" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Actividad / epígrafe" value={iaeCode} onChange={setIaeCode} placeholder="Si lo conoces" /><Field label="Matrícula" value={vehiclePlate} onChange={setVehiclePlate} placeholder="Opcional" /></div>
          )}
          <button disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-[#2E5A44] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </form>

        <div className="space-y-5">
          {!isManager && (
            <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
              <div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-[#3A7596]" /><h2 className="font-serif text-lg font-bold text-stone-900">Mi gestor</h2></div>
              {currentUser.managerId ? (
                <div className="mt-4 rounded-2xl border border-[#D6E3D9] bg-[#EEF5F0] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#2E5A44]"><CheckCircle2 className="h-4 w-4" /> Gestor vinculado</div><p className="mt-1 text-xs leading-relaxed text-stone-600">El vínculo confirma que tú autorizaste el acceso; no demuestra por sí solo que el profesional esté verificado por Labora+.</p></div>
              ) : (
                <form onSubmit={acceptInvite} className="mt-4 space-y-3"><p className="text-xs leading-relaxed text-stone-600">Pide a tu gestor el código temporal de Labora+. Al aceptarlo, autorizas el acceso limitado a revisión, documentos, peticiones y mensajes.</p><input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} maxLength={12} placeholder="CÓDIGO DE 12 CARACTERES" className="w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-3 text-center font-mono text-sm font-bold uppercase tracking-wider outline-none focus:border-[#6A917A]" /><button disabled={linking || !inviteCode.trim()} className="w-full rounded-xl bg-[#3A7596] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{linking ? 'Comprobando…' : 'Vincular mi gestor'}</button></form>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#2E5A44]" /><h2 className="font-serif text-lg font-bold text-stone-900">Privacidad</h2></div>
            <div className="mt-4 space-y-2">
              <button onClick={togglePrivacyMode} className="flex w-full items-center justify-between rounded-2xl border border-[#E8DFC8] bg-white p-3.5 text-left"><div className="flex items-center gap-3">{privacyMode ? <EyeOff className="h-4 w-4 text-[#2E5A44]" /> : <Eye className="h-4 w-4 text-stone-500" />}<div><p className="text-sm font-semibold text-stone-800">Ocultar importes</p><p className="text-[11px] text-stone-500">Útil si usas Labora+ en público.</p></div></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${privacyMode ? 'bg-[#EAF4ED] text-[#2E5A44]' : 'bg-stone-100 text-stone-500'}`}>{privacyMode ? 'ACTIVO' : 'INACTIVO'}</span></button>
              <button onClick={toggleDarkMode} className="flex w-full items-center justify-between rounded-2xl border border-[#E8DFC8] bg-white p-3.5 text-left"><div className="flex items-center gap-3">{darkMode ? <Moon className="h-4 w-4 text-[#3A7596]" /> : <Sun className="h-4 w-4 text-amber-600" />}<div><p className="text-sm font-semibold text-stone-800">Apariencia</p><p className="text-[11px] text-stone-500">Preferencia guardada solo en este dispositivo.</p></div></div><span className="text-[10px] font-bold text-stone-500">{darkMode ? 'OSCURA' : 'CLARA'}</span></button>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm"><h2 className="font-serif text-base font-bold text-stone-900">Mis datos</h2><p className="mt-1 text-xs leading-relaxed text-stone-500">Puedes exportar tus registros estructurados. Los enlaces temporales a documentos privados se excluyen.</p><button onClick={exportData} className="mt-3 rounded-xl border border-[#DFD5C6] bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700">Exportar mis datos</button></section>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }> = ({ label, value, onChange, placeholder, inputMode }) => <label className="block text-xs font-semibold text-stone-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className="mt-1 w-full rounded-xl border border-[#DFD5C6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6A917A]" /></label>;
