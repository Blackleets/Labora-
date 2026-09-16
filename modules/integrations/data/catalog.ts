import { IntegrationDef } from '../../../types';

export type LaboraConnectionMode = 'manual_evidence' | 'file_import' | 'api_available' | 'planned';

export interface LaboraIntegration extends IntegrationDef {
  brandIconSlug?: string;
  connectionMode: LaboraConnectionMode;
  evidenceTypes: ('payout' | 'invoice' | 'statement' | 'screenshot' | 'email')[];
  availabilityNote: string;
  sourceKind: 'platform' | 'mobility' | 'accounting';
}

/**
 * Catalog = discoverability, not a claim of an active API integration.
 * A card may be shown for a market while local/city availability still varies.
 * Only connectionMode='api_available' may ever be presented as a live connector,
 * and there are intentionally no live platform APIs enabled in this build yet.
 */
export const GLOBAL_INTEGRATION_CATALOG: LaboraIntegration[] = [
  {
    id: 'uber_eats', name: 'Uber Eats', category: 'delivery', domain: 'ubereats.com',
    supported_countries: [], status: 'active', ranking: 100,
    description: 'Organiza comprobantes de pagos, extractos y documentos de Uber Eats.',
    brandIconSlug: 'ubereats', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Cobertura amplia; la disponibilidad depende de la ciudad y del tipo de cuenta.', sourceKind: 'platform',
  },
  {
    id: 'glovo', name: 'Glovo', category: 'delivery', domain: 'glovoapp.com',
    supported_countries: ['ES', 'PT', 'IT', 'PL', 'RO'], status: 'active', ranking: 99,
    description: 'Centraliza justificantes y cobros de Glovo sin asumir su tratamiento fiscal.',
    brandIconSlug: 'glovo', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'invoice', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Mercados catalogados; la relación laboral o mercantil varía por país.', sourceKind: 'platform',
  },
  {
    id: 'just_eat', name: 'Just Eat', category: 'delivery', domain: 'just-eat.com',
    supported_countries: ['ES', 'GB', 'FR', 'IT', 'IE'], status: 'active', ranking: 95,
    description: 'Guarda pagos y documentación de Just Eat con evidencia trazable.',
    brandIconSlug: 'justeat', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'El modelo de trabajo y la disponibilidad pueden variar por mercado.', sourceKind: 'platform',
  },
  {
    id: 'stuart', name: 'Stuart', category: 'delivery', domain: 'stuart.com',
    supported_countries: ['ES', 'FR', 'GB'], status: 'active', ranking: 88,
    description: 'Control de cobros y documentos de logística urbana.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'invoice', 'statement', 'screenshot'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'platform',
  },
  {
    id: 'deliveroo', name: 'Deliveroo', category: 'delivery', domain: 'deliveroo.co.uk',
    supported_countries: ['GB', 'FR', 'IT', 'IE', 'AE'], status: 'active', ranking: 94,
    description: 'Registra cobros y documentos de Deliveroo sin inventar una conexión automática.',
    brandIconSlug: 'deliveroo', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'platform',
  },
  {
    id: 'doordash', name: 'DoorDash', category: 'delivery', domain: 'doordash.com',
    supported_countries: ['US', 'CA', 'AU', 'NZ'], status: 'active', ranking: 98,
    description: 'Concilia cobros y conserva documentos del trabajo realizado con DoorDash.',
    brandIconSlug: 'doordash', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'platform',
  },
  {
    id: 'rappi', name: 'Rappi', category: 'delivery', domain: 'rappi.com',
    supported_countries: ['MX', 'CO', 'AR', 'CL', 'PE', 'BR', 'CR', 'EC'], status: 'active', ranking: 98,
    description: 'Controla cobros, comprobantes y documentos de Rappi.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'invoice', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Disponibilidad y documentación varían según país.', sourceKind: 'platform',
  },
  {
    id: 'didi_food', name: 'DiDi Food', category: 'delivery', domain: 'didi-food.com',
    supported_countries: ['MX', 'CO', 'CR'], status: 'active', ranking: 92,
    description: 'Registra cobros y evidencias emitidas por DiDi Food.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'invoice', 'statement', 'screenshot'],
    availabilityNote: 'Disponibilidad y documentación varían según país.', sourceKind: 'platform',
  },
  {
    id: 'pedidosya', name: 'PedidosYa', category: 'delivery', domain: 'pedidosya.com',
    supported_countries: ['AR', 'CL', 'PE', 'UY', 'EC', 'PA'], status: 'active', ranking: 96,
    description: 'Organiza cobros y comprobantes de PedidosYa.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'invoice', 'statement', 'screenshot'],
    availabilityNote: 'Disponibilidad y condiciones dependen del país y la ciudad.', sourceKind: 'platform',
  },
  {
    id: 'wolt', name: 'Wolt', category: 'delivery', domain: 'wolt.com',
    supported_countries: ['DE', 'PL', 'CZ', 'SE', 'NO', 'FI', 'DK', 'JP'], status: 'active', ranking: 94,
    description: 'Guarda pagos y documentos de Wolt con trazabilidad.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'platform',
  },
  {
    id: 'bolt_food', name: 'Bolt Food', category: 'delivery', domain: 'bolt.eu',
    supported_countries: ['PT', 'PL', 'RO', 'SE'], status: 'active', ranking: 90,
    description: 'Control financiero y documental para ingresos de Bolt Food.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'statement', 'screenshot'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'platform',
  },
  {
    id: 'amazon_flex', name: 'Amazon Flex', category: 'delivery', domain: 'flex.amazon.com',
    supported_countries: ['ES', 'US', 'GB', 'DE', 'AU', 'JP'], status: 'active', ranking: 94,
    description: 'Organiza pagos y documentos asociados a bloques de Amazon Flex.',
    brandIconSlug: 'amazon', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Disponibilidad sujeta al programa local de Amazon Flex.', sourceKind: 'platform',
  },
  {
    id: 'ifood', name: 'iFood', category: 'delivery', domain: 'ifood.com.br',
    supported_countries: ['BR'], status: 'active', ranking: 98,
    description: 'Control de cobros y documentos de iFood en Brasil.',
    brandIconSlug: 'ifood', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot'],
    availabilityNote: 'Catálogo orientado a Brasil; disponibilidad local puede variar.', sourceKind: 'platform',
  },
  {
    id: 'uber_driver', name: 'Uber Driver', category: 'mobility', domain: 'uber.com',
    supported_countries: [], status: 'active', ranking: 100,
    description: 'Centraliza cobros y documentos del trabajo realizado con Uber.',
    brandIconSlug: 'uber', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Cobertura amplia; la disponibilidad depende de la ciudad y de la categoría de servicio.', sourceKind: 'mobility',
  },
  {
    id: 'cabify', name: 'Cabify', category: 'mobility', domain: 'cabify.com',
    supported_countries: ['ES', 'MX', 'AR', 'CL', 'CO', 'PE'], status: 'active', ranking: 94,
    description: 'Registra cobros y documentación de Cabify.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'statement', 'screenshot'],
    availabilityNote: 'Disponibilidad y modalidad de trabajo varían por mercado.', sourceKind: 'mobility',
  },
  {
    id: 'bolt', name: 'Bolt', category: 'mobility', domain: 'bolt.eu',
    supported_countries: ['PT', 'DE', 'PL', 'RO', 'GB'], status: 'active', ranking: 92,
    description: 'Controla cobros y documentos de Bolt.',
    connectionMode: 'manual_evidence', evidenceTypes: ['payout', 'statement', 'screenshot'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'mobility',
  },
  {
    id: 'lyft', name: 'Lyft', category: 'mobility', domain: 'lyft.com',
    supported_countries: ['US', 'CA'], status: 'active', ranking: 95,
    description: 'Organiza cobros y comprobantes de Lyft.',
    brandIconSlug: 'lyft', connectionMode: 'manual_evidence',
    evidenceTypes: ['payout', 'statement', 'screenshot', 'email'],
    availabilityNote: 'Disponibilidad sujeta a mercado y ciudad.', sourceKind: 'mobility',
  },
];
