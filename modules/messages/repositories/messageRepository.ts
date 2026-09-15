
import { Message } from '../types';

const STORAGE_KEY = 'labora_messages';

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

  sendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'status'>): void => {
    const list = messageRepository.getAll();
    const newMessage: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    // Add to beginning
    const updatedList = [newMessage, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  }
};
