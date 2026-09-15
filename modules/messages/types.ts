
export interface Message {
  id: string;
  personId: string;
  personName: string; // Denormalized for easier display
  message: string;
  timestamp: string;
  status: 'sent' | 'read' | 'failed';
  type: 'internal' | 'email' | 'sms';
}
