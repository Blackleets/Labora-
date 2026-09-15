
import { BankConnection } from '../types';
import { MockBankAdapter } from './bankAdapter';

const STORAGE_KEY = 'labora_bank_connections';

// Simulación de una Base de Datos y Servicio Seguro
export const bankApi = {
  
  // GET /bank-connect/{userId}
  getUserConnections: async (userId: string): Promise<BankConnection[]> => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: BankConnection[] = raw ? JSON.parse(raw) : [];
    return all.filter(c => c.user_id === userId);
  },

  // POST /bank-connect/start (Inicia el proceso)
  initiateConnection: async (userId: string, providerId: string) => {
    // Aquí seleccionaríamos el adaptador correcto según el providerId
    // Para la demo, usamos siempre el MockAdapter
    const adapter = new MockBankAdapter(providerId, providerId.toUpperCase());
    return adapter.initConnection(userId);
  },

  // POST /bank-connect/complete (Finaliza y guarda)
  finalizeConnection: async (userId: string, providerId: string, authParams: any) => {
    const adapter = new MockBankAdapter(providerId, providerId.toUpperCase());
    const { accessToken, connectionId } = await adapter.completeConnection(authParams);
    
    // Obtener cuentas iniciales
    const accounts = await adapter.getAccounts(connectionId);

    // Guardar conexión en "DB"
    const newConn: BankConnection = {
      id: connectionId,
      user_id: userId,
      provider_id: providerId,
      status: 'active',
      last_sync: new Date().toISOString(),
      accounts: accounts
    };

    const raw = localStorage.getItem(STORAGE_KEY);
    const all: BankConnection[] = raw ? JSON.parse(raw) : [];
    // Eliminar conexiones previas del mismo proveedor para evitar duplicados en demo
    const filtered = all.filter(c => !(c.user_id === userId && c.provider_id === providerId));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, newConn]));
    
    return newConn;
  },

  // DELETE /bank-connect/{connectionId}
  removeConnection: async (connectionId: string) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: BankConnection[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(c => c.id !== connectionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};
