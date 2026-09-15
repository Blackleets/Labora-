
export type DemandLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Zone {
  id: string;
  name: string;
  demand_score: number; // 0-100
  demand_level: DemandLevel;
  surge_multiplier: number;
  best_vehicle: 'moto' | 'bici' | 'coche';
  distance_from_user: string; // e.g., "2.5 km"
}

export interface DemandForecast {
  current_hour: number;
  is_peak: boolean;
  recommended_zones: Zone[];
  next_peak_start: string; // HH:MM
  advice: string;
}
