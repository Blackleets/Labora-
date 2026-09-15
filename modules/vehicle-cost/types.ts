
export type VehicleType = 'bicycle' | 'motorcycle' | 'car';

export interface VehicleCostProfile {
  id?: string;
  vehicleType: VehicleType;
  purchasePrice: number;
  purchaseDate: string; // ISO
  currentValue: number; // User estimation or calculated
  insuranceAnnualCost: number;
  maintenanceAnnualBudget: number;
  fuelConsumptionL100km: number; // Liters per 100km
  tireReplacementCost: number;
  tireLifespanKm: number;
  expectedLifespanYears: number;
}

export interface CostBreakdown {
  fixedMonthly: number; // Insurance + Depreciation / 12
  variablePerKm: number; // Fuel + Tires + Maint
  totalPerKm: number; // Assuming a standard monthly mileage
  depreciationMonthly: number;
  fuelPerKm: number;
  maintenancePerKm: number;
  insuranceMonthly: number;
}
