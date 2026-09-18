import {
  Document,
  Expense,
  GestorRequirement,
  Income,
  Payment,
  TaxDeclaration,
  User,
  UserRole
} from '../types';
import { supabase } from './supabaseClient';

const KEYS = {
  incomes: 'labora_incomes',
  expenses: 'labora_expenses',
  documents: 'labora_docs',
  payments: 'labora_payments',
  requirements: 'labora_requirements',
  declarations: 'labora_declarations'
} as const;

const numberValue = (value: any) => Number(value ?? 0);

const signedDocumentUrl = async (path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage.from('labora-documents').createSignedUrl(path, 60 * 60);
  return error ? undefined : data.signedUrl;
};

export const uploadOperationalFile = async (userId: string, dataUrl: string, prefix: string) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('pdf') ? 'pdf' : 'jpg';
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${userId}/${safePrefix}.${extension}`;

  const { error } = await supabase.storage
    .from('labora-documents')
    .upload(path, blob, { upsert: true, contentType, cacheControl: '3600' });
  if (error) throw error;
  return path;
};

export const loadRemoteOperationalData = async (users: User[]) => {
  const profileName = new Map(users.map((user) => [user.id, user.companyName || user.name]));

  const [incomesResult, expensesResult, requirementsResult, documentsResult, declarationsResult, paymentsResult] = await Promise.all([
    supabase.from('incomes').select('*').order('date', { ascending: false }),
    supabase.from('expenses').select('*').order('date', { ascending: false }),
    supabase.from('requirements').select('*').order('created_at', { ascending: false }),
    supabase.from('documents').select('*').order('document_date', { ascending: false }),
    supabase.from('tax_declarations').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('*').order('date', { ascending: false })
  ]);

  const firstError = [incomesResult, expensesResult, requirementsResult, documentsResult, declarationsResult, paymentsResult].find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const incomes: Income[] = (incomesResult.data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    date: row.date,
    amount: numberValue(row.amount),
    retention: numberValue(row.retention)
  }));

  const expenses: Expense[] = await Promise.all((expensesResult.data || []).map(async (row: any) => ({
    id: row.id,
    userId: row.user_id,
    category: row.category,
    merchant: row.merchant || undefined,
    date: row.date,
    amount: numberValue(row.amount),
    receiptUrl: await signedDocumentUrl(row.receipt_url),
    receiptHash: row.receipt_hash || undefined,
    receiptMimeType: row.receipt_mime_type || undefined,
    ocrConfidence: row.ocr_confidence == null ? undefined : numberValue(row.ocr_confidence),
    ocrNeedsReview: row.ocr_needs_review == null ? undefined : Boolean(row.ocr_needs_review),
    ocrUncertainFields: Array.isArray(row.ocr_uncertain_fields) ? row.ocr_uncertain_fields : undefined,
    notes: row.notes || undefined,
    isRecurring: Boolean(row.is_recurring),
    vatRate: row.vat_rate == null ? undefined : numberValue(row.vat_rate),
    vatAmount: row.vat_amount == null ? undefined : numberValue(row.vat_amount),
    fuelLitres: row.fuel_litres == null ? undefined : numberValue(row.fuel_litres),
    fuelType: row.fuel_type || undefined,
    status: row.status,
    gestorNotes: row.gestor_notes || undefined,
    deductiblePercentage: numberValue(row.deductible_percentage),
    invoiceNumber: row.invoice_number || undefined
  })));

  const requirements: GestorRequirement[] = (requirementsResult.data || []).map((row: any) => ({
    id: row.id,
    managerId: row.manager_id,
    managerName: profileName.get(row.manager_id) || 'Gestoría',
    riderId: row.rider_id,
    riderName: profileName.get(row.rider_id) || 'Autónomo',
    title: row.title,
    description: row.description,
    category: row.category,
    deadline: row.deadline,
    status: row.status,
    submissionNotes: row.submission_notes || undefined,
    submissionUrl: row.submission_url || undefined,
    createdAt: String(row.created_at || '').slice(0, 10),
    quarter: row.quarter || undefined
  }));

  const documents: Document[] = await Promise.all((documentsResult.data || []).map(async (row: any) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    date: row.document_date,
    content: await signedDocumentUrl(row.content),
    mimeType: row.mime_type || undefined,
    sizeBytes: row.size_bytes == null ? undefined : numberValue(row.size_bytes),
    contentHash: row.content_hash || undefined,
    pageCount: row.page_count == null ? undefined : numberValue(row.page_count)
  })));

  const declarations: TaxDeclaration[] = (declarationsResult.data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    quarter: row.quarter,
    year: row.year,
    modelType: row.model_type,
    title: row.title,
    grossIncome: numberValue(row.gross_income),
    deductibleExpenses: numberValue(row.deductible_expenses),
    netYield: numberValue(row.net_yield),
    taxAmount: numberValue(row.tax_amount),
    status: row.status,
    filingReference: row.filing_reference || undefined,
    filedAt: row.filed_at || undefined,
    gestorId: row.gestor_id || undefined
  }));

  const payments: Payment[] = (paymentsResult.data || []).map((row: any) => ({
    id: row.id,
    platform: row.platform,
    amount: numberValue(row.amount),
    date: row.date,
    status: row.status,
    estimated: Boolean(row.estimated),
    domain: row.domain || undefined
  }));

  localStorage.setItem(KEYS.incomes, JSON.stringify(incomes));
  localStorage.setItem(KEYS.expenses, JSON.stringify(expenses));
  localStorage.setItem(KEYS.requirements, JSON.stringify(requirements));
  localStorage.setItem(KEYS.documents, JSON.stringify(documents));
  localStorage.setItem(KEYS.declarations, JSON.stringify(declarations));
  localStorage.setItem(KEYS.payments, JSON.stringify(payments));

  return { incomes, expenses, requirements, documents, declarations, payments };
};

type OperationalSnapshot = {
  currentUser: User;
  users: User[];
  incomes: Income[];
  expenses: Expense[];
  requirements: GestorRequirement[];
  documents: Document[];
  declarations: TaxDeclaration[];
  payments: Payment[];
};

export const deleteRemoteExpense = async (expenseId: string) => {
  const { data, error: readError } = await supabase
    .from('expenses')
    .select('receipt_url')
    .eq('id', expenseId)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;

  const path = data?.receipt_url as string | undefined;
  if (path && !path.startsWith('http')) {
    const { error: storageError } = await supabase.storage.from('labora-documents').remove([path]);
    if (storageError) console.warn('No se pudo borrar el justificante huérfano.', storageError);
  }
};

export const deleteRemoteDocument = async (documentId: string) => {
  const { data, error: readError } = await supabase
    .from('documents')
    .select('content')
    .eq('id', documentId)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  if (error) throw error;

  const path = data?.content as string | undefined;
  if (path && !path.startsWith('http')) {
    const { error: storageError } = await supabase.storage.from('labora-documents').remove([path]);
    if (storageError) console.warn('No se pudo borrar el archivo huérfano.', storageError);
  }
};

export const syncOperationalSnapshot = async (snapshot: OperationalSnapshot) => {
  const { currentUser, users, incomes, expenses, requirements, documents, declarations, payments } = snapshot;
  const linkedIds = new Set(users.filter((user) => user.managerId === currentUser.id).map((user) => user.id));
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  if (!isManager) {
    const ownExpenseItems = expenses.filter((expense) => expense.userId === currentUser.id);
    const ownDocumentItems = documents.filter((document) => document.userId === currentUser.id);

    const [remoteExpenseIds, remoteDocumentIds] = await Promise.all([
      supabase.from('expenses').select('id').eq('user_id', currentUser.id),
      supabase.from('documents').select('id').eq('user_id', currentUser.id)
    ]);
    if (remoteExpenseIds.error) throw remoteExpenseIds.error;
    if (remoteDocumentIds.error) throw remoteDocumentIds.error;

    const localExpenseIds = new Set(ownExpenseItems.map((item) => item.id));
    const localDocumentIds = new Set(ownDocumentItems.map((item) => item.id));

    for (const row of remoteExpenseIds.data || []) {
      if (!localExpenseIds.has(row.id)) await deleteRemoteExpense(row.id);
    }
    for (const row of remoteDocumentIds.data || []) {
      if (!localDocumentIds.has(row.id)) await deleteRemoteDocument(row.id);
    }

    const ownIncomes = incomes.filter((item) => item.userId === currentUser.id).map((item) => ({
      id: item.id, user_id: item.userId, platform: item.platform, date: item.date, amount: item.amount, retention: item.retention
    }));
    if (ownIncomes.length) await supabase.from('incomes').upsert(ownIncomes);

    const ownExpenses: any[] = [];
    for (const item of ownExpenseItems) {
      let receiptPath: string | undefined;
      if (item.receiptUrl?.startsWith('data:')) {
        receiptPath = await uploadOperationalFile(currentUser.id, item.receiptUrl, `expense_${item.id}`);
      }
      ownExpenses.push({
        id: item.id,
        user_id: item.userId,
        category: item.category,
        merchant: item.merchant || null,
        date: item.date,
        amount: item.amount,
        ...(receiptPath ? { receipt_url: receiptPath } : {}),
        receipt_hash: item.receiptHash || null,
        receipt_mime_type: item.receiptMimeType || null,
        ocr_confidence: item.ocrConfidence ?? null,
        ocr_needs_review: item.ocrNeedsReview ?? true,
        ocr_uncertain_fields: item.ocrUncertainFields || null,
        notes: item.notes || null,
        is_recurring: Boolean(item.isRecurring),
        vat_rate: item.vatRate ?? null,
        vat_amount: item.vatAmount ?? null,
        fuel_litres: item.fuelLitres ?? null,
        fuel_type: item.fuelType || null,
        status: item.status || 'pending_review',
        gestor_notes: item.gestorNotes || null,
        deductible_percentage: item.deductiblePercentage ?? 0,
        invoice_number: item.invoiceNumber || null
      });
    }
    if (ownExpenses.length) {
      const { error } = await supabase.from('expenses').upsert(ownExpenses);
      if (error) throw error;
    }

    const ownDocuments: any[] = [];
    for (const item of ownDocumentItems) {
      let contentPath: string | undefined;
      if (item.content?.startsWith('data:')) {
        contentPath = await uploadOperationalFile(currentUser.id, item.content, `document_${item.id}`);
      }
      ownDocuments.push({
        id: item.id,
        user_id: item.userId,
        type: item.type,
        name: item.name,
        document_date: item.date,
        ...(contentPath ? { content: contentPath } : {}),
        mime_type: item.mimeType || null,
        size_bytes: item.sizeBytes ?? null,
        content_hash: item.contentHash || null,
        page_count: item.pageCount ?? null
      });
    }
    if (ownDocuments.length) {
      const { error } = await supabase.from('documents').upsert(ownDocuments);
      if (error) throw error;
    }

    const ownPayments = payments.map((item) => ({
      id: item.id,
      user_id: currentUser.id,
      platform: item.platform,
      amount: item.amount,
      date: item.date,
      status: item.status,
      estimated: item.estimated,
      domain: item.domain || null
    }));
    if (ownPayments.length) await supabase.from('payments').upsert(ownPayments);
  } else {
    for (const expense of expenses.filter((item) => linkedIds.has(item.userId))) {
      await supabase.from('expenses').update({
        status: expense.status || 'pending_review',
        gestor_notes: expense.gestorNotes || null,
        deductible_percentage: expense.deductiblePercentage ?? 0
      }).eq('id', expense.id);
    }
  }

  for (const requirement of requirements) {
    if (requirement.managerId === currentUser.id) {
      await supabase.from('requirements').upsert({
        id: requirement.id,
        manager_id: requirement.managerId,
        rider_id: requirement.riderId,
        title: requirement.title,
        description: requirement.description,
        category: requirement.category,
        deadline: requirement.deadline,
        status: requirement.status,
        submission_notes: requirement.submissionNotes || null,
        submission_url: requirement.submissionUrl || null,
        quarter: requirement.quarter || null
      });
    } else if (requirement.riderId === currentUser.id) {
      await supabase.from('requirements').update({
        status: requirement.status,
        submission_notes: requirement.submissionNotes || null,
        submission_url: requirement.submissionUrl || null
      }).eq('id', requirement.id);
    }
  }

  for (const declaration of declarations.filter((item) => item.userId === currentUser.id || linkedIds.has(item.userId))) {
    const payload = {
      id: declaration.id,
      user_id: declaration.userId,
      quarter: declaration.quarter,
      year: declaration.year,
      model_type: declaration.modelType,
      title: declaration.title,
      gross_income: declaration.grossIncome,
      deductible_expenses: declaration.deductibleExpenses,
      net_yield: declaration.netYield,
      tax_amount: declaration.taxAmount,
      status: declaration.status,
      filing_reference: declaration.filingReference || null,
      filed_at: declaration.filedAt || null,
      gestor_id: declaration.gestorId || null
    };
    if (declaration.userId === currentUser.id) await supabase.from('tax_declarations').upsert(payload);
    else if (isManager) await supabase.from('tax_declarations').update(payload).eq('id', declaration.id);
  }
};
