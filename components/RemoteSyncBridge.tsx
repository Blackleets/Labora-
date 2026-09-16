import React, { useEffect, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { loadRemoteOperationalData, syncOperationalSnapshot } from '../services/remoteOperational';

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

  const fingerprint = useMemo(() => JSON.stringify({
    userId: currentUser?.id,
    users: users.map((user) => [user.id, user.managerId, user.name, user.photoUrl]),
    incomes,
    expenses,
    requirements,
    documents,
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

  return null;
};

export default RemoteSyncBridge;
