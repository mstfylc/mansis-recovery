import { Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState } from 'react';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import { Activity } from '@/types/Activity.interface';
import { Filters } from '@/types/Filters';
import { activityService } from '@/data/activityService';
import PageHeader from '@/content/Management/Activities/PageHeader';
import ActivitiesTable from '@/content/Management/Activities/ActivitiesTable';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import ActivityDialog from '@/components/modals/ActivityDialog';
import { useTranslation } from 'react-i18next';
import { ActivityStatus } from '@/enums/activity-status';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const ActivityManagement = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewActivityDialog, setShowNewActivityDialog] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);
  const { currentBranch } = useUserViewMode();

  const fetchActivities = async (filters?: Filters) => {
    try {
      setLoading(true);
      const params = transformFiltersToApiParams(filters);
      const branchId = currentBranch?.id;
      const data = await activityService.getAll({
        ...params,
        ...(branchId && { branchId })
      });
      setActivities(data.items);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const { t } = useTranslation();

  const handleSaveNewActivity = async (activity: {
    title: string;
    imageFile?: File | null;
    description?: string;
    branchId: number;
  }) => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (activity.imageFile) {
        formData.append('image', activity.imageFile);
      }

      formData.append('title', activity.title);
      formData.append('branchId', activity.branchId.toString());

      if (activity.description) {
        formData.append('description', activity.description);
      }
      await activityService.create(formData);
      setError(undefined);
      setShowNewActivityDialog(false);
      setShowSuccess(true);
      setSuccessMessage(t('activity.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError(t('activity.create.error.duplicate'));
      } else {
        setError(t('activity.create.error.message'));
        console.error('Error creating activity:', error);
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchActivities();
  };

  const handleDeleteConfirm = async (activityId: number) => {
    setDeleteActivityId(activityId);
  };

  const handleDeleteCancel = () => {
    setDeleteActivityId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteActivityId) return;

    try {
      setLoading(true);
      await activityService.delete(deleteActivityId);
      setSuccessMessage(t('activity.delete.success.message'));
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error while deleting activity:', error);

      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes('unused tickets')) {
          setError(
            t(
              'activity.delete.error.has.unused.tickets',
              'Activity cannot be deleted because it has sessions with unused tickets'
            )
          );
        } else if (
          errorMessage.includes('child activity') &&
          errorMessage.includes('used in campaign')
        ) {
          // Parse the error message to extract child activity and campaign names
          const childActivityMatch = errorMessage.match(
            /child activity "([^"]+)"/
          );
          const campaignMatch = errorMessage.match(/campaign "([^"]+)"/);

          const childActivityName = childActivityMatch
            ? childActivityMatch[1]
            : '';
          const campaignName = campaignMatch ? campaignMatch[1] : '';

          if (childActivityName && campaignName) {
            setError(
              t('activity.delete.error.child.used.in.campaign', {
                childActivityName,
                campaignName
              })
            );
          } else {
            setError(errorMessage);
          }
        } else if (errorMessage.includes('used in campaign')) {
          setError(
            t(
              'activity.delete.error.used.in.campaign',
              'Activity cannot be deleted because it has sessions used in campaigns'
            )
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t('activity.delete.error.message'));
      }
      return;
    } finally {
      setLoading(false);
      setDeleteActivityId(null);
    }
    fetchActivities();
  };

  const handleBulkDeleteActivities = async (
    selectedActivities: Activity[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await activityService.bulkDelete(
        selectedActivities.map((activity) => activity.id)
      );
      setSuccessMessage(t('activity.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error during bulk deletion:', error);

      // Handle specific error messages from the backend
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes('unused tickets')) {
          setError(
            t(
              'activity.bulk.delete.error.has.unused.tickets',
              'One or more activities cannot be deleted because they have sessions with unused tickets'
            )
          );
        } else if (
          errorMessage.includes('child activity') &&
          errorMessage.includes('used in campaign')
        ) {
          // Parse the error message to extract child activity and campaign names
          const childActivityMatch = errorMessage.match(
            /child activity "([^"]+)"/
          );
          const campaignMatch = errorMessage.match(/campaign "([^"]+)"/);

          const childActivityName = childActivityMatch
            ? childActivityMatch[1]
            : '';
          const campaignName = campaignMatch ? campaignMatch[1] : '';

          if (childActivityName && campaignName) {
            setError(
              t('activity.bulk.delete.error.child.used.in.campaign', {
                childActivityName,
                campaignName
              })
            );
          } else {
            setError(errorMessage);
          }
        } else if (errorMessage.includes('used in campaign')) {
          setError(
            t(
              'activity.bulk.delete.error.used.in.campaign',
              'One or more activities cannot be deleted because they have sessions used in campaigns'
            )
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t('activity.bulk.delete.error.message'));
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchActivities();
  };

  const handleBulkUpdateActivityStatus = async (
    selectedActivities: Activity[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await activityService.bulkUpdateStatus(
        selectedActivities.map((activity) => activity.id),
        status
      );

      const updatedCount = result?.updatedCount || selectedActivities.length;
      setSuccessMessage(
        t('activity.bulk.status.update.success.message', {
          count: updatedCount,
          status: t(`status.${status.toLowerCase()}`)
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error during bulk status update:', error);
      setError(t('activity.bulk.status.update.error.message'));
    } finally {
      setLoading(false);
    }
    fetchActivities();
  };

  const handleUpdateActivity = async (
    activityId: number,
    updates: {
      title?: string;
      status?: ActivityStatus;
      description?: string;
      imageFile?: File | null;
      branchId?: number;
    }
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (updates.title) formData.append('title', updates.title);
      if (updates.status) formData.append('status', updates.status);
      if (updates.description)
        formData.append('description', updates.description);
      if (updates.imageFile) formData.append('image', updates.imageFile);
      if (updates.branchId)
        formData.append('branchId', updates.branchId.toString());

      await activityService.update(activityId, formData);

      setSuccessMessage(t('activity.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating activity:', error);
      setError(t('activity.update.error.message'));
      return;
    } finally {
      setLoading(false);
    }
    fetchActivities();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchActivities(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('activity.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ActivitiesTable
            activities={activities}
            loading={loading}
            totalCount={totalCount}
            setShowNewActivityDialog={setShowNewActivityDialog}
            onDeleteActivity={handleDeleteConfirm}
            onBulkDeleteActivities={handleBulkDeleteActivities}
            onBulkUpdateStatus={handleBulkUpdateActivityStatus}
            onUpdateActivity={handleUpdateActivity}
            onFilterChange={handleFilterChange}
            pageKey="activities"
          />
        </Grid>
      </Grid>
      <ActivityDialog
        open={showNewActivityDialog}
        onClose={() => {
          setShowNewActivityDialog(false);
          setError(undefined);
        }}
        onSave={handleSaveNewActivity}
        error={error}
      />
      <ConfirmDialog
        open={!!deleteActivityId}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.activity')}
        message={t('delete.activity.question')}
      />
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setShowSuccess(false)}
          severity="success"
        >
          {successMessage}
        </MuiAlert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={8000}
        onClose={() => setError(undefined)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setError(undefined)}
          severity="error"
        >
          {error}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default ActivityManagement;
