import React from 'react';
import { Building2, LockKeyhole, ShieldCheck } from 'lucide-react';

export const BankingConnect: React.FC = () => {
  return (
    <section className="rounded-2xl border border-[#E3DCD2] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2ED] text-[#2E5A44]">
          <Building2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">Conexión bancaria</h2>
            <span className="rounded-full border border-[#E4DDD3] bg-[#F8F5F0] px-2.5 py-1 text-[10px] font-bold text-stone-500">Próximamente</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
            Labora+ no solicita ni almacena contraseñas bancarias. La conexión se habilitará únicamente mediante un proveedor Open Banking regulado bajo PSD2, con consentimiento explícito y acceso de solo lectura para conciliación.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E6E0D7] bg-[#FAF8F4] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700"><LockKeyhole size={15} className="text-[#2E5A44]" /> Sin credenciales en Labora+</div>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500">El inicio de sesión ocurre con el banco o proveedor autorizado, no dentro de nuestra app.</p>
            </div>
            <div className="rounded-xl border border-[#E6E0D7] bg-[#FAF8F4] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700"><ShieldCheck size={15} className="text-[#2E5A44]" /> Solo lectura</div>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500">La primera integración se limitará a saldos y movimientos; no iniciará pagos.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
