export interface DeliveryPlatformMeta {
  id: string;
  name: string;
  domain: string;
  brandColor: string;
  textColor: string;
  badgeBg: string;
  regions: string[]; // e.g. ['ES', 'GLOBAL', 'LATAM', 'EU']
  paymentCycle: 'semanal' | 'quincenal' | 'diario' | 'mensual';
  description: string;
  invoiceType: 'Autofactura' | 'Factura emitida por rider';
  defaultRetentionPct: number; // e.g. 0, 7, 15
  popularIn: string;
}

export const OFFICIAL_DELIVERY_PLATFORMS: DeliveryPlatformMeta[] = [
  {
    id: 'uber_eats',
    name: 'Uber Eats',
    domain: 'ubereats.com',
    brandColor: '#06C167',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#06C167]/10 text-[#06C167]',
    regions: ['ES', 'GLOBAL', 'LATAM', 'EU', 'US'],
    paymentCycle: 'semanal',
    description: 'Auto-facturación semanal y quincenal con desglose de IVA e IRPF.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'España, México, EE.UU., Europa'
  },
  {
    id: 'glovo',
    name: 'Glovo',
    domain: 'glovoapp.com',
    brandColor: '#FFC244',
    textColor: '#212121',
    badgeBg: 'bg-[#FFC244]/20 text-[#A06000]',
    regions: ['ES', 'EU', 'IT', 'PT', 'PL'],
    paymentCycle: 'quincenal',
    description: 'Facturación quincenal oficial (días 1 y 16) conforme a la Ley Rider.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'España, Italia, Portugal, Europa'
  },
  {
    id: 'just_eat',
    name: 'Just Eat',
    domain: 'just-eat.es',
    brandColor: '#FF8000',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#FF8000]/10 text-[#FF8000]',
    regions: ['ES', 'EU', 'UK', 'IT'],
    paymentCycle: 'semanal',
    description: 'Plataforma con modelos Scoober y logística para autónomos.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'España, Reino Unido, Francia'
  },
  {
    id: 'stuart',
    name: 'Stuart',
    domain: 'stuart.com',
    brandColor: '#1055FE',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#1055FE]/10 text-[#1055FE]',
    regions: ['ES', 'EU', 'FR', 'UK'],
    paymentCycle: 'semanal',
    description: 'Logística B2B urbana para mensajería y delivery con slots y slots garantizados.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'España, Francia, Reino Unido'
  },
  {
    id: 'deliveroo',
    name: 'Deliveroo',
    domain: 'deliveroo.co.uk',
    brandColor: '#00CDBC',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#00CDBC]/10 text-[#008F83]',
    regions: ['EU', 'UK', 'FR', 'IT'],
    paymentCycle: 'semanal',
    description: 'Facturación periódica para riders autónomos en mercados internacionales.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'Reino Unido, Francia, Italia, EAU'
  },
  {
    id: 'rappi',
    name: 'Rappi',
    domain: 'rappi.com',
    brandColor: '#FF441F',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#FF441F]/10 text-[#FF441F]',
    regions: ['LATAM', 'MX', 'CO', 'AR', 'BR', 'CL', 'PE'],
    paymentCycle: 'semanal',
    description: 'Líder en Latinoamérica con retenciones fiscales automáticas del SAT/DIAN.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 2.1,
    popularIn: 'México, Colombia, Argentina, Chile, Perú'
  },
  {
    id: 'didi_food',
    name: 'DiDi Food',
    domain: 'didi-food.com',
    brandColor: '#FF7D41',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#FF7D41]/10 text-[#D9530F]',
    regions: ['LATAM', 'MX', 'CO', 'BR'],
    paymentCycle: 'semanal',
    description: 'Pagos semanales con timbrado de CFDI fiscal automático en México y Latam.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 2.1,
    popularIn: 'México, Colombia, Brasil, Costa Rica'
  },
  {
    id: 'pedidosya',
    name: 'PedidosYa',
    domain: 'pedidosya.com',
    brandColor: '#D00028',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#D00028]/10 text-[#D00028]',
    regions: ['LATAM', 'AR', 'CL', 'UY', 'PY', 'BO'],
    paymentCycle: 'quincenal',
    description: 'Red Delivery Hero en el cono sur para repartidores y mensajeros.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'Argentina, Chile, Uruguay, Paraguay'
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    domain: 'doordash.com',
    brandColor: '#EB1700',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#EB1700]/10 text-[#EB1700]',
    regions: ['GLOBAL', 'US', 'CA', 'AU', 'DE'],
    paymentCycle: 'semanal',
    description: 'Plataforma con Fast Pay y reporte fiscal anual Formulario 1099-NEC.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'Estados Unidos, Canadá, Australia, Alemania'
  },
  {
    id: 'wolt',
    name: 'Wolt',
    domain: 'wolt.com',
    brandColor: '#009DE0',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#009DE0]/10 text-[#009DE0]',
    regions: ['EU', 'GLOBAL', 'DE', 'PL', 'JP'],
    paymentCycle: 'quincenal',
    description: 'Delivery nórdico y europeo de alta calidad para couriers independientes.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'Alemania, Finlandia, Polonia, Japón'
  },
  {
    id: 'bolt_food',
    name: 'Bolt Food',
    domain: 'bolt.eu',
    brandColor: '#34D186',
    textColor: '#0B3320',
    badgeBg: 'bg-[#34D186]/20 text-[#0B3320]',
    regions: ['EU', 'ES', 'PT', 'PL', 'RO'],
    paymentCycle: 'semanal',
    description: 'Red de micromovilidad y comida a domicilio en expansión europea.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'Portugal, Polonia, Países Bálticos, España'
  },
  {
    id: 'amazon_flex',
    name: 'Amazon Flex',
    domain: 'amazon.es',
    brandColor: '#FF9900',
    textColor: '#131921',
    badgeBg: 'bg-[#FF9900]/20 text-[#131921]',
    regions: ['ES', 'US', 'EU', 'UK', 'DE'],
    paymentCycle: 'semanal',
    description: 'Reparto de paquetes de última milla con bloques de horas contratadas.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'España, EE.UU., Reino Unido, Alemania'
  },
  {
    id: 'catcher',
    name: 'Catcher',
    domain: 'catcher.eu',
    brandColor: '#6C5CE7',
    textColor: '#FFFFFF',
    badgeBg: 'bg-[#6C5CE7]/10 text-[#6C5CE7]',
    regions: ['ES', 'EU'],
    paymentCycle: 'semanal',
    description: 'Marketplace de pedidos B2B y multireparto para flotas y autónomos.',
    invoiceType: 'Factura emitida por rider',
    defaultRetentionPct: 0,
    popularIn: 'España'
  },
  {
    id: 'paack',
    name: 'Paack Logistics',
    domain: 'paack.co',
    brandColor: '#00E2AA',
    textColor: '#0E2138',
    badgeBg: 'bg-[#00E2AA]/20 text-[#0E2138]',
    regions: ['ES', 'EU', 'FR', 'UK'],
    paymentCycle: 'quincenal',
    description: 'Envíos programados de e-commerce y retail para transportistas y riders.',
    invoiceType: 'Autofactura',
    defaultRetentionPct: 0,
    popularIn: 'España, Francia, Reino Unido'
  }
];

