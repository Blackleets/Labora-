export interface Message {
  id: string;
  // Legacy contact fields kept for backwards compatibility with existing localStorage data.
  personId: string;
  personName: string;
  // New two-sided conversation fields. Optional so old messages remain readable.
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'read' | 'failed';
  type: 'internal' | 'email' | 'sms';
}
