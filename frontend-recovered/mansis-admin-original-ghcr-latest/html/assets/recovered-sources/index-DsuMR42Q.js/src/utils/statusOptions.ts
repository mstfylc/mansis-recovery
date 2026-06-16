import { StatusOption } from '@/components/modals/BulkStatusUpdateDialog';
import { ActivityStatus } from '@/enums/activity-status';
import { ProductStatus } from '@/enums/product-status';
import { BranchStatus } from '@/enums/branch-status';
import { CampaignStatus } from '@/enums/campaign-status';
import { CategoryStatus } from '@/enums/category-status';
import { CompanyStatus } from '@/enums/company-status';
import { UserStatus } from '@/enums/user-status';
import { OrderStatus } from '@/enums/order-status';
import { PurchaseType } from '@/enums/purchase-type';

export const getActivityStatusOptions = (): StatusOption[] => [
  {
    value: ActivityStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: ActivityStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: ActivityStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getProductStatusOptions = (): StatusOption[] => [
  {
    value: ProductStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: ProductStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: ProductStatus.PENDING,
    label: 'status.pending'
  },
  {
    value: ProductStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getBranchStatusOptions = (): StatusOption[] => [
  {
    value: BranchStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: BranchStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: BranchStatus.PENDING,
    label: 'status.pending'
  },
  {
    value: BranchStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getCampaignStatusOptions = (): StatusOption[] => [
  {
    value: CampaignStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: CampaignStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: CampaignStatus.PENDING,
    label: 'status.pending'
  },
  {
    value: CampaignStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getCategoryStatusOptions = (): StatusOption[] => [
  {
    value: CategoryStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: CategoryStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: CategoryStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getCompanyStatusOptions = (): StatusOption[] => [
  {
    value: CompanyStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: CompanyStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: CompanyStatus.PENDING,
    label: 'status.pending'
  },
  {
    value: CompanyStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getUserStatusOptions = (): StatusOption[] => [
  {
    value: UserStatus.ACTIVE,
    label: 'status.active'
  },
  {
    value: UserStatus.PASSIVE,
    label: 'status.passive'
  },
  {
    value: UserStatus.PENDING,
    label: 'status.pending'
  },
  {
    value: UserStatus.DELETED,
    label: 'status.deleted'
  }
];

export const getOrderStatusOptions = (): StatusOption[] => [
  {
    value: OrderStatus.PREPARING,
    label: 'order.status.preparing'
  },
  {
    value: OrderStatus.READY,
    label: 'order.status.ready'
  },
  {
    value: OrderStatus.DELIVERED,
    label: 'order.status.delivered'
  },
  {
    value: OrderStatus.CANCELED,
    label: 'order.status.canceled'
  },
  {
    value: OrderStatus.REFUNDED,
    label: 'order.status.refunded'
  }
];

export const getPurchaseTypeOptions = (): StatusOption[] => [
  {
    value: PurchaseType.CASH,
    label: 'purchase.type.cash'
  },
  {
    value: PurchaseType.WALLET,
    label: 'purchase.type.wallet'
  },
  {
    value: PurchaseType.CAMPAIGN,
    label: 'purchase.type.campaign'
  },
  {
    value: PurchaseType.CARD,
    label: 'purchase.type.card'
  },
  {
    value: PurchaseType.DIRECT,
    label: 'purchase.type.direct'
  },
  {
    value: PurchaseType.PHYSICAL_CARD,
    label: 'purchase.type.physical.card'
  }
];

export const getCompanyProductStatusOptions = (): StatusOption[] => [
  {
    value: 'ACTIVE',
    label: 'status.active'
  },
  {
    value: 'PASSIVE',
    label: 'status.passive'
  },
  {
    value: 'PENDING',
    label: 'status.pending'
  },
  {
    value: 'DELETED',
    label: 'status.deleted'
  }
];

export const getMembershipPlanStatusOptions = (): StatusOption[] => [
  {
    value: 'ACTIVE',
    label: 'status.active'
  },
  {
    value: 'PASSIVE',
    label: 'status.passive'
  }
];
