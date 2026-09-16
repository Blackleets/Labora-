import { describe, expect, it } from 'vitest';
import {
  ADVISOR_VERIFICATION_STEPS,
  UNVERIFIED_ADVISOR_SNAPSHOT,
  advisorTrustLabel,
} from '../modules/trust/advisorVerification';

describe('advisor trust semantics', () => {
  it('never treats registration as verification', () => {
    expect(UNVERIFIED_ADVISOR_SNAPSHOT.level).toBe('registered');
    expect(UNVERIFIED_ADVISOR_SNAPSHOT.identity).toBe('not_started');
    expect(advisorTrustLabel(UNVERIFIED_ADVISOR_SNAPSHOT)).toBe('Gestor no verificado');
  });

  it('requires identity and business evidence in the product flow', () => {
    const identity = ADVISOR_VERIFICATION_STEPS.find((step) => step.id === 'identity');
    const business = ADVISOR_VERIFICATION_STEPS.find((step) => step.id === 'business');
    expect(identity?.required).toBe(true);
    expect(business?.required).toBe(true);
  });

  it('does not confuse client history with professional accreditation', () => {
    const history = ADVISOR_VERIFICATION_STEPS.find((step) => step.id === 'client_history');
    expect(history?.description.toLowerCase()).toContain('nunca sustitu');
  });

  it('labels each verified level without promoting beyond its evidence', () => {
    expect(advisorTrustLabel({ ...UNVERIFIED_ADVISOR_SNAPSHOT, level: 'identity_verified', identity: 'verified' })).toBe('Identidad verificada');
    expect(advisorTrustLabel({ ...UNVERIFIED_ADVISOR_SNAPSHOT, level: 'business_verified', identity: 'verified', business: 'verified' })).toBe('Actividad profesional verificada');
    expect(advisorTrustLabel({ ...UNVERIFIED_ADVISOR_SNAPSHOT, level: 'professional_verified', identity: 'verified', professional: 'verified' })).toBe('Profesional verificado');
  });
});
