import { Employee, Payslip } from '../../../types';
import { CountryConfig, IncomeTaxBracket } from '../../country-config/types';

export const payrollEngine = {
  calculatePayslip: (employee: Employee, countryConfig: CountryConfig): Payslip => {
    const gross = employee.base_salary;
    let net = gross;
    const deductions: { name: string; amount: number; rate?: number }[] = [];
    let employerCost = 0;

    // --- LOGIC PER COUNTRY ---
    
    if (countryConfig.country_code === 'ES') {
      // Spain Logic
      const ssRate = 0.0635; // Contingencias comunes + desempleo (Mock)
      const ssAmount = gross * ssRate;
      
      // IRPF (Simple progressive check)
      const annual = gross * 12;
      const bracket = countryConfig.income_tax_brackets.find((b: IncomeTaxBracket) => annual < b.max) || countryConfig.income_tax_brackets[countryConfig.income_tax_brackets.length - 1];
      const irpfRate = bracket?.rate || 0.19;
      const irpfAmount = gross * irpfRate;

      deductions.push({ name: 'Seguridad Social (Trabajador)', amount: ssAmount, rate: ssRate });
      deductions.push({ name: 'IRPF (Adelanto)', amount: irpfAmount, rate: irpfRate });
      
      net = gross - ssAmount - irpfAmount;
      employerCost = gross * 0.30; // ~30% SS empresa

    } else if (countryConfig.country_code === 'US') {
      // US Logic
      const fedRate = 0.12; 
      const stateRate = 0.05;
      const ficaRate = 0.0765;

      deductions.push({ name: 'Federal Tax', amount: gross * fedRate, rate: fedRate });
      deductions.push({ name: 'State Tax', amount: gross * stateRate, rate: stateRate });
      deductions.push({ name: 'FICA (Social Security + Medicare)', amount: gross * ficaRate, rate: ficaRate });

      net = gross * (1 - fedRate - stateRate - ficaRate);
      employerCost = gross * ficaRate; // Employer match FICA

    } else if (countryConfig.country_code === 'MX') {
      // Mexico Logic
      const imssRate = 0.027;
      const isrRate = 0.10; // Simplificado

      deductions.push({ name: 'IMSS', amount: gross * imssRate, rate: imssRate });
      deductions.push({ name: 'ISR (Retención)', amount: gross * isrRate, rate: isrRate });

      net = gross - (gross * imssRate) - (gross * isrRate);
      employerCost = gross * 0.25; // Carga patronal alta

    } else {
      // Generic Logic for others
      const flatTax = 0.20;
      deductions.push({ name: 'Tax / Impuesto', amount: gross * flatTax, rate: flatTax });
      net = gross * (1 - flatTax);
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      employee_id: employee.id,
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      gross_pay: Number(gross.toFixed(2)),
      net_pay: Number(net.toFixed(2)),
      deductions: deductions.map(d => ({...d, amount: Number(d.amount.toFixed(2))})),
      employer_cost: Number(employerCost.toFixed(2))
    };
  }
};