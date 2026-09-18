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
    retention: numberValue(row.retention),
    sourceType: row.source_type || 'manual',
    sourceReference: row.source_reference || undefined,
    externalId: row.external_id || undefined,
    confidence: row.confidence == null ? undefined : numberValue(row.confidence),
    needsReview: row.needs_review == null ? true : Boolean(row.needs_review),
    importedAt: row.imported_at || undefined,
    sourceDocumentId: row.source_document_id || undefined,
    sourceHash: row.source_hash || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewNote: row.review_note || undefined
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
    submittedBy: row.submitted_by || undefined,
    submittedAt: row.submitted_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewNote: row.review_note || undefined,
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
    calculationState: 'recorded',
    status: row.status,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewNote: row.review_note || undefined,
    filingReference: row.filing_reference || undefined,
    filingEvidenceUrl: row.filing_evidence_url || undefined,
    filedBy: row.filed_by || undefined,
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

export const reviewRemoteIncome = async (
  incomeId: string,
  action: 'reviewed' | 'needs_fix',
  note?: string
) => {
  const { error } = await supabase.rpc('review_income', {
    p_income_id: incomeId,
    p_action: action,
    p_note: note || null
  });
  if (error) throw error;
};

export const createRemoteRequirement = async (requirement: GestorRequirement) => {
  const { error } = await supabase.rpc('create_requirement', {
    p_id: requirement.id,
    p_rider_id: requirement.riderId,
    p_title: requirement.title,
    p_deadline: requirement.deadline,
    p_description: requirement.description || '',
    p_category: requirement.category || 'other',
    p_quarter: requirement.quarter || null
  });
  if (error) throw error;
};

export const updateRemoteRequirementDefinition = async (requirement: GestorRequirement) => {
  const { error } = await supabase.rpc('update_requirement_definition', {
    p_requirement_id: requirement.id,
    p_title: requirement.title,
    p_deadline: requirement.deadline,
    p_description: requirement.description || '',
    p_category: requirement.category || 'other',
    p_quarter: requirement.quarter || null
  });
  if (error) throw error;
};

export const submitRemoteRequirement = async (
  requirementId: string,
  notes?: string,
  proofUrl?: string
) => {
  const { error } = await supabase.rpc('submit_requirement', {
    p_requirement_id: requirementId,
    p_submission_notes: notes || null,
    p_submission_url: proofUrl || null
  });
  if (error) throw error;
};

export const reviewRemoteRequirement = async (
  requirementId: string,
  note?: string
) => {
  const { error } = await supabase.rpc('review_requirement', {
    p_requirement_id: requirementId,
    p_action: 'approved',
    p_note: note || null
  });
  if (error) throw error;
};

export const saveRemoteTaxDeclarationDraft = async (declaration: TaxDeclaration) => {
  const { error } = await supabase.rpc('save_tax_declaration_draft', {
    p_id: declaration.id,
    p_user_id: declaration.userId,
    p_quarter: declaration.quarter,
    p_year: declaration.year,
    p_model_type: declaration.modelType,
    p_title: declaration.title,
    p_gross_income: declaration.grossIncome,
    p_deductible_expenses: declaration.deductibleExpenses,
    p_net_yield: declaration.netYield,
    p_tax_amount: declaration.taxAmount
  });
  if (error) throw error;
};

export const reviewRemoteTaxDeclaration = async (
  declarationId: string,
  note?: string
) => {
  const { error } = await supabase.rpc('review_tax_declaration', {
    p_declaration_id: declarationId,
    p_note: note || null
  });
  if (error) throw error;
};

export const fileRemoteTaxDeclaration = async (
  declarationId: string,
  filingReference: string,
  evidenceUrl?: string
) => {
  const { error } = await supabase.rpc('file_tax_declaration', {
    p_declaration_id: declarationId,
    p_filing_reference: filingReference,
    p_evidence_url: evidenceUrl || null
  });
  if (error) throw error;
};

