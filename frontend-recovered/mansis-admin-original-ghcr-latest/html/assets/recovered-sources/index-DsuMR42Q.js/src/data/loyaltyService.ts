import { apiClient } from './apiService';
import {
  LOYALTY_SETTINGS,
  LOYALTY_SETTINGS_ALL,
  LOYALTY_PRODUCTS,
  LOYALTY_PRODUCTS_ALL,
  LOYALTY_PRODUCTS_BULK_DELETE
} from './endpoints';

export interface LoyaltySettingsResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export interface LoyaltyProductsResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export const loyaltyService = {
  // --- Settings ---

  async getSettings(
    params: Record<string, any> = {}
  ): Promise<LoyaltySettingsResponse> {
    const response = await apiClient.get<LoyaltySettingsResponse>(
      LOYALTY_SETTINGS_ALL,
      params
    );
    return response.data;
  },

  async getSettingsByCompany(companyId: number): Promise<any> {
    const response = await apiClient.get(`${LOYALTY_SETTINGS}/${companyId}`);
    return response.data;
  },

  async updateSettings(
    companyId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.patch(
      `${LOYALTY_SETTINGS}/${companyId}`,
      data
    );
    return response.data;
  },

  // --- Products ---

  async getProducts(
    params: Record<string, any> = {}
  ): Promise<LoyaltyProductsResponse> {
    const response = await apiClient.get<LoyaltyProductsResponse>(
      LOYALTY_PRODUCTS_ALL,
      params
    );
    return response.data;
  },

  async createProduct(
    branchId: number,
    data: { companyProductId: number; pointCost: number }
  ): Promise<any> {
    const response = await apiClient.post(
      `${LOYALTY_PRODUCTS}/${branchId}`,
      data
    );
    return response.data;
  },

  async updateProduct(
    branchId: number,
    productId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.patch(
      `${LOYALTY_PRODUCTS}/${branchId}/${productId}`,
      data
    );
    return response.data;
  },

  async deleteProduct(branchId: number, productId: number): Promise<void> {
    await apiClient.delete(`${LOYALTY_PRODUCTS}/${branchId}/${productId}`);
  },

  async bulkDeleteProducts(productIds: number[]): Promise<void> {
    await apiClient.post(LOYALTY_PRODUCTS_BULK_DELETE, { productIds });
  }
};
