import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from './PageHeader';
import SubscriptionsTable from './SubscriptionsTable';
import { useState } from 'react';
import { licensingService } from '@/data/licensingService';
import {
  BranchSubscriptionDetailed,
  AssignPlanData,
  UpdateSubscriptionData
} from '@/types/Licensing.interface';
import { Filters } from '@/types/Filters';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { transformFiltersToApiParams } from '@/utils/apiUtils';

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState<
    BranchSubscriptionDetailed[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelSubscriptionId, setCancelSubscriptionId] = useState<
    number | null
  >(null);
  const { t } = useTranslation();

  const fetchSubscriptions = async (filters?: Filters) => {
    try {
      setLoading(true);
      const params = transformFiltersToApiParams(filters);
      const result = await licensingService.getSubscriptions(params);
      setSubscriptions(result?.items || []);
      setTotalCount(result?.total || 0);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async (data: AssignPlanData) => {
    try {
      setLoading(true);
      await licensingService.assignPlan(data);
      setSuccessMessage(t('licensing.subscription.assign.success'));
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error assigning plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
    fetchSubscriptions();
  };

  const handleChangePlan = async (data: UpdateSubscriptionData) => {
    try {
      setLoading(true);
      await licensingService.updateSubscription(data);
      setSuccessMessage(t('licensing.subscription.change.success'));
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
    fetchSubscriptions();
  };

  const handleCancelConfirm = async (subscriptionId: number) => {
    setCancelSubscriptionId(subscriptionId);
  };

  const handleCancelCancel = () => {
    setCancelSubscriptionId(null);
  };

  const handleCancelConfirmed = async () => {
    if (!cancelSubscriptionId) return;

    const subscription = subscriptions.find(
      (s) => s.id === cancelSubscriptionId
    );
    if (!subscription) return;

    try {
      setLoading(true);
      await licensingService.cancelSubscription({
        branchId: subscription.branchId
      });
      setSuccessMessage(t('licensing.subscription.cancel.success'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return;
    } finally {
      setLoading(false);
      setCancelSubscriptionId(null);
    }
    fetchSubscriptions();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchSubscriptions(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('licensing.subscription.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SubscriptionsTable
            subscriptions={subscriptions}
            loading={loading}
            totalCount={totalCount}
            onAssignPlan={handleAssignPlan}
            onChangePlan={handleChangePlan}
            onCancelSubscription={handleCancelConfirm}
            onFilterChange={handleFilterChange}
          />
        </Grid>
      </Grid>
      <ConfirmDialog
        open={Boolean(cancelSubscriptionId)}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirmed}
        title={t('licensing.subscription.cancel.confirm.title')}
        message={t('licensing.subscription.cancel.confirm.message', {
          branch:
            subscriptions.find((s) => s.id === cancelSubscriptionId)?.branch
              .name || ''
        })}
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

export default SubscriptionsManagement;
