import { describe, expect, it } from 'vitest';
import { canOpenView, hashForView, resolveAppView, viewFromHash, viewStorageKey } from './appNavigation';
import { UserRole } from '../types';

describe('app navigation', () => {
  it('reads canonical and legacy hashes', () => {
    expect(viewFromHash('#view=messages')).toBe('messages');
    expect(viewFromHash('#docs')).toBe('docs');
  });

  it('prefers a valid hash and falls back to the user-scoped stored view', () => {
    expect(resolveAppView('#view=money', 'messages', UserRole.RIDER)).toBe('money');
    expect(resolveAppView('#view=unknown', 'messages', UserRole.RIDER)).toBe('messages');
    expect(resolveAppView('', null, UserRole.RIDER)).toBe('dashboard');
  });

  it('does not restore a view that belongs to the other role', () => {
    expect(canOpenView('people', UserRole.RIDER)).toBe(false);
    expect(canOpenView('integrations', UserRole.MANAGER)).toBe(false);
    expect(resolveAppView('#view=people', 'people', UserRole.RIDER)).toBe('dashboard');
    expect(resolveAppView('#view=integrations', 'integrations', UserRole.MANAGER)).toBe('dashboard');
  });

  it('creates stable hashes and per-user storage keys', () => {
    expect(hashForView('tax-declarations')).toBe('#view=tax-declarations');
    expect(viewStorageKey('user-123')).toBe('labora:last-view:user-123');
  });
});
