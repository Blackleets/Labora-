import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Clock, MessageSquare, Search, Send, Users } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { UserRole } from '../../../types';
import { messageRepository } from '../repositories/messageRepository';
import { Message } from '../types';

export const MessagesHub: React.FC = () => {
  const { currentUser, users, showNotification } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');

  const isManager = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  const contacts = useMemo(() => {
    if (!currentUser) return [];

    if (isManager) {
      return users.filter(
        (user) =>
          user.role === UserRole.RIDER &&
          (user.managerId === currentUser.id || currentUser.id === 'm1')
      );
    }

    const assignedManager = users.find(
      (user) => user.role === UserRole.MANAGER && user.id === currentUser.managerId
    );
    return assignedManager ? [assignedManager] : users.filter((user) => user.role === UserRole.MANAGER).slice(0, 1);
  }, [currentUser, users, isManager]);

  useEffect(() => {
    setMessages(messageRepository.getAll());
  }, []);

  useEffect(() => {
    if (!selectedContactId && contacts.length > 0) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  const visibleMessages = useMemo(() => {
    if (!currentUser) return [];

    return messages.filter((message) => {
      // New messages are scoped to the signed-in demo user.
      if (message.senderId || message.recipientId) {
        return message.senderId === currentUser.id || message.recipientId === currentUser.id;
      }

      // Backwards compatibility: legacy CRM messages were outbound manager records.
      return isManager;
    });
  }, [messages, currentUser, isManager]);

  const conversation = useMemo(() => {
    if (!selectedContactId || !currentUser) return [];

    return visibleMessages
      .filter((message) => {
        if (message.senderId || message.recipientId) {
          return (
            (message.senderId === currentUser.id && message.recipientId === selectedContactId) ||
            (message.senderId === selectedContactId && message.recipientId === currentUser.id)
          );
        }

        return isManager && message.personId === selectedContactId;
      })
      .filter((message) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          message.message.toLowerCase().includes(term) ||
          message.personName.toLowerCase().includes(term) ||
          message.senderName?.toLowerCase().includes(term) ||
          message.recipientName?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [visibleMessages, selectedContactId, currentUser, searchTerm, isManager]);

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !selectedContact || !draft.trim()) return;

    const newMessage = messageRepository.sendMessage({
      personId: selectedContact.id,
      personName: selectedContact.name,
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: selectedContact.id,
      recipientName: selectedContact.name,
      message: draft.trim(),
      type: 'internal'
    });

    setMessages((previous) => [...previous, newMessage]);
    setDraft('');
    showNotification('success', `Mensaje enviado a ${selectedContact.name}`);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div>
        <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
          <MessageSquare className="text-[#2D6CDF]" /> Comunicaciones
        </h2>
        <p className="text-gray-500 mt-1">
          {isManager
            ? 'Conversaciones internas con tus riders.'
            : 'Canal interno con tu gestor asignado.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[520px]">
        <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Users size={17} className="text-[#2D6CDF]" />
              {isManager ? 'Clientes' : 'Mi gestor'}
            </div>
          </div>
          <div className="p-2 space-y-1">
            {contacts.length === 0 ? (
              <div className="p-5 text-center text-xs text-gray-400">No hay contactos asignados.</div>
            ) : (
              contacts.map((contact) => {
                const active = contact.id === selectedContactId;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-colors ${
                      active ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <p className="font-bold text-sm truncate">{contact.name}</p>
                    <p className="text-[11px] opacity-70 truncate">{contact.email}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[520px]">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-gray-900">{selectedContact?.name || 'Selecciona un contacto'}</p>
              <p className="text-xs text-gray-400">Mensajería interna de Labora+</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="search"
                placeholder="Buscar en conversación..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/60">
            {conversation.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-400">
                <MessageSquare size={42} className="mb-3 opacity-20" />
                <p className="font-bold text-sm">Aún no hay mensajes</p>
                <p className="text-xs mt-1">Envía el primero para probar el flujo entre ambos perfiles.</p>
              </div>
            ) : (
              conversation.map((message) => {
                const mine = message.senderId ? message.senderId === currentUser.id : isManager;
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 border ${
                        mine
                          ? 'bg-[#2D6CDF] text-white border-[#2D6CDF]'
                          : 'bg-white text-gray-800 border-gray-200'
                      }`}
                    >
                      <p className={`text-[10px] font-bold mb-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                        {mine ? 'Tú' : message.senderName || message.personName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      <div className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                        <Clock size={10} />
                        {new Date(message.timestamp).toLocaleString('es-ES')}
                        {mine && <CheckCheck size={11} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedContact ? `Escribe a ${selectedContact.name}...` : 'Selecciona un contacto'}
              disabled={!selectedContact}
              rows={2}
              className="flex-1 resize-none px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!selectedContact || !draft.trim()}
              className="self-end p-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        Esta mensajería forma parte del entorno demo local. El flujo Rider ↔ Gestor se puede probar cambiando de perfil en Labora+; la sincronización entre dispositivos requiere backend remoto.
      </div>
    </div>
  );
};
