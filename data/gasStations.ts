/** Known fuel brands for manual ticket entry — labels only, not live prices. */
export const GAS_STATION_PRESETS = [
  { name: 'Repsol', domain: 'repsol.es', logoColor: '#F58220' },
  { name: 'Cepsa (Moeve)', domain: 'cepsa.com', logoColor: '#E30613' },
  { name: 'BP', domain: 'bp.com', logoColor: '#009900' },
  { name: 'Shell', domain: 'shell.com', logoColor: '#FBCE07' },
  { name: 'Galp', domain: 'galp.com', logoColor: '#FF6600' },
  { name: 'Petroprix', domain: 'petroprix.com', logoColor: '#0072CE' },
  { name: 'Plenoil', domain: 'plenoil.es', logoColor: '#E30613' },
  { name: 'Ballenoil', domain: 'ballenoil.es', logoColor: '#1A4488' },
  { name: 'Carrefour Gasolinera', domain: 'carrefour.es', logoColor: '#00387B' },
  { name: 'Alcampo Gasolinera', domain: 'alcampo.es', logoColor: '#E2001A' }
] as const;
