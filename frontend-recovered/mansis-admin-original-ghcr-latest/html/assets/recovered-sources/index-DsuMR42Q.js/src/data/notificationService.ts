import { apiClient } from './apiService';
import {
  NOTIFICATION_CAMPAIGNS,
  NOTIFICATION_CAMPAIGN_DETAIL,
  NOTIFICATION_CAMPAIGN_RECIPIENTS,
  NOTIFICATION_CAMPAIGN_CANCEL,
  NOTIFICATION_SEGMENT_PREVIEW,
  NOTIFICATION_USER_SEARCH,
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_TEMPLATE_DETAIL,
  NOTIFICATION_INBOX,
  NOTIFICATION_INBOX_UNREAD_COUNT,
  NOTIFICATION_INBOX_READ_ALL,
  NOTIFICATION_INBOX_READ,
  NOTIFICATION_INBOX_ARCHIVE,
  NOTIFICATION_INBOX_DELETE,
  FCM_TOKEN,
  DELETE_FCM_TOKEN
} from './endpoints';
import { InboxNotification } from '@/types/Notification.interface';

export interface NotificationCampaignsResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export const notificationService = {
  // --- Inbox ---

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>(
      NOTIFICATION_INBOX_UNREAD_COUNT
    );
    return response.data;
  },

  async getRecentInbox(
    params: {
      page: number;
      limit: number;
      category?: string;
      isArchived?: boolean;
    } = {
      page: 0,
      limit: 5
    }
  ): Promise<{ data: InboxNotification[] }> {
    const response = await apiClient.get<{ data: InboxNotification[] }>(
      NOTIFICATION_INBOX,
      params
    );
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(NOTIFICATION_INBOX_READ_ALL);
  },

  async markAsRead(id: number | string): Promise<void> {
    const url = NOTIFICATION_INBOX_READ.replace(':id', String(id));
    await apiClient.patch(url);
  },

  async archiveInboxItem(id: number | string): Promise<void> {
    const url = NOTIFICATION_INBOX_ARCHIVE.replace(':id', String(id));
    await apiClient.patch(url);
  },

  async deleteInboxItem(id: number | string): Promise<void> {
    const url = NOTIFICATION_INBOX_DELETE.replace(':id', String(id));
    await apiClient.delete(url);
  },

  // --- Campaigns ---

  async getCampaigns(
    params: Record<string, any> = {}
  ): Promise<NotificationCampaignsResponse> {
    const response = await apiClient.get<NotificationCampaignsResponse>(
      NOTIFICATION_CAMPAIGNS,
      params
    );
    return response.data;
  },

  async getCampaignDetail(id: number | string): Promise<any> {
    const url = NOTIFICATION_CAMPAIGN_DETAIL.replace(':id', String(id));
    const response = await apiClient.get(url);
    return response.data;
  },

  async getCampaignRecipients(
    id: number | string,
    params: { page: number; limit: number }
  ): Promise<any> {
    const url = NOTIFICATION_CAMPAIGN_RECIPIENTS.replace(':id', String(id));
    const response = await apiClient.get(url, params);
    return response.data;
  },

  async createCampaign(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(NOTIFICATION_CAMPAIGNS, data);
    return response.data;
  },

  async cancelCampaign(id: number | string): Promise<any> {
    const url = NOTIFICATION_CAMPAIGN_CANCEL.replace(':id', String(id));
    const response = await apiClient.post(url, {});
    return response.data;
  },

  // --- Templates ---

  async getTemplates(): Promise<any[]> {
    const response = await apiClient.get<any[]>(NOTIFICATION_TEMPLATES);
    return response.data;
  },

  async createTemplate(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(NOTIFICATION_TEMPLATES, data);
    return response.data;
  },

  async updateTemplate(
    id: number | string,
    data: Record<string, any>
  ): Promise<any> {
    const url = NOTIFICATION_TEMPLATE_DETAIL.replace(':id', String(id));
    const response = await apiClient.patch(url, data);
    return response.data;
  },

  async deleteTemplate(id: number | string): Promise<void> {
    const url = NOTIFICATION_TEMPLATE_DETAIL.replace(':id', String(id));
    await apiClient.delete(url);
  },

  // --- Segment & Search ---

  async previewSegment(segmentFilter: Record<string, any>): Promise<any> {
    const response = await apiClient.post(NOTIFICATION_SEGMENT_PREVIEW, {
      segmentFilter
    });
    return response.data;
  },

  async searchUsers(query: string, limit: number = 20): Promise<any[]> {
    const response = await apiClient.get<any[]>(NOTIFICATION_USER_SEARCH, {
      q: query,
      limit
    });
    return response.data;
  },

  async registerFcmToken(
    token: string,
    platform: string = 'WEB'
  ): Promise<void> {
    await apiClient.post(FCM_TOKEN, { token, platform });
  },

  async deleteFcmToken(token: string): Promise<void> {
    await apiClient.post(DELETE_FCM_TOKEN, { token });
  }
};
