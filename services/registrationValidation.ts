/**
 * Registration validators.
 *
 * Spain keeps format-level NIF/NIE/CIF validation. Other jurisdictions stay
 * intentionally fail-honest: Labora+ requires a local tax/business identifier,
 * but never claims government verification without a real integration.
 */

const DNI_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_LETTERS = 'ABCDEFGHJKLMNPQRSUVW';
const CIF_CONTROL_LETTER = 'JABCDEFGHI';

/** Strip Spanish formatting separators and uppercase. */
export function normalizeSpanishTaxId(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s.\-_/]/g, '');
}

/** Generic local registration/tax ID. Keeps meaningful punctuation. */
export function normalizeLocalRegistrationId(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/** Collegiate / professional registration numbers: trim, uppercase, drop spaces. */
export function normalizeCollegiateNumber(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function isValidDniOrNie(id: string): boolean {
  const dni = /^(\d{8})([A-Z])$/.exec(id);
  if (dni) {
    const num = Number(dni[1]);
    return DNI_CONTROL[num % 23] === dni[2];
  }

  const nie = /^([XYZ])(\d{7})([A-Z])$/.exec(id);
  if (nie) {
    const prefix = { X: '0', Y: '1', Z: '2' }[nie[1] as 'X' | 'Y' | 'Z'];
    const num = Number(`${prefix}${nie[2]}`);
    return DNI_CONTROL[num % 23] === nie[3];
  }

  return false;
}

function isValidCif(id: string): boolean {
  const match = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/.exec(id);
  if (!match) return false;
  if (!CIF_LETTERS.includes(match[1])) return false;

  const digits = match[2];
  let evenSum = 0;
  let oddSum = 0;
  for (let i = 0; i < 7; i += 1) {
    const n = Number(digits[i]);
    if (i % 2 === 0) {
      const doubled = n * 2;
      oddSum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      evenSum += n;
    }
  }
  const total = evenSum + oddSum;
  const unit = (10 - (total % 10)) % 10;
  const control = match[3];
  return control === String(unit) || control === CIF_CONTROL_LETTER[unit];
}

/** Spanish NIF (DNI), NIE, or CIF with control character. No external lookup. */
export function isValidSpanishTaxId(raw: string | undefined | null): boolean {
  const id = normalizeSpanishTaxId(raw);
  if (!id) return false;
  return isValidDniOrNie(id) || isValidCif(id);
}

export const COLLEGIATE_MIN_LENGTH = 4;
export const LOCAL_REGISTRATION_ID_MIN_LENGTH = 3;
export const LOCAL_REGISTRATION_ID_MAX_LENGTH = 64;

export function isValidCollegiateNumber(raw: string | undefined | null): boolean {
  const value = normalizeCollegiateNumber(raw);
  if (value.length < COLLEGIATE_MIN_LENGTH) return false;
  return /^[A-Z0-9][A-Z0-9\-/]*$/.test(value);
}

/**
 * Generic format guard only. It deliberately does NOT imply that a tax authority
 * or professional registry has validated the identifier.
 */
export function isValidLocalRegistrationId(raw: string | undefined | null): boolean {
  const value = normalizeLocalRegistrationId(raw);
  if (value.length < LOCAL_REGISTRATION_ID_MIN_LENGTH || value.length > LOCAL_REGISTRATION_ID_MAX_LENGTH) return false;
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;
  return /[\p{L}\p{N}]/u.test(value);
}

export type ManagerSignupInput = {
  companyName?: string | null;
  nif?: string | null;
  collegiateNumber?: string | null;
  countryCode?: string | null;
};

export type ManagerSignupNormalized = {
  companyName: string;
  nif: string;
  collegiateNumber: string;
};

export const MANAGER_SIGNUP_ERRORS = {
  companyName: 'Indica el nombre de la gestoría o firma profesional.',
  nifRequired: 'El NIF de la empresa es obligatorio para registrar una gestoría en España.',
  nifInvalid:
    'El NIF/CIF/NIE de la empresa no es válido. Revisa el formato (p. ej. B12345674 o 12345678Z).',
  collegiateRequired: 'El número de colegiado es obligatorio para registrar una gestoría en España.',
  collegiateInvalid:
    'El número de colegiado no es válido. Usa al menos 4 caracteres alfanuméricos.',
  localRegistrationRequired: 'Indica el identificador fiscal o registral de la firma en tu país.',
  localRegistrationInvalid: 'El identificador fiscal o registral local no tiene un formato válido.',
  professionalRegistrationInvalid: 'El identificador profesional o registral indicado no tiene un formato válido.'
} as const;

/**
 * Pure signup guard.
 * - ES: company + valid Spanish tax id + collegiate number.
 * - Other countries: company + local tax/business registration id; professional
 *   registration is optional because requirements differ by jurisdiction.
 *
 * This is format validation only. No government registry lookup is claimed.
 */
export function assertManagerSignupFields(input: ManagerSignupInput): ManagerSignupNormalized {
  const companyName = String(input.companyName ?? '').trim();
  if (!companyName) throw new Error(MANAGER_SIGNUP_ERRORS.companyName);

  const countryCode = String(input.countryCode || 'ES').trim().toUpperCase();
  const nifRaw = String(input.nif ?? '').trim();
  const collegiateRaw = String(input.collegiateNumber ?? '').trim();

  if (countryCode === 'ES') {
    if (!nifRaw) throw new Error(MANAGER_SIGNUP_ERRORS.nifRequired);
    if (!isValidSpanishTaxId(nifRaw)) throw new Error(MANAGER_SIGNUP_ERRORS.nifInvalid);
    if (!collegiateRaw) throw new Error(MANAGER_SIGNUP_ERRORS.collegiateRequired);
    if (!isValidCollegiateNumber(collegiateRaw)) throw new Error(MANAGER_SIGNUP_ERRORS.collegiateInvalid);

    return {
      companyName,
      nif: normalizeSpanishTaxId(nifRaw),
      collegiateNumber: normalizeCollegiateNumber(collegiateRaw)
    };
  }

  if (!nifRaw) throw new Error(MANAGER_SIGNUP_ERRORS.localRegistrationRequired);
  if (!isValidLocalRegistrationId(nifRaw)) throw new Error(MANAGER_SIGNUP_ERRORS.localRegistrationInvalid);
  if (collegiateRaw && !isValidLocalRegistrationId(collegiateRaw)) {
    throw new Error(MANAGER_SIGNUP_ERRORS.professionalRegistrationInvalid);
  }

  return {
    companyName,
    nif: normalizeLocalRegistrationId(nifRaw),
    collegiateNumber: collegiateRaw ? normalizeLocalRegistrationId(collegiateRaw) : ''
  };
}

export function managerSignupError(input: ManagerSignupInput): string | null {
  try {
    assertManagerSignupFields(input);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : MANAGER_SIGNUP_ERRORS.localRegistrationRequired;
  }
}
