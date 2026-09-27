import React, { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../services/supabaseClient';
import { LaboraBubble, ORDERS_SYNCED_EVENT, isBubbleSupported, toBubbleSession } from '../../services/laboraBubble';

/**
 * Solo Android: pasa el JWT de la sesión al plugin nativo (guardado cifrado) para que la burbuja
 * escriba en delivery_orders con RLS. Al cerrar sesión lo borra y detiene la burbuja.
 */
export const BubbleSessionBridge: React.FC = () => {
  useEffect(() => {
    if (!isBubbleSupported()) return;
    let cancelled = false;
    const push = async () => {
      const { data } = await supabase.auth.getSession();
      const payload = toBubbleSession(data.session, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      if (cancelled) return;
      if (payload) await LaboraBubble.setSession(payload).catch(() => undefined);
      const result = await LaboraBubble.flushQueue().catch(() => null);
      if (result && result.uploaded > 0) window.dispatchEvent(new CustomEvent(ORDERS_SYNCED_EVENT, { detail: result }));
    };
    void push();
    const { data: auth } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { void LaboraBubble.clearSession().catch(() => undefined); return; }
      const payload = toBubbleSession(session, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      if (payload) void LaboraBubble.setSession(payload).catch(() => undefined);
    });
    const handles: { remove: () => Promise<void> }[] = [];
    void LaboraBubble.addListener('ordersSynced', (result) => {
      window.dispatchEvent(new CustomEvent(ORDERS_SYNCED_EVENT, { detail: result }));
    }).then((handle) => handles.push(handle));
    void CapApp.addListener('resume', () => { void push(); }).then((handle) => handles.push(handle));
    return () => {
      cancelled = true;
      auth.subscription.unsubscribe();
      handles.forEach((handle) => void handle.remove());
    };
  }, []);
  return null;
};
