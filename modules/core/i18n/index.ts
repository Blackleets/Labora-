import { create } from 'zustand';

export type Language = 'es' | 'en' | 'pt';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'labora_language';

const resources: Record<Language, Record<string, string>> = {
  es: {
    'common.language': 'Idioma',
    'common.spanish': 'Español',
    'common.english': 'English',
    'common.portuguese': 'Português',
    'country.selector_title': 'Selecciona tu país. La moneda se adapta; la fiscalidad automática solo se activa con datos oficiales verificados.',
    'country.disclaimer': 'Labora+ no inventa impuestos, retenciones ni tarifas locales.',
    'country.select_region': 'Seleccionar país',
    'country.ref_10km': 'Ref. 10km',
    'country.test_calc': 'Probar cálculos',
    'country.simulator_title': 'Simulador de tarifas',
    'country.fiscal_rules': 'Reglas fiscales',
    'country.distance_label': 'Distancia (km)',
    'country.time_label': 'Tiempo (min)',
    'country.surge_label': 'Multiplicador',
    'country.gross_fare': 'Tarifa bruta',
    'country.commission': 'Comisión plataforma',
    'country.service_fee': 'Tasa de servicio',
    'country.est_tax': 'Impuestos estimados',
    'country.net_earnings': 'Ganancia neta',
    'country.approx_note': 'Aproximado según',
    'bank.error_connect': 'Error al conectar con el banco',
    'bank.success_connect': 'Conexión bancaria establecida correctamente',
    'bank.disconnect_confirm': '¿Estás seguro de que quieres desconectar este banco?',
    'export.download_csv': 'Descargar CSV',
    'export.generating': 'Generando…',
    'settings.language': 'Idioma',
    'settings.devtools': 'Herramientas de desarrollador',
    'settings.audit_log': 'Registro de auditoría',
    'test.run_suite': 'Ejecutar pruebas',
    'test.passed': 'PASÓ',
    'test.failed': 'FALLÓ'
  },
  en: {
    'common.language': 'Language',
    'common.spanish': 'Español',
    'common.english': 'English',
    'common.portuguese': 'Português',
    'country.selector_title': 'Select your country. Currency adapts automatically; tax automation is enabled only with verified official data.',
    'country.disclaimer': 'Labora+ does not invent local taxes, withholdings, or rates.',
    'country.select_region': 'Select country',
    'country.ref_10km': '10km ref.',
    'country.test_calc': 'Test calculations',
    'country.simulator_title': 'Fare simulator',
    'country.fiscal_rules': 'Tax rules',
    'country.distance_label': 'Distance (km)',
    'country.time_label': 'Time (min)',
    'country.surge_label': 'Multiplier',
    'country.gross_fare': 'Gross fare',
    'country.commission': 'Platform commission',
    'country.service_fee': 'Service fee',
    'country.est_tax': 'Estimated taxes',
    'country.net_earnings': 'Net earnings',
    'country.approx_note': 'Approximate based on',
    'bank.error_connect': 'Error connecting to bank',
    'bank.success_connect': 'Bank connection established successfully',
    'bank.disconnect_confirm': 'Are you sure you want to disconnect this bank?',
    'export.download_csv': 'Download CSV',
    'export.generating': 'Generating…',
    'settings.language': 'Language',
    'settings.devtools': 'Developer tools',
    'settings.audit_log': 'Audit log',
    'test.run_suite': 'Run tests',
    'test.passed': 'PASSED',
    'test.failed': 'FAILED'
  },
  pt: {
    'common.language': 'Idioma',
    'common.spanish': 'Español',
    'common.english': 'English',
    'common.portuguese': 'Português',
    'country.selector_title': 'Selecione seu país. A moeda é adaptada automaticamente; a automação fiscal só é ativada com dados oficiais verificados.',
    'country.disclaimer': 'O Labora+ não inventa impostos, retenções ou tarifas locais.',
    'country.select_region': 'Selecionar país',
    'country.ref_10km': 'Ref. 10 km',
    'country.test_calc': 'Testar cálculos',
    'country.simulator_title': 'Simulador de tarifas',
    'country.fiscal_rules': 'Regras fiscais',
    'country.distance_label': 'Distância (km)',
    'country.time_label': 'Tempo (min)',
    'country.surge_label': 'Multiplicador',
    'country.gross_fare': 'Tarifa bruta',
    'country.commission': 'Comissão da plataforma',
    'country.service_fee': 'Taxa de serviço',
    'country.est_tax': 'Impostos estimados',
    'country.net_earnings': 'Ganho líquido',
    'country.approx_note': 'Aproximado com base em',
    'bank.error_connect': 'Erro ao conectar ao banco',
    'bank.success_connect': 'Conexão bancária estabelecida com sucesso',
    'bank.disconnect_confirm': 'Tem certeza de que deseja desconectar este banco?',
    'export.download_csv': 'Baixar CSV',
    'export.generating': 'Gerando…',
    'settings.language': 'Idioma',
    'settings.devtools': 'Ferramentas de desenvolvedor',
    'settings.audit_log': 'Registro de auditoria',
    'test.run_suite': 'Executar testes',
    'test.passed': 'PASSOU',
    'test.failed': 'FALHOU'
  }
};

const validLanguage = (value: string | null | undefined): value is Language =>
  value === 'es' || value === 'en' || value === 'pt';

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'es';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (validLanguage(stored)) return stored;
  } catch {
    // localStorage is optional.
  }

  const candidates = typeof navigator !== 'undefined'
    ? [navigator.language, ...(navigator.languages || [])]
    : [];
  for (const candidate of candidates) {
    const base = String(candidate || '').toLowerCase().split('-')[0];
    if (validLanguage(base)) return base;
  }
  return 'en';
};

export const useI18n = create<I18nState>((set, get) => ({
  language: detectInitialLanguage(),
  setLanguage: (lang) => {
    if (!validLanguage(lang)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Persistence failure must not block language switching.
    }
    set({ language: lang });
  },
  t: (key) => {
    const lang = get().language;
    return resources[lang][key] || resources.en[key] || key;
  }
}));

if (typeof document !== 'undefined') {
  document.documentElement.lang = useI18n.getState().language;
}
