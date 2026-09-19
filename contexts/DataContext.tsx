import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  Document,
  Expense,
  ExpenseCategory,
  FiscalSummary,
  GestorRequirement,
  Income,
  Notification,
  Payment,
  TaxDeclaration,
  User,
  UserRole,
  Vehicle
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
  updateExpenseAudit: (
    expenseId: string,
    status: 'pending_review' | 'approved' | 'rejected' | 'needs_fix',
    gestorNotes?: string
  ) => void;
  addDocument: (doc: Omit<Document, 'id' | 'userId'>) => Document | undefined;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updateVehicle: (vehicleData: Vehicle) => void;
  addRequirement: (req: Omit<GestorRequirement, 'id' | 'createdAt'>) => void;
  submitRequirement: (
    id: string,
    notes?: string,
    proofUrl?: string
  ) => void;
  reviewRequirement: (
    id: string,
    status: 'approved',
    note?: string
  ) => void;
  saveTaxDeclarationDraft: (declaration: TaxDeclaration) => void;
  reviewTaxDeclaration: (declarationId: string, note?: string) => void;
  fileTaxDeclaration: (declarationId: string, filingRef: string, evidenceUrl?: string) => void;
  calculateQuarterlyTaxes: (
    userId: string,
    quarter: string
  ) => { model130: TaxDeclaration; model303: TaxDeclaration };
  getFiscalSummary: (userId: string) => FiscalSummary;
  getUsersByManager: (managerId: string) => User[];
  markPaymentAsReceived: (paymentId: string) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  dismissNotification: (id: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE = {
  users: 'labora_users',
  currentUser: 'labora_user',
  incomes: 'labora_incomes',
  expenses: 'labora_expenses',
  documents: 'labora_docs',
  payments: 'labora_payments',
  requirements: 'labora_requirements',
  declarations: 'labora_declarations',
  vehicle: 'labora_vehicle',
  onboarded: 'labora_onboarding',
  privacy: 'labora_privacy',
  darkMode: 'labora_darkmode'
} as const;

const LEGACY_OPERATIONAL_KEYS = [
  STORAGE.incomes,
  STORAGE.expenses,
  STORAGE.documents,
  STORAGE.payments,
  STORAGE.requirements,
  STORAGE.declarations
] as const;

const scopedKey = (base: string, userId: string) => `${base}:${userId}`;

const parseStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const purgeLegacyOperationalKeys = () => {
  for (const key of LEGACY_OPERATIONAL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
};

const clearScopedOperationalKeys = (userId: string) => {
  for (const key of LEGACY_OPERATIONAL_KEYS) {
    try {
      localStorage.removeItem(scopedKey(key, userId));
    } catch {
      /* ignore */
    }
  }
};

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

const getQuarterRange = (quarter: string) => {
  const match = quarter.match(/([1-4])T\s+(\d{4})/i);
  if (!match) return null;
  const q = Number(match[1]);
  const year = Number(match[2]);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  return { year, startMonth, endMonth };
};

const dateInQuarter = (date: string, quarter: string) => {
  const range = getQuarterRange(quarter);
  if (!range) return true;
  const [year, month] = date.split('-').map(Number);
  return year === range.year && month >= range.startMonth && month <= range.endMonth;
};

export const DataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    purgeLegacyOperationalKeys();
    return parseStored<User | null>(STORAGE.currentUser, null);
  });
  const [users, setUsers] = useState<User[]>(() => parseStored<User[]>(STORAGE.users, []));
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const user = parseStored<User | null>(STORAGE.currentUser, null);
    return user ? parseStored<Income[]>(scopedKey(STORAGE.incomes, user.id), []) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const user = parseStored<User | null>(STORAGE.currentUser, null);
    return user ? parseStored<Expense[]>(scopedKey(STORAGE.expenses, user.id), []) : [];
  });
  const [documents, setDocuments] = useState<Document[]>(() => {
    const user = parseStored<User | null>(STORAGE.currentUser, null);
    return user ? parseStored<Document[]>(scopedKey(STORAGE.documents, user.id), []) : [];
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const user = parseStored<User | null>(STORAGE.currentUser, null);
    return user ? parseStored<Payment[]>(scopedKey(STORAGE.payments, user.id), []) : [];
  });
  const [requirements, setRequirements] = useState<GestorRequirement[]>(() => {
    const user = parseStored<User | null>(STORAGE.currentUser, null);
    return user ? parseStored<GestorRequirement[]>(scopedKey(STORAGE.requirements, user.id), []) : [];
  });
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>(() => {
    const user = parseStored<User | null>(STORAGE.currentUser, null);
    return user ? parseStored<TaxDeclaration[]>(scopedKey(STORAGE.declarations, user.id), []) : [];
  });
  const [vehicle, setVehicle] = useState<Vehicle | null>(() => parseStored<Vehicle | null>(STORAGE.vehicle, null));
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem(STORAGE.onboarded) === 'true');
  const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem(STORAGE.privacy) === 'true');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(STORAGE.darkMode) === 'true');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    purgeLegacyOperationalKeys();
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
    localStorage.setItem(STORAGE.onboarded, String(hasOnboarded));
    localStorage.setItem(STORAGE.privacy, String(privacyMode));
    localStorage.setItem(STORAGE.darkMode, String(darkMode));

    if (vehicle) localStorage.setItem(STORAGE.vehicle, JSON.stringify(vehicle));
    else localStorage.removeItem(STORAGE.vehicle);

    if (currentUser) {
      localStorage.setItem(STORAGE.currentUser, JSON.stringify(currentUser));
      localStorage.setItem(scopedKey(STORAGE.incomes, currentUser.id), JSON.stringify(incomes));
      localStorage.setItem(scopedKey(STORAGE.expenses, currentUser.id), JSON.stringify(expenses));
      localStorage.setItem(scopedKey(STORAGE.documents, currentUser.id), JSON.stringify(documents));
      localStorage.setItem(scopedKey(STORAGE.payments, currentUser.id), JSON.stringify(payments));
      localStorage.setItem(scopedKey(STORAGE.requirements, currentUser.id), JSON.stringify(requirements));
      localStorage.setItem(scopedKey(STORAGE.declarations, currentUser.id), JSON.stringify(declarations));
    } else {
      localStorage.removeItem(STORAGE.currentUser);
    }
  }, [users, incomes, expenses, documents, payments, requirements, declarations, vehicle, currentUser, hasOnboarded, privacyMode, darkMode]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = createId('notice');
    setNotifications((previous) => [...previous, { id, type, message }]);
    window.setTimeout(() => {
      setNotifications((previous) => previous.filter((notification) => notification.id !== id));
    }, 3500);
  };

  const dismissNotification = (id: string) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  };

  const login = (email: string, role: UserRole) => {
    const normalized = email.trim().toLowerCase();
    const account = users.find(
      (user) => user.email.toLowerCase() === normalized && user.role === role
    );

    if (!account) {
      showNotification('error', 'No se ha encontrado esa cuenta.');
      return;
    }

    setCurrentUser(account);
    setHasOnboarded(true);
    showNotification('success', `Bienvenido, ${account.name}`);
  };

  const registerUser = (userData: Partial<User>) => {
    const role = userData.role || UserRole.RIDER;
    const manager = users.find((user) => user.role === UserRole.MANAGER);

    const newUser: User = {
      id: createId(role === UserRole.MANAGER ? 'manager' : 'user'),
      name: userData.name?.trim() || 'Usuario',
      email: userData.email?.trim().toLowerCase() || `usuario_${Date.now()}@local`,
      phone: userData.phone,
      role,
      platforms: userData.platforms || [],
      banks: userData.banks || [],
      managerId: role === UserRole.RIDER ? (userData.managerId || manager?.id) : undefined,
      currencyPreference: userData.currencyPreference || 'EUR',
      notificationSettings: userData.notificationSettings,
      nif: userData.nif,
      fiscalRegime: userData.fiscalRegime,
      iaeCode: userData.iaeCode,
      socialSecurityType: userData.socialSecurityType,
      vehicleType: userData.vehicleType,
      vehiclePlate: userData.vehiclePlate,
      vehicleFuel: userData.vehicleFuel,
      companyName: userData.companyName,
      collegiateNumber: userData.collegiateNumber,
      countryCode: userData.countryCode || 'ES',
      organizationId: userData.organizationId
    };

    setUsers((previous) => [...previous, newUser]);
    setCurrentUser(newUser);
    setHasOnboarded(true);
    showNotification('success', 'Cuenta creada correctamente.');
  };

  const switchUser = (userId: string) => {
    const account = users.find((user) => user.id === userId);
    if (account) setCurrentUser(account);
  };

  const logout = () => {
    const previousUserId = currentUser?.id;
    setCurrentUser(null);
    setIncomes([]);
    setExpenses([]);
    setDocuments([]);
    setPayments([]);
    setRequirements([]);
    setDeclarations([]);
    if (previousUserId) clearScopedOperationalKeys(previousUserId);
    purgeLegacyOperationalKeys();
    showNotification('info', 'Sesión cerrada.');
  };

  const updateUserConfig = (platforms: string[], banks: string[]) => {
    if (!currentUser) return;
    const updated = { ...currentUser, platforms, banks };
    setCurrentUser(updated);
    setUsers((previous) => previous.map((user) => user.id === updated.id ? updated : user));
    showNotification('success', 'Configuración actualizada.');
  };

  const updateUserFiscalProfile = (profileData: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...profileData };
    setCurrentUser(updated);
    setUsers((previous) => previous.map((user) => user.id === updated.id ? updated : user));
    showNotification('success', 'Perfil actualizado.');
  };

  const completeOnboarding = () => {
    setHasOnboarded(true);
  };

  const togglePrivacyMode = () => setPrivacyMode((value) => !value);
  const toggleDarkMode = () => setDarkMode((value) => !value);

  const addIncome = (income: Omit<Income, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newIncome: Income = {
      ...income,
      id: createId('income'),
      userId: currentUser.id,
      sourceType: income.sourceType || 'manual',
      needsReview: income.needsReview ?? false
    };
    setIncomes((previous) => [newIncome, ...previous]);
    showNotification('success', 'Ingreso registrado.');
  };

  const addIncomes = (items: Omit<Income, 'id' | 'userId'>[]) => {
    if (!currentUser) return;
    const newItems = items.map((income) => ({
      ...income,
      id: createId('income'),
      userId: currentUser.id,
      sourceType: income.sourceType || 'manual',
      needsReview: income.needsReview ?? true
    }));
    setIncomes((previous) => [...newItems, ...previous]);
    showNotification('success', `${newItems.length} ingresos importados.`);
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const vatRate = expense.vatRate ?? 0;
    const vatAmount = expense.vatAmount ?? 0;
    const newExpense: Expense = {
      ...expense,
      id: createId('expense'),
      userId: currentUser.id,
      status: expense.status || 'pending_review',
      vatRate,
      vatAmount,
      deductiblePercentage: expense.deductiblePercentage ?? 0,
      ocrNeedsReview: expense.ocrNeedsReview ?? true
    };
    setExpenses((previous) => [newExpense, ...previous]);
    showNotification('success', 'Gasto registrado.');
  };

  const addExpenses = (items: Omit<Expense, 'id' | 'userId'>[]) => {
    if (!currentUser) return;
    const newItems = items.map((expense) => ({
      ...expense,
      id: createId('expense'),
      userId: currentUser.id,
      status: expense.status || 'pending_review' as const,
      vatRate: expense.vatRate ?? 0,
      vatAmount: expense.vatAmount ?? 0,
      deductiblePercentage: expense.deductiblePercentage ?? 0,
      ocrNeedsReview: expense.ocrNeedsReview ?? true
    }));
    setExpenses((previous) => [...newItems, ...previous]);
    showNotification('success', `${newItems.length} gastos importados.`);
  };

  const updateExpense = (expense: Expense) => {
    setExpenses((previous) => previous.map((item) => item.id === expense.id ? expense : item));
    showNotification('success', 'Gasto actualizado.');
  };

  const deleteExpense = (id: string) => {
    setExpenses((previous) => previous.filter((expense) => expense.id !== id));
    showNotification('info', 'Gasto eliminado.');
  };

  const updateExpenseAudit = (
    expenseId: string,
    status: 'pending_review' | 'approved' | 'rejected' | 'needs_fix',
    gestorNotes?: string
  ) => {
    setExpenses((previous) => previous.map((expense) =>
      expense.id === expenseId ? { ...expense, status, gestorNotes: gestorNotes ?? expense.gestorNotes } : expense
    ));
    showNotification('success', 'Estado de auditoría actualizado.');
  };

  const addDocument = (doc: Omit<Document, 'id' | 'userId'>) => {
    if (!currentUser) return undefined;
    const newDocument: Document = { ...doc, id: createId('document'), userId: currentUser.id };
    setDocuments((previous) => [newDocument, ...previous]);
    showNotification('success', 'Documento guardado.');
    return newDocument;
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    setPayments((previous) => [{ ...payment, id: createId('payment') }, ...previous]);
  };

  const updateVehicle = (vehicleData: Vehicle) => {
    setVehicle(vehicleData);
    showNotification('success', 'Vehículo actualizado.');
  };

  const addRequirement = (requirement: Omit<GestorRequirement, 'id' | 'createdAt'>) => {
    const newRequirement: GestorRequirement = {
      ...requirement,
      id: createId('requirement'),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRequirements((previous) => [newRequirement, ...previous]);
    showNotification('success', 'Petición enviada.');
  };

  const submitRequirement = (
    id: string,
    notes?: string,
    proofUrl?: string
  ) => {
    if (!currentUser || currentUser.role !== UserRole.RIDER) return;
    setRequirements((previous) => previous.map((requirement) =>
      requirement.id === id && requirement.riderId === currentUser.id && requirement.status === 'pending'
        ? {
            ...requirement,
            status: 'submitted',
            submissionNotes: notes ?? requirement.submissionNotes,
            submissionUrl: proofUrl ?? requirement.submissionUrl,
            submittedAt: new Date().toISOString()
          }
        : requirement
    ));
    showNotification('success', 'Respuesta enviada a tu gestoría.');
  };

  const reviewRequirement = (
    id: string,
    status: 'approved',
    note?: string
  ) => {
    if (!currentUser || (currentUser.role !== UserRole.MANAGER && currentUser.role !== UserRole.ADMIN)) return;
    setRequirements((previous) => previous.map((requirement) =>
      requirement.id === id && requirement.managerId === currentUser.id && requirement.status === 'submitted'
        ? {
            ...requirement,
            status,
            reviewedBy: currentUser.id,
            reviewedAt: new Date().toISOString(),
            reviewNote: note
          }
        : requirement
    ));
    showNotification('success', 'Petición revisada.');
  };

  const calculateQuarterlyTaxes = (userId: string, quarter: string) => {
    const quarterIncomes = incomes.filter((income) => income.userId === userId && dateInQuarter(income.date, quarter));
    const quarterExpenses = expenses.filter((expense) =>
      expense.userId === userId && expense.status !== 'rejected' && dateInQuarter(expense.date, quarter)
    );

    const grossIncome = quarterIncomes.reduce((sum, income) => sum + income.amount, 0);
    const deductibleExpenses = quarterExpenses.reduce(
      (sum, expense) => sum + expense.amount * ((expense.deductiblePercentage ?? 0) / 100),
      0
    );
    const netYield = grossIncome - deductibleExpenses;
    const existing130 = declarations.find(
      (declaration) => declaration.userId === userId && declaration.quarter === quarter && declaration.modelType === '130'
    );
    const existing303 = declarations.find(
      (declaration) => declaration.userId === userId && declaration.quarter === quarter && declaration.modelType === '303'
    );
    const year = getQuarterRange(quarter)?.year || new Date().getFullYear();

    const model130: TaxDeclaration = existing130
      ? {
          ...existing130,
          calculationState: existing130.calculationState
            ?? (existing130.status === 'draft' ? 'requires_review' : 'recorded')
        }
      : {
          id: `calc_130_${userId}_${quarter.replace(/\s/g, '_')}`,
          userId,
          quarter,
          year,
          modelType: '130',
          title: `Modelo 130 · ${quarter}`,
          grossIncome,
          deductibleExpenses,
          netYield,
          taxAmount: 0,
          calculationState: 'requires_review',
          status: 'draft'
        };

    const model303: TaxDeclaration = existing303
      ? {
          ...existing303,
          calculationState: existing303.calculationState
            ?? (existing303.status === 'draft' ? 'requires_review' : 'recorded')
        }
      : {
          id: `calc_303_${userId}_${quarter.replace(/\s/g, '_')}`,
          userId,
          quarter,
          year,
          modelType: '303',
          title: `Modelo 303 · ${quarter}`,
          grossIncome,
          deductibleExpenses,
          netYield,
          taxAmount: 0,
          calculationState: 'requires_review',
          status: 'draft'
        };

    return { model130, model303 };
  };

  const canManageTaxDeclaration = (declaration: TaxDeclaration) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.RIDER) return declaration.userId === currentUser.id;
    if (currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN) {
      return users.some(
        (user) => user.id === declaration.userId
          && user.role === UserRole.RIDER
          && user.managerId === currentUser.id
      );
    }
    return false;
  };

  const saveTaxDeclarationDraft = (declaration: TaxDeclaration) => {
    if (!canManageTaxDeclaration(declaration)) {
      showNotification('error', 'No puedes guardar este borrador fiscal.');
      return;
    }

    const existing = declarations.find((item) => item.id === declaration.id);
    if (existing && existing.status !== 'draft') {
      showNotification('error', 'Un modelo revisado o presentado no puede volver a borrador.');
      return;
    }

    const draft: TaxDeclaration = {
      ...declaration,
      status: 'draft',
      calculationState: 'requires_review',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewNote: undefined,
      filingReference: undefined,
      filingEvidenceUrl: undefined,
      filedBy: undefined,
      filedAt: undefined,
      gestorId: undefined
    };

    setDeclarations((previous) => {
      const exists = previous.some((item) => item.id === draft.id);
      return exists
        ? previous.map((item) => item.id === draft.id ? draft : item)
        : [draft, ...previous];
    });
    showNotification('success', 'Borrador fiscal guardado para revisión.');
  };

  const reviewTaxDeclaration = (declarationId: string, note?: string) => {
    if (!currentUser || (currentUser.role !== UserRole.MANAGER && currentUser.role !== UserRole.ADMIN)) {
      showNotification('error', 'Solo la gestoría vinculada puede revisar este modelo.');
      return;
    }

    const declaration = declarations.find((item) => item.id === declarationId);
    if (!declaration || !canManageTaxDeclaration(declaration) || declaration.status !== 'draft') {
      showNotification('error', 'Este modelo no está disponible para revisión.');
      return;
    }

    setDeclarations((previous) => previous.map((item) =>
      item.id === declarationId
        ? {
            ...item,
            status: 'reviewed_by_gestor',
            reviewedBy: currentUser.id,
            reviewedAt: new Date().toISOString(),
            reviewNote: note?.trim() || undefined,
            gestorId: currentUser.id
          }
        : item
    ));
    showNotification('success', 'Modelo marcado como revisado por la gestoría.');
  };

  const fileTaxDeclaration = (declarationId: string, filingRef: string, evidenceUrl?: string) => {
    if (!currentUser || (currentUser.role !== UserRole.MANAGER && currentUser.role !== UserRole.ADMIN)) {
      showNotification('error', 'Solo la gestoría vinculada puede registrar una presentación.');
      return;
    }

    const declaration = declarations.find((item) => item.id === declarationId);
    const reference = filingRef.trim();
    if (!declaration || !canManageTaxDeclaration(declaration) || declaration.status !== 'reviewed_by_gestor') {
      showNotification('error', 'El modelo debe estar revisado antes de registrar su presentación.');
      return;
    }
    if (!reference) {
      showNotification('error', 'Introduce la referencia real de presentación.');
      return;
    }

    setDeclarations((previous) => previous.map((item) =>
      item.id === declarationId
        ? {
            ...item,
            status: 'filed_with_tax_agency',
            filingReference: reference,
            filingEvidenceUrl: evidenceUrl?.trim() || undefined,
            filedBy: currentUser.id,
            filedAt: new Date().toISOString().split('T')[0],
            gestorId: currentUser.id
          }
        : item
    ));
    showNotification('success', 'Presentación registrada con referencia.');
  };

  const getFiscalSummary = (userId: string): FiscalSummary => {
    const userIncomes = incomes.filter((income) => income.userId === userId);
    const userExpenses = expenses.filter((expense) => expense.userId === userId);
    const totalIncome = userIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const deductibleExpenses = userExpenses
      .filter((expense) => expense.status !== 'rejected')
      .reduce(
        (sum, expense) => sum + expense.amount * ((expense.deductiblePercentage ?? 0) / 100),
        0
      );
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      deductibleExpenses,
      netProfit,
      estimatedIRPF: 0,
      taxEstimateAvailable: false,
      quarter: currentQuarter()
    };
  };

  const getUsersByManager = (managerId: string) => users.filter(
    (user) => user.role === UserRole.RIDER && user.managerId === managerId
  );

  const markPaymentAsReceived = (paymentId: string) => {
    const payment = payments.find((item) => item.id === paymentId);
    if (!payment || payment.status === 'received') return;

    setPayments((previous) => previous.map((item) =>
      item.id === paymentId ? { ...item, status: 'received', estimated: false } : item
    ));

    if (currentUser?.role === UserRole.RIDER) {
      const income: Income = {
        id: createId('income'),
        userId: currentUser.id,
        platform: payment.platform,
        date: new Date().toISOString().split('T')[0],
        amount: payment.amount,
        retention: 0
      };
      setIncomes((previous) => [income, ...previous]);
    }
  };

  const exportData = () => {
    const payload = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      users,
      incomes,
      expenses,
      documents,
      payments,
      requirements,
      declarations,
      vehicle
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `labora-backup-${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData: string) => {
    try {
      const payload = JSON.parse(jsonData);
      if (Array.isArray(payload.users)) setUsers(payload.users);
      if (Array.isArray(payload.incomes)) setIncomes(payload.incomes);
      if (Array.isArray(payload.expenses)) setExpenses(payload.expenses);
      if (Array.isArray(payload.documents)) setDocuments(payload.documents);
      if (Array.isArray(payload.payments)) setPayments(payload.payments);
      if (Array.isArray(payload.requirements)) setRequirements(payload.requirements);
      if (Array.isArray(payload.declarations)) setDeclarations(payload.declarations);
      if (payload.vehicle) setVehicle(payload.vehicle);
      showNotification('success', 'Datos importados.');
    } catch {
      showNotification('error', 'El archivo no contiene un backup válido de Labora+.');
    }
  };

  const value = useMemo<DataContextType>(() => ({
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
    submitRequirement,
    reviewRequirement,
    saveTaxDeclarationDraft,
    reviewTaxDeclaration,
    fileTaxDeclaration,
    calculateQuarterlyTaxes,
    getFiscalSummary,
    getUsersByManager,
    markPaymentAsReceived,
    showNotification,
    dismissNotification,
    exportData,
    importData
  }), [
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
    notifications
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};