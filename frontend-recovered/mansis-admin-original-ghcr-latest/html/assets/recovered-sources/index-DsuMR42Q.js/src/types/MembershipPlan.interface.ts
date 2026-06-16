export interface MembershipPlan {
  id: number;
  name: string;
  durationDays: number;
  validityDays: number;
  price: number;
  status: MembershipPlanStatus;
  createdAt: string;
  updatedAt: string;
  branchId: number;
  branch?: {
    id: number;
    name: string;
    company: {
      id: number;
      name: string;
    };
  };
  _count: {
    memberships: number;
  };
}

export enum MembershipPlanStatus {
  ACTIVE = 'ACTIVE',
  PASSIVE = 'PASSIVE'
}
