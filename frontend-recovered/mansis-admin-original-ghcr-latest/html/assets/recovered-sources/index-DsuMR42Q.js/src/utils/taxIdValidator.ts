/**
 * Validates Turkish TC Kimlik No (11 digits)
 */
export const validateTCKN = (tckn: string): boolean => {
  // Remove spaces and check if it's exactly 11 digits
  const cleaned = tckn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // First digit cannot be 0
  if (cleaned[0] === '0') {
    return false;
  }

  const digits = cleaned.split('').map(Number);

  // Calculate 10th digit
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = (sum1 - sum2) % 10;

  if (check10 !== digits[9]) {
    return false;
  }

  // Calculate 11th digit
  const sum11 = digits.slice(0, 10).reduce((acc, val) => acc + val, 0);
  const check11 = sum11 % 10;

  return check11 === digits[10];
};

/**
 * Validates Turkish VKN (Vergi Kimlik No - 10 digits)
 */
export const validateVKN = (vkn: string): boolean => {
  // Remove spaces and check if it's exactly 10 digits
  const cleaned = vkn.replace(/\s/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }

  const digits = cleaned.split('').map(Number);
  const lastDigit = digits[9];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const tmp = (digits[i] + (9 - i)) % 10;
    const multiply = (tmp * Math.pow(2, 9 - i)) % 9;
    if (tmp !== 0 && multiply === 0) {
      sum += 9;
    } else {
      sum += multiply;
    }
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === lastDigit;
};

/**
 * Auto-detects and validates Tax ID (TCKN or VKN)
 */
export const validateTaxId = (
  taxId: string
): {
  isValid: boolean;
  type: 'TCKN' | 'VKN' | 'UNKNOWN';
  errorKey?: string;
} => {
  const cleaned = taxId.replace(/\s/g, '');

  // Check length
  if (cleaned.length === 11) {
    const isValid = validateTCKN(cleaned);
    return {
      isValid,
      type: 'TCKN',
      errorKey: isValid ? undefined : 'invalid.tckn'
    };
  } else if (cleaned.length === 10) {
    const isValid = validateVKN(cleaned);
    return {
      isValid,
      type: 'VKN',
      errorKey: isValid ? undefined : 'invalid.vkn'
    };
  } else {
    return {
      isValid: false,
      type: 'UNKNOWN',
      errorKey: 'invalid.tax.id.length'
    };
  }
};

/**
 * Masks Tax ID for display (shows only first 3 and last 2 digits)
 * Example: 123*****89
 */
export const maskTaxId = (taxId: string): string => {
  const cleaned = taxId.replace(/\s/g, '');
  if (cleaned.length < 5) return taxId;

  const first3 = cleaned.slice(0, 3);
  const last2 = cleaned.slice(-2);
  const stars = '*'.repeat(cleaned.length - 5);

  return first3 + stars + last2;
};
