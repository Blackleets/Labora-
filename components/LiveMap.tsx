
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { MapConfig } from '../modules/country-config/types';

interface LiveMapProps {
  orders: {
    id: string;
    customer: string;
    status: string;
    address: string;
    platform?: string;
  }[];
  mapConfig: MapConfig;
}

// Leaflet needs to be accessed from window because we loaded it via script tag
declare global {
  interface Window {
    L: any;
  }
}

interface TrackedOrder {
  id: string;
  lat: number;
  lng: number;
  marker: any; // Leaflet Marker
}

const LiveMap: React.FC<LiveMapProps> = ({ orders, mapConfig }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const trackedOrdersRef = useRef<TrackedOrder[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  // 1. Initialize Map
  useEffect(() => {
    // Check if Leaflet is loaded
    if (!window.L) {
      console.error("Leaflet not loaded");
      setLoadingError(true);
      return;
    }

    if (mapContainerRef.current && !mapInstanceRef.current) {
      try {
        const L = window.L;
        const map = L.map(mapContainerRef.current).setView(
          [mapConfig.center.lat, mapConfig.center.lng], 
          mapConfig.zoom
        );

        // Add OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapReady(true);
      } catch (e) {
        console.error("Error initializing map", e);
        setLoadingError(true);
      }
    }

    // Update center if config changes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapConfig.center.lat, mapConfig.center.lng], mapConfig.zoom);
    }

    return () => {
      // Cleanup on unmount if needed, though usually map persists in SPA until nav away
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapConfig]);

  // 2. Manage Markers & Simulation
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Helper to generate random offset near center
    const randomOffset = () => (Math.random() - 0.5) * 0.04; // Roughly 2-3km range

    // Helper to get domain for clearbit
    const getLogoUrl = (platform?: string) => {
      if (!platform) return null;
      const p = platform.toLowerCase();
      // Basic mapping
      if (p.includes('uber')) return 'https://logo.clearbit.com/uber.com';
      if (p.includes('glovo')) return 'https://logo.clearbit.com/glovoapp.com';
      if (p.includes('just')) return 'https://logo.clearbit.com/just-eat.com';
      if (p.includes('stuart')) return 'https://logo.clearbit.com/stuart.com';
      if (p.includes('deliveroo')) return 'https://logo.clearbit.com/deliveroo.co.uk';
      if (p.includes('rappi')) return 'https://logo.clearbit.com/rappi.com';
      if (p.includes('bolt')) return 'https://logo.clearbit.com/bolt.eu';
      return null;
    };

    // Function to create custom icon HTML
    const createIconHtml = (status: string, label: string, platform?: string) => {
      // Colors based on status
      let colorClass = 'gray-500'; // Default
      
      if (status === 'En ruta') colorClass = 'blue-500';
      else if (status === 'Pendiente') colorClass = 'yellow-500';
      else if (status === 'Entregado') colorClass = 'green-500';

      const logoUrl = getLogoUrl(platform);
      
      // Styling logic based on presence of platform logo
      let containerClasses = '';
      let innerContent = '';
      const arrowColor = `border-t-${colorClass}`; // Tail color matches status

      if (logoUrl) {
        // Has Logo: White BG, Colored Border
        containerClasses = `bg-white border-[3px] border-${colorClass}`;
        innerContent = `<img src="${logoUrl}" class="w-full h-full object-cover rounded-full p-[2px]" onError="this.style.display='none'" />`;
      } else {
        // No Logo: Solid Colored Circle
        containerClasses = `bg-${colorClass} border-2 border-white shadow-sm`;
        innerContent = `<span class="text-xs font-bold text-white uppercase">${label.charAt(0)}</span>`;
      }

      return `
        <div class="relative flex flex-col items-center justify-center transform hover:scale-110 transition-transform duration-200">
          <div class="w-10 h-10 rounded-full ${containerClasses} shadow-md flex items-center justify-center overflow-hidden z-20">
            ${innerContent}
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${arrowColor} -mt-[1px] z-10"></div>
          <div class="w-8 h-1 bg-black/20 blur-[2px] rounded-full mt-1"></div>
        </div>
      `;
    };

    // Sync markers with orders
    const activeIds = orders.map(o => o.id);
    
    // Remove old markers
    trackedOrdersRef.current = trackedOrdersRef.current.filter(tracked => {
      if (!activeIds.includes(tracked.id)) {
        map.removeLayer(tracked.marker);
        return false;
      }
      return true;
    });

    // Add/Update markers
    orders.forEach(order => {
      let tracked = trackedOrdersRef.current.find(t => t.id === order.id);

      if (!tracked) {
        // New marker
        const lat = mapConfig.center.lat + randomOffset();
        const lng = mapConfig.center.lng + randomOffset();
        
        const icon = L.divIcon({
          className: 'custom-map-marker',
          html: createIconHtml(order.status, order.customer, order.platform),
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        
        marker.bindPopup(`
          <div class="p-2 font-sans">
            <div class="flex items-center gap-2 mb-1">
               ${order.platform ? `<span class="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase tracking-wide">${order.platform}</span>` : ''}
            </div>
            <h4 class="font-bold text-sm text-gray-900 leading-tight">${order.customer}</h4>
            <p class="text-xs text-gray-500 mt-1">${order.address}</p>
            <div class="mt-2 text-xs font-bold uppercase px-2 py-1 rounded w-fit ${
              order.status === 'En ruta' ? 'bg-blue-100 text-blue-700' : 
              order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }">
              ${order.status}
            </div>
          </div>
        `);

        tracked = { id: order.id, lat, lng, marker };
        trackedOrdersRef.current.push(tracked);
      } else {
        // Update existing marker visual state if status changed
        const icon = L.divIcon({
          className: 'custom-map-marker',
          html: createIconHtml(order.status, order.customer, order.platform),
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50]
        });
        tracked.marker.setIcon(icon);
      }
    });

    // 3. Simulation Loop
    const interval = setInterval(() => {
      trackedOrdersRef.current.forEach(tracked => {
        const order = orders.find(o => o.id === tracked.id);
        
        // Solo mover si está "En ruta"
        if (order?.status === 'En ruta') {
          const moveFactor = 0.0003; // ~30m variation
          
          tracked.lat += (Math.random() - 0.5) * moveFactor;
          tracked.lng += (Math.random() - 0.5) * moveFactor;
          
          tracked.marker.setLatLng([tracked.lat, tracked.lng]);
        }
      });
    }, 2000); // Update every 2s

    return () => clearInterval(interval);

  }, [orders, isMapReady, mapConfig]);

  if (loadingError) {
    return (
      <div className="h-96 w-full bg-gray-50 rounded-[24px] border border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <MapPin size={48} className="mb-4 opacity-20" />
        <p className="font-bold">Mapa no disponible</p>
        <p className="text-xs mt-1">No se pudo cargar el motor de mapas.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-[24px] overflow-hidden border border-gray-200 shadow-inner group">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {!isMapReady && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
           <div className="flex flex-col items-center gap-3">
             <Loader2 size={32} className="animate-spin text-[#2D6CDF]" />
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Iniciando Satélite...</p>
           </div>
        </div>
      )}

      {isMapReady && (
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-white/50">
           <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              En Vivo • {mapConfig.default_city}
           </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