export const reviewRemoteExpense = async (
  expenseId: string,
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_fix',
  note?: string,
  deductiblePercentage = 0
) => {
  const { error } = await supabase.rpc('review_expense', {
    p_expense_id: expenseId,
    p_status: status,
    p_note: note || null,
    p_deductible_percentage: deductiblePercentage
  });
  if (error) throw error;
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
    const remoteExpenseIdSet = new Set((remoteExpenseIds.data || []).map((item) => item.id));
    const localDocumentIds = new Set(ownDocumentItems.map((item) => item.id));

    for (const row of remoteExpenseIds.data || []) {
      if (!localExpenseIds.has(row.id)) await deleteRemoteExpense(row.id);
    }
    for (const row of remoteDocumentIds.data || []) {
      if (!localDocumentIds.has(row.id)) await deleteRemoteDocument(row.id);
    }

    for (const item of ownExpenseItems) {
      let receiptPath: string | undefined;
      if (item.receiptUrl?.startsWith('data:')) {
        receiptPath = await uploadOperationalFile(currentUser.id, item.receiptUrl, `expense_${item.id}`);
      }

      const rawExpense = {
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
        vat_rate: item.vatRate ?? 0,
        vat_amount: item.vatAmount ?? 0,
        fuel_litres: item.fuelLitres ?? null,
        fuel_type: item.fuelType || null,
        invoice_number: item.invoiceNumber || null
      };

      if (remoteExpenseIdSet.has(item.id)) {
        const { error } = await supabase
          .from('expenses')
          .update(rawExpense)
          .eq('id', item.id)
          .eq('user_id', currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert({
          id: item.id,
          user_id: item.userId,
          ...rawExpense
        });
        if (error) throw error;
      }
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

    const ownIncomes = incomes.filter((item) => item.userId === currentUser.id).map((item) => ({
      id: item.id,
      user_id: item.userId,
      platform: item.platform,
      date: item.date,
      amount: item.amount,
      retention: item.retention,
      source_type: item.sourceType || 'manual',
      source_reference: item.sourceReference || null,
      external_id: item.externalId || null,
      confidence: item.confidence ?? null,
      needs_review: item.needsReview ?? false,
      imported_at: item.importedAt || new Date().toISOString(),
      source_document_id: item.sourceDocumentId || null,
      source_hash: item.sourceHash || null
    }));
    if (ownIncomes.length) {
      const { error } = await supabase.from('incomes').upsert(ownIncomes);
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
      await reviewRemoteExpense(
        expense.id,
        expense.status || 'pending_review',
        expense.gestorNotes,
        expense.deductiblePercentage ?? 0
      );
    }
  }

  const { data: remoteRequirementRows, error: remoteRequirementError } = await supabase
    .from('requirements')
    .select('id, manager_id, rider_id, title, description, category, deadline, status, submission_notes, submission_url, quarter, submitted_at, reviewed_by, reviewed_at, review_note');
  if (remoteRequirementError) throw remoteRequirementError;

  const remoteRequirementsById = new Map(
    (remoteRequirementRows || []).map((row: any) => [row.id, row])
  );

  for (const requirement of requirements) {
    const remote = remoteRequirementsById.get(requirement.id) as any | undefined;

    if (requirement.managerId === currentUser.id) {
      if (!remote) {
        await createRemoteRequirement(requirement);
        continue;
      }

      if (remote.manager_id !== currentUser.id || remote.rider_id !== requirement.riderId) {
        continue;
      }

      const definitionChanged =
        remote.title !== requirement.title
        || (remote.description || '') !== (requirement.description || '')
        || remote.category !== requirement.category
        || remote.deadline !== requirement.deadline
        || (remote.quarter || null) !== (requirement.quarter || null);

      if (definitionChanged && remote.status === 'pending') {
        await updateRemoteRequirementDefinition(requirement);
      }

      if (requirement.status === 'approved' && remote.status === 'submitted') {
        await reviewRemoteRequirement(requirement.id, requirement.reviewNote);
      }
    } else if (
      requirement.riderId === currentUser.id
      && remote
      && remote.rider_id === currentUser.id
      && requirement.status === 'submitted'
      && remote.status === 'pending'
    ) {
      await submitRemoteRequirement(
        requirement.id,
        requirement.submissionNotes,
        requirement.submissionUrl
      );
    }
  }

  const { data: remoteDeclarationRows, error: remoteDeclarationError } = await supabase
    .from('tax_declarations')
    .select('id, user_id, quarter, year, model_type, title, gross_income, deductible_expenses, net_yield, tax_amount, status, reviewed_by, reviewed_at, review_note, filing_reference, filing_evidence_url, filed_by, filed_at, gestor_id');
  if (remoteDeclarationError) throw remoteDeclarationError;

  const remoteDeclarationsById = new Map(
    (remoteDeclarationRows || []).map((row: any) => [row.id, row])
  );

  for (const declaration of declarations.filter(
    (item) => item.userId === currentUser.id || linkedIds.has(item.userId)
  )) {
    const remote = remoteDeclarationsById.get(declaration.id) as any | undefined;
    const isOwner = declaration.userId === currentUser.id;
    const canManageLinked = isManager && linkedIds.has(declaration.userId);

    if (!remote) {
      if ((isOwner || canManageLinked) && declaration.status === 'draft') {
        await saveRemoteTaxDeclarationDraft(declaration);
      }
      continue;
    }

    if (remote.user_id !== declaration.userId) continue;

    const draftChanged =
      remote.quarter !== declaration.quarter
      || Number(remote.year) !== declaration.year
      || remote.model_type !== declaration.modelType
      || remote.title !== declaration.title
      || Number(remote.gross_income) !== declaration.grossIncome
      || Number(remote.deductible_expenses) !== declaration.deductibleExpenses
      || Number(remote.net_yield) !== declaration.netYield
      || Number(remote.tax_amount) !== declaration.taxAmount;

    if (declaration.status === 'draft' && remote.status === 'draft' && draftChanged) {
      await saveRemoteTaxDeclarationDraft(declaration);
      continue;
    }

    if (!canManageLinked) continue;

    if (declaration.status === 'reviewed_by_gestor' && remote.status === 'draft') {
      await reviewRemoteTaxDeclaration(declaration.id, declaration.reviewNote);
      continue;
    }

    if (declaration.status === 'filed_with_tax_agency') {
      if (!declaration.filingReference?.trim()) continue;

      if (remote.status === 'draft') {
        await reviewRemoteTaxDeclaration(declaration.id, declaration.reviewNote);
        await fileRemoteTaxDeclaration(
          declaration.id,
          declaration.filingReference,
          declaration.filingEvidenceUrl
        );
      } else if (remote.status === 'reviewed_by_gestor') {
        await fileRemoteTaxDeclaration(
          declaration.id,
          declaration.filingReference,
          declaration.filingEvidenceUrl
        );
      }
    }
  }
};
