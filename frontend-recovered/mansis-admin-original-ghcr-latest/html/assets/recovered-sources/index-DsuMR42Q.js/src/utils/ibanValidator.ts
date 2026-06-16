/**
 * Validates Turkish IBAN format and checksum
 * @param iban - IBAN string to validate
 * @returns Object with validation result and formatted IBAN
 */
export const validateIBAN = (
  iban: string
): {
  isValid: boolean;
  formatted: string;
  pretty: string;
  errorKey?: string;
} => {
  // Remove all spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Check if it's a Turkish IBAN (TR + 24 digits)
  if (!cleaned.startsWith('TR')) {
    return {
      isValid: false,
      formatted: cleaned,
      pretty: cleaned,
      errorKey: 'iban.must.start.with.tr'
    };
  }

  // Check length (TR + 24 digits = 26 characters)
  if (cleaned.length !== 26) {
    return {
      isValid: false,
      formatted: cleaned,
      pretty: cleaned,
      errorKey: 'iban.invalid.length'
    };
  }

  // Check if all characters after TR are digits
  const digits = cleaned.slice(2);
  if (!/^\d{24}$/.test(digits)) {
    return {
      isValid: false,
      formatted: cleaned,
      pretty: cleaned,
      errorKey: 'iban.invalid.format'
    };
  }

  // Mod-97 checksum validation
  // Move first 4 characters to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (const char of rearranged) {
    if (/[A-Z]/.test(char)) {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      numericString += char;
    }
  }

  // Calculate mod 97
  let remainder = 0;
  for (const digit of numericString) {
    remainder = (remainder * 10 + parseInt(digit)) % 97;
  }

  const isValid = remainder === 1;

  // Format with spaces (TR12 3456 7890 1234 5678 90)
  const pretty = cleaned.replace(/(.{4})/g, '$1 ').trim();

  return {
    isValid,
    formatted: cleaned,
    pretty,
    errorKey: isValid ? undefined : 'iban.invalid.checksum'
  };
};

/**
 * Formats IBAN with spaces for display
 */
export const formatIBANPretty = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Masks IBAN for display (shows only first 4 and last 2 digits)
 * Example: TR33 **** **** **** **** **26
 */
export const maskIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 26) return iban;

  const first4 = cleaned.slice(0, 4);
  const last2 = cleaned.slice(-2);
  const masked = first4 + ' **** **** **** **** **' + last2;

  return masked;
};
