import { supabase } from '../../../services/supabaseClient';
import { User } from '../../../types';
import { Message } from '../types';
import {
  offlineFallbackFor,
  purgeLegacySharedCache,
  readMessageCache,
  writeMessageCache
} from './messageCache';
import { messagingSendErrorEs } from './messagingSendErrorEs';
export { messagingSendErrorEs };

type NewMessage = Omit<Message, 'id' | 'timestamp' | 'status'>;

export type MessageLoadResult = {
  messages: Message[];
  /** True when remote failed and we served this session user's local cache only. */
  fromCache: boolean;
};


const mapRows = (rows: any[], users: User[]): Message[] => {
  const names = new Map(users.map((user) => [user.id, user.companyName || user.name]));
  return rows.map((row) => ({
    id: row.id,
    personId: row.recipient_id,
    personName: names.get(row.recipient_id) || 'Contacto',
    senderId: row.sender_id,
    senderName: names.get(row.sender_id) || 'Contacto',
    recipientId: row.recipient_id,
    recipientName: names.get(row.recipient_id) || 'Contacto',
    message: row.message,
    timestamp: row.created_at,
    status: row.status,
    type: row.type
  }));
};

const requireSessionUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) throw new Error('Sesión requerida para mensajería.');
  return data.user.id;
};

export const messageRepository = {
  getAll: async (users: User[]): Promise<MessageLoadResult> => {
    purgeLegacySharedCache();
    const sessionUserId = await requireSessionUserId().catch(() => null);
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading remote messages:', error);
      // Never return another account's cache. Only the current session user cache is allowed.
      const cached = offlineFallbackFor(sessionUserId);
      return {
        messages: cached.filter((row): row is Message =>
          Boolean(row.id && row.personId && row.personName && row.timestamp && row.status && row.type)
        ),
        fromCache: true
      };
    }
    const messages = mapRows(data || [], users);
    if (sessionUserId) writeMessageCache(sessionUserId, messages);
    return { messages, fromCache: false };
  },

  sendMessage: async (msg: NewMessage): Promise<Message> => {
    if (!msg.senderId || !msg.recipientId) throw new Error('Faltan remitente o destinatario.');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error(messagingSendErrorEs());
    }
    const sessionUserId = await requireSessionUserId();
    if (msg.senderId !== sessionUserId) {
      throw new Error('No puedes enviar mensajes como otro usuario.');
    }

    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabase.from('messages').insert({
      id,
      sender_id: msg.senderId,
      recipient_id: msg.recipientId,
      message: msg.message.trim(),
      type: msg.type,
      status: 'sent'
    }).select('*').single();

    if (error) throw new Error(messagingSendErrorEs(error));

    const newMessage: Message = {
      ...msg,
      id: data.id,
      timestamp: data.created_at,
      status: data.status
    };
    writeMessageCache(sessionUserId, [
      ...readMessageCache(sessionUserId).filter((item) => item.id !== newMessage.id),
      newMessage
    ]);
    return newMessage;
  },

  markRead: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('mark_message_read', { p_message_id: id });
    if (error) throw error;
  },

  subscribe: (onChange: () => void) => {
    const channel = supabase
      .channel(`labora-messages-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => onChange())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }
};
