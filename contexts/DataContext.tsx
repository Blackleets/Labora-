import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { 
  User, Income, Expense, Document, UserRole, FiscalSummary, Payment, 
  Notification, Vehicle, ExpenseCategory, GestorRequirement, TaxDeclaration 
} from '../types';

interface DataContextType {
  currentUser: User | null;
  users: User[];
  incomes: Income[];
  expenses: Expense[];
  documents: Document[];
  payments: Payment[];
  requirements: GestorRequirement[];
  declarations: TaxDeclaration[];
  vehicle: Vehicle | null;
  hasOnboarded: boolean;
  privacyMode: boolean;
  darkMode: boolean;
  notifications: Notification[];
  togglePrivacyMode: () => void;
  toggleDarkMode: () => void;
  completeOnboarding: () => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  registerUser: (userData: Partial<User>) => void;
  switchUser: (userId: string) => void;
  updateUserConfig: (platforms: string[], banks: string[]) => void;
  updateUserFiscalProfile: (profileData: Partial<User>) => void;
  addIncome: (income: Omit<Income, 'id' | 'userId'>) => void;
  addIncomes: (incomes: Omit<Income, 'id' | 'userId'>[]) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => void;
  addExpenses: (expenses: Omit<Expense, 'id' | 'userId'>[]) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateExpenseAudit: (expenseId: string, status: 'pending_review' | 'approved' | 'rejected' | 'needs_fix', gestorNotes?: string) => void;
  addDocument: (doc: Omit<Document, 'id' | 'userId'>) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updateVehicle: (vehicleData: Vehicle) => void;
  addRequirement: (req: Omit<GestorRequirement, 'id' | 'createdAt'>) => void;
  updateRequirementStatus: (id: string, status: 'pending' | 'submitted' | 'approved', notes?: string, proofUrl?: string) => void;
  fileTaxDeclaration: (declarationId: string, filingRef: string) => void;
  calculateQuarterlyTaxes: (userId: string, quarter: string) => { model130: TaxDeclaration; model303: TaxDeclaration };
  getFiscalSummary: (userId: string) => FiscalSummary;
  getUsersByManager: (managerId: string) => User[];
  markPaymentAsReceived: (paymentId: string) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  dismissNotification: (id: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Users with realistic fiscal profiles
const MOCK_RIDERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Rider',
    email: 'alex@labora.plus',
    role: UserRole.RIDER,
    phone: '+34 612 345 678',
    nif: '48192834K',
    fiscalRegime: '036_037_directa',
    iaeCode: '849.5 - Servicios de mensajería y reparto',
    socialSecurityType: 'tarifa_plana',
    vehicleType: 'moto',
    vehiclePlate: '4521 LBR',
    vehicleFuel: 'gasolina',
    platforms: ['Uber Eats', 'Glovo', 'Stuart'],
    banks: ['BBVA', 'Revolut'],
    managerId: 'm1',
    countryCode: 'ES'
  },
  {
    id: 'u2',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    role: UserRole.RIDER,
    phone: '+34 689 912 341',
    nif: '52938102B',
    fiscalRegime: '036_037_directa',
    iaeCode: '849.5 - Servicios de mensajería y reparto',
    socialSecurityType: 'tramos_reales',
    vehicleType: 'moto',
    vehiclePlate: '7823 KTP',
    vehicleFuel: 'gasolina',
    platforms: ['Glovo', 'Just Eat'],
    banks: ['Santander'],
    managerId: 'm1',
    countryCode: 'ES'
  },
  {
    id: 'u3',
    name: 'Lucía Méndez',
    email: 'lucia.delivery@email.com',
    role: UserRole.RIDER,
    phone: '+34 644 112 233',
    nif: '74129845X',
    fiscalRegime: '036_037_directa',
    iaeCode: '849.5 - Servicios de mensajería y reparto',
    socialSecurityType: 'tarifa_plana',
    vehicleType: 'bici',
    vehiclePlate: '',
    vehicleFuel: 'electrico',
    platforms: ['Uber Eats', 'Amazon Flex'],
    banks: ['N26'],
    managerId: 'm1',
    countryCode: 'ES'
  }
];

const MOCK_MANAGER: User = {
  id: 'm1',
  name: 'Gestoría Fiscal Pérez & Asociados',
  companyName: 'Gestoría Pérez Asesores Tributarios S.L.',
  collegiateNumber: 'COL-MAD-9421',
  email: 'info@gestoriaperez.com',
  phone: '+34 910 234 567',
  nif: 'B-88349210',
  role: UserRole.MANAGER,
  platforms: [],
  banks: ['CaixaBank'],
  countryCode: 'ES'
};

