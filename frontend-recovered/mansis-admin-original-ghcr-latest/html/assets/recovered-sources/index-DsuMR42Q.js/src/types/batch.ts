export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  NEAR_EXPIRY = 'NEAR_EXPIRY',
  EXPIRED = 'EXPIRED',
  QUARANTINED = 'QUARANTINED',
  RECALLED = 'RECALLED',
  DISPOSED = 'DISPOSED'
}

export interface Batch {
  id: number;
  batchNumber: string;
  companyProductId: number;
  manufacturingDate: Date | string;
  expiryDate: Date | string;
  initialQuantity: number;
  status: BatchStatus;
  supplierBatchNo?: string;
  supplierInfo?: string;
  notes?: string;
  createdById: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface BatchWithProduct extends Batch {
  companyProduct: {
    id: number;
    name: string;
    basePrice: number;
    stockUnit?: string;
  };
  currentQuantity?: number;
  branchStocks?: Array<{
    branchId: number;
    quantity: number;
    branch: {
      id: number;
      name: string;
    };
  }>;
  daysUntilExpiry?: number;
  totalValue?: number;
  branchCount?: number;
}

export interface BatchExpiringCount {
  today: number;
  tomorrow: number;
  within3Days: number;
  total: number;
}

export type BatchTimeframe = 'today' | 'tomorrow' | 'within3Days';

export interface BatchNearExpiryEvent {
  branchId: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: Date | string;
  currentQuantity: number;
  unit: string;
  daysUntilExpiry: number;
  timeframe: BatchTimeframe;
  aggregatedCount?: number;
}

export interface BatchExpiredEvent {
  branchId: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: Date | string;
  currentQuantity: number;
  unit: string;
}

export interface BatchRecalledEvent {
  batchId: number;
  batchNumber: string;
  productId: number;
  productName: string;
  reason: string;
  recalledBy: number;
  recalledAt: Date | string;
  affectedBranches: Array<{ branchId: number; branchName: string }>;
}

export interface BatchStatusChangedEvent {
  batchId: number;
  batchNumber: string;
  productId: number;
  productName: string;
  branchId?: number;
  oldStatus: string;
  newStatus: string;
  changedBy: number;
  changedAt: Date | string;
}

export type BatchEventType =
  | 'batch.near-expiry'
  | 'batch.expired'
  | 'batch.recalled'
  | 'batch.status-changed';

export interface BatchEvent {
  type: BatchEventType;
  payload:
    | BatchNearExpiryEvent
    | BatchExpiredEvent
    | BatchRecalledEvent
    | BatchStatusChangedEvent;
}

export interface CreateBatchDto {
  companyProductId: number;
  manufacturingDate: Date | string;
  expiryDate: Date | string;
  quantity: number;
  unit: string;
  supplierBatchNo?: string;
  supplierInfo?: string;
  notes?: string;
}

export interface UpdateBatchStatusDto {
  status: BatchStatus.QUARANTINED | BatchStatus.RECALLED;
  reason?: string;
}

export interface RecallBatchDto {
  reason: string;
  notifyBranches: boolean;
}
