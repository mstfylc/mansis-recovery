export enum FeatureKey {
  // Basic tier
  POS = 'pos',
  PRODUCTS = 'products',
  USERS = 'users',
  CAMPAIGNS = 'campaigns',
  ORDERS = 'orders',
  DESKTOP_APP = 'desktop_app',
  ACTIVITIES = 'activities',
  TICKETS = 'tickets',
  MEMBERSHIPS = 'memberships',
  MOBILE_LOYALTY = 'mobile_loyalty',
  DAILY_LOGINS = 'daily_logins',

  // Standard tier additions
  STOCK = 'stock',
  BATCHES = 'batches',
  RECIPE = 'recipe',
  WAREHOUSE = 'warehouse',
  INGREDIENTS = 'ingredients',
  TABLE_MANAGEMENT = 'table_management',

  // Pro tier
  FINANCE = 'finance',
  REPORTS = 'reports',
  ANALYTICS = 'analytics',
  INTEGRATIONS = 'integrations',
  NOTIFICATIONS = 'notifications'
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export interface PlanFeature {
  id: number;
  planId: number;
  featureKey: FeatureKey;
  enabled: boolean;
  limit?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface Plan {
  id: number;
  displayName: string;
  isCustom: boolean;
  price: number;
  billingCycle: BillingCycle;
  trialDays: number;
  smsQuota: number;
  notes?: string | null;
  features?: PlanFeature[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BranchSubscription {
  id: number;
  branchId: number;
  planId: number;
  status: SubscriptionStatus;
  startDate: string | Date;
  endDate?: string | Date | null;
  trialEndsAt?: string | Date | null;
  priceOverride?: number | null;
  plan?: Plan;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface BranchSmsQuota {
  id: number;
  branchId: number;
  extraPurchased: number;
  usedThisMonth: number;
  lastResetDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface SmsUsageLog {
  id: number;
  branchId: number;
  phone: string;
  recipient: string;
  message: string;
  messageType: string;
  success: boolean;
  response?: any;
  errorMessage?: string | null;
  sentAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface BranchFeaturesResponse {
  features: FeatureKey[];
}

export interface FeatureCheckResponse {
  hasFeature: boolean;
}

export interface SmsQuotaStatus {
  planLimit: number;
  extraPurchased: number;
  totalQuota: number;
  usedThisMonth: number;
  remaining: number;
  lastResetDate: string | null;
}

// Extended subscription interface with branch and company info (for admin panel)
export interface BranchSubscriptionDetailed extends BranchSubscription {
  branch: {
    id: number;
    name: string;
    company: {
      id: number;
      name: string;
    };
  };
  plan: Plan;
}

export interface SubscriptionListResponse {
  items: BranchSubscriptionDetailed[];
  total: number;
  page: number;
  limit: number;
}

export interface AssignPlanData {
  branchId: number;
  planId: number;
  startTrial?: boolean;
  startDate?: string;
  priceOverride?: number;
}

export interface ChangePlanData {
  branchId: number;
  newPlanId: number;
  notes?: string;
}

export interface UpdateSubscriptionData {
  branchId: number;
  newPlanId?: number;
  status?: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  trialEndsAt?: string;
  priceOverride?: number;
  notes?: string;
}

export interface CancelSubscriptionData {
  branchId: number;
  reason?: string;
}

export interface SmsPackage {
  id: number;
  name: string;
  amount: number;
  price: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmsPackageData {
  name: string;
  amount: number;
  price: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateSmsPackageData = Partial<CreateSmsPackageData>;

export interface SmsPurchase {
  id: number;
  branchId: number;
  packageId: number;
  purchasedById: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  package?: SmsPackage;
  purchasedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  branch?: {
    id: number;
    name: string;
  };
}
