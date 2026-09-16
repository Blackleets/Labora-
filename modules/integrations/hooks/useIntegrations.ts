import { useMemo } from 'react';
import { GLOBAL_INTEGRATION_CATALOG, LaboraIntegration } from '../data/catalog';
import { IntegrationCategory } from '../../../types';

interface UseIntegrationsProps {
  countryCode?: string;
  category?: IntegrationCategory | 'all';
  limit?: number;
}

export const useIntegrations = ({ countryCode, category = 'all', limit }: UseIntegrationsProps = {}) => {
  const integrations = useMemo<LaboraIntegration[]>(() => {
    let result = GLOBAL_INTEGRATION_CATALOG.filter((item) => item.status !== 'deprecated');

    if (countryCode) {
      result = result.filter((item) =>
        item.supported_countries.length === 0 || item.supported_countries.includes(countryCode),
      );
    }

    if (category !== 'all') result = result.filter((item) => item.category === category);

    result = [...result].sort((a, b) => b.ranking - a.ranking);
    if (limit) result = result.slice(0, limit);
    return result;
  }, [countryCode, category, limit]);

  const getByCategory = (cat: IntegrationCategory) => integrations.filter((item) => item.category === cat);

  return { integrations, getByCategory, total: integrations.length };
};
