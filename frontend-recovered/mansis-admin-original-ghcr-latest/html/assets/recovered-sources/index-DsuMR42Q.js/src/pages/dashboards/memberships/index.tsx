import { Grid, Typography, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState } from 'react';
import { membershipService } from '@/data/membershipService';
import { Membership } from '@/types/Membership.interface';
import { PurchaseType } from '@/enums/purchase-type';
import MembershipsTable from '@/content/Dashboards/Memberships/MembershipsTable';
import PageHeader from './PageHeader';
import { Filters } from '@/types/Filters';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const MembershipManagement = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteMembershipId, setDeleteMembershipId] = useState<number | null>(
    null
  );
  const { t } = useTranslation();
  const { currentBranch } = useUserViewMode();

  const fetchMemberships = async (params?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(params);
      const branchId = currentBranch?.id;
      const result = await membershipService.getAll({
        ...apiParams,
        ...(branchId && { branchId })
      });
      setMemberships(result.items);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteMemberships = async (
    selectedMemberships: Membership[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await membershipService.bulkDelete(
        selectedMemberships.map((membership) => membership.id)
      );
      setSuccessMessage(t('membership.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchMemberships();
  };

  const handleUpdateMembership = async (
    membershipId: number,
    updates: Partial<Membership>
  ) => {
    try {
      setLoading(true);
      await membershipService.update(membershipId, updates);
      setSuccessMessage(t('membership.update.success.message'));
      setShowSuccess(true);
      fetchMemberships(); // Refresh the list
    } catch (error) {
      console.error('Error updating membership:', error);
      throw error; // Re-throw so dialog can handle it
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewMembership = async (membership: {
    startDate: Date;
    endDate: Date;
    userId?: number;
    branchId?: number;
    membershipPlanId?: number;
    remainingDayCount?: number;
    purchaseType?: PurchaseType;
  }) => {
    try {
      setLoading(true);

      if (
        !membership.userId ||
        !membership.branchId ||
        !membership.membershipPlanId ||
        !membership.remainingDayCount ||
        !membership.purchaseType
      ) {
        throw new Error(t('membership.create.error.missing.fields'));
      }

      const membershipData = {
        userId: membership.userId,
        startDate: membership.startDate,
        endDate: membership.endDate,
        branchId: membership.branchId,
        membershipPlanId: membership.membershipPlanId,
        remainingDayCount: membership.remainingDayCount,
        purchaseType: membership.purchaseType
      };

      await membershipService.create(membershipData);
      setShowSuccess(true);
      setSuccessMessage(t('membership.create.success.message'));
      fetchMemberships(); // Refresh the list
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async (membershipId: number) => {
    setDeleteMembershipId(membershipId);
  };

  const handleDeleteCancel = () => {
    setDeleteMembershipId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteMembershipId) return;

    try {
      setLoading(true);
      await membershipService.delete(deleteMembershipId);
      setSuccessMessage(t('membership.delete.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error while deleting membership:', error);
      return;
    } finally {
      setLoading(false);
      setDeleteMembershipId(null);
    }
    fetchMemberships();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchMemberships(filters);
  };

  const handleExtendMembership = () => {
    setSuccessMessage(t('membership.extend.success'));
    setShowSuccess(true);
    fetchMemberships();
  };

  return (
    <>
      <Helmet>
        <title>{t('membership.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MembershipsTable
            memberships={memberships}
            loading={loading}
            totalCount={totalCount}
            onDeleteMembership={handleDeleteConfirm}
            onBulkDeleteMemberships={handleBulkDeleteMemberships}
            onUpdateMembership={handleUpdateMembership}
            onCreateMembership={handleSaveNewMembership}
            onExtendMembership={handleExtendMembership}
            onFilterChange={handleFilterChange}
            pageKey="memberships"
          />
        </Grid>
      </Grid>
      <ConfirmDialog
        open={Boolean(deleteMembershipId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.membership')}
        message={t('delete.membership.question')}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <MuiAlert
          variant="filled"
          severity="success"
          onClose={() => setShowSuccess(false)}
        >
          <Typography>{successMessage}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default MembershipManagement;
