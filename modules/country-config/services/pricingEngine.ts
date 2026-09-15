
import { CountryConfig, IncomeTaxBracket } from '../types';
import { countryApi } from './countryApi';
import { auditService } from '../../core/audit/AuditService';

export interface PricingRequest {
  country_code: string;
  distance_km: number;
  duration_min: number;
  base_fare_override?: number;
  surge_multiplier?: number;
  tip_amount?: number;
  user_type: 'rider' | 'driver';
  commission_rule_id?: string;
  // Context for audit
  _user_id?: string; 
}

export interface PricingResult {
  currency: string;
  gross: number;
  commission: number;
  service_fee: number;
  vat_on_service: number;
  income_tax: number;
  social_security: number;
  payout: number;
  breakdown_html: string;
}

/**
 * Calcula el impuesto progresivo basándose en tramos anuales.
 */
const calculateProgressiveTax = (amount: number, brackets: IncomeTaxBracket[]): number => {
  if (amount <= 0) return 0;
  const projectedAnnual = amount * 1; 
  const bracket = brackets.find(b => projectedAnnual >= b.min && projectedAnnual < b.max);
  const rate = bracket ? bracket.rate : (brackets[brackets.length - 1]?.rate || 0);
  return amount * rate;
};

export const pricingEngine = {
  calculatePrice: async (request: PricingRequest): Promise<PricingResult> => {
    // 1. Cargar configuración
    const config = await countryApi.getOne(request.country_code);
    if (!config) throw new Error(`Country config not found for ${request.country_code}`);

    // 2. Base Fare
    let base_fare = config.min_fare;
    if (request.base_fare_override !== undefined) {
      base_fare = request.base_fare_override;
    } else {
      const computed = (config.per_km_rate * request.distance_km) + (config.per_min_rate * request.duration_min);
      base_fare = Math.max(config.min_fare, computed);
    }

    // 3. Gross
    const surge = request.surge_multiplier || 1;
    const tip = request.tip_amount || 0;
    const gross = (base_fare * surge) + tip;

    // 4. Commission (Usually tip is excluded from commission, assuming standard model)
    const commissionBase = gross - tip; 
    const commission = commissionBase * (config.default_commission_pct); 

    // 5. Service Fee
    const service_fee = config.service_fee_flat;

    // 6. VAT on Service
    const vat_on_service = service_fee * config.vat_pct;

    // 7. Taxable Income (Base Imponible para el Rider)
    const taxable_income = gross - commission - service_fee;

    // 8. Income Tax (IRPF/ISR)
    const income_tax = calculateProgressiveTax(taxable_income, config.income_tax_brackets);

    // 9. Social Security
    const social = taxable_income * config.social_security_pct;

    // 10. Payout
    const payout = gross - commission - service_fee - income_tax - social;

    // Helper de redondeo
    const round = (num: number) => Number(num.toFixed(config.decimals));

    const result = {
      currency: config.currency,
      gross: round(gross),
      commission: round(commission),
      service_fee: round(service_fee),
      vat_on_service: round(vat_on_service),
      income_tax: round(income_tax),
      social_security: round(social),
      payout: round(payout),
      breakdown_html: '' // To be filled below
    };

    // Generar HTML
    result.breakdown_html = `
      <table class="w-full text-sm">
        <tr class="border-b border-gray-100"><td class="py-1 text-gray-600">Tarifa Base</td><td class="text-right font-bold">${round(base_fare)} ${config.currency_symbol}</td></tr>
        ${surge > 1 ? `<tr class="border-b border-gray-100"><td class="py-1 text-orange-500">Dinámica (x${surge})</td><td class="text-right text-orange-500">+${round(base_fare * (surge - 1))} ${config.currency_symbol}</td></tr>` : ''}
        ${tip > 0 ? `<tr class="border-b border-gray-100"><td class="py-1 text-green-600">Propina</td><td class="text-right text-green-600">+${round(tip)} ${config.currency_symbol}</td></tr>` : ''}
        <tr class="font-bold bg-gray-50"><td class="py-2">Total Bruto</td><td class="text-right">${round(gross)} ${config.currency_symbol}</td></tr>
        
        <tr><td class="pt-2 text-xs font-bold text-gray-400 uppercase" colspan="2">Deducciones Plataforma</td></tr>
        <tr class="text-red-500"><td class="py-1 pl-2">Comisión (${(config.default_commission_pct*100).toFixed(0)}%)</td><td class="text-right">-${round(commission)}</td></tr>
        <tr class="text-red-500"><td class="py-1 pl-2">Service Fee</td><td class="text-right">-${round(service_fee)}</td></tr>
        
        <tr><td class="pt-2 text-xs font-bold text-gray-400 uppercase" colspan="2">Fiscalidad (${config.country_code})</td></tr>
        <tr class="text-blue-600"><td class="py-1 pl-2">IRPF/ISR Est.</td><td class="text-right">-${round(income_tax)}</td></tr>
        ${social > 0 ? `<tr class="text-blue-600"><td class="py-1 pl-2">Seguridad Social</td><td class="text-right">-${round(social)}</td></tr>` : ''}
        
        <tr class="border-t-2 border-gray-800 text-lg"><td class="py-3 font-bold">Pago Neto Est.</td><td class="text-right font-bold text-green-600">${round(payout)} ${config.currency_symbol}</td></tr>
      </table>
    `;

    // 11. Audit Log
    if (request._user_id) {
      auditService.logCalculation(request._user_id, request.country_code, request, result);
    }

    return result;
  }
};
