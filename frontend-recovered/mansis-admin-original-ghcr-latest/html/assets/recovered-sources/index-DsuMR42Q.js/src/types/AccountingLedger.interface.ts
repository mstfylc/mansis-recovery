export type TransactionType =
  | 'REVENUE'
  | 'WITHDRAWAL'
  | 'MANUAL_ADJUSTMENT'
  | 'REFUND';

export type AdjustmentType = 'POSITIVE' | 'NEGATIVE';

export const TRANSACTION_TYPE = {
  REVENUE: 'REVENUE' as TransactionType,
  WITHDRAWAL: 'WITHDRAWAL' as TransactionType,
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT' as TransactionType,
  REFUND: 'REFUND' as TransactionType
} as const;

export const ADJUSTMENT_TYPE = {
  POSITIVE: 'POSITIVE' as AdjustmentType,
  NEGATIVE: 'NEGATIVE' as AdjustmentType
} as const;

export interface AccountingLedgerEntry {
  id: number;
  branchId: number;
  companyId: number;
  amount: string;
  balance: string;
  transactionType: TransactionType;
  source: string;
  sourceId: number | null;
  description: string | null;
  createdById: number | null;
  createdBy: {
    name: string;
    surname: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface AccountingLedgerResponse {
  items: AccountingLedgerEntry[];
  total: number;
  page: number;
  limit: number;
  currentBalance: number;
}

export interface ManualAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  branchId: number | null;
  onSuccess: () => void;
}

export interface NegativeLimitModalProps {
  open: boolean;
  onClose: () => void;
  branchId: number | null;
  onSuccess: () => void;
}

export interface PartialPaymentModalProps {
  open: boolean;
  onClose: () => void;
  withdrawal: {
    id: string;
    requestedAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
  } | null;
  onSuccess: () => void;
}
