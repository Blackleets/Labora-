import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { loadRemoteOperationalData, syncOperationalSnapshot } from '../services/remoteOperational';
import { supabase } from '../services/supabaseClient';
import {
  canResumeHydratedCache,
  markOperationalCacheSubmitted,
  operationalCacheFingerprint,
  OperationalCacheConflictError
} from '../services/operationalCache';

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

  const hydrationRef = useRef<{ userId: string; ready: boolean } | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const activeUserIdRef = useRef(currentUser?.id);
  activeUserIdRef.current = currentUser?.id;
  const refreshingRef = useRef(false);
  const lastSyncErrorAtRef = useRef(0);

  const reportSyncError = (code: string, error: unknown) => {
    console.error(`[${code}]`, error);
    const now = Date.now();
    if (now - lastSyncErrorAtRef.current < 60_000) return;
    lastSyncErrorAtRef.current = now;
    showNotification(
      'error',
      error instanceof OperationalCacheConflictError
        ? 'Hay datos locales pendientes. La sincronización se ha pausado para evitar perderlos; no cierres sesión.'
        : 'No se pudo sincronizar con la nube. Los cambios permanecen en este dispositivo; no cierres sesión.'
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
    if (!currentUser) {
      hydrationRef.current = null;
      setHydratedUserId(null);
      return;
    }
    if (hydrationRef.current?.userId === currentUser.id && hydrationRef.current.ready) return;

    const hydrationKey = `labora_remote_hydrated:${currentUser.id}`;
    let receipt: string | null = null;
    try {
      receipt = sessionStorage.getItem(hydrationKey);
      sessionStorage.removeItem(hydrationKey);
    } catch {
      // Storage access is optional, but remote writes need verified hydration.
    }
    if (canResumeHydratedCache(currentUser.id, receipt)) {
      hydrationRef.current = { userId: currentUser.id, ready: true };
      setHydratedUserId(currentUser.id);
      return;
    }

    let active = true;

    const hydrate = async () => {
      try {
        const before = operationalCacheFingerprint(currentUser.id);

        const result = await loadRemoteOperationalData(users, currentUser.id, before);
        if (!active) return;
        if (!result.cachePersisted) throw new Error('La caché local no está disponible. Sincronización desactivada.');

        const after = operationalCacheFingerprint(currentUser.id);

        if (before !== after) {
          sessionStorage.setItem(hydrationKey, after);
          window.location.reload();
          return;
        }
        hydrationRef.current = { userId: currentUser.id, ready: true };
        setHydratedUserId(currentUser.id);
      } catch (error) {
        if (active) reportSyncError('LABORA_SYNC_HYDRATE_FAILED', error);
      }
    };

    void hydrate();
    return () => { active = false; };
  }, [currentUser, users]);

  useEffect(() => {
    if (!currentUser) return;
    if (hydratedUserId !== currentUser.id) return;

    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      const submittedFingerprint = operationalCacheFingerprint(currentUser.id);
      const previousSync = syncInFlightRef.current;
      const sync = (async () => {
        if (previousSync) await previousSync;
        if (activeUserIdRef.current !== currentUser.id
          || operationalCacheFingerprint(currentUser.id) !== submittedFingerprint) return;

        await syncOperationalSnapshot({
          currentUser,
          users,
          incomes,
          expenses,
          requirements,
          documents,
          declarations,
          payments
        });
        if (activeUserIdRef.current === currentUser.id
          && operationalCacheFingerprint(currentUser.id) === submittedFingerprint
          && !markOperationalCacheSubmitted(currentUser.id, submittedFingerprint)) {
          throw new Error('No se pudo guardar la confirmación local de sincronización.');
        }
      })().catch((error) => {
        if (activeUserIdRef.current === currentUser.id) reportSyncError('LABORA_SYNC_WRITE_FAILED', error);
      });
      syncInFlightRef.current = sync;
      void sync.then(() => {
        if (syncInFlightRef.current === sync) syncInFlightRef.current = null;
      });
    }, 700);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [fingerprint, hydratedUserId, currentUser, users, incomes, expenses, requirements, documents, declarations, payments]);

  useEffect(() => {
    if (!currentUser || hydratedUserId !== currentUser.id) return;

    let active = true;

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
      let reloading = false;
      try {
        while (syncInFlightRef.current) await syncInFlightRef.current;
        if (!active) return;
        if (payload.eventType !== 'DELETE' && isAlreadyLocal(table, payload.new)) return;
        const before = operationalCacheFingerprint(currentUser.id);
        const result = await loadRemoteOperationalData(users, currentUser.id, before);
        if (!active) return;
        if (!result.cachePersisted) throw new Error('La caché local no está disponible. Sincronización desactivada.');
        sessionStorage.setItem(
          `labora_remote_hydrated:${currentUser.id}`,
          operationalCacheFingerprint(currentUser.id)
        );
        reloading = true;
        window.location.reload();
      } catch (error) {
        if (!active) return;
        reportSyncError('LABORA_SYNC_REALTIME_REFRESH_FAILED', error);
        if (error instanceof OperationalCacheConflictError) {
          hydrationRef.current = null;
          setHydratedUserId(null);
        }
      } finally {
        if (!reloading) refreshingRef.current = false;
      }
    };

    const channel = supabase.channel(`labora-workspace-${currentUser.id}`);
    ['incomes', 'expenses', 'requirements', 'documents', 'tax_declarations', 'payments'].forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => void refresh(table, payload));
    });
    channel.subscribe();

    return () => { active = false; void supabase.removeChannel(channel); };
  }, [hydratedUserId, currentUser, users, incomes, expenses, requirements, documents, declarations, payments]);

  return null;
};

export default RemoteSyncBridge;
