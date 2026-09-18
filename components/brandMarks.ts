const SIMPLE_ICON_SLUGS: Record<string, string> = {
  glovo: 'glovo',
  uber_eats: 'ubereats',
  just_eat: 'justeat',
  deliveroo: 'deliveroo',
  rappi: 'rappi',
  didi_food: 'didi',
  amazon_flex: 'amazon',
  wolt: 'wolt',
  bolt_food: 'bolt',
  uber: 'uber',
  cabify: 'cabify',
  bolt: 'bolt',
  lyft: 'lyft',
  didi: 'didi',
  freenow: 'freenow',
  revolut: 'revolut',
  wise: 'wise',
  n26: 'n26',
  qonto: 'qonto',
  bbva_es: 'bbva',
  bbva_mx: 'bbva',
  santander_es: 'santander',
  chase: 'chase',
  wellsfargo: 'wellsfargo',
  stripe: 'stripe',
  paypal: 'paypal',
  square: 'square',
  quickbooks: 'quickbooks',
  xero: 'xero'
};

export const getCuratedBrandMarkUrl = (id: string) => {
  const slug = SIMPLE_ICON_SLUGS[id];
  return slug ? `https://cdn.simpleicons.org/${slug}` : undefined;
};
