import React, { useState } from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import { deleteCurrentAccount } from '../services/accountDeletion';

interface Props {
  onDeleted: () => void;
  onError: (message: string) => void;
}

const AccountDeletionCard: React.FC<Props> = ({ onDeleted, onError }) => {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmation.trim().toUpperCase() === 'ELIMINAR';

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteCurrentAccount();
      onDeleted();
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'No se pudo eliminar la cuenta de forma completa.';
      onError(message);
      setDeleting(false);
    }
  };

  return (
    <section className="labora-card p-4 sm:p-5">
      <p className="labora-kicker text-[var(--labora-muted)]">Cuenta</p>
      <h2 className="mt-1 text-base font-extrabold text-[var(--labora-ink)]">Eliminar cuenta y datos</h2>
      <p className="mt-1 text-xs leading-relaxed text-[var(--labora-muted)]">
        Elimina tu usuario de Auth, los archivos privados de Labora+ y los datos asociados que dependen de tu perfil. Esta acción es irreversible.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-4 py-2.5 text-xs font-extrabold text-[var(--labora-clay-deep)] hover:brightness-95"
        >
          <Trash2 size={15} /> Eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-4 rounded-[14px] border border-[var(--labora-clay)]/30 bg-[var(--labora-soft-clay)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[var(--labora-clay-deep)]">Confirmación irreversible</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--labora-muted)]">
                Escribe <strong>ELIMINAR</strong> para confirmar. No usamos un borrado simulado ni dejamos la cuenta Auth activa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirmation(''); }}
              disabled={deleting}
              className="rounded-lg p-1.5 text-[var(--labora-muted)] hover:bg-white/50 disabled:opacity-50"
              aria-label="Cancelar eliminación"
            >
              <X size={16} />
            </button>
          </div>
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={deleting}
            autoComplete="off"
            className="mt-3 w-full rounded-[12px] border border-[var(--labora-border)] bg-[var(--labora-surface)] px-3 py-2.5 text-sm font-bold uppercase outline-none focus:border-[var(--labora-clay)]"
            placeholder="ELIMINAR"
            aria-label="Escribe ELIMINAR para confirmar"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] bg-[var(--labora-clay-deep)] px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
          </button>
        </div>
      )}
    </section>
  );
};

export default AccountDeletionCard;
