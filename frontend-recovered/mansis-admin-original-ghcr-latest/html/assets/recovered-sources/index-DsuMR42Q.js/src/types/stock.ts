import { Branch } from './Branch.interface';

export enum StockUnit {
  PIECE = 'PIECE',
  KG = 'KG',
  GRAM = 'GRAM',
  LITER = 'LITER',
  ML = 'ML',
  PORTION = 'PORTION'
}

export const ALL_STOCK_UNITS: StockUnit[] = Object.values(StockUnit);

export enum StockMovementType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  WASTE = 'WASTE',
  RETURN = 'RETURN',
  INITIAL = 'INITIAL'
}

export enum StockLevel {
  CRITICAL = 'CRITICAL',
  LOW = 'LOW',
  OPTIMAL = 'OPTIMAL',
  ALL = 'ALL'
}

// All movement types for filters and dropdowns
export const ALL_STOCK_MOVEMENT_TYPES: StockMovementType[] = [
  StockMovementType.INBOUND,
  StockMovementType.OUTBOUND,
  StockMovementType.ADJUSTMENT,
  StockMovementType.TRANSFER_IN,
  StockMovementType.TRANSFER_OUT,
  StockMovementType.WASTE,
  StockMovementType.RETURN,
  StockMovementType.INITIAL
];

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  branchId: number;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  branch?: Branch;
}

export interface ProductStockThreshold {
  id: number;
  branchId: number;
  companyProductId: number;
  warehouseId: number;
  minThreshold: number | null;
  maxThreshold: number | null;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: number;
    name: string;
    code: string;
  };
  branch?: {
    id: number;
    name: string;
  };
  companyProduct?: {
    id: number;
    name: string;
  };
}

export interface WarehouseStatistics {
  totalProducts: number;
  totalStockQuantity: number;
  criticalLevelProducts: number;
  lowStockProducts: number;
  optimalStockProducts: number;
  totalStockValue: number;
  utilizationPercentage: number;
  recentMovementsCount: number;
}

export interface WarehouseStatisticsResponse {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  branchId: number;
  branchName: string;
  statistics: WarehouseStatistics;
  isDefault: boolean;
  isActive: boolean;
}

export interface BranchStock {
  id: number;
  branchId: number;
  companyProductId: number;
  warehouseId: number;
  batchId?: number | null;
  quantity: number;
  minThreshold?: number;
  maxThreshold?: number;
  lastRestockDate?: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: string;
  updatedAt: string;
  totalQuantity?: number; // For grouped rows - sum of all batches
  branch: {
    id: number;
    name: string;
    company?: {
      id: number;
      name: string;
    };
  };
  warehouse: {
    id: number;
    name: string;
    code: string;
  };
  companyProduct: {
    id: number;
    name: string;
    basePrice: number;
    stockUnit: StockUnit;
    trackExpiry?: boolean;
    allowNegativeStock?: boolean;
    category?: {
      id: number;
      name: string;
    };
    file?: {
      url: string;
    };
  };
  batch?: {
    id: number;
    batchNumber: string;
    expiryDate: string;
    manufacturingDate?: string;
    supplierBatchNo?: string;
    status: string;
  };
}

export interface StockMovement {
  id: number;
  branchStockId: number;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceType?: string;
  referenceId?: number;
  userId?: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  createdAt: string;
  branchStock: {
    branch: {
      id: number;
      name: string;
    };
    companyProduct: {
      id: number;
      name: string;
    };
  };
  fromWarehouse?: {
    id: number;
    name: string;
    code: string;
  };
  toWarehouse?: {
    id: number;
    name: string;
    code: string;
  };
  user?: {
    id: number;
    name: string;
    surname: string;
  };
  batch?: {
    id: number;
    batchNumber: string;
    expiryDate: string;
  };
}

export interface WarehouseListResponse {
  items: Warehouse[];
  total: number;
  page: number;
  limit: number;
}

export interface StockListResponse {
  items: BranchStock[];
  total: number;
  page: number;
  limit: number;
}

export interface StockMovementListResponse {
  items: StockMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateWarehouseDto {
  name: string;
  branchId: number;
  isDefault?: boolean;
  description?: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  isActive?: boolean;
  isDefault?: boolean;
  description?: string;
}

export interface InitializeStockDto {
  branchId: number;
  productId: number;
  quantity: number;
  minThreshold?: number;
  maxThreshold?: number;
  warehouseId?: number;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplierBatchNo?: string;
  supplierInfo?: string;
  notes?: string;
}

export interface AddStockDto {
  branchId: number;
  productId: number;
  quantity: number;
  reason?: string;
  warehouseId?: number;
  batchId?: number;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplierBatchNo?: string;
  supplierInfo?: string;
  notes?: string;
}

export interface DeductStockDto {
  branchId: number;
  productId: number;
  quantity: number;
  reason?: string;
  warehouseId?: number;
}

export interface AdjustStockDto {
  branchId: number;
  productId: number;
  newQuantity: number;
  reason: string;
  warehouseId?: number;
  batchId?: number;
}

export interface TransferStockDto {
  fromBranchId: number;
  toBranchId: number;
  productId: number;
  quantity: number;
  reason?: string;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  batchId?: number;
}

export interface UpdateStockThresholdsDto {
  branchId: number;
  productId: number;
  minThreshold?: number;
  maxThreshold?: number;
  warehouseId?: number;
}

// Product Stock Threshold DTOs
export interface CreateProductThresholdDto {
  branchId: number;
  companyProductId: number;
  warehouseId: number;
  minThreshold?: number | null;
  maxThreshold?: number | null;
}

export interface UpdateProductThresholdDto {
  minThreshold?: number | null;
  maxThreshold?: number | null;
}

export interface BulkSetThresholdDto {
  branchId: number;
  companyProductId: number;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  applyToAllWarehouses?: boolean;
  warehouseIds?: number[];
}

export interface CheckLowStockResponse {
  isLowStock: boolean;
  currentQuantity: number;
  threshold: number | null;
}

export interface DisposeBatchDto {
  batchId: number;
  reason: string;
  notes?: string;
}

export interface DisposeBatchResponse {
  success: boolean;
  batchNumber: string;
  productName: string;
  totalDisposed: number;
  locations: Array<{
    branchId: number;
    branchName: string;
    warehouseId: number;
    warehouseName: string;
    disposedQuantity: number;
  }>;
}
