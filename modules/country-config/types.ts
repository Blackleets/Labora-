
export interface IncomeTaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface PlatformDetails {
  id: string;
  name: string;
  logo_domain: string;
  base_fare: number;
  rate_km: number;
  rate_min: number;
  commission_pct: number;
  payment_speed: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  incentives_summary: string;
}

export interface BankingMetadata {
  instant_payment_options: { name: string }[];
  platform_payouts: Record<string, { method: string; time: string; fee: string }[]>;
  deposit_time_standard: string;
  deposit_time_instant?: string;
  avg_transfer_fee: number;
  compatible_banks: { name: string; logo: string; type: 'traditional' | 'neobank' }[];
}

export interface VehicleBenchmarks {
  avg_insurance_cost_yr: { bicycle: number; motorcycle: number; car: number };
  avg_maintenance_yr: { bicycle: number; motorcycle: number; car: number };
}

export interface LaborAdvisor {
  tax_entity_name: string;
  registration_steps: string[];
  tax_obligations: { title: string; description: string; severity: 'info' | 'warning' | 'critical' }[];
  contract_types: { title: string; description: string; severity?: 'critical' }[];
  recommended_retention_pct: number;
  freelancer_threshold_note: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'sports' | 'concert' | 'festival';
  demand_multiplier: number;
}

export interface CityCost {
  name: string;
  rent_avg: number;
  food_avg: number;
  transport_avg: number;
  suggested_income_goal: number;
}

export interface MapConfig {
  default_city: string;
  center: { lat: number; lng: number };
  zoom: number;
}

export type FiscalKnowledgeStatus = 'identity_only' | 'under_review' | 'verified';

export interface CountryKnowledge {
  status: FiscalKnowledgeStatus;
  effective_from?: string;
  reviewed_at?: string;
  reviewer?: string;
  sources: Array<{
    title: string;
    url: string;
    authority: string;
    retrieved_at: string;
  }>;
}

export interface CountryConfig {
  country_code: string; // ISO2: ES, MX, US
  display_name: string;
  currency: string;
  currency_symbol: string;
  min_fare: number;
  per_km_rate: number;
  per_min_rate: number;
  default_commission_pct: number; // 0.30 for 30%
  vat_pct: number;
  income_tax_brackets: IncomeTaxBracket[];
  legal_notes: string;
  platforms: PlatformDetails[];
  timezone: string;
  service_fee_flat: number;
  social_security_pct: number;
  decimals: number;
  avg_fuel_price: number;
  peak_hours: { lunch_start: number; lunch_end: number; dinner_start: number; dinner_end: number; };
  banking_metadata: BankingMetadata;
  vehicle_benchmarks: VehicleBenchmarks;
  labor_advisor: LaborAdvisor;
  events: Event[];
  cities: CityCost[];
  map_config: MapConfig;
  knowledge: CountryKnowledge;
}

