import React, { useMemo, useState } from 'react';
import { CheckCircle2, Copy, Link2, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { UserRole } from '../../../types';
import { getSupabase } from '../../../services/supabaseClient';
import { getMarketProfile } from '../../country-config/marketProfiles';

export const PeopleHub: React.FC = () => {
  const { currentUser, users, showNotification } = useData();
  const [search, setSearch] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null);

  const clients = useMemo(() => users.filter((user) => user.role === UserRole.RIDER), [users]);
  const filtered = clients.filter((client) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [client.name, client.nif, client.countryCode, ...client.platforms].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  });

  if (!currentUser || (currentUser.role !== UserRole.MANAGER && currentUser.role !== UserRole.ADMIN)) {
    return <div className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-8 text-center text-sm text-stone-600">Este espacio está reservado para asesores.</div>;
  }

  const managerMarket = getMarketProfile(currentUser.countryCode);

  const createInvite = async () => {
    setCreatingInvite(true);
    try {
      const { data, error } = await getSupabase().rpc('labora_create_manager_invite');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.invite_code) throw new Error('No se pudo generar la invitación.');
      setInvite({ code: String(row.invite_code), expiresAt: String(row.expires_at) });
      showNotification('success', 'Código seguro creado. El cliente debe aceptarlo desde su propia cuenta.');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo crear la invitación.');
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyInvite = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.code);
    showNotification('success', 'Código copiado.');
  };

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#48735E] bg-[#2D4E3E] px-3 py-1 text-xs font-semibold text-[#D8EADB]"><ShieldCheck className="h-3.5 w-3.5" /> Acceso por consentimiento</div>
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">Clientes vinculados</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D3E3D8]">No puedes añadir a una persona escribiendo su email ni entrar como ella. Generas un código temporal y el cliente decide desde su propia cuenta si quiere vincularte.</p>
          </div>
          <button disabled={creatingInvite} onClick={() => void createInvite()} className="flex items-center justify-center gap-2 rounded-xl bg-[#F4EFE5] px-4 py-2.5 text-xs font-bold text-[#213B2F] disabled:opacity-50"><UserPlus className="h-4 w-4" />{creatingInvite ? 'Creando…' : 'Invitar cliente'}</button>
        </div>
      </section>

      {invite && (
        <section className="rounded-3xl border border-[#D7C79E] bg-[#FFF8E8] p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#8A6728]">Código de vinculación</p><p className="mt-1 font-mono text-2xl font-black tracking-[.15em] text-stone-900">{invite.code}</p><p className="mt-1 text-xs text-stone-600">Caduca el {new Intl.DateTimeFormat(managerMarket.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invite.expiresAt))}. Solo puede usarse una vez.</p></div>
            <button onClick={() => void copyInvite()} className="flex items-center justify-center gap-2 rounded-xl border border-[#D7C79E] bg-white px-4 py-2.5 text-xs font-semibold text-stone-700"><Copy className="h-4 w-4" /> Copiar código</button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="flex items-center gap-2 font-serif text-lg font-bold text-stone-900"><Users className="h-5 w-5 text-[#2E5A44]" /> Mi cartera</h2><p className="mt-1 text-xs text-stone-500">Solo aparecen personas que aceptaron una vinculación activa.</p></div>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre, país, ID o plataforma" className="w-full rounded-xl border border-[#DFD5C6] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#6A917A]" /></div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DFD5C6] bg-[#F9F6F0] p-10 text-center"><Link2 className="mx-auto h-7 w-7 text-[#91A99A]" /><h3 className="mt-3 font-serif font-bold text-stone-900">Aún no hay clientes vinculados</h3><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-stone-500">Crea una invitación y envía el código por el canal que prefieras. Labora+ no concede acceso hasta que el cliente lo acepte.</p></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((client) => {
              const market = getMarketProfile(client.countryCode);
              return <article key={client.id} className="rounded-2xl border border-[#E8DFC8] bg-white p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4ED] font-serif font-bold text-[#2E5A44]">{client.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-serif font-bold text-stone-900">{client.name}</h3><CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E5A44]" /></div><p className="mt-1 text-xs text-stone-500">{market.displayName} · {client.nif || 'ID fiscal pendiente'}</p>{client.platforms.length > 0 && <p className="mt-1 truncate text-[11px] text-stone-500">{client.platforms.join(' · ')}</p>}<p className="mt-2 text-[11px] font-semibold text-[#2E5A44]">Vínculo activo · acceso limitado por permisos</p></div></div></article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
};
