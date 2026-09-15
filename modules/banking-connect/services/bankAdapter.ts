
import { BankProviderAdapter, BankAccount } from '../types';

/**
 * Mock Adapter que simula el comportamiento de Plaid, TrueLayer o Nordigen.
 * Usa latencia simulada y devuelve datos ficticios.
 */
export class MockBankAdapter implements BankProviderAdapter {
  private providerId: string;
  private providerName: string;

  constructor(providerId: string = 'mock_provider_generic', providerName: string = 'Banco Simulado') {
    this.providerId = providerId;
    this.providerName = providerName;
  }

  getProviderId(): string {
    return this.providerId;
  }

  // Paso 1: Generar URL de autorización (en un caso real, redirige al banco)
  async initConnection(userId: string): Promise<{ authUrl: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        // En un caso real, esto sería https://bank.com/oauth/authorize?client_id=...
        // Aquí devolvemos una URL interna fake para que nuestro frontend simule el popup
        resolve({ authUrl: `mock-auth://${this.providerId}?user=${userId}` });
      }, 800);
    });
  }

  // Paso 2: Intercambiar el código (code) por un token de acceso
  async completeConnection(params: any): Promise<{ accessToken: string, connectionId: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // SIMULACIÓN DE ERROR: 
        // Si el parámetro 'forceError' está presente o hay mala suerte (10%), falla.
        const randomFail = Math.random() < 0.1; 
        
        if (params.error || (params.code === 'force_error') || randomFail) {
          reject(new Error('Bank refused connection or timeout occurred.'));
        } else {
          resolve({
            accessToken: `mk_access_token_${Math.random().toString(36).substr(2)}`,
            connectionId: `conn_${Date.now()}`
          });
        }
      }, 1500);
    });
  }

  // Paso 3: Obtener cuentas usando el token (connectionId mapea al token en backend)
  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Generar cuentas aleatorias
        const accounts: BankAccount[] = [
          {
            id: `acc_${Math.random().toString(36).substr(2, 5)}`,
            provider_id: this.providerId,
            name: `${this.providerName} Cuenta Principal`,
            account_number_masked: `**** ${Math.floor(1000 + Math.random() * 9000)}`,
            balance: Math.floor(Math.random() * 5000) + 150,
            currency: 'EUR',
            type: 'checking',
            last_updated: new Date().toISOString()
          },
          {
            id: `sav_${Math.random().toString(36).substr(2, 5)}`,
            provider_id: this.providerId,
            name: `${this.providerName} Ahorro Impuestos`,
            account_number_masked: `**** ${Math.floor(1000 + Math.random() * 9000)}`,
            balance: Math.floor(Math.random() * 2000),
            currency: 'EUR',
            type: 'savings',
            last_updated: new Date().toISOString()
          }
        ];
        resolve(accounts);
      }, 800);
    });
  }

  async getBalance(accountId: string): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
         resolve(Math.floor(Math.random() * 5000));
      }, 300);
    });
  }

  async createTransfer(params: { fromAccountId: string; amount: number; currency: string; description?: string }): Promise<{ transactionId: string; status: 'pending' | 'completed' }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed'
        });
      }, 1500); // Latencia de transferencia
    });
  }
}

// Registro de proveedores soportados (Mockeados)
export const SUPPORTED_PROVIDERS = [
  { id: 'bbva', name: 'BBVA', domain: 'bbva.es' },
  { id: 'santander', name: 'Banco Santander', domain: 'santander.com' },
  { id: 'revolut', name: 'Revolut', domain: 'revolut.com' },
  { id: 'wise', name: 'Wise', domain: 'wise.com' },
  { id: 'n26', name: 'N26', domain: 'n26.com' },
  { id: 'caixa', name: 'CaixaBank', domain: 'caixabank.es' }
];
