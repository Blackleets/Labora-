import React from 'react';
import { LockKeyhole, MapPin, ShieldCheck, Zap } from 'lucide-react';

/**
 * Orphan duplicate of modules/hot-zones HotZonesWidget — previously a fake
 * "Real-time Heatmap" with Malasaña surge. Same fail-closed policy.
 */
export const HotZonesWidget: React.FC = () => (
  <section className="labora-card mx-auto max-w-3xl overflow-hidden">
    <div className="relative overflow-hidden bg-[#214E3A] p-5 text-white sm:p-6">
      <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#F1C56B]/15" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-white/10 text-[#F1C56B]">
          <Zap size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="labora-kicker text-white/55">Zonas calientes</p>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/75">
              No disponible
            </span>
          </div>
          <h2 className="labora-display mt-1 text-xl font-semibold text-white">
            Sin heatmap en tiempo real inventado.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            Labora+ no muestra «ALTA DEMANDA», surge x2.4 ni barrios como Malasaña como datos reales.
            Sin feed de demanda verificable, este widget permanece bloqueado.
          </p>
        </div>
      </div>
    </div>

    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <div className="rounded-[16px] border border-[#E6E0D7] bg-[#FAF8F4] p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#E7F0EA] text-[#214E3A]">
          <MapPin size={16} />
        </div>
        <p className="mt-3 text-xs font-extrabold text-[#1E231F]">Sin mapa Mapbox decorativo</p>
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
          Fondos estáticos con pulsos y «Trazar Ruta Óptima» no son telemetría. Quedan fuera.
        </p>
      </div>
      <div className="rounded-[16px] border border-[#E6E0D7] bg-[#FAF8F4] p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F8EDE7] text-[#B95635]">
          <ShieldCheck size={16} />
        </div>
        <p className="mt-3 text-xs font-extrabold text-[#1E231F]">Qué sí puedes usar hoy</p>
        <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
          Preferencias de plataforma en tu actividad, ingresos/gastos registrados y el hub Operaciones
          (explicación honesta) — no surge en vivo.
        </p>
      </div>
    </div>

    <div className="flex items-start gap-2 border-t border-[#EAE3D9] bg-[#FFF9EE] px-4 py-3 text-[10px] font-medium leading-relaxed text-[#80612E] sm:px-5">
      <LockKeyhole size={14} className="mt-0.5 shrink-0" />
      Widget bloqueado a propósito. No uses capturas de demanda como prueba de producto en vivo.
    </div>
  </section>
);
