import { PurchaseType } from './purchase-type';

export const PurchaseTypeLabels: Record<PurchaseType, string> = {
  [PurchaseType.CASH]: 'purchase.type.cash',
  [PurchaseType.WALLET]: 'purchase.type.wallet',
  [PurchaseType.CAMPAIGN]: 'purchase.type.campaign',
  [PurchaseType.CARD]: 'purchase.type.card',
  [PurchaseType.DIRECT]: 'purchase.type.direct',
  [PurchaseType.MEMBERSHIP]: 'purchase.type.membership',
  [PurchaseType.PHYSICAL_CARD]: 'purchase.type.physical.card',
  [PurchaseType.LOYALTY_POINTS]: 'purchase.type.loyalty.points',
  [PurchaseType.LOYALTY_POINTS_HYBRID]: 'purchase.type.loyalty.points.hybrid',
  [PurchaseType.MIXED]: 'purchase.type.mixed'
};