export const DEFAULT_SPAIN_CONFIG: CountryConfig = {
  country_code: "ES",
  display_name: "España",
  currency: "EUR",
  currency_symbol: "€",
  min_fare: 3.50,
  per_km_rate: 0.95,
  per_min_rate: 0.15,
  default_commission_pct: 0.30,
  vat_pct: 0.21,
  income_tax_brackets: [
    { min: 0, max: 12450, rate: 0.19 },
    { min: 12450, max: 20200, rate: 0.24 },
    { min: 20200, max: 35200, rate: 0.30 },
    { min: 35200, max: 60000, rate: 0.37 },
    { min: 60000, max: 300000, rate: 0.45 },
  ],
  legal_notes: "Contenido fiscal pendiente de consolidar en un paquete España con fuentes oficiales, vigencia y revisión profesional.",
  platforms: [
    { id: 'glovo', name: 'Glovo', logo_domain: 'glovoapp.com', base_fare: 2.80, rate_km: 0.85, rate_min: 0.10, commission_pct: 0.30, payment_speed: 'biweekly', incentives_summary: 'Bonus lluvia x1.2' },
    { id: 'uber', name: 'Uber Eats', logo_domain: 'uber.com', base_fare: 3.00, rate_km: 0.90, rate_min: 0.12, commission_pct: 0.30, payment_speed: 'weekly', incentives_summary: 'Quest semanal' },
    { id: 'stuart', name: 'Stuart', logo_domain: 'stuart.com', base_fare: 4.20, rate_km: 1.00, rate_min: 0.15, commission_pct: 0.35, payment_speed: 'weekly', incentives_summary: 'Garantizados por hora' }
  ],
  timezone: "Europe/Madrid",
  service_fee_flat: 0.10,
  social_security_pct: 0.29,
  decimals: 2,
  avg_fuel_price: 1.65,
  peak_hours: { lunch_start: 13, lunch_end: 16, dinner_start: 20, dinner_end: 23 },
  banking_metadata: {
    instant_payment_options: [{ name: 'SEPA Instant' }],
    platform_payouts: {
      'Uber': [{ method: 'Flex Pay', time: 'Instant', fee: '0.50€' }, { method: 'Weekly', time: '2 days', fee: '0.00€' }],
      'Glovo': [{ method: 'Daily', time: '24h', fee: '0.00€' }, { method: 'Biweekly', time: '3 days', fee: '0.00€' }]
    },
    deposit_time_standard: '1-2 días',
    deposit_time_instant: '10 segundos',
    avg_transfer_fee: 0.00,
    compatible_banks: [
      { name: 'BBVA', logo: 'https://logo.clearbit.com/bbva.es', type: 'traditional' },
      { name: 'Revolut', logo: 'https://logo.clearbit.com/revolut.com', type: 'neobank' },
      { name: 'N26', logo: 'https://logo.clearbit.com/n26.com', type: 'neobank' }
    ]
  },
  vehicle_benchmarks: {
    avg_insurance_cost_yr: { bicycle: 50, motorcycle: 350, car: 600 },
    avg_maintenance_yr: { bicycle: 100, motorcycle: 400, car: 800 }
  },
  labor_advisor: {
    tax_entity_name: "Agencia Tributaria (Hacienda)",
    registration_steps: ["Alta en Censo (036/037)", "Alta en RETA (Seg. Social)", "Obtención Certificado Digital"],
    tax_obligations: [],
    contract_types: [
      { title: "Autónomo (TRADE)", description: "Trabajador Autónomo Económicamente Dependiente. Si el 75% ingresos vienen de una plataforma.", severity: "critical" },
      { title: "Autónomo General", description: "Régimen común para trabajar con múltiples apps." }
    ],
    recommended_retention_pct: 0,
    freelancer_threshold_note: "Pendiente de validar por actividad, régimen y periodo."
  },
  events: [
    { id: 'e1', name: 'Derbi Madrileño', date: '2024-04-15T20:00:00', location: 'Estadio Metropolitano', type: 'sports', demand_multiplier: 1.8 }
  ],
  cities: [
    { name: 'Madrid', rent_avg: 500, food_avg: 250, transport_avg: 40, suggested_income_goal: 1800 },
    { name: 'Barcelona', rent_avg: 600, food_avg: 300, transport_avg: 50, suggested_income_goal: 2000 }
  ],
  map_config: {
    default_city: "Madrid",
    center: { lat: 40.4168, lng: -3.7038 },
    zoom: 13
  },
  knowledge: { status: 'under_review', sources: [] }
};

