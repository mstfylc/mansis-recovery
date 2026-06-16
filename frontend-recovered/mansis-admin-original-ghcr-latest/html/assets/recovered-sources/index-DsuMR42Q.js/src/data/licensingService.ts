import { apiClient } from './apiService';
import { Plan } from '@/types/Licensing.interface';
import {
  LICENSING_FEATURES,
  LICENSING_SUBSCRIPTION,
  LICENSING_SUBSCRIPTIONS,
  LICENSING_PLANS,
  LICENSING_ASSIGN_PLAN,
  LICENSING_UPDATE_SUBSCRIPTION,
  LICENSING_CANCEL_SUBSCRIPTION,
  LICENSING_SMS_QUOTA,
  LICENSING_CHECK_FEATURE,
  LICENSING_CHANGE_PLAN,
  LICENSING_STATS
} from './endpoints';

export interface SubscriptionListResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export const licensingService = {
  async getSubscription(params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(LICENSING_SUBSCRIPTION, params);
    return response.data;
  },

  async getSubscriptions(
    params: Record<string, any>
  ): Promise<SubscriptionListResponse> {
    const response = await apiClient.get<SubscriptionListResponse>(
      LICENSING_SUBSCRIPTIONS,
      params
    );
    return response.data;
  },

  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<Plan[]>(LICENSING_PLANS);
    return response.data;
  },

  async createPlan(data: Record<string, any>): Promise<Plan> {
    const response = await apiClient.post<Plan>(LICENSING_PLANS, data);
    return response.data;
  },

  async updatePlan(id: number, data: Record<string, any>): Promise<Plan> {
    const response = await apiClient.patch<Plan>(
      `${LICENSING_PLANS}/${id}`,
      data
    );
    return response.data;
  },

  async deletePlan(id: number): Promise<void> {
    await apiClient.delete(`${LICENSING_PLANS}/${id}`);
  },

  async assignPlan(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(LICENSING_ASSIGN_PLAN, data);
    return response.data;
  },

  async updateSubscription(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(LICENSING_UPDATE_SUBSCRIPTION, data);
    return response.data;
  },

  async cancelSubscription(data: { branchId: number }): Promise<any> {
    const response = await apiClient.post(LICENSING_CANCEL_SUBSCRIPTION, data);
    return response.data;
  },

  async changePlan(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(LICENSING_CHANGE_PLAN, data);
    return response.data;
  },

  async getSmsQuota(params?: Record<string, any>): Promise<any> {
    const response = await apiClient.get(LICENSING_SMS_QUOTA, params);
    return response.data;
  },

  async getFeatures(branchId?: number): Promise<any> {
    const params = branchId ? { branchId } : {};
    const response = await apiClient.get(LICENSING_FEATURES, params);
    return response.data;
  },

  async checkFeature(featureKey: string): Promise<any> {
    const response = await apiClient.get(LICENSING_CHECK_FEATURE, {
      featureKey
    });
    return response.data;
  },

  async getStats(): Promise<any> {
    const response = await apiClient.get(LICENSING_STATS);
    return response.data;
  }
};
