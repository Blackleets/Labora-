import React from 'react';
import { LockKeyhole, Map, ShieldCheck, Truck } from 'lucide-react';

/**
 * Operations surfaces (live delivery, hot zones, route optimizer) historically
 * shipped with invented orders and demand scores. Until real telemetry exists,
 * this hub stays explicitly unavailable — never a fake live fleet.
 */
export const OperationsHub: React.FC = () => {
  return (
    <section className="labora-card mx-auto max-w-3xl overflow-hidden">
      <div className="relative overflow-hidden bg-[#214E3A] p-5 text-white sm:p-6">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#F1C56B]/15" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-white/10 text-[#F1C56B]">
            <Truck size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="labora-kicker text-white/55">Operaciones</p>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/75">
                Aún no conectado
              </span>
            </div>
            <h2 className="labora-display mt-1 text-xl font-semibold text-white">
              Sin flota en vivo inventada.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Labora+ no muestra pedidos, zonas calientes ni rutas como datos reales hasta que exista
              telemetría o una API de plataforma autorizada. El núcleo usable hoy es dinero, documentos,
              modelos fiscales y mensajería con tu gestoría.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <div className="rounded-[16px] border border-[#E6E0D7] bg-[#FAF8F4] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#E7F0EA] text-[#214E3A]">
            <Map size={16} />
          </div>
          <p className="mt-3 text-xs font-extrabold text-[#1E231F]">Sin mapa de demanda falsa</p>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
            Los multiplicadores y “zonas rojas” simulados quedan fuera del producto hasta tener una fuente verificable.
          </p>
        </div>
        <div className="rounded-[16px] border border-[#E6E0D7] bg-[#FAF8F4] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F8EDE7] text-[#B95635]">
            <ShieldCheck size={16} />
          </div>
          <p className="mt-3 text-xs font-extrabold text-[#1E231F]">Preferencias ≠ sincronización</p>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
            Puedes marcar plataformas en tu actividad; eso no implica pedidos en tiempo real ni OAuth de Glovo/Uber.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-[#EAE3D9] bg-[#FFF9EE] px-4 py-3 text-[10px] font-medium leading-relaxed text-[#80612E] sm:px-5">
        <LockKeyhole size={14} className="mt-0.5 shrink-0" />
        Este hub permanece bloqueado a propósito. No uses capturas de módulos de operaciones como prueba de producto en vivo.
      </div>
    </section>
  );
};
