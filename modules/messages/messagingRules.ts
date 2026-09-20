/**
 * Pure rules for rider ↔ gestoría messaging eligibility and display.
 * Keep free of React / Supabase so unit tests stay fail-closed and fast.
 */
import { User, UserRole } from '../../types';
import { Message } from './types';

export const isManagerLike = (role: UserRole): boolean =>
  role === UserRole.MANAGER || role === UserRole.ADMIN;

export const displayNameFor = (user: Pick<User, 'name' | 'companyName'>): string =>
  (user.companyName || user.name || 'Contacto').trim();

export const roleLabelEs = (role: UserRole): string =>
  isManagerLike(role) ? 'Gestoría' : 'Autónomo';

export const statusLabelEs = (status: Message['status']): string => {
  switch (status) {
    case 'read':
      return 'Leído';
    case 'failed':
      return 'Fallido';
    case 'sent':
    default:
      return 'Enviado';
  }
};

/**
 * Contacts the current user may message:
 * - Manager/Admin → riders with managerId === currentUser.id
 * - Rider → their linked manager (managerId), if present
 * Never invents contacts or OAuth linking.
 */
export const eligibleContacts = (currentUser: User, users: User[]): User[] => {
  if (!currentUser?.id) return [];

  if (isManagerLike(currentUser.role)) {
    return users.filter(
      (user) => user.role === UserRole.RIDER && user.managerId === currentUser.id
    );
  }

  if (!currentUser.managerId) return [];

  const manager = users.find(
    (user) => isManagerLike(user.role) && user.id === currentUser.managerId
  );
  return manager ? [manager] : [];
};

/**
 * True only when currentUser may send to recipient under the vinculación contract.
 */
export const canMessagePair = (currentUser: User, recipient: User): boolean => {
  if (!currentUser?.id || !recipient?.id) return false;
  if (currentUser.id === recipient.id) return false;
  return eligibleContacts(currentUser, [recipient]).some((c) => c.id === recipient.id);
};

/**
 * Conversation partner id relative to the viewer.
 * Prefers senderId/recipientId; falls back to legacy personId only when needed.
 */
export const counterpartyId = (
  message: Pick<Message, 'senderId' | 'recipientId' | 'personId'>,
  viewerId: string
): string | undefined => {
  if (message.senderId && message.recipientId) {
    if (message.senderId === viewerId) return message.recipientId;
    if (message.recipientId === viewerId) return message.senderId;
  }
  // Legacy: personId was usually the recipient; only use if viewer is not that id
  // or we have no two-sided fields.
  if (message.personId && message.personId !== viewerId) return message.personId;
  return undefined;
};

export const counterpartyName = (
  message: Pick<Message, 'senderId' | 'recipientId' | 'senderName' | 'recipientName' | 'personId' | 'personName'>,
  viewerId: string
): string => {
  if (message.senderId && message.recipientId) {
    if (message.senderId === viewerId) {
      return message.recipientName || message.personName || 'Contacto';
    }
    if (message.recipientId === viewerId) {
      return message.senderName || 'Contacto';
    }
  }
  if (message.personId && message.personId !== viewerId) {
    return message.personName || 'Contacto';
  }
  return message.personName || 'Contacto';
};

export const lastPreviewForContact = (
  messages: Message[],
  viewerId: string,
  contactId: string
): Message | undefined => {
  const thread = messages.filter((m) => counterpartyId(m, viewerId) === contactId);
  if (!thread.length) return undefined;
  return thread.reduce((latest, m) =>
    new Date(m.timestamp).getTime() >= new Date(latest.timestamp).getTime() ? m : latest
  );
};

export type UnreadLike = {
  recipientId?: string;
  senderId?: string;
  status?: string;
};

export const unreadIncomingCount = (
  messages: UnreadLike[],
  viewerId: string,
  contactId?: string
): number =>
  messages.filter(
    (m) =>
      m.recipientId === viewerId
      && m.status === 'sent'
      && (!contactId || m.senderId === contactId)
  ).length;
