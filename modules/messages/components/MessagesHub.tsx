import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Check, CheckCheck, Clock, Loader2, MessageSquare, Search, Send, UserRound, WifiOff } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { identityImageStore } from '../../../services/identityImage';
import { User, UserRole } from '../../../types';
import {
  canMessagePair,
  displayNameFor,
  eligibleContacts,
  isManagerLike,
  lastPreviewForContact,
  roleLabelEs,
  statusLabelEs,
  unreadIncomingCount
} from '../messagingRules';
import { messageRepository, messagingSendErrorEs } from '../repositories/messageRepository';
import { Message } from '../types';

const ContactImage = ({ user, active = false, size = 'sm' }: { user: User; active?: boolean; size?: 'sm' | 'md' }) => {
  const image = identityImageStore.getForUser(user);
  const manager = isManagerLike(user.role);
  const dimensions = size === 'md' ? 'h-11 w-11' : 'h-9 w-9';

  if (image) {
    return (
      <img
        src={image}
        alt={displayNameFor(user)}
        className={`${dimensions} shrink-0 border border-[var(--labora-border)] bg-[var(--labora-surface)] ${manager ? 'rounded-[13px] object-contain p-1' : 'rounded-full object-cover'}`}
      />
    );
  }

  return (
    <div className={`flex ${dimensions} shrink-0 items-center justify-center ${manager ? 'rounded-[13px]' : 'rounded-full'} ${active ? 'bg-[var(--labora-primary)] text-white' : 'bg-[var(--labora-surface-2)] text-[var(--labora-muted)]'}`}>
      {manager ? <Building2 size={16} /> : <UserRound size={16} />}
    </div>
  );
};

