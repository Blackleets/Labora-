
import React from 'react';
import { MapPin, Navigation, Zap, Clock } from 'lucide-react';

export const HotZonesWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Zap className="text-yellow-500" size={20} />
          Zonas Calientes
        </h3>
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">Alta Demanda</span>
      </div>

      <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
         {/* Static Map Illustration */}
         <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Mapbox_iOS_SDK_gl.png')] bg-cover bg-center opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
         
         {/* Hotspots */}
         <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-red-500 rounded-full blur-md opacity-60 animate-ping"></div>
         <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
         
         <div className="absolute bottom-1/3 right-1/3 w-6 h-6 bg-orange-500 rounded-full blur-md opacity-60 animate-ping delay-500"></div>
         <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-orange-600 rounded-full border-2 border-white shadow-lg"></div>
      </div>

      <div className="space-y-3">
         <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
               <MapPin size={16} className="text-gray-400" />
               <span className="font-medium text-gray-700">Centro / Plaza Mayor</span>
            </div>
            <span className="font-bold text-green-600">+2.5x</span>
         </div>
         <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
               <Clock size={16} className="text-gray-400" />
               <span className="font-medium text-gray-700">Mejor hora</span>
            </div>
            <span className="font-bold text-gray-900">20:30 - 22:00</span>
         </div>
      </div>
      
      <button className="w-full mt-4 bg-gray-50 text-blue-600 font-bold py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
        <Navigation size={16} /> Navegar a Zona Roja
      </button>
    </div>
  );
};