const DEFAULT_VEHICLE: Vehicle = {
  type: 'moto',
  model: 'Honda PCX 125 ABS',
  plate: '4521 LBR',
  lastMaintenanceDate: '2026-08-10',
  lastMaintenanceKm: 14500,
  currentKm: 18200,
  nextMaintenanceKm: 20000
};

// Initial Realistic Fuel & Operating Expenses with Digital Proof Backups
const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    userId: 'u1',
    category: ExpenseCategory.GASOLINA,
    merchant: 'Repsol Estación de Servicio',
    date: '2026-09-14',
    amount: 45.50,
    fuelLitres: 28.2,
    fuelType: 'Gasolina 95',
    vatRate: 21,
    vatAmount: 7.90,
    deductiblePercentage: 100,
    status: 'approved',
    gestorNotes: 'Comprobante válido con NIF desglosado. Deducible 100% en IRPF e IVA por vehículo afecto.',
    notes: 'Llenado de depósito turno tarde/noche fin de semana (Madrid Centro)',
    invoiceNumber: 'REP-2026-98124',
    receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="%23FFFFFF"><rect width="400" height="600" fill="%23FFFBEB" stroke="%23D97706" stroke-width="4"/><text x="200" y="50" font-family="monospace" font-size="20" font-weight="bold" fill="%23B45309" text-anchor="middle">REPSOL ESTACIÓN 3421</text><text x="200" y="80" font-family="monospace" font-size="12" fill="%234B5563" text-anchor="middle">NIF: A-78129034 - Av. Principal 44</text><line x1="20" y1="100" x2="380" y2="100" stroke="%23D97706" stroke-dasharray="4"/><text x="40" y="140" font-family="monospace" font-size="14" fill="%231F2937">PRODUCTO: GASOLINA 95 PREMIUM</text><text x="40" y="170" font-family="monospace" font-size="14" fill="%231F2937">LITROS: 28.20 L x 1.613 €/L</text><text x="40" y="200" font-family="monospace" font-size="14" fill="%231F2937">BASE IMPONIBLE: 37.60 €</text><text x="40" y="230" font-family="monospace" font-size="14" fill="%231F2937">I.V.A. (21%): 7.90 €</text><text x="40" y="270" font-family="monospace" font-size="22" font-weight="bold" fill="%23B45309">TOTAL PAGADO: 45.50 €</text><text x="40" y="310" font-family="monospace" font-size="12" fill="%236B7280">MATRÍCULA: 4521 LBR</text><text x="40" y="340" font-family="monospace" font-size="12" fill="%236B7280">FECHA: 2026-09-14 19:42</text><line x1="20" y1="370" x2="380" y2="370" stroke="%23D97706" stroke-dasharray="4"/><text x="200" y="420" font-family="monospace" font-size="14" font-weight="bold" fill="%23059669" text-anchor="middle">VALIDADO POR GESTORÍA PÉREZ</text><text x="200" y="450" font-family="monospace" font-size="12" fill="%234B5563" text-anchor="middle">COPIA ELECTRÓNICA DE SEGURIDAD</text></svg>'
  },
  {
    id: 'exp-2',
    userId: 'u1',
    category: ExpenseCategory.GASOLINA,
    merchant: 'Cepsa (Moeve)',
    date: '2026-09-10',
    amount: 42.00,
    fuelLitres: 26.0,
    fuelType: 'Gasolina 95',
    vatRate: 21,
    vatAmount: 7.29,
    deductiblePercentage: 100,
    status: 'pending_review',
    notes: 'Repostaje antes de iniciar jornada de lluvia',
    invoiceNumber: 'CEP-8921-A',
    receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="%23FFFFFF"><rect width="400" height="600" fill="%23FEF2F2" stroke="%23EF4444" stroke-width="4"/><text x="200" y="50" font-family="monospace" font-size="20" font-weight="bold" fill="%23B91C1C" text-anchor="middle">CEPSA MOEVE 128</text><text x="200" y="80" font-family="monospace" font-size="12" fill="%234B5563" text-anchor="middle">NIF: B-81928374 - C/ Alcalá 210</text><line x1="20" y1="100" x2="380" y2="100" stroke="%23EF4444" stroke-dasharray="4"/><text x="40" y="140" font-family="monospace" font-size="14" fill="%231F2937">OPT. STAR 95: 26.00 L</text><text x="40" y="170" font-family="monospace" font-size="14" fill="%231F2937">PRECIO/L: 1.615 €</text><text x="40" y="200" font-family="monospace" font-size="14" fill="%231F2937">BASE: 34.71 € | IVA 21%: 7.29 €</text><text x="40" y="250" font-family="monospace" font-size="22" font-weight="bold" fill="%23DC2626">TOTAL: 42.00 €</text><text x="40" y="290" font-family="monospace" font-size="12" fill="%236B7280">FECHA: 2026-09-10 11:20</text><line x1="20" y1="330" x2="380" y2="330" stroke="%23EF4444" stroke-dasharray="4"/><text x="200" y="380" font-family="monospace" font-size="14" fill="%23D97706" text-anchor="middle">PENDIENTE DE REVISIÓN FISCAL</text></svg>'
  },
  {
    id: 'exp-2b',
    userId: 'u1',
    category: ExpenseCategory.GASOLINA,
    merchant: 'BP Estación de Servicio',
    date: '2026-09-05',
    amount: 38.50,
    fuelLitres: 23.8,
    fuelType: 'Gasolina 95',
    vatRate: 21,
    vatAmount: 6.68,
    deductiblePercentage: 100,
    status: 'approved',
    gestorNotes: 'Ticket correcto con CIF válido. 100% deducible.',
    notes: 'Turno matinal de reparto urbano (Madrid Norte)',
    invoiceNumber: 'BP-55210-C',
    receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="%23FFFFFF"><rect width="400" height="600" fill="%23F0FDF4" stroke="%2316A34A" stroke-width="4"/><text x="200" y="50" font-family="monospace" font-size="20" font-weight="bold" fill="%2315803D" text-anchor="middle">BP ESTACIÓN 912</text><text x="200" y="80" font-family="monospace" font-size="12" fill="%234B5563" text-anchor="middle">NIF: A-28049102 - Ctra. Burgos km 12</text><line x1="20" y1="100" x2="380" y2="100" stroke="%2316A34A" stroke-dasharray="4"/><text x="40" y="140" font-family="monospace" font-size="14" fill="%231F2937">BP ULTIMATE 95: 23.80 L</text><text x="40" y="170" font-family="monospace" font-size="14" fill="%231F2937">PRECIO/L: 1.618 €</text><text x="40" y="200" font-family="monospace" font-size="14" fill="%231F2937">BASE: 31.82 € | IVA 21%: 6.68 €</text><text x="40" y="250" font-family="monospace" font-size="22" font-weight="bold" fill="%2315803D">TOTAL: 38.50 €</text><text x="40" y="290" font-family="monospace" font-size="12" fill="%236B7280">MATRÍCULA: 4521 LBR</text><text x="40" y="320" font-family="monospace" font-size="12" fill="%236B7280">FECHA: 2026-09-05 09:15</text><line x1="20" y1="350" x2="380" y2="350" stroke="%2316A34A" stroke-dasharray="4"/><text x="200" y="400" font-family="monospace" font-size="14" font-weight="bold" fill="%23059669" text-anchor="middle">VALIDADO POR GESTORÍA PÉREZ</text></svg>'
  },
  {
    id: 'exp-3',
    userId: 'u1',
    category: ExpenseCategory.MANTENIMIENTO,
    merchant: 'Taller MotoFix Oficial',
    date: '2026-09-02',
    amount: 118.00,
    vatRate: 21,
    vatAmount: 20.48,
    deductiblePercentage: 100,
    status: 'approved',
    gestorNotes: 'Factura oficial con NIF. Pastillas de freno y cambio de aceite.',
    notes: 'Revisión y pastillas de freno Honda PCX',
    invoiceNumber: 'FAC-MF-2026-442'
  },
  {
    id: 'exp-4',
    userId: 'u1',
    category: ExpenseCategory.CUOTA_AUTONOMO,
    merchant: 'Seguridad Social (TGSS - RETA)',
    date: '2026-08-31',
    amount: 80.00,
    vatRate: 0,
    vatAmount: 0,
    deductiblePercentage: 100,
    status: 'approved',
    gestorNotes: 'Gasto no sujeto a IVA, deducible 100% en IRPF Modelo 130.',
    notes: 'Cuota reducida autónomo tarifa plana primer año'
  },
  {
    id: 'exp-5',
    userId: 'u1',
    category: ExpenseCategory.MOVIL,
    merchant: 'Vodafone Empresas',
    date: '2026-09-01',
    amount: 29.90,
    vatRate: 21,
    vatAmount: 5.19,
    deductiblePercentage: 100,
    status: 'approved',
    gestorNotes: 'Línea profesional dedicada a las apps de reparto.',
    notes: 'Plan ilimitado 5G para navegación y apps de rider'
  }
];

