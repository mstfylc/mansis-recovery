import React from 'react';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { Can } from '@/contexts/AbilityContext';
import BranchFilter from './BranchFilter';
import CompanyFilter from './CompanyFilter';
import { Action } from '@/types/permissions';

interface LocationFilterProps {
  companyId?: number;
  branchId?: number;
  onCompanyChange: (value: number | undefined) => void;
  onBranchChange: (value: number | undefined) => void;
  size?: 'small' | 'medium';
  hideBranchFilter?: boolean;
}

const LocationFilter: React.FC<LocationFilterProps> = ({
  companyId,
  branchId,
  onCompanyChange,
  onBranchChange,
  size = 'medium',
  hideBranchFilter = false
}) => {
  const { isSuperAdmin, isCompanyAdmin } = useUserViewMode();

  return (
    <>
      {isSuperAdmin && (
        <Can I={Action.Read} a="Company">
          <CompanyFilter
            value={companyId}
            onChange={onCompanyChange}
            size={size}
          />
        </Can>
      )}

      {(isSuperAdmin || isCompanyAdmin) && !hideBranchFilter && (
        <Can I={Action.Read} a="Branch">
          <BranchFilter
            value={branchId}
            onChange={onBranchChange}
            size={size}
            showCompanyName={isSuperAdmin}
          />
        </Can>
      )}
    </>
  );
};

export default LocationFilter;
