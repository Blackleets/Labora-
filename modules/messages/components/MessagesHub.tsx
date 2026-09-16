import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, MessageSquare, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { getSupabase } from '../../../services/supabaseClient';
import { UserRole } from '../../../types';
import { getMarketProfile } from '../../country-config/marketProfiles';

type MessageRow = {
  id: string;
  organization_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export const MessagesHub: React.FC = () => {
  const { currentUser, users, showNotification } = useData();
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const clients = useMemo(() => users.filter((user) => user.role === UserRole.RIDER), [users]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [managerName, setManagerName] = useState('Mi asesor');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedClient = clients.find((client) => client.id === selectedClientId) || null;
  const counterpartId = isManager ? selectedClientId : currentUser?.managerId || '';
  const organizationId = isManager ? selectedClient?.organizationId || '' : currentUser?.organizationId || '';
  const counterpartName = isManager ? selectedClient?.name || '' : managerName;
  const locale = getMarketProfile(isManager ? selectedClient?.countryCode || currentUser?.countryCode : currentUser?.countryCode).locale;

  useEffect(() => {
    if (isManager || !currentUser?.managerId) return;
    void (async () => {
      const { data } = await getSupabase().from('profiles').select('full_name').eq('user_id', currentUser.managerId).maybeSingle();
      if (data?.full_name) setManagerName(String(data.full_name));
    })();
  }, [currentUser?.managerId, isManager]);

  const loadMessages = async (quiet = false) => {
    if (!currentUser || !counterpartId || !organizationId) {
      setMessages([]);
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('messages')
        .select('id,organization_id,sender_user_id,recipient_user_id,body,created_at,read_at')
        .eq('organization_id', organizationId)
        .or(`sender_user_id.eq.${currentUser.id},recipient_user_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const conversation = ((data || []) as MessageRow[]).filter((message) =>
        (message.sender_user_id === currentUser.id && message.recipient_user_id === counterpartId)
        || (message.sender_user_id === counterpartId && message.recipient_user_id === currentUser.id),
      );
      setMessages(conversation);
      const unread = conversation.filter((message) => message.recipient_user_id === currentUser.id && !message.read_at);
      await Promise.all(unread.map((message) => getSupabase().rpc('labora_mark_message_read', { message_id: message.id })));
    } catch (error) {
      if (!quiet) showNotification('error', error instanceof Error ? error.message : 'No se pudieron cargar los mensajes.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
    if (!counterpartId || !organizationId) return;
    const timer = window.setInterval(() => void loadMessages(true), 15000);
    return () => window.clearInterval(timer);
  }, [counterpartId, organizationId, currentUser?.id]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !counterpartId || !organizationId || !draft.trim()) return;
    setSending(true);
    try {
      const { error } = await getSupabase().from('messages').insert({
        organization_id: organizationId,
        sender_user_id: currentUser.id,
        recipient_user_id: counterpartId,
        body: draft.trim(),
      });
      if (error) throw error;
      setDraft('');
      await loadMessages(true);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  if (!isManager && !currentUser.managerId) {
    return <Empty title="Todavía no tienes un asesor vinculado" text="Cuando aceptes una invitación, podréis hablar aquí y las peticiones quedarán junto a tus documentos, sin depender de capturas perdidas en WhatsApp." />;
  }

  if (isManager && clients.length === 0) {
    return <Empty title="Todavía no tienes clientes vinculados" text="Ve a Clientes vinculados, crea un código de invitación y pide a la persona que lo acepte desde su propia cuenta." />;
  }

  if (isManager && !selectedClient) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 pb-12">
        <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-6 text-white"><div className="flex items-center gap-2 text-xs font-semibold text-[#D8EADB]"><ShieldCheck className="h-4 w-4" /> Conversaciones privadas</div><h1 className="mt-2 font-serif text-2xl font-bold">Elige con quién quieres hablar</h1><p className="mt-2 text-sm text-[#D3E3D8]">Labora+ no abre automáticamente la conversación del primer cliente.</p></section>
        <section className="grid gap-3 sm:grid-cols-2">{clients.map((client) => <button key={client.id} onClick={() => setSelectedClientId(client.id)} className="rounded-2xl border border-[#E8DFC8] bg-white p-4 text-left shadow-sm hover:bg-[#F7F3EC]"><p className="font-serif text-sm font-bold text-stone-900">{client.name}</p><p className="mt-1 text-[11px] text-stone-500">{getMarketProfile(client.countryCode).displayName} · {client.email}</p><span className="mt-3 inline-flex rounded-full bg-[#EDF5EF] px-2 py-1 text-[10px] font-bold text-[#2E5A44]">Abrir conversación</span></button>)}</section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <section className="rounded-3xl border border-[#345947] bg-[#213B2F] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#D8EADB]"><ShieldCheck className="h-4 w-4" /> Conversación privada dentro de Labora+</div><h1 className="font-serif text-2xl font-bold">Conversación con {counterpartName}</h1><p className="mt-1 text-xs leading-relaxed text-[#D3E3D8]">Los mensajes solo son visibles para las partes autorizadas por un vínculo activo.</p></div>
          <div className="flex gap-2">{isManager && <button onClick={() => setSelectedClientId('')} className="rounded-xl border border-[#48735E] bg-[#2D4E3E] px-3 py-2 text-xs font-semibold text-white">Cambiar cliente</button>}<button onClick={() => void loadMessages()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[#48735E] bg-[#2D4E3E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar</button></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#E8DFC8] bg-[#FCFAF7] shadow-sm">
        <div className="min-h-[360px] space-y-3 overflow-y-auto bg-[#F7F3EC] p-4 sm:p-5">
          {loading && messages.length === 0 && <p className="py-12 text-center text-xs text-stone-500">Cargando conversación…</p>}
          {!loading && messages.length === 0 && <div className="py-12 text-center"><MessageSquare className="mx-auto h-7 w-7 text-[#9CB1A2]" /><p className="mt-3 font-serif text-sm font-bold text-stone-800">Todavía no hay mensajes</p><p className="mt-1 text-xs text-stone-500">Escribe el primero abajo.</p></div>}
          {messages.map((message) => {
            const own = message.sender_user_id === currentUser.id;
            return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${own ? 'rounded-br-md bg-[#2E5A44] text-white' : 'rounded-bl-md border border-[#E4DAC9] bg-white text-stone-800'}`}><p className="whitespace-pre-wrap leading-relaxed">{message.body}</p><div className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${own ? 'text-white/65' : 'text-stone-400'}`}><span>{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.created_at))}</span>{own && message.read_at && <CheckCheck className="h-3 w-3" />}</div></div></div>;
          })}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-[#E8DFC8] bg-[#FCFAF7] p-4"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={10000} placeholder={`Escribe a ${counterpartName}…`} className="min-h-12 flex-1 resize-none rounded-2xl border border-[#DFD5C6] bg-white px-4 py-3 text-sm outline-none focus:border-[#6A917A]" /><button disabled={sending || !draft.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E5A44] text-white disabled:opacity-40" aria-label="Enviar"><Send className="h-5 w-5" /></button></form>
      </section>
    </div>
  );
};

const Empty: React.FC<{ title: string; text: string }> = ({ title, text }) => <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-[#D8D0C1] bg-[#FCFAF7] p-10 text-center"><MessageSquare className="mx-auto h-8 w-8 text-[#91A99A]" /><h2 className="mt-4 font-serif text-xl font-bold text-stone-900">{title}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-stone-500">{text}</p></div>;
