import React from 'react';
import { Building2, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { BankConnection } from '../types';

interface BankConnectFlowProps {
  userId: string;
  onClose: () => void;
  onSuccess: (connection: BankConnection) => void;
}

/**
 * Legacy compatibility shell.
 *
 * Labora+ does not currently have a regulated Open Banking provider wired.
 * This component intentionally performs no OAuth, callback simulation,
 * credential collection or fake connection success.
 */
export const BankConnectFlow: React.FC<BankConnectFlowProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#18211C]/60 p-4 backdrop-blur-sm">
    <section className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#E3DBD0] bg-[#FFFDF9] shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-[#E8E1D7] px-5 py-4">
        <div className="flex items-center gap-2 text-[#214E3A]">
          <LockKeyhole size={17} />
          <span className="text-sm font-extrabold">Banca protegida</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-stone-400 hover:bg-[#F1ECE3]"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </header>

      <div className="p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#E7F0EA] text-[#214E3A]">
          <Building2 size={21} />
        </div>
        <p className="labora-kicker mt-4 text-[#789582]">Open Banking · próximamente</p>
        <h2 className="labora-display mt-1 text-xl font-semibold text-[#1E231F]">
          Conexión bancaria todavía no habilitada.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Labora+ no simula autorizaciones bancarias ni conexiones exitosas. Este flujo se activará únicamente
          cuando exista un proveedor regulado integrado, consentimiento explícito y callbacks OAuth reales.
        </p>

        <div className="mt-4 rounded-[14px] border border-[#D7E5DC] bg-[#F1F7F3] p-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#214E3A]">
            <ShieldCheck size={15} /> Sin credenciales en Labora+
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
            Nunca introduzcas aquí la contraseña de tu banco. Mientras tanto: importa liquidaciones en Movimientos → Ingresos (CSV o texto), sin fingir conexión.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-[13px] bg-[#214E3A] py-3 text-sm font-extrabold text-white hover:bg-[#183D2D]"
        >
          Entendido
        </button>
      </div>
    </section>
  </div>
);
