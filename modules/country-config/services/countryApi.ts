
import { CountryConfig, DEFAULT_SPAIN_CONFIG, DEFAULT_MEXICO_CONFIG } from '../types';

const STORAGE_KEY = 'labora_country_configs';

// Inicializar datos si no existen
const initData = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const defaults = [DEFAULT_SPAIN_CONFIG, DEFAULT_MEXICO_CONFIG];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(existing) as CountryConfig[];
};

// --- REST API SIMULATION ---

export const countryApi = {
  // GET /countries
  getAll: async (): Promise<CountryConfig[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(initData()), 300); // Simulate network latency
    });
  },

  // GET /countries/{code}
  getOne: async (code: string): Promise<CountryConfig | undefined> => {
    return new Promise((resolve) => {
      const data = initData();
      const country = data.find(c => c.country_code === code);
      setTimeout(() => resolve(country), 200);
    });
  },

  // POST /countries
  create: async (config: CountryConfig): Promise<CountryConfig> => {
    return new Promise((resolve, reject) => {
      const data = initData();
      if (data.find(c => c.country_code === config.country_code)) {
        reject(new Error("Country code already exists"));
        return;
      }
      const newData = [...data, config];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setTimeout(() => resolve(config), 400);
    });
  },

  // PUT /countries/{code}
  update: async (code: string, config: CountryConfig): Promise<CountryConfig> => {
    return new Promise((resolve, reject) => {
      const data = initData();
      const index = data.findIndex(c => c.country_code === code);
      if (index === -1) {
        reject(new Error("Country not found"));
        return;
      }
      const newData = [...data];
      newData[index] = config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setTimeout(() => resolve(config), 400);
    });
  },

  // DELETE /countries/{code}
  delete: async (code: string): Promise<void> => {
    return new Promise((resolve) => {
      const data = initData();
      const newData = data.filter(c => c.country_code !== code);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setTimeout(() => resolve(), 300);
    });
  }
};