export const DEFAULT_MEXICO_CONFIG: CountryConfig = {
  country_code: "MX",
  display_name: "México",
  currency: "MXN",
  currency_symbol: "$",
  min_fare: 35.00,
  per_km_rate: 8.50,
  per_min_rate: 2.00,
  default_commission_pct: 0.35,
  vat_pct: 0.16,
  income_tax_brackets: [
    { min: 0, max: 7735, rate: 0.019 },
    { min: 7735, max: 65651, rate: 0.06 },
    { min: 65651, max: 115375, rate: 0.10 },
  ],
  legal_notes: "Régimen de Plataformas Tecnológicas. Retención automática de ISR e IVA por parte de la App.",
  platforms: [
    { id: 'uber', name: 'Uber Eats', logo_domain: 'uber.com', base_fare: 30.00, rate_km: 7.00, rate_min: 1.50, commission_pct: 0.35, payment_speed: 'weekly', incentives_summary: 'Desafíos x viajes' },
    { id: 'rappi', name: 'Rappi', logo_domain: 'rappi.com.mx', base_fare: 28.00, rate_km: 6.50, rate_min: 1.80, commission_pct: 0.35, payment_speed: 'biweekly', incentives_summary: 'RappiTurbo Bonus' },
    { id: 'didi', name: 'DiDi Food', logo_domain: 'didi-food.com', base_fare: 25.00, rate_km: 8.00, rate_min: 1.20, commission_pct: 0.30, payment_speed: 'weekly', incentives_summary: 'Garantías hora pico' }
  ],
  timezone: "America/Mexico_City",
  service_fee_flat: 5.00,
  social_security_pct: 0.05,
  decimals: 2,
  avg_fuel_price: 24.50,
  peak_hours: { lunch_start: 13, lunch_end: 16, dinner_start: 19, dinner_end: 22 },
  banking_metadata: {
    instant_payment_options: [{ name: 'SPEI' }],
    platform_payouts: {
      'Uber': [{ method: 'Instant', time: 'Minutos', fee: '$5.00' }],
      'Rappi': [{ method: 'Weekly', time: 'Jueves', fee: '$0.00' }]
    },
    deposit_time_standard: '24 horas',
    deposit_time_instant: 'Instantáneo',
    avg_transfer_fee: 0.00,
    compatible_banks: [
      { name: 'BBVA', logo: 'https://logo.clearbit.com/bbva.mx', type: 'traditional' },
      { name: 'Nu', logo: 'https://logo.clearbit.com/nu.com.mx', type: 'neobank' },
      { name: 'Hey Banco', logo: 'https://logo.clearbit.com/heybanco.com', type: 'neobank' }
    ]
  },
  vehicle_benchmarks: {
    avg_insurance_cost_yr: { bicycle: 0, motorcycle: 4000, car: 12000 },
    avg_maintenance_yr: { bicycle: 1500, motorcycle: 6000, car: 15000 }
  },
  labor_advisor: {
    tax_entity_name: "SAT",
    registration_steps: ["RFC con Homoclave", "e.Firma", "Sellos Digitales"],
    tax_obligations: [
      { title: "Declaración Mensual ISR/IVA", description: "Si optas por pagos definitivos, la app retiene todo.", severity: "info" },
      { title: "Constancia de Situación Fiscal", description: "Entregar a Uber/Rappi para correcto timbrado.", severity: "critical" }
    ],
    contract_types: [
      { title: "Plataformas Tecnológicas", description: "Régimen específico obligatorio.", severity: "critical" }
    ],
    recommended_retention_pct: 0.08,
    freelancer_threshold_note: "Recuerda actualizar tu régimen en el SAT para evitar retención máxima del 35%."
  },
  events: [],
  cities: [
    { name: 'CDMX', rent_avg: 6000, food_avg: 4000, transport_avg: 800, suggested_income_goal: 18000 },
    { name: 'Guadalajara', rent_avg: 5000, food_avg: 3500, transport_avg: 600, suggested_income_goal: 15000 }
  ],
  map_config: {
    default_city: "Ciudad de México",
    center: { lat: 19.4326, lng: -99.1332 },
    zoom: 12
  },
  knowledge: { status: 'under_review', sources: [] }
};