// Initial Realistic Incomes from Delivery Platforms
const INITIAL_INCOMES: Income[] = [
  {
    id: 'inc-1',
    userId: 'u1',
    platform: 'Uber Eats',
    date: '2026-09-12',
    amount: 410.50,
    retention: 0
  },
  {
    id: 'inc-2',
    userId: 'u1',
    platform: 'Glovo',
    date: '2026-09-05',
    amount: 385.00,
    retention: 0
  },
  {
    id: 'inc-3',
    userId: 'u1',
    platform: 'Stuart',
    date: '2026-08-28',
    amount: 215.20,
    retention: 0
  },
  {
    id: 'inc-4',
    userId: 'u1',
    platform: 'Uber Eats',
    date: '2026-08-21',
    amount: 395.00,
    retention: 0
  },
  {
    id: 'inc-5',
    userId: 'u1',
    platform: 'Glovo',
    date: '2026-08-16',
    amount: 360.00,
    retention: 0
  }
];

// Initial Requirements between Gestor and Rider
const INITIAL_REQUIREMENTS: GestorRequirement[] = [
  {
    id: 'req-1',
    managerId: 'm1',
    managerName: 'Gestoría Fiscal Pérez',
    riderId: 'u1',
    riderName: 'Alex Rider',
    title: 'Ticket de repostaje Cepsa del 10/09 (42,00 €)',
    description: 'Hemos detectado el movimiento pero falta la foto con buena nitidez para confirmar el CIF de la estación y deducir el IVA.',
    category: 'fuel_receipt',
    deadline: '2026-09-22',
    status: 'pending',
    createdAt: '2026-09-11',
    quarter: '3T 2026'
  },
  {
    id: 'req-2',
    managerId: 'm1',
    managerName: 'Gestoría Fiscal Pérez',
    riderId: 'u1',
    riderName: 'Alex Rider',
    title: 'Auto-factura Glovo 1ª Quincena Septiembre',
    description: 'Por favor descarga el PDF emitido en la app de Glovo de la quincena 1-15 y súbelo para cotejar la base imponible.',
    category: 'platform_invoice',
    deadline: '2026-09-20',
    status: 'submitted',
    submissionNotes: 'Auto-factura subida correctamente a documentos.',
    createdAt: '2026-09-06',
    quarter: '3T 2026'
  },
  {
    id: 'req-3',
    managerId: 'm1',
    managerName: 'Gestoría Fiscal Pérez',
    riderId: 'u1',
    riderName: 'Alex Rider',
    title: 'Preparación Cierre 3T (Modelo 130 y Modelo 303)',
    description: 'El plazo de presentación finaliza el 20 de octubre. Revisa los gastos registrados para no dejar ningún ticket de gasolina fuera.',
    category: 'other',
    deadline: '2026-10-15',
    status: 'pending',
    createdAt: '2026-09-14',
    quarter: '3T 2026'
  }
];

