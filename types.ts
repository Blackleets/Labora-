
export enum UserRole {
  RIDER = 'RIDER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  lowIncomeAlert: boolean;
  paymentAlert: boolean;
}

export interface Organization {
  id: string;
  name: string;
  plan: 'starter' | 'growth' | 'enterprise';
  country_code: string;
  feature_flags: Record<string, boolean>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
  role: UserRole;
  organizationId?: string; // Multi-tenant link
  platforms: string[]; // e.g., 'Uber', 'Glovo'
  banks?: string[]; // e.g., 'BBVA', 'Revolut'
  managerId?: string; // If linked to a manager
  currencyPreference?: string;
  notificationSettings?: NotificationSettings;
  // Fiscal & Delivery Extensions
  nif?: string; // DNI / NIE / CIF / RFC
  fiscalRegime?: string; // e.g. '036_037_directa', '036_037_recargo', 'sat_plataformas', '1099_usa'
  iaeCode?: string; // e.g. '849.5'
  socialSecurityType?: string; // 'tarifa_plana' | 'tramos_reales'
  vehicleType?: 'moto' | 'bici' | 'coche' | 'furgoneta' | 'patinete';
  vehiclePlate?: string;
  vehicleFuel?: 'gasolina' | 'diesel' | 'electrico' | 'glp';
  companyName?: string; // For Gestores: "Gestoría Fiscal Pérez"
  collegiateNumber?: string; // For Gestores
  countryCode?: string; // 'ES', 'MX', 'US', etc.
}

// --- INTEGRATION ENGINE TYPES ---

export type IntegrationCategory = 'delivery' | 'mobility' | 'banking' | 'payments' | 'accounting' | 'hr';

export interface IntegrationDef {
  id: string;
  name: string;
  category: IntegrationCategory;
  domain: string; // Used for logo fetching (e.g., uber.com)
  supported_countries: string[]; // ['ES', 'MX', 'US'] or [] for global
  status: 'active' | 'beta' | 'deprecated';
  ranking: number; // 1-100, higher is better/more popular
  description?: string;
  is_installed?: boolean; // Runtime state
}

// --- POLICY ENGINE TYPES ---
export interface PolicyRule {
  id: string;
  field: string; // e.g., 'payroll.total_cost'
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'contains';
  value: any;
}

export interface PolicyAction {
  type: 'block' | 'require_approval' | 'notify' | 'log';
  message?: string;
  target_role?: UserRole;
}

export interface Policy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // 1-100 (Higher runs first)
  scope: {
    country_code?: string; // Apply only to specific country
    module?: string; // 'payroll', 'delivery', etc.
  };
  rules: PolicyRule[];
  actions: PolicyAction[];
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  requesterId: string;
  requesterName: string;
  entityType: 'payroll_run' | 'refund' | 'expense' | 'variable_change';
  entityId?: string; // Optional ID if the entity exists in draft state
  status: ApprovalStatus;
  payload: any; // Snapshot of the data needing approval (e.g. { total_cost: 15000 })
  policyTriggered?: string; // Name of the policy that caused this
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// --- EXISTING TYPES ---

export interface Employee {
  id: string;
  name: string;
  role: string;
  country_code: string;
  base_salary: number;
  currency: string;
  status: 'active' | 'onboarding' | 'terminated';
  national_id?: string; // DNI, SSN, CURP
  bank_account?: string; // IBAN, Routing
  start_date: string;
}

export interface PayrollRun {
  id: string;
  period: string; // "2024-04"
  status: 'draft' | 'approved' | 'paid' | 'needs_approval' | 'rejected';
  total_cost: number;
  employee_count: number;
  currency: string;
  date_processed: string;
}

export interface Payslip {
  id: string;
  employee_id: string;
  period: string;
  gross_pay: number;
  net_pay: number;
  deductions: {
    name: string;
    amount: number;
    rate?: number;
  }[];
  employer_cost: number;
}

