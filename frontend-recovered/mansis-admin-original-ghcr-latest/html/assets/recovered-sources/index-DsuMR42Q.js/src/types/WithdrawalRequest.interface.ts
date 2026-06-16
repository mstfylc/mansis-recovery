import { Branch } from './Branch.interface';
import { Company } from './Company.interface';
import { User } from './User.interface';

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED'
}

export interface WithdrawalRequest {
  id: string;
  amount: string;
  paidAmount?: string;
  remainingAmount?: string;
  status: WithdrawalStatus;
  branch: Branch;
  company: Company;
  branchId: string;
  companyId: string;
  requestedBy: User;
  requestedById: string;
  processedBy?: User;
  processedById?: string;
  processedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
