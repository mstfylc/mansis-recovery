import { apiClient } from './apiService';
import { USER_BRANCHES } from './endpoints';

export const userBranchService = {
  async getUserBranches(userId: number): Promise<any> {
    const response = await apiClient.get(`${USER_BRANCHES}/${userId}`);
    return response.data;
  },

  async addBranch(userId: number, branchId: number): Promise<any> {
    const response = await apiClient.post(USER_BRANCHES, {
      userId,
      branchId
    });
    return response.data;
  },

  async removeBranch(userId: number, branchId: number): Promise<void> {
    await apiClient.delete(`${USER_BRANCHES}/${userId}/${branchId}`);
  },

  async setPrimaryBranch(userId: number, branchId: number): Promise<any> {
    const response = await apiClient.patch(
      `${USER_BRANCHES}/${userId}/primary`,
      { branchId }
    );
    return response.data;
  }
};
