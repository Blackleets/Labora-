import { Message } from '../types';

const STORAGE_KEY = 'labora_messages';

type NewMessage = Omit<Message, 'id' | 'timestamp' | 'status'>;

export const messageRepository = {
  getAll: (): Message[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading messages:', e);
      return [];
    }
  },

  sendMessage: (msg: NewMessage): Message => {
    const list = messageRepository.getAll();
    const newMessage: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    const updatedList = [newMessage, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return newMessage;
  },

  markRead: (id: string): void => {
    const updated = messageRepository.getAll().map((message) =>
      message.id === id ? { ...message, status: 'read' as const } : message
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};
