import { describe, expect, it } from 'vitest';
import { User, UserRole } from '../types';
import {
  displayGestoriaName,
  findManagerCandidateByEmail,
  friendlyLinkError,
  friendlyUnlinkError,
  isManagerLikeRole,
  isPlausibleEmail,
  listLinkedClients,
  normalizeGestoriaEmail,
  validateRiderLinkByEmail
} from './gestoriaLinking';
import { canAccessClientRecord } from './gestoriaLinking';

const rider = (overrides: Partial<User> = {}): User => ({
  id: 'rider-1',
  name: 'Ana Rider',
  email: 'ana@example.com',
  role: UserRole.RIDER,
  platforms: [],
  ...overrides
});

const manager = (overrides: Partial<User> = {}): User => ({
  id: 'mgr-1',
  name: 'Gestor Contact',
  email: 'gestoria@firm.es',
  companyName: 'Fiscal Norte SL',
  role: UserRole.MANAGER,
  platforms: [],
  ...overrides
});

describe('gestoriaLinking helpers', () => {
  it('normalizes and validates email', () => {
    expect(normalizeGestoriaEmail('  Foo@Bar.ES ')).toBe('foo@bar.es');
    expect(isPlausibleEmail('a@b.co')).toBe(true);
    expect(isPlausibleEmail('not-an-email')).toBe(false);
    expect(isPlausibleEmail('')).toBe(false);
  });

  it('recognizes manager-like roles', () => {
    expect(isManagerLikeRole(UserRole.MANAGER)).toBe(true);
    expect(isManagerLikeRole(UserRole.ADMIN)).toBe(true);
    expect(isManagerLikeRole(UserRole.RIDER)).toBe(false);
  });

  it('finds manager by email and lists clients', () => {
    const users = [
      manager(),
      rider({ id: 'r1', managerId: 'mgr-1' }),
      rider({ id: 'r2', email: 'other@x.com', managerId: 'someone-else' }),
      rider({ id: 'r3', email: 'peer@x.com' })
    ];
    expect(findManagerCandidateByEmail(users, 'GESTORIA@firm.es')?.id).toBe('mgr-1');
    expect(findManagerCandidateByEmail(users, 'missing@x.com')).toBeUndefined();
    expect(listLinkedClients(users, 'mgr-1').map((u) => u.id)).toEqual(['r1']);
  });

  it('keeps client records scoped to the linked gestoría', () => {
    const linked = rider({ id: 'linked', managerId: 'mgr-1' });
    const foreign = rider({ id: 'foreign', managerId: 'mgr-2' });

    expect(canAccessClientRecord(manager(), linked)).toBe(true);
    expect(canAccessClientRecord(manager(), foreign)).toBe(false);
    expect(canAccessClientRecord(rider(), linked)).toBe(false);
    expect(canAccessClientRecord(manager({ role: UserRole.ADMIN }), foreign)).toBe(true);
  });

  it('rejects empty / invalid / self / rider emails', () => {
    const me = rider();
    const peer = rider({ id: 'peer', email: 'peer@x.com' });
    const users = [me, peer, manager()];

    expect(validateRiderLinkByEmail(me, '', users).ok).toBe(false);
    expect(validateRiderLinkByEmail(me, 'bad', users).ok).toBe(false);
    expect(validateRiderLinkByEmail(me, me.email, users).ok).toBe(false);

    const peerResult = validateRiderLinkByEmail(me, 'peer@x.com', users);
    expect(peerResult.ok).toBe(false);
    if (peerResult.ok === false) {
      expect(peerResult.code).toBe('not_manager');
      expect(peerResult.message).toMatch(/autónomo/i);
    }
  });

  it('rejects self-link with explicit self_link code', () => {
    const me = rider({ email: 'yo@labora.test' });
    const users = [me, manager()];
    const byEmail = validateRiderLinkByEmail(me, 'YO@labora.test', users);
    expect(byEmail.ok).toBe(false);
    if (byEmail.ok === false) {
      expect(byEmail.code).toBe('self_link');
      expect(byEmail.message).toMatch(/propio correo/i);
    }
  });

  it('rejects rider-as-manager link (cannot link peer autónomo)', () => {
    const me = rider();
    const otherRider = rider({ id: 'r-other', email: 'otro-rider@x.com', name: 'Otro' });
    const users = [me, otherRider, manager()];
    const result = validateRiderLinkByEmail(me, 'otro-rider@x.com', users);
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.code).toBe('not_manager');
      expect(result.message).toMatch(/gestoría/i);
    }
  });

  it('accepts known gestoría and unknown email (RPC must resolve)', () => {
    const me = rider();
    const users = [me, manager()];

    const known = validateRiderLinkByEmail(me, 'gestoria@firm.es', users);
    expect(known.ok).toBe(true);
    if (known.ok) {
      expect(known.candidate?.id).toBe('mgr-1');
      expect(displayGestoriaName(known.candidate)).toBe('Fiscal Norte SL');
    }

    const unknown = validateRiderLinkByEmail(me, 'nueva@gestoria.es', users);
    expect(unknown.ok).toBe(true);
    if (unknown.ok) expect(unknown.candidate).toBeUndefined();
  });

  it('maps RPC errors to Spanish copy', () => {
    expect(friendlyLinkError({ message: 'Manager not found' })).toMatch(/No existe/i);
    expect(friendlyLinkError({ message: 'Not a manager role' })).toMatch(/gestoría/i);
    expect(
      friendlyLinkError({ message: 'Could not find the function public.link_manager_by_email' })
    ).toMatch(/RPC/i);
    expect(
      friendlyUnlinkError({ message: 'function unlink_own_manager does not exist' })
    ).toMatch(/Desvincular|RPC/i);
  });
});
