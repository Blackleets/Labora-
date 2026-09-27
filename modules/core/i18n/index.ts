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
    'common.open_menu': 'Abrir menú',
    'common.close_menu': 'Cerrar menú',
    'common.sign_out': 'Cerrar sesión',
    'common.show_amounts': 'Mostrar importes',
    'common.hide_amounts': 'Ocultar importes',
    'role.worker': 'Trabajador',
    'role.professional': 'Gestoría / asesoría',
    'nav.home': 'Inicio',
    'nav.summary': 'Resumen',
    'nav.money': 'Dinero',
    'nav.audit': 'Auditoría',
    'nav.income': 'Ingresos',
    'nav.tax': 'Modelos fiscales',
    'nav.tax_short': 'Modelos',
    'nav.requests': 'Peticiones',
    'nav.alerts': 'Avisos',
    'nav.operations': 'Operaciones',
    'nav.platforms': 'Plataformas',
    'nav.assistant': 'Asistente fiscal',
    'nav.clients': 'Clientes',
    'nav.messages': 'Mensajes',
    'nav.settings': 'Perfil y ajustes',
    'nav.settings_short': 'Perfil',
    'nav.settings_manager_short': 'Ajustes',
    'nav.profile': 'Mi perfil',
    'nav.documents': 'Documentos',
    'nav.orders': 'Registro de pedidos',
    'nav.orders_short': 'Pedidos',
    'nav.workspace': 'Tu espacio',
    'nav.communication': 'Comunicación',
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
    'common.open_menu': 'Open menu',
    'common.close_menu': 'Close menu',
    'common.sign_out': 'Sign out',
    'common.show_amounts': 'Show amounts',
    'common.hide_amounts': 'Hide amounts',
    'role.worker': 'Worker',
    'role.professional': 'Accounting / advisory',
    'nav.home': 'Home',
    'nav.summary': 'Overview',
    'nav.money': 'Money',
    'nav.audit': 'Audit',
    'nav.income': 'Income',
    'nav.tax': 'Tax records',
    'nav.tax_short': 'Tax',
    'nav.requests': 'Requests',
    'nav.alerts': 'Alerts',
    'nav.operations': 'Operations',
    'nav.platforms': 'Platforms',
    'nav.assistant': 'Tax assistant',
    'nav.clients': 'Clients',
    'nav.messages': 'Messages',
    'nav.settings': 'Profile & settings',
    'nav.settings_short': 'Profile',
    'nav.settings_manager_short': 'Settings',
    'nav.profile': 'My profile',
    'nav.documents': 'Documents',
    'nav.orders': 'Order log',
    'nav.orders_short': 'Orders',
    'nav.workspace': 'Your workspace',
    'nav.communication': 'Communication',
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
    'common.open_menu': 'Abrir menu',
    'common.close_menu': 'Fechar menu',
    'common.sign_out': 'Sair',
    'common.show_amounts': 'Mostrar valores',
    'common.hide_amounts': 'Ocultar valores',
    'role.worker': 'Trabalhador',
    'role.professional': 'Contabilidade / assessoria',
    'nav.home': 'Início',
    'nav.summary': 'Resumo',
    'nav.money': 'Dinheiro',
    'nav.audit': 'Auditoria',
    'nav.income': 'Receitas',
    'nav.tax': 'Registros fiscais',
    'nav.tax_short': 'Fiscal',
    'nav.requests': 'Solicitações',
    'nav.alerts': 'Avisos',
    'nav.operations': 'Operações',
    'nav.platforms': 'Plataformas',
    'nav.assistant': 'Assistente fiscal',
    'nav.clients': 'Clientes',
    'nav.messages': 'Mensagens',
    'nav.settings': 'Perfil e configurações',
    'nav.settings_short': 'Perfil',
    'nav.settings_manager_short': 'Ajustes',
    'nav.profile': 'Meu perfil',
    'nav.documents': 'Documentos',
    'nav.orders': 'Registro de pedidos',
    'nav.orders_short': 'Pedidos',
    'nav.workspace': 'Seu espaço',
    'nav.communication': 'Comunicação',
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
