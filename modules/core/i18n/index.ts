import { create } from 'zustand';

type Language = 'es' | 'en';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const resources = {
  es: {
    // Country Selector
    'country.selector_title': 'Selecciona tu país para ajustar tarifas, impuestos y opciones de pago locales.',
    'country.disclaimer': 'Este cálculo es estimado. Las retenciones oficiales dependen de normativa local y del estatus laboral (autónomo / empleado).',
    'country.select_region': 'Seleccionar Región',
    'country.ref_10km': 'Ref. 10km',
    'country.test_calc': 'Probar Cálculos',
    'country.simulator_title': 'Simulador de Tarifas',
    'country.fiscal_rules': 'Reglas fiscales',
    'country.distance_label': 'Distancia (Km)',
    'country.time_label': 'Tiempo (Min)',
    'country.surge_label': 'Multiplicador',
    'country.gross_fare': 'Tarifa Bruta (Cliente)',
    'country.commission': 'Comisión Plat.',
    'country.service_fee': 'Tasa Servicio',
    'country.est_tax': 'Impuestos Est.',
    'country.net_earnings': 'Tu Ganancia Neta',
    'country.approx_note': 'Aproximado según',

    // Banking
    'bank.error_connect': 'Error al conectar con el banco',
    'bank.success_connect': 'Conexión bancaria establecida correctamente',
    'bank.disconnect_confirm': '¿Estás seguro de que quieres desconectar este banco?',
    
    // Export & Settings
    'export.download_csv': 'Descargar CSV Payouts',
    'export.generating': 'Generando...',
    'settings.language': 'Idioma / Language',
    'settings.devtools': 'Herramientas de Desarrollador',
    'settings.audit_log': 'Audit Log (Calculadora)',
    'test.run_suite': 'Ejecutar Suite de Pruebas',
    'test.passed': 'PASÓ',
    'test.failed': 'FALLÓ'
  },
  en: {
    // Country Selector
    'country.selector_title': 'Select your country to adjust rates, taxes and local payout options.',
    'country.disclaimer': 'This calculation is an estimate. Official withholdings depend on local law and employment status (contractor/employee).',
    'country.select_region': 'Select Region',
    'country.ref_10km': '10km Ref.',
    'country.test_calc': 'Test Calculator',
    'country.simulator_title': 'Fare Simulator',
    'country.fiscal_rules': 'Fiscal rules',
    'country.distance_label': 'Distance (Km)',
    'country.time_label': 'Time (Min)',
    'country.surge_label': 'Surge Multiplier',
    'country.gross_fare': 'Gross Fare (Client)',
    'country.commission': 'Plat. Commission',
    'country.service_fee': 'Service Fee',
    'country.est_tax': 'Est. Taxes',
    'country.net_earnings': 'Your Net Earnings',
    'country.approx_note': 'Approximate per',

    // Banking
    'bank.error_connect': 'Error connecting to bank',
    'bank.success_connect': 'Bank connection established successfully',
    'bank.disconnect_confirm': 'Are you sure you want to disconnect this bank?',

    // Export & Settings
    'export.download_csv': 'Download Payouts CSV',
    'export.generating': 'Generating...',
    'settings.language': 'Language',
    'settings.devtools': 'Developer Tools',
    'settings.audit_log': 'Audit Log (Calculator)',
    'test.run_suite': 'Run Test Suite',
    'test.passed': 'PASSED',
    'test.failed': 'FAILED'
  }
};

export const useI18n = create<I18nState>((set, get) => ({
  language: 'es',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    return resources[lang][key as keyof typeof resources['es']] || key;
  }
}));