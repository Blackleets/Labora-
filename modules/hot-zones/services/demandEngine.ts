
import { CountryConfig } from '../../country-config/types';
import { DemandForecast, Zone, DemandLevel } from '../types';

// Zonas genéricas simuladas que se adaptan según el idioma/país
const GENERIC_ZONES = [
  { id: 'z1', name_es: 'Centro Histórico', name_en: 'City Center', type: 'dense' },
  { id: 'z2', name_es: 'Zona Financiera', name_en: 'Business District', type: 'office' },
  { id: 'z3', name_es: 'Barrio de Moda', name_en: 'Trendy Neighborhood', type: 'nightlife' },
  { id: 'z4', name_es: 'Residencial Norte', name_en: 'North Suburbs', type: 'residential' },
  { id: 'z5', name_es: 'Zona Universitaria', name_en: 'University Area', type: 'student' },
];

const getLevel = (score: number): DemandLevel => {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

export const demandEngine = {
  calculateDemand: (config: CountryConfig, vehicleType: string = 'moto'): DemandForecast => {
    const now = new Date();
    // Ajustar hora simulada a la zona horaria del config (simplificado usando hora local del navegador + offset mental)
    const currentHour = now.getHours();
    
    const { peak_hours } = config;

    // Detectar si es hora pico según cultura local
    const isLunchPeak = currentHour >= peak_hours.lunch_start && currentHour < peak_hours.lunch_end;
    const isDinnerPeak = currentHour >= peak_hours.dinner_start && currentHour < peak_hours.dinner_end;
    const isPeak = isLunchPeak || isDinnerPeak;

    // Calcular zonas recomendadas
    const recommended_zones: Zone[] = GENERIC_ZONES.map(gz => {
      let score = Math.floor(Math.random() * 30) + 30; // Base 30-60

      // Boost logic
      if (isLunchPeak && gz.type === 'office') score += 40;
      if (isDinnerPeak && (gz.type === 'residential' || gz.type === 'dense')) score += 35;
      if (isDinnerPeak && gz.type === 'nightlife') score += 20;
      if (!isPeak && gz.type === 'dense') score += 15; // Turismo siempre activo

      // Vehicle adjustment
      if (vehicleType === 'bici' && gz.type === 'dense') score += 10; // Bici mejor en centro
      if (vehicleType === 'coche' && gz.type === 'residential') score += 20; // Coche mejor distancias largas

      // Cap score
      score = Math.min(100, score);

      // Surge logic (simulated)
      let surge = 1.0;
      if (score > 80) surge = 1.1 + (Math.random() * 0.5);

      return {
        id: gz.id,
        name: config.country_code === 'ES' || config.country_code === 'MX' ? gz.name_es : gz.name_en,
        demand_score: score,
        demand_level: getLevel(score),
        surge_multiplier: Number(surge.toFixed(1)),
        best_vehicle: (gz.type === 'residential' ? 'coche' : 'moto') as 'coche' | 'moto',
        distance_from_user: `${(Math.random() * 5).toFixed(1)} km`
      };
    }).sort((a, b) => b.demand_score - a.demand_score);

    // Advice Generation
    let advice = "";
    let next_peak_start = "";

    if (isPeak) {
      advice = "¡Estás en hora punta! Maximiza ingresos aceptando pedidos cortos en zonas rojas.";
      next_peak_start = "Ahora";
    } else {
      // Find next peak
      if (currentHour < peak_hours.lunch_start) {
        next_peak_start = `${peak_hours.lunch_start}:00`;
        advice = `La demanda es baja. Posiciónate cerca de oficinas para el turno de las ${peak_hours.lunch_start}:00.`;
      } else if (currentHour < peak_hours.dinner_start) {
        next_peak_start = `${peak_hours.dinner_start}:00`;
        advice = `Descansa ahora. La cena fuerte empieza a las ${peak_hours.dinner_start}:00 en ${config.display_name}.`;
      } else {
        next_peak_start = "Mañana";
        advice = "Turno finalizado. Pocos pedidos esperados hasta mañana.";
      }
    }

    return {
      current_hour: currentHour,
      is_peak: isPeak,
      recommended_zones,
      next_peak_start,
      advice
    };
  }
};
