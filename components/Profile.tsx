
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { User, Settings, Camera, Check, Plus } from 'lucide-react';
import { useCountry } from '../contexts/CountryContext';

const Profile: React.FC = () => {
  const { currentUser, logout } = useData();
  const { selectedCountry } = useCountry();
  const [apps, setApps] = useState<Record<string, boolean>>({
    'Uber Eats': true,
    'Glovo': false,
    'Rappi': false,
    'DoorDash': false,
    'Stuart': true
  });

  const toggleApp = (app: string) => {
    setApps(prev => ({...prev, [app]: !prev[app]}));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-4 border-white shadow-lg overflow-hidden">
             {/* Simulated Photo Upload */}
             {currentUser?.photoUrl ? <img src={currentUser.photoUrl} className="w-full h-full object-cover" /> : <User size={48} />}
          </div>
          <button className="absolute bottom-0 right-0 bg-[#4285F4] text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition-colors">
            <Camera size={16} />
          </button>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{currentUser?.name}</h2>
          <p className="text-gray-500">{currentUser?.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
             <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{currentUser?.role}</span>
             <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Nivel Oro</span>
          </div>
        </div>

        <div className="flex gap-4 text-center">
           <div>
             <p className="text-2xl font-bold text-gray-900">4.8</p>
             <p className="text-xs text-gray-500 uppercase">Rating</p>
           </div>
           <div>
             <p className="text-2xl font-bold text-gray-900">1.2k</p>
             <p className="text-xs text-gray-500 uppercase">Pedidos</p>
           </div>
        </div>
      </div>

      {/* App Integrations (Demo) */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
         <h3 className="font-bold text-lg text-gray-900 mb-4">Apps Conectadas</h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {selectedCountry.platforms.map((plat) => (
              <button 
                key={plat.id}
                onClick={() => toggleApp(plat.name)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${apps[plat.name] ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${apps[plat.name] ? 'bg-white text-green-600 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                    {plat.name[0]}
                 </div>
                 <span className={`text-xs font-bold ${apps[plat.name] ? 'text-green-700' : 'text-gray-500'}`}>{plat.name}</span>
                 {apps[plat.name] ? <div className="text-[10px] text-green-600 flex items-center gap-1"><Check size={10}/> Conectado</div> : <div className="text-[10px] text-gray-400">Conectar</div>}
              </button>
            ))}
         </div>
      </div>

      {/* Stats History */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
         <h3 className="font-bold text-lg text-gray-900 mb-4">Estadísticas Personales (Demo)</h3>
         <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600 font-medium">Promedio Diario</span>
               <span className="font-bold text-gray-900">85.00 {selectedCountry.currency_symbol}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600 font-medium">Km Totales (Mes)</span>
               <span className="font-bold text-gray-900">1,240 km</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600 font-medium">Pedidos / Hora</span>
               <span className="font-bold text-gray-900">3.8</span>
            </div>
         </div>
      </div>

      <button 
        onClick={logout}
        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Profile;
