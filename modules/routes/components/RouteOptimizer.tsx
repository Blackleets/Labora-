
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCountryConfig } from '../../country-config/hooks/useCountryConfig';
import { Navigation, DollarSign, Clock, Fuel, ArrowRight, History, Trash2, MapPin, Save, Calendar, Search, Map as MapIcon, Loader2 } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';

interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  baseFare: number;
  net: number;
  date: string;
}

export const RouteOptimizer: React.FC = () => {
  const config = useCountryConfig();
  const { showNotification } = useData();
  
  // Inputs
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState(5);
  const [duration, setDuration] = useState(15);
  
  // App Logic
  const [history, setHistory] = useState<SavedRoute[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  
  // Cargar historial al montar
  useEffect(() => {
    const saved = localStorage.getItem('labora_route_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error cargando historial de rutas");
      }
    }
  }, []);

  // Guardar historial
  useEffect(() => {
    localStorage.setItem('labora_route_history', JSON.stringify(history));
  }, [history]);

  // Inicializar Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const { center, zoom } = config.map_config;
      
      const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Layer group for route elements (markers, lines)
      routeLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

    } catch (e) {
      console.error("Error initializing map", e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [config.map_config]); // Re-init if country changes configuration

  // Calculations
  const baseFare = Math.max(config.min_fare, (distance * config.per_km_rate) + (duration * config.per_min_rate));
  const commission = baseFare * config.default_commission_pct;
  const fuelCost = (distance * 0.04) * config.avg_fuel_price; 
  const net = baseFare - commission - fuelCost;

  const handleSimulateRoute = () => {
    if (!origin || !destination) {
      showNotification('error', 'Introduce origen y destino');
      return;
    }

    if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(duration) || duration <= 0) {
      showNotification('error', 'Introduce distancia y duración reales mayores que cero.');
      return;
    }

    setIsSimulating(true);
    window.setTimeout(() => {
      setIsSimulating(false);
      showNotification('info', 'Estimación calculada con tus datos manuales. La ruta no usa geocodificación en vivo.');
    }, 250);
  };

  const handleSaveRoute = () => {
    const newRoute: SavedRoute = {
      id: Math.random().toString(36).substr(2, 9),
      origin: origin || 'Ubicación A',
      destination: destination || 'Ubicación B',
      distance,
      duration,
      baseFare,
      net,
      date: new Date().toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    setHistory(prev => [newRoute, ...prev]);
    showNotification('success', 'Ruta guardada en historial');
  };

  const clearHistory = () => {
    if(confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
      setHistory([]);
      showNotification('info', 'Historial eliminado');
    }
  };

  const deleteSingleRoute = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="text-center">
        <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-3">
          <Navigation className="text-[#1A73E8]" size={32} /> 
          Estimador de Rutas
        </h2>
        <p className="text-gray-500 mt-2 font-medium">Calcula una estimación con la distancia y duración reales que tú introduces.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calculator & Inputs */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
             <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-6">
               <h3 className="font-bold text-gray-800 uppercase tracking-widest text-xs flex items-center gap-2">
                 <MapIcon size={14} /> Planificador
               </h3>
               <span className="text-[10px] bg-blue-50 px-2 py-1 rounded-lg text-[#1A73E8] font-black">{config.display_name}</span>
             </div>

             {/* Locations Inputs */}
             <div className="space-y-4 mb-6">
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"></div>
                   <input 
                     type="text" 
                     placeholder="Punto de Recogida (Origen)" 
                     value={origin}
                     onChange={e => setOrigin(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                   />
                </div>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                   <input 
                     type="text" 
                     placeholder="Punto de Entrega (Destino)" 
                     value={destination}
                     onChange={e => setDestination(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                   />
                </div>
                
                <button 
                  onClick={handleSimulateRoute}
                  disabled={isSimulating}
                  className="w-full py-3 bg-white border-2 border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSimulating ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  {isSimulating ? 'Calculando…' : 'Calcular estimación'}
                </button>
             </div>
             
             {/* Manual Overrides */}
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Distancia (Km)</label>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                     <input 
                       type="number" 
                       value={distance} 
                       onChange={e => setDistance(Number(e.target.value))}
                       className="bg-transparent w-full font-bold text-gray-900 outline-none"
                       step="0.1"
                     />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Duración (Min)</label>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                     <input 
                       type="number" 
                       value={duration} 
                       onChange={e => setDuration(Number(e.target.value))}
                       className="bg-transparent w-full font-bold text-gray-900 outline-none"
                     />
                  </div>
                </div>
             </div>

             {/* Results */}
             <div className="bg-[#1A1A1A] text-white p-6 rounded-[24px] shadow-lg relative overflow-hidden group mb-4">
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Beneficio Neto Estimado</p>
                      <span className={`text-4xl font-black ${net > 0 ? 'text-[#2ECC71]' : 'text-red-400'}`}>
                        {net.toFixed(2)}<span className="text-lg ml-1 font-normal opacity-60">{config.currency_symbol}</span>
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl ${net > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                       <DollarSign size={24} className={net > 0 ? 'text-[#2ECC71]' : 'text-red-400'} />
                    </div>
                 </div>
                 
                 <div className="relative z-10 mt-4 pt-4 border-t border-gray-800 flex justify-between text-xs text-gray-400">
                    <span>Bruto: {baseFare.toFixed(2)} {config.currency_symbol}</span>
                    <span>Gastos: -{(commission + fuelCost).toFixed(2)} {config.currency_symbol}</span>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
             </div>

             <button 
               onClick={handleSaveRoute}
               className="w-full py-4 bg-[#1A73E8] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/30 hover:bg-[#1557B0] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Save size={18} /> Guardar Resultado
             </button>
          </div>
        </div>

        {/* Right Column: Map & History */}
        <div className="lg:col-span-7 space-y-6">
           
           {/* Map Container */}
           <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-200 h-[400px] relative">
              <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-white/50 text-xs font-bold text-gray-600 z-[400]">
                 Mapa de referencia: {config.map_config.default_city}
              </div>
           </div>

           {/* History List */}
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg">
                 <History size={20} className="text-gray-400" /> Rutas Guardadas
               </h3>
               {history.length > 0 && (
                 <button 
                   onClick={clearHistory} 
                   className="text-[10px] text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                 >
                   Borrar Todo
                 </button>
               )}
             </div>
             
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {history.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                   <p className="text-gray-400 text-sm font-medium">Tu historial está vacío.</p>
                 </div>
               ) : (
                 history.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-[20px] border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                {item.origin} <ArrowRight size={10} className="text-gray-400"/> {item.destination}
                             </span>
                             <span className="text-[10px] text-gray-400 mt-0.5">{item.date}</span>
                          </div>
                          <button 
                            onClick={() => deleteSingleRoute(item.id)} 
                            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                       
                       <div className="flex justify-between items-end border-t border-gray-200 pt-2 mt-2">
                          <div className="flex gap-3 text-xs text-gray-600 font-medium">
                             <span>{item.distance} km</span>
                             <span>{item.duration} min</span>
                          </div>
                          <span className={`text-sm font-black ${item.net > 0 ? 'text-[#2ECC71]' : 'text-red-500'}`}>
                             {item.net > 0 ? '+' : ''}{item.net.toFixed(2)} {config.currency_symbol}
                          </span>
                       </div>
                    </div>
                 ))
               )}
             </div>
           </div>

        </div>

      </div>
    </div>
  );
};
