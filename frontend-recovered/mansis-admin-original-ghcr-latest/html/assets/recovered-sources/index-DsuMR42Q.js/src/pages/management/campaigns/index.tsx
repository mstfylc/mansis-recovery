import { Typography, Grid, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { useState } from 'react';
import { Campaign } from '@/types/Campaign.interface';
import { Filters } from '@/types/Filters';
import { campaignService } from '@/data/campaignService';
import PageHeader from '@/content/Management/Campaigns/PageHeader';
import CampaignsTable from '@/content/Management/Campaigns/CampaignsTable';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { CampaignType } from '@/enums/campaign-type';
import { setCampaigns } from '@/store/campaignStore';
import { transformFiltersToApiParams } from '@/utils/apiUtils';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const CampaignManagement = () => {
  const [campaigns, setCampaignsState] = useState<Campaign[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteCampaignId, setDeleteCampaignId] = useState<number | null>(null);
  const { currentBranch } = useUserViewMode();

  const fetchCampaigns = async (filters?: Filters) => {
    try {
      setLoading(true);
      const apiParams = transformFiltersToApiParams(filters);
      const branchId = currentBranch?.id;
      const data = await campaignService.getAll({
        ...apiParams,
        ...(branchId && { branchId })
      });

      setCampaignsState(data.items);
      setTotalCount(data.total);

      setCampaigns(data.items, data.total);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const { t } = useTranslation();

  const handleSaveNewCampaign = async (campaign: {
    title: string;
    imageFile?: File | null;
    description: string;
    startDateTime: Date;
    endDateTime: Date;
    discount: number;
    type: CampaignType;
    branchId: number;
    bundlePrice?: number;
    bundleTotalCount?: number;
    categoryId?: number;
  }) => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (campaign.imageFile) {
        formData.append('image', campaign.imageFile);
      }

      formData.append('title', campaign.title);
      formData.append('startDateTime', campaign.startDateTime.toISOString());
      formData.append('description', campaign.description);
      formData.append('endDateTime', campaign.endDateTime.toISOString());
      formData.append('discount', campaign.discount.toString());
      formData.append('type', campaign.type);
      formData.append('branchId', campaign.branchId.toString());

      if (campaign.bundlePrice !== undefined) {
        formData.append('bundlePrice', campaign.bundlePrice.toString());
      }
      if (campaign.bundleTotalCount !== undefined) {
        formData.append(
          'bundleTotalCount',
          campaign.bundleTotalCount.toString()
        );
      }
      if (campaign.categoryId !== undefined) {
        formData.append('categoryId', campaign.categoryId.toString());
      }

      await campaignService.create(formData);
      setError(undefined);
      setShowSuccess(true);
      setSuccessMessage(t('campaign.create.success.message'));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setError(t('campaign.create.error.duplicate'));
      } else {
        setError(t('campaign.create.error.message'));
        console.error('Error creating campaign:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
    fetchCampaigns();
  };

  const handleDeleteConfirm = async (campaignId: number) => {
    setDeleteCampaignId(campaignId);
  };

  const handleDeleteCancel = () => {
    setDeleteCampaignId(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCampaignId) return;

    try {
      setLoading(true);
      await campaignService.delete(deleteCampaignId);
      setSuccessMessage(t('campaign.delete.success.message'));
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error while deleting campaign:', error);

      // Handle specific error messages from the backend
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes('remaining usage rights')) {
          setError(
            t(
              'campaign.delete.error.has.active.usages',
              'Campaign cannot be deleted because users have remaining usage rights'
            )
          );
        } else if (errorMessage.includes('login campaign')) {
          setError(
            t(
              'campaign.delete.error.used.as.login.campaign',
              'Campaign cannot be deleted because it is used as a login campaign'
            )
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t('campaign.delete.error.message'));
      }
      return;
    } finally {
      setLoading(false);
      setDeleteCampaignId(null);
    }
    fetchCampaigns();
  };

  const handleBulkDeleteCampaigns = async (
    selectedCampaigns: Campaign[],
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      await campaignService.bulkDelete(
        selectedCampaigns.map((campaign) => campaign.id)
      );
      setSuccessMessage(t('campaign.bulk.delete.success.message'));
      setShowSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error during bulk deletion:', error);

      // Handle specific error messages from the backend
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;

        if (errorMessage.includes('remaining usage rights')) {
          setError(
            t(
              'campaign.bulk.delete.error.has.active.usages',
              'One or more campaigns cannot be deleted because users have remaining usage rights'
            )
          );
        } else if (errorMessage.includes('login campaign')) {
          setError(
            t(
              'campaign.bulk.delete.error.used.as.login.campaign',
              'One or more campaigns cannot be deleted because they are used as login campaigns'
            )
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(t('campaign.bulk.delete.error.message'));
      }
      return;
    } finally {
      setLoading(false);
    }
    fetchCampaigns();
  };

  const handleBulkUpdateCampaignStatus = async (
    selectedCampaigns: Campaign[],
    status: string,
    onSuccess?: () => void
  ) => {
    try {
      setLoading(true);
      const result = await campaignService.bulkUpdateStatus(
        selectedCampaigns.map((campaign) => campaign.id),
        status
      );

      const updatedCount = result?.updatedCount;
      setSuccessMessage(
        t('campaign.bulk.status.update.success.message', {
          count: updatedCount || selectedCampaigns.length
        })
      );
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Error during bulk status update:', error);
      return;
    } finally {
      setLoading(false);
    }
    fetchCampaigns();
  };

  const handleUpdateCampaign = async (
    campaignId: number,
    updates: {
      startDateTime?: Date;
      endDateTime?: Date;
      imageFile?: File;
      title?: string;
      description?: string;
      status?: string;
      discount?: number;
      bundlePrice?: number;
      bundleTotalCount?: number;
    }
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (updates.title) formData.append('title', updates.title);
      if (updates.description)
        formData.append('description', updates.description);
      if (updates.status) formData.append('status', updates.status);
      if (updates.startDateTime)
        formData.append(
          'startDateTime',
          new Date(updates.startDateTime).toISOString()
        );
      if (updates.endDateTime)
        formData.append(
          'endDateTime',
          new Date(updates.endDateTime).toISOString()
        );
      if (updates.discount !== undefined)
        formData.append('discount', updates.discount.toString());
      if (updates.imageFile) formData.append('image', updates.imageFile);
      if (updates.bundlePrice)
        formData.append('bundlePrice', updates.bundlePrice.toString());
      if (updates.bundleTotalCount)
        formData.append(
          'bundleTotalCount',
          updates.bundleTotalCount.toString()
        );
      await campaignService.update(campaignId, formData);

      setSuccessMessage(t('campaign.update.success.message'));
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating campaign:', error);
      setError(t('campaign.update.error.message'));
      throw error;
    } finally {
      setLoading(false);
    }
    fetchCampaigns();
  };

  const handleFilterChange = (filters: Filters) => {
    fetchCampaigns(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('campaign.management')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CampaignsTable
            campaigns={campaigns}
            loading={loading}
            totalCount={totalCount}
            onDeleteCampaign={handleDeleteConfirm}
            onBulkDeleteCampaigns={handleBulkDeleteCampaigns}
            onBulkUpdateStatus={handleBulkUpdateCampaignStatus}
            onUpdateCampaign={handleUpdateCampaign}
            onFilterChange={handleFilterChange}
            onSaveCampaign={handleSaveNewCampaign}
            pageKey="campaigns"
          />
        </Grid>
      </Grid>
      <ConfirmDialog
        open={Boolean(deleteCampaignId)}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('delete.campaign')}
        message={t('delete.campaign.question')}
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
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(undefined)}
      >
        <MuiAlert
          variant="filled"
          severity="error"
          onClose={() => setError(undefined)}
        >
          <Typography>{error}</Typography>
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default CampaignManagement;
