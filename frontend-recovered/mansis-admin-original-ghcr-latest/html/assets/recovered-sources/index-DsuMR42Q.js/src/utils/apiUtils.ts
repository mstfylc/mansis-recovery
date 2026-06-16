import { Filters } from '@/types/Filters';

/**
 * Transforms UI filter parameters to API query parameters
 * @param filters The UI filter object
 * @returns An object with API-compatible query parameters
 */
export const transformFiltersToApiParams = (
  filters?: Filters
): Record<string, any> => {
  if (!filters) {
    return { page: 0, limit: 10 };
  }

  // Start with default pagination
  const apiParams: Record<string, any> = {
    page: filters.page ?? 0,
    limit: filters.limit ?? 10
  };

  // Add simple filters (direct mapping)
  if (filters.status) apiParams.status = filters.status;
  if (filters.search) apiParams.search = filters.search;
  if (filters.startDate) apiParams.startDate = filters.startDate;
  if (filters.endDate) apiParams.endDate = filters.endDate;
  if (filters.timezone) apiParams.timezone = filters.timezone;
  if (filters.role) apiParams.role = filters.role;
  if (filters.orderStatus) apiParams.orderStatus = filters.orderStatus;
  if (filters.purchaseType) apiParams.purchaseType = filters.purchaseType;

  // Ensure numeric parameters are sent as numbers
  if (filters.categoryId) apiParams.categoryId = Number(filters.categoryId);
  if (filters.branchId) apiParams.branchId = Number(filters.branchId);
  if (filters.companyId) apiParams.companyId = Number(filters.companyId);
  if (filters.activityId) apiParams.activityId = Number(filters.activityId);
  if (filters.childActivityId)
    apiParams.childActivityId = Number(filters.childActivityId);

  // Other parameters
  if (filters.sortBy) apiParams.sortBy = filters.sortBy;
  if (filters.sortOrder) apiParams.sortOrder = filters.sortOrder;

  if (filters.type) {
    if (filters.type === 'menu') {
      apiParams.isMenu = 'true';
    } else if (filters.type === 'product') {
      apiParams.isMenu = 'false';
    } else {
      apiParams.type = filters.type;
    }
  }

  if (filters.isIngredient !== undefined) {
    apiParams.isIngredient = filters.isIngredient;
  }
  if (filters.lowStockOnly !== undefined) {
    apiParams.lowStockOnly = filters.lowStockOnly;
  }
  if (filters.isActive !== undefined) {
    apiParams.isActive = filters.isActive;
  }

  if (filters.stockUnit) {
    apiParams.stockUnit = filters.stockUnit;
  }
  if (filters.isStockTracked !== undefined) {
    apiParams.isStockTracked = filters.isStockTracked;
  }
  if (filters.trackExpiry !== undefined) {
    apiParams.trackExpiry = filters.trackExpiry;
  }

  // Transform nested objects and ensure they're numbers
  if (filters.price?.min) apiParams.minPrice = Number(filters.price.min);
  if (filters.price?.max) apiParams.maxPrice = Number(filters.price.max);

  return apiParams;
};
