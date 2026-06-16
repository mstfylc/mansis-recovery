import { useState } from 'react';
import { Grid } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { notificationService } from '@/data/notificationService';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { NotificationCampaign } from '@/types/Notification.interface';
import { Filters } from '@/types/Filters';
import PageHeader from './PageHeader';
import NotificationCampaignsTable from './NotificationCampaignsTable';

const NotificationCampaigns = () => {
  const { t } = useTranslation();
  const { currentBranch } = useUserViewMode();

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async (filters?: Filters) => {
    try {
      setLoading(true);
      const branchId = currentBranch?.id;
      const result = await notificationService.getCampaigns({
        ...(filters?.search && { search: filters.search }),
        ...(filters?.status && { status: filters.status }),
        page: filters?.page ?? 0,
        limit: filters?.limit ?? 10,
        ...(branchId && { branchId })
      });
      setCampaigns(result?.items ?? []);
      setTotalCount(result?.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: Filters) => {
    fetchCampaigns(filters);
  };

  return (
    <>
      <Helmet>
        <title>{t('notification.campaign.list')}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <NotificationCampaignsTable
            campaigns={campaigns}
            loading={loading}
            totalCount={totalCount}
            onFilterChange={handleFilterChange}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default NotificationCampaigns;
