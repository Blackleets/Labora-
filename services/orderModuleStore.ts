/** Estado compartido del módulo «Registro de pedidos» (Ajustes, menú, Inicio). */
import { create } from 'zustand';
import { getOrderModuleSettings, saveOrderModuleSettings, type OrderModuleSettings } from './orderLogRepository';

interface OrderModuleState extends OrderModuleSettings {
  loadedFor: string | null;
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  /** Guarda un cambio parcial fusionándolo con el estado actual. */
  save: (userId: string, next: Partial<OrderModuleSettings>) => Promise<void>;
  reset: () => void;
}

export const useOrderModuleStore = create<OrderModuleState>((set, get) => ({
  ordersEnabled: false,
  dailyGoal: null,
  weeklyGoal: null,
  vehicleCostPerKm: null,
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
      set({ ordersEnabled: false, dailyGoal: null, weeklyGoal: null, vehicleCostPerKm: null, loadedFor: userId, loading: false, error: error instanceof Error ? error.message : 'No se pudo leer la configuración.' });
    }
  },
  save: async (userId, next) => {
    const current = get();
    const saved = await saveOrderModuleSettings({
      ordersEnabled: next.ordersEnabled ?? current.ordersEnabled,
      dailyGoal: next.dailyGoal !== undefined ? next.dailyGoal : current.dailyGoal,
      weeklyGoal: next.weeklyGoal !== undefined ? next.weeklyGoal : current.weeklyGoal,
      vehicleCostPerKm: next.vehicleCostPerKm !== undefined ? next.vehicleCostPerKm : current.vehicleCostPerKm
    });
    set({ ...saved, loadedFor: userId, error: null });
  },
  reset: () => set({ ordersEnabled: false, dailyGoal: null, weeklyGoal: null, vehicleCostPerKm: null, loadedFor: null, loading: false, error: null })
}));
