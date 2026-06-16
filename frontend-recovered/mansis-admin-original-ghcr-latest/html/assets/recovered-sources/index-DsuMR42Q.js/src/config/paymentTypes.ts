import { PurchaseType } from '@/enums/purchase-type';

export interface PaymentTypeConfig {
  key:
    | 'cashSales'
    | 'walletSales'
    | 'campaignSales'
    | 'cardSales'
    | 'directSales'
    | 'physicalCardSales'
    | 'loyaltyPointsSales'
    | 'loyaltyHybridSales'
    | 'membershipPurchaseSales'
    | 'mixedSales';
  label: string;
  color: string;
  enumValue: PurchaseType;
}

export const PAYMENT_TYPES: PaymentTypeConfig[] = [
  {
    key: 'cashSales',
    label: 'dashboard.cash.sales',
    color: '#4CAF50',
    enumValue: PurchaseType.CASH
  },
  {
    key: 'walletSales',
    label: 'dashboard.wallet.sales',
    color: '#2196F3',
    enumValue: PurchaseType.WALLET
  },
  {
    key: 'campaignSales',
    label: 'dashboard.campaign.sales',
    color: '#FF9800',
    enumValue: PurchaseType.CAMPAIGN
  },
  {
    key: 'cardSales',
    label: 'dashboard.card.sales',
    color: '#9C27B0',
    enumValue: PurchaseType.CARD
  },
  {
    key: 'directSales',
    label: 'dashboard.direct.sales',
    color: '#F44336',
    enumValue: PurchaseType.DIRECT
  },
  {
    key: 'physicalCardSales',
    label: 'dashboard.physical.card.sales',
    color: '#9E9E9E',
    enumValue: PurchaseType.PHYSICAL_CARD
  },
  {
    key: 'loyaltyPointsSales',
    label: 'dashboard.loyalty.points.sales',
    color: '#E91E63',
    enumValue: PurchaseType.LOYALTY_POINTS
  },
  {
    key: 'loyaltyHybridSales',
    label: 'dashboard.loyalty.hybrid.sales',
    color: '#00BCD4',
    enumValue: PurchaseType.LOYALTY_POINTS_HYBRID
  },
  {
    key: 'membershipPurchaseSales',
    label: 'dashboard.membership.purchase.sales',
    color: '#795548',
    enumValue: PurchaseType.MEMBERSHIP
  },
  {
    key: 'mixedSales',
    label: 'dashboard.mixed.sales',
    color: '#607D8B',
    enumValue: PurchaseType.MIXED
  }
];
