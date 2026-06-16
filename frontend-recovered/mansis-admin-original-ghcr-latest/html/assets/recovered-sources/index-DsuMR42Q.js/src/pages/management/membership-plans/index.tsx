import { useState } from 'react';
import { Grid, Snackbar, Alert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { membershipPlanService } from '@/data/membershipPlanService';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/MembershipPlans/PageHeader';
import MembershipPlansTable from '@/content/Management/MembershipPlans/MembershipPlansTable';
import MembershipPlanDialog from '@/content/Management/MembershipPlans/MembershipPlanDialog';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { Filters } from '@/types/Filters';
import { MembershipPlan } from '@/types/MembershipPlan.interface';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const MembershipPlansManagement = () => {
  const { t } = useTranslation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<MembershipPlan[]>([]);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
    'create'
  );
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { currentBranch } = useUserViewMode();

  const fetchMembershipPlans = async (filters?: Filters) => {
    try {
      setLoading(true);

      const params = transformFiltersToApiParams(filters);
      const branchId = currentBranch?.id;
      const result = await membershipPlanService.getAll({
        ...params,
        ...(branchId && { branchId })
      });

      setMembershipPlans(result.items);
      setTotal(result.total);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to fetch membership plans'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (plans: MembershipPlan[]) => {
    try {
      await Promise.all(
        plans.map((plan) => membershipPlanService.delete(plan.id))
      );
      setSelectedPlans([]);
      setSuccessMessage(
        plans.length === 1
          ? t('membership.plan.deleted.successfully')
          : t('membership.plans.deleted.successfully', { count: plans.length })
      );
      fetchMembershipPlans();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete plans');
    }
  };

  const handleFilterChange = (filters: Filters) => {
    fetchMembershipPlans(filters);
  };

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleDeletePlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;

    try {
      await membershipPlanService.delete(selectedPlan.id);
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      setSuccessMessage(t('membership.plan.deleted.successfully'));
      fetchMembershipPlans();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to delete membership plan'
      );
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPlan(null);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setSelectedPlan(null);
    setSuccessMessage(
      dialogMode === 'create'
        ? t('membership.plan.created.successfully')
        : t('membership.plan.updated.successfully')
    );
    fetchMembershipPlans();
  };

  const handleSelectionChange = (newSelectedPlans: MembershipPlan[]) => {
    setSelectedPlans(newSelectedPlans);
  };

  return (
    <>
      <Helmet>
        <title>{t('membership.plans.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MembershipPlansTable
            membershipPlans={membershipPlans}
            loading={loading}
            totalCount={total}
            onAddPlan={handleAddPlan}
            onDeletePlan={handleDeletePlan}
            onBulkDelete={handleBulkDelete}
            selectedPlans={selectedPlans}
            onFilterChange={handleFilterChange}
            onRefreshData={fetchMembershipPlans}
            onShowSuccessMessage={setSuccessMessage}
            onSelectionChange={handleSelectionChange}
            pageKey="membership-plans"
          />
        </Grid>
      </Grid>

      <MembershipPlanDialog
        open={dialogOpen}
        mode={dialogMode}
        plan={selectedPlan}
        branchId={null}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t('common.confirm.delete')}
        message={`${t('membership.plan.delete.single.confirm')}${
          selectedPlan ? ` "${selectedPlan.name}"` : ''
        }`}
        confirmButtonText={t('Delete')}
        confirmButtonColor="error"
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MembershipPlansManagement;