// Initial Official Declarations
const INITIAL_DECLARATIONS: TaxDeclaration[] = [
  {
    id: 'dec-1',
    userId: 'u1',
    quarter: '1T 2026',
    year: 2026,
    modelType: '130',
    title: 'Modelo 130 - Pago Fraccionado IRPF 1T',
    grossIncome: 4250.00,
    deductibleExpenses: 1120.00,
    netYield: 3130.00,
    taxAmount: 626.00,
    status: 'filed_with_tax_agency',
    filingReference: 'AEAT-130-2026-881923X',
    filedAt: '2026-04-18',
    gestorId: 'm1'
  },
  {
    id: 'dec-2',
    userId: 'u1',
    quarter: '1T 2026',
    year: 2026,
    modelType: '303',
    title: 'Modelo 303 - Autoliquidación IVA 1T',
    grossIncome: 4250.00,
    deductibleExpenses: 1120.00,
    netYield: 3130.00,
    taxAmount: 185.40,
    status: 'filed_with_tax_agency',
    filingReference: 'AEAT-303-2026-773412B',
    filedAt: '2026-04-18',
    gestorId: 'm1'
  },
  {
    id: 'dec-3',
    userId: 'u1',
    quarter: '2T 2026',
    year: 2026,
    modelType: '130',
    title: 'Modelo 130 - Pago Fraccionado IRPF 2T',
    grossIncome: 4680.00,
    deductibleExpenses: 1240.00,
    netYield: 3440.00,
    taxAmount: 688.00,
    status: 'filed_with_tax_agency',
    filingReference: 'AEAT-130-2026-990145Y',
    filedAt: '2026-07-16',
    gestorId: 'm1'
  },
  {
    id: 'dec-4',
    userId: 'u1',
    quarter: '2T 2026',
    year: 2026,
    modelType: '303',
    title: 'Modelo 303 - Autoliquidación IVA 2T',
    grossIncome: 4680.00,
    deductibleExpenses: 1240.00,
    netYield: 3440.00,
    taxAmount: 212.80,
    status: 'filed_with_tax_agency',
    filingReference: 'AEAT-303-2026-661209C',
    filedAt: '2026-07-16',
    gestorId: 'm1'
  },
  {
    id: 'dec-5',
    userId: 'u1',
    quarter: '3T 2026',
    year: 2026,
    modelType: '130',
    title: 'Modelo 130 - Pago Fraccionado IRPF 3T (En Curso)',
    grossIncome: 1765.70,
    deductibleExpenses: 315.40,
    netYield: 1450.30,
    taxAmount: 290.06,
    status: 'reviewed_by_gestor',
    gestorId: 'm1'
  },
  {
    id: 'dec-6',
    userId: 'u1',
    quarter: '3T 2026',
    year: 2026,
    modelType: '303',
    title: 'Modelo 303 - Autoliquidación IVA 3T (En Curso)',
    grossIncome: 1765.70,
    deductibleExpenses: 315.40,
    netYield: 1450.30,
    taxAmount: 94.20,
    status: 'reviewed_by_gestor',
    gestorId: 'm1'
  }
];

