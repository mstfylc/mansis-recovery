export enum FinancialEntityType {
  COMPANY = 'COMPANY',
  INDIVIDUAL = 'INDIVIDUAL'
}

export interface BranchFinancialInfo {
  id: number;
  branchId: number;
  entityType: FinancialEntityType;
  companyTitle?: string;
  fullName?: string;
  taxIdNumber: string;
  taxOffice?: string;
  iban: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchFinancialInfoDto {
  entityType: FinancialEntityType;
  companyTitle?: string;
  fullName?: string;
  taxIdNumber: string;
  taxOffice?: string;
  iban: string;
}

export interface UpdateBranchFinancialInfoDto {
  entityType?: FinancialEntityType;
  companyTitle?: string;
  fullName?: string;
  taxIdNumber?: string;
  taxOffice?: string;
  iban?: string;
}
