import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { createContextualCan } from '@casl/react';
import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  PureAbility
} from '@casl/ability';
import { tokenDecoder } from '@/utils/jwt';
import { Action } from '@/types/permissions';

// Define subjects (must match backend subjects)
export type Subjects =
  | 'User'
  | 'Branch'
  | 'Company'
  | 'Product'
  | 'Campaign'
  | 'Activity'
  | 'Ticket'
  | 'Order'
  | 'CompanyCategory'
  | 'Membership'
  | 'MembershipPlan'
  | 'DailyPayment'
  | 'DailyLogin'
  | 'WithdrawalRequest'
  | 'BranchAccountingLedger'
  | 'BranchProductOverride'
  | 'Stock'
  | 'Batch'
  | 'Warehouse'
  | 'Recipe'
  | 'Finance'
  | 'POS'
  | 'BranchSelector'
  | 'Plan'
  | 'Subscription'
  | 'SmsPackage'
  | 'SmsPurchase'
  | 'Loyalty'
  | 'LoyaltySettings'
  | 'StampCard'
  | 'ChangelogRelease'
  | 'Notification'
  | 'FloorPlan'
  | 'Table'
  | 'all';

export type AppAbility = PureAbility<[Action, Subjects]>;

const ability = new Ability() as AppAbility;

const AbilityContext = createContext<AppAbility>(ability);

export const Can = createContextualCan(AbilityContext.Consumer);

interface AbilityProviderProps {
  children: ReactNode;
}

export const AbilityProvider: React.FC<AbilityProviderProps> = ({
  children
}) => {
  const [abilityInstance, setAbilityInstance] = useState<AppAbility>(ability);

  useEffect(() => {
    const updateAbility = () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          const { build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>
          );
          setAbilityInstance(build());
          return;
        }

        const { role, branchId, viewMode } = tokenDecoder(token);
        const { can, build } = new AbilityBuilder<AppAbility>(
          Ability as AbilityClass<AppAbility>
        );

        // Define abilities based on user role - matching the backend rules
        if (role === 'SUPER_ADMIN') {
          can(Action.Manage, 'all'); // Super admin can do everything
        } else if (role === 'COMPANY_ADMIN') {
          can(Action.Manage, 'Company');
          can(Action.Manage, 'CompanyCategory');
          can(Action.Manage, 'Product');
          can(Action.Manage, 'Branch');
          can(Action.Manage, 'User');
          can(Action.Manage, 'Recipe');
          can(Action.Manage, 'Batch');
          can(Action.Manage, 'LoyaltySettings');
          can(Action.Manage, 'StampCard');
          can(Action.Manage, 'Notification');

          const isAdminView = viewMode === 'admin' || !branchId;

          if (isAdminView) {
            // ADMIN VIEW: Read-only for branch-scoped entities (monitoring only)
            can(Action.Read, 'Activity');
            can(Action.Read, 'Campaign');
            can(Action.Read, 'Ticket');
            can(Action.Read, 'Order');
            can(Action.Read, 'Membership');
            can(Action.Read, 'MembershipPlan');
            can(Action.Read, 'Stock');
            can(Action.Read, 'Warehouse');
            can(Action.Read, 'Finance');
            can(Action.Read, 'DailyPayment');
            can(Action.Read, 'DailyLogin');
            can(Action.Read, 'WithdrawalRequest');
            can(Action.Read, 'BranchAccountingLedger');
            can(Action.Read, 'BranchProductOverride');
            can(Action.Read, 'SmsPackage');
            can(Action.Read, 'SmsPurchase');
            can(Action.Read, 'Loyalty');
            can(Action.Read, 'FloorPlan');
            can(Action.Read, 'Table');
          } else {
            // BRANCH VIEW: Full CRUD for branch-scoped entities
            can(Action.Manage, 'Activity');
            can(Action.Manage, 'Campaign');
            can(Action.Manage, 'Ticket');
            can(Action.Manage, 'Order');
            can(Action.Manage, 'Membership');
            can(Action.Manage, 'MembershipPlan');
            can(Action.Manage, 'Stock');
            can(Action.Manage, 'Warehouse');
            can(Action.Manage, 'Finance');
            can(Action.Manage, 'DailyPayment');
            can(Action.Manage, 'DailyLogin');
            can(Action.Manage, 'WithdrawalRequest');
            can(Action.Manage, 'BranchAccountingLedger');
            can(Action.Manage, 'BranchProductOverride');
            can(Action.Read, 'SmsPackage');
            can(Action.Read, 'SmsPurchase');
            can(Action.Manage, 'Loyalty');
            can(Action.Manage, 'FloorPlan');
            can(Action.Manage, 'Table');
          }

          can(Action.Read, 'Subscription');
        } else if (role === 'BRANCH_ADMIN') {
          can(Action.Read, 'User');
          can(Action.Manage, 'Product');
          can(Action.Manage, 'Campaign');
          can(Action.Manage, 'Activity');
          can(Action.Manage, 'Ticket');
          can(Action.Manage, 'CompanyCategory');
          can(Action.Manage, 'Membership');
          can(Action.Manage, 'MembershipPlan');
          can(Action.Manage, 'Stock');
          can(Action.Manage, 'Batch');
          can(Action.Manage, 'Warehouse');
          can(Action.Read, 'Recipe');
          can(Action.Manage, 'Order');
          can(Action.Read, 'DailyPayment');
          can(Action.Read, 'DailyLogin');
          can(Action.Delete, 'DailyLogin');
          can(Action.Create, 'WithdrawalRequest');
          can(Action.Read, 'WithdrawalRequest');
          can(Action.Read, 'BranchAccountingLedger');
          can(Action.Read, 'Finance');
          can(Action.Read, 'Subscription');
          can(Action.Update, 'Subscription');
          can(Action.Read, 'SmsPackage');
          can(Action.Read, 'SmsPurchase');
          can(Action.Manage, 'Loyalty');
          can(Action.Manage, 'BranchProductOverride');
          can(Action.Update, 'StampCard');
          can(Action.Manage, 'Notification');
          can(Action.Manage, 'FloorPlan');
          can(Action.Manage, 'Table');
        } else if (role === 'EMPLOYEE') {
          can(Action.Read, 'FloorPlan');
          can(Action.Read, 'Table');
        }

        setAbilityInstance(build());
      } catch (error) {
        console.error('Error updating ability:', error);
      }
    };

    updateAbility();

    window.addEventListener('storage', updateAbility);

    window.addEventListener('ability-update', updateAbility);

    return () => {
      window.removeEventListener('storage', updateAbility);
      window.removeEventListener('ability-update', updateAbility);
    };
  }, []);

  return (
    <AbilityContext.Provider value={abilityInstance}>
      {children}
    </AbilityContext.Provider>
  );
};

export default AbilityContext;
