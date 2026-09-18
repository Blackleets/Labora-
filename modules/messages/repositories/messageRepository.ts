import { supabase } from '../../../services/supabaseClient';
import { User } from '../../../types';
import { Message } from '../types';

const STORAGE_KEY = 'labora_messages';
type NewMessage = Omit<Message, 'id' | 'timestamp' | 'status'>;

const cache = (messages: Message[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* cache is optional */ }
};

const cached = (): Message[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
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

export const messageRepository = {
  getAll: async (users: User[]): Promise<Message[]> => {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading remote messages:', error);
      return cached();
    }
    const messages = mapRows(data || [], users);
    cache(messages);
    return messages;
  },

  sendMessage: async (msg: NewMessage): Promise<Message> => {
    if (!msg.senderId || !msg.recipientId) throw new Error('Faltan remitente o destinatario.');

    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabase.from('messages').insert({
      id,
      sender_id: msg.senderId,
      recipient_id: msg.recipientId,
      message: msg.message.trim(),
      type: msg.type,
      status: 'sent'
    }).select('*').single();

    if (error) throw error;

    const newMessage: Message = {
      ...msg,
      id: data.id,
      timestamp: data.created_at,
      status: data.status
    };
    cache([...cached().filter((item) => item.id !== newMessage.id), newMessage]);
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
