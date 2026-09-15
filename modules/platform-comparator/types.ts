
import { PlatformDetails } from '../country-config/types';

export interface ComparisonScenario {
  trips_per_hour: number;
  avg_distance_per_trip: number; // km
  avg_duration_per_trip: number; // min (active)
  wait_time_per_trip: number; // min (passive)
  surge_multiplier: number;
}

export interface PlatformResult {
  platform: PlatformDetails;
  hourly_gross: number;
  hourly_net: number;
  commission_cost: number;
  effective_hourly_rate: number; // net
  badges: string[]; // 'Best Payout', 'Fastest Pay', etc.
}

export const SCENARIOS = {
  chill: {
    label: 'Tranquilo',
    trips_per_hour: 1.5,
    avg_distance_per_trip: 4,
    avg_duration_per_trip: 15,
    wait_time_per_trip: 10,
    surge_multiplier: 1.0
  },
  standard: {
    label: 'Estándar',
    trips_per_hour: 2.2,
    avg_distance_per_trip: 5.5,
    avg_duration_per_trip: 18,
    wait_time_per_trip: 5,
    surge_multiplier: 1.1
  },
  hustle: {
    label: 'Intenso (Power Rider)',
    trips_per_hour: 3.0,
    avg_distance_per_trip: 4.0,
    avg_duration_per_trip: 12,
    wait_time_per_trip: 2,
    surge_multiplier: 1.4
  }
};
