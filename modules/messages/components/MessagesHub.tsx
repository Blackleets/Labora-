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
  const dimensions = size === 'md' ? 'h-11 w-11' : 'h-9 w-9';

  if (image) {
    return (
      <img
        src={image}
        alt={user.companyName || user.name}
        className={`${dimensions} shrink-0 border border-[#DDD5CA] bg-white ${manager ? 'rounded-[13px] object-contain p-1' : 'rounded-full object-cover'}`}
      />
    );
  }

  return (
    <div className={`flex ${dimensions} shrink-0 items-center justify-center ${manager ? 'rounded-[13px]' : 'rounded-full'} ${active ? 'bg-[#214E3A] text-white' : 'bg-[#F1ECE3] text-stone-500'}`}>
      {manager ? <Building2 size={16} /> : <UserRound size={16} />}
    </div>
  );
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
    if (isManager) {
      return users.filter((user) => user.role === UserRole.RIDER && user.managerId === currentUser.id);
    }
    if (!currentUser.managerId) return [];
    const manager = users.find(
      (user) => (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) && user.id === currentUser.managerId
    );
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
    if (!contacts.length) {
      setSelectedContactId('');
      return;
    }
    if (!contacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (!currentUser || !selectedContactId) return;

    const unreadIncoming = messages.filter(
      (message) =>
        message.recipientId === currentUser.id
        && message.senderId === selectedContactId
        && message.status === 'sent'
    );
    if (!unreadIncoming.length) return;

    let cancelled = false;
    void (async () => {
      for (const message of unreadIncoming) {
        try {
          await messageRepository.markRead(message.id);
          if (cancelled) return;
          setMessages((previous) =>
            previous.map((item) => (item.id === message.id ? { ...item, status: 'read' } : item))
          );
        } catch (error) {
          console.error('[LABORA_MESSAGE_MARK_READ_FAILED]', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser, selectedContactId, messages]);

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const conversation = useMemo(() => {
    if (!currentUser || !selectedContactId) return [];
    const term = searchTerm.trim().toLowerCase();
    return messages
      .filter((message) =>
        (message.senderId === currentUser.id && message.recipientId === selectedContactId)
        || (message.senderId === selectedContactId && message.recipientId === currentUser.id)
      )
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="labora-kicker text-[#789582]">Comunicación privada</p>
          <h1 className="labora-display mt-1 text-2xl font-semibold text-[#1E231F] sm:text-[2rem]">Mensajes</h1>
          <p className="mt-1 text-sm text-stone-500">
            {isManager ? 'Habla únicamente con tus clientes vinculados.' : 'Habla directamente con tu gestoría vinculada.'}
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D9E5DD] bg-[#EDF4EF] px-3 py-1.5 text-[10px] font-extrabold text-[#214E3A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2F6B50]" /> Supabase · Realtime
        </div>
      </header>

      <section className="labora-card grid min-h-[560px] overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-[#ECE5DB] bg-[#FFFCF7] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#ECE5DB] p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en conversación"
                className="w-full rounded-[13px] border border-[#E4DDD3] bg-[#F6F2EB] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#789582]"
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto p-2 lg:max-h-[500px]">
            {contacts.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#F1ECE3] text-stone-400">
                  <UserRound size={21} />
                </div>
                <p className="mt-3 text-xs font-extrabold text-stone-600">
                  {isManager ? 'No tienes clientes vinculados.' : 'No tienes gestoría vinculada.'}
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-stone-400">
                  {isManager ? 'Los clientes aparecerán aquí cuando se vinculen a tu correo.' : 'Vincúlala desde Perfil y ajustes.'}
                </p>
              </div>
            ) : contacts.map((contact) => {
              const active = contact.id === selectedContactId;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`flex w-full items-center gap-3 rounded-[14px] p-3 text-left transition ${active ? 'bg-[#E7F0EA] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.06)]' : 'hover:bg-[#F5F1EA]'}`}
                >
                  <ContactImage user={contact} active={active} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#1E231F]">{contact.companyName || contact.name}</p>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-stone-500">{contact.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-[430px] min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-[#ECE5DB] bg-[#FFFDF9] px-4 py-3.5">
            {selectedContact && <ContactImage user={selectedContact} size="md" />}
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[#1E231F]">{selectedContact?.companyName || selectedContact?.name || 'Mensajes'}</p>
              {selectedContact && (
                <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.08em] text-stone-400">
                  {selectedContact.role === UserRole.RIDER ? 'Autónomo' : 'Gestoría'} · {selectedContact.email}
                </p>
              )}
            </div>
          </div>

          <div className="labora-soft-grid flex-1 space-y-3 overflow-y-auto bg-[#F8F5EF] p-4 sm:p-5">
            {loading ? (
              <div className="flex h-full min-h-[280px] items-center justify-center gap-2 text-xs font-bold text-stone-400">
                <Loader2 size={16} className="animate-spin" /> Sincronizando conversación…
              </div>
            ) : !selectedContact ? (
              <Empty icon="select" />
            ) : conversation.length === 0 ? (
              <Empty icon="start" />
            ) : conversation.map((message) => {
              const mine = message.senderId === currentUser.id;
              return (
                <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-3.5 py-2.5 sm:max-w-[72%] ${mine ? 'rounded-[18px_18px_5px_18px] bg-[#214E3A] text-white shadow-sm' : 'rounded-[18px_18px_18px_5px] border border-[#E3DDD4] bg-[#FFFDF9] text-[#1E231F] shadow-sm'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
                    <div className={`mt-1.5 flex items-center gap-1 text-[9px] font-medium ${mine ? 'text-white/60' : 'text-stone-400'}`}>
                      <Clock size={9} />
                      {new Date(message.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-[#ECE5DB] bg-[#FFFDF9] p-3 sm:p-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={selectedContact ? 'Escribe un mensaje…' : 'Vincula una gestoría para conversar'}
              disabled={!selectedContact || sending}
              rows={2}
              className="min-w-0 flex-1 resize-none rounded-[14px] border border-[#DED7CC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#789582] disabled:bg-[#F4F1EC]"
            />
            <button
              disabled={!selectedContact || !draft.trim() || sending}
              className="self-end rounded-[14px] bg-[#D66C47] p-3 text-white shadow-sm transition hover:bg-[#BE5838] disabled:opacity-35"
              aria-label="Enviar mensaje"
            >
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

const Empty = ({ icon }: { icon: 'select' | 'start' }) => (
  <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#E7F0EA] text-[#214E3A]">
      <MessageSquare size={23} />
    </div>
    <p className="mt-3 text-sm font-extrabold text-stone-600">
      {icon === 'select' ? 'Selecciona un contacto.' : 'La conversación empieza aquí.'}
    </p>
    {icon === 'start' && <p className="mt-1 text-xs text-stone-400">Escribe el primer mensaje cuando lo necesites.</p>}
  </div>
);
