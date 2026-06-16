import { apiClient } from './apiService';
import { MembershipPlan } from '@/types/MembershipPlan.interface';
import { MEMBERSHIP_PLANS } from './endpoints';

export interface MembershipPlansResponse {
  items: MembershipPlan[];
  total: number;
  page: number;
  limit: number;
}

export interface MembershipPlanFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: number;
  branchId?: number;
  getAll?: boolean;
}

export const membershipPlanService = {
  async getAll(
    filters: MembershipPlanFilters = {}
  ): Promise<MembershipPlansResponse> {
    const response = await apiClient.get<MembershipPlansResponse>(
      MEMBERSHIP_PLANS,
      filters
    );
    return response.data;
  },

  async getById(id: number): Promise<MembershipPlan> {
    const response = await apiClient.get<MembershipPlan>(
      `${MEMBERSHIP_PLANS}/${id}`
    );
    return response.data;
  },

  async create(formData: FormData): Promise<MembershipPlan> {
    const response = await apiClient.post<MembershipPlan>(
      MEMBERSHIP_PLANS,
      formData
    );
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<MembershipPlan> {
    const response = await apiClient.patch<MembershipPlan>(
      `${MEMBERSHIP_PLANS}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${MEMBERSHIP_PLANS}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${MEMBERSHIP_PLANS}/delete`, { ids });
  }
};
