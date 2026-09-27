import { useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useOrderModuleStore } from '../../services/orderModuleStore';
import { UserRole } from '../../types';

/**
 * Estado del módulo para el usuario actual.
 *
 * Compatibilidad: perfiles legacy con work_modes vacío conservan el comportamiento
 * anterior. En cuanto una persona configura su perfil universal, Pedidos solo está
 * disponible si declara explícitamente el modo rider.
 */
export const useOrderModule = () => {
  const { currentUser } = useData();
  const store = useOrderModuleStore();
  const workModes = currentUser?.workModes || [];
  const isRider = Boolean(
    currentUser?.role === UserRole.RIDER
    && (workModes.length === 0 || workModes.includes('rider'))
  );

  useEffect(() => {
    if (currentUser?.id && isRider) void store.load(currentUser.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isRider]);

  const ready = Boolean(currentUser && store.loadedFor === currentUser.id);
  return {
    isRider,
    ready,
    enabled: Boolean(isRider && ready && store.ordersEnabled),
    dailyGoal: store.dailyGoal,
    weeklyGoal: store.weeklyGoal,
    vehicleCostPerKm: store.vehicleCostPerKm,
    error: store.error,
    save: (next: Partial<{ ordersEnabled: boolean; dailyGoal: number | null; weeklyGoal: number | null; vehicleCostPerKm: number | null }>) =>
      currentUser ? store.save(currentUser.id, next) : Promise.resolve()
  };
};
