import { user$ } from '@/store/userStore';
import { Branch } from '@/types/Branch.interface';
import { Company } from '@/types/Company.interface';

/**
 * Type for the view mode returned by the hook
 */
export type ViewMode =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN_GLOBAL'
  | 'COMPANY_ADMIN_BRANCH'
  | 'BRANCH_ADMIN'
  | 'GUEST'
  | null;

/**
 * Return type for useUserViewMode hook
 */
export interface UserViewMode {
  /** Current user role */
  role: string;
  /** Currently selected branch (null in Admin View) */
  currentBranch: Branch | null;
  /** User's company */
  company: Company | null;
  /** Current view mode */
  viewMode: ViewMode;
  /** True if in Admin View (no branch selected) */
  isAdminView: boolean;
  /** True if user is Super Admin */
  isSuperAdmin: boolean;
  /** True if user is Company Admin */
  isCompanyAdmin: boolean;
  /** True if user is Branch Admin */
  isBranchAdmin: boolean;
}

/**
 * Custom hook to get user's current view mode and role information
 *
 * This hook provides a clean API to access user role and view mode information
 * without repeating the same logic in every component.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAdminView, isBranchAdmin } = useUserViewMode();
 *   const showLocationColumn = !isBranchAdmin && isAdminView;
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * function SidebarMenu() {
 *   const { viewMode, isCompanyAdmin } = useUserViewMode();
 *   const canManageBranches = isCompanyAdmin && viewMode === 'COMPANY_ADMIN_GLOBAL';
 *   // ...
 * }
 * ```
 *
 * @returns {UserViewMode} Object containing user role and view mode information
 */
export function useUserViewMode(): UserViewMode {
  return {
    role: user$.role.get(),
    currentBranch: user$.currentBranch.get(),
    company: user$.company.get(),
    viewMode: user$.viewMode.get(),
    isAdminView: user$.isAdminView.get(),
    isSuperAdmin: user$.isSuperAdmin.get(),
    isCompanyAdmin: user$.isCompanyAdmin.get(),
    isBranchAdmin: user$.isBranchAdmin.get()
  };
}
