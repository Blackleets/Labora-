/**
 * Puente con el plugin nativo «LaboraBubble» (solo app Android / Capacitor).
 * En la web no existe: ninguna web puede dibujar encima de otras apps.
 */
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface BubbleStatus {
  available: boolean;
  overlayGranted: boolean;
  running: boolean;
  notificationsGranted: boolean;
  /** true solo en el flavour «labs» (fuera de Play). En «play» no existe el lector de notificaciones. */
  notificationAssistSupported: boolean;
  notificationAssistEnabled: boolean;
  glovoAssistEnabled: boolean;
  notificationAccessGranted: boolean;
  queued: number;
  inactivityMinutes: number;
}

export interface BubbleSyncResult {
  uploaded: number;
  pending: number;
  dropped: number;
  needsSession: boolean;
}

export interface BubbleSessionPayload {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  userId: string;
  expiresAtMs: number;
}

interface LaboraBubblePlugin {
  getStatus(): Promise<BubbleStatus>;
  openOverlaySettings(): Promise<void>;
  openNotificationAccessSettings(): Promise<void>;
  setSession(payload: BubbleSessionPayload): Promise<void>;
  clearSession(): Promise<void>;
  flushQueue(): Promise<BubbleSyncResult>;
  start(options: { platforms: string[] }): Promise<void>;
  stop(): Promise<void>;
  setNotificationAssist(options: { enabled: boolean }): Promise<void>;
  setGlovoAssist(options: { enabled: boolean }): Promise<void>;
  addListener(event: 'ordersSynced', handler: (result: BubbleSyncResult) => void): Promise<PluginListenerHandle>;
}

export const LaboraBubble = registerPlugin<LaboraBubblePlugin>('LaboraBubble');

/** Evento de ventana para que «Pedidos» recargue cuando la burbuja sube pedidos. */
export const ORDERS_SYNCED_EVENT = 'labora:orders-synced';

export const isBubbleSupported = (): boolean => {
  try {
    return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LaboraBubble');
  } catch {
    return false;
  }
};

/** Convierte la sesión de Supabase en lo que necesita el plugin. Solo access token (nunca refresh token). */
export const toBubbleSession = (
  session: { access_token?: string | null; expires_at?: number | null; user?: { id?: string | null } | null } | null | undefined,
  supabaseUrl: string,
  anonKey: string
): BubbleSessionPayload | null => {
  if (!session?.access_token || !session.user?.id || !session.expires_at) return null;
  if (!supabaseUrl.startsWith('https://')) return null;
  return { supabaseUrl, anonKey, accessToken: session.access_token, userId: session.user.id, expiresAtMs: session.expires_at * 1000 };
};

const autoStartKey = (userId: string) => `labora_bubble_autostart:${userId}`;
export const getBubbleAutoStart = (userId: string): boolean => {
  try { return localStorage.getItem(autoStartKey(userId)) === 'true'; } catch { return false; }
};
export const setBubbleAutoStart = (userId: string, value: boolean) => {
  try { localStorage.setItem(autoStartKey(userId), value ? 'true' : 'false'); } catch { /* sin almacenamiento */ }
};

/**
 * La burbuja va atada a la jornada: «Terminar jornada» SIEMPRE la para; «Iniciar jornada» la abre si el rider
 * lo pidió y hay permiso. Devuelve un aviso o null.
 */
export const bubbleOnShiftChange = async (userId: string, started: boolean, platforms: string[]): Promise<string | null> => {
  if (!userId || !isBubbleSupported()) return null;
  try {
    if (!started) { await LaboraBubble.stop(); return null; }
    if (!getBubbleAutoStart(userId)) return null;
    const status = await LaboraBubble.getStatus();
    if (!status.overlayGranted) return 'Para abrir la burbuja con la jornada, activa «Mostrar sobre otras apps» en Pedidos → Burbuja flotante.';
    await LaboraBubble.start({ platforms });
    return null;
  } catch (error) {
    return error instanceof Error ? `No se pudo abrir la burbuja: ${error.message}` : 'No se pudo abrir la burbuja.';
  }
};

/** Lista blanca (debe coincidir con android/app/src/labs/.../PlatformAllowlist.java). Nombres solo descriptivos. */
export const NOTIFICATION_ALLOWLIST: { packageName: string; label: string; group: 'uber' | 'glovo' }[] = [
  { packageName: 'com.ubercab.driver', label: 'Uber Driver (app de repartidores de Uber Eats)', group: 'uber' },
  { packageName: 'com.logistics.rider.glovo', label: 'Glovo Rider for Couriers', group: 'glovo' },
  { packageName: 'com.glovoapp.courier', label: 'Glovo Couriers (app anterior)', group: 'glovo' }
];

const consentKey = (userId: string) => `labora_notif_assist_consent_at:${userId}`;
export const recordNotificationConsent = (userId: string, at: Date | null) => {
  try {
    if (at) localStorage.setItem(consentKey(userId), at.toISOString());
    else localStorage.removeItem(consentKey(userId));
  } catch { /* sin almacenamiento */ }
};
export const getNotificationConsent = (userId: string): string | null => {
  try { return localStorage.getItem(consentKey(userId)); } catch { return null; }
};
