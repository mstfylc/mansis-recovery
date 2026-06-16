import { apiClient } from './apiService';
import { Membership } from '@/types/Membership.interface';
import { MEMBERSHIPS, EXTEND_MEMBERSHIP } from './endpoints';

export interface MembershipsResponse {
  items: Membership[];
  total: number;
  page: number;
  limit: number;
}

export interface MembershipFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branchId?: number;
  companyId?: number;
}

export const membershipService = {
  async getAll(filters: MembershipFilters = {}): Promise<MembershipsResponse> {
    const response = await apiClient.get<MembershipsResponse>(
      MEMBERSHIPS,
      filters
    );
    return response.data;
  },

  async create(data: Record<string, any>): Promise<Membership> {
    const response = await apiClient.post<Membership>(MEMBERSHIPS, data);
    return response.data;
  },

  async update(id: number, data: Record<string, any>): Promise<Membership> {
    const response = await apiClient.patch<Membership>(
      `${MEMBERSHIPS}/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${MEMBERSHIPS}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${MEMBERSHIPS}/delete`, { membershipIds: ids });
  },

  async extend(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(EXTEND_MEMBERSHIP, data);
    return response.data;
  }
};
