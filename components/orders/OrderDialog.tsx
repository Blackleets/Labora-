import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { formControlFocusClass } from '../formA11y';

/** Diálogo modal del módulo de pedidos (hoja inferior en móvil). */
export const Dialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[22px] bg-[var(--labora-surface)] p-5 shadow-xl sm:rounded-[22px]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[var(--labora-ink)]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={`flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--labora-muted)] ${formControlFocusClass}`}><X size={18} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
};
