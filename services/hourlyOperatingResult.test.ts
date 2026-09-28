import { describe, expect, it } from 'vitest';
import { calculateHourlyOperatingResult } from './hourlyOperatingResult';

describe('calculateHourlyOperatingResult', () => {
  it('uses only costs explicitly supplied by the user', () => {
    expect(calculateHourlyOperatingResult({
      grossIncome: 20,
      commissionPct: 25,
      fuelCost: 2,
      maintenanceCost: 1,
      fixedCost: 0.5
    })).toEqual({
      grossIncome: 20,
      commissionPct: 25,
      commission: 5,
      fuelCost: 2,
      maintenanceCost: 1,
      fixedCost: 0.5,
      resultBeforeTaxes: 11.5
    });
  });

  it('does not invent a commission or a tax deduction', () => {
    const result = calculateHourlyOperatingResult({
      grossIncome: 15,
      commissionPct: 0,
      fuelCost: 0,
      maintenanceCost: 0,
      fixedCost: 0
    });

    expect(result.resultBeforeTaxes).toBe(15);
    expect(result).not.toHaveProperty('taxes');
  });

  it('clamps invalid inputs to safe bounds', () => {
    expect(calculateHourlyOperatingResult({
      grossIncome: 10,
      commissionPct: 120,
      fuelCost: -3,
      maintenanceCost: Number.NaN,
      fixedCost: -1
    }).resultBeforeTaxes).toBe(0);
  });
});