// Legacy Integration Type (Deprecated in favor of IntegrationDef)
export interface Integration {
  id: string;
  name: string;
  type: IntegrationCategory;
  logo_url: string;
  status: 'active' | 'inactive' | 'pending';
  country_codes: string[]; // Supported countries
  is_installed: boolean;
}

export interface DeliveryOrder {
  id: string;
  platform: string;
  status: 'pending' | 'picking_up' | 'delivering' | 'delivered' | 'cancelled';
  customer_name: string;
  address: string;
  earnings: number;
  distance_km: number;
  timestamp: string;
  issues?: string[];
}

export interface Vehicle {
  type: 'moto' | 'bici' | 'coche' | 'patinete';
  model: string;
  plate?: string;
  lastMaintenanceDate: string;
  lastMaintenanceKm: number;
  currentKm: number;
  nextMaintenanceKm: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  cost: number;
  km: number;
  description: string;
  type: 'preventive' | 'repair' | 'tires' | 'other';
  nextPlannedKm?: number;
}

export interface Income {
  id: string;
  userId: string;
  platform: string;
  date: string; // ISO Date
  amount: number;
  retention: number; // IRPF retention if applicable
}

export enum ExpenseCategory {
  GASOLINA = 'Gasolina',
  MANTENIMIENTO = 'Mantenimiento',
  COMIDA = 'Comida',
  MOVIL = 'Móvil',
  CUOTA_AUTONOMO = 'Cuota Autónomo',
  EQUIPAMIENTO = 'Equipamiento',
  MARKETING = 'Marketing',
  SOFTWARE = 'Suscripciones Software',
  FORMACION = 'Formación',
  PEAJES = 'Peajes',
  IMPUESTOS = 'Impuestos No Reembolsables',
  SEGUROS = 'Seguros',
  OTROS = 'Otros'
}

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory | string;
  date: string;
  amount: number;
  receiptUrl?: string; // Base64 or URL image backup
  notes?: string;
  isRecurring?: boolean;
  merchant?: string; // e.g. "Repsol", "Cepsa", "BP", "Shell"
  vatRate?: number; // e.g. 21
  vatAmount?: number;
  fuelLitres?: number;
  fuelType?: string; // e.g. 'Gasolina 95', 'Diésel'
  status?: 'pending_review' | 'approved' | 'rejected' | 'needs_fix';
  gestorNotes?: string;
  deductiblePercentage?: number; // default 100% or 50%
  invoiceNumber?: string;
}

export interface GestorRequirement {
  id: string;
  managerId: string;
  managerName: string;
  riderId: string;
  riderName: string;
  title: string;
  description: string;
  category: 'fuel_receipt' | 'platform_invoice' | 'social_security' | 'vat_correction' | 'other';
  deadline: string;
  status: 'pending' | 'submitted' | 'approved';
  submissionNotes?: string;
  submissionUrl?: string; // photo / proof uploaded by rider
  createdAt: string;
  quarter?: string;
}

export interface TaxDeclaration {
  id: string;
  userId: string;
  quarter: string; // e.g. "1T 2024"
  year: number;
  modelType: '130' | '303' | '390' | '100' | '036_037';
  title: string;
  grossIncome: number;
  deductibleExpenses: number;
  netYield: number;
  taxAmount: number; // e.g. 20% for 130, VAT balance for 303
  status: 'draft' | 'reviewed_by_gestor' | 'filed_with_tax_agency';
  filingReference?: string;
  filedAt?: string;
  gestorId?: string;
}

export interface Document {
  id: string;
  userId: string;
  type: 'Factura' | 'Trimestre' | 'Alta' | 'Otro';
  name: string;
  date: string;
  content?: string; // Base64
}

export interface FiscalSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  estimatedIRPF: number;
  quarter: string; // e.g., "Q1 2024"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Payment {
  id: string;
  platform: string; // 'Uber', 'Glovo', etc.
  amount: number;
  date: string; // YYYY-MM-DD
  status: 'pending' | 'received';
  estimated: boolean;
  domain?: string; // for logo
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
