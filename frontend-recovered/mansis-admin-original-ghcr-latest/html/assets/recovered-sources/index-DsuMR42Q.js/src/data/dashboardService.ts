import { apiClient } from './apiService';
import { DashboardStats } from '@/types/DashboardStats.interface';
import { DASHBOARD } from './endpoints';

export interface DashboardFilters {
  branchId?: number;
  companyId?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  limit?: string | number;
}

export interface SalesTrendsFilters extends DashboardFilters {
  interval?: string;
  purchaseType?: string;
}

function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
}

export const dashboardService = {
  async getStats(filters: DashboardFilters): Promise<DashboardStats> {
    const qs = buildQueryString(filters);
    const response = await apiClient.get<DashboardStats>(
      `${DASHBOARD}/stats?${qs}`
    );
    return response.data;
  },

  async getSalesTrends(filters: SalesTrendsFilters): Promise<any> {
    const qs = buildQueryString(filters);
    const response = await apiClient.get(`${DASHBOARD}/sales/trends?${qs}`);
    return response.data;
  },

  async getBranchPerformance(filters: DashboardFilters): Promise<any> {
    const qs = buildQueryString(filters);
    const response = await apiClient.get(
      `${DASHBOARD}/branches/performance?${qs}`
    );
    return response.data;
  },

  async getCustomerSegmentation(filters: DashboardFilters): Promise<any> {
    const qs = buildQueryString(filters);
    const response = await apiClient.get(
      `${DASHBOARD}/customer/segmentation?${qs}`
    );
    return response.data;
  },

  async getCustomerDemographics(filters: DashboardFilters): Promise<any> {
    const qs = buildQueryString(filters);
    const response = await apiClient.get(
      `${DASHBOARD}/customer/demographics?${qs}`
    );
    return response.data;
  },

  async getTopSellingProducts(filters: DashboardFilters): Promise<any> {
    const qs = buildQueryString(filters);
    const response = await apiClient.get(
      `${DASHBOARD}/products/top-selling?${qs}`
    );
    return response.data;
  }
};
