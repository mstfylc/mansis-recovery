import { apiClient } from './apiService';
import {
  WAREHOUSES,
  WAREHOUSE_DETAIL,
  WAREHOUSE_STATISTICS,
  WAREHOUSE_STOCKS,
  WAREHOUSE_MOVEMENTS,
  WAREHOUSE_STOCKS_EXPORT
} from './endpoints';
import type {
  Warehouse,
  WarehouseListResponse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseStatisticsResponse,
  StockListResponse,
  StockLevel
} from '../types/stock';
import { ExportFormat } from '../types/export';

/**
 * Get all warehouses with optional filters
 */
export const getWarehouses = async (params?: {
  page?: number;
  limit?: number;
  branchId?: number;
  isActive?: boolean;
  getAll?: boolean;
}): Promise<WarehouseListResponse> => {
  const response = await apiClient.get<WarehouseListResponse>(
    WAREHOUSES,
    params
  );
  return response.data;
};

/**
 * Get warehouse by ID
 */
export const getWarehouseById = async (id: number): Promise<Warehouse> => {
  const url = WAREHOUSE_DETAIL.replace(':warehouseId', String(id));
  const response = await apiClient.get<Warehouse>(url);
  return response.data;
};

/**
 * Create a new warehouse
 */
export const createWarehouse = async (
  dto: CreateWarehouseDto
): Promise<Warehouse> => {
  const response = await apiClient.post<Warehouse>(WAREHOUSES, dto);
  return response.data;
};

/**
 * Update warehouse
 */
export const updateWarehouse = async (
  id: number,
  dto: UpdateWarehouseDto
): Promise<Warehouse> => {
  const url = WAREHOUSE_DETAIL.replace(':warehouseId', String(id));
  const response = await apiClient.patch<Warehouse>(url, dto);
  return response.data;
};

/**
 * Delete warehouse (soft delete)
 */
export const deleteWarehouse = async (id: number): Promise<void> => {
  const url = WAREHOUSE_DETAIL.replace(':warehouseId', String(id));
  await apiClient.delete(url);
};

/**
 * Bulk delete warehouses
 */
export const bulkDeleteWarehouses = async (
  warehouseIds: number[]
): Promise<void> => {
  await apiClient.post(`${WAREHOUSES}/delete`, { warehouseIds });
};

/**
 * Get warehouses by branch ID
 * Returns all warehouses for a specific branch without pagination
 */
export const getWarehousesByBranch = async (
  branchId: number
): Promise<Warehouse[]> => {
  const response = await apiClient.get<Warehouse[]>(WAREHOUSES, {
    branchId,
    getAll: true
  });
  return response.data;
};

export const getWarehouseStatistics = async (
  warehouseId: number
): Promise<WarehouseStatisticsResponse> => {
  const url = WAREHOUSE_STATISTICS.replace(':warehouseId', String(warehouseId));
  const response = await apiClient.get<WarehouseStatisticsResponse>(url);
  return response.data;
};

/**
 * Get warehouse stocks with optional filters
 */
export const getWarehouseStocks = async (
  warehouseId: number,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    stockLevel?: 'critical' | 'low' | 'optimal' | 'all';
  }
): Promise<StockListResponse> => {
  const url = WAREHOUSE_STOCKS.replace(':warehouseId', String(warehouseId));
  const response = await apiClient.get<StockListResponse>(url, params);
  return response.data;
};

export const getWarehouseMovements = async (
  warehouseId: number,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    getAll?: boolean;
  }
): Promise<any> => {
  const url = WAREHOUSE_MOVEMENTS.replace(':warehouseId', String(warehouseId));
  const response = await apiClient.get<any>(url, params);
  return response.data;
};

export const exportWarehouseStocks = async (
  warehouseId: number,
  params?: {
    categoryId?: number;
    stockLevel?: StockLevel;
  }
): Promise<{ url: string; filename: string }> => {
  const url = WAREHOUSE_STOCKS_EXPORT.replace(
    ':warehouseId',
    String(warehouseId)
  );
  const response = await apiClient.post<{ url: string; filename: string }>(
    url,
    {
      format: ExportFormat.EXCEL,
      ...params
    }
  );
  return response.data;
};
