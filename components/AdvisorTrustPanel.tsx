import React from 'react';
import { BadgeCheck, Building2, IdCard, ShieldAlert, Users } from 'lucide-react';
import { User } from '../types';
import { getMarketProfile } from '../modules/country-config/marketProfiles';

interface AdvisorTrustPanelProps {
  user: User;
  compact?: boolean;
}

export const AdvisorTrustPanel: React.FC<AdvisorTrustPanelProps> = ({ user, compact = false }) => {
  const market = getMarketProfile(user.countryCode);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
        <ShieldAlert className="h-3.5 w-3.5" /> Gestor no verificado
      </div>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-[#FFF9EB] p-5 text-stone-800 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-amber-800">
            <ShieldAlert className="h-3.5 w-3.5" /> Gestor no verificado
          </div>
          <h2 className="mt-3 font-serif text-xl font-bold text-stone-900">Centro de confianza profesional</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-600">
            Crear una cuenta de gestor solo habilita el espacio de trabajo. Labora+ no mostrará un distintivo de verificación hasta validar evidencia real.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-right text-[11px]">
          <p className="font-bold text-stone-700">Jurisdicción</p>
          <p className="text-stone-500">{market.displayName}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TrustStep icon={<IdCard className="h-4 w-4" />} title="1. Identidad" text="Documento e identidad de la persona." />
        <TrustStep icon={<Building2 className="h-4 w-4" />} title="2. Actividad / despacho" text="Empresa, alta o actividad profesional cuando aplique." />
        <TrustStep icon={<BadgeCheck className="h-4 w-4" />} title="3. Acreditación" text="Colegio, licencia o registro, si existe en el país." />
        <TrustStep icon={<Users className="h-4 w-4" />} title="4. Historial real" text="Clientes que aceptaron el vínculo y trabajo trazable." />
      </div>

      {user.collegiateNumber && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs text-stone-600">
          <strong className="text-stone-800">Acreditación declarada:</strong> {user.collegiateNumber}. Este dato todavía no está verificado y no aumenta el nivel de confianza por sí solo.
        </div>
      )}
    </section>
  );
};

const TrustStep: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="rounded-2xl border border-amber-100 bg-white p-3.5">
    <div className="flex items-center gap-2 text-stone-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7E7BA] text-[#7B5A16]">{icon}</span>
      <p className="text-xs font-black">{title}</p>
    </div>
    <p className="mt-2 text-[11px] leading-relaxed text-stone-500">{text}</p>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">Pendiente</p>
  </div>
);
