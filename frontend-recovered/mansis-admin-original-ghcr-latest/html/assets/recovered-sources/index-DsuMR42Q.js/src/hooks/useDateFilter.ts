import { useState, useCallback, useEffect } from 'react';
import { DateRange } from '@/types/DateRange.interface';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { user$ } from '@/store/userStore';

interface UseDateFilterOptions {
  defaultPreset?: DateRange['preset'];
  onDateRangeChange?: (dateRange: DateRange | null) => void;
}

interface UseDateFilterResult {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange | null) => void;
  getDateRangeParams: () => {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  dateRangeQueryParams: string;
}

/**
 * Custom hook for handling date filtering
 * @param options Configuration options
 * @returns Date filter state and utilities
 */
export const useDateFilter = (
  options?: UseDateFilterOptions
): UseDateFilterResult => {
  const { defaultPreset = 'last.30days', onDateRangeChange } = options || {};
  const { t, i18n } = useTranslation();

  // Initialize date range
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);

    // Default to last 30 days if not specified
    if (defaultPreset === 'last.30days') {
      startDate.setDate(today.getDate() - 29);
    } else if (defaultPreset === 'last.7days') {
      startDate.setDate(today.getDate() - 6);
    } else if (defaultPreset === 'today') {
      // Same day for start and end
    } else if (defaultPreset === 'yesterday') {
      startDate.setDate(today.getDate() - 1);
      endDate.setDate(today.getDate() - 1);
    } else if (defaultPreset === 'this.month') {
      startDate.setDate(1); // First day of current month
    } else if (defaultPreset === 'last.month') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    return {
      startDate,
      endDate,
      preset: defaultPreset,
      label: t(`filters.date.${defaultPreset}`)
    };
  });

  // Set date range with callback
  const setDateRange = useCallback(
    (newDateRange: DateRange | null) => {
      if (newDateRange) {
        setDateRangeState(newDateRange);
        if (onDateRangeChange) {
          onDateRangeChange(newDateRange);
        }
      } else if (onDateRangeChange) {
        onDateRangeChange(null);
      }
    },
    [onDateRangeChange]
  );

  // Update labels when language changes
  useEffect(() => {
    if (dateRange.preset) {
      setDateRangeState((prevRange) => ({
        ...prevRange,
        label: t(`filters.date.${prevRange.preset}`)
      }));
    }
  }, [i18n.language, t]);

  const getDateRangeParams = useCallback(() => {
    const timezone =
      user$.currentBranch.get()?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
      timezone
    };
  }, [dateRange]);

  // Get URL query parameters for date range
  const dateRangeQueryParams = useCallback(() => {
    const { startDate, endDate, timezone } = getDateRangeParams();
    return `startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(timezone)}`;
  }, [getDateRangeParams]);

  return {
    dateRange,
    setDateRange,
    getDateRangeParams,
    dateRangeQueryParams: dateRangeQueryParams()
  };
};

export default useDateFilter;
