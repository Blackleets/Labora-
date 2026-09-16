import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Document,
  Expense,
  FiscalSummary,
  GestorRequirement,
  Income,
  Notification,
  Payment,
  TaxDeclaration,
  User,
  UserRole,
  Vehicle,
} from '../types';
import { buildFiscalSnapshot, parseFiscalPeriod } from '../services/fiscalEngine';
import { getSupabase, isSupabaseConfigured } from '../services/supabaseClient';

type ExpenseReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'needs_fix';
type DbRow = Record<string, any>;

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
  isLoading: boolean;
  backendConfigured: boolean;
  togglePrivacyMode: () => void;
  toggleDarkMode: () => void;
  completeOnboarding: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (userData: Partial<User>, password: string) => Promise<void>;
  switchUser: (userId: string) => void;
  updateUserConfig: (platforms: string[], banks: string[]) => Promise<void>;
  updateUserFiscalProfile: (profileData: Partial<User>) => Promise<void>;
  addIncome: (income: Omit<Income, 'id' | 'userId'>) => Promise<void>;
  addIncomes: (incomes: Omit<Income, 'id' | 'userId'>[]) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => Promise<void>;
  addExpenses: (expenses: Omit<Expense, 'id' | 'userId'>[]) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpenseAudit: (expenseId: string, status: ExpenseReviewStatus, gestorNotes?: string) => Promise<void>;
  addDocument: (doc: Omit<Document, 'id' | 'userId'>) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updateVehicle: (vehicleData: Vehicle) => Promise<void>;
  addRequirement: (req: Omit<GestorRequirement, 'id' | 'createdAt'>) => Promise<void>;
  updateRequirementStatus: (id: string, status: 'pending' | 'submitted' | 'approved', notes?: string, proofUrl?: string) => Promise<void>;
  fileTaxDeclaration: (declarationId: string, filingRef: string) => void;
  calculateQuarterlyTaxes: (userId: string, quarter: string) => { model130: TaxDeclaration; model303: TaxDeclaration };
  getFiscalSummary: (userId: string) => FiscalSummary;
  getUsersByManager: (managerId: string) => User[];
  markPaymentAsReceived: (paymentId: string) => Promise<void>;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  dismissNotification: (id: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const toUserRole = (membershipRole?: string): UserRole => {
  if (membershipRole === 'owner' || membershipRole === 'manager') return UserRole.MANAGER;
  return UserRole.RIDER;
};

const normalizeDate = (value?: string | null) => value ? value.slice(0, 10) : '';

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, payload] = dataUrl.split(',');
  if (!header || !payload || !header.startsWith('data:')) throw new Error('Formato de evidencia no válido.');
  const mime = header.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream';
  const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
};

