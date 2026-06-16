import { apiClient } from './apiService';
import {
  STAMP_CARDS,
  STAMP_CARD_BRANCHES,
  STAMP_CARD_PRODUCTS,
  STAMP_CARD_STATS,
  BRANCH_PRODUCTS
} from './endpoints';

export const stampCardService = {
  // --- Stamp Card CRUD ---

  async getByCompany(companyId: number): Promise<any> {
    const response = await apiClient.get(`${STAMP_CARDS}/${companyId}`);
    return response.data;
  },

  async create(companyId: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(`${STAMP_CARDS}/${companyId}`, data);
    return response.data;
  },

  async update(
    companyId: number,
    stampCardId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.patch(
      `${STAMP_CARDS}/${companyId}/${stampCardId}`,
      data
    );
    return response.data;
  },

  async delete(companyId: number, stampCardId: number): Promise<void> {
    await apiClient.delete(`${STAMP_CARDS}/${companyId}/${stampCardId}`);
  },

  // --- Branches ---

  async getEnrolledBranches(
    companyId: number,
    stampCardId: number
  ): Promise<any> {
    const response = await apiClient.get(
      `${STAMP_CARD_BRANCHES}/${companyId}/${stampCardId}/branches`
    );
    return response.data;
  },

  async enrollBranches(
    companyId: number,
    stampCardId: number,
    branchIds: number[]
  ): Promise<any> {
    const response = await apiClient.post(
      `${STAMP_CARD_BRANCHES}/${companyId}/${stampCardId}/branches`,
      { branchIds }
    );
    return response.data;
  },

  async unenrollBranch(
    companyId: number,
    stampCardId: number,
    branchId: number
  ): Promise<void> {
    await apiClient.delete(
      `${STAMP_CARD_BRANCHES}/${companyId}/${stampCardId}/branches`,
      { data: { branchIds: [branchId] } }
    );
  },

  // --- Products ---

  async getEnrolledProducts(
    companyId: number,
    stampCardId: number,
    branchId: number
  ): Promise<any> {
    const response = await apiClient.get(
      `${STAMP_CARD_PRODUCTS}/${companyId}/${stampCardId}/products/branch/${branchId}`
    );
    return response.data;
  },

  async addProducts(
    companyId: number,
    stampCardId: number,
    branchId: number,
    productIds: number[]
  ): Promise<any> {
    const response = await apiClient.post(
      `${STAMP_CARD_PRODUCTS}/${companyId}/${stampCardId}/products/branch/${branchId}`,
      { productIds }
    );
    return response.data;
  },

  async removeProducts(
    companyId: number,
    stampCardId: number,
    branchId: number,
    productIds: number[]
  ): Promise<void> {
    await apiClient.delete(
      `${STAMP_CARD_PRODUCTS}/${companyId}/${stampCardId}/products/branch/${branchId}`,
      { data: { productIds } }
    );
  },

  // --- Stats ---

  async getStats(companyId: number, stampCardId: number): Promise<any> {
    const response = await apiClient.get(
      `${STAMP_CARD_STATS}/${companyId}/${stampCardId}/stats`
    );
    return response.data;
  },

  // --- Branch Products (for product picker) ---

  async getBranchProducts(
    branchId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${BRANCH_PRODUCTS}/${branchId}`,
      params
    );
    return response.data;
  }
};
