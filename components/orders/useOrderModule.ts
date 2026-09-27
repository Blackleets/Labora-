import { useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useOrderModuleStore } from '../../services/orderModuleStore';
import { UserRole } from '../../types';

/** Estado del módulo para el usuario actual. Solo autónomos; oculto si está apagado o no se pudo leer. */
export const useOrderModule = () => {
  const { currentUser } = useData();
  const store = useOrderModuleStore();
  const isRider = currentUser?.role === UserRole.RIDER;

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
    error: store.error,
    save: (next: Partial<{ ordersEnabled: boolean; dailyGoal: number | null; weeklyGoal: number | null }>) =>
      currentUser ? store.save(currentUser.id, next) : Promise.resolve()
  };
};
