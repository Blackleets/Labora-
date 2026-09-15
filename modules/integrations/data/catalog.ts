
import { IntegrationDef } from '../../../types';

export const GLOBAL_INTEGRATION_CATALOG: IntegrationDef[] = [
  // --- DELIVERY ---
  {
    id: 'glovo',
    name: 'Glovo',
    category: 'delivery',
    domain: 'glovoapp.com',
    supported_countries: ['ES', 'IT', 'PT', 'PL', 'RO'],
    status: 'active',
    ranking: 95,
    description: 'Sincronización de pedidos y pagos en tiempo real.'
  },
  {
    id: 'uber_eats',
    name: 'Uber Eats',
    category: 'delivery',
    domain: 'ubereats.com',
    supported_countries: [], // Global
    status: 'active',
    ranking: 98,
    description: 'Gestión automática de retenciones fiscales.'
  },
  {
    id: 'just_eat',
    name: 'Just Eat',
    category: 'delivery',
    domain: 'just-eat.com',
    supported_countries: ['ES', 'UK', 'IT', 'FR'],
    status: 'active',
    ranking: 90
  },
  {
    id: 'stuart',
    name: 'Stuart',
    category: 'delivery',
    domain: 'stuart.com',
    supported_countries: ['ES', 'FR', 'UK'],
    status: 'active',
    ranking: 85
  },
  {
    id: 'deliveroo',
    name: 'Deliveroo',
    category: 'delivery',
    domain: 'deliveroo.co.uk',
    supported_countries: ['UK', 'FR', 'IT', 'AE'],
    status: 'active',
    ranking: 88
  },
  {
    id: 'rappi',
    name: 'Rappi',
    category: 'delivery',
    domain: 'rappi.com',
    supported_countries: ['MX', 'CO', 'AR', 'BR', 'CL', 'PE'],
    status: 'active',
    ranking: 96
  },
  {
    id: 'didi_food',
    name: 'DiDi Food',
    category: 'delivery',
    domain: 'didi-food.com',
    supported_countries: ['MX', 'CO', 'BR'],
    status: 'active',
    ranking: 92
  },
  {
    id: 'amazon_flex',
    name: 'Amazon Flex',
    category: 'delivery',
    domain: 'amazon.com',
    supported_countries: ['ES', 'US', 'UK', 'DE'],
    status: 'active',
    ranking: 94,
    description: 'Auto-facturación para repartidores autónomos con furgoneta o coche.'
  },
  {
    id: 'catcher',
    name: 'Catcher',
    category: 'delivery',
    domain: 'catcher.eu',
    supported_countries: ['ES'],
    status: 'active',
    ranking: 86,
    description: 'Marketplace de pedidos para riders autónomos en España.'
  },
  {
    id: 'paack',
    name: 'Paack',
    category: 'delivery',
    domain: 'paack.co',
    supported_countries: ['ES', 'FR', 'UK', 'PT'],
    status: 'active',
    ranking: 87,
    description: 'Paquetería urbana programada y de última milla.'
  },
  {
    id: 'wolt',
    name: 'Wolt',
    category: 'delivery',
    domain: 'wolt.com',
    supported_countries: ['DE', 'PL', 'SE', 'NO', 'FI', 'JP'],
    status: 'active',
    ranking: 89,
    description: 'Plataforma líder en Europa Central y Nórdica.'
  },
  {
    id: 'bolt_food',
    name: 'Bolt Food',
    category: 'delivery',
    domain: 'bolt.eu',
    supported_countries: ['ES', 'PT', 'PL', 'RO', 'EE', 'LV', 'LT'],
    status: 'active',
    ranking: 88,
    description: 'Entregas locales de restaurantes y supermercados.'
  },

  // --- MOBILITY ---
  {
    id: 'uber',
    name: 'Uber Driver',
    category: 'mobility',
    domain: 'uber.com',
    supported_countries: [],
    status: 'active',
    ranking: 99
  },
  {
    id: 'cabify',
    name: 'Cabify',
    category: 'mobility',
    domain: 'cabify.com',
    supported_countries: ['ES', 'MX', 'AR', 'CL', 'CO', 'PE'],
    status: 'active',
    ranking: 94
  },
  {
    id: 'bolt',
    name: 'Bolt',
    category: 'mobility',
    domain: 'bolt.eu',
    supported_countries: ['ES', 'PT', 'PL', 'RO', 'GB'],
    status: 'active',
    ranking: 89
  },
  {
    id: 'lyft',
    name: 'Lyft',
    category: 'mobility',
    domain: 'lyft.com',
    supported_countries: ['US', 'CA'],
    status: 'active',
    ranking: 93
  },
  {
    id: 'didi',
    name: 'DiDi Rider',
    category: 'mobility',
    domain: 'didiglobal.com',
    supported_countries: ['MX', 'BR', 'AU'],
    status: 'active',
    ranking: 95
  },
  {
    id: 'freenow',
    name: 'FREENOW',
    category: 'mobility',
    domain: 'free-now.com',
    supported_countries: ['ES', 'DE', 'UK', 'IT', 'FR'],
    status: 'active',
    ranking: 87
  },

  // --- BANKING & FINTECH ---
  {
    id: 'revolut',
    name: 'Revolut Business',
    category: 'banking',
    domain: 'revolut.com',
    supported_countries: [],
    status: 'active',
    ranking: 99
  },
  {
    id: 'wise',
    name: 'Wise',
    category: 'banking',
    domain: 'wise.com',
    supported_countries: [],
    status: 'active',
    ranking: 97
  },
  {
    id: 'n26',
    name: 'N26',
    category: 'banking',
    domain: 'n26.com',
    supported_countries: ['ES', 'DE', 'FR', 'IT'],
    status: 'active',
    ranking: 90
  },
  {
    id: 'qonto',
    name: 'Qonto',
    category: 'banking',
    domain: 'qonto.com',
    supported_countries: ['ES', 'FR', 'IT', 'DE'],
    status: 'active',
    ranking: 88
  },
  {
    id: 'bbva_es',
    name: 'BBVA España',
    category: 'banking',
    domain: 'bbva.es',
    supported_countries: ['ES'],
    status: 'active',
    ranking: 95
  },
  {
    id: 'santander_es',
    name: 'Santander España',
    category: 'banking',
    domain: 'bancosantander.es',
    supported_countries: ['ES'],
    status: 'active',
    ranking: 92
  },
  {
    id: 'bbva_mx',
    name: 'BBVA México',
    category: 'banking',
    domain: 'bbva.mx',
    supported_countries: ['MX'],
    status: 'active',
    ranking: 96
  },
  {
    id: 'banorte',
    name: 'Banorte',
    category: 'banking',
    domain: 'banorte.com',
    supported_countries: ['MX'],
    status: 'active',
    ranking: 90
  },
  {
    id: 'chase',
    name: 'Chase',
    category: 'banking',
    domain: 'chase.com',
    supported_countries: ['US'],
    status: 'active',
    ranking: 98
  },
  {
    id: 'wellsfargo',
    name: 'Wells Fargo',
    category: 'banking',
    domain: 'wellsfargo.com',
    supported_countries: ['US'],
    status: 'active',
    ranking: 94
  },

  // --- PAYMENTS ---
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    domain: 'stripe.com',
    supported_countries: [],
    status: 'active',
    ranking: 99
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    domain: 'paypal.com',
    supported_countries: [],
    status: 'active',
    ranking: 95
  },
  {
    id: 'square',
    name: 'Square',
    category: 'payments',
    domain: 'squareup.com',
    supported_countries: ['US', 'CA', 'UK', 'AU', 'JP', 'ES'],
    status: 'active',
    ranking: 92
  },
  
  // --- ACCOUNTING ---
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    domain: 'quickbooks.intuit.com',
    supported_countries: ['US', 'UK', 'CA', 'AU'],
    status: 'active',
    ranking: 90
  },
  {
    id: 'holded',
    name: 'Holded',
    category: 'accounting',
    domain: 'holded.com',
    supported_countries: ['ES'],
    status: 'active',
    ranking: 85
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'accounting',
    domain: 'xero.com',
    supported_countries: ['UK', 'US', 'NZ', 'AU'],
    status: 'active',
    ranking: 88
  }
];
