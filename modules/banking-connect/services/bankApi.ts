import { BankConnection } from '../types';
import { OpenBankingUnavailableError } from './bankAdapter';

/**
 * Banking API façade.
 *
 * Previously this module simulated connections via localStorage and a mock adapter.
 * That path is removed: every mutating/read connection call fails closed until a
 * regulated Open Banking provider is integrated server-side.
 */

const unavailable = (): never => {
  throw new OpenBankingUnavailableError(
    'Labora+ no simula conexiones bancarias. La banca permanecerá bloqueada hasta un proveedor PSD2 real.'
  );
};

export const bankApi = {
  getUserConnections: async (_userId: string): Promise<BankConnection[]> => {
    // Honest empty set — never invent stored mock connections.
    return [];
  },

  initiateConnection: async (_userId: string, _providerId: string) => unavailable(),

  finalizeConnection: async (_userId: string, _providerId: string, _authParams: unknown) => unavailable(),

  removeConnection: async (_connectionId: string) => unavailable()
};
