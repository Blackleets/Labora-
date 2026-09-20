import { describe, expect, it } from 'vitest';
import { User, UserRole } from '../../types';
import {
  canMessagePair,
  counterpartyId,
  counterpartyName,
  eligibleContacts,
  lastPreviewForContact,
  roleLabelEs,
  statusLabelEs,
  unreadIncomingCount
} from './messagingRules';
import { Message } from './types';

const rider = (id: string, managerId?: string): User => ({
  id,
  name: `Rider ${id}`,
  email: `${id}@rider.test`,
  role: UserRole.RIDER,
  platforms: [],
  managerId
});

const gestor = (id: string, companyName?: string): User => ({
  id,
  name: `Gestor ${id}`,
  email: `${id}@gestoria.test`,
  role: UserRole.MANAGER,
  platforms: [],
  companyName
});

describe('messaging eligibility (rider ↔ gestoría)', () => {
  const g1 = gestor('g1', 'Gestoría Norte');
  const g2 = gestor('g2', 'Otra Gestoría');
  const r1 = rider('r1', 'g1');
  const r2 = rider('r2', 'g1');
  const rOrphan = rider('r3');
  const users = [g1, g2, r1, r2, rOrphan];

  it('rider only sees their linked manager', () => {
    expect(eligibleContacts(r1, users).map((u) => u.id)).toEqual(['g1']);
    expect(eligibleContacts(rOrphan, users)).toEqual([]);
  });

  it('manager only sees riders with managerId === self', () => {
    expect(eligibleContacts(g1, users).map((u) => u.id).sort()).toEqual(['r1', 'r2']);
    expect(eligibleContacts(g2, users)).toEqual([]);
  });

  it('canMessagePair enforces vinculación both ways', () => {
    expect(canMessagePair(r1, g1)).toBe(true);
    expect(canMessagePair(g1, r1)).toBe(true);
    expect(canMessagePair(r1, g2)).toBe(false);
    expect(canMessagePair(g1, rOrphan)).toBe(false);
    expect(canMessagePair(r1, r2)).toBe(false);
    expect(canMessagePair(r1, r1)).toBe(false);
  });

  it('role and status labels are Spanish', () => {
    expect(roleLabelEs(UserRole.RIDER)).toBe('Autónomo');
    expect(roleLabelEs(UserRole.MANAGER)).toBe('Gestoría');
    expect(statusLabelEs('sent')).toBe('Enviado');
    expect(statusLabelEs('read')).toBe('Leído');
    expect(statusLabelEs('failed')).toBe('Fallido');
  });
});

describe('counterparty naming vs legacy personId', () => {
  const base: Message = {
    id: 'm1',
    personId: 'g1',
    personName: 'Legacy Recipient',
    senderId: 'r1',
    senderName: 'Rider Uno',
    recipientId: 'g1',
    recipientName: 'Gestoría Norte',
    message: 'hola',
    timestamp: '2026-01-01T10:00:00.000Z',
    status: 'sent',
    type: 'internal'
  };

  it('prefers two-sided ids for counterparty', () => {
    expect(counterpartyId(base, 'r1')).toBe('g1');
    expect(counterpartyId(base, 'g1')).toBe('r1');
    expect(counterpartyName(base, 'r1')).toBe('Gestoría Norte');
    expect(counterpartyName(base, 'g1')).toBe('Rider Uno');
  });

  it('does not treat legacy personId as partner when viewer is recipient', () => {
    const legacyOnly: Message = {
      ...base,
      senderId: undefined,
      recipientId: undefined,
      personId: 'g1',
      personName: 'Solo personId'
    };
    expect(counterpartyId(legacyOnly, 'r1')).toBe('g1');
    expect(counterpartyId(legacyOnly, 'g1')).toBeUndefined();
  });

  it('lastPreview and unread count use counterparty / recipient correctly', () => {
    const messages: Message[] = [
      { ...base, id: 'm1', timestamp: '2026-01-01T10:00:00.000Z', status: 'read' },
      {
        ...base,
        id: 'm2',
        senderId: 'g1',
        senderName: 'Gestoría Norte',
        recipientId: 'r1',
        recipientName: 'Rider Uno',
        personId: 'r1',
        personName: 'Rider Uno',
        message: 'respuesta',
        timestamp: '2026-01-01T11:00:00.000Z',
        status: 'sent'
      }
    ];
    const preview = lastPreviewForContact(messages, 'r1', 'g1');
    expect(preview?.id).toBe('m2');
    expect(unreadIncomingCount(messages, 'r1')).toBe(1);
    expect(unreadIncomingCount(messages, 'r1', 'g1')).toBe(1);
    expect(unreadIncomingCount(messages, 'g1')).toBe(0);
  });
});
