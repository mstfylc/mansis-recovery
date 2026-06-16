import {
  VoucherRewardType,
  RewardGroupDto,
  VoucherTemplateFormData
} from '@/types/Voucher.interface';

export const getRewardTypeLabel = (
  type: VoucherRewardType,
  t: (key: string) => string
): string => {
  switch (type) {
    case 'FREE_PRODUCT':
      return t('voucher.reward.type.free.product');
    case 'PERCENT_DISCOUNT':
      return t('voucher.reward.type.percent.discount');
    case 'FIXED_DISCOUNT':
      return t('voucher.reward.type.fixed.discount');
    default:
      return type;
  }
};

export const getRewardTypeColor = (
  type: VoucherRewardType
): { bgcolor: string; color: string } => {
  switch (type) {
    case 'FREE_PRODUCT':
      return { bgcolor: '#2e7d32', color: '#fff' };
    case 'PERCENT_DISCOUNT':
      return { bgcolor: '#ed6c02', color: '#fff' };
    case 'FIXED_DISCOUNT':
      return { bgcolor: '#9c27b0', color: '#fff' };
    default:
      return { bgcolor: '#1976d2', color: '#fff' };
  }
};

export const createEmptyRewardGroup = (index: number): RewardGroupDto => ({
  name: `Grup ${index + 1}`,
  description: '',
  rewardQuantity: 1,
  sortOrder: index,
  products: []
});

export const getDefaultFormData = (): VoucherTemplateFormData => ({
  name: '',
  description: '',
  triggerProductId: undefined,
  triggerMinQuantity: 1,
  rewardType: 'FREE_PRODUCT',
  discountPercent: undefined,
  discountAmount: undefined,
  rewardGroups: [createEmptyRewardGroup(0)],
  validityDays: 30,
  maxUsagePerUser: undefined,
  totalMaxUsage: undefined,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true
});
