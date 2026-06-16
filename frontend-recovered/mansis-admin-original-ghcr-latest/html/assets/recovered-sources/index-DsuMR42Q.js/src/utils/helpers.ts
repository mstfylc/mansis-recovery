import { PurchaseTypeLabels } from '@/enums/purchase-type-labels';
import { OrderStatusLabels } from '@/enums/order-status-labels';
import { StockUnitLabels } from '@/enums/stock-unit-labels';
import { Role } from '@/enums/role';
import { StockUnit } from '@/types/stock';
import { addDays, isBefore } from 'date-fns';

interface IEnvironments {
  backendBaseUrl: string;
  sentryDsn: string;
}

export const environments: IEnvironments = {
  backendBaseUrl: import.meta.env.VITE_BACKEND_URL ?? '',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? ''
};

export const capitalizeFirstLetter = (val: string): string => {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};

export const preparePurchaseTypeLabel = (purchaseType: string): string => {
  return (
    PurchaseTypeLabels[purchaseType as keyof typeof PurchaseTypeLabels] ||
    purchaseType
  );
};

export const prepareOrderStatusLabel = (status: string): string => {
  return OrderStatusLabels[status as keyof typeof OrderStatusLabels] || status;
};

export const prepareSelectionTypeLabel = (selectionType: string): string => {
  const SelectionTypeLabels = {
    REQUIRED: 'menu.selection.type.REQUIRED',
    OPTIONAL: 'menu.selection.type.OPTIONAL',
    SELECTABLE: 'menu.selection.type.SELECTABLE'
  };
  return (
    SelectionTypeLabels[selectionType as keyof typeof SelectionTypeLabels] ||
    selectionType
  );
};

export const prepareStockUnitLabel = (stockUnit: string): string => {
  return StockUnitLabels[stockUnit as StockUnit] || stockUnit;
};

export const getSelectionTypeColor = (
  selectionType: string
): 'error' | 'warning' | 'info' | 'default' => {
  const SelectionTypeColors = {
    REQUIRED: 'error' as const,
    OPTIONAL: 'warning' as const,
    SELECTABLE: 'info' as const
  };
  return (
    SelectionTypeColors[selectionType as keyof typeof SelectionTypeColors] ||
    'default'
  );
};

/**
 * Creates a debounced function that delays invoking the provided function
 * until after 'wait' milliseconds have elapsed since the last time it was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the function
 */

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Returns available roles based on the current user's role
 *
 * @param currentUserRole The role of the current user
 * @returns An array of roles that the current user is allowed to see/assign
 */

export const getAvailableRoles = (currentUserRole: Role): Role[] => {
  const allRoles = Object.values(Role);

  if (currentUserRole === Role.SUPER_ADMIN) {
    // Super admin can see all roles
    return allRoles;
  } else if (currentUserRole === Role.COMPANY_ADMIN) {
    // Company admin can see all roles except SUPER_ADMIN and COMPANY_ADMIN
    return allRoles.filter(
      (r) => r !== Role.SUPER_ADMIN && r !== Role.COMPANY_ADMIN
    );
  } else if (currentUserRole === Role.BRANCH_ADMIN) {
    // Branch admin can only see CUSTOMER and EMPLOYEE roles
    return allRoles.filter((r) => r === Role.CUSTOMER || r === Role.EMPLOYEE);
  }

  // Default fallback (shouldn't reach here in normal cases)
  return allRoles;
};

/**
 * Downloads a file from the given URL
 * Creates a temporary anchor element, triggers download, and cleans up
 *
 * @param url The URL of the file to download
 * @param filename The name to save the file as
 * @param openInNewTab If true, opens URL in new tab as fallback (default: true)
 *
 * @example
 * // Simple usage
 * downloadFromUrl('https://example.com/file.pdf', 'report.pdf');
 *
 * @example
 * // Without new tab fallback
 * downloadFromUrl('https://example.com/file.xlsx', 'data.xlsx', false);
 */
export const downloadFromUrl = (
  url: string,
  filename: string,
  openInNewTab: boolean = true
): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  if (openInNewTab) {
    link.target = '_blank';
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getBatchExpiryColor = (expiryDate: Date | string): string => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const sevenDaysLater = addDays(now, 7);
  const thirtyDaysLater = addDays(now, 30);

  if (isBefore(expiry, sevenDaysLater)) {
    return 'error';
  } else if (isBefore(expiry, thirtyDaysLater)) {
    return 'warning.main';
  }
  return 'text.secondary';
};
