import { User } from '../types';

const PREFIX = 'labora_identity_image:';

const keyForEmail = (email: string) => `${PREFIX}${email.trim().toLowerCase()}`;

export const identityImageStore = {
  getByEmail(email?: string): string | undefined {
    if (!email) return undefined;
    try {
      return localStorage.getItem(keyForEmail(email)) || undefined;
    } catch {
      return undefined;
    }
  },

  getForUser(user?: User | null): string | undefined {
    if (!user) return undefined;
    return user.photoUrl || identityImageStore.getByEmail(user.email);
  },

  setForEmail(email: string, value?: string): void {
    if (!email) return;
    try {
      const key = keyForEmail(email);
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch (error) {
      console.warn('No se pudo guardar la imagen de identidad.', error);
    }
  }
};
