import { apiClient } from './apiService';
import { Order } from '@/types/Order.interface';
import { ORDERS, ORDER_DETAILS, DAILY_LOGINS } from './endpoints';

export interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branchId?: number;
  companyId?: number;
  startDate?: string;
  endDate?: string;
  purchaseType?: string;
}

export const orderService = {
  async getAll(filters: OrderFilters = {}): Promise<OrdersResponse> {
    const response = await apiClient.get<OrdersResponse>(ORDERS, filters);
    return response.data;
  },

  async getById(id: number): Promise<Order> {
    const response = await apiClient.get<Order>(`${ORDER_DETAILS}/${id}`);
    return response.data;
  },

  async updateStatus(orderId: number, status: string): Promise<any> {
    const response = await apiClient.patch(`${ORDER_DETAILS}/${orderId}`, {
      status
    });
    return response.data;
  },

  async updateOrderStatus(data: {
    orderId: number;
    status: string;
    branchId?: number;
  }): Promise<any> {
    const response = await apiClient.put(`${ORDER_DETAILS}/status`, data);
    return response.data;
  },

  async getDailyLogins(params: Record<string, any>): Promise<any> {
    const response = await apiClient.get(DAILY_LOGINS, params);
    return response.data;
  },

  async checkInDailyLogin(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(`${DAILY_LOGINS}/check-in`, data);
    return response.data;
  },

  async deleteDailyLogin(id: number): Promise<void> {
    await apiClient.delete(`${DAILY_LOGINS}/${id}`);
  }
};
