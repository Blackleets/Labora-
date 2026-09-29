import { GestorRequirement, User, UserRole } from '../types';

export function pendingRequirementCount(user: User | null | undefined, requirements: GestorRequirement[]): number {
  if (!user) return 0;
  return requirements.filter(row => {
    if (user.role === UserRole.RIDER) return row.riderId === user.id && row.status === 'pending';
    if (user.role === UserRole.MANAGER) return row.managerId === user.id && (row.status === 'pending' || row.status === 'submitted');
    if (user.role === UserRole.ADMIN) return row.status === 'pending' || row.status === 'submitted';
    return false;
  }).length;
}

/** Only presentation is masked; original values remain available for authorised exports. */
export function formatWorkspaceMoney(amount: number, currency: string, privacyMode: boolean): string {
  if (privacyMode) return '••••';
  return amount.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 });
}
