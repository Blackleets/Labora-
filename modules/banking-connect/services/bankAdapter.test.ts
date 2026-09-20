import { describe, expect, it } from 'vitest';
import { MockBankAdapter, OpenBankingUnavailableError, SUPPORTED_PROVIDERS } from './bankAdapter';

describe('Open Banking fail-closed', () => {
  it('exposes no live providers until a regulated PSD2 integration exists', () => {
    expect(SUPPORTED_PROVIDERS).toEqual([]);
  });

  it('refuses connection bootstrap without inventing tokens', async () => {
    const adapter = new MockBankAdapter('bbva', 'BBVA');
    await expect(adapter.initConnection('user_test')).rejects.toBeInstanceOf(OpenBankingUnavailableError);
  });

  it('refuses completeConnection without inventing access tokens', async () => {
    const adapter = new MockBankAdapter('bbva', 'BBVA');
    await expect(adapter.completeConnection({ code: 'x', state: 'y' })).rejects.toBeInstanceOf(
      OpenBankingUnavailableError
    );
  });

  it('refuses account listing without inventing balances', async () => {
    const adapter = new MockBankAdapter('bbva', 'BBVA');
    await expect(adapter.getAccounts('conn_fake')).rejects.toBeInstanceOf(OpenBankingUnavailableError);
  });

  it('refuses getBalance without inventing numbers', async () => {
    const adapter = new MockBankAdapter('santander', 'Santander');
    await expect(adapter.getBalance('acc_fake')).rejects.toBeInstanceOf(OpenBankingUnavailableError);
  });

  it('error messages stay honest in Spanish (no connected claim)', async () => {
    const adapter = new MockBankAdapter('n26', 'N26');
    await expect(adapter.initConnection('u')).rejects.toThrow(/no disponible|Open Banking/i);
  });
});
