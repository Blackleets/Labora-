import { IntegrationDef } from '../../../types';

export const GLOBAL_INTEGRATION_CATALOG: IntegrationDef[] = [
  { id: 'glovo', name: 'Glovo', category: 'delivery', domain: 'glovoapp.com', supported_countries: ['ES', 'IT', 'PT', 'PL', 'RO'], status: 'active', ranking: 95, description: 'Plataforma de reparto.' },
  { id: 'uber_eats', name: 'Uber Eats', category: 'delivery', domain: 'ubereats.com', supported_countries: [], status: 'active', ranking: 98, description: 'Plataforma de reparto.' },
  { id: 'just_eat', name: 'Just Eat', category: 'delivery', domain: 'just-eat.com', supported_countries: ['ES', 'UK', 'IT', 'FR'], status: 'active', ranking: 90, description: 'Plataforma de reparto.' },
  { id: 'stuart', name: 'Stuart', category: 'delivery', domain: 'stuart.com', supported_countries: ['ES', 'FR', 'UK'], status: 'active', ranking: 85, description: 'Servicio de logística y reparto.' },
  { id: 'deliveroo', name: 'Deliveroo', category: 'delivery', domain: 'deliveroo.co.uk', supported_countries: ['UK', 'FR', 'IT', 'AE'], status: 'active', ranking: 88, description: 'Plataforma de reparto.' },
  { id: 'rappi', name: 'Rappi', category: 'delivery', domain: 'rappi.com', supported_countries: ['MX', 'CO', 'AR', 'BR', 'CL', 'PE'], status: 'active', ranking: 96, description: 'Plataforma de reparto.' },
  { id: 'didi_food', name: 'DiDi Food', category: 'delivery', domain: 'didi-food.com', supported_countries: ['MX', 'CO', 'BR'], status: 'active', ranking: 92, description: 'Plataforma de reparto.' },
  { id: 'amazon_flex', name: 'Amazon Flex', category: 'delivery', domain: 'amazon.com', supported_countries: ['ES', 'US', 'UK', 'DE'], status: 'active', ranking: 94, description: 'Servicio de reparto de última milla.' },
  { id: 'catcher', name: 'Catcher', category: 'delivery', domain: 'catcher.eu', supported_countries: ['ES'], status: 'active', ranking: 86, description: 'Servicio relacionado con reparto.' },
  { id: 'paack', name: 'Paack', category: 'delivery', domain: 'paack.co', supported_countries: ['ES', 'FR', 'UK', 'PT'], status: 'active', ranking: 87, description: 'Servicio de logística y última milla.' },
  { id: 'wolt', name: 'Wolt', category: 'delivery', domain: 'wolt.com', supported_countries: ['DE', 'PL', 'SE', 'NO', 'FI', 'JP'], status: 'active', ranking: 89, description: 'Plataforma de reparto.' },
  { id: 'bolt_food', name: 'Bolt Food', category: 'delivery', domain: 'bolt.eu', supported_countries: ['ES', 'PT', 'PL', 'RO', 'EE', 'LV', 'LT'], status: 'active', ranking: 88, description: 'Plataforma de reparto.' },

  { id: 'uber', name: 'Uber Driver', category: 'mobility', domain: 'uber.com', supported_countries: [], status: 'active', ranking: 99, description: 'Plataforma de movilidad.' },
  { id: 'cabify', name: 'Cabify', category: 'mobility', domain: 'cabify.com', supported_countries: ['ES', 'MX', 'AR', 'CL', 'CO', 'PE'], status: 'active', ranking: 94, description: 'Plataforma de movilidad.' },
  { id: 'bolt', name: 'Bolt', category: 'mobility', domain: 'bolt.eu', supported_countries: ['ES', 'PT', 'PL', 'RO', 'GB'], status: 'active', ranking: 89, description: 'Plataforma de movilidad.' },
  { id: 'lyft', name: 'Lyft', category: 'mobility', domain: 'lyft.com', supported_countries: ['US', 'CA'], status: 'active', ranking: 93, description: 'Plataforma de movilidad.' },
  { id: 'didi', name: 'DiDi Rider', category: 'mobility', domain: 'didiglobal.com', supported_countries: ['MX', 'BR', 'AU'], status: 'active', ranking: 95, description: 'Plataforma de movilidad.' },
  { id: 'freenow', name: 'FREENOW', category: 'mobility', domain: 'free-now.com', supported_countries: ['ES', 'DE', 'UK', 'IT', 'FR'], status: 'active', ranking: 87, description: 'Plataforma de movilidad.' },

  { id: 'revolut', name: 'Revolut Business', category: 'banking', domain: 'revolut.com', supported_countries: [], status: 'active', ranking: 99, description: 'Entidad/servicio financiero disponible en el catálogo.' },
  { id: 'wise', name: 'Wise', category: 'banking', domain: 'wise.com', supported_countries: [], status: 'active', ranking: 97, description: 'Entidad/servicio financiero disponible en el catálogo.' },
  { id: 'n26', name: 'N26', category: 'banking', domain: 'n26.com', supported_countries: ['ES', 'DE', 'FR', 'IT'], status: 'active', ranking: 90, description: 'Entidad financiera disponible en el catálogo.' },
  { id: 'qonto', name: 'Qonto', category: 'banking', domain: 'qonto.com', supported_countries: ['ES', 'FR', 'IT', 'DE'], status: 'active', ranking: 88, description: 'Entidad/servicio financiero disponible en el catálogo.' },
  { id: 'bbva_es', name: 'BBVA España', category: 'banking', domain: 'bbva.es', supported_countries: ['ES'], status: 'active', ranking: 95, description: 'Entidad financiera disponible en el catálogo.' },
  { id: 'santander_es', name: 'Santander España', category: 'banking', domain: 'bancosantander.es', supported_countries: ['ES'], status: 'active', ranking: 92, description: 'Entidad financiera disponible en el catálogo.' },
  { id: 'bbva_mx', name: 'BBVA México', category: 'banking', domain: 'bbva.mx', supported_countries: ['MX'], status: 'active', ranking: 96, description: 'Entidad financiera disponible en el catálogo.' },
  { id: 'banorte', name: 'Banorte', category: 'banking', domain: 'banorte.com', supported_countries: ['MX'], status: 'active', ranking: 90, description: 'Entidad financiera disponible en el catálogo.' },
  { id: 'chase', name: 'Chase', category: 'banking', domain: 'chase.com', supported_countries: ['US'], status: 'active', ranking: 98, description: 'Entidad financiera disponible en el catálogo.' },
  { id: 'wellsfargo', name: 'Wells Fargo', category: 'banking', domain: 'wellsfargo.com', supported_countries: ['US'], status: 'active', ranking: 94, description: 'Entidad financiera disponible en el catálogo.' },

  { id: 'stripe', name: 'Stripe', category: 'payments', domain: 'stripe.com', supported_countries: [], status: 'active', ranking: 99, description: 'Servicio de pagos disponible en el catálogo.' },
  { id: 'paypal', name: 'PayPal', category: 'payments', domain: 'paypal.com', supported_countries: [], status: 'active', ranking: 95, description: 'Servicio de pagos disponible en el catálogo.' },
  { id: 'square', name: 'Square', category: 'payments', domain: 'squareup.com', supported_countries: ['US', 'CA', 'UK', 'AU', 'JP', 'ES'], status: 'active', ranking: 92, description: 'Servicio de pagos disponible en el catálogo.' },

  { id: 'quickbooks', name: 'QuickBooks', category: 'accounting', domain: 'quickbooks.intuit.com', supported_countries: ['US', 'UK', 'CA', 'AU'], status: 'active', ranking: 90, description: 'Software contable disponible en el catálogo.' },
  { id: 'holded', name: 'Holded', category: 'accounting', domain: 'holded.com', supported_countries: ['ES'], status: 'active', ranking: 85, description: 'Software de gestión disponible en el catálogo.' },
  { id: 'xero', name: 'Xero', category: 'accounting', domain: 'xero.com', supported_countries: ['UK', 'US', 'NZ', 'AU'], status: 'active', ranking: 88, description: 'Software contable disponible en el catálogo.' }
];
