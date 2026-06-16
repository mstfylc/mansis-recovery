import { apiClient } from './apiService';
import {
  BRANCH_FINANCIAL_INFO,
  BRANCH_FINANCIAL_INFO_BY_BRANCH,
  BRANCH_FINANCIAL_INFO_DETAIL
} from './endpoints';
import {
  BranchFinancialInfo,
  CreateBranchFinancialInfoDto,
  UpdateBranchFinancialInfoDto
} from '@/types/BranchFinancialInfo.interface';

/**
 * Get financial information for a specific branch
 */
export const getBranchFinancialInfo = async (
  branchId: number
): Promise<BranchFinancialInfo | null> => {
  try {
    const url = BRANCH_FINANCIAL_INFO_BY_BRANCH.replace(
      ':branchId',
      String(branchId)
    );
    const response = await apiClient.get<BranchFinancialInfo>(url);
    return response.data;
  } catch (error: any) {
    // Return null if not found (404)
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Create financial information for a branch
 */
export const createBranchFinancialInfo = async (
  branchId: number,
  data: CreateBranchFinancialInfoDto
): Promise<BranchFinancialInfo> => {
  const response = await apiClient.post<BranchFinancialInfo>(
    `${BRANCH_FINANCIAL_INFO}?branchId=${branchId}`,
    data
  );
  return response.data;
};

/**
 * Update financial information
 */
export const updateBranchFinancialInfo = async (
  id: number,
  data: UpdateBranchFinancialInfoDto
): Promise<BranchFinancialInfo> => {
  const url = BRANCH_FINANCIAL_INFO_DETAIL.replace(':id', String(id));
  const response = await apiClient.patch<BranchFinancialInfo>(url, data);
  return response.data;
};

/**
 * Delete financial information
 */
export const deleteBranchFinancialInfo = async (id: number): Promise<void> => {
  const url = BRANCH_FINANCIAL_INFO_DETAIL.replace(':id', String(id));
  await apiClient.delete(url);
};
