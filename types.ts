
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
  organizationId?: string;
  platforms: string[];
  banks?: string[];
  managerId?: string;
  currencyPreference?: string;
  notificationSettings?: NotificationSettings;
  nif?: string;
  fiscalRegime?: string;
  iaeCode?: string;
  socialSecurityType?: string;
  vehicleType?: 'moto' | 'bici' | 'coche' | 'furgoneta' | 'patinete';
  vehiclePlate?: string;
  vehicleFuel?: 'gasolina' | 'diesel' | 'electrico' | 'glp';
  companyName?: string;
  collegiateNumber?: string;
  countryCode?: string;
}

export type IntegrationCategory = 'delivery' | 'mobility' | 'banking' | 'payments' | 'accounting' | 'hr';

export interface IntegrationDef {
  id: string;
  name: string;
  category: IntegrationCategory;
  domain: string;
  supported_countries: string[];
  status: 'active' | 'beta' | 'deprecated';
  ranking: number;
  description?: string;
  is_installed?: boolean;
}

export interface PolicyRule {
  id: string;
  field: string;
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
  priority: number;
  scope: {
    country_code?: string;
    module?: string;
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
  entityId?: string;
  status: ApprovalStatus;
  payload: any;
  policyTriggered?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  country_code: string;
  base_salary: number;
  currency: string;
  status: 'active' | 'onboarding' | 'terminated';
  national_id?: string;
  bank_account?: string;
  start_date: string;
}

export interface PayrollRun {
  id: string;
  period: string;
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

export interface Integration {
  id: string;
  name: string;
  type: IntegrationCategory;
  logo_url: string;
  status: 'active' | 'inactive' | 'pending';
  country_codes: string[];
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

export type IncomeSourceType = 'manual' | 'text_import' | 'document_import' | 'api_sync' | 'bank_import';

export interface Income {
  id: string;
  userId: string;
  platform: string;
  date: string;
  amount: number;
  retention: number;
  sourceType?: IncomeSourceType;
  sourceReference?: string;
  externalId?: string;
  confidence?: number;
  needsReview?: boolean;
  importedAt?: string;
  sourceDocumentId?: string;
  sourceHash?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface WorkSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  startOdometerKm?: number;
  endOdometerKm?: number;
  notes?: string;
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
  receiptUrl?: string;
  receiptHash?: string;
  receiptMimeType?: string;
  ocrConfidence?: number;
  ocrNeedsReview?: boolean;
  ocrUncertainFields?: string[];
  notes?: string;
  isRecurring?: boolean;
  merchant?: string;
  vatRate?: number;
  vatAmount?: number;
  fuelLitres?: number;
  fuelType?: string;
  status?: 'pending_review' | 'approved' | 'rejected' | 'needs_fix';
  gestorNotes?: string;
  deductiblePercentage?: number;
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
  submissionUrl?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  quarter?: string;
}

export interface TaxDeclaration {
  id: string;
  userId: string;
  quarter: string;
  year: number;
  modelType: '130' | '303' | '390' | '100' | '036_037';
  title: string;
  grossIncome: number;
  deductibleExpenses: number;
  netYield: number;
  taxAmount: number;
  calculationState?: 'requires_review' | 'recorded';
  status: 'draft' | 'reviewed_by_gestor' | 'filed_with_tax_agency';
  filingReference?: string;
  filedAt?: string;
  gestorId?: string;
}

export interface Document {
  id: string;
  userId: string;
  type: 'Factura' | 'Liquidación' | 'Trimestre' | 'Alta' | 'Otro';
  name: string;
  date: string;
  content?: string;
  mimeType?: string;
  sizeBytes?: number;
  contentHash?: string;
  pageCount?: number;
}

export interface FiscalSummary {
  totalIncome: number;
  totalExpenses: number;
  deductibleExpenses: number;
  netProfit: number;
  estimatedIRPF: number;
  taxEstimateAvailable: boolean;
  quarter: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Payment {
  id: string;
  platform: string;
  amount: number;
  date: string;
  status: 'pending' | 'received';
  estimated: boolean;
  domain?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