const RoleBadge = ({ role }: { role: UserRole }) => {
  const manager = isManagerLike(role);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em] ${
        manager ? 'bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]' : 'bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]'
      }`}
    >
      {manager ? 'Tu gestoría' : 'Cliente'}
    </span>
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
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [fromCache, setFromCache] = useState(false);
  const [composerError, setComposerError] = useState('');
  const isManager = Boolean(currentUser && isManagerLike(currentUser.role));

  const contacts = useMemo(
    () => (currentUser ? eligibleContacts(currentUser, users) : []),
    [currentUser, users]
  );

  const linkedGestorName = useMemo(() => {
    if (!currentUser || isManager || !contacts[0]) return '';
    return displayNameFor(contacts[0]);
  }, [currentUser, isManager, contacts]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await messageRepository.getAll(users);
      setMessages(result.messages);
      setFromCache(result.fromCache);
    } catch (error) {
      console.error(error);
      setFromCache(true);
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
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!contacts.length) {
      setSelectedContactId('');
      return;
    }
    if (!contacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  // Mark incoming as read when opening the thread (recipient = current user).
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

    if (!canMessagePair(currentUser, selectedContact)) {
      const blocked = isManager
        ? 'Solo puedes escribir a clientes vinculados a ti.'
        : 'Solo puedes escribir a tu gestoría vinculada.';
      setComposerError(blocked);
      showNotification('error', blocked);
      return;
    }

    if (!online || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      const offlineMsg = messagingSendErrorEs();
      setComposerError(offlineMsg);
      showNotification('error', offlineMsg);
      return;
    }

    const text = draft.trim();
    setComposerError('');
    setSending(true);
    try {
      const message = await messageRepository.sendMessage({
        personId: selectedContact.id,
        personName: displayNameFor(selectedContact),
        senderId: currentUser.id,
        senderName: displayNameFor(currentUser),
        recipientId: selectedContact.id,
        recipientName: displayNameFor(selectedContact),
        message: text,
        type: 'internal'
      });
      setMessages((previous) => (previous.some((item) => item.id === message.id) ? previous : [...previous, message]));
      setDraft('');
      setComposerError('');
    } catch (error: unknown) {
      const msg = messagingSendErrorEs(error);
      setComposerError(msg);
      showNotification('error', msg);
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  const hubTitle = isManager ? 'Mensajes con tus clientes' : 'Mensajes con tu gestoría';
  const hubSubtitle = isManager
    ? contacts.length === 0
      ? 'Aún no tienes clientes vinculados.'
      : `${contacts.length} cliente${contacts.length === 1 ? '' : 's'} vinculado${contacts.length === 1 ? '' : 's'}`
    : linkedGestorName
      ? linkedGestorName
      : 'Sin gestoría vinculada';

  const composerHint = isManager
    ? 'Solo a clientes vinculados a ti'
    : 'Solo ves y escribes a tu gestoría vinculada';

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="labora-kicker text-[var(--labora-primary-2)]">Comunicación privada · bidireccional</p>
          <h1 className="labora-display mt-1 text-2xl font-semibold text-[var(--labora-ink)] sm:text-[2rem]">{hubTitle}</h1>
          <p className="mt-1 text-sm text-stone-500">{hubSubtitle}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--labora-border)] bg-[var(--labora-moss-soft)] px-3 py-1.5 text-[10px] font-extrabold text-[var(--labora-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2F6B50]" /> Supabase · Realtime
        </div>
      </header>

      {(!online || fromCache) && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3.5 py-3 text-xs leading-relaxed text-[var(--labora-clay-deep)]"
        >
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-extrabold">{!online ? 'Sin conexión' : 'Copia local'}</p>
            <p className="mt-0.5 font-medium opacity-90">
              {!online
                ? 'No puedes enviar mensajes ahora. Lo que ves puede ser una copia local de tu sesión; no se encola nada para envío posterior.'
                : 'No se pudo sincronizar con el servidor. Mostrando solo la copia local de tu sesión (aislada por cuenta). Los envíos fallan sin encolar.'}
            </p>
          </div>
        </div>
      )}

      <section className="labora-card grid min-h-[560px] overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--labora-border)] bg-[var(--labora-parchment)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--labora-border)] p-3">
            <div className="relative">
              <label htmlFor="labora-messages-search" className="sr-only">Buscar en conversación</label>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
              <input
                id="labora-messages-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en conversación"
                className="w-full rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-surface-2)] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[var(--labora-primary-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]"
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto p-2 lg:max-h-[500px]">
            {contacts.length === 0 ? (
              <EmptyContacts isManager={isManager} />
            ) : (
              contacts.map((contact) => {
                const active = contact.id === selectedContactId;
                const preview = lastPreviewForContact(messages, currentUser.id, contact.id);
                const unread = unreadIncomingCount(messages, currentUser.id, contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContactId(contact.id)}
                    aria-current={active ? 'true' : undefined}
                    aria-label={`Conversación con ${displayNameFor(contact)}${unread > 0 ? `, ${unread} sin leer` : ''}`}
                    className={`flex w-full items-center gap-3 rounded-[14px] p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] ${
                      active ? 'bg-[var(--labora-moss-soft)] shadow-[inset_0_0_0_1px_rgba(33,78,58,0.06)]' : 'hover:bg-[var(--labora-surface-2)]'
                    }`}
                  >
                    <ContactImage user={contact} active={active} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-extrabold text-[var(--labora-ink)]">{displayNameFor(contact)}</p>
                        {unread > 0 && (
                          <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--labora-clay)] px-1 text-[9px] font-extrabold text-white">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <RoleBadge role={contact.role} />
                      </div>
                      <p className="mt-1 truncate text-[10px] font-medium text-stone-500">
                        {preview ? preview.message : contact.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-[430px] min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-[var(--labora-border)] bg-[var(--labora-surface)] px-4 py-3.5">
            {selectedContact && <ContactImage user={selectedContact} size="md" />}
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[var(--labora-ink)]">
                {selectedContact
                  ? `Conversación con ${displayNameFor(selectedContact)}`
                  : hubTitle}
              </p>
              {selectedContact && (
                <p className="mt-0.5 truncate text-[10px] font-medium text-stone-400">
                  {roleLabelEs(selectedContact.role)} · {selectedContact.email}
                </p>
              )}
            </div>
          </div>

          <div className="labora-soft-grid flex-1 space-y-3 overflow-y-auto bg-[var(--labora-canvas)] p-4 sm:p-5">
            {loading ? (
              <div className="flex h-full min-h-[280px] items-center justify-center gap-2 text-xs font-bold text-stone-400">
                <Loader2 size={16} className="animate-spin" /> Sincronizando conversación…
              </div>
            ) : !selectedContact ? (
              <EmptyThread
                title={isManager ? 'Selecciona un cliente' : 'Selecciona tu gestoría'}
                detail={
                  isManager
                    ? 'La conversación es solo con autónomos vinculados a ti.'
                    : 'La conversación es solo con tu gestoría vinculada.'
                }
              />
            ) : conversation.length === 0 ? (
              <EmptyThread
                title="La conversación empieza aquí"
                detail={
                  isManager
                    ? `Puedes dejar un mensaje a ${displayNameFor(selectedContact)}. También podrá escribirte.`
                    : `Escribe a tu gestoría (${displayNameFor(selectedContact)}). También podrá dejarte mensajes.`
                }
              />
            ) : (
              conversation.map((message) => {
                const mine = message.senderId === currentUser.id;
                const counterpartRole = selectedContact
                  ? roleLabelEs(selectedContact.role)
                  : 'Contacto';
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] px-3.5 py-2.5 sm:max-w-[72%] ${
                        mine
                          ? 'rounded-[18px_18px_5px_18px] bg-[var(--labora-primary)] text-white shadow-sm'
                          : 'rounded-[18px_18px_18px_5px] border border-[var(--labora-border)] bg-[var(--labora-surface)] text-[var(--labora-ink)] shadow-sm'
                      }`}
                    >
                      <p className={`mb-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${mine ? 'text-white/70' : 'text-[var(--labora-primary-2)]'}`}>
                        {mine ? 'Tú' : counterpartRole}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
                      <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] font-medium ${mine ? 'text-white/60' : 'text-stone-400'}`}>
                        <Clock size={9} />
                        {new Date(message.timestamp).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          {message.status === 'read' ? <CheckCheck size={10} /> : <Check size={10} />}
                          {statusLabelEs(message.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-[var(--labora-border)] bg-[var(--labora-surface)] p-3 sm:p-4" noValidate>
            <div className="flex gap-2">
              <label htmlFor="labora-messages-draft" className="sr-only">Escribe un mensaje</label>
              <textarea
                id="labora-messages-draft"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); if (composerError) setComposerError(''); }}
                placeholder={selectedContact ? 'Escribe un mensaje…' : 'Vincula una gestoría para conversar'}
                disabled={!selectedContact || sending || !online}
                rows={2}
                aria-invalid={composerError ? true : undefined}
                aria-describedby={composerError ? 'labora-messages-composer-error' : 'labora-messages-composer-hint'}
                className="min-w-0 flex-1 resize-none rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--labora-primary-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] disabled:bg-[var(--labora-surface-2)]"
              />
              <button
                type="submit"
                disabled={!selectedContact || !draft.trim() || sending || !online}
                className="self-end rounded-[14px] bg-[var(--labora-clay)] p-3 text-white shadow-sm transition hover:bg-[#BE5838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)] disabled:opacity-35"
                aria-label="Enviar mensaje"
              >
                {sending ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Send size={17} aria-hidden />}
              </button>
            </div>
            {composerError ? (
              <p id="labora-messages-composer-error" role="alert" className="mt-2 text-[10px] font-bold text-[var(--labora-clay-deep)]">{composerError}</p>
            ) : (
              <p id="labora-messages-composer-hint" className="mt-2 text-[10px] font-medium text-stone-400">{composerHint}</p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

const EmptyContacts = ({ isManager }: { isManager: boolean }) => (
  <div className="px-3 py-10 text-center" role="status" aria-live="polite">
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--labora-surface-2)] text-[var(--labora-muted)]" aria-hidden>
      {isManager ? <UserRound size={21} /> : <Building2 size={21} />}
    </div>
    <p className="mt-3 text-xs font-extrabold text-[var(--labora-ink-soft)]">
      {isManager ? 'No tienes clientes vinculados.' : 'No tienes gestoría vinculada.'}
    </p>
    <p className="mt-1 text-[10px] leading-relaxed text-[var(--labora-muted)]">
      {isManager
        ? 'Los autónomos aparecen aquí cuando vinculan tu correo desde Perfil → Relación de trabajo. No hay conexión OAuth automática.'
        : 'Ve a Perfil → Relación de trabajo e introduce el correo de tu gestoría. No inventamos vínculos ni OAuth.'}
    </p>
  </div>
);

const EmptyThread = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--labora-moss-soft)] text-[var(--labora-primary)]" aria-hidden>
      <MessageSquare size={23} />
    </div>
    <p className="mt-3 text-sm font-extrabold text-[var(--labora-ink-soft)]">{title}</p>
    <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--labora-muted)]">{detail}</p>
  </div>
);
