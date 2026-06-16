import { apiClient } from './apiService';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import {
  COMPANY_PRODUCTS,
  COMPANY_PRODUCT_DETAIL,
  COMPANY_PRODUCT_BRANCH_OVERRIDES,
  COMPANY_PRODUCTS_STOCK_TRACKED_BY_BRANCH,
  COMPANY_PRODUCT_SETTINGS,
  COMPANY_PRODUCT_SETTINGS_BY_COMPANY,
  COMPANY_PRODUCT_STRATEGY_CONSTRAINTS,
  COMPANY_PRODUCT_STRATEGY_UPDATE,
  PRODUCT_ATTRIBUTES,
  ATTRIBUTE_DETAIL,
  AVAILABLE_ATTRIBUTES_FOR_IMPORT,
  IMPORT_ATTRIBUTE_GROUP,
  BRANCH_PRODUCT_OVERRIDES,
  BRANCH_PRODUCT_OVERRIDE_DETAIL,
  UPDATE_STATUS
} from './endpoints';

export interface CompanyProductsResponse {
  items: CompanyProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: number;
  categoryId?: number;
  isMenu?: boolean;
  isIngredient?: boolean;
  isForSale?: boolean;
  getAll?: boolean;
}

export const companyProductService = {
  // --- Core CRUD ---

  async getAll(
    filters: CompanyProductFilters = {}
  ): Promise<CompanyProductsResponse> {
    const response = await apiClient.get<CompanyProductsResponse>(
      COMPANY_PRODUCTS,
      filters
    );
    return response.data;
  },

  async getById(id: number): Promise<CompanyProduct> {
    const url = COMPANY_PRODUCT_DETAIL.replace(':productId', String(id));
    const response = await apiClient.get<CompanyProduct>(url);
    return response.data;
  },

  async create(formData: FormData): Promise<CompanyProduct> {
    const response = await apiClient.post<CompanyProduct>(
      COMPANY_PRODUCTS,
      formData
    );
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<CompanyProduct> {
    const response = await apiClient.patch<CompanyProduct>(
      `${COMPANY_PRODUCTS}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${COMPANY_PRODUCTS}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${COMPANY_PRODUCTS}/delete`, { ids });
  },

  async bulkDeleteWithForce(ids: number[], force = false): Promise<any> {
    const response = await apiClient.post(`${COMPANY_PRODUCTS}/delete`, {
      ids,
      force
    });
    return response.data;
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number; skippedCount?: number }> {
    const response = await apiClient.post<{
      updatedCount: number;
      skippedCount?: number;
    }>(`${COMPANY_PRODUCTS}${UPDATE_STATUS}`, { ids, status });
    return response.data;
  },

  async getStockTrackedByBranch(branchId: number): Promise<CompanyProduct[]> {
    const url = COMPANY_PRODUCTS_STOCK_TRACKED_BY_BRANCH.replace(
      ':branchId',
      String(branchId)
    );
    const response = await apiClient.get<CompanyProduct[]>(url);
    return response.data;
  },

  // --- Settings ---

  async getSettings(companyId?: number): Promise<any> {
    const url = companyId
      ? `${COMPANY_PRODUCT_SETTINGS_BY_COMPANY}/${companyId}`
      : COMPANY_PRODUCT_SETTINGS;
    const response = await apiClient.get(url);
    return response.data;
  },

  async updateSettings(id: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.patch(
      `${COMPANY_PRODUCT_SETTINGS}/${id}`,
      data
    );
    return response.data;
  },

  async createSettings(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(COMPANY_PRODUCT_SETTINGS, data);
    return response.data;
  },

  async getStrategyConstraints(companyId: number): Promise<any> {
    const url = COMPANY_PRODUCT_STRATEGY_CONSTRAINTS.replace(
      ':companyId',
      String(companyId)
    );
    const response = await apiClient.get(url);
    return response.data;
  },

  async updateStrategy(
    companyId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = COMPANY_PRODUCT_STRATEGY_UPDATE.replace(
      ':companyId',
      String(companyId)
    );
    const response = await apiClient.patch(url, data);
    return response.data;
  },

  // --- Branch Overrides ---

  async getBranchOverrides(
    productId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const url = COMPANY_PRODUCT_BRANCH_OVERRIDES.replace(
      ':productId',
      String(productId)
    );
    const response = await apiClient.get(url, params);
    return response.data;
  },

  async createBranchOverride(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(BRANCH_PRODUCT_OVERRIDES, data);
    return response.data;
  },

  async updateBranchOverride(
    overrideId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = BRANCH_PRODUCT_OVERRIDE_DETAIL.replace(
      ':overrideId',
      String(overrideId)
    );
    const response = await apiClient.patch(url, data);
    return response.data;
  },

  async deleteBranchOverride(overrideId: number): Promise<void> {
    const url = BRANCH_PRODUCT_OVERRIDE_DETAIL.replace(
      ':overrideId',
      String(overrideId)
    );
    await apiClient.delete(url);
  },

  // --- Attributes ---

  async getAttributes(
    productId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const url = PRODUCT_ATTRIBUTES.replace(':productId', String(productId));
    const response = await apiClient.get(url, params);
    return response.data;
  },

  async createAttribute(
    productId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = PRODUCT_ATTRIBUTES.replace(':productId', String(productId));
    const response = await apiClient.post(url, data);
    return response.data;
  },

  async updateAttribute(
    attributeId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = ATTRIBUTE_DETAIL.replace(':attributeId', String(attributeId));
    const response = await apiClient.put(url, data);
    return response.data;
  },

  async deleteAttribute(attributeId: number): Promise<void> {
    const url = ATTRIBUTE_DETAIL.replace(':attributeId', String(attributeId));
    await apiClient.delete(url);
  },

  async getAvailableAttributesForImport(productId: number): Promise<any> {
    const response = await apiClient.get(AVAILABLE_ATTRIBUTES_FOR_IMPORT, {
      productId
    });
    return response.data;
  },

  async importAttributeGroup(
    productId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = IMPORT_ATTRIBUTE_GROUP.replace(':productId', String(productId));
    const response = await apiClient.post(url, data);
    return response.data;
  },

  async getAllFlat(
    filters: CompanyProductFilters = {}
  ): Promise<CompanyProduct[]> {
    const response = await apiClient.get<CompanyProduct[]>(
      COMPANY_PRODUCTS,
      filters
    );
    return response.data;
  },

  async getByBranch(
    branchId: number,
    params?: Record<string, any>
  ): Promise<CompanyProductsResponse> {
    const response = await apiClient.get<CompanyProductsResponse>(
      `${COMPANY_PRODUCTS}/branch/${branchId}`,
      params
    );
    return response.data;
  }
};
