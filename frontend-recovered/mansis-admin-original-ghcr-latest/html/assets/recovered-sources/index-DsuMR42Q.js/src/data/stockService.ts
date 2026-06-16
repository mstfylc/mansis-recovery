import { apiClient } from './apiService';
import {
  STOCK,
  STOCK_BY_BRANCH_PRODUCT,
  STOCK_INITIALIZE,
  STOCK_ADD,
  STOCK_DEDUCT,
  STOCK_ADJUST,
  STOCK_TRANSFER,
  STOCK_UPDATE_THRESHOLDS,
  STOCK_MOVEMENTS,
  STOCK_HISTORY_EXPORT,
  STOCK_THRESHOLDS,
  STOCK_THRESHOLDS_BULK,
  STOCK_THRESHOLD_DETAIL,
  STOCK_THRESHOLDS_BY_PRODUCT,
  STOCK_THRESHOLD_CHECK_LOW_STOCK,
  STOCK_BATCH_REQUIREMENTS
} from './endpoints';
import type {
  BranchStock,
  StockListResponse,
  StockMovementListResponse,
  InitializeStockDto,
  AddStockDto,
  DeductStockDto,
  AdjustStockDto,
  TransferStockDto,
  UpdateStockThresholdsDto,
  ProductStockThreshold,
  CreateProductThresholdDto,
  UpdateProductThresholdDto,
  BulkSetThresholdDto,
  CheckLowStockResponse
} from '../types/stock';
import type { StockHistoryExportParams } from '../types/export';

export const getStock = async (
  branchId: number,
  productId: number
): Promise<BranchStock> => {
  const url = STOCK_BY_BRANCH_PRODUCT.replace(
    ':branchId',
    String(branchId)
  ).replace(':productId', String(productId));
  const response = await apiClient.get<BranchStock>(url);
  return response.data;
};

export const getBranchStocks = async (params?: {
  branchId?: number;
  warehouseId?: number;
  page?: number;
  limit?: number;
  search?: string;
  lowStockOnly?: boolean;
  categoryId?: number;
}): Promise<StockListResponse> => {
  const response = await apiClient.get<StockListResponse>(STOCK, params);
  return response.data;
};

export const initializeStock = async (
  dto: InitializeStockDto
): Promise<BranchStock> => {
  const response = await apiClient.post<BranchStock>(STOCK_INITIALIZE, dto);
  return response.data;
};

export const addStock = async (dto: AddStockDto): Promise<BranchStock> => {
  const response = await apiClient.post<BranchStock>(STOCK_ADD, dto);
  return response.data;
};

export const deductStock = async (
  dto: DeductStockDto
): Promise<BranchStock> => {
  const response = await apiClient.post<BranchStock>(STOCK_DEDUCT, dto);
  return response.data;
};

export const adjustStock = async (
  dto: AdjustStockDto
): Promise<BranchStock> => {
  const response = await apiClient.post<BranchStock>(STOCK_ADJUST, dto);
  return response.data;
};

export const transferStock = async (
  dto: TransferStockDto
): Promise<{
  fromStock: BranchStock;
  toStock: BranchStock;
}> => {
  const response = await apiClient.post<{
    fromStock: BranchStock;
    toStock: BranchStock;
  }>(STOCK_TRANSFER, dto);
  return response.data;
};

export const updateThresholds = async (
  dto: UpdateStockThresholdsDto
): Promise<BranchStock> => {
  const response = await apiClient.put<BranchStock>(
    STOCK_UPDATE_THRESHOLDS,
    dto
  );
  return response.data;
};

export const getStockMovements = async (params?: {
  branchId?: number;
  page?: number;
  limit?: number;
  productId?: number;
  warehouseId?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}): Promise<StockMovementListResponse> => {
  const response = await apiClient.get<StockMovementListResponse>(
    STOCK_MOVEMENTS,
    params
  );
  return response.data;
};

export const exportStockHistory = async (
  stockId: number,
  params: StockHistoryExportParams
): Promise<{ url: string; filename: string }> => {
  const url = STOCK_HISTORY_EXPORT.replace(':stockId', String(stockId));
  const response = await apiClient.post<{ url: string; filename: string }>(
    url,
    params
  );
  return response.data;
};

export const setProductThreshold = async (
  dto: CreateProductThresholdDto
): Promise<ProductStockThreshold> => {
  const response = await apiClient.post<ProductStockThreshold>(
    STOCK_THRESHOLDS,
    dto
  );
  return response.data;
};

export const bulkSetProductThreshold = async (
  dto: BulkSetThresholdDto
): Promise<ProductStockThreshold[]> => {
  const response = await apiClient.post<ProductStockThreshold[]>(
    STOCK_THRESHOLDS_BULK,
    dto
  );
  return response.data;
};

export const getProductThreshold = async (
  branchId: number,
  productId: number,
  warehouseId: number
): Promise<ProductStockThreshold> => {
  const url = STOCK_THRESHOLD_DETAIL.replace(':branchId', String(branchId))
    .replace(':productId', String(productId))
    .replace(':warehouseId', String(warehouseId));
  const response = await apiClient.get<ProductStockThreshold>(url);
  return response.data;
};

export const getProductThresholds = async (
  branchId: number,
  productId: number
): Promise<ProductStockThreshold[]> => {
  const url = STOCK_THRESHOLDS_BY_PRODUCT.replace(
    ':branchId',
    String(branchId)
  ).replace(':productId', String(productId));
  const response = await apiClient.get<ProductStockThreshold[]>(url);
  return response.data;
};

export const updateProductThreshold = async (
  branchId: number,
  productId: number,
  warehouseId: number,
  dto: UpdateProductThresholdDto
): Promise<ProductStockThreshold> => {
  const url = STOCK_THRESHOLD_DETAIL.replace(':branchId', String(branchId))
    .replace(':productId', String(productId))
    .replace(':warehouseId', String(warehouseId));
  const response = await apiClient.put<ProductStockThreshold>(url, dto);
  return response.data;
};

export const deleteProductThreshold = async (
  branchId: number,
  productId: number,
  warehouseId: number
): Promise<void> => {
  const url = STOCK_THRESHOLD_DETAIL.replace(':branchId', String(branchId))
    .replace(':productId', String(productId))
    .replace(':warehouseId', String(warehouseId));
  await apiClient.delete(url);
};

export const checkLowStock = async (
  branchId: number,
  productId: number,
  warehouseId: number
): Promise<CheckLowStockResponse> => {
  const url = STOCK_THRESHOLD_CHECK_LOW_STOCK.replace(
    ':branchId',
    String(branchId)
  )
    .replace(':productId', String(productId))
    .replace(':warehouseId', String(warehouseId));
  const response = await apiClient.get<CheckLowStockResponse>(url);
  return response.data;
};

export const getBatchRequirements = async (
  branchId: number
): Promise<{ companyProductId: number; isBatchTracked: boolean }[]> => {
  const url = STOCK_BATCH_REQUIREMENTS;
  const response = await apiClient.get<
    { companyProductId: number; isBatchTracked: boolean }[]
  >(url, { params: { branchId } });
  return response.data;
};

interface DisposeBatchResponse {
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

export const disposeBatch = async (data: {
  batchId: number;
  reason: string;
  notes?: string;
}): Promise<DisposeBatchResponse> => {
  const response = await apiClient.post<DisposeBatchResponse>(
    '/stocks/dispose-batch',
    data
  );
  return response.data;
};
