import { Branch } from '@/types/Branch.interface';
import { User } from '@/types/User.interface';
import { Role } from '@/enums/role';
import { observable } from '@legendapp/state';

// Define extended user state interface with computed properties
interface UserState extends User {
  // Computed properties (functions that derive values from state)
  isAdminView: () => boolean;
  isSuperAdmin: () => boolean;
  isCompanyAdmin: () => boolean;
  isBranchAdmin: () => boolean;
  viewMode: () =>
    | 'SUPER_ADMIN'
    | 'COMPANY_ADMIN_GLOBAL'
    | 'COMPANY_ADMIN_BRANCH'
    | 'BRANCH_ADMIN'
    | 'GUEST'
    | null;
}

// Initialize user state with default values and computed properties
export const user$ = observable<UserState>({
  id: -1,
  name: '',
  surname: '',
  email: '',
  role: '',
  status: '',
  settings: {},
  company: null,
  userBranches: [],
  currentBranch: null,
  createdAt: new Date(),
  updatedAt: new Date(),

  // COMPUTED PROPERTIES
  // These are reactive and automatically update when dependencies change

  /**
   * Check if user is in Admin View (no branch selected)
   * Admin View = Company Admin viewing all branches globally
   */
  isAdminView: () => !user$.currentBranch.get(),

  /**
   * Check if user is Super Admin
   */
  isSuperAdmin: () => user$.role.get() === Role.SUPER_ADMIN,

  /**
   * Check if user is Company Admin
   */
  isCompanyAdmin: () => user$.role.get() === Role.COMPANY_ADMIN,

  /**
   * Check if user is Branch Admin
   */
  isBranchAdmin: () => user$.role.get() === Role.BRANCH_ADMIN,

  /**
   * Get current view mode based on role and branch selection
   * - SUPER_ADMIN: Can access everything
   * - COMPANY_ADMIN_GLOBAL: Company admin in admin view (no branch selected)
   * - COMPANY_ADMIN_BRANCH: Company admin in branch view (specific branch selected)
   * - BRANCH_ADMIN: Branch admin (always has a branch)
   * - GUEST: No valid role
   */
  viewMode: () => {
    const role = user$.role.get();
    const branch = user$.currentBranch.get();

    if (!role) return 'GUEST';

    if (role === Role.SUPER_ADMIN) return 'SUPER_ADMIN';
    if (role === Role.BRANCH_ADMIN) return 'BRANCH_ADMIN';

    if (role === Role.COMPANY_ADMIN) {
      return branch ? 'COMPANY_ADMIN_BRANCH' : 'COMPANY_ADMIN_GLOBAL';
    }

    return null;
  }
} as UserState);

export const setUser = async (userData: Partial<User>) => {
  // Check view mode preference
  const viewModePreference = localStorage.getItem('view_mode_preference');
  const storedBranchId = localStorage.getItem('selected_branch_id');

  user$.set((prevState) => {
    const newState = {
      ...prevState,
      ...userData
    };

    // For COMPANY_ADMIN and SUPER_ADMIN: if admin view is active OR no branch selected, keep currentBranch as null
    const isAdmin =
      userData.role === 'COMPANY_ADMIN' || userData.role === 'SUPER_ADMIN';
    if (isAdmin && (viewModePreference === 'admin' || !storedBranchId)) {
      newState.currentBranch = null;
      return newState;
    }

    // If we have a stored branch ID and userBranches, try to use it
    if (storedBranchId && userData.userBranches?.length) {
      const storedBranchIdNum = parseInt(storedBranchId);
      const matchingBranch = userData.userBranches.find(
        (ub) => ub.branch?.id === storedBranchIdNum
      );

      if (matchingBranch) {
        newState.currentBranch = matchingBranch.branch;
        return newState;
      }
    }

    // If userBranches is provided and no valid stored branch, find primary branch
    if (userData.userBranches?.length) {
      const primaryBranch = userData.userBranches.find((ub) => ub.isPrimary);
      if (primaryBranch && primaryBranch.branch) {
        newState.currentBranch = primaryBranch.branch;

        // Store this branch ID for future use
        if (primaryBranch.branch.id) {
          localStorage.setItem(
            'selected_branch_id',
            primaryBranch.branch.id.toString()
          );
        }
      }
    }

    return newState;
  });
};

export const setCurrentBranch = async (
  branchData: Partial<Branch> | undefined
) => {
  // If branchData is undefined or null, clear the current branch (admin view)
  if (!branchData) {
    localStorage.removeItem('selected_branch_id');
    user$.set({
      ...user$.get(),
      currentBranch: null
    });
    return;
  }

  if (!branchData.id) {
    console.error('Cannot set current branch: branch ID is missing');
    return;
  }

  // Store the branch ID in localStorage
  localStorage.setItem('selected_branch_id', branchData.id.toString());

  // Update the current branch in the store
  user$.set({
    ...user$.get(),
    currentBranch: branchData as Branch
  });
};

export const getPrimaryBranch = (): Branch | null => {
  const userBranches = user$.userBranches.get();
  if (!userBranches?.length) return null;

  const primaryBranch = userBranches.find((ub) => ub.isPrimary);
  if (primaryBranch && primaryBranch.branch) {
    return primaryBranch.branch;
  }

  return null;
};

export const clear = () => {
  // Clear the selected branch ID from localStorage
  localStorage.removeItem('selected_branch_id');

  user$.set({
    id: -1,
    name: '',
    surname: '',
    email: '',
    role: '',
    status: '',
    settings: {},
    company: null,
    userBranches: [],
    currentBranch: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
