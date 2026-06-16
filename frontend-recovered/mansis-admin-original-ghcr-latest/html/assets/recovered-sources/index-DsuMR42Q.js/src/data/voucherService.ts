import { apiClient } from './apiService';
import {
  VOUCHER_TEMPLATES,
  VOUCHER_TEMPLATES_LIST,
  VOUCHER_TEMPLATES_BULK_DELETE,
  UPDATE_STATUS
} from './endpoints';

export interface VoucherTemplatesResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export const voucherService = {
  async getAll(
    params: Record<string, any> = {}
  ): Promise<VoucherTemplatesResponse> {
    const response = await apiClient.get<VoucherTemplatesResponse>(
      VOUCHER_TEMPLATES_LIST,
      params
    );
    return response.data;
  },

  async create(branchId: number, data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      `${VOUCHER_TEMPLATES}/${branchId}`,
      data
    );
    return response.data;
  },

  async update(
    branchId: number,
    templateId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.patch(
      `${VOUCHER_TEMPLATES}/${branchId}/${templateId}`,
      data
    );
    return response.data;
  },

  async delete(branchId: number, templateId: number): Promise<void> {
    await apiClient.delete(`${VOUCHER_TEMPLATES}/${branchId}/${templateId}`);
  },

  async bulkDelete(templateIds: number[]): Promise<void> {
    await apiClient.post(VOUCHER_TEMPLATES_BULK_DELETE, { templateIds });
  },

  async bulkUpdateStatus(
    templateIds: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${VOUCHER_TEMPLATES_LIST}${UPDATE_STATUS}`,
      { templateIds, isActive: status === 'active' }
    );
    return response.data;
  }
};