export const SPANISH_TAX_MODELS = [
  {
    code: '036 / 037',
    name: 'Declaración Censal de Alta de Autónomo',
    entity: 'Agencia Tributaria (Hacienda)',
    frequency: 'Al comenzar o modificar actividad',
    description: 'Alta en el Censo de Empresarios y Profesionales. Asignación de Epígrafe IAE (ej. 849.5 Mensajería y reparto).',
    badge: 'Alta Inicial'
  },
  {
    code: 'Modelo 130',
    name: 'Pago Fraccionado IRPF (20%)',
    entity: 'Agencia Tributaria (Hacienda)',
    frequency: 'Trimestral (1T, 2T, 3T, 4T)',
    description: 'Pago a cuenta trimestral del 20% sobre el rendimiento neto (Ingresos íntegros - Gastos deducibles).',
    badge: 'Trimestral Clave',
    deadlines: ['1-20 de Abril (1T)', '1-20 de Julio (2T)', '1-20 de Octubre (3T)', '1-30 de Enero (4T)']
  },
  {
    code: 'Modelo 303',
    name: 'Autoliquidación del IVA',
    entity: 'Agencia Tributaria (Hacienda)',
    frequency: 'Trimestral (1T, 2T, 3T, 4T)',
    description: 'Diferencia entre IVA repercutido a clientes y plataformas y el IVA soportado/deducible en combustible, móvil y reparaciones.',
    badge: 'Trimestral Clave',
    deadlines: ['1-20 de Abril (1T)', '1-20 de Julio (2T)', '1-20 de Octubre (3T)', '1-30 de Enero (4T)']
  },
  {
    code: 'RETA Seguridad Social',
    name: 'Cuota de Autónomos por Tramos',
    entity: 'Seguridad Social (TGSS)',
    frequency: 'Mensual (último día laborable)',
    description: 'Tarifa Plana de 80€/mes el primer año, o cotización ajustada a los rendimientos netos reales esperados.',
    badge: 'Mensual',
    deadlines: ['Último día de cada mes']
  },
  {
    code: 'Modelo 390',
    name: 'Resumen Anual del IVA',
    entity: 'Agencia Tributaria (Hacienda)',
    frequency: 'Anual (Enero)',
    description: 'Resumen informativo anual de todas las operaciones realizadas durante el ejercicio.',
    badge: 'Anual Informativo',
    deadlines: ['1-30 de Enero']
  },
  {
    code: 'Modelo 100',
    name: 'Declaración Anual de la Renta (IRPF)',
    entity: 'Agencia Tributaria (Hacienda)',
    frequency: 'Anual (Abril - Junio)',
    description: 'Liquidación definitiva anual del IRPF deduciendo los pagos ya adelantados en los Modelos 130.',
    badge: 'Anual IRPF',
    deadlines: ['Abril a Junio']
  }
];

export const GAS_STATION_PRESETS = [
  { name: 'Repsol', domain: 'repsol.es', logoColor: '#F58220' },
  { name: 'Cepsa (Moeve)', domain: 'cepsa.com', logoColor: '#E30613' },
  { name: 'BP', domain: 'bp.com', logoColor: '#009900' },
  { name: 'Shell', domain: 'shell.com', logoColor: '#FBCE07' },
  { name: 'Galp', domain: 'galp.com', logoColor: '#FF6600' },
  { name: 'Petroprix', domain: 'petroprix.com', logoColor: '#0072CE' },
  { name: 'Plenoil', domain: 'plenoil.es', logoColor: '#E30613' },
  { name: 'Ballenoil', domain: 'ballenoil.es', logoColor: '#1A4488' },
  { name: 'Carrefour Gasolinera', domain: 'carrefour.es', logoColor: '#00387B' },
  { name: 'Alcampo Gasolinera', domain: 'alcampo.es', logoColor: '#E2001A' }
];
