/**
 * Format-level registration validators (ES).
 * Intentional: no AEAT / government live verification.
 */

const DNI_CONTROL = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_LETTERS = 'ABCDEFGHJKLMNPQRSUVW';
const CIF_CONTROL_LETTER = 'JABCDEFGHI';

/** Strip spaces/hyphens and uppercase. */
export function normalizeSpanishTaxId(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s.\-_/]/g, '');
}

/** Collegiate numbers: trim, uppercase, drop internal spaces. */
export function normalizeCollegiateNumber(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function isValidDniOrNie(id: string): boolean {
  // DNI: 8 digits + letter
  const dni = /^(\d{8})([A-Z])$/.exec(id);
  if (dni) {
    const num = Number(dni[1]);
    return DNI_CONTROL[num % 23] === dni[2];
  }

  // NIE: X|Y|Z + 7 digits + letter
  const nie = /^([XYZ])(\d{7})([A-Z])$/.exec(id);
  if (nie) {
    const prefix = { X: '0', Y: '1', Z: '2' }[nie[1] as 'X' | 'Y' | 'Z'];
    const num = Number(`${prefix}${nie[2]}`);
    return DNI_CONTROL[num % 23] === nie[3];
  }

  return false;
}

function isValidCif(id: string): boolean {
  // Letter (org type) + 7 digits + control (digit or letter)
  const m = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/.exec(id);
  if (!m) return false;
  if (!CIF_LETTERS.includes(m[1])) return false;

  const digits = m[2];
  let evenSum = 0;
  let oddSum = 0;
  for (let i = 0; i < 7; i += 1) {
    const n = Number(digits[i]);
    if (i % 2 === 0) {
      // Positions 1,3,5,7 (1-based) → index 0,2,4,6
      const doubled = n * 2;
      oddSum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      evenSum += n;
    }
  }
  const total = evenSum + oddSum;
  const unit = (10 - (total % 10)) % 10;
  const control = m[3];

  // Some CIF types prefer digit, some letter, many accept either matching value
  const digitOk = control === String(unit);
  const letterOk = control === CIF_CONTROL_LETTER[unit];
  return digitOk || letterOk;
}

/**
 * Accepts Spanish NIF (DNI), NIE, or CIF with control character.
 * Returns false for empty / malformed — never calls external APIs.
 */
export function isValidSpanishTaxId(raw: string | undefined | null): boolean {
  const id = normalizeSpanishTaxId(raw);
  if (!id) return false;
  if (isValidDniOrNie(id)) return true;
  if (isValidCif(id)) return true;
  return false;
}

export const COLLEGIATE_MIN_LENGTH = 4;

/**
 * Non-empty, min length, alphanumeric (optional hyphens/slashes stripped by normalize).
 */
export function isValidCollegiateNumber(raw: string | undefined | null): boolean {
  const value = normalizeCollegiateNumber(raw);
  if (value.length < COLLEGIATE_MIN_LENGTH) return false;
  return /^[A-Z0-9][A-Z0-9\-/]*$/.test(value);
}

export type ManagerSignupInput = {
  companyName?: string | null;
  nif?: string | null;
  collegiateNumber?: string | null;
};

export type ManagerSignupNormalized = {
  companyName: string;
  nif: string;
  collegiateNumber: string;
};

/** Spanish UI / thrown Error messages for gestoría signup. */
export const MANAGER_SIGNUP_ERRORS = {
  companyName: 'Indica el nombre de la gestoría.',
  nifRequired: 'El NIF de la empresa es obligatorio para registrar una gestoría.',
  nifInvalid:
    'El NIF/CIF/NIE de la empresa no es válido. Revisa el formato (p. ej. B12345674 o 12345678Z).',
  collegiateRequired: 'El número de colegiado es obligatorio para registrar una gestoría.',
  collegiateInvalid:
    'El número de colegiado no es válido. Usa al menos 4 caracteres alfanuméricos.'
} as const;

/**
 * Pure guard: managers must provide company name + valid tax id + collegiate number.
 * Riders are not validated here (registration stays open).
 * Throws Error with a clear Spanish message — never allows role=manager without both ids.
 */
export function assertManagerSignupFields(input: ManagerSignupInput): ManagerSignupNormalized {
  const companyName = String(input.companyName ?? '').trim();
  if (!companyName) {
    throw new Error(MANAGER_SIGNUP_ERRORS.companyName);
  }

  const nifRaw = String(input.nif ?? '').trim();
  if (!nifRaw) {
    throw new Error(MANAGER_SIGNUP_ERRORS.nifRequired);
  }
  if (!isValidSpanishTaxId(nifRaw)) {
    throw new Error(MANAGER_SIGNUP_ERRORS.nifInvalid);
  }

  const collegiateRaw = String(input.collegiateNumber ?? '').trim();
  if (!collegiateRaw) {
    throw new Error(MANAGER_SIGNUP_ERRORS.collegiateRequired);
  }
  if (!isValidCollegiateNumber(collegiateRaw)) {
    throw new Error(MANAGER_SIGNUP_ERRORS.collegiateInvalid);
  }

  return {
    companyName,
    nif: normalizeSpanishTaxId(nifRaw),
    collegiateNumber: normalizeCollegiateNumber(collegiateRaw)
  };
}

/** Client-friendly non-throwing check (first error message or null). */
export function managerSignupError(input: ManagerSignupInput): string | null {
  try {
    assertManagerSignupFields(input);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : MANAGER_SIGNUP_ERRORS.nifRequired;
  }
}