export const DEFAULT_USA_CONFIG: CountryConfig = {
  country_code: "US",
  display_name: "United States",
  currency: "USD",
  currency_symbol: "$",
  min_fare: 5.00,
  per_km_rate: 1.10, // per mile actually
  per_min_rate: 0.20,
  default_commission_pct: 0.25,
  vat_pct: 0.0, // Sales tax varies
  income_tax_brackets: [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
  ],
  legal_notes: "Estimates based on Federal Income Tax (1099-NEC). Self-Employment Tax (15.3%) not included in base calculation.",
  platforms: [
    { id: 'doordash', name: 'DoorDash', logo_domain: 'doordash.com', base_fare: 3.50, rate_km: 1.00, rate_min: 0.10, commission_pct: 0.25, payment_speed: 'weekly', incentives_summary: 'Peak Pay' },
    { id: 'uber', name: 'Uber Eats', logo_domain: 'uber.com', base_fare: 4.00, rate_km: 1.10, rate_min: 0.15, commission_pct: 0.25, payment_speed: 'daily', incentives_summary: 'Boost+' }
  ],
  timezone: "America/New_York",
  service_fee_flat: 1.00,
  social_security_pct: 0.153,
  decimals: 2,
  avg_fuel_price: 3.50, // per gallon actually, logic might need adjustment but OK for mockup
  peak_hours: { lunch_start: 11, lunch_end: 14, dinner_start: 17, dinner_end: 21 },
  banking_metadata: {
    instant_payment_options: [{ name: 'RTP' }, { name: 'Debit Card Instant' }],
    platform_payouts: {
      'Uber': [{ method: 'Instant', time: 'Minutes', fee: '$0.85' }],
      'DoorDash': [{ method: 'Fast Pay', time: 'Minutes', fee: '$1.99' }]
    },
    deposit_time_standard: '2-3 days',
    deposit_time_instant: 'Instant',
    avg_transfer_fee: 1.00,
    compatible_banks: [
      { name: 'Chase', logo: 'https://logo.clearbit.com/chase.com', type: 'traditional' },
      { name: 'Chime', logo: 'https://logo.clearbit.com/chime.com', type: 'neobank' }
    ]
  },
  vehicle_benchmarks: {
    avg_insurance_cost_yr: { bicycle: 100, motorcycle: 800, car: 1500 },
    avg_maintenance_yr: { bicycle: 200, motorcycle: 600, car: 1200 }
  },
  labor_advisor: {
    tax_entity_name: "IRS",
    registration_steps: ["W-9 Form", "EIN (Optional)"],
    tax_obligations: [
      { title: "Quarterly Estimated Tax", description: "Form 1040-ES if you expect to owe >$1000.", severity: "warning" },
      { title: "Schedule C", description: "Profit or Loss from Business annual filing.", severity: "critical" }
    ],
    contract_types: [
      { title: "Independent Contractor (1099)", description: "You are responsible for all taxes (SE Tax).", severity: "critical" }
    ],
    recommended_retention_pct: 0.25,
    freelancer_threshold_note: "Keep track of mileage (Standard Mileage Rate) to deduct ~65c/mile."
  },
  events: [],
  cities: [
    { name: 'NYC', rent_avg: 2500, food_avg: 800, transport_avg: 130, suggested_income_goal: 5000 },
    { name: 'LA', rent_avg: 2200, food_avg: 700, transport_avg: 150, suggested_income_goal: 4500 }
  ],
  map_config: {
    default_city: "New York",
    center: { lat: 40.7128, lng: -74.0060 },
    zoom: 12
  },
  knowledge: { status: 'under_review', sources: [] }
};

// Country identity records. Fiscal and pricing fields stay neutral until the
// jurisdiction has official sources, an effective date and a named review.

const createBasicProfile = (code: string, name: string, curr: string, symbol: string): CountryConfig => ({
  ...DEFAULT_SPAIN_CONFIG,
  country_code: code,
  display_name: name,
  currency: curr,
  currency_symbol: symbol,
  min_fare: 0,
  per_km_rate: 0,
  per_min_rate: 0,
  default_commission_pct: 0,
  vat_pct: 0,
  income_tax_brackets: [],
  legal_notes: 'Información fiscal pendiente de revisión documental.',
  platforms: [],
  service_fee_flat: 0,
  social_security_pct: 0,
  avg_fuel_price: 0,
  banking_metadata: {
    instant_payment_options: [],
    platform_payouts: {},
    deposit_time_standard: 'Pendiente de validar',
    avg_transfer_fee: 0,
    compatible_banks: []
  },
  labor_advisor: {
    tax_entity_name: 'Autoridad fiscal pendiente de verificar',
    registration_steps: [],
    tax_obligations: [],
    contract_types: [],
    recommended_retention_pct: 0,
    freelancer_threshold_note: 'Pendiente de revisión por jurisdicción.'
  },
  events: [],
  cities: [],
  knowledge: { status: 'identity_only', sources: [] }
});

export const OTHER_COUNTRIES: CountryConfig[] = [
  createBasicProfile('CO', 'Colombia', 'COP', '$'),
  createBasicProfile('AR', 'Argentina', 'ARS', '$'),
  createBasicProfile('CL', 'Chile', 'CLP', '$'),
  createBasicProfile('PE', 'Perú', 'PEN', 'S/'),
  createBasicProfile('FR', 'Francia', 'EUR', '€'),
  createBasicProfile('IT', 'Italia', 'EUR', '€'),
  createBasicProfile('DE', 'Alemania', 'EUR', '€'),
  createBasicProfile('GB', 'Reino Unido', 'GBP', '£'),
];
