export interface HourlyOperatingInput {
  grossIncome: number;
  commissionPct: number;
  fuelCost: number;
  maintenanceCost: number;
  fixedCost: number;
}

const nonNegative = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;

export const calculateHourlyOperatingResult = (input: HourlyOperatingInput) => {
  const grossIncome = nonNegative(input.grossIncome);
  const commissionPct = Math.min(100, nonNegative(input.commissionPct));
  const commission = grossIncome * commissionPct / 100;
  const fuelCost = nonNegative(input.fuelCost);
  const maintenanceCost = nonNegative(input.maintenanceCost);
  const fixedCost = nonNegative(input.fixedCost);

  return {
    grossIncome,
    commissionPct,
    commission,
    fuelCost,
    maintenanceCost,
    fixedCost,
    resultBeforeTaxes: grossIncome - commission - fuelCost - maintenanceCost - fixedCost
  };
};
