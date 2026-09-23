import React, { useEffect, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { loadRemoteOperationalData, syncOperationalSnapshot } from '../services/remoteOperational';
import { supabase } from '../services/supabaseClient';
import { operationalCacheFingerprint } from '../services/operationalCache';

const RemoteSyncBridge: React.FC = () => {
  const {
    currentUser,
    users,
    incomes,
    expenses,
    requirements,
    documents,
    declarations,
    payments,
    showNotification
  } = useData();

  const hydrationRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);
  const lastSyncErrorAtRef = useRef(0);

  const reportSyncError = (code: string, error: unknown) => {
    console.error(`[${code}]`, error);
    const now = Date.now();
    if (now - lastSyncErrorAtRef.current < 60_000) return;
    lastSyncErrorAtRef.current = now;
    showNotification(
      'error',
      'No se pudo sincronizar con la nube. Tus cambios siguen en este dispositivo y volveremos a intentarlo.'
    );
  };

  const fingerprint = useMemo(() => JSON.stringify({
    userId: currentUser?.id,
    users: users.map((user) => [user.id, user.managerId, user.name, user.photoUrl]),
    incomes,
    expenses: expenses.map((item) => ({ ...item, receiptUrl: item.receiptUrl?.startsWith('data:') ? 'local-file' : item.receiptUrl })),
    requirements,
    documents: documents.map((item) => ({ ...item, content: item.content?.startsWith('data:') ? 'local-file' : item.content })),
    declarations,
    payments
  }), [currentUser?.id, users, incomes, expenses, requirements, documents, declarations, payments]);

  useEffect(() => {
    if (!currentUser || hydrationRef.current) return;

    const hydrationKey = `labora_remote_hydrated:${currentUser.id}`;
    if (sessionStorage.getItem(hydrationKey) === 'true') {
      hydrationRef.current = true;
      return;
    }

    let active = true;
    hydrationRef.current = true;

    const hydrate = async () => {
      try {
        const before = operationalCacheFingerprint(currentUser.id);

        await loadRemoteOperationalData(users);
        if (!active) return;
        sessionStorage.setItem(hydrationKey, 'true');

        const after = operationalCacheFingerprint(currentUser.id);

        if (before !== after) window.location.reload();
      } catch (error) {
        reportSyncError('LABORA_SYNC_HYDRATE_FAILED', error);
        hydrationRef.current = false;
      }
    };

    void hydrate();
    return () => { active = false; };
  }, [currentUser, users]);

  useEffect(() => {
    if (!currentUser) return;
    const hydrationKey = `labora_remote_hydrated:${currentUser.id}`;
    if (sessionStorage.getItem(hydrationKey) !== 'true') return;

    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      void syncOperationalSnapshot({
        currentUser,
        users,
        incomes,
        expenses,
        requirements,
        documents,
        declarations,
        payments
      }).catch((error) => reportSyncError('LABORA_SYNC_WRITE_FAILED', error));
    }, 700);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [fingerprint, currentUser, users, incomes, expenses, requirements, documents, declarations, payments]);

  useEffect(() => {
    if (!currentUser) return;

    const isAlreadyLocal = (table: string, row: any) => {
      if (!row?.id) return false;
      if (table === 'incomes') {
        return incomes.some((item) =>
          item.id === row.id
          && item.amount === Number(row.amount)
          && item.date === row.date
          && item.platform === row.platform
          && item.retention === Number(row.retention || 0)
          && (item.sourceType || 'manual') === (row.source_type || 'manual')
          && Boolean(item.needsReview ?? false) === Boolean(row.needs_review ?? false)
          && (item.sourceDocumentId || null) === (row.source_document_id || null)
          && (item.sourceHash || null) === (row.source_hash || null)
          && (item.reviewedBy || null) === (row.reviewed_by || null)
          && (item.reviewedAt || null) === (row.reviewed_at || null)
          && (item.reviewNote || null) === (row.review_note || null)
        );
      }
      if (table === 'expenses') {
        return expenses.some((item) => item.id === row.id && item.amount === Number(row.amount) && item.date === row.date && item.category === row.category && (item.status || 'pending_review') === row.status && (item.gestorNotes || null) === (row.gestor_notes || null) && (item.deductiblePercentage ?? 0) === Number(row.deductible_percentage ?? 0));
      }
      if (table === 'requirements') {
        return requirements.some((item) =>
          item.id === row.id
          && item.status === row.status
          && item.title === row.title
          && item.deadline === row.deadline
          && (item.submissionNotes || null) === (row.submission_notes || null)
          && (item.submissionUrl || null) === (row.submission_url || null)
          && (item.submittedBy || null) === (row.submitted_by || null)
          && (item.submittedAt || null) === (row.submitted_at || null)
          && (item.reviewedBy || null) === (row.reviewed_by || null)
          && (item.reviewedAt || null) === (row.reviewed_at || null)
          && (item.reviewNote || null) === (row.review_note || null)
        );
      }
      if (table === 'documents') {
        return documents.some((item) => item.id === row.id && item.name === row.name && item.date === row.document_date);
      }
      if (table === 'tax_declarations') {
        return declarations.some((item) =>
          item.id === row.id
          && item.status === row.status
          && item.taxAmount === Number(row.tax_amount)
          && (item.reviewedBy || null) === (row.reviewed_by || null)
          && (item.reviewedAt || null) === (row.reviewed_at || null)
          && (item.reviewNote || null) === (row.review_note || null)
          && (item.filingReference || null) === (row.filing_reference || null)
          && (item.filingEvidenceUrl || null) === (row.filing_evidence_url || null)
          && (item.filedBy || null) === (row.filed_by || null)
          && (item.filedAt || null) === (row.filed_at || null)
        );
      }
      if (table === 'payments') {
        return payments.some((item) => item.id === row.id && item.status === row.status && item.amount === Number(row.amount) && item.date === row.date);
      }
      return false;
    };

    const refresh = async (table: string, payload: any) => {
      if (refreshingRef.current) return;
      if (payload.eventType !== 'DELETE' && isAlreadyLocal(table, payload.new)) return;
      refreshingRef.current = true;
      try {
        await loadRemoteOperationalData(users);
        window.location.reload();
      } catch (error) {
        reportSyncError('LABORA_SYNC_REALTIME_REFRESH_FAILED', error);
        refreshingRef.current = false;
      }
    };

    const channel = supabase.channel(`labora-workspace-${currentUser.id}`);
    ['incomes', 'expenses', 'requirements', 'documents', 'tax_declarations', 'payments'].forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => void refresh(table, payload));
    });
    channel.subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [currentUser, users, incomes, expenses, requirements, documents, declarations, payments]);

  return null;
};

export default RemoteSyncBridge;
