
import React from 'react';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Calendar, MapPin, TrendingUp, Users, PlusCircle } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';

export const EventsView: React.FC = () => {
  const config = useCountryConfig();
  const { showNotification } = useData();
  const events = config.events || [];

  const handleAddToCalendar = (eventName: string) => {
    // In a real app, this would use the Web Calendar API or download an .ics file
    // For demo, we simulate a success message
    showNotification('success', `Evento "${eventName}" añadido a tu calendario`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Users className="text-[#7B3FE4]" /> Eventos Masivos
          </h2>
          <p className="text-gray-500 mt-1">Anticípate a la alta demanda en {config.display_name}.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:border-purple-200 transition-colors group">
             <div className="flex items-center gap-4 w-full md:w-auto">
               <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-md transform group-hover:scale-105 transition-transform ${event.type === 'sports' ? 'bg-blue-500' : event.type === 'concert' ? 'bg-pink-500' : 'bg-purple-500'}`}>
                 <span className="text-xs uppercase opacity-80">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                 <span className="text-2xl">{new Date(event.date).getDate()}</span>
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                 <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-bold uppercase">{event.type}</span>
                 </div>
               </div>
             </div>

             <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="flex items-center gap-6 bg-purple-50 p-4 rounded-2xl border border-purple-100 flex-1 md:flex-none">
                  <div className="text-center">
                     <p className="text-xs font-bold text-purple-400 uppercase">Demanda</p>
                     <p className="text-2xl font-bold text-purple-700 flex items-center gap-1 justify-center">
                       <TrendingUp size={20} /> x{event.demand_multiplier}
                     </p>
                  </div>
                  <div className="h-8 w-px bg-purple-200"></div>
                  <div className="text-sm text-purple-800 max-w-[200px] leading-tight">
                     <span className="font-bold">Consejo:</span> Posiciónate cerca 1h antes.
                  </div>
               </div>
               
               <button 
                 onClick={() => handleAddToCalendar(event.name)}
                 className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-[#7B3FE4] hover:border-[#7B3FE4] hover:bg-purple-50 transition-all active:scale-95"
                 title="Añadir recordatorio"
               >
                 <PlusCircle size={24} />
               </button>
             </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-[24px] border border-dashed border-gray-200">
            <Calendar size={48} className="mx-auto mb-3 opacity-20" />
            <p>No hay eventos masivos próximos registrados en {config.display_name}.</p>
            <p className="text-sm mt-1">¡Disfruta de la tranquilidad!</p>
          </div>
        )}
      </div>
    </div>
  );
};
