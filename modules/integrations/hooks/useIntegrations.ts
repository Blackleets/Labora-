
import { useMemo } from 'react';
import { GLOBAL_INTEGRATION_CATALOG } from '../data/catalog';
import { IntegrationDef, IntegrationCategory } from '../../../types';

interface UseIntegrationsProps {
  countryCode?: string;
  category?: IntegrationCategory | 'all';
  limit?: number;
}

export const useIntegrations = ({ countryCode, category = 'all', limit }: UseIntegrationsProps = {}) => {
  
  const integrations = useMemo(() => {
    let result = GLOBAL_INTEGRATION_CATALOG.filter(item => item.status !== 'deprecated');

    // 1. Filter by Country
    if (countryCode) {
      result = result.filter(item => 
        item.supported_countries.length === 0 || // Global
        item.supported_countries.includes(countryCode)
      );
    }

    // 2. Filter by Category
    if (category !== 'all') {
      result = result.filter(item => item.category === category);
    }

    // 3. Sort by Ranking (Descending)
    result.sort((a, b) => b.ranking - a.ranking);

    // 4. Limit
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [countryCode, category, limit]);

  const getByCategory = (cat: IntegrationCategory) => {
    return integrations.filter(i => i.category === cat);
  };

  return {
    integrations,
    getByCategory,
    total: integrations.length
  };
};
