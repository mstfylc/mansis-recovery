import { apiClient } from './apiService';
import {
  WithdrawalRequest,
  WithdrawalStatus
} from '@/types/WithdrawalRequest.interface';
import {
  FINANCE_SUMMARY,
  DAILY_EARNINGS,
  AVAILABLE_BALANCE,
  WITHDRAWAL_REQUESTS,
  ACCOUNTING_LEDGER_ENTRIES,
  ACCOUNTING_LEDGER_BRANCHES_SUMMARY,
  ACCOUNTING_LEDGER_MANUAL_ADJUSTMENT,
  ACCOUNTING_LEDGER_NEGATIVE_LIMIT,
  ACCOUNTING_LEDGER_NEGATIVE_LIMIT_BY_BRANCH
} from './endpoints';

export interface WithdrawalRequestsResponse {
  items: WithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface WithdrawalRequestFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branchId?: number;
  companyId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AccountingLedgerFilters {
  page?: number;
  limit?: number;
  branchId?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  transactionType?: string;
  search?: string;
}

export const financeService = {
  async getSummary(params: Record<string, any>): Promise<any> {
    const response = await apiClient.get(FINANCE_SUMMARY, params);
    return response.data;
  },

  async getDailyPayments(params: Record<string, any>): Promise<any> {
    const response = await apiClient.get(DAILY_EARNINGS, params);
    return response.data;
  },

  async getAvailableBalance(branchId: number): Promise<any> {
    const response = await apiClient.get(
      `${AVAILABLE_BALANCE}?branchId=${branchId}`
    );
    return response.data;
  },

  async getWithdrawalRequests(
    filters: WithdrawalRequestFilters = {}
  ): Promise<WithdrawalRequestsResponse> {
    const response = await apiClient.get<WithdrawalRequestsResponse>(
      WITHDRAWAL_REQUESTS,
      filters
    );
    return response.data;
  },

  async createWithdrawalRequest(data: {
    amount: number;
    branchId: number;
  }): Promise<WithdrawalRequest> {
    const response = await apiClient.post<WithdrawalRequest>(
      WITHDRAWAL_REQUESTS,
      data
    );
    return response.data;
  },

  async updateWithdrawalRequestStatus(
    id: string,
    data: { status: WithdrawalStatus; note?: string; branchId?: number }
  ): Promise<WithdrawalRequest> {
    const response = await apiClient.patch<WithdrawalRequest>(
      `${WITHDRAWAL_REQUESTS}/${id}`,
      data
    );
    return response.data;
  },

  async cancelWithdrawalRequest(
    id: string,
    branchId: number
  ): Promise<WithdrawalRequest> {
    const response = await apiClient.patch<WithdrawalRequest>(
      `${WITHDRAWAL_REQUESTS}/${id}/cancel`,
      { branchId }
    );
    return response.data;
  },

  async getAccountingLedgerEntries(
    filters: AccountingLedgerFilters
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(
      `${ACCOUNTING_LEDGER_ENTRIES}?${queryParams.toString()}`
    );
    return response.data;
  },

  async getAccountingLedgerBranchesSummary(
    params: Record<string, any>
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(
      `${ACCOUNTING_LEDGER_BRANCHES_SUMMARY}?${queryParams.toString()}`
    );
    return response.data;
  },

  async createManualAdjustment(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      ACCOUNTING_LEDGER_MANUAL_ADJUSTMENT,
      data
    );
    return response.data;
  },

  async partialPayment(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      `${WITHDRAWAL_REQUESTS}/partial-payment`,
      data
    );
    return response.data;
  },

  async partialPaymentByWithdrawal(
    withdrawalId: string | number,
    data: Record<string, any>
  ): Promise<any> {
    const response = await apiClient.post(
      `${WITHDRAWAL_REQUESTS}/${withdrawalId}/partial-payment`,
      data
    );
    return response.data;
  },

  async getNegativeLimit(branchId: number): Promise<any> {
    const url = ACCOUNTING_LEDGER_NEGATIVE_LIMIT_BY_BRANCH.replace(
      ':branchId',
      String(branchId)
    );
    const response = await apiClient.get(url);
    return response.data;
  },

  async setNegativeLimit(data: Record<string, any>): Promise<any> {
    const response = await apiClient.post(
      ACCOUNTING_LEDGER_NEGATIVE_LIMIT,
      data
    );
    return response.data;
  },

  async updateNegativeLimit(data: Record<string, any>): Promise<any> {
    const response = await apiClient.put(
      ACCOUNTING_LEDGER_NEGATIVE_LIMIT,
      data
    );
    return response.data;
  },

  async deleteNegativeLimit(branchId: number): Promise<void> {
    const url = ACCOUNTING_LEDGER_NEGATIVE_LIMIT_BY_BRANCH.replace(
      ':branchId',
      String(branchId)
    );
    await apiClient.delete(url);
  }
};
