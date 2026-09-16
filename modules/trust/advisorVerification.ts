export type AdvisorVerificationLevel =
  | 'registered'
  | 'identity_verified'
  | 'business_verified'
  | 'professional_verified';

export type AdvisorVerificationState = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';

export interface AdvisorVerificationStep {
  id: 'identity' | 'business' | 'professional' | 'client_history';
  title: string;
  description: string;
  required: boolean;
}

export interface AdvisorTrustSnapshot {
  level: AdvisorVerificationLevel;
  identity: AdvisorVerificationState;
  business: AdvisorVerificationState;
  professional: AdvisorVerificationState;
  verifiedClientRelationships: number;
}

/**
 * Product rule: registration never implies professional verification.
 * Professional registries differ by jurisdiction, so the backend must attach
 * issuer + identifier + evidence + verification timestamp to any verified claim.
 */
export const ADVISOR_VERIFICATION_STEPS: AdvisorVerificationStep[] = [
  {
    id: 'identity',
    title: 'Identidad',
    description: 'La persona debe demostrar que es quien dice ser.',
    required: true,
  },
  {
    id: 'business',
    title: 'Despacho o actividad profesional',
    description: 'Se valida la entidad, actividad o negocio cuando corresponda.',
    required: true,
  },
  {
    id: 'professional',
    title: 'Acreditación profesional',
    description: 'Se verifica colegio, licencia, registro o certificación cuando exista en ese país.',
    required: false,
  },
  {
    id: 'client_history',
    title: 'Historial con clientes reales',
    description: 'Los vínculos aceptados por clientes generan reputación, pero nunca sustituyen una acreditación oficial.',
    required: false,
  },
];

export const UNVERIFIED_ADVISOR_SNAPSHOT: AdvisorTrustSnapshot = {
  level: 'registered',
  identity: 'not_started',
  business: 'not_started',
  professional: 'not_started',
  verifiedClientRelationships: 0,
};

export const advisorTrustLabel = (snapshot: AdvisorTrustSnapshot) => {
  if (snapshot.level === 'professional_verified') return 'Profesional verificado';
  if (snapshot.level === 'business_verified') return 'Actividad profesional verificada';
  if (snapshot.level === 'identity_verified') return 'Identidad verificada';
  return 'Gestor no verificado';
};
