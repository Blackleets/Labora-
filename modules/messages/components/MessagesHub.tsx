import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Clock, Loader2, MessageSquare, Search, Send, UserRound } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { identityImageStore } from '../../../services/identityImage';
import { User, UserRole } from '../../../types';
import { messageRepository } from '../repositories/messageRepository';
import { Message } from '../types';

const ContactImage = ({ user, active = false, size = 'sm' }: { user: User; active?: boolean; size?: 'sm' | 'md' }) => {
  const image = identityImageStore.getForUser(user);
  const manager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
  const dimensions = size === 'md' ? 'h-10 w-10' : 'h-9 w-9';
  if (image) return <img src={image} alt={user.name} className={`${dimensions} shrink-0 border border-[#DDD5CA] ${manager ? 'rounded-xl object-contain p-1' : 'rounded-full object-cover'}`} />;
  return <div className={`flex ${dimensions} shrink-0 items-center justify-center ${manager ? 'rounded-xl' : 'rounded-full'} ${active ? 'bg-[#2E5A44] text-white' : 'bg-[#F0ECE6] text-stone-500'}`}>{manager ? <Building2 size={16} /> : <UserRound size={16} />}</div>;
};

export const MessagesHub: React.FC = () => {
  const { currentUser, users, showNotification } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const contacts = useMemo(() => {
    if (!currentUser) return [];
    if (isManager) return users.filter((user) => user.role === UserRole.RIDER && user.managerId === currentUser.id);
    if (!currentUser.managerId) return [];
    const manager = users.find((user) => (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) && user.id === currentUser.managerId);
    return manager ? [manager] : [];
  }, [currentUser, users, isManager]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      setMessages(await messageRepository.getAll(users));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [users]);

  useEffect(() => {
    void loadMessages();
    const unsubscribe = messageRepository.subscribe(() => void loadMessages());
    return unsubscribe;
  }, [loadMessages]);

  useEffect(() => {
    if (!contacts.length) return setSelectedContactId('');
    if (!contacts.some((contact) => contact.id === selectedContactId)) setSelectedContactId(contacts[0].id);
  }, [contacts, selectedContactId]);

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const conversation = useMemo(() => {
    if (!currentUser || !selectedContactId) return [];
    const term = searchTerm.trim().toLowerCase();
    return messages
      .filter((message) => (message.senderId === currentUser.id && message.recipientId === selectedContactId) || (message.senderId === selectedContactId && message.recipientId === currentUser.id))
      .filter((message) => !term || message.message.toLowerCase().includes(term))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser, selectedContactId, searchTerm]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !selectedContact || !draft.trim() || sending) return;

    const text = draft.trim();
    setSending(true);
    try {
      const message = await messageRepository.sendMessage({
        personId: selectedContact.id,
        personName: selectedContact.name,
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: selectedContact.id,
        recipientName: selectedContact.name,
        message: text,
        type: 'internal'
      });
      setMessages((previous) => previous.some((item) => item.id === message.id) ? previous : [...previous, message]);
      setDraft('');
    } catch (error: any) {
      showNotification('error', String(error?.message || 'No se pudo enviar el mensaje.'));
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Comunicación</p><h1 className="mt-1 text-2xl font-bold text-stone-900">Mensajes</h1><p className="mt-1 text-sm text-stone-500">{isManager ? 'Conversaciones con tus clientes vinculados.' : 'Conversación con tu gestoría vinculada.'}</p></header>

      <section className="grid min-h-[520px] overflow-hidden rounded-2xl border border-[#E3DCD2] bg-white lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-[#ECE5DB] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#ECE5DB] p-3"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar mensajes" className="w-full rounded-xl border border-[#E4DDD3] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#91A799]" /></div></div>
          <div className="max-h-[220px] overflow-y-auto p-2 lg:max-h-[500px]">
            {contacts.length === 0 ? <div className="px-3 py-8 text-center"><UserRound size={24} className="mx-auto text-stone-300" /><p className="mt-2 text-xs font-semibold text-stone-500">{isManager ? 'No tienes clientes vinculados.' : 'No tienes gestoría vinculada.'}</p></div> : contacts.map((contact) => {
              const active = contact.id === selectedContactId;
              return <button key={contact.id} onClick={() => setSelectedContactId(contact.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${active ? 'bg-[#EAF2ED]' : 'hover:bg-[#F7F4EF]'}`}><ContactImage user={contact} active={active} /><div className="min-w-0"><p className="truncate text-xs font-bold text-stone-900">{contact.companyName || contact.name}</p><p className="truncate text-[10px] text-stone-500">{contact.email}</p></div></button>;
            })}
          </div>
        </aside>

        <div className="flex min-h-[420px] min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-[#ECE5DB] px-4 py-3.5">
            {selectedContact && <ContactImage user={selectedContact} size="md" />}
            <div><p className="text-sm font-bold text-stone-900">{selectedContact?.companyName || selectedContact?.name || 'Mensajes'}</p>{selectedContact && <p className="mt-0.5 text-[11px] text-stone-400">{selectedContact.email}</p>}</div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8F4] p-4 sm:p-5">
            {loading ? <div className="flex h-full min-h-[280px] items-center justify-center gap-2 text-xs font-semibold text-stone-400"><Loader2 size={16} className="animate-spin" /> Sincronizando conversación…</div> : !selectedContact ? <Empty icon="select" /> : conversation.length === 0 ? <Empty icon="start" /> : conversation.map((message) => {
              const mine = message.senderId === currentUser.id;
              return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 sm:max-w-[72%] ${mine ? 'bg-[#2E5A44] text-white' : 'border border-[#E3DDD4] bg-white text-stone-800'}`}><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p><div className={`mt-1.5 flex items-center gap-1 text-[9px] ${mine ? 'text-white/65' : 'text-stone-400'}`}><Clock size={9} />{new Date(message.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div></div>;
            })}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-[#ECE5DB] bg-white p-3 sm:p-4"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={selectedContact ? 'Escribe un mensaje…' : 'Vincula una gestoría para conversar'} disabled={!selectedContact || sending} rows={2} className="min-w-0 flex-1 resize-none rounded-xl border border-[#DED7CC] px-3 py-2.5 text-sm outline-none focus:border-[#8FA697] disabled:bg-[#F4F1EC]" /><button disabled={!selectedContact || !draft.trim() || sending} className="self-end rounded-xl bg-[#2E5A44] p-3 text-white disabled:opacity-40" aria-label="Enviar mensaje">{sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</button></form>
        </div>
      </section>
    </div>
  );
};

const Empty = ({ icon }: { icon: 'select' | 'start' }) => <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center"><MessageSquare size={30} className="text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-600">{icon === 'select' ? 'Selecciona un contacto para empezar.' : 'No hay mensajes todavía.'}</p>{icon === 'start' && <p className="mt-1 text-xs text-stone-400">Puedes iniciar la conversación desde aquí.</p>}</div>;
