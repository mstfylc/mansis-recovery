import { apiClient } from './apiService';
import { User } from '@/types/User.interface';
import { USERS, UPDATE_STATUS } from './endpoints';

export interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  companyId?: number;
  branchId?: number;
  getAll?: boolean;
}

export const userService = {
  async getAll(filters: UserFilters = {}): Promise<UsersResponse> {
    const response = await apiClient.get<UsersResponse>(USERS, filters);
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`${USERS}/${id}`);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(`${USERS}/profile`);
    return response.data;
  },

  async create(data: Partial<User>): Promise<User> {
    const response = await apiClient.post<User>(USERS, data);
    return response.data;
  },

  async update(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>(`${USERS}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${USERS}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${USERS}/delete`, { userIds: ids });
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${USERS}${UPDATE_STATUS}`,
      { userIds: ids, status }
    );
    return response.data;
  },

  async getWallet(userId: number): Promise<any> {
    const response = await apiClient.get(`${USERS}/${userId}/wallet`);
    return response.data;
  },

  async getTopUps(userId: number, params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(`${USERS}/${userId}/top-ups`, params);
    return response.data;
  },

  async getOrders(userId: number, params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(`${USERS}/${userId}/orders`, params);
    return response.data;
  },

  async getTickets(userId: number, params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(`${USERS}/${userId}/tickets`, params);
    return response.data;
  },

  async getCampaigns(
    userId: number,
    params?: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.get(
      `${USERS}/${userId}/campaigns`,
      params
    );
    return response.data;
  },

  async getActions(userId: number, params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(`${USERS}/${userId}/actions`, params);
    return response.data;
  },

  async searchUsers(params: Record<string, any>): Promise<UsersResponse> {
    const response = await apiClient.get<UsersResponse>(USERS, params);
    return response.data;
  }
};
