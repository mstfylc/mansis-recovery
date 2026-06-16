import { apiClient } from './apiService';
import { Campaign } from '@/types/Campaign.interface';
import { CAMPAIGNS, BUNDLE_CAMPAIGNS, UPDATE_STATUS } from './endpoints';

export interface CampaignsResponse {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branchId?: number;
  type?: string;
  getAll?: boolean;
}

export const campaignService = {
  async getAll(filters: CampaignFilters = {}): Promise<CampaignsResponse> {
    const response = await apiClient.get<CampaignsResponse>(CAMPAIGNS, filters);
    return response.data;
  },

  async getById(id: number): Promise<Campaign> {
    const response = await apiClient.get<Campaign>(`${CAMPAIGNS}/${id}`);
    return response.data;
  },

  async create(formData: FormData): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(CAMPAIGNS, formData);
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<Campaign> {
    const response = await apiClient.patch<Campaign>(
      `${CAMPAIGNS}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${CAMPAIGNS}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${CAMPAIGNS}/delete`, { campaignIds: ids });
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${CAMPAIGNS}${UPDATE_STATUS}`,
      { campaignIds: ids, status }
    );
    return response.data;
  },

  async getDetails(id: number): Promise<any> {
    const response = await apiClient.get(`${CAMPAIGNS}/${id}/details`);
    return response.data;
  },

  async addItems(campaignId: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      `${CAMPAIGNS}/${campaignId}/items`,
      data
    );
    return response.data;
  },

  async addItemsToEndpoint(
    endpoint: string,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },

  async getFromEndpoint(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(endpoint, params);
    return response.data;
  },

  async removeItems(
    campaignId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.delete(
      `${CAMPAIGNS}/${campaignId}/items`,
      { data }
    );
    return response.data;
  },

  async getUsages(params: Record<string, any>): Promise<any> {
    const response = await apiClient.get(`${CAMPAIGNS}/usages`, params);
    return response.data;
  },

  async getCampaignUsages(
    campaignId: number,
    params: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${CAMPAIGNS}/${campaignId}/usages`,
      params
    );
    return response.data;
  },

  async refundCampaignPackage(usageId: number): Promise<void> {
    await apiClient.post(`${CAMPAIGNS}/campaign-packages/${usageId}/refund`);
  },

  async batchCustomerDataEntry(payload: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      `${CAMPAIGNS}/batch-customer-data`,
      payload
    );
    return response.data;
  },

  async revokeUsage(usageId: number): Promise<void> {
    await apiClient.delete(`${CAMPAIGNS}/usages/${usageId}`);
  },

  async batchCustomerData(payload: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      `${CAMPAIGNS}/customer-data`,
      payload
    );
    return response.data;
  },

  async getBundles(params: Record<string, any>): Promise<any> {
    const response = await apiClient.get(BUNDLE_CAMPAIGNS, params);
    return response.data;
  },

  async searchCampaigns(
    params: Record<string, any>
  ): Promise<CampaignsResponse> {
    const response = await apiClient.get<CampaignsResponse>(CAMPAIGNS, params);
    return response.data;
  }
};
