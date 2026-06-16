export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PARTIALLY_SENT = 'PARTIALLY_SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum NotificationCategory {
  SYSTEM = 'SYSTEM',
  PROMOTION = 'PROMOTION',
  ORDER = 'ORDER',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  CUSTOM = 'CUSTOM'
}

export enum AudienceType {
  ALL = 'ALL',
  SEGMENT = 'SEGMENT',
  INDIVIDUAL = 'INDIVIDUAL'
}

export interface OrderBasedFilter {
  hasOrderFromBranch?: boolean;
  hasWalletBalance?: boolean;
}

export interface SegmentFilter {
  roles?: string[];
  companyIds?: number[];
  branchIds?: number[];
  orderBased?: OrderBasedFilter;
  includeUserIds?: number[];
  excludeUserIds?: number[];
}

export interface NotificationCampaign {
  id: number;
  title: string;
  body: string;
  imageUrl?: string | null;
  deepLink?: string | null;
  category: NotificationCategory;
  senderType: 'SYSTEM' | 'USER';
  segmentFilter?: SegmentFilter | null;
  status: CampaignStatus;
  scheduledAt?: string | Date | null;
  sentAt?: string | Date | null;
  expiresAt?: string | Date | null;
  totalRecipients: number;
  delivered: number;
  read: number;
  failed: number;
  templateId?: number | null;
  template?: NotificationTemplate | null;
  companyId?: number | null;
  branchId?: number | null;
  senderId: number;
  sender?: { id: number; name: string; surname: string };
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface NotificationRecipient {
  id: number;
  campaignId?: number | null;
  campaign?: {
    id: number;
    title: string;
    body: string;
    imageUrl?: string | null;
    deepLink?: string | null;
    category: NotificationCategory;
    senderType: 'SYSTEM' | 'USER';
    createdAt: string | Date;
  } | null;
  userId: number;
  title?: string | null;
  body?: string | null;
  category?: NotificationCategory | null;
  deepLink?: string | null;
  isRead: boolean;
  readAt?: string | Date | null;
  isDelivered: boolean;
  deliveredAt?: string | Date | null;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string | Date;
}

/**
 * Inbox API response type (mapped/flat format)
 * Used by HeaderNotifications, NotificationList, NotificationItem
 */
export interface InboxNotification {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  deepLink: string | null;
  category: NotificationCategory;
  senderType: 'SYSTEM' | 'USER';
  isRead: boolean;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  deepLink?: string | null;
  category: NotificationCategory;
  segmentPreset?: SegmentFilter | null;
  minRole: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface UserNotificationPreference {
  id: number;
  userId: number;
  systemEnabled: boolean;
  promotionEnabled: boolean;
  orderEnabled: boolean;
  announcementEnabled: boolean;
  customEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SegmentPreview {
  count: number;
  sample: Array<{
    id: number;
    name: string;
    surname: string;
    email: string;
    phone?: string;
  }>;
}
