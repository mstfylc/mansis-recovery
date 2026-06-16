import { apiClient } from '@/data/apiService';
import {
  BATCH_EXPIRING_COUNT,
  BATCH_EXPIRING_SOON,
  BATCHES,
  BATCH_BY_ID,
  BATCH_STATUS,
  BATCH_RECALL
} from './endpoints';
import {
  Batch,
  BatchWithProduct,
  BatchExpiringCount,
  CreateBatchDto,
  UpdateBatchStatusDto,
  RecallBatchDto
} from '@/types/batch';

/**
 * Get count of expiring batches grouped by timeframe
 */
export const getBatchExpiringCount = async (
  branchId?: number
): Promise<BatchExpiringCount> => {
  const params = branchId ? { branchId } : undefined;
  const response = await apiClient.get<BatchExpiringCount>(
    BATCH_EXPIRING_COUNT,
    { params }
  );
  return response.data;
};

/**
 * Get list of expiring batches
 */
export const getExpiringBatches = async (
  days: number
): Promise<BatchWithProduct[]> => {
  const response = await apiClient.get<BatchWithProduct[]>(
    BATCH_EXPIRING_SOON,
    { params: { days } }
  );
  return response.data;
};

/**
 * Get all batches with optional filters
 */
export const getBatches = async (params?: {
  status?: string;
  companyProductId?: number;
  branchId?: number;
}): Promise<BatchWithProduct[]> => {
  const response = await apiClient.get<BatchWithProduct[]>(BATCHES, {
    params
  });
  return response.data;
};

/**
 * Get a single batch by ID
 */
export const getBatchById = async (id: number): Promise<BatchWithProduct> => {
  const response = await apiClient.get<BatchWithProduct>(
    BATCH_BY_ID.replace(':id', id.toString())
  );
  return response.data;
};

/**
 * Create a new batch
 */
export const createBatch = async (dto: CreateBatchDto): Promise<Batch> => {
  const response = await apiClient.post<Batch>(BATCHES, dto);
  return response.data;
};

/**
 * Update batch status (QUARANTINED or RECALLED)
 */
export const updateBatchStatus = async (
  id: number,
  dto: UpdateBatchStatusDto
): Promise<Batch> => {
  const response = await apiClient.patch<Batch>(
    BATCH_STATUS.replace(':id', id.toString()),
    dto
  );
  return response.data;
};

/**
 * Recall a batch
 */
export const recallBatch = async (
  id: number,
  dto: RecallBatchDto
): Promise<{
  success: boolean;
  batchNumber: string;
  affectedBranches: Array<{
    branchId: number;
    branchName: string;
    quantity: number;
  }>;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    batchNumber: string;
    affectedBranches: Array<{
      branchId: number;
      branchName: string;
      quantity: number;
    }>;
  }>(BATCH_RECALL.replace(':id', id.toString()), dto);
  return response.data;
};
