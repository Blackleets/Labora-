import React, { useEffect, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { loadRemoteOperationalData, syncOperationalSnapshot } from '../services/remoteOperational';
import { supabase } from '../services/supabaseClient';

const RemoteSyncBridge: React.FC = () => {
  const {
    currentUser,
    users,
    incomes,
    expenses,
    requirements,
    documents,
    declarations,
    payments
  } = useData();

  const hydrationRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);

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
        const before = JSON.stringify({
          incomes: localStorage.getItem('labora_incomes'),
          expenses: localStorage.getItem('labora_expenses'),
          requirements: localStorage.getItem('labora_requirements'),
          documents: localStorage.getItem('labora_docs'),
          declarations: localStorage.getItem('labora_declarations'),
          payments: localStorage.getItem('labora_payments')
        });

        await loadRemoteOperationalData(users);
        if (!active) return;
        sessionStorage.setItem(hydrationKey, 'true');

        const after = JSON.stringify({
          incomes: localStorage.getItem('labora_incomes'),
          expenses: localStorage.getItem('labora_expenses'),
          requirements: localStorage.getItem('labora_requirements'),
          documents: localStorage.getItem('labora_docs'),
          declarations: localStorage.getItem('labora_declarations'),
          payments: localStorage.getItem('labora_payments')
        });

        if (before !== after) window.location.reload();
      } catch (error) {
        console.error('No se pudo cargar el workspace remoto.', error);
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
      }).catch((error) => console.error('No se pudo sincronizar el workspace.', error));
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
        );
      }
      if (table === 'expenses') {
        return expenses.some((item) => item.id === row.id && item.amount === Number(row.amount) && item.date === row.date && item.category === row.category && (item.status || 'pending_review') === row.status && (item.gestorNotes || null) === (row.gestor_notes || null) && (item.deductiblePercentage ?? 0) === Number(row.deductible_percentage ?? 0));
      }
      if (table === 'requirements') {
        return requirements.some((item) => item.id === row.id && item.status === row.status && item.title === row.title && item.deadline === row.deadline && (item.submissionNotes || null) === (row.submission_notes || null));
      }
      if (table === 'documents') {
        return documents.some((item) => item.id === row.id && item.name === row.name && item.date === row.document_date);
      }
      if (table === 'tax_declarations') {
        return declarations.some((item) => item.id === row.id && item.status === row.status && item.taxAmount === Number(row.tax_amount) && (item.filingReference || null) === (row.filing_reference || null));
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
        console.error('No se pudo refrescar un cambio remoto.', error);
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
