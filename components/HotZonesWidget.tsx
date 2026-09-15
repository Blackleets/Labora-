
import React from 'react';
import { MapPin, Navigation, Zap, Clock, ShieldCheck } from 'lucide-react';

export const HotZonesWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
            <Zap className="text-[#FFC107]" size={24} fill="currentColor" />
            Zonas de Demanda
          </h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time Heatmap</p>
        </div>
        <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-rose-100 animate-pulse">
           <div className="w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
           ALTA DEMANDA
        </div>
      </div>

      <div className="relative flex-1 min-h-[160px] bg-slate-100 rounded-3xl overflow-hidden mb-6 border border-gray-200 shadow-inner group-hover:shadow-md transition-all duration-500">
         {/* Fake Map with better styling */}
         <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-3.7038,40.4168,13/800x400?access_token=none')] bg-cover bg-center opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"></div>
         
         {/* Hotspots with vibrant pulses */}
         <div className="absolute top-[40%] left-[30%] w-24 h-24 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
         <div className="absolute top-[40%] left-[30%] w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-xl animate-bounce"></div>
         
         <div className="absolute bottom-[30%] right-[40%] w-32 h-32 bg-amber-500/20 rounded-full blur-2xl animate-pulse delay-500"></div>
         <div className="absolute bottom-[30%] right-[40%] w-4 h-4 bg-amber-600 rounded-full border-2 border-white shadow-xl animate-bounce delay-300"></div>

         <div className="absolute inset-x-0 bottom-4 px-4">
            <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-lg flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-[#1A73E8]" />
                  <span className="text-[10px] font-black text-gray-700 uppercase">Centro Ciudad • 1.8km</span>
               </div>
               <span className="text-[10px] font-black text-emerald-600">x2.4 SURGE</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mejor Zona</p>
            <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
               <MapPin size={14} className="text-rose-500" /> Malasaña/Centro
            </p>
         </div>
         <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pico Esperado</p>
            <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
               <Clock size={14} className="text-[#1A73E8]" /> 20:30 - 22:45
            </p>
         </div>
      </div>
      
      <button className="w-full mt-6 bg-[#1A73E8] text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#1557B0] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
        <Navigation size={18} fill="white" /> Trazar Ruta Óptima
      </button>
    </div>
  );
};
