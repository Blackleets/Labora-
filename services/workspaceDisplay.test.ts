import { describe, expect, it } from 'vitest';
import { GestorRequirement, User, UserRole } from '../types';
import { formatWorkspaceMoney, pendingRequirementCount } from './workspaceDisplay';

const user = (id: string, role: UserRole): User => ({ id, role, name: id, email: `${id}@example.test`, platforms: [] });
const requirements = [
  { managerId: 'm', riderId: 'a', status: 'pending' },
  { managerId: 'm', riderId: 'a', status: 'submitted' },
  { managerId: 'm', riderId: 'a', status: 'approved' },
  { managerId: 'other', riderId: 'other', status: 'pending' },
  { managerId: 'other', riderId: 'other', status: 'submitted' }
] as GestorRequirement[];

describe('role-scoped navigation badges', () => {
  it('counts received responses for the manager but excludes another manager and closed items', () => {
    expect(pendingRequirementCount(user('m', UserRole.MANAGER), requirements)).toBe(2);
  });
  it('shows workers only their own unanswered requests', () => {
    expect(pendingRequirementCount(user('a', UserRole.RIDER), requirements)).toBe(1);
    expect(pendingRequirementCount(user('unlinked', UserRole.RIDER), requirements)).toBe(0);
  });
  it('returns no count without a session and counts open admin-visible requests', () => {
    expect(pendingRequirementCount(null, requirements)).toBe(0);
    expect(pendingRequirementCount(user('admin', UserRole.ADMIN), requirements)).toBe(4);
  });
});

describe('workspace money privacy', () => {
  it('masks positive, negative and zero balances without revealing the currency', () => {
    for (const amount of [1234, -875, 0]) expect(formatWorkspaceMoney(amount, 'EUR', true)).toBe('••••');
  });
  it('restores the real formatted amount when privacy is off', () => {
    expect(formatWorkspaceMoney(1234, 'EUR', false)).toBe((1234).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
  });
});
