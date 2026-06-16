import { Branch } from '@/types/Branch.interface';
import { observable } from '@legendapp/state';

interface BranchState {
  branches: Branch[];
  totalCount: number;
  selectedBranch: Branch | null;
}

export const branchState$ = observable<BranchState>({
  branches: [],
  totalCount: 0,
  selectedBranch: null
});

export const setBranches = (branches: Branch[], totalCount: number) => {
  branchState$.set({
    ...branchState$.get(),
    branches,
    totalCount
  });
};

export const setSelectedBranch = (branch: Branch | null) => {
  branchState$.selectedBranch.set(branch);
};

export const clear = () => {
  branchState$.set({
    branches: [],
    totalCount: 0,
    selectedBranch: null
  });
};
