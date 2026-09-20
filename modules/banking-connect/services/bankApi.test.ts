import { describe, expect, it } from 'vitest';
import { bankApi } from './bankApi';
import { OpenBankingUnavailableError } from './bankAdapter';

describe('bankApi fail-closed', () => {
  it('returns empty connections — never invents a connected bank', async () => {
    await expect(bankApi.getUserConnections('user_any')).resolves.toEqual([]);
  });

  it('refuses initiateConnection without fake OAuth', async () => {
    await expect(bankApi.initiateConnection('user_any', 'bbva')).rejects.toBeInstanceOf(
      OpenBankingUnavailableError
    );
  });

  it('refuses finalizeConnection without inventing tokens', async () => {
    await expect(bankApi.finalizeConnection('user_any', 'bbva', { code: 'fake' })).rejects.toBeInstanceOf(
      OpenBankingUnavailableError
    );
  });

  it('refuses removeConnection', async () => {
    await expect(bankApi.removeConnection('conn_fake')).rejects.toBeInstanceOf(OpenBankingUnavailableError);
  });
});
