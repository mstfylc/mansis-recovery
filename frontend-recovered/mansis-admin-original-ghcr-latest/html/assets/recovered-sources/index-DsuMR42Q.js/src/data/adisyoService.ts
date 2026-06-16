import { apiClient } from './apiService';
import {
  ADISYO_BRANCH_STATUS,
  ADISYO_CONFIG,
  ADISYO_SETUP,
  ADISYO_BRANCH_DELETE,
  ADISYO_SYNC_PRODUCTS,
  ADISYO_MAPPINGS
} from './endpoints';

export const adisyoService = {
  async getConfig(branchId: number): Promise<any> {
    const url = ADISYO_CONFIG.replace(':branchId', String(branchId));
    const response = await apiClient.get(url);
    return response.data;
  },

  async setup(
    branchId: number,
    data: { apiKey: string; apiSecret: string; apiConsumer: string }
  ): Promise<any> {
    const url = ADISYO_SETUP.replace(':branchId', String(branchId));
    const response = await apiClient.post(url, data);
    return response.data;
  },

  async getBranchStatus(branchId: number): Promise<any> {
    const url = ADISYO_BRANCH_STATUS.replace(':branchId', String(branchId));
    const response = await apiClient.get(url);
    return response.data;
  },

  async deleteIntegration(branchId: number): Promise<void> {
    const url = ADISYO_BRANCH_DELETE.replace(':branchId', String(branchId));
    await apiClient.delete(url);
  },

  async toggleAutoSync(branchId: number, enabled: boolean): Promise<any> {
    const response = await apiClient.post(
      `/adisyo/branches/${branchId}/toggle-auto-sync`,
      { enabled }
    );
    return response.data;
  },

  async syncProducts(branchId: number): Promise<any> {
    const url = ADISYO_SYNC_PRODUCTS.replace(':branchId', String(branchId));
    const response = await apiClient.post(url, {});
    return response.data;
  },

  async getMappings(branchId: number): Promise<any> {
    const url = ADISYO_MAPPINGS.replace(':branchId', String(branchId));
    const response = await apiClient.get(url);
    return response.data;
  }
};
