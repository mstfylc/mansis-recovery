import { apiClient } from './apiService';
import {
  FLOOR_PLANS,
  FLOOR_PLAN_DETAIL,
  TABLES,
  TABLE_DETAIL,
  TABLE_STATUS
} from './endpoints';
import type {
  FloorPlan,
  Table,
  CreateFloorPlanData,
  UpdateFloorPlanData,
  CreateTableData,
  UpdateTableData
} from '../types/Table.interface';

export const getFloorPlans = async (params?: {
  branchId?: number;
  isActive?: boolean;
}): Promise<FloorPlan[]> => {
  const response = await apiClient.get<FloorPlan[]>(FLOOR_PLANS, params);
  return response.data ?? [];
};

export const createFloorPlan = async (
  dto: CreateFloorPlanData,
  params?: { branchId?: number }
): Promise<FloorPlan> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const response = await apiClient.post<FloorPlan>(`${FLOOR_PLANS}${qp}`, dto);
  return response.data;
};

export const updateFloorPlan = async (
  id: number,
  dto: UpdateFloorPlanData,
  params?: { branchId?: number }
): Promise<FloorPlan> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const url = FLOOR_PLAN_DETAIL.replace(':id', String(id));
  const response = await apiClient.patch<FloorPlan>(`${url}${qp}`, dto);
  return response.data;
};

export const deleteFloorPlan = async (
  id: number,
  params?: { branchId?: number }
): Promise<void> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const url = FLOOR_PLAN_DETAIL.replace(':id', String(id));
  await apiClient.delete(`${url}${qp}`);
};

export const getTables = async (params?: {
  branchId?: number;
  floorPlanId?: number;
  isActive?: boolean;
}): Promise<Table[]> => {
  const response = await apiClient.get<Table[]>(TABLES, params);
  return response.data ?? [];
};

export const createTable = async (
  dto: CreateTableData,
  params?: { branchId?: number }
): Promise<Table> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const response = await apiClient.post<Table>(`${TABLES}${qp}`, dto);
  return response.data;
};

export const updateTable = async (
  id: number,
  dto: UpdateTableData,
  params?: { branchId?: number }
): Promise<Table> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const url = TABLE_DETAIL.replace(':id', String(id));
  const response = await apiClient.patch<Table>(`${url}${qp}`, dto);
  return response.data;
};

export const deleteTable = async (
  id: number,
  params?: { branchId?: number }
): Promise<void> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const url = TABLE_DETAIL.replace(':id', String(id));
  await apiClient.delete(`${url}${qp}`);
};

export const updateTableStatus = async (
  id: number,
  status: string,
  params?: { branchId?: number }
): Promise<Table> => {
  const qp = params?.branchId ? `?branchId=${params.branchId}` : '';
  const url = TABLE_STATUS.replace(':id', String(id));
  const response = await apiClient.patch<Table>(`${url}${qp}`, { status });
  return response.data;
};
