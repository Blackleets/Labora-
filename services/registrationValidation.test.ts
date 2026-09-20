import { describe, expect, it } from 'vitest';
import {
  COLLEGIATE_MIN_LENGTH,
  MANAGER_SIGNUP_ERRORS,
  assertManagerSignupFields,
  isValidCollegiateNumber,
  isValidSpanishTaxId,
  managerSignupError,
  normalizeCollegiateNumber,
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

describe('assertManagerSignupFields (signup guard)', () => {
  const valid = {
    companyName: 'Gestoría Norte SL',
    nif: 'B12345674',
    collegiateNumber: 'COL-9988'
  };

  it('returns normalized fields when valid', () => {
    expect(assertManagerSignupFields(valid)).toEqual({
      companyName: 'Gestoría Norte SL',
      nif: 'B12345674',
      collegiateNumber: 'COL-9988'
    });
  });

  it('never allows manager without company name', () => {
    expect(() => assertManagerSignupFields({ ...valid, companyName: '  ' })).toThrow(
      MANAGER_SIGNUP_ERRORS.companyName
    );
  });

  it('never allows manager without NIF', () => {
    expect(() => assertManagerSignupFields({ ...valid, nif: '' })).toThrow(
      MANAGER_SIGNUP_ERRORS.nifRequired
    );
  });

  it('never allows manager with invalid NIF', () => {
    expect(() => assertManagerSignupFields({ ...valid, nif: 'B12345670' })).toThrow(
      MANAGER_SIGNUP_ERRORS.nifInvalid
    );
  });

  it('never allows manager without collegiate number', () => {
    expect(() => assertManagerSignupFields({ ...valid, collegiateNumber: '' })).toThrow(
      MANAGER_SIGNUP_ERRORS.collegiateRequired
    );
  });

  it('never allows manager with weak collegiate number', () => {
    expect(() => assertManagerSignupFields({ ...valid, collegiateNumber: 'ab' })).toThrow(
      MANAGER_SIGNUP_ERRORS.collegiateInvalid
    );
  });

  it('managerSignupError returns first Spanish message or null', () => {
    expect(managerSignupError(valid)).toBeNull();
    expect(managerSignupError({ ...valid, nif: '' })).toBe(MANAGER_SIGNUP_ERRORS.nifRequired);
  });
});
