
import { ComparisonScenario, PlatformResult } from '../types';
import { PlatformDetails } from '../../country-config/types';

export const comparisonEngine = {
  compare: (platforms: PlatformDetails[], scenario: ComparisonScenario): PlatformResult[] => {
    const results = platforms.map(plat => {
      // 1. Calculate Per Trip Gross
      const trip_base = plat.base_fare;
      const trip_km = plat.rate_km * scenario.avg_distance_per_trip;
      const trip_time = plat.rate_min * scenario.avg_duration_per_trip;
      
      let single_trip_gross = (trip_base + trip_km + trip_time) * scenario.surge_multiplier;
      
      // 2. Hourly Calculation
      const hourly_gross = single_trip_gross * scenario.trips_per_hour;
      
      // 3. Deductions
      const commission_cost = hourly_gross * plat.commission_pct;
      const hourly_net = hourly_gross - commission_cost;

      return {
        platform: plat,
        hourly_gross,
        hourly_net,
        commission_cost,
        effective_hourly_rate: hourly_net,
        badges: []
      };
    });

    // 4. Assign Badges
    // Sort by net to find best payer
    const sortedByNet = [...results].sort((a, b) => b.hourly_net - a.hourly_net);
    if (sortedByNet.length > 0) sortedByNet[0].badges.push('Mejor Pagada');

    // Sort by commission to find lowest fee
    const sortedByFee = [...results].sort((a, b) => a.commission_cost - b.commission_cost);
    if (sortedByFee.length > 0) sortedByFee[0].badges.push('Menor Comisión');

    // Identify Fastest Pay
    results.forEach(r => {
      if (r.platform.payment_speed === 'daily' || r.platform.payment_speed === 'biweekly') { // Logic tweak: 'biweekly' is usually faster/more frequent than monthly, but daily is best.
        if (r.platform.payment_speed === 'daily') r.badges.push('Pago Diario');
      }
    });

    return sortedByNet; // Default return sorted by profit
  }
};
