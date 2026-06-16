import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { DateRange, DateRangePreset } from '@/types/DateRange.interface';
import { useFilterPersistence } from './useFilterPersistence';

export interface FinanceFilters {
  startDate: Date;
  endDate: Date;
  preset?: DateRangePreset;
  companyId?: number;
  branchId?: number;
  timezone?: string;
}

interface UseFinanceFiltersProps {
  initialDateRange: DateRange;
  initialBranchId?: number;
  pageKey: string;
  onFilterApply: (filters: FinanceFilters) => void;
}

interface UseFinanceFiltersReturn {
  filters: FinanceFilters;
  appliedFilters: FinanceFilters;
  setFilters: Dispatch<SetStateAction<FinanceFilters>>;
  handleDateRangeChange: (
    startDate?: string,
    endDate?: string,
    timezone?: string
  ) => void;
  handleCompanyChange: (companyId?: number) => void;
  handleBranchChange: (branchId?: number) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  getActiveFiltersCount: () => number;
}

export const useFinanceFilters = ({
  initialDateRange,
  initialBranchId,
  pageKey,
  onFilterApply
}: UseFinanceFiltersProps): UseFinanceFiltersReturn => {
  const defaultFilters: FinanceFilters = {
    startDate: initialDateRange.startDate,
    endDate: initialDateRange.endDate,
    preset: initialDateRange.preset as DateRangePreset,
    companyId: undefined,
    branchId: initialBranchId
  };

  const { persistedValue, setPersisted } = useFilterPersistence<FinanceFilters>(
    pageKey,
    defaultFilters
  );

  const [filters, setFilters] = useState<FinanceFilters>(
    persistedValue || defaultFilters
  );

  const [appliedFilters, setAppliedFilters] = useState<FinanceFilters>(
    persistedValue || defaultFilters
  );

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      startDate: initialDateRange.startDate,
      endDate: initialDateRange.endDate,
      preset: initialDateRange.preset as DateRangePreset
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      startDate: initialDateRange.startDate,
      endDate: initialDateRange.endDate,
      preset: initialDateRange.preset as DateRangePreset
    }));
  }, [initialDateRange]);

  const handleDateRangeChange = (
    startDate?: string,
    endDate?: string,
    timezone?: string
  ) => {
    if (startDate && endDate) {
      setFilters((prev) => ({
        ...prev,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timezone,
        preset: undefined
      }));
    }
  };

  const handleCompanyChange = (companyId?: number) => {
    setFilters((prev) => ({
      ...prev,
      companyId,
      branchId: undefined
    }));
  };

  const handleBranchChange = (branchId?: number) => {
    setFilters((prev) => ({
      ...prev,
      branchId
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPersisted(filters);
    onFilterApply(filters);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPersisted(defaultFilters);
    onFilterApply(defaultFilters);
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.companyId) count++;
    if (filters.branchId) count++;
    return count;
  };

  return {
    filters,
    appliedFilters,
    setFilters,
    handleDateRangeChange,
    handleCompanyChange,
    handleBranchChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  };
};
