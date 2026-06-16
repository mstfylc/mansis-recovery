import React, { useState, useEffect, useRef } from 'react';
import { Filters } from '@/types/Filters';
import { TransactionType } from '@/types/AccountingLedger.interface';
import { useFilterPersistence } from './useFilterPersistence';

interface UseTableFiltersProps {
  initialFilters?: Partial<Filters>;
  onFilterChange: (filters: Filters) => void;
  pageKey?: string;
}

interface UseTableFiltersReturn {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  handleSearch: (value: string) => void;
  handleStatusChange: (value: string | undefined) => void;
  handleCategoryChange: (value: number | undefined) => void;
  handleStockLevelChange: (value: string | undefined) => void;
  handleBranchChange: (value: number | undefined) => void;
  handleCompanyChange: (value: number | undefined) => void;
  handleDateRangeChange: (
    startDate?: string,
    endDate?: string,
    timezone?: string
  ) => void;
  handlePriceChange: (min?: number, max?: number) => void;
  handleProductTypeChange: (value: string | undefined) => void;
  handleActivityChange: (value: number | undefined) => void;
  handleChildActivityChange: (value: number | undefined) => void;
  handleStockUnitChange: (value: string | undefined) => void;
  handleStockTrackedChange: (value: boolean) => void;
  handleTrackExpiryChange: (value: boolean) => void;
  handleTransactionTypeChange: (value: TransactionType | undefined) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  getActiveFiltersCount: () => number;
}

export const useTableFilters = ({
  initialFilters = {},
  onFilterChange,
  pageKey
}: UseTableFiltersProps): UseTableFiltersReturn => {
  const defaultFilters: Filters = {
    status: undefined,
    search: '',
    page: 0,
    limit: 10,
    startDate: undefined,
    endDate: undefined,
    categoryId: undefined,
    branchId: undefined,
    companyId: undefined,
    price: {
      min: undefined,
      max: undefined
    },
    ...initialFilters
  };

  const { persistedValue, setPersisted, clearPersisted } =
    useFilterPersistence<Filters>(pageKey || '_default', defaultFilters);

  const getInitialFilters = (): Filters => {
    if (pageKey && persistedValue) {
      // Restore persisted filters but always reset search text (transient UX)
      return { ...defaultFilters, ...persistedValue, search: '' };
    }
    return defaultFilters;
  };

  const [filters, setFilters] = useState<Filters>(getInitialFilters);
  const isInitialMount = useRef(true);
  const hasCalledInitialFetch = useRef(false);

  // Call onFilterChange on mount with restored/initial filters.
  // Empty deps is intentional — this must only run once on mount.

  useEffect(() => {
    if (!hasCalledInitialFetch.current) {
      hasCalledInitialFetch.current = true;
      const initialFilters = getInitialFilters();
      onFilterChange(initialFilters);
    }
  }, []);

  // Persist filters to storage when they change (skip initial mount)
  // Search text is intentionally excluded — it's transient and should not
  // survive navigation (users expect a clean search on revisit).
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (pageKey) {
      setPersisted({ ...filters, search: '' });
    }
  }, [filters, pageKey, setPersisted]);

  const handleSearch = (value: string) => {
    const newFilters = {
      ...filters,
      search: value,
      page: 0
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: value,
      page: 0
    }));
  };

  const handleCategoryChange = (value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: value,
      page: 0
    }));
  };

  const handleStockLevelChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      stockLevel: value,
      page: 0
    }));
  };

  const handleBranchChange = (value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      branchId: value,
      page: 0
    }));
  };

  const handleCompanyChange = (value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      companyId: value,
      page: 0
    }));
  };

  const handleDateRangeChange = (
    startDate?: string,
    endDate?: string,
    timezone?: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
      timezone,
      page: 0
    }));
  };

  const handlePriceChange = (min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      price: {
        min,
        max
      },
      page: 0
    }));
  };

  const handleProductTypeChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      type: value,
      page: 0
    }));
  };

  const handleActivityChange = (value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      activityId: value,
      childActivityId: undefined,
      page: 0
    }));
  };

  const handleChildActivityChange = (value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      childActivityId: value,
      page: 0
    }));
  };

  const handleStockUnitChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      stockUnit: value,
      page: 0
    }));
  };

  const handleStockTrackedChange = (value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      isStockTracked: value,
      page: 0
    }));
  };

  const handleTrackExpiryChange = (value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      trackExpiry: value,
      page: 0
    }));
  };

  const handleTransactionTypeChange = (value: TransactionType | undefined) => {
    setFilters((prev) => ({
      ...prev,
      transactionType: value,
      page: 0
    }));
  };

  const handleApplyFilters = () => {
    const appliedFilters = {
      ...filters,
      page: 0
    };
    setFilters(appliedFilters);
    onFilterChange(appliedFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      ...defaultFilters,
      search: filters.search,
      page: 0,
      limit: filters.limit
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    if (pageKey) {
      clearPersisted();
      setPersisted(resetFilters);
    }
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.status) count++;
    if (filters.startDate && filters.endDate) count++;
    if (filters.categoryId) count++;
    if (filters.stockLevel && filters.stockLevel !== 'ALL') count++;
    if (filters.branchId) count++;
    if (filters.companyId) count++;
    if (filters.activityId) count++;
    if (filters.childActivityId) count++;
    if (filters.type) count++;
    if (filters.price?.min || filters.price?.max) count++;
    if (filters.stockUnit) count++;
    if (filters.isStockTracked !== undefined) count++;
    if (filters.trackExpiry !== undefined) count++;
    if (filters.transactionType) count++;
    return count;
  };

  return {
    filters,
    setFilters,
    handleSearch,
    handleStatusChange,
    handleCategoryChange,
    handleStockLevelChange,
    handleBranchChange,
    handleCompanyChange,
    handleDateRangeChange,
    handlePriceChange,
    handleProductTypeChange,
    handleActivityChange,
    handleChildActivityChange,
    handleStockUnitChange,
    handleStockTrackedChange,
    handleTrackExpiryChange,
    handleTransactionTypeChange,
    handleApplyFilters,
    handleResetFilters,
    getActiveFiltersCount
  };
};
