/**
 * Pure autónomo ↔ gestoría linking helpers.
 * No React / Supabase — unit-tested, fail-closed.
 */
import { User, UserRole } from '../types';

export type LinkCandidate = {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  role: UserRole;
};

export type LinkValidationOk = {
  ok: true;
  email: string;
  /** Present when the directory already knows this profile. */
  candidate?: LinkCandidate;
};

export type LinkValidationErr = {
  ok: false;
  code:
    | 'empty_email'
    | 'invalid_email'
    | 'self_link'
    | 'not_manager'
    | 'already_linked_same';
  message: string;
};

export type LinkValidation = LinkValidationOk | LinkValidationErr;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isManagerLikeRole = (role: UserRole | string | undefined | null): boolean => {
  const value = String(role || '').toUpperCase();
  return value === UserRole.MANAGER || value === UserRole.ADMIN || value === 'MANAGER' || value === 'ADMIN';
};

export const normalizeGestoriaEmail = (raw: string | undefined | null): string =>
  String(raw ?? '')
    .trim()
    .toLowerCase();

export const isPlausibleEmail = (email: string): boolean => EMAIL_RE.test(email);

export const displayGestoriaName = (
  user: Pick<User, 'name' | 'companyName'> | LinkCandidate | undefined
): string => {
  if (!user) return 'Gestoría';
  return (user.companyName || user.name || 'Gestoría').trim();
};

/**
 * Find a gestoría profile by email in an already-loaded directory.
 * Does not invent profiles; returns undefined when the email is unknown locally.
 */
export const findManagerCandidateByEmail = (
  users: User[],
  rawEmail: string
): LinkCandidate | undefined => {
  const email = normalizeGestoriaEmail(rawEmail);
  if (!email) return undefined;
  const hit = users.find((user) => normalizeGestoriaEmail(user.email) === email);
  if (!hit) return undefined;
  return {
    id: hit.id,
    email: normalizeGestoriaEmail(hit.email),
    name: hit.name,
    companyName: hit.companyName,
    role: hit.role
  };
};

/** Riders linked to this gestoría (managerId === manager.id). */
export const listLinkedClients = (users: User[], managerId: string): User[] => {
  if (!managerId) return [];
  return users.filter(
    (user) => user.role === UserRole.RIDER && user.managerId === managerId
  );
};

/** Fail-closed client access check for gestoría-facing records. */
export const canAccessClientRecord = (
  actor: Pick<User, 'id' | 'role'> | undefined,
  client: Pick<User, 'id' | 'role' | 'managerId'> | undefined
): boolean => {
  if (!actor || !client || client.role !== UserRole.RIDER) return false;
  if (actor.role === UserRole.ADMIN) return true;
  return actor.role === UserRole.MANAGER && client.managerId === actor.id;
};

/**
 * Validate a rider's attempt to link by gestoría email.
 * When the candidate is not in `users`, ok=true still — the RPC must resolve it.
 * When the candidate IS present, role must be manager/admin.
 */
export const validateRiderLinkByEmail = (
  currentUser: Pick<User, 'id' | 'email' | 'role' | 'managerId'>,
  rawEmail: string,
  users: User[] = []
): LinkValidation => {
  const email = normalizeGestoriaEmail(rawEmail);
  if (!email) {
    return {
      ok: false,
      code: 'empty_email',
      message: 'Escribe el correo de tu gestoría.'
    };
  }
  if (!isPlausibleEmail(email)) {
    return {
      ok: false,
      code: 'invalid_email',
      message: 'El correo de la gestoría no tiene un formato válido.'
    };
  }
  if (normalizeGestoriaEmail(currentUser.email) === email) {
    return {
      ok: false,
      code: 'self_link',
      message: 'No puedes vincularte a tu propio correo.'
    };
  }

  const candidate = findManagerCandidateByEmail(users, email);
  if (candidate) {
    if (candidate.id === currentUser.id) {
      return {
        ok: false,
        code: 'self_link',
        message: 'No puedes vincularte a tu propio correo.'
      };
    }
    if (!isManagerLikeRole(candidate.role)) {
      return {
        ok: false,
        code: 'not_manager',
        message:
          'Ese correo pertenece a un autónomo, no a una gestoría. Solo puedes vincular cuentas de gestoría.'
      };
    }
    if (currentUser.managerId && currentUser.managerId === candidate.id) {
      return {
        ok: false,
        code: 'already_linked_same',
        message: 'Ya estás vinculado a esta gestoría.'
      };
    }
    return { ok: true, email, candidate };
  }

  return { ok: true, email };
};

/** Map Supabase / RPC errors to Spanish UI copy. Never leaks stack traces. */
export const friendlyLinkError = (raw: unknown): string => {
  const text = String((raw as { message?: string })?.message || raw || '').toLowerCase();

  if (!text || text === 'undefined' || text === 'null') {
    return 'No se pudo vincular la gestoría. Inténtalo de nuevo.';
  }
  if (
    text.includes('manager not found')
    || text.includes('gestoría no encontrada')
    || text.includes('no manager')
  ) {
    return 'No existe una gestoría con ese correo.';
  }
  if (text.includes('not a manager') || text.includes('not_manager')) {
    return 'Ese correo no corresponde a una gestoría. Solo puedes vincular cuentas de gestoría o administración.';
  }
  if (text.includes('cannot link to yourself') || text.includes('yourself')) {
    return 'No puedes vincularte a tu propio correo.';
  }
  if (text.includes('only riders') || text.includes('riders may') || text.includes('not a rider')) {
    return 'Solo los autónomos pueden vincular una gestoría desde este formulario.';
  }
  if (
    text.includes('could not find the function')
    || (text.includes('function') && text.includes('does not exist'))
  ) {
    return 'La vinculación remota aún no está disponible en este proyecto (falta el RPC link_manager_by_email). Avisa a Lewis para aplicar la migración.';
  }
  if (
    text.includes('permission')
    || text.includes('row-level')
    || text.includes('rls')
    || text.includes('42501')
  ) {
    return 'No tienes permiso para actualizar manager_id directamente. La vinculación debe hacerse por el RPC seguro.';
  }
  if (text.includes('sesión') || text.includes('jwt')) {
    return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
  }

  const original = String((raw as { message?: string })?.message || raw || '').trim();
  if (original.length > 0 && original.length < 180 && !original.toLowerCase().includes('stack')) {
    return original;
  }
  return 'No se pudo vincular la gestoría. Inténtalo de nuevo.';
};

export const friendlyUnlinkError = (raw: unknown): string => {
  const text = String((raw as { message?: string })?.message || raw || '').toLowerCase();
  if (
    text.includes('could not find the function')
    || (text.includes('function') && text.includes('does not exist'))
  ) {
    return 'Desvincular aún no está disponible en este proyecto (falta el RPC unlink_own_manager).';
  }
  if (text.includes('sesión') || text.includes('jwt')) {
    return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
  }
  const original = String((raw as { message?: string })?.message || raw || '').trim();
  if (original.length > 0 && original.length < 180) return original;
  return 'No se pudo desvincular la gestoría.';
};
