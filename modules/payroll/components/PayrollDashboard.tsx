import React from 'react';
import { DollarSign, LockKeyhole, ShieldCheck } from 'lucide-react';

/**
 * Payroll Suite is not a live Labora+ product path.
 * Previously this screen seeded fake employees and ran demo payslips — removed.
 */
export const PayrollDashboard: React.FC = () => (
  <section className="labora-card mx-auto max-w-3xl overflow-hidden">
    <div className="relative overflow-hidden bg-[#214E3A] p-5 text-white sm:p-6">
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-white/10 text-[#F1C56B]">
          <DollarSign size={21} />
        </div>
        <div>
          <p className="labora-kicker text-white/55">Nómina</p>
          <h2 className="labora-display mt-1 text-xl font-semibold text-white">Nómina no habilitada.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            Labora+ no calcula nóminas ni muestra empleados de demostración. El producto actual es para
            autónomos y gestorías (ingresos, gastos, documentos, mensajes y vínculo real).
          </p>
        </div>
      </div>
    </div>
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <div className="rounded-[16px] border border-[#E6E0D7] bg-[#FAF8F4] p-4">
        <LockKeyhole size={16} className="text-[#214E3A]" />
        <p className="mt-3 text-xs font-extrabold text-[#1E231F]">Sin empleados inventados</p>
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
          Cualquier suite de nómina futura usará datos reales de tu organización, no semillas demo.
        </p>
      </div>
      <div className="rounded-[16px] border border-[#E6E0D7] bg-[#FAF8F4] p-4">
        <ShieldCheck size={16} className="text-[#B95635]" />
        <p className="mt-3 text-xs font-extrabold text-[#1E231F]">Producto usable hoy</p>
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
          Dinero, avisos, modelos, mensajería y vínculo autónomo↔gestoría.
        </p>
      </div>
    </div>
  </section>
);
