import { format, isValid } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import i18next from 'i18next';

const locales = {
  en: enUS,
  tr: tr
};

const getCurrentLocale = () => {
  const langCode = i18next.language?.split('-')[0] || 'en';
  return locales[langCode] || locales.en;
};

// Helper function to safely parse dates
const safeParseDate = (date: string | Date | undefined | null): Date | null => {
  if (date === undefined || date === null || date === '') {
    return null;
  }

  // If it's already a Date object
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  // If it's a string, try to parse it
  try {
    const parsedDate = new Date(date);
    return isValid(parsedDate) ? parsedDate : null;
  } catch {
    return null;
  }
};

export const formatDateToDayMonthYear = (
  date: string | Date | undefined | null
): string => {
  try {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) {
      return '-';
    }

    return format(parsedDate, 'dd MMM yyyy', {
      locale: getCurrentLocale()
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

export const formatDateToDayMonthYearTime = (
  date: string | Date | undefined | null
): string => {
  try {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) {
      return '-';
    }

    return format(parsedDate, 'dd MMM yyyy HH:mm', {
      locale: getCurrentLocale()
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Format date for charts (day and month only)
export const formatDateForChart = (
  date: string | Date | undefined | null
): string => {
  try {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) {
      return '-';
    }

    return format(parsedDate, 'dd MMM', {
      locale: getCurrentLocale()
    });
  } catch (error) {
    console.error('Error formatting date for chart:', error);
    return '-';
  }
};

// Format date for API requests (yyyy-MM-dd)
export const formatDateForApi = (
  date: string | Date | undefined | null
): string => {
  try {
    const parsedDate = safeParseDate(date);
    if (!parsedDate) {
      return '';
    }

    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};