const generateMockPayments = (): Payment[] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const fmtDate = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return [
    { id: 'p1', platform: 'Uber Eats', amount: 240.50, date: fmtDate(5), status: 'received', estimated: false, domain: 'ubereats.com' },
    { id: 'p2', platform: 'Glovo', amount: 180.00, date: fmtDate(12), status: 'received', estimated: false, domain: 'glovoapp.com' },
    { id: 'p3', platform: 'Stuart', amount: 150.00, date: fmtDate(15), status: 'received', estimated: false, domain: 'stuart.com' },
    { id: 'p4', platform: 'Uber Eats', amount: 225.00, date: fmtDate(19), status: 'pending', estimated: true, domain: 'ubereats.com' },
    { id: 'p5', platform: 'Glovo', amount: 195.00, date: fmtDate(26), status: 'pending', estimated: true, domain: 'glovoapp.com' },
    { id: 'p6', platform: 'Just Eat', amount: 130.00, date: fmtDate(28), status: 'pending', estimated: true, domain: 'just-eat.es' },
  ];
};

export const DataProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_RIDERS[0]);
  const [users, setUsers] = useState<User[]>([...MOCK_RIDERS, MOCK_MANAGER]);
  const [incomes, setIncomes] = useState<Income[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>(generateMockPayments());
  const [requirements, setRequirements] = useState<GestorRequirement[]>(INITIAL_REQUIREMENTS);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>(INITIAL_DECLARATIONS);
  const [vehicle, setVehicle] = useState<Vehicle | null>(DEFAULT_VEHICLE);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const storedIncomes = localStorage.getItem('labora_incomes');
      const storedExpenses = localStorage.getItem('labora_expenses');
      const storedDocs = localStorage.getItem('labora_docs');
      const storedOnboarding = localStorage.getItem('labora_onboarding');
      const storedPayments = localStorage.getItem('labora_payments');
      const storedRequirements = localStorage.getItem('labora_requirements');
      const storedDeclarations = localStorage.getItem('labora_declarations');
      const storedUsers = localStorage.getItem('labora_users');
      const storedVehicle = localStorage.getItem('labora_vehicle');
      const storedUser = localStorage.getItem('labora_user');
      const storedPrivacy = localStorage.getItem('labora_privacy');
      const storedDarkMode = localStorage.getItem('labora_darkmode');

      if (storedIncomes) setIncomes(JSON.parse(storedIncomes));
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedDocs) setDocuments(JSON.parse(storedDocs));
      if (storedRequirements) setRequirements(JSON.parse(storedRequirements));
      if (storedDeclarations) setDeclarations(JSON.parse(storedDeclarations));
      if (storedPayments) setPayments(JSON.parse(storedPayments));
      if (storedVehicle) setVehicle(JSON.parse(storedVehicle));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedOnboarding === 'true') setHasOnboarded(true);
      if (storedPrivacy === 'true') setPrivacyMode(true);
      if (storedDarkMode === 'true') {
        setDarkMode(true);
        document.body.classList.add('dark');
      }

      if (storedUser) {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
      }
    };
    loadData();
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (incomes.length > 0) localStorage.setItem('labora_incomes', JSON.stringify(incomes));
    if (expenses.length > 0) localStorage.setItem('labora_expenses', JSON.stringify(expenses));
    if (documents.length > 0) localStorage.setItem('labora_docs', JSON.stringify(documents));
    if (requirements.length > 0) localStorage.setItem('labora_requirements', JSON.stringify(requirements));
    if (declarations.length > 0) localStorage.setItem('labora_declarations', JSON.stringify(declarations));
    if (payments.length > 0) localStorage.setItem('labora_payments', JSON.stringify(payments));
    if (users.length > 0) localStorage.setItem('labora_users', JSON.stringify(users));
    if (vehicle) localStorage.setItem('labora_vehicle', JSON.stringify(vehicle));
    if (currentUser) localStorage.setItem('labora_user', JSON.stringify(currentUser));
    localStorage.setItem('labora_onboarding', String(hasOnboarded));
    localStorage.setItem('labora_privacy', String(privacyMode));
    localStorage.setItem('labora_darkmode', String(darkMode));
  }, [incomes, expenses, documents, requirements, declarations, payments, users, vehicle, currentUser, hasOnboarded, privacyMode, darkMode]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const login = (email: string, role: UserRole) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (found) {
      setCurrentUser(found);
      showNotification('success', `Bienvenido, ${found.name}`);
    } else {
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email,
        role,
        nif: role === UserRole.RIDER ? '48192834K' : 'B-88349210',
        fiscalRegime: role === UserRole.RIDER ? '036_037_directa' : undefined,
        iaeCode: role === UserRole.RIDER ? '849.5 - Servicios de mensajería y reparto' : undefined,
        socialSecurityType: role === UserRole.RIDER ? 'tarifa_plana' : undefined,
        vehicleType: role === UserRole.RIDER ? 'moto' : undefined,
        vehiclePlate: role === UserRole.RIDER ? '4521 LBR' : undefined,
        vehicleFuel: role === UserRole.RIDER ? 'gasolina' : undefined,
        companyName: role === UserRole.MANAGER ? `${email.split('@')[0]} Asesoría Fiscal` : undefined,
        platforms: role === UserRole.RIDER ? ['Uber Eats', 'Glovo'] : [],
        banks: ['BBVA'],
        managerId: role === UserRole.RIDER ? 'm1' : undefined,
        countryCode: 'ES'
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      showNotification('success', 'Cuenta creada y configurada correctamente');
    }
  };

  const registerUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: userData.name || 'Usuario',
      email: userData.email || `usuario_${Date.now()}@labora.plus`,
      role: userData.role || UserRole.RIDER,
      phone: userData.phone,
      nif: userData.nif || 'Sin NIF registrado',
      fiscalRegime: userData.fiscalRegime || '036_037_directa',
      iaeCode: userData.iaeCode || '849.5 - Servicios de mensajería y reparto',
      socialSecurityType: userData.socialSecurityType || 'tarifa_plana',
      vehicleType: userData.vehicleType || 'moto',
      vehiclePlate: userData.vehiclePlate || '',
      vehicleFuel: userData.vehicleFuel || 'gasolina',
      companyName: userData.companyName,
      collegiateNumber: userData.collegiateNumber,
      platforms: userData.platforms || ['Uber Eats'],
      banks: userData.banks || ['BBVA'],
      managerId: userData.managerId || (userData.role === UserRole.RIDER ? 'm1' : undefined),
      countryCode: userData.countryCode || 'ES'
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setHasOnboarded(true);
    showNotification('success', `¡Registro completado! Bienvenido a Labora+, ${newUser.name}`);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      showNotification('info', `Cambiado a perfil: ${target.name} (${target.role})`);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('labora_user');
    showNotification('info', 'Sesión cerrada');
  };

  const updateUserConfig = (platforms: string[], banks: string[]) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, platforms, banks };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    showNotification('success', 'Plataformas actualizadas');
  };

  const updateUserFiscalProfile = (profileData: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...profileData };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    showNotification('success', 'Perfil fiscal y datos de autónomo actualizados');
  };

  const completeOnboarding = () => {
    setHasOnboarded(true);
    showNotification('success', '¡Configuración completada!');
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(prev => {
      const newVal = !prev;
      showNotification('info', newVal ? 'Modo Discreto Activado' : 'Modo Discreto Desactivado');
      return newVal;
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      showNotification('info', newVal ? 'Modo Oscuro Activado' : 'Modo Claro Activado');
      return newVal;
    });
  };

  const addIncome = (inc: Omit<Income, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newIncome: Income = {
      ...inc,
      id: 'inc_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id
    };
    setIncomes(prev => [newIncome, ...prev]);
    showNotification('success', `Ingreso de ${newIncome.amount}€ registrado desde ${newIncome.platform}`);
  };

  const addIncomes = (incs: Omit<Income, 'id' | 'userId'>[]) => {
    if (!currentUser) return;
    const newIncomes = incs.map(inc => ({
      ...inc,
      id: 'inc_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id
    }));
    setIncomes(prev => [...newIncomes, ...prev]);
    showNotification('success', `${incs.length} ingresos importados`);
  };

  const addExpense = (exp: Omit<Expense, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const vatRate = exp.vatRate ?? (exp.category === ExpenseCategory.GASOLINA ? 21 : 21);
    const vatAmount = exp.vatAmount ?? (vatRate > 0 ? Number(((exp.amount * vatRate) / (100 + vatRate)).toFixed(2)) : 0);

    const newExpense: Expense = {
      ...exp,
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      status: exp.status || 'pending_review',
      vatRate,
      vatAmount,
      deductiblePercentage: exp.deductiblePercentage ?? 100
    };

    setExpenses(prev => [newExpense, ...prev]);
    showNotification('success', `Gasto de ${newExpense.amount}€ registrado con comprobante digitalizado`);
  };

  const addExpenses = (exps: Omit<Expense, 'id' | 'userId'>[]) => {
    if (!currentUser) return;
    const newExpenses = exps.map(exp => ({
      ...exp,
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      status: exp.status || 'pending_review'
    }));
    setExpenses(prev => [...newExpenses, ...prev]);
    showNotification('success', `${exps.length} gastos guardados`);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
    showNotification('success', 'Gasto actualizado');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showNotification('info', 'Gasto eliminado');
  };

  const updateExpenseAudit = (
    expenseId: string, 
    status: 'pending_review' | 'approved' | 'rejected' | 'needs_fix', 
    gestorNotes?: string
  ) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === expenseId) {
        return {
          ...exp,
          status,
          gestorNotes: gestorNotes !== undefined ? gestorNotes : exp.gestorNotes
        };
      }
      return exp;
    }));

    const statusLabels: Record<string, string> = {
      approved: 'Gasto Aprobado y Validado para Hacienda',
      rejected: 'Gasto Marcado como No Deducible',
      needs_fix: 'Gasto con Requerimiento de Subsanación',
      pending_review: 'Gasto en Revisión'
    };

    showNotification('info', statusLabels[status] || 'Estado de gasto actualizado');
  };

  const addDocument = (doc: Omit<Document, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newDoc: Document = {
      ...doc,
      id: 'doc_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id
    };
    setDocuments(prev => [newDoc, ...prev]);
    showNotification('success', `Documento "${newDoc.name}" archivado con éxito`);
  };

  const updateVehicle = (vehicleData: Vehicle) => {
    setVehicle(vehicleData);
    showNotification('success', 'Datos del vehículo actualizados');
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: 'pay_' + Math.random().toString(36).substr(2, 9)
    };
    setPayments(prev => [...prev, newPayment]);
    showNotification('success', 'Pago previsto añadido');
  };

  const markPaymentAsReceived = (paymentId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        if (p.status === 'pending' && currentUser) {
          const newIncome: Income = {
            id: 'inc_' + Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            platform: p.platform,
            amount: p.amount,
            date: new Date().toISOString().split('T')[0],
            retention: 0
          };
          setIncomes(current => [newIncome, ...current]);
        }
        return { ...p, status: 'received', estimated: false };
      }
      return p;
    }));
    showNotification('success', 'Pago marcado como recibido e ingresado en finanzas');
  };

  const addRequirement = (req: Omit<GestorRequirement, 'id' | 'createdAt'>) => {
    const newReq: GestorRequirement = {
      ...req,
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRequirements(prev => [newReq, ...prev]);
    showNotification('success', `Requerimiento enviado al rider ${req.riderName}`);
  };

  const updateRequirementStatus = (
    id: string, 
    status: 'pending' | 'submitted' | 'approved', 
    notes?: string, 
    proofUrl?: string
  ) => {
    setRequirements(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          submissionNotes: notes || r.submissionNotes,
          submissionUrl: proofUrl || r.submissionUrl
        };
      }
      return r;
    }));

    if (status === 'submitted') {
      showNotification('success', 'Justificante enviado al gestor para revisión');
    } else if (status === 'approved') {
      showNotification('success', 'Requerimiento marcado como resuelto por el gestor');
    }
  };

  const fileTaxDeclaration = (declarationId: string, filingRef: string) => {
    setDeclarations(prev => prev.map(dec => {
      if (dec.id === declarationId) {
        return {
          ...dec,
          status: 'filed_with_tax_agency',
          filingReference: filingRef,
          filedAt: new Date().toISOString().split('T')[0]
        };
      }
      return dec;
    }));
    showNotification('success', `Declaración presentada con justificante AEAT: ${filingRef}`);
  };

  const calculateQuarterlyTaxes = (userId: string, quarter: string) => {
    const userIncomes = incomes.filter(i => i.userId === userId);
    const userExpenses = expenses.filter(e => e.userId === userId && e.status !== 'rejected');

    const totalGross = userIncomes.reduce((s, i) => s + i.amount, 0);
    const totalDeductible = userExpenses.reduce((s, e) => s + (e.amount * (e.deductiblePercentage ?? 100) / 100), 0);
    const netYield = Math.max(0, totalGross - totalDeductible);
    
    // Model 130: 20% on net yield
    const model130Tax = Number((netYield * 0.20).toFixed(2));

    // Model 303: VAT output (if applicable, e.g. 21%) - deductible input VAT
    const deductibleVAT = userExpenses.reduce((s, e) => s + (e.vatAmount || 0), 0);
    const model303Tax = Number(Math.max(0, (totalGross * 0.21) - deductibleVAT).toFixed(2));

    const model130: TaxDeclaration = {
      id: `dec_130_${userId}_${quarter}`,
      userId,
      quarter,
      year: new Date().getFullYear(),
      modelType: '130',
      title: `Modelo 130 - Pago Fraccionado IRPF (${quarter})`,
      grossIncome: totalGross,
      deductibleExpenses: totalDeductible,
      netYield,
      taxAmount: model130Tax,
      status: 'reviewed_by_gestor',
      gestorId: currentUser?.role === UserRole.MANAGER ? currentUser.id : 'm1'
    };

    const model303: TaxDeclaration = {
      id: `dec_303_${userId}_${quarter}`,
      userId,
      quarter,
      year: new Date().getFullYear(),
      modelType: '303',
      title: `Modelo 303 - Autoliquidación IVA (${quarter})`,
      grossIncome: totalGross,
      deductibleExpenses: totalDeductible,
      netYield,
      taxAmount: model303Tax,
      status: 'reviewed_by_gestor',
      gestorId: currentUser?.role === UserRole.MANAGER ? currentUser.id : 'm1'
    };

    return { model130, model303 };
  };

  const getFiscalSummary = (userId: string): FiscalSummary => {
    const userIncomes = incomes.filter(i => i.userId === userId);
    const userExpenses = expenses.filter(e => e.userId === userId && e.status !== 'rejected');

    const totalIncome = userIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = userExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    
    const estimatedIRPF = Math.max(0, netProfit * 0.20); 

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      estimatedIRPF,
      quarter: '3T 2026'
    };
  };

  const getUsersByManager = (managerId: string): User[] => {
    return users.filter(u => u.managerId === managerId && u.role === UserRole.RIDER);
  };

  const exportData = () => {
    const data = { incomes, expenses, documents, requirements, declarations, vehicle, payments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `labora_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Copia de seguridad fiscal descargada');
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.incomes) setIncomes(data.incomes);
      if (data.expenses) setExpenses(data.expenses);
      if (data.documents) setDocuments(data.documents);
      if (data.requirements) setRequirements(data.requirements);
      if (data.declarations) setDeclarations(data.declarations);
      if (data.vehicle) setVehicle(data.vehicle);
      if (data.payments) setPayments(data.payments);
      showNotification('success', 'Datos restaurados correctamente');
    } catch (e) {
      showNotification('error', 'Archivo de copia de seguridad inválido');
    }
  };

  const value = {
    currentUser,
    users,
    incomes,
    expenses,
    documents,
    payments,
    requirements,
    declarations,
    vehicle,
    hasOnboarded,
    privacyMode,
    darkMode,
    notifications,
    togglePrivacyMode,
    toggleDarkMode,
    completeOnboarding,
    login,
    logout,
    registerUser,
    switchUser,
    updateUserConfig,
    updateUserFiscalProfile,
    addIncome,
    addIncomes,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
    updateExpenseAudit,
    addDocument,
    addPayment,
    updateVehicle,
    addRequirement,
    updateRequirementStatus,
    fileTaxDeclaration,
    calculateQuarterlyTaxes,
    getFiscalSummary,
    getUsersByManager,
    markPaymentAsReceived,
    showNotification,
    dismissNotification,
    exportData,
    importData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
