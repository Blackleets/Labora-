export interface BankAccount {
  id: string;
  provider_id: string;
  account_number_masked: string; // **** 1234
  name: string; // "Cuenta Nómina"
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'credit';
  last_updated: string;
}

export interface BankProvider {
  id: string;
  name: string;
  logo_url: string; // clearbit domain usually
  regions: string[]; // ['ES', 'UK']
  auth_type: 'oauth' | 'credentials';
}

export interface BankConnection {
  id: string;
  user_id: string;
  provider_id: string;
  status: 'active' | 'expired' | 'error';
  last_sync: string;
  accounts: BankAccount[];
}

export interface BankProviderAdapter {
  getProviderId(): string;
  initConnection(userId: string): Promise<{ authUrl: string }>;
  completeConnection(params: any): Promise<{ accessToken: string, connectionId: string }>;
  getAccounts(connectionId: string): Promise<BankAccount[]>;
  getBalance(accountId: string): Promise<number>;
  createTransfer(params: { fromAccountId: string; amount: number; currency: string; description?: string }): Promise<{ transactionId: string; status: 'pending' | 'completed' }>;
}