const sha256 = async (blob: Blob) => {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const currentQuarter = () => {
  const now = new Date();
  return `${Math.floor(now.getMonth() / 3) + 1}T ${now.getFullYear()}`;
};

export const DataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const backendConfigured = isSupabaseConfigured();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requirements, setRequirements] = useState<GestorRequirement[]>([]);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem('labora_pref_privacy') === 'true');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('labora_pref_dark') === 'true');

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = crypto.randomUUID();
    setNotifications((previous) => [...previous, { id, type, message }]);
    window.setTimeout(() => setNotifications((previous) => previous.filter((item) => item.id !== id)), 5000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clearWorkspace = useCallback(() => {
    setCurrentUser(null);
    setUsers([]);
    setIncomes([]);
    setExpenses([]);
    setDocuments([]);
    setPayments([]);
    setRequirements([]);
    setDeclarations([]);
    setVehicle(null);
    setHasOnboarded(false);
  }, []);

  const ensureBootstrapped = useCallback(async (authUser: SupabaseUser) => {
    const supabase = getSupabase();
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('organization_id,role,status')
      .eq('user_id', authUser.id)
      .eq('status', 'active');
    if (membershipError) throw membershipError;
    if ((memberships || []).length > 0) return;

    const accountKind = authUser.user_metadata?.account_kind === 'manager' ? 'manager' : 'rider';
    const fullName = String(authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Mi espacio');
    const { error } = await supabase.rpc('labora_bootstrap_account', {
      account_name: accountKind === 'manager' ? fullName : `Espacio de ${fullName}`,
      account_kind: accountKind,
    });
    if (error) throw error;
  }, []);

  const loadWorkspace = useCallback(async (authUser: SupabaseUser) => {
    const supabase = getSupabase();
    await ensureBootstrapped(authUser);

    const [profileResult, membershipsResult, linksAsManagerResult, linksAsClientResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
      supabase.from('organization_memberships').select('organization_id,role,status').eq('user_id', authUser.id).eq('status', 'active'),
      supabase.from('manager_client_links').select('id,organization_id,manager_user_id,client_user_id,status').eq('manager_user_id', authUser.id).eq('status', 'active'),
      supabase.from('manager_client_links').select('id,organization_id,manager_user_id,client_user_id,status').eq('client_user_id', authUser.id).eq('status', 'active'),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    if (linksAsManagerResult.error) throw linksAsManagerResult.error;
    if (linksAsClientResult.error) throw linksAsClientResult.error;

    const profile = (profileResult.data || {}) as DbRow;
    const memberships = (membershipsResult.data || []) as DbRow[];
    const priority = { owner: 0, rider: 1, manager: 2 } as Record<string, number>;
    const primaryMembership = [...memberships].sort((a, b) => (priority[a.role] ?? 9) - (priority[b.role] ?? 9))[0];
    const role = toUserRole(primaryMembership?.role);
    const organizationId = primaryMembership?.organization_id as string | undefined;

    let organizationName = '';
    if (organizationId) {
      const { data } = await supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle();
      organizationName = String((data as DbRow | null)?.name || '');
    }

    const managerLink = ((linksAsClientResult.data || []) as DbRow[])[0];
    const authenticatedUser: User = {
      id: authUser.id,
      name: String(profile.full_name || authUser.email?.split('@')[0] || 'Usuario'),
      email: authUser.email || '',
      role,
      organizationId,
      phone: profile.phone || undefined,
      nif: profile.nif || undefined,
      fiscalRegime: profile.fiscal_regime || undefined,
      iaeCode: profile.iae_code || undefined,
      socialSecurityType: profile.social_security_type || undefined,
      vehicleType: profile.vehicle_type || undefined,
      vehiclePlate: profile.vehicle_plate || undefined,
      vehicleFuel: profile.vehicle_fuel || undefined,
      platforms: Array.isArray(profile.platforms) ? profile.platforms : [],
      banks: Array.isArray(profile.preferred_banks) ? profile.preferred_banks : [],
      managerId: managerLink?.manager_user_id,
      companyName: role === UserRole.MANAGER ? (organizationName || undefined) : undefined,
      collegiateNumber: profile.professional_id || undefined,
      countryCode: profile.country_code || 'ZZ',
    };

    const linkRows = (linksAsManagerResult.data || []) as DbRow[];
    const clientIds = linkRows.map((row) => String(row.client_user_id));
    let clientProfiles: DbRow[] = [];
    if (role === UserRole.MANAGER && clientIds.length > 0) {
      const result = await supabase.from('profiles').select('*').in('user_id', clientIds);
      if (result.error) throw result.error;
      clientProfiles = (result.data || []) as DbRow[];
    }

    const clientOrgById = new Map(linkRows.map((row) => [String(row.client_user_id), String(row.organization_id)]));
    const clientUsers: User[] = clientProfiles.map((row) => ({
      id: String(row.user_id),
      name: String(row.full_name || 'Autónomo'),
      email: String(row.email || ''),
      role: UserRole.RIDER,
      organizationId: clientOrgById.get(String(row.user_id)),
      phone: row.phone || undefined,
      nif: row.nif || undefined,
      fiscalRegime: row.fiscal_regime || undefined,
      iaeCode: row.iae_code || undefined,
      socialSecurityType: row.social_security_type || undefined,
      vehicleType: row.vehicle_type || undefined,
      vehiclePlate: row.vehicle_plate || undefined,
      vehicleFuel: row.vehicle_fuel || undefined,
      platforms: Array.isArray(row.platforms) ? row.platforms : [],
      banks: Array.isArray(row.preferred_banks) ? row.preferred_banks : [],
      managerId: authUser.id,
      countryCode: row.country_code || 'ZZ',
    }));

    const [incomeResult, expenseResult, reviewResult, documentResult, payoutResult, requirementResult, taxPeriodResult, filingResult] = await Promise.all([
      supabase.from('incomes').select('*').order('occurred_on', { ascending: false }),
      supabase.from('expenses').select('*').order('occurred_on', { ascending: false }),
      supabase.from('expense_reviews').select('*').order('updated_at', { ascending: false }),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('platform_payouts').select('*').order('paid_on', { ascending: false, nullsFirst: false }),
      supabase.from('manager_requirements').select('*').order('created_at', { ascending: false }),
      supabase.from('tax_periods').select('*').order('tax_year', { ascending: false }).order('quarter', { ascending: false }),
      supabase.from('filing_evidence').select('*').eq('verification_status', 'verified'),
    ]);

    for (const result of [incomeResult, expenseResult, reviewResult, documentResult, payoutResult, requirementResult, taxPeriodResult, filingResult]) {
      if (result.error) throw result.error;
    }

    const documentRows = (documentResult.data || []) as DbRow[];
    const signedUrlByDocument = new Map<string, string>();
    await Promise.all(documentRows.map(async (row) => {
      const path = String(row.storage_path || '');
      if (!path) return;
      const { data } = await supabase.storage.from('fiscal-evidence').createSignedUrl(path, 3600);
      if (data?.signedUrl) signedUrlByDocument.set(String(row.id), data.signedUrl);
    }));

    const mappedDocuments: Document[] = documentRows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      type: row.kind === 'tax_filing' ? 'Trimestre' : row.kind === 'registration' ? 'Alta' : row.kind === 'invoice' ? 'Factura' : 'Otro',
      name: String(row.original_filename || row.kind || 'Documento'),
      date: normalizeDate(row.document_date || row.created_at),
      content: signedUrlByDocument.get(String(row.id)),
    }));

    const reviewByExpense = new Map<string, DbRow>();
    ((reviewResult.data || []) as DbRow[]).forEach((row) => {
      if (!reviewByExpense.has(String(row.expense_id))) reviewByExpense.set(String(row.expense_id), row);
    });

    const mappedExpenses: Expense[] = ((expenseResult.data || []) as DbRow[]).map((row) => {
      const review = reviewByExpense.get(String(row.id));
      return {
        id: String(row.id),
        userId: String(row.user_id),
        category: String(row.category),
        date: normalizeDate(row.occurred_on),
        amount: Number(row.total_amount || 0),
        merchant: row.merchant || undefined,
        vatRate: row.vat_rate === null ? undefined : Number(row.vat_rate),
        vatAmount: row.vat_amount === null ? undefined : Number(row.vat_amount),
        receiptUrl: row.source_document_id ? signedUrlByDocument.get(String(row.source_document_id)) : undefined,
        status: (review?.status || 'pending_review') as ExpenseReviewStatus,
        gestorNotes: review?.notes || undefined,
        deductiblePercentage: review ? Number(review.deductible_percent || 0) : 0,
        notes: row.notes || undefined,
      };
    });

    const mappedIncomes: Income[] = ((incomeResult.data || []) as DbRow[]).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      platform: String(row.platform),
      date: normalizeDate(row.occurred_on),
      amount: Number(row.gross_amount || 0),
      retention: Number(row.retention_amount || 0),
    }));

    const mappedPayments: Payment[] = ((payoutResult.data || []) as DbRow[]).map((row) => ({
      id: String(row.id),
      platform: String(row.platform),
      amount: Number(row.net_amount || 0),
      date: normalizeDate(row.paid_on || row.period_end || row.created_at),
      status: row.status === 'paid' ? 'received' : 'pending',
      estimated: row.status === 'expected',
    }));

    const nameByUserId = new Map<string, string>([
      [authenticatedUser.id, authenticatedUser.name],
      ...clientUsers.map((client) => [client.id, client.name] as [string, string]),
    ]);
    const mappedRequirements: GestorRequirement[] = ((requirementResult.data || []) as DbRow[])
      .filter((row) => row.status !== 'cancelled')
      .map((row) => ({
        id: String(row.id),
        managerId: String(row.manager_user_id),
        managerName: nameByUserId.get(String(row.manager_user_id)) || 'Gestor',
        riderId: String(row.client_user_id),
        riderName: nameByUserId.get(String(row.client_user_id)) || 'Autónomo',
        title: String(row.title),
        description: String(row.description || ''),
        category: row.category,
        deadline: normalizeDate(row.deadline),
        status: row.status,
        submissionNotes: row.submission_notes || undefined,
        submissionUrl: row.submitted_document_id ? signedUrlByDocument.get(String(row.submitted_document_id)) : undefined,
        createdAt: normalizeDate(row.created_at),
        quarter: row.tax_period_label || undefined,
      }));

    const verifiedFilingByPeriod = new Map<string, DbRow[]>();
    ((filingResult.data || []) as DbRow[]).forEach((row) => {
      const list = verifiedFilingByPeriod.get(String(row.tax_period_id)) || [];
      list.push(row);
      verifiedFilingByPeriod.set(String(row.tax_period_id), list);
    });
    const mappedDeclarations: TaxDeclaration[] = [];
    ((taxPeriodResult.data || []) as DbRow[]).forEach((row) => {
      const snapshot = (row.snapshot || {}) as DbRow;
      const filings = verifiedFilingByPeriod.get(String(row.id)) || [];
      for (const modelType of ['130', '303'] as const) {
        const filing = filings.find((item) => item.model_type === modelType);
        const modelSnapshot = snapshot[`model${modelType}`] || {};
        mappedDeclarations.push({
          id: `${row.id}-${modelType}`,
          userId: String(row.user_id),
          quarter: `${row.quarter}T ${row.tax_year}`,
          year: Number(row.tax_year),
          modelType,
          title: `Modelo ${modelType}`,
          grossIncome: Number(snapshot?.quarter?.grossIncome || 0),
          deductibleExpenses: Number(snapshot?.quarter?.approvedDeductibleExpenses || 0),
          netYield: Number(snapshot?.yearToDate?.netActivityEstimate || 0),
          taxAmount: Number(modelSnapshot?.finalAmount ?? modelSnapshot?.provisionalAccruedAmount ?? 0),
          status: filing ? 'filed_with_tax_agency' : row.status === 'reviewed' ? 'reviewed_by_gestor' : 'draft',
          filingReference: filing?.reference || undefined,
          filedAt: filing ? normalizeDate(filing.filed_at) : undefined,
          gestorId: row.reviewed_by || undefined,
        });
      }
    });

    const vehicleRowHasEnoughEvidence = Boolean(profile.vehicle_model);
    const mappedVehicle: Vehicle | null = vehicleRowHasEnoughEvidence ? {
      type: profile.vehicle_type || 'moto',
      model: String(profile.vehicle_model),
      plate: profile.vehicle_plate || undefined,
      lastMaintenanceDate: normalizeDate(profile.last_maintenance_date),
      lastMaintenanceKm: Number(profile.last_maintenance_km || 0),
      currentKm: Number(profile.current_km || 0),
      nextMaintenanceKm: Number(profile.next_maintenance_km || 0),
    } : null;

    setCurrentUser(authenticatedUser);
    setUsers(role === UserRole.MANAGER ? [authenticatedUser, ...clientUsers] : [authenticatedUser]);
    setIncomes(mappedIncomes);
    setExpenses(mappedExpenses);
    setDocuments(mappedDocuments);
    setPayments(mappedPayments);
    setRequirements(mappedRequirements);
    setDeclarations(mappedDeclarations);
    setVehicle(mappedVehicle);
    setHasOnboarded(Boolean(profile.onboarding_completed));
  }, [ensureBootstrapped]);

  const refreshData = useCallback(async () => {
    if (!backendConfigured) return;
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await loadWorkspace(data.session.user);
    else clearWorkspace();
  }, [backendConfigured, clearWorkspace, loadWorkspace]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('labora_pref_dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('labora_pref_privacy', String(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    if (!backendConfigured) {
      clearWorkspace();
      setIsLoading(false);
      return;
    }

    const supabase = getSupabase();
    let active = true;

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active && data.session?.user) await loadWorkspace(data.session.user);
      } catch (error) {
        console.error('Labora+ session bootstrap failed:', error);
        if (active) clearWorkspace();
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        if (!session?.user) {
          clearWorkspace();
          return;
        }
        void loadWorkspace(session.user).catch((error) => {
          console.error('Labora+ auth refresh failed:', error);
          showNotification('error', 'No se pudo cargar tu espacio de trabajo.');
        });
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [backendConfigured, clearWorkspace, loadWorkspace, showNotification]);

  const requireWorkspace = () => {
    if (!currentUser?.organizationId) throw new Error('No hay un espacio de trabajo activo.');
    return { userId: currentUser.id, organizationId: currentUser.organizationId };
  };

  const login = async (email: string, password: string) => {
    if (!backendConfigured) throw new Error('El backend seguro de Labora+ todavía no está configurado.');
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    if (!data.user) throw new Error('No se pudo recuperar la identidad autenticada.');
    await loadWorkspace(data.user);
    showNotification('success', 'Sesión iniciada de forma segura.');
  };

  const registerUser = async (userData: Partial<User>, password: string) => {
    if (!backendConfigured) throw new Error('El backend seguro de Labora+ todavía no está configurado.');
    if (!userData.email) throw new Error('El correo es obligatorio.');
    if (password.length < 8) throw new Error('Usa una contraseña de al menos 8 caracteres.');

    const supabase = getSupabase();
    const accountKind = userData.role === UserRole.MANAGER ? 'manager' : 'rider';
    const signupCountry = String(userData.countryCode || 'ZZ').trim().toUpperCase();
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.trim(),
      password,
      options: {
        data: {
          full_name: userData.name || '',
          account_kind: accountKind,
          country_code: /^[A-Z]{2}$/.test(signupCountry) ? signupCountry : 'ZZ',
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear la cuenta.');

    if (!data.session) {
      showNotification('info', 'Cuenta creada. Confirma tu correo y después inicia sesión.');
      return;
    }

    await ensureBootstrapped(data.user);
    const profilePatch = {
      full_name: userData.name || '',
      phone: userData.phone || null,
      country_code: /^[A-Z]{2}$/.test(signupCountry) ? signupCountry : 'ZZ',
      nif: userData.nif || null,
      fiscal_regime: userData.fiscalRegime || null,
      iae_code: userData.iaeCode || null,
      social_security_type: userData.socialSecurityType || null,
      vehicle_type: userData.vehicleType || null,
      vehicle_plate: userData.vehiclePlate || null,
      vehicle_fuel: userData.vehicleFuel || null,
      platforms: userData.platforms || [],
      preferred_banks: userData.banks || [],
      professional_id: userData.collegiateNumber || null,
    };
    const { error: profileError } = await supabase.from('profiles').update(profilePatch).eq('user_id', data.user.id);
    if (profileError) throw profileError;
    await loadWorkspace(data.user);
    showNotification('success', 'Cuenta creada. Tus datos ya están en tu espacio privado.');
  };

  const logout = async () => {
    if (backendConfigured) {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
    }
    clearWorkspace();
    showNotification('info', 'Sesión cerrada.');
  };

  const switchUser = (_userId: string) => {
    showNotification('error', 'Labora+ no permite suplantar la identidad de otro usuario.');
  };

  const updateUserConfig = async (platforms: string[], banks: string[]) => {
    if (!currentUser) throw new Error('Inicia sesión para guardar cambios.');
    const { error } = await getSupabase().from('profiles').update({ platforms, preferred_banks: banks }).eq('user_id', currentUser.id);
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Preferencias de plataformas actualizadas.');
  };

  const updateUserFiscalProfile = async (profileData: Partial<User>) => {
    if (!currentUser) throw new Error('Inicia sesión para guardar cambios.');
    const patch: DbRow = {};
    if (profileData.name !== undefined) patch.full_name = profileData.name;
    if (profileData.phone !== undefined) patch.phone = profileData.phone || null;
    if (profileData.nif !== undefined) patch.nif = profileData.nif || null;
    if (profileData.fiscalRegime !== undefined) patch.fiscal_regime = profileData.fiscalRegime || null;
    if (profileData.iaeCode !== undefined) patch.iae_code = profileData.iaeCode || null;
    if (profileData.socialSecurityType !== undefined) patch.social_security_type = profileData.socialSecurityType || null;
    if (profileData.vehicleType !== undefined) patch.vehicle_type = profileData.vehicleType || null;
    if (profileData.vehiclePlate !== undefined) patch.vehicle_plate = profileData.vehiclePlate || null;
    if (profileData.vehicleFuel !== undefined) patch.vehicle_fuel = profileData.vehicleFuel || null;
    if (profileData.collegiateNumber !== undefined) patch.professional_id = profileData.collegiateNumber || null;
    const { error } = await getSupabase().from('profiles').update(patch).eq('user_id', currentUser.id);
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Perfil actualizado.');
  };

  const completeOnboarding = async () => {
    if (!currentUser) throw new Error('Inicia sesión para completar el perfil.');
    const { error } = await getSupabase().from('profiles').update({ onboarding_completed: true }).eq('user_id', currentUser.id);
    if (error) throw error;
    setHasOnboarded(true);
    showNotification('success', 'Configuración completada.');
  };

  const togglePrivacyMode = () => setPrivacyMode((value) => !value);
  const toggleDarkMode = () => setDarkMode((value) => !value);

  const addIncome = async (income: Omit<Income, 'id' | 'userId'>) => {
    const { userId, organizationId } = requireWorkspace();
    const { error } = await getSupabase().from('incomes').insert({
      organization_id: organizationId,
      user_id: userId,
      platform: income.platform.trim(),
      occurred_on: income.date,
      gross_amount: income.amount,
      retention_amount: income.retention || 0,
      currency: 'EUR',
      source_type: 'manual',
      evidence_status: 'unverified',
      created_by: userId,
    });
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Ingreso registrado como dato manual.');
  };

  const addIncomes = async (items: Omit<Income, 'id' | 'userId'>[]) => {
    const { userId, organizationId } = requireWorkspace();
    if (items.length === 0) return;
    const rows = items.map((income) => ({
      organization_id: organizationId,
      user_id: userId,
      platform: income.platform.trim(),
      occurred_on: income.date,
      gross_amount: income.amount,
      retention_amount: income.retention || 0,
      currency: 'EUR',
      source_type: 'manual',
      evidence_status: 'unverified',
      created_by: userId,
    }));
    const { error } = await getSupabase().from('incomes').insert(rows);
    if (error) throw error;
    await refreshData();
    showNotification('success', `${items.length} ingresos registrados.`);
  };

  const uploadEvidence = async (dataUrl: string, kind: string, documentDate?: string) => {
    const { userId, organizationId } = requireWorkspace();
    const supabase = getSupabase();
    const blob = dataUrlToBlob(dataUrl);
    const extension = blob.type === 'image/png' ? 'png' : blob.type === 'application/pdf' ? 'pdf' : 'jpg';
    const filename = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `${organizationId}/${userId}/${filename}`;
    const checksum = await sha256(blob);

    const { error: uploadError } = await supabase.storage.from('fiscal-evidence').upload(storagePath, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: documentRow, error: documentError } = await supabase.from('documents').insert({
      organization_id: organizationId,
      user_id: userId,
      uploaded_by: userId,
      kind,
      storage_path: storagePath,
      original_filename: `evidencia-${documentDate || new Date().toISOString().slice(0, 10)}.${extension}`,
      mime_type: blob.type,
      size_bytes: blob.size,
      sha256: checksum,
      document_date: documentDate || null,
      extraction_status: 'pending',
    }).select('id').single();
    if (documentError) {
      await supabase.storage.from('fiscal-evidence').remove([storagePath]);
      throw documentError;
    }
    return String(documentRow.id);
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'userId'>) => {
    const { userId, organizationId } = requireWorkspace();
    let sourceDocumentId: string | null = null;
    if (expense.receiptUrl?.startsWith('data:')) sourceDocumentId = await uploadEvidence(expense.receiptUrl, 'expense_receipt', expense.date);
    if (!sourceDocumentId) throw new Error('Adjunta una evidencia real antes de registrar el gasto.');

    const { error } = await getSupabase().from('expenses').insert({
      organization_id: organizationId,
      user_id: userId,
      occurred_on: expense.date,
      merchant: expense.merchant?.trim() || String(expense.category),
      category: String(expense.category),
      total_amount: expense.amount,
      currency: 'EUR',
      vat_rate: expense.vatRate ?? null,
      vat_amount: expense.vatAmount ?? null,
      source_document_id: sourceDocumentId,
      evidence_status: 'unverified',
      notes: expense.notes || null,
      created_by: userId,
    });
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Gasto guardado con evidencia y pendiente de revisión.');
  };

  const addExpenses = async (items: Omit<Expense, 'id' | 'userId'>[]) => {
    for (const expense of items) await addExpense(expense);
  };

  const updateExpense = async (expense: Expense) => {
    if (!currentUser || expense.userId !== currentUser.id) throw new Error('Solo puedes corregir tus propios gastos.');
    const { error } = await getSupabase().from('expenses').update({
      occurred_on: expense.date,
      merchant: expense.merchant || String(expense.category),
      category: String(expense.category),
      total_amount: expense.amount,
      vat_rate: expense.vatRate ?? null,
      vat_amount: expense.vatAmount ?? null,
      notes: expense.notes || null,
    }).eq('id', expense.id).eq('user_id', currentUser.id);
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Gasto actualizado.');
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) throw new Error('Inicia sesión.');
    const { error } = await getSupabase().from('expenses').delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) throw error;
    await refreshData();
    showNotification('info', 'Gasto eliminado. La auditoría conserva el evento de eliminación.');
  };

  const updateExpenseAudit = async (expenseId: string, status: ExpenseReviewStatus, gestorNotes?: string) => {
    if (currentUser?.role !== UserRole.MANAGER) throw new Error('Solo un gestor vinculado puede revisar gastos.');
    if (status === 'pending_review') throw new Error('La revisión pendiente se obtiene automáticamente cuando todavía no existe decisión del gestor.');
    const target = expenses.find((expense) => expense.id === expenseId);
    if (!target) throw new Error('Gasto no encontrado.');
    const organizationId = users.find((user) => user.id === target.userId)?.organizationId;
    if (!organizationId) throw new Error('No se pudo resolver el espacio del cliente.');

    const { error } = await getSupabase().from('expense_reviews').upsert({
      organization_id: organizationId,
      expense_id: expenseId,
      manager_user_id: currentUser.id,
      status,
      deductible_percent: status === 'approved' ? Math.max(0, Math.min(100, target.deductiblePercentage || 0)) : 0,
      notes: gestorNotes || null,
    }, { onConflict: 'expense_id,manager_user_id' });
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Revisión del gasto guardada con trazabilidad.');
  };

  const addDocument = async (doc: Omit<Document, 'id' | 'userId'>) => {
    if (!doc.content?.startsWith('data:')) throw new Error('El documento debe contener un archivo real.');
    await uploadEvidence(doc.content, doc.type === 'Factura' ? 'invoice' : doc.type === 'Alta' ? 'registration' : 'document', doc.date);
    await refreshData();
    showNotification('success', 'Documento guardado en almacenamiento privado.');
  };

  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    const { userId, organizationId } = requireWorkspace();
    const { error } = await getSupabase().from('platform_payouts').insert({
      organization_id: organizationId,
      user_id: userId,
      platform: payment.platform,
      paid_on: payment.status === 'received' ? payment.date : null,
      period_end: payment.date,
      net_amount: payment.amount,
      currency: 'EUR',
      status: payment.status === 'received' ? 'paid' : 'expected',
      created_by: userId,
    });
    if (error) throw error;
    await refreshData();
    showNotification('success', payment.status === 'received' ? 'Pago registrado como recibido.' : 'Pago esperado registrado para conciliación.');
  };

  const markPaymentAsReceived = async (paymentId: string) => {
    const { error } = await getSupabase().from('platform_payouts').update({ status: 'paid', paid_on: new Date().toISOString().slice(0, 10) }).eq('id', paymentId);
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Pago marcado como recibido. No se ha duplicado como ingreso automáticamente.');
  };

  const updateVehicle = async (vehicleData: Vehicle) => {
    if (!currentUser) throw new Error('Inicia sesión.');
    const { error } = await getSupabase().from('profiles').update({
      vehicle_type: vehicleData.type,
      vehicle_plate: vehicleData.plate || null,
      vehicle_model: vehicleData.model || null,
      last_maintenance_date: vehicleData.lastMaintenanceDate || null,
      last_maintenance_km: vehicleData.lastMaintenanceKm || null,
      current_km: vehicleData.currentKm || null,
      next_maintenance_km: vehicleData.nextMaintenanceKm || null,
    }).eq('user_id', currentUser.id);
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Vehículo actualizado.');
  };

  const addRequirement = async (requirement: Omit<GestorRequirement, 'id' | 'createdAt'>) => {
    if (currentUser?.role !== UserRole.MANAGER) throw new Error('Solo el gestor puede crear peticiones.');
    const client = users.find((user) => user.id === requirement.riderId);
    if (!client?.organizationId) throw new Error('El cliente no está vinculado a un espacio válido.');
    const { error } = await getSupabase().from('manager_requirements').insert({
      organization_id: client.organizationId,
      manager_user_id: currentUser.id,
      client_user_id: requirement.riderId,
      title: requirement.title,
      description: requirement.description,
      category: requirement.category,
      deadline: requirement.deadline || null,
      tax_period_label: requirement.quarter || null,
      status: 'pending',
    });
    if (error) throw error;
    await refreshData();
    showNotification('success', 'Petición enviada al autónomo.');
  };

  const updateRequirementStatus = async (id: string, status: 'pending' | 'submitted' | 'approved', notes?: string, proofUrl?: string) => {
    if (!currentUser) throw new Error('Inicia sesión.');
    const requirement = requirements.find((item) => item.id === id);
    if (!requirement) throw new Error('Petición no encontrada.');
    let submittedDocumentId: string | null = null;
    if (status === 'submitted' && proofUrl?.startsWith('data:')) submittedDocumentId = await uploadEvidence(proofUrl, 'requirement_response');

    const patch: DbRow = {
      status,
      submission_notes: notes || null,
    };
    if (submittedDocumentId) patch.submitted_document_id = submittedDocumentId;
    if (status === 'submitted') patch.submitted_at = new Date().toISOString();
    if (status === 'approved') patch.resolved_at = new Date().toISOString();
    const { error } = await getSupabase().from('manager_requirements').update(patch).eq('id', id);
    if (error) throw error;
    await refreshData();
    showNotification('success', status === 'submitted' ? 'Documento enviado al gestor.' : 'Petición actualizada.');
  };

  const fileTaxDeclaration = (_declarationId: string, _filingRef: string) => {
    showNotification('error', 'Labora+ solo mostrará una presentación como verificada cuando exista un justificante real adjunto y validado.');
  };

  const calculateQuarterlyTaxes = (userId: string, quarter: string) => {
    const snapshot = buildFiscalSnapshot(incomes, expenses, userId, quarter);
    const period = parseFiscalPeriod(quarter);
    const common = {
      userId,
      quarter: period.label,
      year: period.year,
      grossIncome: snapshot.quarter.grossIncome,
      deductibleExpenses: snapshot.quarter.approvedDeductibleExpenses,
      netYield: snapshot.yearToDate.netActivityEstimate,
      status: 'draft' as const,
    };
    return {
      model130: {
        id: `estimate-130-${userId}-${period.label}`,
        ...common,
        modelType: '130' as const,
        title: 'Modelo 130 · estimación pendiente de revisión',
        taxAmount: snapshot.model130.provisionalAccruedAmount,
      },
      model303: {
        id: `estimate-303-${userId}-${period.label}`,
        ...common,
        modelType: '303' as const,
        title: 'Modelo 303 · datos insuficientes para importe final',
        taxAmount: 0,
      },
    };
  };

  const getFiscalSummary = (userId: string): FiscalSummary => {
    const label = currentQuarter();
    const snapshot = buildFiscalSnapshot(incomes, expenses, userId, label);
    const totalIncome = snapshot.quarter.grossIncome;
    const totalExpenses = snapshot.quarter.approvedDeductibleExpenses;
    const netProfit = Math.max(0, totalIncome - totalExpenses);
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      estimatedIRPF: snapshot.model130.provisionalAccruedAmount,
      quarter: label,
    };
  };

  const getUsersByManager = (managerId: string) => users.filter((user) => user.role === UserRole.RIDER && user.managerId === managerId);

  const exportData = () => {
    if (!currentUser) return;
    const safeExpenses = expenses.filter((item) => item.userId === currentUser.id).map(({ receiptUrl, ...item }) => item);
    const safeDocuments = documents.filter((item) => item.userId === currentUser.id).map(({ content, ...item }) => item);
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      incomes: incomes.filter((item) => item.userId === currentUser.id),
      expenses: safeExpenses,
      documents: safeDocuments,
      payments,
      requirements: requirements.filter((item) => item.riderId === currentUser.id),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `labora-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Exportación creada sin URLs temporales de documentos.');
  };

  const importData = (_jsonData: string) => {
    showNotification('info', 'La importación genérica está desactivada. Los datos reales se importarán mediante conectores verificables.');
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
    isLoading,
    backendConfigured,
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
    importData,
    refreshData,
  }), [
    currentUser, users, incomes, expenses, documents, payments, requirements, declarations, vehicle,
    hasOnboarded, privacyMode, darkMode, notifications, isLoading, backendConfigured, refreshData,
    showNotification, dismissNotification,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
