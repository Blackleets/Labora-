import { BankAccount } from '../types';

/**
 * Open Banking adapter surface.
 *
 * Labora+ does not have a regulated PSD2 provider wired.
 * This module intentionally refuses every connection attempt and never
 * invents tokens, balances, accounts or transfers.
 */

export class OpenBankingUnavailableError extends Error {
  constructor(message = 'Open Banking todavía no está habilitado en Labora+.') {
    super(message);
    this.name = 'OpenBankingUnavailableError';
  }
}

export interface BankAdapter {
  initConnection(userId: string): Promise<{ authUrl: string; state: string }>;
  completeConnection(params: Record<string, string>): Promise<{ accessToken: string; connectionId: string }>;
  getAccounts(connectionId: string): Promise<BankAccount[]>;
  getBalance(accountId: string): Promise<number>;
}

/** Unavailable adapter. Name `MockBankAdapter` kept for import compatibility — never invents bank data. */
export class MockBankAdapter implements BankAdapter {
  constructor(
    private readonly providerId: string,
    private readonly providerName: string
  ) {}

  async initConnection(_userId: string): Promise<{ authUrl: string; state: string }> {
    throw new OpenBankingUnavailableError(
      `Conexión bancaria no disponible (${this.providerName}). Falta un proveedor Open Banking regulado.`
    );
  }

  async completeConnection(_params: Record<string, string>): Promise<{ accessToken: string; connectionId: string }> {
    throw new OpenBankingUnavailableError(
      `No se puede completar una conexión bancaria ficticia (${this.providerId}).`
    );
  }

  async getAccounts(_connectionId: string): Promise<BankAccount[]> {
    throw new OpenBankingUnavailableError('No hay cuentas bancarias reales conectadas.');
  }

  async getBalance(_accountId: string): Promise<number> {
    throw new OpenBankingUnavailableError('No hay saldos bancarios reales disponibles.');
  }
}

/** Supported providers will be listed only after a real PSD2 integration exists. */
export const SUPPORTED_PROVIDERS: Array<{ id: string; name: string; domain: string }> = [];
