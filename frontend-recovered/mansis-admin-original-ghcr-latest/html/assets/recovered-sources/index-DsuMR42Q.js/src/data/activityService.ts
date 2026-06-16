import { apiClient } from './apiService';
import { Activity } from '@/types/Activity.interface';
import { ChildActivity } from '@/types/ChildActivity.interface';
import { ACTIVITIES, CHILD_ACTIVITIES, UPDATE_STATUS } from './endpoints';

export interface ActivitiesResponse {
  items: Activity[];
  total: number;
  page: number;
  limit: number;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branchId?: number;
  getAll?: boolean;
}

export const activityService = {
  async getAll(filters: ActivityFilters = {}): Promise<ActivitiesResponse> {
    const response = await apiClient.get<ActivitiesResponse>(
      ACTIVITIES,
      filters
    );
    return response.data;
  },

  async getById(id: number): Promise<Activity> {
    const response = await apiClient.get<Activity>(`${ACTIVITIES}/${id}`);
    return response.data;
  },

  async create(formData: FormData): Promise<Activity> {
    const response = await apiClient.post<Activity>(ACTIVITIES, formData);
    return response.data;
  },

  async update(id: number, formData: FormData): Promise<Activity> {
    const response = await apiClient.patch<Activity>(
      `${ACTIVITIES}/${id}`,
      formData
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${ACTIVITIES}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${ACTIVITIES}/delete`, { activityIds: ids });
  },

  async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `${ACTIVITIES}${UPDATE_STATUS}`,
      { activityIds: ids, status }
    );
    return response.data;
  },

  async getChildActivities(
    params: Record<string, any>
  ): Promise<ChildActivity[]> {
    const response = await apiClient.get<ChildActivity[]>(
      CHILD_ACTIVITIES,
      params
    );
    return response.data;
  },

  async addSchedule(
    activityId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.post(
      `${ACTIVITIES}/${activityId}/schedules`,
      data
    );
    return response.data;
  },

  async updateSchedule(
    activityId: number,
    scheduleId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.patch(
      `${ACTIVITIES}/${activityId}/schedules/${scheduleId}`,
      data
    );
    return response.data;
  },

  async deleteSchedule(activityId: number, scheduleId: number): Promise<void> {
    await apiClient.delete(
      `${ACTIVITIES}/${activityId}/schedules/${scheduleId}`
    );
  },

  async createChildActivity(
    activityId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.post(
      `${ACTIVITIES}/${activityId}${CHILD_ACTIVITIES}`,
      data
    );
    return response.data;
  },

  async updateChildActivity(
    activityId: number,
    childId: number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.patch(
      `${ACTIVITIES}/${activityId}${CHILD_ACTIVITIES}/${childId}`,
      data
    );
    return response.data;
  },

  async deleteChildActivity(
    activityId: number,
    childId: number
  ): Promise<void> {
    await apiClient.delete(
      `${ACTIVITIES}/${activityId}${CHILD_ACTIVITIES}/${childId}`
    );
  }
};
