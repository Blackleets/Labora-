
import { VehicleCostProfile, CostBreakdown } from '../types';

export const costEngine = {
  calculateCosts: (profile: VehicleCostProfile, fuelPrice: number, monthlyKm: number = 1000): CostBreakdown => {
    
    // 1. FIXED COSTS (Depreciation + Insurance)
    
    // Depreciation (Simple Straight Line for MVP)
    // Value lost per month = Purchase Price / (Lifespan Years * 12)
    const lifespanMonths = Math.max(12, profile.expectedLifespanYears * 12);
    const depreciationMonthly = profile.purchasePrice / lifespanMonths;

    const insuranceMonthly = profile.insuranceAnnualCost / 12;
    const fixedMonthly = depreciationMonthly + insuranceMonthly;

    // 2. VARIABLE COSTS (Fuel + Maintenance + Tires) per KM
    
    // Fuel: (L/100km / 100) * Price/L
    const fuelPerKm = (profile.fuelConsumptionL100km / 100) * fuelPrice;

    // Maintenance: Budget / (Monthly Km * 12) approx, or just per km if we had granular data
    // Here we distribute the annual budget over expected annual km (monthly * 12)
    const annualKm = monthlyKm * 12;
    const maintenancePerKm = annualKm > 0 ? profile.maintenanceAnnualBudget / annualKm : 0;

    // Tires: Cost / Lifespan
    const tirePerKm = profile.tireLifespanKm > 0 ? profile.tireReplacementCost / profile.tireLifespanKm : 0;

    const variablePerKm = fuelPerKm + maintenancePerKm + tirePerKm;

    // 3. TOTAL (Effective cost per km given a monthly mileage)
    // Fixed costs must be distributed over the kilometers driven to get a per-km rate
    const fixedPerKmAllocated = monthlyKm > 0 ? fixedMonthly / monthlyKm : 0;
    const totalPerKm = variablePerKm + fixedPerKmAllocated;

    return {
      fixedMonthly,
      variablePerKm,
      totalPerKm,
      depreciationMonthly,
      fuelPerKm,
      maintenancePerKm: maintenancePerKm + tirePerKm, // Combine repairs + tires
      insuranceMonthly
    };
  }
};
