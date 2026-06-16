import { apiClient } from './apiService';
import { Branch } from '@/types/Branch.interface';
import {
  BRANCHES,
  USERS,
  USER_BRANCHES,
  UPDATE_STATUS,
  LOGIN_CAMPAIGN,
  PRODUCTS
} from './endpoints';

export interface BranchesResponse {
  items: Branch[];
  total: number;
  page: number;
  limit: number;
}

export interface BranchFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: number;
  getAll?: boolean;
}

export const branchService = {
  async getAll(filters: BranchFilters = {}): Promise<BranchesResponse> {
    const response = await apiClient.get<BranchesResponse>(BRANCHES, filters);
    return response.data;
  },

  async getAllFlat(filters: BranchFilters = {}): Promise<Branch[]> {
    const response = await apiClient.get<BranchesResponse>(BRANCHES, filters);
    return response.data.items ?? (response.data as unknown as Branch[]);
  },

  async getById(id: number): Promise<Branch> {
    const response = await apiClient.get<Branch>(`${BRANCHES}/${id}`);
    return response.data;
  },

  async create(formData: FormData): Promise<Branch> {
    const response = await apiClient.post<Branch>(BRANCHES, formData);
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<Branch> {
    const response = await apiClient.patch<Branch>(
      `${BRANCHES}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BRANCHES}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${BRANCHES}/delete`, { branchIds: ids });
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${BRANCHES}${UPDATE_STATUS}`,
      { branchIds: ids, status }
    );
    return response.data;
  },

  async getUserBranches(): Promise<Branch[]> {
    const response = await apiClient.get<Branch[]>(`${USERS}${USER_BRANCHES}`);
    return response.data;
  },

  async getMyBranches(): Promise<any> {
    const response = await apiClient.get(`${USERS}${BRANCHES}`);
    return response.data;
  },

  async getLoginCampaignProducts(
    branchId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${BRANCHES}/${branchId}${LOGIN_CAMPAIGN}${PRODUCTS}`,
      params
    );
    return response.data;
  },

  async addLoginCampaignProducts(
    branchId: number,
    productIds: number[]
  ): Promise<any> {
    const response = await apiClient.post(
      `${BRANCHES}/${branchId}${LOGIN_CAMPAIGN}${PRODUCTS}`,
      { productIds }
    );
    return response.data;
  },

  async removeLoginCampaignProduct(
    branchId: number,
    productId: number
  ): Promise<void> {
    await apiClient.delete(
      `${BRANCHES}/${branchId}${LOGIN_CAMPAIGN}${PRODUCTS}/${productId}`
    );
  },

  async bulkRemoveLoginCampaignProducts(
    branchId: number,
    productIds: number[]
  ): Promise<any> {
    const response = await apiClient.post(
      `${BRANCHES}/${branchId}${LOGIN_CAMPAIGN}${PRODUCTS}/delete`,
      { productIds }
    );
    return response.data;
  },

  async getBranchProductsList(
    branchId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${BRANCHES}/${branchId}/products`,
      params
    );
    return response.data;
  }
};
