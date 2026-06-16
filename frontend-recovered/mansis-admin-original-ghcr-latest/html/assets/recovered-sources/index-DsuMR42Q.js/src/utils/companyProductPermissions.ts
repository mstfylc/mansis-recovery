import { apiClient } from '@/data/apiService';
import { COMPANY_PRODUCT_SETTINGS_BY_COMPANY } from '@/data/endpoints';
import { Role } from '@/enums/role';

export interface CompanyProductSettings {
  id?: number;
  companyId: number;
  productStrategy: CompanyProductStrategy;
  allowBranchOverrides: boolean;
  allowCustomProducts: boolean;
  requireApproval: boolean;
  autoSyncMenuPrices: boolean;
}

export enum CompanyProductStrategy {
  CENTRALIZED = 'CENTRALIZED',
  PRICE_FLEXIBLE = 'PRICE_FLEXIBLE',
  MIXED = 'MIXED',
  DECENTRALIZED = 'DECENTRALIZED'
}

/**
 * Fetches company product settings for a given company
 */
export const fetchCompanyProductSettings = async (
  companyId: number
): Promise<CompanyProductSettings | null> => {
  try {
    const response = await apiClient.get<CompanyProductSettings>(
      `${COMPANY_PRODUCT_SETTINGS_BY_COMPANY}/${companyId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching company product settings:', error);
    return null;
  }
};

/**
 * Determines if a user can create products based on their role and company settings
 */
export const canUserCreateProducts = (
  userRole: Role,
  companySettings: CompanyProductSettings | null
): boolean => {
  // Super admins and company admins can always create products
  if (userRole === Role.SUPER_ADMIN || userRole === Role.COMPANY_ADMIN) {
    return true;
  }

  // Branch admins need to check company settings
  if (userRole === Role.BRANCH_ADMIN) {
    // If no settings found, default to allowing (fallback)
    if (!companySettings) {
      return true;
    }

    // Check if custom products are allowed
    if (!companySettings.allowCustomProducts) {
      return false;
    }

    // Check strategy-specific constraints
    switch (companySettings.productStrategy) {
      case CompanyProductStrategy.CENTRALIZED:
        return false; // No custom products allowed

      case CompanyProductStrategy.PRICE_FLEXIBLE:
        return false; // Only price modifications allowed, no new products

      case CompanyProductStrategy.MIXED:
      case CompanyProductStrategy.DECENTRALIZED:
        return companySettings.allowCustomProducts;

      default:
        return companySettings.allowCustomProducts;
    }
  }

  // Employees and customers cannot create products
  return false;
};

/**
 * Determines if a user can create menus based on their role and company settings
 */
export const canUserCreateMenus = (
  userRole: Role,
  companySettings: CompanyProductSettings | null
): boolean => {
  // Super admins and company admins can always create menus
  if (userRole === Role.SUPER_ADMIN || userRole === Role.COMPANY_ADMIN) {
    return true;
  }

  // Branch admins need to check company settings
  if (userRole === Role.BRANCH_ADMIN) {
    // If no settings found, default to allowing (fallback)
    if (!companySettings) {
      return true;
    }

    // Menus are a type of custom product, so check allowCustomProducts
    if (!companySettings.allowCustomProducts) {
      return false;
    }

    // Check strategy-specific constraints
    switch (companySettings.productStrategy) {
      case CompanyProductStrategy.CENTRALIZED:
        return false;

      case CompanyProductStrategy.PRICE_FLEXIBLE:
        return false;

      case CompanyProductStrategy.MIXED:
      case CompanyProductStrategy.DECENTRALIZED:
        return companySettings.allowCustomProducts;

      default:
        return companySettings.allowCustomProducts;
    }
  }

  return false;
};
