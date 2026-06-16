import { apiClient } from './apiService';
import {
  CHECK_IN_DAILY_LOGIN,
  BUY_DAILY_LOGIN,
  CHECK_EXAM,
  BUY_ACTIVITY_BY_CASH,
  BUY_CART_BY_CASH,
  BUY_BUNDLE_BY_CASH,
  BUY_MEMBERSHIP_BY_CASH
} from './endpoints';

interface ApiResponse {
  status: number;
  message?: string;
  data?: any;
}

export const qrScannerService = {
  async checkInDailyLogin(branchId: number): Promise<any> {
    // CHECK_IN_DAILY_LOGIN = '/checks/daily-login?branchId=' — value concatenated
    const response = await apiClient.get(`${CHECK_IN_DAILY_LOGIN}${branchId}`);
    return response.data;
  },

  async buyDailyLogin(data: {
    customerUserId: number;
    employeeId: number;
    branchId: number;
    amount: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(BUY_DAILY_LOGIN, data);
    return response.data;
  },

  async checkExam(data: {
    userId: number;
    activityId: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(CHECK_EXAM, data);
    return response.data;
  },

  async buyActivityByCash(data: {
    customerUserId: number;
    totalPrice: number;
    childActivityId: number;
    branchId: number;
    employeeId: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      BUY_ACTIVITY_BY_CASH,
      data
    );
    return response.data;
  },

  async buyCartByCash(data: {
    customerUserId: number;
    netTotalPrice: number;
    totalPrice: number;
    orderProducts: any[];
    branchId: number;
    employeeId: number;
    usedLoginDiscountCount?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(BUY_CART_BY_CASH, data);
    return response.data;
  },

  async buyBundleByCash(data: {
    customerUserId: number;
    totalPrice: number;
    bundleId: number;
    branchId: number;
    employeeId: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      BUY_BUNDLE_BY_CASH,
      data
    );
    return response.data;
  },

  async buyMembershipByCash(data: {
    customerUserId: number;
    employeeId: number;
    branchId: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      BUY_MEMBERSHIP_BY_CASH,
      data
    );
    return response.data;
  }
};
