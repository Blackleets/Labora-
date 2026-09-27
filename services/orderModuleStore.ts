/** Estado compartido del módulo «Registro de pedidos» (Ajustes, menú, Inicio). */
import { create } from 'zustand';
import { getOrderModuleSettings, saveOrderModuleSettings, type OrderModuleSettings } from './orderLogRepository';

interface OrderModuleState extends OrderModuleSettings {
  loadedFor: string | null;
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  save: (userId: string, next: OrderModuleSettings) => Promise<void>;
  reset: () => void;
}

export const useOrderModuleStore = create<OrderModuleState>((set, get) => ({
  ordersEnabled: false,
  dailyGoal: null,
  loadedFor: null,
  loading: false,
  error: null,
  load: async (userId) => {
    if (get().loadedFor === userId || get().loading) return;
    set({ loading: true, error: null });
    try {
      const settings = await getOrderModuleSettings();
      set({ ...settings, loadedFor: userId, loading: false });
    } catch (error) {
      // Fail-closed: si no se puede leer, el módulo queda oculto.
      set({ ordersEnabled: false, dailyGoal: null, loadedFor: userId, loading: false, error: error instanceof Error ? error.message : 'No se pudo leer la configuración.' });
    }
  },
  save: async (userId, next) => {
    const saved = await saveOrderModuleSettings(next);
    set({ ...saved, loadedFor: userId, error: null });
  },
  reset: () => set({ ordersEnabled: false, dailyGoal: null, loadedFor: null, loading: false, error: null })
}));
