import { UserRole } from '../types';

export const APP_VIEWS = [
  'dashboard',
  'money',
  'money-incomes',
  'tax-declarations',
  'gestor-requirements',
  'operations',
  'integrations',
  'automation',
  'people',
  'messages',
  'settings',
  'profile',
  'docs'
] as const;

export type AppView = typeof APP_VIEWS[number];

const COMMON_VIEWS = new Set<AppView>([
  'dashboard',
  'money',
  'money-incomes',
  'tax-declarations',
  'gestor-requirements',
  'operations',
  'automation',
  'messages',
  'settings',
  'profile',
  'docs'
]);

export const canOpenView = (view: string, role?: UserRole): view is AppView => {
  if (!APP_VIEWS.includes(view as AppView)) return false;
  if (!role) return view === 'dashboard';
  if (COMMON_VIEWS.has(view as AppView)) return true;
  if (view === 'people') return role === UserRole.MANAGER || role === UserRole.ADMIN;
  if (view === 'integrations') return role === UserRole.RIDER;
  return false;
};

export const viewFromHash = (hash: string) => {
  const normalized = hash.replace(/^#/, '');
  const params = new URLSearchParams(normalized);
  return params.get('view') || normalized;
};

export const resolveAppView = (
  hash: string,
  storedView: string | null,
  role?: UserRole
): AppView => {
  const hashedView = viewFromHash(hash);
  if (canOpenView(hashedView, role)) return hashedView;
  if (storedView && canOpenView(storedView, role)) return storedView;
  return 'dashboard';
};

export const hashForView = (view: AppView) => `#view=${view}`;

export const viewStorageKey = (userId: string) => `labora:last-view:${userId}`;
