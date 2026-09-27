import { describe, expect, it } from 'vitest';
import {
  COLLEGIATE_MIN_LENGTH,
  LOCAL_REGISTRATION_ID_MAX_LENGTH,
  LOCAL_REGISTRATION_ID_MIN_LENGTH,
  MANAGER_SIGNUP_ERRORS,
  assertManagerSignupFields,
  isValidCollegiateNumber,
  isValidLocalRegistrationId,
  isValidSpanishTaxId,
  managerSignupError,
  normalizeCollegiateNumber,
  normalizeLocalRegistrationId,
  normalizeSpanishTaxId
} from './registrationValidation';

describe('normalizeSpanishTaxId', () => {
  it('uppercases and strips separators', () => {
    expect(normalizeSpanishTaxId(' b-12345674 ')).toBe('B12345674');
    expect(normalizeSpanishTaxId('12345678-z')).toBe('12345678Z');
  });
});

describe('isValidSpanishTaxId (NIF/CIF/NIE format)', () => {
  it('accepts valid DNI/NIF with control letter', () => {
    expect(isValidSpanishTaxId('12345678Z')).toBe(true);
    expect(isValidSpanishTaxId('00000000T')).toBe(true);
  });

  it('rejects DNI with wrong control letter', () => {
    expect(isValidSpanishTaxId('12345678A')).toBe(false);
  });

  it('accepts valid NIE', () => {
    expect(isValidSpanishTaxId('X1234567L')).toBe(true);
    expect(isValidSpanishTaxId('Y1234567X')).toBe(true);
  });

  it('accepts valid CIF', () => {
    expect(isValidSpanishTaxId('B12345674')).toBe(true);
    expect(isValidSpanishTaxId('A58818501')).toBe(true);
  });

  it('rejects empty, short, or garbage', () => {
    expect(isValidSpanishTaxId('')).toBe(false);
    expect(isValidSpanishTaxId('   ')).toBe(false);
    expect(isValidSpanishTaxId('ABC')).toBe(false);
    expect(isValidSpanishTaxId('1234567')).toBe(false);
    expect(isValidSpanishTaxId(undefined)).toBe(false);
  });
});

describe('collegiate number', () => {
  it('normalizes and requires min length + alphanumeric', () => {
    expect(normalizeCollegiateNumber(' ab-12 34 ')).toBe('AB-1234');
    expect(isValidCollegiateNumber('AB12')).toBe(true);
    expect(isValidCollegiateNumber('1234')).toBe(true);
    expect(isValidCollegiateNumber('COL-9988')).toBe(true);
    expect(isValidCollegiateNumber('ab')).toBe(false);
    expect(isValidCollegiateNumber('')).toBe(false);
    expect(isValidCollegiateNumber('***')).toBe(false);
    expect(COLLEGIATE_MIN_LENGTH).toBe(4);
  });
});

describe('generic local registration id', () => {
  it('preserves meaningful punctuation and only performs format-level checks', () => {
    expect(normalizeLocalRegistrationId(' br-12.345/0001 ')).toBe('BR-12.345/0001');
    expect(isValidLocalRegistrationId('BR-12.345/0001')).toBe(true);
    expect(isValidLocalRegistrationId('A1')).toBe(false);
    expect(isValidLocalRegistrationId('---')).toBe(false);
    expect(LOCAL_REGISTRATION_ID_MIN_LENGTH).toBe(3);
    expect(LOCAL_REGISTRATION_ID_MAX_LENGTH).toBe(64);
  });
});

describe('assertManagerSignupFields (signup guard)', () => {
  const valid = {
    companyName: 'Gestoría Norte SL',
    nif: 'B12345674',
    collegiateNumber: 'COL-9988',
    countryCode: 'ES'
  };

  it('keeps strict Spain validation and normalization', () => {
    expect(assertManagerSignupFields(valid)).toEqual({
      companyName: 'Gestoría Norte SL',
      nif: 'B12345674',
      collegiateNumber: 'COL-9988'
    });
  });

  it('never allows Spanish manager without company name', () => {
    expect(() => assertManagerSignupFields({ ...valid, companyName: '  ' })).toThrow(
      MANAGER_SIGNUP_ERRORS.companyName
    );
  });

  it('never allows Spanish manager without NIF', () => {
    expect(() => assertManagerSignupFields({ ...valid, nif: '' })).toThrow(
      MANAGER_SIGNUP_ERRORS.nifRequired
    );
  });

  it('never allows Spanish manager with invalid NIF', () => {
    expect(() => assertManagerSignupFields({ ...valid, nif: 'B12345670' })).toThrow(
      MANAGER_SIGNUP_ERRORS.nifInvalid
    );
  });

  it('never allows Spanish manager without collegiate number', () => {
    expect(() => assertManagerSignupFields({ ...valid, collegiateNumber: '' })).toThrow(
      MANAGER_SIGNUP_ERRORS.collegiateRequired
    );
  });

  it('never allows Spanish manager with weak collegiate number', () => {
    expect(() => assertManagerSignupFields({ ...valid, collegiateNumber: 'ab' })).toThrow(
      MANAGER_SIGNUP_ERRORS.collegiateInvalid
    );
  });

  it('accepts a non-Spanish firm with a local registration id without pretending registry verification', () => {
    expect(assertManagerSignupFields({
      companyName: 'Contadores Global SAS',
      nif: 'NIT 900.123.456-7',
      collegiateNumber: '',
      countryCode: 'CO'
    })).toEqual({
      companyName: 'Contadores Global SAS',
      nif: 'NIT 900.123.456-7',
      collegiateNumber: ''
    });
  });

  it('requires a local registration id outside Spain', () => {
    expect(() => assertManagerSignupFields({
      companyName: 'Global Tax LLC',
      nif: '',
      collegiateNumber: '',
      countryCode: 'US'
    })).toThrow(MANAGER_SIGNUP_ERRORS.localRegistrationRequired);
  });

  it('managerSignupError is country-aware', () => {
    expect(managerSignupError(valid)).toBeNull();
    expect(managerSignupError({ ...valid, nif: '' })).toBe(MANAGER_SIGNUP_ERRORS.nifRequired);
    expect(managerSignupError({ companyName: 'Firma', nif: 'REG-123', countryCode: 'MX' })).toBeNull();
    expect(managerSignupError({ companyName: 'Firma', nif: '', countryCode: 'MX' })).toBe(
      MANAGER_SIGNUP_ERRORS.localRegistrationRequired
    );
  });
});
