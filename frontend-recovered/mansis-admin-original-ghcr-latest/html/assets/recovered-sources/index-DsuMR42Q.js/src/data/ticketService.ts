import { apiClient } from './apiService';
import { TICKETS } from './endpoints';

export const ticketService = {
  async getAll(params: Record<string, any> = {}): Promise<any> {
    const response = await apiClient.get(TICKETS, params);
    return response.data;
  },

  async refund(ticketId: number): Promise<any> {
    const response = await apiClient.patch(`${TICKETS}/${ticketId}/status`, {
      status: 'REFUNDED'
    });
    return response.data;
  },

  async bulkRefund(ticketIds: number[]): Promise<any> {
    const response = await apiClient.post(`${TICKETS}/bulk-refund`, {
      ticketIds
    });
    return response.data;
  }
};
