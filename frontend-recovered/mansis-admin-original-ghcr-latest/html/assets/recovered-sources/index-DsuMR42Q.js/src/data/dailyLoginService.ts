import { apiClient } from './apiService';
import { DAILY_LOGIN_TYPES, DAILY_LOGINS } from './endpoints';

export const dailyLoginService = {
  // --- Daily Login Types (branch-scoped) ---

  async getTypes(
    branchId: number,
    includeInactive: boolean = true
  ): Promise<any[]> {
    const url = DAILY_LOGIN_TYPES.replace(':branchId', String(branchId));
    const response = await apiClient.get<any[]>(
      `${url}?includeInactive=${includeInactive}`
    );
    return response.data;
  },

  async createType(branchId: number, data: Record<string, any>): Promise<any> {
    const url = DAILY_LOGIN_TYPES.replace(':branchId', String(branchId));
    const response = await apiClient.post(url, data);
    return response.data;
  },

  async updateType(
    branchId: number,
    typeId: number,
    data: Record<string, any>
  ): Promise<any> {
    const url = DAILY_LOGIN_TYPES.replace(':branchId', String(branchId));
    const response = await apiClient.patch(`${url}/${typeId}`, data);
    return response.data;
  },

  async deleteType(branchId: number, typeId: number): Promise<void> {
    const url = DAILY_LOGIN_TYPES.replace(':branchId', String(branchId));
    await apiClient.delete(`${url}/${typeId}`);
  },

  // --- Daily Logins (records) ---

  async deleteDailyLogin(dailyLoginId: number): Promise<void> {
    await apiClient.delete(`${DAILY_LOGINS}/${dailyLoginId}`);
  },

  async bulkDeleteDailyLogins(
    dailyLoginIds: number[]
  ): Promise<{ deletedCount: number; skippedCount: number }> {
    const response = await apiClient.post<{
      deletedCount: number;
      skippedCount: number;
    }>(`${DAILY_LOGINS}/delete`, { dailyLoginIds });
    return response.data;
  }
};
