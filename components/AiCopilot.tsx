import React, { useState } from 'react';
import assistantIcon from '@material-symbols/svg-400/rounded/wand_stars.svg?url';
import closeIcon from '@material-symbols/svg-400/rounded/close.svg?url';
import FiscalChat from './FiscalChat';

export const AiCopilot = ({ currentView }: { currentView: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-[78px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--labora-primary)] shadow-[0_16px_35px_rgba(33,78,58,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--labora-primary-2)] lg:bottom-7 lg:right-7" aria-label="Abrir copiloto Labora+" title="Copiloto Labora+">
        <img src={assistantIcon} alt="" className="h-7 w-7 invert" aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[var(--labora-ink)]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <section className="relative h-[88dvh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border border-[var(--labora-border)] bg-[var(--labora-surface)] shadow-2xl sm:h-[760px] sm:max-h-[88dvh] sm:rounded-[28px]" role="dialog" aria-modal="true" aria-label="Copiloto Labora+">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10" aria-label="Cerrar copiloto"><img src={closeIcon} alt="" className="h-5 w-5 invert" aria-hidden /></button>
            <FiscalChat embedded contextLabel={currentView} />
          </section>
        </div>
      )}
    </>
  );
};
