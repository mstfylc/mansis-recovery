import { apiClient } from './apiService';
import {
  SMS_PACKAGES,
  SMS_PACKAGE_BY_ID,
  SMS_PACKAGE_PURCHASE
} from './endpoints';
import {
  SmsPackage,
  CreateSmsPackageData,
  UpdateSmsPackageData,
  SmsPurchase
} from '@/types/Licensing.interface';

interface SmsPackagesResponse {
  items: SmsPackage[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get all SMS packages with optional filters
 */
export const getSmsPackages = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<SmsPackagesResponse> => {
  const response = await apiClient.get<SmsPackagesResponse>(
    SMS_PACKAGES,
    params
  );
  return response.data;
};

/**
 * Get SMS package by ID
 */
export const getSmsPackageById = async (id: number): Promise<SmsPackage> => {
  const url = SMS_PACKAGE_BY_ID.replace(':id', String(id));
  const response = await apiClient.get<SmsPackage>(url);
  return response.data;
};

/**
 * Create a new SMS package
 */
export const createSmsPackage = async (
  dto: CreateSmsPackageData
): Promise<SmsPackage> => {
  const response = await apiClient.post<SmsPackage>(SMS_PACKAGES, dto);
  return response.data;
};

/**
 * Update SMS package
 */
export const updateSmsPackage = async (
  id: number,
  dto: UpdateSmsPackageData
): Promise<SmsPackage> => {
  const url = SMS_PACKAGE_BY_ID.replace(':id', String(id));
  const response = await apiClient.put<SmsPackage>(url, dto);
  return response.data;
};

/**
 * Delete SMS package (soft delete)
 */
export const deleteSmsPackage = async (id: number): Promise<void> => {
  const url = SMS_PACKAGE_BY_ID.replace(':id', String(id));
  await apiClient.delete(url);
};

/**
 * Purchase SMS package for a branch (SUPER_ADMIN only)
 */
export const purchaseSmsPackage = async (dto: {
  branchId: number;
  packageId: number;
  notes?: string;
}): Promise<SmsPurchase> => {
  const response = await apiClient.post<SmsPurchase>(SMS_PACKAGE_PURCHASE, dto);
  return response.data;
};
